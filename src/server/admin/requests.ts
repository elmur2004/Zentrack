/**
 * Quote requests: durable public receipt, scoped listing/search, detail, assignment, workflow
 * status, dispositions (archive/spam/restore), clarifications and deliberate deletion.
 * Every function enforces the permission policy itself; callers never pre-filter for it.
 */
import { and, asc, desc, eq, exists, gte, ilike, inArray, isNull, lt, not, or, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { Db, DbOrTx, Tx } from '../db/client';
import {
  attachment,
  auditEvent,
  followUp,
  inAppNotification,
  message,
  messageAttachment,
  noteRevision,
  proposal,
  quoteRequest,
  requestClarification,
  requestNote,
  requestRead,
  requestService,
  statusEvent,
  teamMember,
  user,
  assignmentEvent,
} from '../db/schema';
import { CLARIFY_FIELDS, type ClarifyField, type Disposition, type RequestStatus } from '@/lib/admin/codes';
import type { ListQuery } from '@/lib/admin/query';
import { LIMITS, normalizeDigits } from '@/lib/forms/schema';
import { PRIVACY_POLICY } from '@/lib/legal';
import { deleteObject, storageDriver } from '../storage/private';
import { audit } from './audit';
import { DomainError } from './errors';
import { associateUploads, isDownloadable, type ScanState } from './files';
import { enqueueNewRequest, notifyAssigned } from './notifications';
import { assertCan, can, canTransition, requestScopeCondition, scopeOf, type Actor } from './policy';
import { getSettings } from './settings';
import { zonedDayKey, zonedDayRange } from './time';
import { ASSIGNEE_REQUIRED_FOR, evidenceRequired, isAllowedTransition, reasonRequired, TRANSITIONS } from './workflow';
import { escapeLike, isUniqueViolation, newId, newReference, sha256Hex } from './util';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isRequestId = (id: string) => UUID.test(id);

// ---------------------------------------------------------------------------
// Public receipt
// ---------------------------------------------------------------------------
export interface QuoteSubmission {
  locale: 'en' | 'ar';
  idempotencyKey: string;
  data: {
    name: string;
    company: string;
    email: string;
    phone?: string;
    country: string;
    services: string[];
    scope?: string;
    details: string;
    attachments: string[];
  };
  sourcePage: string | null;
  sourceService: string | null;
  uploadToken: string | null;
}

/** The approved policy version shown on /privacy (recorded with every submission). */
export function privacyPolicyVersion(): string {
  return PRIVACY_POLICY.version;
}

async function findByKey(db: DbOrTx, keyHash: string) {
  const [row] = await db
    .select({ reference: quoteRequest.reference, payloadHash: quoteRequest.payloadHash })
    .from(quoteRequest)
    .where(eq(quoteRequest.idempotencyKeyHash, keyHash))
    .limit(1);
  return row ?? null;
}

function replayOrConflict(row: { reference: string; payloadHash: string }, payloadHash: string) {
  if (row.payloadHash !== payloadHash) throw new DomainError('conflict', { reason: 'idempotency' });
  return { reference: row.reference, replay: true };
}

/**
 * Creates the request, its services, attachment associations, initial status event, audit
 * entry and notification work in ONE transaction. A retry with the same key and payload returns
 * the original reference without creating anything.
 */
export async function createFromPublicSubmission(db: Db, s: QuoteSubmission): Promise<{ reference: string; replay: boolean }> {
  const keyHash = sha256Hex(`quote:${s.idempotencyKey}`);
  const payloadHash = sha256Hex(JSON.stringify({ locale: s.locale, data: s.data }));
  const existing = await findByKey(db, keyHash);
  if (existing) return replayOrConflict(existing, payloadHash);
  try {
    return await db.transaction(async (tx) => {
      const id = newId();
      let reference = newReference();
      for (let i = 0; i < 5; i += 1) {
        const [hit] = await tx.select({ id: quoteRequest.id }).from(quoteRequest).where(eq(quoteRequest.reference, reference)).limit(1);
        if (!hit) break;
        reference = newReference();
      }
      const now = new Date();
      await tx.insert(quoteRequest).values({
        id,
        reference,
        createdAt: now,
        updatedAt: now,
        contactName: s.data.name,
        company: s.data.company,
        email: s.data.email,
        phone: s.data.phone ?? null,
        countryCode: s.data.country,
        engagementScope: s.data.scope || null,
        description: s.data.details,
        submissionLocale: s.locale,
        sourcePage: s.sourcePage,
        sourceService: s.sourceService,
        privacyAcknowledgedAt: now,
        privacyPolicyVersion: privacyPolicyVersion(),
        idempotencyKeyHash: keyHash,
        payloadHash,
        status: 'new',
        statusChangedAt: now,
      });
      await tx.insert(requestService).values([...new Set(s.data.services)].map((serviceId) => ({ requestId: id, serviceId })));
      await associateUploads(tx, s.data.attachments, s.uploadToken, id, LIMITS.attachments);
      await tx.insert(statusEvent).values({ id: newId(), requestId: id, fromStatus: null, toStatus: 'new', actorId: null, createdAt: now });
      await audit(tx, {
        actorId: null,
        action: 'request.received',
        category: 'request',
        requestId: id,
        metadata: { locale: s.locale, services: s.data.services.length, attachments: s.data.attachments.length },
      });
      await enqueueNewRequest(tx, id);
      return { reference, replay: false };
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      const again = await findByKey(db, keyHash);
      if (again) return replayOrConflict(again, payloadHash);
    }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------
const openFollowUpFor = (extra?: SQL) =>
  and(eq(followUp.requestId, quoteRequest.id), isNull(followUp.completedAt), isNull(followUp.cancelledAt), extra);

function buildWhere(db: DbOrTx, actor: Actor, q: ListQuery, tz: string, now: Date): SQL | undefined {
  const c: Array<SQL | undefined> = [requestScopeCondition(actor)];
  c.push(eq(quoteRequest.disposition, q.view === 'archived' ? 'archived' : q.view === 'spam' ? 'spam' : 'active'));
  const fu = (extra?: SQL) => db.select({ one: sql`1` }).from(followUp).where(openFollowUpFor(extra));
  if (q.view === 'queue') c.push(or(eq(quoteRequest.assigneeId, actor.userId), exists(fu(eq(followUp.assigneeId, actor.userId)))));
  if (q.status.length) c.push(inArray(quoteRequest.status, q.status));
  if (q.service.length)
    c.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(requestService)
          .where(and(eq(requestService.requestId, quoteRequest.id), inArray(requestService.serviceId, q.service))),
      ),
    );
  if (q.country.length) c.push(inArray(quoteRequest.countryCode, q.country));
  if (q.assignee === 'unassigned') c.push(isNull(quoteRequest.assigneeId));
  else if (q.assignee === 'me') c.push(eq(quoteRequest.assigneeId, actor.userId));
  else if (q.assignee) c.push(eq(quoteRequest.assigneeId, q.assignee));
  if (q.lang) c.push(eq(quoteRequest.submissionLocale, q.lang));
  if (q.from) c.push(gte(quoteRequest.createdAt, zonedDayRange(q.from, tz).start));
  if (q.to) c.push(lt(quoteRequest.createdAt, zonedDayRange(q.to, tz).end));
  if (q.followUp) {
    const todayEnd = zonedDayRange(zonedDayKey(now, tz), tz).end;
    if (q.followUp === 'overdue') c.push(exists(fu(lt(followUp.dueAt, now))));
    else if (q.followUp === 'today') c.push(exists(fu(and(gte(followUp.dueAt, now), lt(followUp.dueAt, todayEnd)))));
    else if (q.followUp === 'due') c.push(exists(fu(lt(followUp.dueAt, todayEnd))));
    else c.push(not(exists(fu())));
  }
  const term = normalizeDigits(q.q ?? '').trim().slice(0, 100);
  if (term) {
    const pat = `%${escapeLike(term)}%`;
    c.push(or(ilike(quoteRequest.reference, pat), ilike(quoteRequest.contactName, pat), ilike(quoteRequest.company, pat), ilike(quoteRequest.email, pat)));
  }
  return and(...c);
}

const nextFollowUpSql = sql<Date | null>`(select min(f.due_at) from follow_up f where f.request_id = ${quoteRequest.id} and f.completed_at is null and f.cancelled_at is null)`;

export async function listRequests(db: Db, actor: Actor, query: ListQuery, tz: string, now = new Date()) {
  const where = buildWhere(db, actor, query, tz, now);
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(quoteRequest).where(where);
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(Math.max(1, query.page), pageCount);
  const assignee = alias(user, 'assignee');
  const dir = query.dir === 'asc' ? asc : desc;
  const nf = nextFollowUpSql.mapWith(quoteRequest.createdAt);
  const order =
    query.sort === 'updated'
      ? [dir(quoteRequest.updatedAt), dir(quoteRequest.id)]
      : query.sort === 'follow_up'
        ? [sql`${nextFollowUpSql} ${query.dir === 'asc' ? sql`asc` : sql`desc`} nulls last`, desc(quoteRequest.createdAt), desc(quoteRequest.id)]
        : [dir(quoteRequest.createdAt), dir(quoteRequest.id)];
  const rows = await db
    .select({
      id: quoteRequest.id,
      reference: quoteRequest.reference,
      company: quoteRequest.company,
      contactName: quoteRequest.contactName,
      countryCode: quoteRequest.countryCode,
      createdAt: quoteRequest.createdAt,
      updatedAt: quoteRequest.updatedAt,
      status: quoteRequest.status,
      disposition: quoteRequest.disposition,
      submissionLocale: quoteRequest.submissionLocale,
      assigneeId: quoteRequest.assigneeId,
      assigneeName: assignee.name,
      services: sql<string[]>`coalesce((select array_agg(rs.service_id order by rs.service_id) from request_service rs where rs.request_id = ${quoteRequest.id}), '{}')`,
      attachments: sql<number>`(select count(*)::int from attachment a where a.request_id = ${quoteRequest.id} and a.kind = 'enquiry')`,
      nextFollowUp: nf,
      unread: sql<boolean>`not exists (select 1 from request_read r where r.request_id = ${quoteRequest.id} and r.user_id = ${actor.userId})`,
    })
    .from(quoteRequest)
    .leftJoin(assignee, eq(assignee.id, quoteRequest.assigneeId))
    .where(where)
    .orderBy(...order)
    .limit(query.pageSize)
    .offset((page - 1) * query.pageSize);
  return { rows, total, page, pageSize: query.pageSize, pageCount };
}

export type RequestListResult = Awaited<ReturnType<typeof listRequests>>;

/** IDs matching a query (bounded) — used for "select all matching" and filtered exports. */
export async function matchingRequestIds(db: Db, actor: Actor, query: ListQuery, tz: string, max: number) {
  const where = buildWhere(db, actor, query, tz, new Date());
  const rows = await db.select({ id: quoteRequest.id }).from(quoteRequest).where(where).orderBy(desc(quoteRequest.createdAt), desc(quoteRequest.id)).limit(max + 1);
  return { ids: rows.slice(0, max).map((r) => r.id), truncated: rows.length > max };
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------
async function loadForActor(db: DbOrTx, actor: Actor, id: string) {
  if (!isRequestId(id)) throw new DomainError('not_found');
  const [row] = await db.select().from(quoteRequest).where(eq(quoteRequest.id, id)).limit(1);
  if (!row || !can(actor, 'request.view', row)) throw new DomainError('not_found');
  return row;
}

async function lockForActor(tx: Tx, actor: Actor, id: string) {
  if (!isRequestId(id)) throw new DomainError('not_found');
  const [row] = await tx.select().from(quoteRequest).where(eq(quoteRequest.id, id)).for('update');
  if (!row || !can(actor, 'request.view', row)) throw new DomainError('not_found');
  return row;
}

/** Timeline actions shown inside a request (file downloads and exports stay in the audit log only). */
const TIMELINE_ACTIONS = [
  'request.received',
  'request.assigned',
  'request.archived',
  'request.restored',
  'request.marked_spam',
  'request.clarified',
  'note.added',
  'note.edited',
  'followup.added',
  'followup.completed',
  'followup.cancelled',
  'message.drafted',
  'message.sent',
  'message.failed',
  'message.offline_recorded',
  'proposal.added',
  'proposal.updated',
  'file.released',
];

export async function getRequestDetail(db: Db, actor: Actor, id: string) {
  const row = await loadForActor(db, actor, id);
  const author = alias(user, 'author');
  const [assigneeRow, services, clarifications, files, notes, followUps, messages, proposals, statusEvents, activity] = await Promise.all([
    row.assigneeId ? db.select({ id: user.id, name: user.name }).from(user).where(eq(user.id, row.assigneeId)).limit(1) : Promise.resolve([]),
    db.select({ id: requestService.serviceId }).from(requestService).where(eq(requestService.requestId, id)),
    db
      .select({ id: requestClarification.id, field: requestClarification.field, value: requestClarification.value, note: requestClarification.note, createdAt: requestClarification.createdAt, authorName: author.name })
      .from(requestClarification)
      .leftJoin(author, eq(author.id, requestClarification.createdBy))
      .where(eq(requestClarification.requestId, id))
      .orderBy(asc(requestClarification.createdAt)),
    db
      .select({
        id: attachment.id,
        kind: attachment.kind,
        originalName: attachment.originalName,
        sizeBytes: attachment.sizeBytes,
        mimeType: attachment.mimeType,
        scanState: attachment.scanState,
        createdAt: attachment.createdAt,
        releasedAt: attachment.releasedAt,
        uploadedByName: author.name,
        storageDeletedAt: attachment.storageDeletedAt,
      })
      .from(attachment)
      .leftJoin(author, eq(author.id, attachment.uploadedBy))
      .where(eq(attachment.requestId, id))
      .orderBy(asc(attachment.createdAt)),
    db
      .select({ id: requestNote.id, body: requestNote.body, createdAt: requestNote.createdAt, editedAt: requestNote.editedAt, revision: requestNote.revision, authorId: requestNote.authorId, authorName: author.name })
      .from(requestNote)
      .leftJoin(author, eq(author.id, requestNote.authorId))
      .where(eq(requestNote.requestId, id))
      .orderBy(asc(requestNote.createdAt)),
    db
      .select({
        id: followUp.id,
        action: followUp.action,
        dueAt: followUp.dueAt,
        assigneeId: followUp.assigneeId,
        assigneeName: author.name,
        completedAt: followUp.completedAt,
        cancelledAt: followUp.cancelledAt,
        createdAt: followUp.createdAt,
      })
      .from(followUp)
      .leftJoin(author, eq(author.id, followUp.assigneeId))
      .where(eq(followUp.requestId, id))
      .orderBy(asc(followUp.dueAt)),
    db
      .select({
        id: message.id,
        templateKey: message.templateKey,
        isProposal: message.isProposal,
        language: message.language,
        toEmail: message.toEmail,
        subject: message.subject,
        body: message.body,
        status: message.status,
        transport: message.transport,
        attempts: message.attempts,
        lastError: message.lastError,
        version: message.version,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        sentAt: message.sentAt,
        authorName: author.name,
        attachmentIds: sql<string[]>`coalesce((select array_agg(ma.attachment_id) from message_attachment ma where ma.message_id = ${message.id}), '{}')`,
      })
      .from(message)
      .leftJoin(author, eq(author.id, message.createdBy))
      .where(eq(message.requestId, id))
      .orderBy(desc(message.createdAt)),
    db
      .select({
        id: proposal.id,
        version: proposal.version,
        attachmentId: proposal.attachmentId,
        issueDate: proposal.issueDate,
        expiryDate: proposal.expiryDate,
        amount: proposal.amount,
        currency: proposal.currency,
        status: proposal.status,
        sentAt: proposal.sentAt,
        createdAt: proposal.createdAt,
      })
      .from(proposal)
      .where(eq(proposal.requestId, id))
      .orderBy(desc(proposal.version)),
    db
      .select({ id: statusEvent.id, fromStatus: statusEvent.fromStatus, toStatus: statusEvent.toStatus, reason: statusEvent.reason, evidenceMessageId: statusEvent.evidenceMessageId, createdAt: statusEvent.createdAt, actorName: author.name })
      .from(statusEvent)
      .leftJoin(author, eq(author.id, statusEvent.actorId))
      .where(eq(statusEvent.requestId, id))
      .orderBy(asc(statusEvent.createdAt)),
    db
      .select({ id: auditEvent.id, action: auditEvent.action, metadata: auditEvent.metadata, createdAt: auditEvent.createdAt, actorName: author.name })
      .from(auditEvent)
      .leftJoin(author, eq(author.id, auditEvent.actorId))
      .where(and(eq(auditEvent.requestId, id), inArray(auditEvent.action, TIMELINE_ACTIONS)))
      .orderBy(asc(auditEvent.createdAt))
      .limit(500),
  ]);

  // Opening a request marks it (and its notifications) read for this user only.
  await db.insert(requestRead).values({ userId: actor.userId, requestId: id }).onConflictDoUpdate({ target: [requestRead.userId, requestRead.requestId], set: { readAt: new Date() } });
  await db.update(inAppNotification).set({ readAt: new Date() }).where(and(eq(inAppNotification.userId, actor.userId), eq(inAppNotification.requestId, id), isNull(inAppNotification.readAt)));

  const ref = { assigneeId: row.assigneeId };
  const canStatus = can(actor, 'request.status', ref) && row.disposition === 'active';
  const permissions = {
    assign: can(actor, 'request.assign', ref),
    note: can(actor, 'request.note', ref),
    status: canStatus,
    clarify: can(actor, 'request.clarify', ref),
    followUp: can(actor, 'followup.manage', ref),
    draft: can(actor, 'message.draft', ref),
    send: can(actor, 'message.send', ref),
    proposal: can(actor, 'proposal.manage', ref),
    download: can(actor, 'file.download', ref),
    release: can(actor, 'file.release', ref),
    archive: can(actor, 'request.archive', ref),
    spam: can(actor, 'request.spam', ref),
    delete: can(actor, 'request.delete', ref) && row.disposition !== 'active',
  };
  const transitions = canStatus ? TRANSITIONS[row.status].filter((to) => canTransition(actor, row.status, to)) : [];

  return {
    request: {
      id: row.id,
      reference: row.reference,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
      contactName: row.contactName,
      company: row.company,
      email: row.email,
      phone: row.phone,
      countryCode: row.countryCode,
      engagementScope: row.engagementScope,
      description: row.description,
      submissionLocale: row.submissionLocale,
      sourcePage: row.sourcePage,
      sourceService: row.sourceService,
      privacyAcknowledgedAt: row.privacyAcknowledgedAt,
      privacyPolicyVersion: row.privacyPolicyVersion,
      status: row.status,
      statusChangedAt: row.statusChangedAt,
      outcomeReason: row.outcomeReason,
      assigneeId: row.assigneeId,
      assigneeName: assigneeRow[0]?.name ?? null,
      assignedAt: row.assignedAt,
      disposition: row.disposition,
      dispositionAt: row.dispositionAt,
      dispositionReason: row.dispositionReason,
    },
    services: services.map((s) => s.id),
    clarifications,
    files: files.map((f) => ({ ...f, downloadable: !f.storageDeletedAt && isDownloadable(f.scanState as ScanState) })),
    notes: notes.map((n) => ({ ...n, mine: n.authorId === actor.userId })),
    followUps,
    messages,
    proposals,
    statusEvents,
    activity,
    permissions,
    transitions,
  };
}

export type RequestDetail = Awaited<ReturnType<typeof getRequestDetail>>;

// ---------------------------------------------------------------------------
// Assignment
// ---------------------------------------------------------------------------
async function assertAssignable(db: DbOrTx, userId: string) {
  const [m] = await db.select({ status: teamMember.status }).from(teamMember).where(eq(teamMember.userId, userId)).limit(1);
  if (!m || m.status !== 'active') throw new DomainError('validation', { field: 'assignee' });
}

export async function assignRequest(db: Db, actor: Actor, id: string, assigneeId: string | null, expectedVersion: number) {
  return db.transaction(async (tx) => {
    const req = await lockForActor(tx, actor, id);
    assertCan(actor, 'request.assign', req);
    if (req.version !== expectedVersion) throw new DomainError('conflict', { version: req.version });
    if (assigneeId) await assertAssignable(tx, assigneeId);
    if (req.assigneeId === assigneeId) return { version: req.version, changed: false };
    const now = new Date();
    const [u] = await tx
      .update(quoteRequest)
      .set({ assigneeId, assignedAt: assigneeId ? now : null, version: sql`${quoteRequest.version} + 1`, updatedAt: now })
      .where(and(eq(quoteRequest.id, id), eq(quoteRequest.version, expectedVersion)))
      .returning({ version: quoteRequest.version });
    if (!u) throw new DomainError('conflict');
    const eventId = newId();
    await tx.insert(assignmentEvent).values({ id: eventId, requestId: id, fromUserId: req.assigneeId, toUserId: assigneeId, actorId: actor.userId, createdAt: now });
    await audit(tx, { actorId: actor.userId, action: 'request.assigned', category: 'request', requestId: id, metadata: { from: req.assigneeId, to: assigneeId } });
    await notifyAssigned(tx, id, assigneeId, actor.userId, eventId);
    return { version: u.version, changed: true };
  });
}

/** Bulk assignment of the actor's selected, permitted records (each one audited). */
export async function bulkAssign(db: Db, actor: Actor, ids: string[], assigneeId: string | null) {
  assertCan(actor, 'request.assign');
  if (ids.length > 200) throw new DomainError('validation', { field: 'selection' });
  return db.transaction(async (tx) => {
    if (assigneeId) await assertAssignable(tx, assigneeId);
    let updated = 0;
    let skipped = 0;
    for (const id of new Set(ids)) {
      if (!isRequestId(id)) {
        skipped += 1;
        continue;
      }
      const [req] = await tx.select().from(quoteRequest).where(eq(quoteRequest.id, id)).for('update');
      if (!req || !can(actor, 'request.assign', req) || req.assigneeId === assigneeId) {
        skipped += 1;
        continue;
      }
      const now = new Date();
      await tx
        .update(quoteRequest)
        .set({ assigneeId, assignedAt: assigneeId ? now : null, version: sql`${quoteRequest.version} + 1`, updatedAt: now })
        .where(eq(quoteRequest.id, id));
      const eventId = newId();
      await tx.insert(assignmentEvent).values({ id: eventId, requestId: id, fromUserId: req.assigneeId, toUserId: assigneeId, actorId: actor.userId, createdAt: now });
      await audit(tx, { actorId: actor.userId, action: 'request.assigned', category: 'request', requestId: id, metadata: { from: req.assigneeId, to: assigneeId, bulk: true } });
      await notifyAssigned(tx, id, assigneeId, actor.userId, eventId);
      updated += 1;
    }
    return { updated, skipped };
  });
}

// ---------------------------------------------------------------------------
// Workflow status
// ---------------------------------------------------------------------------
export async function changeStatus(
  db: Db,
  actor: Actor,
  id: string,
  input: { to: RequestStatus; reason?: string; evidenceMessageId?: string; expectedVersion: number },
) {
  const settings = await getSettings(db);
  return db.transaction(async (tx) => {
    const req = await lockForActor(tx, actor, id);
    assertCan(actor, 'request.status', req);
    if (req.disposition !== 'active') throw new DomainError('invalid_transition', { reason: 'not_active' });
    if (req.version !== input.expectedVersion) throw new DomainError('conflict', { version: req.version });
    const from = req.status;
    const to = input.to;
    if (!isAllowedTransition(from, to)) throw new DomainError('invalid_transition', { from, to });
    if (!canTransition(actor, from, to)) throw new DomainError('forbidden');
    const reason = (input.reason ?? '').trim();
    if (reason.length > 1000) throw new DomainError('validation', { field: 'reason' });
    if (reasonRequired(from, to) && !reason) throw new DomainError('reason_required');
    if (settings.requireAssigneeForQuote && ASSIGNEE_REQUIRED_FOR.includes(to) && !req.assigneeId) throw new DomainError('assignee_required');
    let evidence: string | null = null;
    if (evidenceRequired(to)) {
      const mid = input.evidenceMessageId ?? '';
      const [m] = mid
        ? await tx
            .select({ id: message.id })
            .from(message)
            .where(and(eq(message.id, mid), eq(message.requestId, id), eq(message.isProposal, true), inArray(message.status, ['sent', 'test_delivered', 'sent_offline'])))
            .limit(1)
        : [];
      if (!m) throw new DomainError('evidence_required');
      evidence = m.id;
    }
    const now = new Date();
    const closing = to === 'won' || to === 'lost';
    const [u] = await tx
      .update(quoteRequest)
      .set({
        status: to,
        statusChangedAt: now,
        outcomeReason: closing ? reason || null : null,
        version: sql`${quoteRequest.version} + 1`,
        updatedAt: now,
      })
      .where(and(eq(quoteRequest.id, id), eq(quoteRequest.version, input.expectedVersion)))
      .returning({ version: quoteRequest.version });
    if (!u) throw new DomainError('conflict');
    await tx.insert(statusEvent).values({ id: newId(), requestId: id, fromStatus: from, toStatus: to, actorId: actor.userId, reason: reason || null, evidenceMessageId: evidence, createdAt: now });
    await audit(tx, {
      actorId: actor.userId,
      action: 'request.status_changed',
      category: 'request',
      requestId: id,
      metadata: { from, to, reopened: from === 'won' || from === 'lost', withReason: !!reason },
    });
    return { version: u.version, status: to };
  });
}

// ---------------------------------------------------------------------------
// Dispositions (archive / spam / restore) — reversible, history preserved
// ---------------------------------------------------------------------------
export async function setDisposition(db: Db, actor: Actor, ids: string[], to: Disposition, reason?: string) {
  if (!ids.length || ids.length > 200) throw new DomainError('validation', { field: 'selection' });
  const note = (reason ?? '').trim().slice(0, 500) || null;
  return db.transaction(async (tx) => {
    let updated = 0;
    let skipped = 0;
    for (const id of new Set(ids)) {
      if (!isRequestId(id)) {
        skipped += 1;
        continue;
      }
      const [req] = await tx.select().from(quoteRequest).where(eq(quoteRequest.id, id)).for('update');
      if (!req || !can(actor, 'request.view', req) || req.disposition === to) {
        skipped += 1;
        continue;
      }
      const cap = to === 'archived' ? 'request.archive' : to === 'spam' ? 'request.spam' : req.disposition === 'spam' ? 'request.spam' : 'request.archive';
      if (!can(actor, cap, req)) {
        if (ids.length === 1) throw new DomainError('forbidden');
        skipped += 1;
        continue;
      }
      const now = new Date();
      await tx
        .update(quoteRequest)
        .set({
          disposition: to,
          dispositionAt: to === 'active' ? null : now,
          dispositionBy: to === 'active' ? null : actor.userId,
          dispositionReason: to === 'active' ? null : note,
          version: sql`${quoteRequest.version} + 1`,
          updatedAt: now,
        })
        .where(eq(quoteRequest.id, id));
      const action = to === 'archived' ? 'request.archived' : to === 'spam' ? 'request.marked_spam' : 'request.restored';
      await audit(tx, { actorId: actor.userId, action, category: 'request', requestId: id, metadata: { from: req.disposition, bulk: ids.length > 1 } });
      updated += 1;
    }
    return { updated, skipped };
  });
}

// ---------------------------------------------------------------------------
// Clarifications (original submission is never overwritten)
// ---------------------------------------------------------------------------
export async function addClarification(db: Db, actor: Actor, id: string, input: { field: string; value: string; note?: string }) {
  if (!(CLARIFY_FIELDS as readonly string[]).includes(input.field)) throw new DomainError('validation', { field: 'field' });
  const value = input.value.trim();
  if (!value || [...value].length > 2000) throw new DomainError('validation', { field: 'value' });
  const note = (input.note ?? '').trim().slice(0, 500) || null;
  return db.transaction(async (tx) => {
    const req = await lockForActor(tx, actor, id);
    assertCan(actor, 'request.clarify', req);
    const cid = newId();
    await tx.insert(requestClarification).values({ id: cid, requestId: id, field: input.field as ClarifyField, value, note, createdBy: actor.userId });
    await tx.update(quoteRequest).set({ updatedAt: new Date() }).where(eq(quoteRequest.id, id));
    await audit(tx, { actorId: actor.userId, action: 'request.clarified', category: 'request', requestId: id, entityId: cid, metadata: { field: input.field } });
    return { id: cid };
  });
}

// ---------------------------------------------------------------------------
// Permanent deletion — owner only and deliberate, or the documented retention job
// ---------------------------------------------------------------------------
export async function deleteRequestPermanently(db: Db, actor: Actor, id: string, confirmReference: string) {
  const req = await loadForActor(db, actor, id);
  assertCan(actor, 'request.delete', req);
  if (req.disposition === 'active') throw new DomainError('validation', { field: 'disposition' });
  if (confirmReference.trim().toUpperCase() !== req.reference) throw new DomainError('validation', { field: 'confirmation' });
  return removeRequest(db, { id, reference: req.reference }, actor.userId, 'owner');
}

/**
 * Deletes a request, its files (private storage) and every dependent row, and records the
 * deletion (reference and file count only). `reason` = 'owner' (deliberate) or 'retention'.
 */
export async function removeRequest(db: Db, req: { id: string; reference: string }, actorId: string | null, reason: 'owner' | 'retention') {
  const id = req.id;
  const files = await db.select({ id: attachment.id, storageKey: attachment.storageKey }).from(attachment).where(eq(attachment.requestId, id));
  const inDatabase = storageDriver() === 'database';
  let unverified = 0;
  await db.transaction(async (tx) => {
    if (inDatabase) {
      for (const f of files) if (!(await deleteObject(tx, f.storageKey))) throw new DomainError('unavailable');
    }
    // Explicit order keeps the NO ACTION references satisfied.
    const messageIds = (await tx.select({ id: message.id }).from(message).where(eq(message.requestId, id))).map((m) => m.id);
    if (messageIds.length) await tx.delete(messageAttachment).where(inArray(messageAttachment.messageId, messageIds));
    await tx.delete(proposal).where(eq(proposal.requestId, id));
    const noteIds = (await tx.select({ id: requestNote.id }).from(requestNote).where(eq(requestNote.requestId, id))).map((n) => n.id);
    if (noteIds.length) await tx.delete(noteRevision).where(inArray(noteRevision.noteId, noteIds));
    await tx.delete(quoteRequest).where(eq(quoteRequest.id, id));
    await audit(tx, {
      actorId,
      action: 'request.deleted',
      category: 'request',
      requestId: null,
      entityId: id,
      metadata: { reference: req.reference, files: files.length, storage: inDatabase ? 'deleted_in_transaction' : 'pending_verification', reason },
    });
  });
  if (!inDatabase) {
    for (const f of files) if (!(await deleteObject(db, f.storageKey))) unverified += 1;
    await audit(db, { actorId, action: 'request.storage_cleanup', category: 'request', entityId: id, metadata: { reference: req.reference, unverified } });
  }
  return { reference: req.reference, files: files.length, storageUnverified: unverified };
}

// ---------------------------------------------------------------------------
// Small helpers used by pages
// ---------------------------------------------------------------------------
export function viewScope(actor: Actor) {
  return scopeOf(actor, 'request.view');
}
