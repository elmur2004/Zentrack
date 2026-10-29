import { z } from 'zod';
import { serviceSlugs } from '@/i18n/routes';
import { engagementIds } from '@/content/public/track';
import { countryCodes } from '@/content/public/countries';

// The site's Content-Security-Policy has no 'unsafe-eval'. Without this, Zod probes `new Function`
// on first use (raising a CSP violation report) before falling back; validation is identical.
z.config({ jitless: true });

/**
 * One schema shared by the browser and the server. Error messages are language-neutral
 * codes (keys of forms.errors in the dictionaries); the UI translates them.
 */

export const LIMITS = {
  name: [2, 100],
  company: [2, 160],
  email: 254,
  details: [20, 4000],
  experienceMax: 60,
  attachments: { maxFiles: 3, maxFileBytes: 10 * 1024 * 1024, maxTotalBytes: 20 * 1024 * 1024 },
  cv: { maxFileBytes: 5 * 1024 * 1024 },
} as const;

export const ATTACHMENT_TYPES = {
  'application/pdf': ['pdf'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
} as const;

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const EASTERN_ARABIC = '۰۱۲۳۴۵۶۷۸۹';

/** Normalizes Arabic-Indic and Eastern Arabic digits to 0–9 (numeric/phone processing only). */
export function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (ch) => {
    const a = ARABIC_INDIC.indexOf(ch);
    return String(a >= 0 ? a : EASTERN_ARABIC.indexOf(ch));
  });
}

/** International phone: keeps a leading +, removes common separators, 7–15 digits (E.164 length). */
export function normalizePhone(value: string): string | null {
  let v = normalizeDigits(value).trim().replace(/[\s\-().‎‏]/g, '');
  if (v.startsWith('00')) v = `+${v.slice(2)}`;
  if (!/^\+?[0-9]{7,15}$/.test(v)) return null;
  return v;
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
export function isEmail(value: string) {
  return value.length <= LIMITS.email && EMAIL_RE.test(value);
}

export function isPortfolioUrl(value: string) {
  try {
    const u = new URL(value);
    return (u.protocol === 'https:' || u.protocol === 'http:') && !!u.hostname && value.length <= 500;
  } catch {
    return false;
  }
}

/** Unicode-friendly length on trimmed text (no ASCII-only name rules). */
const text = (min: number, max: number, minCode: string, lenCode: string) =>
  z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, minCode)
    .refine((s) => s.length === 0 || ([...s].length >= min && [...s].length <= max), lenCode);

const optionalPhone = z
  .string()
  .optional()
  .transform((s) => (s ?? '').trim())
  .refine((s) => s === '' || normalizePhone(s) !== null, 'phoneInvalid')
  .transform((s) => (s === '' ? undefined : (normalizePhone(s) as string)));

const email = z
  .string()
  .transform((s) => s.trim())
  .refine(isEmail, 'emailInvalid');

const country = z.string().refine((c) => (countryCodes as readonly string[]).includes(c), 'countryRequired');

const details = z
  .string()
  .transform((s) => s.trim())
  .refine((s) => [...s].length >= LIMITS.details[0], 'detailsShort')
  .refine((s) => [...s].length <= LIMITS.details[1], 'detailsLong');

const privacy = z.literal(true, 'privacyRequired');

export const serviceChoice = [...serviceSlugs, 'not-sure'] as const;
export const partnerTypeIds = ['consultant', 'contractor', 'survey', 'engineering', 'other'] as const;
export const disciplineIds = ['bim-modeller', 'bim-coordinator', 'civil-infrastructure', 'utilities', 'landscape', 'other'] as const;

export const quoteSchema = z.object({
  name: text(LIMITS.name[0], LIMITS.name[1], 'nameRequired', 'nameLength'),
  company: text(LIMITS.company[0], LIMITS.company[1], 'companyRequired', 'companyLength'),
  email,
  phone: optionalPhone,
  country,
  services: z
    .array(z.enum(serviceChoice))
    .min(1, 'serviceRequired')
    .max(serviceChoice.length, 'serviceRequired'),
  scope: z.union([z.enum(engagementIds), z.literal('')], 'scopeInvalid').optional(),
  details,
  attachments: z.array(z.string().regex(/^upl_[a-z0-9]{12,40}$/)).max(LIMITS.attachments.maxFiles, 'fileCount').default([]),
  privacy,
});

export const partnerSchema = z.object({
  name: text(LIMITS.name[0], LIMITS.name[1], 'nameRequired', 'nameLength'),
  company: text(LIMITS.company[0], LIMITS.company[1], 'companyRequired', 'companyLength'),
  email,
  phone: optionalPhone,
  country,
  partnerType: z.enum(partnerTypeIds, 'partnerTypeRequired'),
  details,
  privacy,
});

export const careerSchema = z
  .object({
    name: text(LIMITS.name[0], LIMITS.name[1], 'nameRequired', 'nameLength'),
    email,
    discipline: z.enum(disciplineIds, 'disciplineRequired'),
    experience: z
      .string()
      .optional()
      .transform((s) => normalizeDigits((s ?? '').trim()))
      .refine((s) => s === '' || (/^[0-9]{1,2}$/.test(s) && Number(s) <= LIMITS.experienceMax), 'experienceInvalid')
      .transform((s) => (s === '' ? undefined : Number(s))),
    portfolio: z
      .string()
      .optional()
      .transform((s) => (s ?? '').trim())
      .refine((s) => s === '' || isPortfolioUrl(s), 'portfolioInvalid'),
    cv: z.string().regex(/^upl_[a-z0-9]{12,40}$/).optional().or(z.literal('')),
    privacy,
  })
  .superRefine((v, ctx) => {
    if (!v.portfolio && !v.cv) ctx.addIssue({ code: 'custom', path: ['portfolio'], message: 'cvOrPortfolio' });
  });

export type FormType = 'quote' | 'partner' | 'career';
export const schemas = { quote: quoteSchema, partner: partnerSchema, career: careerSchema } as const;

export interface FieldError {
  field: string;
  code: string;
}

export function validate(type: FormType, values: unknown): { ok: true; data: unknown } | { ok: false; errors: FieldError[] } {
  const result = schemas[type].safeParse(values);
  if (result.success) return { ok: true, data: result.data };
  const seen = new Set<string>();
  const errors: FieldError[] = [];
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? 'form');
    if (seen.has(field)) continue;
    seen.add(field);
    errors.push({ field, code: issue.message });
  }
  return { ok: false, errors };
}

/** Content signature check (OWASP): extension, declared type and magic bytes must agree. */
export function detectFileType(bytes: Uint8Array): keyof typeof ATTACHMENT_TYPES | null {
  if (bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d)
    return 'application/pdf';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  )
    return 'image/png';
  return null;
}

export function extensionOf(name: string): string {
  const m = /\.([a-z0-9]{1,8})$/i.exec(name);
  return m ? m[1].toLowerCase() : '';
}

export function checkFileMeta(
  kind: 'attachment' | 'cv',
  name: string,
  type: string,
  size: number,
): 'fileTooLarge' | 'fileType' | 'cvType' | null {
  const ext = extensionOf(name);
  if (kind === 'cv') {
    if (ext !== 'pdf' || (type && type !== 'application/pdf')) return 'cvType';
    if (size > LIMITS.cv.maxFileBytes) return 'fileTooLarge';
    return null;
  }
  const allowed = ATTACHMENT_TYPES[type as keyof typeof ATTACHMENT_TYPES] as readonly string[] | undefined;
  const extOk = Object.values(ATTACHMENT_TYPES).some((exts) => (exts as readonly string[]).includes(ext));
  if (!extOk || (type && !allowed?.includes(ext))) return 'fileType';
  if (size > LIMITS.attachments.maxFileBytes) return 'fileTooLarge';
  return null;
}
