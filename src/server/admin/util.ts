import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

export const newId = () => randomUUID();

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32 (no I, L, O, U)

/** Human-readable, non-sequential reference, e.g. ZNT-2026-7K3QF9 (does not leak volume). */
export function newReference(now = new Date()): string {
  const bytes = randomBytes(6);
  let s = '';
  for (const b of bytes) s += ALPHABET[b % 32];
  return `ZNT-${now.getUTCFullYear()}-${s}`;
}

export function sha256Hex(input: string | Uint8Array): string {
  return createHash('sha256').update(input).digest('hex');
}

/** Keys derived from the auth secret for separate purposes (file links, etc.). */
export function derivedKey(label: string): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET?.trim() || (globalThis as { __zntEphemeralSecret?: string }).__zntEphemeralSecret;
  if (!secret) throw new Error('auth secret unavailable');
  return createHmac('sha256', secret).update(`zentrac:${label}`).digest();
}

export function signPayload(label: string, payload: Record<string, string | number>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', derivedKey(label)).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyPayload<T extends Record<string, string | number>>(label: string, token: string): T | null {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = createHmac('sha256', derivedKey(label)).update(body).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

/** Escapes LIKE wildcards in user search input. */
export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export function isUniqueViolation(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === '23505' || err?.cause?.code === '23505';
}

/** Removes anything that could be a secret/URL from provider error text before storing it. */
export function sanitizeError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.replace(/https?:\/\/\S+/g, '[url]').replace(/[A-Za-z0-9+/_-]{24,}/g, '[redacted]').slice(0, 300);
}
