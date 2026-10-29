/**
 * Client communication (spec 04 §12).
 * - Drafts use the client's submission language; staff review recipient, subject, body and
 *   attachments. Nothing is sent automatically and nothing is AI-generated.
 * - Sending is a separate permitted action. The job is claimed ('sending') before the provider
 *   call and keeps a stable idempotency key/Message-ID, so a retry never creates a second draft.
 * - Only this request's released proposal PDFs can be attached; internal notes are never read here.
 * - Without a configured transport, staff copy the draft or record an offline send — the
 *   dashboard never claims "sent".
 */
import { and, eq, inArray, lt, sql } from 'drizzle-orm';
import type { Db, Tx } from '../db/client';
import { attachment, message, messageAttachment, proposal, quoteRequest, requestClarification } from '../db/schema';
import { TEMPLATE_KEYS, type TemplateKey } from '@/lib/admin/codes';
import { isEmail } from '@/lib/forms/schema';
import { emailTransport, sendEmail } from '../email/transport';
import { getObject } from '../storage/private';
import { audit } from './audit';
import { DomainError } from './errors';
import { isDownloadable, type ScanState } from './files';
import { assertCan, can, type Actor, type Capability } from './policy';
import { isRequestId } from './requests';
import { getSettings } from './settings';
import { renderTemplate } from './templates';
import { zonedTimeToUtc } from './time';
import { newId, sanitizeError } from './util';

const SUBJECT_MAX = 200;
const BODY_MAX = 8000;

async function lockRequest(tx: Tx, actor: Actor, requestId: string, cap: Capability) {
  if (!isRequestId(requestId)) throw new DomainError('not_found');
  const [req] = await tx.select().from(quoteRequest).where(eq(quoteRequest.id, requestId)).for('update');
  if (!req || !can(actor, 'request.view', req)) throw new DomainError('not_found');
  assertCan(actor, cap, req);
  return req;
}

/** The original email plus any staff-clarified email addresses for this request. */
async function allowedRecipients(tx: Tx, req: { id: string; email: string }) {
  const rows = await tx
    .select({ value: requestClarification.value })
    .from(requestClarification)
    .where(and(eq(requestClarification.requestId, req.id), eq(requestClarification.field, 'email')));
  return [req.email, ...rows.map((r) => r.value.trim()).filter(isEmail)];
}

async function validateAttachments(tx: Tx, requestId: string, ids: string[]) {
  const unique = [...new Set(ids)];
  if (!unique.length) return [];
  if (unique.length > 5) throw new DomainError('validation', { field: 'attachments' });
  const rows = await tx
    .select({ id: attachment.id, kind: attachment.kind, requestId: attachment.requestId, scanState: attachment.scanState, storageDeletedAt: attachment.storageDeletedAt })
    .from(attachment)
    .where(inArray(attachment.id, unique));
  for (const id of unique) {
    const r = rows.find((x) => x.id === id);
    // Cross-request or client-supplied enquiry files can never be attached to an outgoing message.
    if (!r || r.requestId !== requestId || r.kind !== 'proposal') throw new DomainError('validation', { field: 'attachments' });
    if (r.storageDeletedAt || !isDownloadable(r.scanState as ScanState)) throw new DomainError('file_unavailable');
  }
  return unique;
}

export async function createDraft(db: Db, actor: Actor, requestId: string, input: { templateKey?: string | null; attachmentIds?: string[] }) {
  const key = input.templateKey && (TEMPLATE_KEYS as readonly string[]).includes(input.templateKey) ? (input.templateKey as TemplateKey) : null;
  const settings = await getSettings(db);
  return db.transaction(async (tx) => {
    const req = await lockRequest(tx, actor, requestId, 'message.draft');
    const attachments = await validateAttachments(tx, requestId, input.attachmentIds ?? []);
    const lang = req.submissionLocale;
    const text = key
      ? renderTemplate(key, lang, { name: req.contactName, company: req.company, reference: req.reference }, settings.templates)
      : { subject: '', body: '' };
    const id = newId();
    await tx.insert(message).values({
      id,
      requestId,
      templateKey: key,
      isProposal: attachments.length > 0,
      language: lang,
      toEmail: req.email,
      subject: text.subject,
      body: text.body,
      status: 'draft',
      idempotencyKey: newId(),
      createdBy: actor.userId,
    });
    if (attachments.length) await tx.insert(messageAttachment).values(attachments.map((a) => ({ messageId: id, attachmentId: a })));
    await audit(tx, { actorId: actor.userId, action: 'message.drafted', category: 'communication', requestId, entityId: id, metadata: { template: key, language: lang } });
    return { id };
  });
}

async function lockMessage(tx: Tx, actor: Actor, messageId: string, cap: Capability) {
  const [m] = await tx.select().from(message).where(eq(message.id, messageId)).for('update');
  if (!m) throw new DomainError('not_found');
  const req = await lockRequest(tx, actor, m.requestId, cap);
  return { m, req };
}

export async function updateDraft(
  db: Db,
  actor: Actor,
  messageId: string,
  input: { toEmail: string; subject: string; body: string; attachmentIds: string[]; expectedVersion: number },
) {
  return db.transaction(async (tx) => {
    const { m, req } = await lockMessage(tx, actor, messageId, 'message.draft');
    if (m.status !== 'draft' && m.status !== 'failed') throw new DomainError('conflict', { status: m.status });
    if (m.version !== input.expectedVersion) throw new DomainError('conflict', { version: m.version });
    const subject = input.subject.replace(/[\r\n]+/g, ' ').trim();
    const body = input.body.replace(/\r\n?/g, '\n');
    if ([...subject].length > SUBJECT_MAX) throw new DomainError('validation', { field: 'subject' });
    if ([...body].length > BODY_MAX) throw new DomainError('validation', { field: 'body' });
    const recipients = await allowedRecipients(tx, req);
    if (!recipients.includes(input.toEmail.trim())) throw new DomainError('validation', { field: 'to' });
    const attachments = await validateAttachments(tx, req.id, input.attachmentIds);
    await tx.delete(messageAttachment).where(eq(messageAttachment.messageId, messageId));
    if (attachments.length) await tx.insert(messageAttachment).values(attachments.map((a) => ({ messageId, attachmentId: a })));
    const [u] = await tx
      .update(message)
      .set({ toEmail: input.toEmail.trim(), subject, body, isProposal: attachments.length > 0, version: sql`${message.version} + 1`, updatedAt: new Date() })
      .where(and(eq(message.id, messageId), eq(message.version, input.expectedVersion)))
      .returning({ version: message.version });
    if (!u) throw new DomainError('conflict');
    return { version: u.version };
  });
}

export async function sendMessage(db: Db, actor: Actor, messageId: string, expectedVersion: number) {
  const transport = emailTransport();
  if (transport === 'none') throw new DomainError('email_not_configured');

  // 1) Claim the message (commit before calling the provider).
  const claimed = await db.transaction(async (tx) => {
    const { m, req } = await lockMessage(tx, actor, messageId, 'message.send');
    if (m.status !== 'draft' && m.status !== 'failed') throw new DomainError('conflict', { status: m.status });
    if (m.version !== expectedVersion) throw new DomainError('conflict', { version: m.version });
    if (!m.subject.trim() || !m.body.trim()) throw new DomainError('validation', { field: m.subject.trim() ? 'body' : 'subject' });
    const recipients = await allowedRecipients(tx, req);
    if (!recipients.includes(m.toEmail)) throw new DomainError('validation', { field: 'to' });
    const links = await tx.select({ id: messageAttachment.attachmentId }).from(messageAttachment).where(eq(messageAttachment.messageId, messageId));
    const attachmentIds = await validateAttachments(tx, req.id, links.map((l) => l.id));
    const [u] = await tx
      .update(message)
      .set({ status: 'sending', attempts: sql`${message.attempts} + 1`, transport, sentBy: actor.userId, version: sql`${message.version} + 1`, updatedAt: new Date() })
      .where(and(eq(message.id, messageId), eq(message.version, expectedVersion)))
      .returning();
    if (!u) throw new DomainError('conflict');
    return { m: u, requestId: req.id, attachmentIds };
  });

  // 2) Provider call outside the transaction.
  const files = claimed.attachmentIds.length
    ? await db.select({ id: attachment.id, name: attachment.originalName, key: attachment.storageKey, mime: attachment.mimeType }).from(attachment).where(inArray(attachment.id, claimed.attachmentIds))
    : [];
  try {
    const payloads = [];
    for (const f of files) {
      const bytes = await getObject(db, f.key);
      if (!bytes) throw new Error('attachment bytes missing');
      payloads.push({ filename: f.name, content: bytes, contentType: f.mime });
    }
    const result = await sendEmail({ to: claimed.m.toEmail, subject: claimed.m.subject, text: claimed.m.body, idempotencyKey: claimed.m.idempotencyKey, attachments: payloads });
    const now = new Date();
    const [done] = await db
      .update(message)
      .set({ status: result.status, providerMessageId: result.providerMessageId, lastError: null, sentAt: now, version: sql`${message.version} + 1`, updatedAt: now })
      .where(eq(message.id, messageId))
      .returning({ version: message.version });
    if (claimed.m.isProposal && claimed.attachmentIds.length) {
      await db.update(proposal).set({ status: 'sent', sentAt: now }).where(and(eq(proposal.requestId, claimed.requestId), inArray(proposal.attachmentId, claimed.attachmentIds), eq(proposal.status, 'draft')));
    }
    await db.update(quoteRequest).set({ updatedAt: now }).where(eq(quoteRequest.id, claimed.requestId));
    await audit(db, { actorId: actor.userId, action: 'message.sent', category: 'communication', requestId: claimed.requestId, entityId: messageId, metadata: { transport, status: result.status, attachments: claimed.attachmentIds.length } });
    return { status: result.status, version: done.version };
  } catch (e) {
    const [failed] = await db
      .update(message)
      .set({ status: 'failed', lastError: sanitizeError(e), version: sql`${message.version} + 1`, updatedAt: new Date() })
      .where(eq(message.id, messageId))
      .returning({ version: message.version });
    await audit(db, { actorId: actor.userId, action: 'message.failed', category: 'communication', requestId: claimed.requestId, entityId: messageId, metadata: { transport } });
    return { status: 'failed' as const, version: failed.version };
  }
}

/** Records a send that happened outside the dashboard (clearly labelled; evidence for quote_sent). */
export async function recordOfflineSend(db: Db, actor: Actor, requestId: string, input: { sentOn: string; note: string; proposalId?: string | null }, tz: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.sentOn);
  if (!m) throw new DomainError('validation', { field: 'sentOn' });
  const sentAt = zonedTimeToUtc(+m[1], +m[2], +m[3], 12, 0, tz);
  if (Number.isNaN(sentAt.getTime()) || sentAt.getTime() > Date.now() + 24 * 3600 * 1000) throw new DomainError('validation', { field: 'sentOn' });
  const note = input.note.trim();
  if (!note || [...note].length > 1000) throw new DomainError('validation', { field: 'note' });
  return db.transaction(async (tx) => {
    const req = await lockRequest(tx, actor, requestId, 'message.send');
    let attachmentId: string | null = null;
    if (input.proposalId) {
      const [p] = await tx.select({ attachmentId: proposal.attachmentId }).from(proposal).where(and(eq(proposal.id, input.proposalId), eq(proposal.requestId, requestId))).limit(1);
      if (!p) throw new DomainError('validation', { field: 'proposal' });
      attachmentId = p.attachmentId;
    }
    const id = newId();
    await tx.insert(message).values({
      id,
      requestId,
      templateKey: null,
      isProposal: !!attachmentId,
      language: req.submissionLocale,
      toEmail: req.email,
      subject: 'Offline send record',
      body: note,
      status: 'sent_offline',
      transport: 'offline',
      idempotencyKey: newId(),
      createdBy: actor.userId,
      sentBy: actor.userId,
      sentAt,
    });
    if (attachmentId) {
      await tx.insert(messageAttachment).values({ messageId: id, attachmentId });
      await tx.update(proposal).set({ status: 'sent', sentAt }).where(and(eq(proposal.id, input.proposalId as string), eq(proposal.status, 'draft')));
    }
    await tx.update(quoteRequest).set({ updatedAt: new Date() }).where(eq(quoteRequest.id, requestId));
    await audit(tx, { actorId: actor.userId, action: 'message.offline_recorded', category: 'communication', requestId, entityId: id, metadata: { proposal: !!attachmentId } });
    return { id };
  });
}

/** A send interrupted mid-flight is never retried automatically; staff confirm before retrying. */
export async function markStuckSendingFailed(db: Db, actor: Actor, messageId: string) {
  return db.transaction(async (tx) => {
    const { m } = await lockMessage(tx, actor, messageId, 'message.send');
    if (m.status !== 'sending' || m.updatedAt.getTime() > Date.now() - 5 * 60 * 1000) throw new DomainError('conflict', { status: m.status });
    const [u] = await tx
      .update(message)
      .set({ status: 'failed', lastError: 'Delivery state unknown: check the mail provider before retrying.', version: sql`${message.version} + 1`, updatedAt: new Date() })
      .where(and(eq(message.id, messageId), eq(message.status, 'sending'), lt(message.updatedAt, new Date(Date.now() - 5 * 60 * 1000))))
      .returning({ version: message.version });
    if (!u) throw new DomainError('conflict');
    return { version: u.version };
  });
}
