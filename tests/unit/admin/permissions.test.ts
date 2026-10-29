import './env';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { session } from '@/server/db/schema';
import { listAudit } from '@/server/admin/audit';
import { buildExport } from '@/server/admin/exports';
import { issueFileLink, releaseAttachment, resolveFileLink } from '@/server/admin/files';
import { addNote } from '@/server/admin/notes';
import { POLICY, can } from '@/server/admin/policy';
import { assignRequest, changeStatus, deleteRequestPermanently, getRequestDetail, listRequests, setDisposition } from '@/server/admin/requests';
import { changeRole, setMemberAccess } from '@/server/admin/team';
import { defaultQuery } from '@/lib/admin/query';
import { db, member, submit, upload, version } from './fixtures';

type M = Awaited<ReturnType<typeof member>>;
const TZ = 'Africa/Cairo';

describe('server-side permission policy', () => {
  let owner: M, manager: M, reviewer: M, reviewer2: M, readOnly: M;
  let assigned: { id: string; reference: string };
  let other: { id: string; reference: string };
  let fileId = '';

  beforeAll(async () => {
    owner = await member('owner');
    manager = await member('manager');
    reviewer = await member('reviewer');
    reviewer2 = await member('reviewer');
    readOnly = await member('read_only');
    const f = await upload('drawing.pdf');
    assigned = await submit({ company: 'Assigned Co', attachments: [f.id] }, { uploadToken: f.token });
    fileId = f.id;
    other = await submit({ company: 'Unassigned Co' });
    await assignRequest(await db(), manager, assigned.id, reviewer.userId, await version(assigned.id));
  }, 90_000);

  it('matches the documented role matrix', () => {
    expect(POLICY.owner['request.delete']).toBe('all');
    expect(POLICY.manager['request.delete']).toBe('none');
    expect(POLICY.manager['team.manage']).toBe('none');
    expect(POLICY.manager['audit.view']).toBe('operational');
    expect(POLICY.reviewer['message.send']).toBe('none');
    expect(POLICY.reviewer['request.view']).toBe('assigned');
    expect(POLICY.read_only['request.note']).toBe('none');
    expect(can(reviewer, 'request.view', { assigneeId: reviewer.userId })).toBe(true);
    expect(can(reviewer, 'request.view', { assigneeId: null })).toBe(false);
  });

  it('scopes listings and counts to what each person may see', async () => {
    const d = await db();
    const q = { ...defaultQuery('inbox'), pageSize: 50 };
    expect((await listRequests(d, owner, q, TZ)).total).toBe(2);
    expect((await listRequests(d, manager, q, TZ)).total).toBe(2);
    const forReviewer = await listRequests(d, reviewer, q, TZ);
    expect(forReviewer.rows.map((r) => r.id)).toEqual([assigned.id]);
    expect((await listRequests(d, reviewer2, q, TZ)).total).toBe(0);
    expect((await listRequests(d, readOnly, q, TZ)).total).toBe(0);
    // Filtering by another person cannot reveal records outside the viewer's scope.
    expect((await listRequests(d, reviewer2, { ...q, assignee: reviewer.userId }, TZ)).total).toBe(0);
  });

  it('answers guessed, changed and malformed IDs with not_found (no existence oracle)', async () => {
    const d = await db();
    await expect(getRequestDetail(d, reviewer2, assigned.id)).rejects.toMatchObject({ code: 'not_found' });
    await expect(getRequestDetail(d, reviewer, other.id)).rejects.toMatchObject({ code: 'not_found' });
    await expect(getRequestDetail(d, owner, randomUUID())).rejects.toMatchObject({ code: 'not_found' });
    await expect(getRequestDetail(d, owner, "1' or '1'='1")).rejects.toMatchObject({ code: 'not_found' });
    await expect(addNote(d, reviewer2, assigned.id, 'probe')).rejects.toMatchObject({ code: 'not_found' });
  });

  it('denies actions outside each role', async () => {
    const d = await db();
    await expect(assignRequest(d, reviewer, assigned.id, reviewer.userId, await version(assigned.id))).rejects.toMatchObject({ code: 'forbidden' });
    await expect(setDisposition(d, reviewer, [assigned.id], 'archived')).rejects.toMatchObject({ code: 'forbidden' });
    await expect(setDisposition(d, reviewer, [assigned.id], 'spam')).rejects.toMatchObject({ code: 'forbidden' });
    await expect(addNote(d, readOnly, assigned.id, 'x')).rejects.toMatchObject({ code: 'not_found' }); // not assigned to read-only
    await expect(changeStatus(d, reviewer, assigned.id, { to: 'lost', reason: 'x', expectedVersion: await version(assigned.id) })).rejects.toMatchObject({ code: 'forbidden' });
    await expect(deleteRequestPermanently(d, manager, assigned.id, assigned.reference)).rejects.toMatchObject({ code: 'forbidden' });
    await expect(buildExport(d, reviewer, { scope: 'filtered', query: defaultQuery('inbox'), include: [], language: 'en' }, TZ)).rejects.toMatchObject({ code: 'forbidden' });
    await expect(releaseAttachment(d, reviewer, fileId)).rejects.toMatchObject({ code: 'forbidden' });
    await expect(listAudit(d, reviewer, {})).rejects.toMatchObject({ code: 'forbidden' });
    await expect(changeRole(d, manager, reviewer.userId, 'owner')).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('lets an assigned reviewer work within allowed transitions', async () => {
    const d = await db();
    const res = await changeStatus(d, reviewer, assigned.id, { to: 'in_review', expectedVersion: await version(assigned.id) });
    expect(res.status).toBe('in_review');
    await addNote(d, reviewer, assigned.id, 'Reviewer note (synthetic)');
  });

  it('keeps quarantined files unavailable until released, then issues session-bound links', async () => {
    const d = await db();
    await expect(issueFileLink(d, owner, fileId, 'download')).rejects.toMatchObject({ code: 'file_unavailable' });
    await releaseAttachment(d, manager, fileId);
    await expect(issueFileLink(d, reviewer2, fileId, 'download')).rejects.toMatchObject({ code: 'not_found' });
    const link = await issueFileLink(d, reviewer, fileId, 'download');
    const token = new URL(link.url, 'http://x').searchParams.get('token') ?? '';
    const ok = await resolveFileLink(d, reviewer, fileId, token);
    expect(ok.bytes.subarray(0, 5).toString()).toBe('%PDF-');
    // Another person, another session, no session, a different file, or a tampered token: denied.
    await expect(resolveFileLink(d, owner, fileId, token)).rejects.toMatchObject({ code: 'not_found' });
    await expect(resolveFileLink(d, { ...reviewer, sessionId: 'another-session' }, fileId, token)).rejects.toMatchObject({ code: 'not_found' });
    await expect(resolveFileLink(d, null, fileId, token)).rejects.toMatchObject({ code: 'unauthenticated' });
    await expect(resolveFileLink(d, reviewer, randomUUID(), token)).rejects.toMatchObject({ code: 'not_found' });
    await expect(resolveFileLink(d, reviewer, fileId, token.slice(0, -2) + 'xx')).rejects.toMatchObject({ code: 'not_found' });
    // Reassignment away from the reviewer revokes access even with a fresh token.
    const again = await issueFileLink(d, reviewer, fileId, 'download');
    await assignRequest(d, owner, assigned.id, reviewer2.userId, await version(assigned.id));
    await expect(resolveFileLink(d, reviewer, fileId, new URL(again.url, 'http://x').searchParams.get('token') ?? '')).rejects.toMatchObject({ code: 'not_found' });
    await assignRequest(d, owner, assigned.id, reviewer.userId, await version(assigned.id));
  });

  it('expires file links after their short lifetime', async () => {
    const d = await db();
    const link = await issueFileLink(d, reviewer, fileId, 'download');
    const token = new URL(link.url, 'http://x').searchParams.get('token') ?? '';
    const realNow = Date.now;
    Date.now = () => realNow() + 61_000;
    try {
      await expect(resolveFileLink(d, reviewer, fileId, token)).rejects.toMatchObject({ code: 'link_expired' });
    } finally {
      Date.now = realNow;
    }
  });

  it('limits managers to the operational audit subset', async () => {
    const d = await db();
    await changeRole(d, owner, readOnly.userId, 'reviewer');
    await changeRole(d, owner, readOnly.userId, 'read_only');
    const managerView = await listAudit(d, manager, { limit: 200 });
    expect(managerView.length).toBeGreaterThan(0);
    expect(managerView.every((e) => ['request', 'file', 'communication', 'export'].includes(e.category))).toBe(true);
    const ownerView = await listAudit(d, owner, { limit: 200 });
    expect(ownerView.filter((e) => e.action === 'team.role_changed')).toHaveLength(2);
    expect(managerView.some((e) => e.action === 'team.role_changed')).toBe(false);
    // Audit metadata never stores file contents, message bodies or links.
    expect(JSON.stringify(ownerView)).not.toMatch(/token=|%PDF|Reviewer note/);
  });

  it('protects the last owner and revokes sessions immediately', async () => {
    const d = await db();
    await expect(changeRole(d, owner, owner.userId, 'manager')).rejects.toMatchObject({ code: 'last_owner' });
    await expect(setMemberAccess(d, owner, owner.userId, 'revoked')).rejects.toMatchObject({ code: 'validation' });
    const { getAuth } = await import('@/server/auth/auth');
    const ctx = await getAuth()!.$context;
    await ctx.internalAdapter.createSession(reviewer2.userId);
    expect((await d.select().from(session).where(eq(session.userId, reviewer2.userId))).length).toBe(1);
    await setMemberAccess(d, owner, reviewer2.userId, 'revoked');
    expect((await d.select().from(session).where(eq(session.userId, reviewer2.userId))).length).toBe(0);
    await setMemberAccess(d, owner, reviewer2.userId, 'active');
  });

  it('allows permanent deletion only by the owner, only after archiving, with the typed reference', async () => {
    const d = await db();
    const victim = await submit({ company: 'Deletion Test Co' });
    await expect(deleteRequestPermanently(d, owner, victim.id, victim.reference)).rejects.toMatchObject({ code: 'validation', details: { field: 'disposition' } });
    await setDisposition(d, owner, [victim.id], 'archived');
    await expect(deleteRequestPermanently(d, owner, victim.id, 'ZNT-0000-WRONG')).rejects.toMatchObject({ code: 'validation', details: { field: 'confirmation' } });
    const res = await deleteRequestPermanently(d, owner, victim.id, victim.reference.toLowerCase());
    expect(res).toMatchObject({ reference: victim.reference, storageUnverified: 0 });
    await expect(getRequestDetail(d, owner, victim.id)).rejects.toMatchObject({ code: 'not_found' });
    const trail = await listAudit(d, owner, { limit: 5 });
    expect(trail[0]).toMatchObject({ action: 'request.deleted', requestId: null });
  });
});
