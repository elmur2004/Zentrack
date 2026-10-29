import './env';
import { readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { attachment, inAppNotification, notificationJob, quoteRequest, requestService, statusEvent } from '@/server/db/schema';
import { processNotificationJobs, retryNotificationJob } from '@/server/admin/notifications';
import { updateSettings } from '@/server/admin/settings';
import { getRequestDetail } from '@/server/admin/requests';
import { PRIVACY_POLICY } from '@/lib/legal';
import { db, member, submit, upload, PNG } from './fixtures';

const OUTBOX = join(tmpdir(), `znt-outbox-${process.pid}`);

describe('public quote intake (durable receipt)', () => {
  let owner: Awaited<ReturnType<typeof member>>;
  beforeAll(async () => {
    owner = await member('owner');
    await member('manager');
  }, 60_000);
  afterAll(() => rmSync(OUTBOX, { recursive: true, force: true }));

  it('stores one English request with its fields, services, status event and attachment state', async () => {
    const file = await upload('Coordination plan (rev B).pdf');
    const r = await submit({ services: ['coordination', 'shop-drawings'], attachments: [file.id] }, { uploadToken: file.token });
    expect(r.reference).toMatch(/^ZNT-\d{4}-[0-9A-HJKMNP-TV-Z]{6}$/);
    expect(r.replay).toBe(false);
    const d = await db();
    expect(r.row).toMatchObject({ contactName: 'Alex Test', company: 'Test Contractor Ltd', email: 'alex@example.invalid', countryCode: 'EG', submissionLocale: 'en', status: 'new', disposition: 'active', privacyPolicyVersion: PRIVACY_POLICY.version });
    const services = await d.select().from(requestService).where(eq(requestService.requestId, r.id));
    expect(services.map((s) => s.serviceId).sort()).toEqual(['coordination', 'shop-drawings']);
    const files = await d.select().from(attachment).where(eq(attachment.requestId, r.id));
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ originalName: 'Coordination plan (rev B).pdf', scanState: 'unscanned', kind: 'enquiry' });
    expect(files[0].storageKey).toMatch(/^obj_[a-f0-9]{40}$/); // never derived from the filename
    const events = await d.select().from(statusEvent).where(eq(statusEvent.requestId, r.id));
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ fromStatus: null, toStatus: 'new', actorId: null });
  });

  it('preserves Arabic and mixed-direction text and filenames exactly', async () => {
    const details = 'طلب ZNT-2026-0042: نحتاج إلى تنسيق BIM / LOD 400 لمشروع تجريبي — هاتف +20 100 000 0000؟';
    const file = await upload('مخطط-التنسيق-01.pdf');
    const r = await submit({ name: 'سارة تجريبية', company: 'شركة الاختبار — BIM Experts', details, attachments: [file.id] }, { locale: 'ar', uploadToken: file.token });
    const detail = await getRequestDetail(await db(), owner, r.id);
    expect(detail.request.description).toBe(details);
    expect(detail.request.company).toBe('شركة الاختبار — BIM Experts');
    expect(detail.request.submissionLocale).toBe('ar');
    expect(detail.files[0].originalName).toBe('مخطط-التنسيق-01.pdf');
  });

  it('strips path and bidi-override characters from displayed filenames', async () => {
    const file = await upload('..\\..\\invoice‮fdp.exe.pdf');
    const d = await db();
    const [row] = await d.select().from(attachment).where(eq(attachment.id, file.id));
    expect(row.originalName).toBe('invoicefdp.exe.pdf');
  });

  it('a retried submission returns the original reference and creates nothing new', async () => {
    const d = await db();
    const first = await submit({ company: 'Retry Test Co' }, { key: 'retry-key-0000000001' });
    const countJobs = async () => (await d.select({ n: sql<number>`count(*)::int` }).from(inAppNotification).where(eq(inAppNotification.requestId, first.id)))[0].n;
    const jobsBefore = await countJobs();
    const again = await submit({ company: 'Retry Test Co' }, { key: 'retry-key-0000000001' });
    expect(again.reference).toBe(first.reference);
    expect(again.replay).toBe(true);
    const [{ n }] = await d.select({ n: sql<number>`count(*)::int` }).from(quoteRequest).where(eq(quoteRequest.company, 'Retry Test Co'));
    expect(n).toBe(1);
    expect(await countJobs()).toBe(jobsBefore);
  });

  it('rejects a reused key with different content', async () => {
    await submit({ company: 'Key Owner' }, { key: 'retry-key-0000000002' });
    await expect(submit({ company: 'Different Payload' }, { key: 'retry-key-0000000002' })).rejects.toMatchObject({ code: 'conflict' });
  });

  it('never attaches an upload from another browser session, twice, or after expiry', async () => {
    const file = await upload('site-photo.png', PNG);
    await expect(submit({ attachments: [file.id] }, { uploadToken: 'some-other-session-token-xxxxxxxx' })).rejects.toMatchObject({ code: 'validation', details: { field: 'attachments' } });
    await expect(submit({ attachments: [file.id] }, { uploadToken: null })).rejects.toMatchObject({ code: 'validation' });
    const ok = await submit({ attachments: [file.id] }, { uploadToken: file.token });
    expect(ok.reference).toBeTruthy();
    await expect(submit({ attachments: [file.id] }, { uploadToken: file.token })).rejects.toMatchObject({ code: 'validation' });
    const stale = await upload('old.pdf');
    await (await db()).update(attachment).set({ createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) }).where(eq(attachment.id, stale.id));
    await expect(submit({ attachments: [stale.id] }, { uploadToken: stale.token })).rejects.toMatchObject({ code: 'validation' });
  });

  it('a failed staff notification never affects the stored enquiry and can be retried once', async () => {
    const d = await db();
    process.env.EMAIL_TRANSPORT = 'outbox';
    process.env.OUTBOX_DIR = OUTBOX;
    process.env.OUTBOX_SIMULATE_FAILURE = '1';
    await updateSettings(d, owner, { emailNotifications: true });
    const { teamMember } = await import('@/server/db/schema');
    await d.update(teamMember).set({ notifyEmail: true });

    const r = await submit({ company: 'Notification Failure Co' });
    const jobs = await d.select().from(notificationJob).where(eq(notificationJob.requestId, r.id));
    expect(jobs.length).toBeGreaterThan(0);
    const run1 = await processNotificationJobs(d, 50);
    expect(run1.failed).toBeGreaterThan(0);
    const [failed] = await d.select().from(notificationJob).where(eq(notificationJob.requestId, r.id));
    expect(failed.status).toBe('failed');
    expect(failed.lastError).toContain('simulated provider failure');
    // The enquiry is intact and visible.
    const [stored] = await d.select().from(quoteRequest).where(eq(quoteRequest.id, r.id));
    expect(stored.company).toBe('Notification Failure Co');
    // Retrying the same submission still does not duplicate the jobs.
    await submit({ company: 'Notification Failure Co' }, { key: r.key });
    expect(await d.select().from(notificationJob).where(eq(notificationJob.requestId, r.id))).toHaveLength(jobs.length);

    process.env.OUTBOX_SIMULATE_FAILURE = '';
    for (const j of jobs) await retryNotificationJob(d, owner, j.id);
    const run2 = await processNotificationJobs(d, 50);
    expect(run2.sent).toBe(jobs.length);
    const after = await d.select().from(notificationJob).where(eq(notificationJob.requestId, r.id));
    expect(after.every((j) => j.status === 'test_delivered')).toBe(true);
    // Staff emails carry the reference and a link only: no names or descriptions.
    const written = readdirSync(OUTBOX).map((f) => readFileSync(join(OUTBOX, f), 'utf8')).join('\n');
    expect(written).toContain(r.reference);
    expect(written).not.toContain('Notification Failure Co');
    expect(written).not.toContain('Synthetic enquiry for integration tests');
    process.env.EMAIL_TRANSPORT = '';
  });
});
