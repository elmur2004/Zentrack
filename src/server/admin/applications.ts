/**
 * Partner enquiries and career applications from the public partner and careers forms
 * (owner decision 28 Oct 2026, OD-05: stored in the dashboard instead of an external webhook).
 *
 * Lighter than quote requests: no services, proposals or quote outcomes, no assignment. Owners
 * and managers handle them (application.view / application.manage); only owners delete. Every
 * function enforces the permission policy itself.
 */
import { randomBytes } from 'node:crypto';
import { and, asc, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  APPLICATION_KINDS,
  APPLICATION_STATUSES,
  APPLICATION_VIEWS,
  DISPOSITIONS,
  PAGE_SIZES,
  type ApplicationKind,
  type ApplicationStatus,
  type ApplicationView,
  type Disposition,
} from '@/lib/admin/codes';
import { LIMITS, normalizeDigits } from '@/lib/forms/schema';
import { PRIVACY_POLICY } from '@/lib/legal';
import type { Db, DbOrTx } from '../db/client';
import { application, applicationNote, attachment, auditEvent, inAppNotification, user } from '../db/schema';
import { deleteObject, storageDriver } from '../storage/private';
import { audit } from './audit';
import { DomainError } from './errors';
import { associateUploads, isDownloadable, type ScanState } from './files';
import { enqueueNewApplication } from './notifications';
import { can, assertCan, type Actor } from './policy';
import { escapeLike, isUniqueViolation, newId, sha256Hex } from './util';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isApplicationId = (id: string) => UUID.test(id);

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32 (no I, L, O, U)

/** PTR-2026-7K3QF9 (partner) / CAR-2026-7K3QF9 (career): non-sequential, does not leak volume. */
export function newApplicationReference(kind: ApplicationKind, now = new Date()): string {
  let s = '';
  for (const b of randomBytes(6)) s += ALPHABET[b % 32];
  return `${kind === 'career' ? 'CAR' : 'PTR'}-${now.getUTCFullYear()}-${s}`;
}

// ---------------------------------------------------------------------------
// Public receipt
// ---------------------------------------------------------------------------
export interface PartnerData {
  name: string;
  company: string;
  email: string;
  phone?: string;
  country: string;
  partnerType: string;
  details: string;
}

export interface CareerData {
  name: string;
  email: string;
  discipline: string;
  experience?: number;
  portfolio: string;
  cv?: string;
}

export type ApplicationSubmission =
  | { kind: 'partner'; locale: 'en' | 'ar'; idempotencyKey: string; data: PartnerData; sourcePage: string | null; uploadToken: string | null }
  | { kind: 'career'; locale: 'en' | 'ar'; idempotencyKey: string; data: CareerData; sourcePage: string | null; uploadToken: string | null };

async function findByKey(db: DbOrTx, keyHash: string) {
  const [row] = await db
    .select({ reference: application.reference, payloadHash: application.payloadHash })
    .from(application)
    .where(eq(application.idempotencyKeyHash, keyHash))
    .limit(1);
  return row ?? null;
}

function replayOrConflict(row: { reference: string; payloadHash: string }, payloadHash: string) {
  if (row.payloadHash !== payloadHash) throw new DomainError('conflict', { reason: 'idempotency' });
  return { reference: row.reference, replay: true };
}

/**
 * Creates the record, its CV association (career), audit entry and staff notifications in ONE
 * transaction. A retry with the same key and payload returns the original reference.
 */
export async function createApplicationFromPublicSubmission(db: Db, s: ApplicationSubmission): Promise<{ reference: string; replay: boolean }> {
  const keyHash = sha256Hex(`${s.kind}:${s.idempotencyKey}`);
  const payloadHash = sha256Hex(JSON.stringify({ locale: s.locale, data: s.data }));
  const existing = await findByKey(db, keyHash);
  if (existing) return replayOrConflict(existing, payloadHash);
  try {
    return await db.transaction(async (tx) => {
      const id = newId();
      let reference = newApplicationReference(s.kind);
      for (let i = 0; i < 5; i += 1) {
        const [hit] = await tx.select({ id: application.id }).from(application).where(eq(application.reference, reference)).limit(1);
        if (!hit) break;
        reference = newApplicationReference(s.kind);
      }
      const now = new Date();
      const common = {
        id,
        reference,
        kind: s.kind,
        createdAt: now,
        updatedAt: now,
        contactName: s.data.name,
        email: s.data.email,
        submissionLocale: s.locale,
        sourcePage: s.sourcePage,
        privacyAcknowledgedAt: now,
        privacyPolicyVersion: PRIVACY_POLICY.version,
        idempotencyKeyHash: keyHash,
        payloadHash,
        status: 'new' as const,
        statusChangedAt: now,
      };
      if (s.kind === 'partner') {
        await tx.insert(application).values({
          ...common,
          company: s.data.company,
          phone: s.data.phone ?? null,
          countryCode: s.data.country,
          partnerType: s.data.partnerType,
          description: s.data.details,
        });
      } else {
        await tx.insert(application).values({
          ...common,
          discipline: s.data.discipline,
          experienceYears: typeof s.data.experience === 'number' ? s.data.experience : null,
          portfolioUrl: s.data.portfolio || null,
        });
        if (s.data.cv) {
          await associateUploads(tx, [s.data.cv], s.uploadToken, { applicationId: id }, { maxFiles: 1, maxTotalBytes: LIMITS.cv.maxFileBytes }, 'cv');
        }
      }
      await audit(tx, {
        actorId: null,
        action: 'application.received',
        category: 'application',
        applicationId: id,
        metadata: { kind: s.kind, locale: s.locale, cv: s.kind === 'career' && !!s.data.cv },
      });
      await enqueueNewApplication(tx, id, s.kind);
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
// Listing (owners and managers)
// ---------------------------------------------------------------------------
export interface ApplicationQuery {
  view: ApplicationView;
  kind: '' | ApplicationKind;
  status: ApplicationStatus[];
  /** Free-text search: request body / memory only, never in a URL. */
  q: string;
  page: number;
  pageSize: number;
}

export function defaultApplicationQuery(): ApplicationQuery {
  return { view: 'active', kind: '', status: [], q: '', page: 1, pageSize: 25 };
}

const list = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : typeof v === 'string' && v ? v.split(',') : []);

/** Drops anything that is not a known code; never throws. */
export function normalizeApplicationQuery(input: Partial<Record<keyof ApplicationQuery, unknown>>): ApplicationQuery {
  const base = defaultApplicationQuery();
  const view = (APPLICATION_VIEWS as readonly string[]).includes(String(input.view)) ? (input.view as ApplicationView) : base.view;
  const kind = (APPLICATION_KINDS as readonly string[]).includes(String(input.kind)) ? (input.kind as ApplicationKind) : '';
  const status = [...new Set(list(input.status).filter((s): s is ApplicationStatus => (APPLICATION_STATUSES as readonly string[]).includes(s)))];
  const pageSize = (PAGE_SIZES as readonly number[]).includes(Number(input.pageSize)) ? Number(input.pageSize) : base.pageSize;
  const pageNum = Math.floor(Number(input.page));
  const page = Number.isFinite(pageNum) && pageNum >= 1 && pageNum <= 100000 ? pageNum : 1;
  const q = typeof input.q === 'string' ? input.q.slice(0, 100) : '';
  return { view, kind, status, q, page, pageSize };
}

/** URL state: stable codes only (no search text). Defaults are omitted. */
export function applicationQueryToSearchParams(q: ApplicationQuery): URLSearchParams {
  const p = new URLSearchParams();
  if (q.view !== 'active') p.set('view', q.view);
  if (q.kind) p.set('kind', q.kind);
  if (q.status.length) p.set('status', q.status.join(','));
  if (q.page !== 1) p.set('page', String(q.page));
  if (q.pageSize !== 25) p.set('pageSize', String(q.pageSize));
  return p;
}

function buildWhere(q: ApplicationQuery): SQL | undefined {
  const c: Array<SQL | undefined> = [eq(application.disposition, q.view)];
  if (q.kind) c.push(eq(application.kind, q.kind));
  if (q.status.length) c.push(inArray(application.status, q.status));
  const term = normalizeDigits(q.q ?? '').trim().slice(0, 100);
  if (term) {
    const pat = `%${escapeLike(term)}%`;
    c.push(or(ilike(application.reference, pat), ilike(application.contactName, pat), ilike(application.company, pat), ilike(application.email, pat)));
  }
  return and(...c);
}

export async function listApplications(db: Db, actor: Actor, query: ApplicationQuery) {
  assertCan(actor, 'application.view');
  const where = buildWhere(query);
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(application).where(where);
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(Math.max(1, query.page), pageCount);
  const rows = await db
    .select({
      id: application.id,
      reference: application.reference,
      kind: application.kind,
      contactName: application.contactName,
      company: application.company,
      countryCode: application.countryCode,
      partnerType: application.partnerType,
      discipline: application.discipline,
      createdAt: application.createdAt,
      status: application.status,
      submissionLocale: application.submissionLocale,
      files: sql<number>`(select count(*)::int from attachment a where a.application_id = ${application.id})`,
    })
    .from(application)
    .where(where)
    .orderBy(desc(application.createdAt), desc(application.id))
    .limit(query.pageSize)
    .offset((page - 1) * query.pageSize);
  return { rows, total, page, pageSize: query.pageSize, pageCount };
}

export type ApplicationListResult = Awaited<ReturnType<typeof listApplications>>;

/** New (unreviewed, active) partner enquiries and career applications, for the nav badge and overview. */
export async function newApplicationCounts(db: Db, actor: Actor): Promise<{ partner: number; career: number }> {
  if (!can(actor, 'application.view')) return { partner: 0, career: 0 };
  const rows = await db
    .select({ kind: application.kind, n: sql<number>`count(*)::int` })
    .from(application)
    .where(and(eq(application.status, 'new'), eq(application.disposition, 'active')))
    .groupBy(application.kind);
  return { partner: rows.find((r) => r.kind === 'partner')?.n ?? 0, career: rows.find((r) => r.kind === 'career')?.n ?? 0 };
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------
async function loadForActor(db: DbOrTx, actor: Actor, id: string) {
  if (!isApplicationId(id) || !can(actor, 'application.view')) throw new DomainError('not_found');
  const [row] = await db.select().from(application).where(eq(application.id, id)).limit(1);
  if (!row) throw new DomainError('not_found');
  return row;
}

const TIMELINE_ACTIONS = [
  'application.received',
  'application.status_changed',
  'application.note_added',
  'application.archived',
  'application.restored',
  'application.marked_spam',
  'file.released',
];

export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  new: ['in_review', 'contacted', 'closed'],
  in_review: ['contacted', 'closed'],
  contacted: ['in_review', 'closed'],
  closed: ['in_review'],
};

/** Reopening a closed record needs a reason; closing may carry one (optional). */
export function applicationReasonRequired(from: ApplicationStatus): boolean {
  return from === 'closed';
}

export async function getApplicationDetail(db: Db, actor: Actor, id: string) {
  const row = await loadForActor(db, actor, id);
  const author = alias(user, 'author');
  const [files, notes, activity] = await Promise.all([
    db
      .select({
        id: attachment.id,
        originalName: attachment.originalName,
        sizeBytes: attachment.sizeBytes,
        mimeType: attachment.mimeType,
        scanState: attachment.scanState,
        createdAt: attachment.createdAt,
        releasedAt: attachment.releasedAt,
        storageDeletedAt: attachment.storageDeletedAt,
      })
      .from(attachment)
      .where(eq(attachment.applicationId, id))
      .orderBy(asc(attachment.createdAt)),
    db
      .select({ id: applicationNote.id, body: applicationNote.body, createdAt: applicationNote.createdAt, authorId: applicationNote.authorId, authorName: author.name })
      .from(applicationNote)
      .leftJoin(author, eq(author.id, applicationNote.authorId))
      .where(eq(applicationNote.applicationId, id))
      .orderBy(asc(applicationNote.createdAt)),
    db
      .select({ id: auditEvent.id, action: auditEvent.action, metadata: auditEvent.metadata, createdAt: auditEvent.createdAt, actorName: author.name })
      .from(auditEvent)
      .leftJoin(author, eq(author.id, auditEvent.actorId))
      .where(and(eq(auditEvent.applicationId, id), inArray(auditEvent.action, TIMELINE_ACTIONS)))
      .orderBy(asc(auditEvent.createdAt))
      .limit(500),
  ]);

  // Opening a record marks the actor's own notifications for it as read.
  await db.update(inAppNotification).set({ readAt: new Date() }).where(and(eq(inAppNotification.userId, actor.userId), eq(inAppNotification.applicationId, id), isNull(inAppNotification.readAt)));

  const manage = can(actor, 'application.manage');
  return {
    application: {
      id: row.id,
      reference: row.reference,
      kind: row.kind,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
      contactName: row.contactName,
      company: row.company,
      email: row.email,
      phone: row.phone,
      countryCode: row.countryCode,
      partnerType: row.partnerType,
      discipline: row.discipline,
      experienceYears: row.experienceYears,
      portfolioUrl: row.portfolioUrl,
      description: row.description,
      submissionLocale: row.submissionLocale,
      sourcePage: row.sourcePage,
      privacyAcknowledgedAt: row.privacyAcknowledgedAt,
      privacyPolicyVersion: row.privacyPolicyVersion,
      status: row.status,
      statusChangedAt: row.statusChangedAt,
      outcomeReason: row.outcomeReason,
      disposition: row.disposition,
      dispositionAt: row.dispositionAt,
      dispositionReason: row.dispositionReason,
    },
    files: files.map((f) => ({ ...f, downloadable: !f.storageDeletedAt && isDownloadable(f.scanState as ScanState) })),
    notes,
    activity,
    permissions: {
      status: manage && row.disposition === 'active',
      note: manage,
      release: manage,
      archive: manage,
      spam: manage,
      delete: can(actor, 'application.delete') && row.disposition !== 'active',
    },
    transitions: manage && row.disposition === 'active' ? APPLICATION_TRANSITIONS[row.status] : [],
  };
}

export type ApplicationDetail = Awaited<ReturnType<typeof getApplicationDetail>>;

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------
export async function changeApplicationStatus(db: Db, actor: Actor, id: string, input: { to: ApplicationStatus; reason?: string; expectedVersion: number }) {
  assertCan(actor, 'application.manage');
  return db.transaction(async (tx) => {
    if (!isApplicationId(id)) throw new DomainError('not_found');
    const [row] = await tx.select().from(application).where(eq(application.id, id)).for('update');
    if (!row) throw new DomainError('not_found');
    if (row.disposition !== 'active') throw new DomainError('invalid_transition', { reason: 'not_active' });
    if (row.version !== input.expectedVersion) throw new DomainError('conflict', { version: row.version });
    const from = row.status;
    const to = input.to;
    if (!APPLICATION_TRANSITIONS[from]?.includes(to)) throw new DomainError('invalid_transition', { from, to });
    const reason = (input.reason ?? '').trim();
    if ([...reason].length > 1000) throw new DomainError('validation', { field: 'reason' });
    if (applicationReasonRequired(from) && !reason) throw new DomainError('reason_required');
    const now = new Date();
    const [u] = await tx
      .update(application)
      .set({ status: to, statusChangedAt: now, outcomeReason: to === 'closed' ? reason || null : null, version: sql`${application.version} + 1`, updatedAt: now })
      .where(and(eq(application.id, id), eq(application.version, input.expectedVersion)))
      .returning({ version: application.version });
    if (!u) throw new DomainError('conflict');
    await audit(tx, { actorId: actor.userId, action: 'application.status_changed', category: 'application', applicationId: id, metadata: { from, to, withReason: !!reason } });
    return { version: u.version, status: to };
  });
}

export async function addApplicationNote(db: Db, actor: Actor, id: string, body: string) {
  assertCan(actor, 'application.manage');
  const text = body.trim();
  if (!text || [...text].length > 5000) throw new DomainError('validation', { field: 'body' });
  return db.transaction(async (tx) => {
    if (!isApplicationId(id)) throw new DomainError('not_found');
    const [row] = await tx.select({ id: application.id }).from(application).where(eq(application.id, id)).for('update');
    if (!row) throw new DomainError('not_found');
    const noteId = newId();
    await tx.insert(applicationNote).values({ id: noteId, applicationId: id, authorId: actor.userId, body: text });
    await tx.update(application).set({ updatedAt: new Date() }).where(eq(application.id, id));
    // The note body is never copied into the audit log.
    await audit(tx, { actorId: actor.userId, action: 'application.note_added', category: 'application', applicationId: id, entityId: noteId });
    return { id: noteId };
  });
}

export async function setApplicationDisposition(db: Db, actor: Actor, ids: string[], to: Disposition, reason?: string) {
  assertCan(actor, 'application.manage');
  if (!(DISPOSITIONS as readonly string[]).includes(to)) throw new DomainError('validation', { field: 'disposition' });
  if (!ids.length || ids.length > 200) throw new DomainError('validation', { field: 'selection' });
  const note = (reason ?? '').trim().slice(0, 500) || null;
  return db.transaction(async (tx) => {
    let updated = 0;
    let skipped = 0;
    for (const id of new Set(ids)) {
      if (!isApplicationId(id)) {
        skipped += 1;
        continue;
      }
      const [row] = await tx.select().from(application).where(eq(application.id, id)).for('update');
      if (!row || row.disposition === to) {
        skipped += 1;
        continue;
      }
      const now = new Date();
      await tx
        .update(application)
        .set({
          disposition: to,
          dispositionAt: to === 'active' ? null : now,
          dispositionBy: to === 'active' ? null : actor.userId,
          dispositionReason: to === 'active' ? null : note,
          version: sql`${application.version} + 1`,
          updatedAt: now,
        })
        .where(eq(application.id, id));
      const action = to === 'archived' ? 'application.archived' : to === 'spam' ? 'application.marked_spam' : 'application.restored';
      await audit(tx, { actorId: actor.userId, action, category: 'application', applicationId: id, metadata: { from: row.disposition, bulk: ids.length > 1 } });
      updated += 1;
    }
    return { updated, skipped };
  });
}

// ---------------------------------------------------------------------------
// Permanent deletion — owner only and deliberate, or the documented retention job
// ---------------------------------------------------------------------------
export async function deleteApplicationPermanently(db: Db, actor: Actor, id: string, confirmReference: string) {
  const row = await loadForActor(db, actor, id);
  assertCan(actor, 'application.delete');
  if (row.disposition === 'active') throw new DomainError('validation', { field: 'disposition' });
  if (confirmReference.trim().toUpperCase() !== row.reference) throw new DomainError('validation', { field: 'confirmation' });
  return removeApplication(db, { id: row.id, reference: row.reference, kind: row.kind }, actor.userId, 'owner');
}

export async function removeApplication(db: Db, rec: { id: string; reference: string; kind: ApplicationKind }, actorId: string | null, reason: 'owner' | 'retention') {
  const files = await db.select({ id: attachment.id, storageKey: attachment.storageKey }).from(attachment).where(eq(attachment.applicationId, rec.id));
  const inDatabase = storageDriver() === 'database';
  let unverified = 0;
  await db.transaction(async (tx) => {
    if (inDatabase) {
      for (const f of files) if (!(await deleteObject(tx, f.storageKey))) throw new DomainError('unavailable');
    }
    // Notes, notifications, jobs and attachment rows cascade; audit rows keep only the reference.
    await tx.delete(application).where(eq(application.id, rec.id));
    await audit(tx, {
      actorId,
      action: 'application.deleted',
      category: 'application',
      applicationId: null,
      entityId: rec.id,
      metadata: { reference: rec.reference, kind: rec.kind, files: files.length, reason },
    });
  });
  if (!inDatabase) {
    for (const f of files) if (!(await deleteObject(db, f.storageKey))) unverified += 1;
    if (files.length) await audit(db, { actorId, action: 'application.storage_cleanup', category: 'application', entityId: rec.id, metadata: { reference: rec.reference, unverified } });
  }
  return { reference: rec.reference, files: files.length, storageUnverified: unverified };
}
