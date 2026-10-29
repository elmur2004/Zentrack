/**
 * Private attachments (spec 04 §7, §13).
 * - Public uploads are bound to an upload-session cookie; only the same browser session can
 *   attach them to its own submission, once, within UPLOAD_SESSION_TTL.
 * - Without a configured scanner, files are "unscanned" and stay unavailable until an owner or
 *   manager deliberately releases them. FILE_SCAN_MODE=test is a local test scanner only.
 * - Downloads use short-lived signed links bound to user + session; the download route re-checks
 *   the live session, membership, permission and file state on every request.
 */
import { randomBytes } from 'node:crypto';
import { and, eq, inArray, isNull, lt } from 'drizzle-orm';
import { RETENTION } from '@/lib/legal';
import type { Db, DbOrTx, Tx } from '../db/client';
import { application, attachment, quoteRequest } from '../db/schema';
import { deleteObject, getObject, newStorageKey, putObject } from '../storage/private';
import { audit } from './audit';
import { DomainError } from './errors';
import { assertCan, can, type Actor, type SessionActor } from './policy';
import { sha256Hex, signPayload, verifyPayload } from './util';

export type ScanState = 'unscanned' | 'pending_scan' | 'clean' | 'infected' | 'released';

export const UPLOAD_SESSION_COOKIE = 'znt_upload';
export const UPLOAD_SESSION_TTL_MS = RETENTION.uploadCookieHours * 60 * 60 * 1000;
export const FILE_LINK_TTL_MS = 60 * 1000;
export const PROPOSAL_MAX_BYTES = 20 * 1024 * 1024;

export function scannerMode(): 'none' | 'test' {
  return process.env.FILE_SCAN_MODE?.trim() === 'test' ? 'test' : 'none';
}

// Standard antivirus test string (harmless). The test scanner flags any file containing it.
const EICAR = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

function scan(bytes: Buffer): 'clean' | 'infected' | 'unscanned' {
  if (scannerMode() === 'none') return 'unscanned';
  return bytes.includes(Buffer.from(EICAR, 'latin1')) ? 'infected' : 'clean';
}

export function isDownloadable(state: ScanState): boolean {
  return state === 'clean' || state === 'released';
}

export function newUploadSessionToken(): string {
  return randomBytes(24).toString('base64url');
}

/**
 * Display-safe original filename: strips paths, control and bidi-override characters
 * (prevents "invoice‮fdp.exe"-style spoofing), keeps Unicode, bounds the length.
 */
export function safeDisplayName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'file';
  const cleaned = base.replace(/[\u0000-\u001f\u007f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '').trim();
  if (!cleaned) return 'file';
  if ([...cleaned].length <= 180) return cleaned;
  const m = /(\.[A-Za-z0-9]{1,8})$/.exec(cleaned);
  const ext = m ? m[1] : '';
  return [...cleaned].slice(0, 180 - ext.length).join('') + ext;
}

export type PublicUploadKind = 'enquiry' | 'cv';

/**
 * Stores a validated public upload (type, size and signature already checked by the route).
 * kind 'enquiry' = quote attachment, 'cv' = career application CV (PDF).
 */
export async function storePublicUpload(
  db: Db,
  input: { bytes: Buffer; originalName: string; mimeType: string; uploadToken: string; kind?: PublicUploadKind },
): Promise<{ id: string; size: number; scanState: ScanState }> {
  const kind = input.kind ?? 'enquiry';
  const state = scan(input.bytes);
  if (state === 'infected') throw new DomainError('validation', { field: kind === 'cv' ? 'cv' : 'attachments', code: 'fileRejected' });
  const id = `upl_${randomBytes(12).toString('hex')}`;
  const storageKey = newStorageKey();
  await db.transaction(async (tx) => {
    await putObject(tx, storageKey, input.bytes);
    await tx.insert(attachment).values({
      id,
      requestId: null,
      applicationId: null,
      kind,
      storageKey,
      originalName: safeDisplayName(input.originalName),
      sizeBytes: input.bytes.length,
      mimeType: input.mimeType,
      sha256: sha256Hex(input.bytes),
      scanState: state,
      uploadSessionHash: sha256Hex(input.uploadToken),
    });
  });
  return { id, size: input.bytes.length, scanState: state };
}

/**
 * Attaches uploads to a new request (or career application) inside its creation transaction.
 * Every ID must belong to the submitting browser's upload session, be of the expected kind,
 * unassociated, recent and within aggregate limits.
 */
export async function associateUploads(
  tx: Tx,
  ids: string[],
  uploadToken: string | null,
  target: string | { requestId: string } | { applicationId: string },
  limits: { maxFiles: number; maxTotalBytes: number },
  kind: PublicUploadKind = 'enquiry',
): Promise<void> {
  if (!ids.length) return;
  const owner = typeof target === 'string' ? { requestId: target } : target;
  const field = kind === 'cv' ? 'cv' : 'attachments';
  const reject = (code: string) => new DomainError('validation', { field, code });
  if (!uploadToken) throw reject('fileExpired');
  if (new Set(ids).size !== ids.length || ids.length > limits.maxFiles) throw reject('fileCount');
  const rows = await tx.select().from(attachment).where(inArray(attachment.id, ids)).for('update');
  const sessionHash = sha256Hex(uploadToken);
  const cutoff = Date.now() - UPLOAD_SESSION_TTL_MS;
  let total = 0;
  for (const id of ids) {
    const r = rows.find((x) => x.id === id);
    if (!r || r.kind !== kind || r.requestId !== null || r.applicationId !== null || r.storageDeletedAt || r.uploadSessionHash !== sessionHash)
      throw reject('fileExpired');
    if (r.createdAt.getTime() < cutoff) throw reject('fileExpired');
    if (r.scanState === 'infected') throw reject('fileRejected');
    total += r.sizeBytes;
  }
  if (total > limits.maxTotalBytes) throw reject('totalTooLarge');
  const updated = await tx
    .update(attachment)
    .set({ ...owner, associatedAt: new Date() })
    .where(and(inArray(attachment.id, ids), isNull(attachment.requestId), isNull(attachment.applicationId)))
    .returning({ id: attachment.id });
  if (updated.length !== ids.length) throw reject('fileExpired');
}

async function loadWithRequest(db: DbOrTx, attachmentId: string) {
  const [row] = await db
    .select({
      id: attachment.id,
      requestId: attachment.requestId,
      applicationId: attachment.applicationId,
      applicationExists: application.id,
      kind: attachment.kind,
      storageKey: attachment.storageKey,
      originalName: attachment.originalName,
      sizeBytes: attachment.sizeBytes,
      mimeType: attachment.mimeType,
      scanState: attachment.scanState,
      storageDeletedAt: attachment.storageDeletedAt,
      assigneeId: quoteRequest.assigneeId,
      requestExists: quoteRequest.id,
    })
    .from(attachment)
    .leftJoin(quoteRequest, eq(quoteRequest.id, attachment.requestId))
    .leftJoin(application, eq(application.id, attachment.applicationId))
    .where(eq(attachment.id, attachmentId))
    .limit(1);
  // Only files that belong to an existing request or application are reachable by staff.
  if (!row || (!row.requestExists && !row.applicationExists)) return null;
  return row;
}

/**
 * Request files follow the request policy (assignment scope); application files (CVs) follow the
 * application policy (owners and managers). Viewing is checked first, so a file of a record the
 * actor cannot see is reported as not found.
 */
function assertFileAccess(actor: Actor, row: { requestId: string | null; applicationId: string | null; assigneeId: string | null }, action: 'download' | 'release') {
  if (row.requestId) {
    assertCan(actor, action === 'download' ? 'file.download' : 'file.release', { assigneeId: row.assigneeId });
    return;
  }
  if (!can(actor, 'application.view')) throw new DomainError('not_found');
  if (action === 'release' && !can(actor, 'application.manage')) throw new DomainError('forbidden');
}

/** Owner/manager deliberately releases an unscanned file after reviewing its source. */
export async function releaseAttachment(db: Db, actor: Actor, attachmentId: string) {
  return db.transaction(async (tx) => {
    const row = await loadWithRequest(tx, attachmentId);
    if (!row) throw new DomainError('not_found');
    assertFileAccess(actor, row, 'release');
    if (row.scanState !== 'unscanned') throw new DomainError('file_unavailable', { state: row.scanState });
    await tx
      .update(attachment)
      .set({ scanState: 'released', releasedBy: actor.userId, releasedAt: new Date() })
      .where(and(eq(attachment.id, attachmentId), eq(attachment.scanState, 'unscanned')));
    await audit(tx, { actorId: actor.userId, action: 'file.released', category: 'file', requestId: row.requestId, applicationId: row.applicationId, entityId: attachmentId });
    return { scanState: 'released' as const };
  });
}

const INLINE_TYPES = new Set(['image/png', 'image/jpeg']);

/** Issues a 60-second link for one file, bound to the current user and session. */
export async function issueFileLink(db: Db, actor: SessionActor, attachmentId: string, mode: 'download' | 'preview') {
  const row = await loadWithRequest(db, attachmentId);
  if (!row) throw new DomainError('not_found');
  assertFileAccess(actor, row, 'download');
  if (row.storageDeletedAt || !isDownloadable(row.scanState as ScanState))
    throw new DomainError('file_unavailable', { state: row.scanState });
  const inline = mode === 'preview' && INLINE_TYPES.has(row.mimeType);
  const exp = Date.now() + FILE_LINK_TTL_MS;
  const token = signPayload('file', { a: attachmentId, u: actor.userId, s: actor.sessionId, e: exp, d: inline ? 'i' : 'a' });
  await audit(db, { actorId: actor.userId, action: 'file.link_issued', category: 'file', requestId: row.requestId, applicationId: row.applicationId, entityId: attachmentId, metadata: { mode: inline ? 'preview' : 'download' } });
  return { url: `/api/admin/files/${encodeURIComponent(attachmentId)}?token=${encodeURIComponent(token)}`, expiresAt: new Date(exp).toISOString() };
}

/** Validates a link against the live session and returns the bytes (never the storage key). */
export async function resolveFileLink(db: Db, actor: SessionActor | null, attachmentId: string, token: string) {
  const p = verifyPayload<{ a: string; u: string; s: string; e: number; d: string }>('file', token);
  if (!p || p.a !== attachmentId) throw new DomainError('not_found');
  if (p.e < Date.now()) throw new DomainError('link_expired');
  if (!actor) throw new DomainError('unauthenticated');
  if (p.u !== actor.userId || p.s !== actor.sessionId) throw new DomainError('not_found');
  const row = await loadWithRequest(db, attachmentId);
  if (!row) throw new DomainError('not_found');
  assertFileAccess(actor, row, 'download');
  if (row.storageDeletedAt || !isDownloadable(row.scanState as ScanState)) throw new DomainError('file_unavailable');
  const bytes = await getObject(db, row.storageKey);
  if (!bytes) throw new DomainError('file_unavailable');
  await audit(db, { actorId: actor.userId, action: 'file.downloaded', category: 'file', requestId: row.requestId, applicationId: row.applicationId, entityId: attachmentId });
  return { bytes, name: row.originalName, mimeType: row.mimeType, inline: p.d === 'i' && INLINE_TYPES.has(row.mimeType) };
}

/** Staff-uploaded proposal PDF (internal document; scanned when a scanner is configured). */
export async function storeProposalFile(tx: Tx, actor: Actor, requestId: string, bytes: Buffer, originalName: string) {
  const state = scan(bytes);
  if (state === 'infected') throw new DomainError('validation', { field: 'file', code: 'fileRejected' });
  const id = `att_${randomBytes(12).toString('hex')}`;
  const storageKey = newStorageKey();
  const now = new Date();
  await putObject(tx, storageKey, bytes);
  await tx.insert(attachment).values({
    id,
    requestId,
    kind: 'proposal',
    storageKey,
    originalName: safeDisplayName(originalName),
    sizeBytes: bytes.length,
    mimeType: 'application/pdf',
    sha256: sha256Hex(bytes),
    // Internal documents are released by their uploader when no scanner is configured.
    scanState: state === 'unscanned' ? 'released' : state,
    uploadedBy: actor.userId,
    associatedAt: now,
    releasedBy: state === 'unscanned' ? actor.userId : null,
    releasedAt: state === 'unscanned' ? now : null,
  });
  return id;
}

/**
 * Removes uploads that were never attached to a submitted request or application (abandoned
 * forms). Only unassociated rows are touched; submitted records and their files are never purged here.
 */
export async function cleanupAbandonedUploads(db: Db, olderThanMs = 24 * 60 * 60 * 1000) {
  const cutoff = new Date(Date.now() - olderThanMs);
  const unassociated = and(isNull(attachment.requestId), isNull(attachment.applicationId));
  const rows = await db
    .select({ id: attachment.id, storageKey: attachment.storageKey })
    .from(attachment)
    .where(and(unassociated, inArray(attachment.kind, ['enquiry', 'cv']), lt(attachment.createdAt, cutoff)))
    .limit(500);
  let removed = 0;
  let failed = 0;
  for (const r of rows) {
    const ok = await deleteObject(db, r.storageKey);
    if (ok) {
      await db.delete(attachment).where(and(eq(attachment.id, r.id), unassociated));
      removed += 1;
    } else {
      failed += 1;
    }
  }
  return { removed, failed };
}

/** RFC 6266 Content-Disposition with an ASCII fallback and the UTF-8 original name. */
export function contentDisposition(name: string, inline: boolean): string {
  const fallback = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_') || 'file';
  return `${inline ? 'inline' : 'attachment'}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}
