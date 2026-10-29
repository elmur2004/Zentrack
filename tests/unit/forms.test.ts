import { describe, expect, it } from 'vitest';
import { checkFileMeta, detectFileType, normalizeDigits, normalizePhone, validate } from '@/lib/forms/schema';

const validQuote = {
  name: 'مارك',
  company: 'شركة الاختبار',
  email: 'test@example.com',
  phone: '',
  country: 'EG',
  services: ['coordination'],
  scope: '',
  details: 'A non-confidential overview of a utilities coordination package.',
  attachments: [],
  privacy: true,
};

describe('digit and phone normalization (L10, L11)', () => {
  it('normalizes Arabic-Indic and Eastern Arabic digits', () => {
    expect(normalizeDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
    expect(normalizeDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
  });
  it('keeps the leading + and accepts separators', () => {
    expect(normalizePhone('+20 (2) 1234-5678')).toBe('+20212345678');
    expect(normalizePhone('+٢٠ ١٢٣ ٤٥٦ ٧٨٩٠')).toBe('+201234567890');
    expect(normalizePhone('0020 123 456 7890')).toBe('+201234567890');
    expect(normalizePhone('12')).toBeNull();
  });
});

describe('quote validation', () => {
  it('accepts Arabic names and company names (L09)', () => {
    expect(validate('quote', validQuote).ok).toBe(true);
  });
  it('returns language-neutral codes for each invalid field', () => {
    const r = validate('quote', { ...validQuote, name: ' ', email: 'nope', services: [], details: 'short', privacy: false });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const codes = Object.fromEntries(r.errors.map((e) => [e.field, e.code]));
      expect(codes).toMatchObject({
        name: 'nameRequired',
        email: 'emailInvalid',
        services: 'serviceRequired',
        details: 'detailsShort',
        privacy: 'privacyRequired',
      });
    }
  });
  it('rejects unknown service IDs and countries', () => {
    expect(validate('quote', { ...validQuote, services: ['survey'] }).ok).toBe(false);
    expect(validate('quote', { ...validQuote, country: 'XX' }).ok).toBe(false);
  });
  it('validates an optional phone only when present', () => {
    expect(validate('quote', { ...validQuote, phone: '+٢٠١٢٣٤٥٦٧٨٩٠' }).ok).toBe(true);
    const bad = validate('quote', { ...validQuote, phone: 'call me' });
    expect(bad.ok).toBe(false);
  });
});

describe('career validation', () => {
  const base = { name: 'Lina', email: 'lina@example.com', discipline: 'bim-modeller', experience: '', portfolio: '', cv: '', privacy: true };
  it('requires a CV or a portfolio link', () => {
    const r = validate('career', base);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toEqual({ field: 'portfolio', code: 'cvOrPortfolio' });
    expect(validate('career', { ...base, portfolio: 'https://portfolio.example.com/lina' }).ok).toBe(true);
  });
  it('accepts Arabic-Indic years of experience and rejects non-web schemes', () => {
    expect(validate('career', { ...base, portfolio: 'https://x.example', experience: '١٢' }).ok).toBe(true);
    expect(validate('career', { ...base, portfolio: 'javascript:alert(1)' }).ok).toBe(false);
    expect(validate('career', { ...base, portfolio: 'https://x.example', experience: '-3' }).ok).toBe(false);
  });
});

describe('file checks (OWASP: extension, declared type, signature, size)', () => {
  const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
  it('detects real signatures', () => {
    expect(detectFileType(pdf)).toBe('application/pdf');
    expect(detectFileType(png)).toBe('image/png');
    expect(detectFileType(jpg)).toBe('image/jpeg');
    expect(detectFileType(new TextEncoder().encode('MZ executable'))).toBeNull();
  });
  it('rejects disallowed types, oversized files and non-PDF CVs', () => {
    expect(checkFileMeta('attachment', 'model.rvt', 'application/octet-stream', 100)).toBe('fileType');
    expect(checkFileMeta('attachment', 'plan.pdf', 'application/pdf', 11 * 1024 * 1024)).toBe('fileTooLarge');
    expect(checkFileMeta('attachment', 'plan.pdf', 'application/pdf', 1000)).toBeNull();
    expect(checkFileMeta('cv', 'cv.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1000)).toBe('cvType');
    expect(checkFileMeta('cv', 'cv.pdf', 'application/pdf', 6 * 1024 * 1024)).toBe('fileTooLarge');
  });
});
