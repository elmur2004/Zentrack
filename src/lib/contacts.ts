/**
 * Public contact channels (OD-02). The owner edits them in the dashboard (Settings → Public
 * contact details); the website shows only channels that are set. Shared by the dashboard
 * validation and the public rendering — no placeholders are ever substituted.
 */
import { isEmail, normalizeDigits } from '@/lib/forms/schema';

export interface ContactChannels {
  email: string;
  phone: string;
  whatsapp: string;
  linkedin: string;
}

export const CONTACT_FIELDS = ['email', 'phone', 'whatsapp', 'linkedin'] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

export const EMPTY_CONTACTS: ContactChannels = { email: '', phone: '', whatsapp: '', linkedin: '' };

/** International number for display: leading +, digits in groups separated by single spaces (7–15 digits). */
export function normalizeContactPhone(value: string): string | null {
  const v = normalizeDigits(value)
    .trim()
    .replace(/^00/, '+')
    .replace(/[‎‏().\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\+ /, '+')
    .trim();
  if (!/^\+[0-9][0-9 ]*$/.test(v)) return null;
  const digits = v.replace(/[^0-9]/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return v;
}

export function isLinkedInUrl(value: string): boolean {
  if (value.length > 300) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && /^([a-z]{2,3}\.)?linkedin\.com$/i.test(u.hostname) && u.pathname.length > 1 && !u.username && !u.password;
  } catch {
    return false;
  }
}

/**
 * Validates and normalizes a contact form. Empty fields mean "not shown".
 * Returns the first invalid field instead of throwing (callers map it to a validation error).
 */
export function normalizeContacts(input: Partial<Record<ContactField, unknown>>): { ok: true; value: ContactChannels } | { ok: false; field: ContactField } {
  const raw = (k: ContactField) => (typeof input[k] === 'string' ? (input[k] as string).trim() : '');
  const email = raw('email');
  if (email && !isEmail(email)) return { ok: false, field: 'email' };
  const phoneRaw = raw('phone');
  const phone = phoneRaw ? normalizeContactPhone(phoneRaw) : '';
  if (phone === null) return { ok: false, field: 'phone' };
  const waRaw = raw('whatsapp');
  const whatsapp = waRaw ? normalizeContactPhone(waRaw) : '';
  if (whatsapp === null) return { ok: false, field: 'whatsapp' };
  const linkedin = raw('linkedin');
  if (linkedin && !isLinkedInUrl(linkedin)) return { ok: false, field: 'linkedin' };
  return { ok: true, value: { email, phone, whatsapp, linkedin } };
}

/** Defensive read of a stored value (older/malformed rows are treated as "not set"). */
export function storedContacts(value: unknown): ContactChannels {
  if (!value || typeof value !== 'object') return { ...EMPTY_CONTACTS };
  const r = normalizeContacts(value as Record<string, unknown>);
  return r.ok ? r.value : { ...EMPTY_CONTACTS };
}

export function hasAnyContact(c: ContactChannels): boolean {
  return !!(c.email || c.phone || c.whatsapp || c.linkedin);
}

export function telHref(number: string): string {
  return `tel:${number.replace(/[^+0-9]/g, '')}`;
}

export function whatsappHref(number: string): string {
  return `https://wa.me/${number.replace(/[^0-9]/g, '')}`;
}
