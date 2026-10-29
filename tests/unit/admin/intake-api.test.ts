import './env';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { POST as enquiry } from '@/app/api/enquiries/route';
import { POST as upload } from '@/app/api/uploads/route';
import { resetStoresForTests } from '@/lib/server/store';
import { application, attachment, publicRateLimit } from '@/server/db/schema';
import { updateSettings } from '@/server/admin/settings';
import { clearPublicSiteSettingsCache } from '@/server/public/site-settings';
import { db, member, PDF } from './fixtures';

const ORIGIN = 'http://localhost:3000';
let ip = 0;
const headers = (extra: Record<string, string> = {}) => ({ origin: ORIGIN, host: 'localhost:3000', 'x-forwarded-for': `10.7.0.${++ip}`, ...extra });

function post(body: unknown, extra: Record<string, string> = {}) {
  return enquiry(new Request(`${ORIGIN}/api/enquiries`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers(extra) }, body: JSON.stringify(body) }));
}

async function uploadCv(name: string) {
  const fd = new FormData();
  fd.append('kind', 'cv');
  fd.append('file', new File([new Uint8Array(PDF)], name, { type: 'application/pdf' }));
  const raw = new Request(`${ORIGIN}/api/uploads`, { method: 'POST', body: fd });
  const buf = new Uint8Array(await raw.arrayBuffer());
  return upload(new Request(`${ORIGIN}/api/uploads`, { method: 'POST', body: buf, headers: { ...headers(), 'content-type': raw.headers.get('content-type')!, 'content-length': String(buf.byteLength) } }));
}

const partnerValues = { name: 'API Partner', company: 'Partner Fixture Co', email: 'partner@example.invalid', phone: '', country: 'SA', partnerType: 'survey', details: 'Synthetic partner enquiry sent through the public endpoint.', privacy: true };
const careerValues = { name: 'API Applicant', email: 'applicant@example.invalid', discipline: 'utilities', experience: '٧', portfolio: '', cv: '', privacy: true };

describe('public partner and careers endpoints in live mode (dashboard storage)', () => {
  let owner: Awaited<ReturnType<typeof member>>;
  beforeAll(async () => {
    process.env.FORM_MODE = 'live';
    resetStoresForTests();
    owner = await member('owner');
  }, 60_000);
  afterAll(() => {
    delete process.env.FORM_MODE;
  });

  it('stores a partner enquiry and returns only the reference', async () => {
    const res = await post({ type: 'partner', locale: 'en', idempotencyKey: 'api-partner-key-0001', values: partnerValues, context: { page: '/en/partners' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(['reference', 'status']);
    expect(body).toMatchObject({ status: 'received', reference: expect.stringMatching(/^PTR-\d{4}-/) });
    const [row] = await (await db()).select().from(application).where(eq(application.reference, body.reference));
    expect(row).toMatchObject({ kind: 'partner', company: 'Partner Fixture Co', countryCode: 'SA', sourcePage: '/en/partners', phone: null });
  });

  it('accepts a private CV upload and attaches it to the application from the same browser', async () => {
    const up = await uploadCv('Applicant CV.pdf');
    expect(up.status).toBe(200);
    const stored = await up.json();
    expect(stored.status).toBe('stored');
    const cookie = (up.headers.get('set-cookie') ?? '').split(';')[0];
    expect(cookie).toMatch(/^znt_upload=/);
    expect(up.headers.get('set-cookie')).toMatch(/HttpOnly; SameSite=Strict/);
    const res = await post({ type: 'career', locale: 'ar', idempotencyKey: 'api-career-key-00001', values: { ...careerValues, cv: stored.id } }, { cookie });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reference).toMatch(/^CAR-\d{4}-/);
    const d = await db();
    const [row] = await d.select().from(application).where(eq(application.reference, body.reference));
    expect(row.experienceYears).toBe(7); // Arabic-Indic digits normalized
    const [file] = await d.select().from(attachment).where(eq(attachment.applicationId, row.id));
    expect(file).toMatchObject({ id: stored.id, kind: 'cv', scanState: 'unscanned' });
    // The same CV cannot be attached again, and not without the session cookie.
    const again = await post({ type: 'career', locale: 'ar', idempotencyKey: 'api-career-key-00002', values: { ...careerValues, cv: stored.id } });
    expect(again.status).toBe(422);
    expect((await again.json()).errors[0].field).toBe('cv');
  });

  it('honours the owner pausing a form in the dashboard', async () => {
    const d = await db();
    await updateSettings(d, owner, { careerIntakeOpen: false });
    clearPublicSiteSettingsCache();
    const res = await post({ type: 'career', locale: 'en', idempotencyKey: 'api-career-key-00003', values: { ...careerValues, portfolio: 'https://example.invalid/p' } });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: 'closed', code: 'closed' });
    expect((await uploadCv('closed.pdf')).status).toBe(503);
    // Quote requests and partner enquiries are unaffected.
    const partner = await post({ type: 'partner', locale: 'en', idempotencyKey: 'api-partner-key-0002', values: partnerValues });
    expect(partner.status).toBe(200);
    await updateSettings(d, owner, { careerIntakeOpen: true });
    clearPublicSiteSettingsCache();
  });

  it('rate-limits through the shared database counter and stores no raw address', async () => {
    process.env.ENQUIRY_RATE_LIMIT = '2';
    try {
      const fixed = { 'x-forwarded-for': '10.99.99.99' };
      const statuses: number[] = [];
      for (let i = 0; i < 3; i++) statuses.push((await post({ type: 'partner', locale: 'en', idempotencyKey: `api-rate-key-000${i}0`, values: partnerValues }, fixed)).status);
      expect(statuses).toEqual([200, 200, 429]);
      const rows = await (await db()).select().from(publicRateLimit);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.some((r) => r.bucket.includes('10.99'))).toBe(false);
    } finally {
      delete process.env.ENQUIRY_RATE_LIMIT;
    }
  });
});
