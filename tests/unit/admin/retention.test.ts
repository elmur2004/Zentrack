import './env';
import { randomBytes } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { application, attachment, auditEvent, fileBlob, publicRateLimit, quoteRequest } from '@/server/db/schema';
import { createApplicationFromPublicSubmission } from '@/server/admin/applications';
import { applyRetention, retentionForecast, sweepRateLimits } from '@/server/admin/retention';
import { getPublicSettings, updateSettings } from '@/server/admin/settings';
import { changeStatus, setDisposition } from '@/server/admin/requests';
import { RETENTION, monthsBefore } from '@/lib/legal';
import { UPLOAD_SESSION_TTL_MS } from '@/server/admin/files';
import { db, member, submit, upload, version } from './fixtures';

type M = Awaited<ReturnType<typeof member>>;
const DAY = 24 * 60 * 60 * 1000;

async function backdate(table: 'quote' | 'app', id: string, updatedAt: Date) {
  const d = await db();
  if (table === 'quote') await d.update(quoteRequest).set({ updatedAt }).where(eq(quoteRequest.id, id));
  else await d.update(application).set({ updatedAt }).where(eq(application.id, id));
}

async function newApp(kind: 'partner' | 'career') {
  const d = await db();
  const key = `ret-${randomBytes(10).toString('hex')}`;
  const data =
    kind === 'partner'
      ? { name: 'Retention Partner', company: 'Retention Co', email: 'r@example.invalid', country: 'EG', partnerType: 'survey', details: 'Synthetic partner enquiry for the retention test.' }
      : { name: 'Retention Applicant', email: 'a@example.invalid', discipline: 'utilities', portfolio: 'https://example.invalid/p' };
  const r = await createApplicationFromPublicSubmission(d, { kind, locale: 'en', idempotencyKey: key, data: data as never, sourcePage: null, uploadToken: null } as never);
  const [row] = await d.select().from(application).where(eq(application.reference, r.reference));
  return row;
}

describe('retention (stated in the approved privacy policy)', () => {
  let owner: M;
  beforeAll(async () => {
    owner = await member('owner');
  }, 60_000);

  it('keeps the policy text and the enforced periods consistent', () => {
    // The policy groups quote requests and partner enquiries under one period.
    expect(RETENTION.partnerMonths).toBe(RETENTION.quoteMonths);
    expect(UPLOAD_SESSION_TTL_MS).toBe(RETENTION.uploadCookieHours * 60 * 60 * 1000);
  });

  it('deletes only records whose period has ended, keeps Won requests, and audits each deletion', async () => {
    const d = await db();
    const now = new Date();
    const justInside = new Date(monthsBefore(now, RETENTION.quoteMonths).getTime() + DAY);
    const expired = new Date(monthsBefore(now, RETENTION.quoteMonths).getTime() - DAY);

    const file = await upload('old-drawing.pdf');
    const oldQuote = await submit({ company: 'Old Quote Co', attachments: [file.id] }, { uploadToken: file.token });
    const recentQuote = await submit({ company: 'Recent Quote Co' });
    const wonQuote = await submit({ company: 'Won Quote Co' });
    // Move the won request through the workflow to Won (an engagement followed).
    await d.update(quoteRequest).set({ status: 'won', statusChangedAt: now }).where(eq(quoteRequest.id, wonQuote.id));
    await backdate('quote', oldQuote.id, expired);
    await backdate('quote', recentQuote.id, justInside);
    await backdate('quote', wonQuote.id, expired);

    const oldCareer = await newApp('career');
    const youngCareer = await newApp('career');
    const partnerKept = await newApp('partner');
    await backdate('app', oldCareer.id, new Date(monthsBefore(now, RETENTION.careerMonths).getTime() - DAY));
    await backdate('app', youngCareer.id, new Date(monthsBefore(now, RETENTION.careerMonths).getTime() + DAY));
    // 13 months old: past the career period but inside the partner period.
    await backdate('app', partnerKept.id, monthsBefore(now, 13));

    const spamQuote = await submit({ company: 'Spam Co' });
    await setDisposition(d, owner, [spamQuote.id], 'spam');
    await d.update(quoteRequest).set({ dispositionAt: new Date(now.getTime() - (RETENTION.spamDays + 1) * DAY) }).where(eq(quoteRequest.id, spamQuote.id));
    const freshSpam = await submit({ company: 'Fresh Spam Co' });
    await setDisposition(d, owner, [freshSpam.id], 'spam');

    const before = await retentionForecast(d, now);
    expect(before.dueNow).toBe(3); // old quote, old career application, old spam
    const [oldFile] = await d.select().from(attachment).where(eq(attachment.requestId, oldQuote.id));

    const result = await applyRetention(d, now);
    expect(result).toEqual({ requests: 2, applications: 1, failed: 0 });

    const exists = async (id: string) => (await d.select({ id: quoteRequest.id }).from(quoteRequest).where(eq(quoteRequest.id, id))).length === 1;
    const appExists = async (id: string) => (await d.select({ id: application.id }).from(application).where(eq(application.id, id))).length === 1;
    expect(await exists(oldQuote.id)).toBe(false);
    expect(await exists(spamQuote.id)).toBe(false);
    expect(await exists(recentQuote.id)).toBe(true);
    expect(await exists(wonQuote.id)).toBe(true);
    expect(await exists(freshSpam.id)).toBe(true);
    expect(await appExists(oldCareer.id)).toBe(false);
    expect(await appExists(youngCareer.id)).toBe(true);
    expect(await appExists(partnerKept.id)).toBe(true);
    // Files go with their record, from private storage too.
    expect(await d.select().from(fileBlob).where(eq(fileBlob.storageKey, oldFile.storageKey))).toHaveLength(0);
    // System deletions are audited with the reference only.
    const [entry] = await d.select().from(auditEvent).where(and(eq(auditEvent.entityId, oldQuote.id), eq(auditEvent.action, 'request.deleted')));
    expect(entry.actorId).toBeNull();
    expect(entry.metadata).toMatchObject({ reference: oldQuote.reference, reason: 'retention' });
    const [appEntry] = await d.select().from(auditEvent).where(and(eq(auditEvent.entityId, oldCareer.id), eq(auditEvent.action, 'application.deleted')));
    expect(appEntry.metadata).toMatchObject({ reference: oldCareer.reference, reason: 'retention', kind: 'career' });
    // Running again changes nothing.
    expect(await applyRetention(d, now)).toEqual({ requests: 0, applications: 0, failed: 0 });
    // Activity resets the clock: a status change moves updated_at forward.
    await backdate('quote', recentQuote.id, expired);
    await changeStatus(d, owner, recentQuote.id, { to: 'in_review', expectedVersion: await version(recentQuote.id) });
    expect((await applyRetention(d, now)).requests).toBe(0);
  });

  it('sweeps expired form-protection counters', async () => {
    const d = await db();
    const now = Date.now();
    await d.insert(publicRateLimit).values([
      { bucket: `old-${randomBytes(4).toString('hex')}`, windowStart: now - (RETENTION.rateLimitHours + 1) * 3_600_000, count: 3 },
      { bucket: `new-${randomBytes(4).toString('hex')}`, windowStart: now, count: 1 },
    ]);
    const removed = await sweepRateLimits(d, now);
    expect(removed).toBeGreaterThanOrEqual(1);
    const [{ n }] = await d.select({ n: sql<number>`count(*)::int` }).from(publicRateLimit).where(sql`${publicRateLimit.windowStart} < ${now - RETENTION.rateLimitHours * 3_600_000}`);
    expect(n).toBe(0);
  });
});

describe('owner-managed public settings', () => {
  let owner: M;
  let manager: M;
  beforeAll(async () => {
    owner = await member('owner');
    manager = await member('manager');
  }, 60_000);

  it('validates and normalizes contact channels; only owners may change them', async () => {
    const d = await db();
    await expect(updateSettings(d, manager, { publicContacts: { email: 'x@example.com', phone: '', whatsapp: '', linkedin: '' } })).rejects.toMatchObject({ code: 'forbidden' });
    await expect(updateSettings(d, owner, { publicContacts: { email: 'not-an-email', phone: '', whatsapp: '', linkedin: '' } })).rejects.toMatchObject({ code: 'validation', details: { field: 'contact_email' } });
    await expect(updateSettings(d, owner, { publicContacts: { email: '', phone: '0100 123', whatsapp: '', linkedin: '' } })).rejects.toMatchObject({ details: { field: 'contact_phone' } });
    await expect(updateSettings(d, owner, { publicContacts: { email: '', phone: '', whatsapp: '', linkedin: 'https://evil.example/linkedin.com/x' } })).rejects.toMatchObject({ details: { field: 'contact_linkedin' } });
    const saved = await updateSettings(d, owner, {
      publicContacts: { email: ' office@example.invalid ', phone: '0020 (2) 1234-5678', whatsapp: '+٢٠ ١٠٠ ١٢٣ ٤٥٦٧', linkedin: 'https://www.linkedin.com/company/example-test' },
      careerIntakeOpen: false,
    });
    expect(saved.publicContacts).toEqual({ email: 'office@example.invalid', phone: '+20 2 1234 5678', whatsapp: '+20 100 123 4567', linkedin: 'https://www.linkedin.com/company/example-test' });
    const pub = await getPublicSettings(d);
    expect(pub).toMatchObject({ partnerIntakeOpen: true, careerIntakeOpen: false, publicContacts: saved.publicContacts });
  });
});
