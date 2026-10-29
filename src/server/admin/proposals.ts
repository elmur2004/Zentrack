/**
 * Proposal tracking (spec 04 §12): a prepared PDF with version, issue date and optional expiry,
 * amount and explicit currency. No pricing engine, tax, VAT or exchange-rate logic.
 * A sent version is immutable; changes mean uploading a new version.
 */
import { and, eq, sql } from 'drizzle-orm';
import type { Db } from '../db/client';
import { proposal, quoteRequest } from '../db/schema';
import { CURRENCIES } from '@/lib/admin/codes';
import { detectFileType, normalizeDigits } from '@/lib/forms/schema';
import { audit } from './audit';
import { DomainError } from './errors';
import { PROPOSAL_MAX_BYTES, storeProposalFile } from './files';
import { assertCan, can, type Actor } from './policy';
import { isRequestId } from './requests';
import { newId } from './util';

function validDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function parseMoney(amountRaw: string | undefined | null, currencyRaw: string | undefined | null) {
  const amount = normalizeDigits(amountRaw ?? '').replace(/[\s,٬]/g, '').replace('٫', '.').trim();
  const currency = (currencyRaw ?? '').trim().toUpperCase();
  if (!amount && !currency) return { amount: null, currency: null };
  if (!amount) throw new DomainError('validation', { field: 'amount' });
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(amount)) throw new DomainError('validation', { field: 'amount' });
  if (!(CURRENCIES as readonly string[]).includes(currency)) throw new DomainError('validation', { field: 'currency' });
  return { amount, currency };
}

function checkDates(issueDate: string, expiryDate?: string | null) {
  if (!validDate(issueDate)) throw new DomainError('validation', { field: 'issueDate' });
  if (expiryDate) {
    if (!validDate(expiryDate)) throw new DomainError('validation', { field: 'expiryDate' });
    if (expiryDate < issueDate) throw new DomainError('validation', { field: 'expiryDate' });
  }
}

export async function addProposal(
  db: Db,
  actor: Actor,
  requestId: string,
  input: { bytes: Buffer; fileName: string; issueDate: string; expiryDate?: string | null; amount?: string | null; currency?: string | null },
) {
  if (!isRequestId(requestId)) throw new DomainError('not_found');
  if (!input.bytes.length || input.bytes.length > PROPOSAL_MAX_BYTES) throw new DomainError('validation', { field: 'file', code: 'fileTooLarge' });
  if (detectFileType(new Uint8Array(input.bytes.subarray(0, 16))) !== 'application/pdf') throw new DomainError('validation', { field: 'file', code: 'fileSignature' });
  checkDates(input.issueDate, input.expiryDate);
  const money = parseMoney(input.amount, input.currency);
  return db.transaction(async (tx) => {
    const [req] = await tx.select({ id: quoteRequest.id, assigneeId: quoteRequest.assigneeId }).from(quoteRequest).where(eq(quoteRequest.id, requestId)).for('update');
    if (!req || !can(actor, 'request.view', req)) throw new DomainError('not_found');
    assertCan(actor, 'proposal.manage', req);
    const attachmentId = await storeProposalFile(tx, actor, requestId, input.bytes, input.fileName);
    const [{ next }] = await tx.select({ next: sql<number>`coalesce(max(${proposal.version}), 0)::int + 1` }).from(proposal).where(eq(proposal.requestId, requestId));
    const id = newId();
    await tx.insert(proposal).values({
      id,
      requestId,
      version: next,
      attachmentId,
      issueDate: input.issueDate,
      expiryDate: input.expiryDate || null,
      amount: money.amount,
      currency: money.currency,
      status: 'draft',
      createdBy: actor.userId,
    });
    await tx.update(quoteRequest).set({ updatedAt: new Date() }).where(eq(quoteRequest.id, requestId));
    await audit(tx, { actorId: actor.userId, action: 'proposal.added', category: 'communication', requestId, entityId: id, metadata: { version: next, withAmount: !!money.amount } });
    return { id, version: next, attachmentId };
  });
}

export async function updateProposalDraft(
  db: Db,
  actor: Actor,
  proposalId: string,
  input: { issueDate: string; expiryDate?: string | null; amount?: string | null; currency?: string | null },
) {
  checkDates(input.issueDate, input.expiryDate);
  const money = parseMoney(input.amount, input.currency);
  return db.transaction(async (tx) => {
    const [p] = await tx
      .select({ id: proposal.id, status: proposal.status, requestId: proposal.requestId, assigneeId: quoteRequest.assigneeId })
      .from(proposal)
      .innerJoin(quoteRequest, eq(quoteRequest.id, proposal.requestId))
      .where(eq(proposal.id, proposalId))
      .for('update');
    if (!p || !can(actor, 'request.view', p)) throw new DomainError('not_found');
    assertCan(actor, 'proposal.manage', p);
    if (p.status !== 'draft') throw new DomainError('conflict', { status: p.status });
    await tx
      .update(proposal)
      .set({ issueDate: input.issueDate, expiryDate: input.expiryDate || null, amount: money.amount, currency: money.currency })
      .where(and(eq(proposal.id, proposalId), eq(proposal.status, 'draft')));
    await audit(tx, { actorId: actor.userId, action: 'proposal.updated', category: 'communication', requestId: p.requestId, entityId: proposalId });
    return { ok: true };
  });
}
