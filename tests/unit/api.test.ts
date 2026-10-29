import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POST as enquiry } from '@/app/api/enquiries/route';
import { POST as upload } from '@/app/api/uploads/route';
import { resetStoresForTests } from '@/lib/server/store';

const ORIGIN = 'http://localhost:3000';
const values = {
  name: 'Test Person',
  company: 'Fixture Co',
  email: 'test@example.com',
  phone: '',
  country: 'EG',
  services: ['coordination'],
  scope: '',
  details: 'A non-confidential overview of a utilities coordination package.',
  attachments: [],
  privacy: true,
};

function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${ORIGIN}/api/enquiries`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN, host: 'localhost:3000', 'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250)}`, ...headers },
    body: JSON.stringify(body),
  });
}

function fileRequest(name: string, type: string, bytes: Uint8Array<ArrayBuffer>, kind = 'attachment', ip = '10.1.1.1') {
  const fd = new FormData();
  fd.append('kind', kind);
  fd.append('file', new File([bytes], name, { type }));
  const req = new Request(`${ORIGIN}/api/uploads`, { method: 'POST', body: fd, headers: { origin: ORIGIN, host: 'localhost:3000', 'x-forwarded-for': ip } });
  return req;
}

async function withLength(req: Request) {
  // undici computes the multipart body lazily; materialise it so content-length is known
  const buf = new Uint8Array(await req.arrayBuffer());
  return new Request(req.url, {
    method: 'POST',
    body: buf,
    headers: { ...Object.fromEntries(req.headers), 'content-length': String(buf.byteLength) },
  });
}

describe('enquiry endpoint', () => {
  beforeEach(() => {
    resetStoresForTests();
    process.env.FORM_MODE = 'preview';
  });
  afterEach(() => {
    delete process.env.FORM_MODE;
  });

  it('preview mode returns an explicit TEST reference, never “received”', async () => {
    const res = await enquiry(jsonRequest({ type: 'quote', locale: 'ar', idempotencyKey: 'key-aaaaaaaaaaaaaaaa', values }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe('test');
    expect(body.reference).toMatch(/^TEST-\d{4}-[0-9A-F]{6}$/);
  });

  it('is idempotent for a repeated key and rejects a reused key with new content', async () => {
    const first = await (await enquiry(jsonRequest({ type: 'quote', locale: 'en', idempotencyKey: 'key-bbbbbbbbbbbbbbbb', values }))).json();
    const again = await (await enquiry(jsonRequest({ type: 'quote', locale: 'en', idempotencyKey: 'key-bbbbbbbbbbbbbbbb', values }))).json();
    expect(again.reference).toBe(first.reference);
    const conflict = await enquiry(
      jsonRequest({ type: 'quote', locale: 'en', idempotencyKey: 'key-bbbbbbbbbbbbbbbb', values: { ...values, company: 'Other Co' } }),
    );
    expect(conflict.status).toBe(409);
  });

  it('returns field codes for invalid input', async () => {
    const res = await enquiry(jsonRequest({ type: 'quote', locale: 'en', idempotencyKey: 'key-cccccccccccccccc', values: { ...values, email: 'x' } }));
    expect(res.status).toBe(422);
    expect((await res.json()).errors).toEqual([{ field: 'email', code: 'emailInvalid' }]);
  });

  it('fails closed when delivery is not configured', async () => {
    delete process.env.FORM_MODE;
    const res = await enquiry(jsonRequest({ type: 'quote', locale: 'en', idempotencyKey: 'key-dddddddddddddddd', values }));
    expect(res.status).toBe(503);
    process.env.FORM_MODE = 'live'; // live without a database is still unavailable
    const live = await enquiry(jsonRequest({ type: 'quote', locale: 'en', idempotencyKey: 'key-eeeeeeeeeeeeeeee', values }));
    expect(live.status).toBe(503);
  });

  it('rejects cross-origin posts and rate-limits bursts', async () => {
    const cross = await enquiry(jsonRequest({ type: 'quote', locale: 'en', idempotencyKey: 'key-ffffffffffffffff', values }, { origin: 'https://evil.example' }));
    expect(cross.status).toBe(403);
    let last = 0;
    for (let i = 0; i < 9; i++) {
      const r = await enquiry(
        jsonRequest({ type: 'quote', locale: 'en', idempotencyKey: `key-rate-${i}-aaaaaaaaaa`, values }, { 'x-forwarded-for': '10.9.9.9' }),
      );
      last = r.status;
    }
    expect(last).toBe(429);
  });

  it('only accepts attachment IDs issued by the upload endpoint', async () => {
    const res = await enquiry(
      jsonRequest({ type: 'quote', locale: 'en', idempotencyKey: 'key-gggggggggggggggg', values: { ...values, attachments: ['upl_0123456789abcdef01'] } }),
    );
    expect(res.status).toBe(422);
  });
});

describe('upload endpoint', () => {
  beforeEach(() => {
    resetStoresForTests();
    process.env.FORM_MODE = 'preview';
  });

  it('validates a real PDF in preview mode without storing it', async () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a]);
    const res = await upload(await withLength(fileRequest('plan.pdf', 'application/pdf', pdf)));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe('test-validated');
    expect(body.id).toMatch(/^upl_[0-9a-f]+$/);
  });

  it('rejects a file whose content does not match its declared type', async () => {
    const fake = new TextEncoder().encode('MZ this is not a pdf');
    const res = await upload(await withLength(fileRequest('plan.pdf', 'application/pdf', fake)));
    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe('fileSignature');
  });

  it('rejects CAD files and non-PDF CVs', async () => {
    const res = await upload(await withLength(fileRequest('model.rvt', 'application/octet-stream', new Uint8Array([1, 2, 3]))));
    expect((await res.json()).code).toBe('fileType');
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const cv = await upload(await withLength(fileRequest('cv.png', 'image/png', png, 'cv')));
    expect((await cv.json()).code).toBe('cvType');
  });

  it('rejects oversized uploads before reading them', async () => {
    const req = new Request(`${ORIGIN}/api/uploads`, {
      method: 'POST',
      headers: { origin: ORIGIN, host: 'localhost:3000', 'content-length': String(50 * 1024 * 1024), 'content-type': 'multipart/form-data; boundary=x' },
      body: 'x',
    });
    expect((await upload(req)).status).toBe(413);
  });

  it('is unavailable when uploads are not configured', async () => {
    delete process.env.FORM_MODE;
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect((await upload(await withLength(fileRequest('a.pdf', 'application/pdf', pdf)))).status).toBe(503);
  });
});
