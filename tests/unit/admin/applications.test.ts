import './env';
import { randomBytes } from 'node:crypto';
import { readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { and, eq, sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { application, applicationNote, attachment, auditEvent, fileBlob, inAppNotification, notificationJob, teamMember } from '@/server/db/schema';
import { updateSettings } from '@/server/admin/settings';
import {
  addApplicationNote,
  changeApplicationStatus,
  createApplicationFromPublicSubmission,
  defaultApplicationQuery,
  deleteApplicationPermanently,
  getApplicationDetail,
  listApplications,
  newApplicationCounts,
  setApplicationDisposition,
  type CareerData,
  type PartnerData,
} from '@/server/admin/applications';
import { issueFileLink, releaseAttachment, resolveFileLink, storePublicUpload } from '@/server/admin/files';
import { listNotifications, processNotificationJobs, unreadNotificationCount } from '@/server/admin/notifications';
import { POLICY } from '@/server/admin/policy';
import { PRIVACY_POLICY } from '@/lib/legal';
import { db, member, PDF } from './fixtures';

type M = Awaited<ReturnType<typeof member>>;

const partner = (o: Partial<PartnerData> = {}): PartnerData => ({
  name: 'Partner Test',
  company: 'شركة الاختبار — BIM Experts',
  email: 'partner@example.invalid',
  phone: '+9995550100',
  country: 'EG',
  partnerType: 'contractor',
  details: 'Synthetic partner enquiry for integration tests: survey and civil works teams.',
  ...o,
});

const career = (o: Partial<CareerData> = {}): CareerData => ({ name: 'سارة تجريبية', email: 'applicant@example.invalid', discipline: 'bim-coordinator', experience: 6, portfolio: 'https://portfolio.example.invalid/work', ...o });

async function submitPartner(data: Partial<PartnerData> = {}, key = `ptr-${randomBytes(10).toString('hex')}`) {
  const d = await db();
  const r = await createApplicationFromPublicSubmission(d, { kind: 'partner', locale: 'en', idempotencyKey: key, data: partner(data), sourcePage: '/en/partners', uploadToken: null });
  const [row] = await d.select().from(application).where(eq(application.reference, r.reference));
  return { ...r, id: row.id, row, key };
}

async function submitCareer(data: Partial<CareerData> = {}, opts: { token?: string | null; key?: string } = {}) {
  const d = await db();
  const key = opts.key ?? `car-${randomBytes(10).toString('hex')}`;
  const r = await createApplicationFromPublicSubmission(d, { kind: 'career', locale: 'ar', idempotencyKey: key, data: career(data), sourcePage: '/ar/careers', uploadToken: opts.token ?? null });
  const [row] = await d.select().from(application).where(eq(application.reference, r.reference));
  return { ...r, id: row.id, row, key };
}

async function cvUpload(name = 'السيرة-الذاتية.pdf', token = randomBytes(24).toString('base64url')) {
  const rec = await storePublicUpload(await db(), { bytes: PDF, originalName: name, mimeType: 'application/pdf', uploadToken: token, kind: 'cv' });
  return { ...rec, token };
}

describe('partner enquiries and career applications (dashboard intake)', () => {
  let owner: M, manager: M, reviewer: M, readOnly: M;
  beforeAll(async () => {
    owner = await member('owner');
    manager = await member('manager');
    reviewer = await member('reviewer');
    readOnly = await member('read_only');
  }, 60_000);

  it('stores a partner enquiry with its fields, policy version, audit entry and notifications', async () => {
    const r = await submitPartner();
    expect(r.reference).toMatch(/^PTR-\d{4}-[0-9A-HJKMNP-TV-Z]{6}$/);
    expect(r.row).toMatchObject({ kind: 'partner', contactName: 'Partner Test', company: 'شركة الاختبار — BIM Experts', countryCode: 'EG', partnerType: 'contractor', status: 'new', disposition: 'active', privacyPolicyVersion: PRIVACY_POLICY.version, sourcePage: '/en/partners' });
    const d = await db();
    const audits = await d.select().from(auditEvent).where(eq(auditEvent.applicationId, r.id));
    expect(audits.map((a) => a.action)).toEqual(['application.received']);
    expect(JSON.stringify(audits[0].metadata)).not.toContain('Synthetic partner enquiry');
    const notes = await d.select().from(inAppNotification).where(eq(inAppNotification.applicationId, r.id));
    // Owners and managers are notified; reviewers and read-only members are not.
    expect(new Set(notes.map((n) => n.userId))).toEqual(new Set([owner.userId, manager.userId]));
    expect(notes.every((n) => n.kind === 'new_partner')).toBe(true);
  });

  it('stores a career application and binds its CV (private, quarantined) from the same browser session only', async () => {
    const cv = await cvUpload();
    const r = await submitCareer({ cv: cv.id }, { token: cv.token });
    expect(r.reference).toMatch(/^CAR-\d{4}-/);
    expect(r.row).toMatchObject({ kind: 'career', discipline: 'bim-coordinator', experienceYears: 6, portfolioUrl: 'https://portfolio.example.invalid/work', submissionLocale: 'ar', company: null });
    const d = await db();
    const [file] = await d.select().from(attachment).where(eq(attachment.applicationId, r.id));
    expect(file).toMatchObject({ kind: 'cv', scanState: 'unscanned', originalName: 'السيرة-الذاتية.pdf', requestId: null });
    // Another session's CV, a quote attachment used as a CV, and a reused CV are all refused.
    const other = await cvUpload('other.pdf');
    await expect(submitCareer({ cv: other.id }, { token: 'some-other-session-token-xxxxxxxx' })).rejects.toMatchObject({ code: 'validation', details: { field: 'cv' } });
    const quoteFile = await storePublicUpload(d, { bytes: PDF, originalName: 'drawing.pdf', mimeType: 'application/pdf', uploadToken: cv.token });
    await expect(submitCareer({ cv: quoteFile.id }, { token: cv.token })).rejects.toMatchObject({ code: 'validation' });
    await expect(submitCareer({ cv: cv.id }, { token: cv.token })).rejects.toMatchObject({ code: 'validation' });
  });

  it('is idempotent: a retry returns the original reference; a reused key with new content is rejected', async () => {
    const first = await submitPartner({ company: 'Retry Partner Co' }, 'retry-partner-key-0001');
    const again = await submitPartner({ company: 'Retry Partner Co' }, 'retry-partner-key-0001');
    expect(again.reference).toBe(first.reference);
    expect(again.replay).toBe(true);
    const d = await db();
    const [{ n }] = await d.select({ n: sql<number>`count(*)::int` }).from(application).where(eq(application.company, 'Retry Partner Co'));
    expect(n).toBe(1);
    await expect(submitPartner({ company: 'Different' }, 'retry-partner-key-0001')).rejects.toMatchObject({ code: 'conflict' });
  });

  it('limits access to owners and managers; only owners delete', async () => {
    expect(POLICY.manager['application.view']).toBe('all');
    expect(POLICY.manager['application.delete']).toBe('none');
    expect(POLICY.reviewer['application.view']).toBe('none');
    expect(POLICY.read_only['application.view']).toBe('none');
    const d = await db();
    const r = await submitPartner({ company: 'Access Test Co' });
    const q = { ...defaultApplicationQuery(), pageSize: 50 };
    expect((await listApplications(d, owner, q)).rows.some((x) => x.id === r.id)).toBe(true);
    expect((await listApplications(d, manager, q)).rows.some((x) => x.id === r.id)).toBe(true);
    await expect(listApplications(d, reviewer, q)).rejects.toMatchObject({ code: 'forbidden' });
    await expect(listApplications(d, readOnly, q)).rejects.toMatchObject({ code: 'forbidden' });
    await expect(getApplicationDetail(d, reviewer, r.id)).rejects.toMatchObject({ code: 'not_found' });
    await expect(changeApplicationStatus(d, readOnly, r.id, { to: 'in_review', expectedVersion: 1 })).rejects.toMatchObject({ code: 'forbidden' });
    const asManager = await getApplicationDetail(d, manager, r.id);
    expect(asManager.permissions).toMatchObject({ status: true, note: true, delete: false });
    // Notifications follow the same rule.
    expect((await listNotifications(d, owner)).some((n) => n.applicationId === r.id && n.reference === r.reference)).toBe(true);
    expect((await listNotifications(d, reviewer)).some((n) => n.applicationId === r.id)).toBe(false);
    expect(await unreadNotificationCount(d, reviewer)).toBe(0);
    expect((await newApplicationCounts(d, reviewer)).partner).toBe(0);
    expect((await newApplicationCounts(d, owner)).partner).toBeGreaterThan(0);
  });

  it('protects CVs: quarantined until released by an owner/manager; links bound to the session; reviewers get nothing', async () => {
    const d = await db();
    const cv = await cvUpload('cv-access.pdf');
    const r = await submitCareer({ cv: cv.id }, { token: cv.token });
    await expect(issueFileLink(d, owner, cv.id, 'download')).rejects.toMatchObject({ code: 'file_unavailable' });
    await expect(issueFileLink(d, reviewer, cv.id, 'download')).rejects.toMatchObject({ code: 'not_found' });
    await expect(releaseAttachment(d, reviewer, cv.id)).rejects.toMatchObject({ code: 'not_found' });
    await releaseAttachment(d, manager, cv.id);
    const link = await issueFileLink(d, manager, cv.id, 'download');
    const token = new URL(link.url, 'http://x').searchParams.get('token')!;
    const file = await resolveFileLink(d, manager, cv.id, token);
    expect(Buffer.compare(file.bytes, PDF)).toBe(0);
    await expect(resolveFileLink(d, owner, cv.id, token)).rejects.toMatchObject({ code: 'not_found' });
    const detail = await getApplicationDetail(d, owner, r.id);
    expect(detail.files[0]).toMatchObject({ scanState: 'released', downloadable: true });
    const actions = detail.activity.map((a) => a.action);
    expect(actions).toContain('file.released');
  });

  it('runs the status workflow with optimistic locking and a reason to reopen', async () => {
    const d = await db();
    const r = await submitPartner();
    await expect(changeApplicationStatus(d, owner, r.id, { to: 'new', expectedVersion: 1 })).rejects.toMatchObject({ code: 'invalid_transition' });
    const s1 = await changeApplicationStatus(d, owner, r.id, { to: 'in_review', expectedVersion: 1 });
    await expect(changeApplicationStatus(d, manager, r.id, { to: 'contacted', expectedVersion: 1 })).rejects.toMatchObject({ code: 'conflict' });
    const s2 = await changeApplicationStatus(d, manager, r.id, { to: 'closed', reason: 'Not a fit for current projects', expectedVersion: s1.version });
    await expect(changeApplicationStatus(d, owner, r.id, { to: 'in_review', expectedVersion: s2.version })).rejects.toMatchObject({ code: 'reason_required' });
    await changeApplicationStatus(d, owner, r.id, { to: 'in_review', reason: 'New opening', expectedVersion: s2.version });
    const detail = await getApplicationDetail(d, owner, r.id);
    expect(detail.application.status).toBe('in_review');
    expect(detail.activity.filter((a) => a.action === 'application.status_changed')).toHaveLength(3);
  });

  it('keeps internal notes out of the audit log and archives, restores and deletes deliberately', async () => {
    const d = await db();
    const r = await submitPartner({ company: 'Delete Test Co' });
    await addApplicationNote(d, manager, r.id, 'Internal: call back next week — مكالمة');
    const [note] = await d.select().from(applicationNote).where(eq(applicationNote.applicationId, r.id));
    expect(note.body).toContain('مكالمة');
    const audit = await d.select().from(auditEvent).where(and(eq(auditEvent.applicationId, r.id), eq(auditEvent.action, 'application.note_added')));
    expect(JSON.stringify(audit[0].metadata)).not.toContain('call back');
    await expect(deleteApplicationPermanently(d, owner, r.id, r.reference)).rejects.toMatchObject({ code: 'validation', details: { field: 'disposition' } });
    await setApplicationDisposition(d, manager, [r.id], 'archived');
    await expect(deleteApplicationPermanently(d, manager, r.id, r.reference)).rejects.toMatchObject({ code: 'forbidden' });
    await expect(deleteApplicationPermanently(d, owner, r.id, 'PTR-WRONG')).rejects.toMatchObject({ code: 'validation', details: { field: 'confirmation' } });
    await deleteApplicationPermanently(d, owner, r.id, r.reference.toLowerCase());
    expect(await d.select().from(application).where(eq(application.id, r.id))).toHaveLength(0);
    expect(await d.select().from(applicationNote).where(eq(applicationNote.applicationId, r.id))).toHaveLength(0);
    const [del] = await d.select().from(auditEvent).where(and(eq(auditEvent.entityId, r.id), eq(auditEvent.action, 'application.deleted')));
    expect(del.metadata).toMatchObject({ reference: r.reference, kind: 'partner', reason: 'owner' });
  });

  it('emails opted-in owners/managers the reference and a dashboard link only (never names or CV details)', async () => {
    const d = await db();
    const outbox = join(tmpdir(), `znt-app-outbox-${process.pid}`);
    process.env.EMAIL_TRANSPORT = 'outbox';
    process.env.OUTBOX_DIR = outbox;
    try {
      await updateSettings(d, owner, { emailNotifications: true });
      await d.update(teamMember).set({ notifyEmail: true });
      const r = await submitCareer({ name: 'Email Privacy Applicant' });
      const jobs = await d.select().from(notificationJob).where(eq(notificationJob.applicationId, r.id));
      // Owner and manager opted in; the reviewer and read-only member are never notified.
      expect(new Set(jobs.map((j) => j.recipientUserId))).toEqual(new Set([owner.userId, manager.userId]));
      expect(jobs.every((j) => j.kind === 'new_career')).toBe(true);
      const run = await processNotificationJobs(d, 50);
      expect(run.failed).toBe(0);
      const written = readdirSync(outbox).map((f) => readFileSync(join(outbox, f), 'utf8')).join('\n');
      expect(written).toContain(r.reference);
      expect(written).toContain(`/admin/applications/${r.id}`);
      expect(written).not.toContain('Email Privacy Applicant');
      expect(written).not.toContain('applicant@example.invalid');
    } finally {
      await updateSettings(d, owner, { emailNotifications: false });
      process.env.EMAIL_TRANSPORT = '';
      rmSync(outbox, { recursive: true, force: true });
    }
  });

  it('removes a deleted application’s CV from private storage', async () => {
    const d = await db();
    const cv = await cvUpload('cv-delete.pdf');
    const r = await submitCareer({ cv: cv.id }, { token: cv.token });
    const [file] = await d.select().from(attachment).where(eq(attachment.applicationId, r.id));
    await setApplicationDisposition(d, owner, [r.id], 'spam');
    await deleteApplicationPermanently(d, owner, r.id, r.reference);
    expect(await d.select().from(attachment).where(eq(attachment.id, file.id))).toHaveLength(0);
    expect(await d.select().from(fileBlob).where(eq(fileBlob.storageKey, file.storageKey))).toHaveLength(0);
  });
});
