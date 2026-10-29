/** Synthetic fixtures for integration tests (fictional people, example.invalid addresses). */
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb, type Db } from '@/server/db/client';
import { quoteRequest, teamMember } from '@/server/db/schema';
import type { Role } from '@/lib/admin/codes';
import type { Actor, SessionActor } from '@/server/admin/policy';
import { storePublicUpload } from '@/server/admin/files';
import { createFromPublicSubmission, type QuoteSubmission } from '@/server/admin/requests';
import { createCredentialUser } from '@/server/admin/team';

export const PDF = Buffer.from('%PDF-1.4\n% synthetic test file\n%%EOF\n', 'latin1');
export const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

let counter = 0;

export async function db(): Promise<Db> {
  return getDb();
}

export async function member(role: Role, name = `Test ${role} ${++counter}`): Promise<SessionActor> {
  const d = await db();
  const email = `${role}.${counter}.${randomBytes(3).toString('hex')}@example.invalid`;
  const userId = await createCredentialUser(email, name, `pw-${randomBytes(12).toString('hex')}`);
  await d.insert(teamMember).values({ userId, role });
  return { userId, name, email, role, twoFactorEnabled: false, sessionId: `sess-${userId}`, mfaEnrolmentRequired: false };
}

export function quote(overrides: Partial<QuoteSubmission['data']> = {}): QuoteSubmission['data'] {
  return {
    name: 'Alex Test',
    company: 'Test Contractor Ltd',
    email: 'alex@example.invalid',
    phone: '+9995550100',
    country: 'EG',
    services: ['coordination'],
    scope: '',
    details: 'Synthetic enquiry for integration tests. BIM / LOD 400.',
    attachments: [],
    ...overrides,
  };
}

export async function submit(
  data: Partial<QuoteSubmission['data']> = {},
  opts: { locale?: 'en' | 'ar'; key?: string; uploadToken?: string | null } = {},
) {
  const d = await db();
  const key = opts.key ?? `it-${randomBytes(10).toString('hex')}`;
  const receipt = await createFromPublicSubmission(d, {
    locale: opts.locale ?? 'en',
    idempotencyKey: key,
    data: quote(data),
    sourcePage: `/${opts.locale ?? 'en'}/request-a-quote`,
    sourceService: null,
    uploadToken: opts.uploadToken ?? null,
  });
  const [row] = await d.select().from(quoteRequest).where(eq(quoteRequest.reference, receipt.reference));
  return { ...receipt, id: row.id, row, key };
}

export async function upload(name: string, bytes = PDF, token = randomBytes(24).toString('base64url')) {
  const d = await db();
  const rec = await storePublicUpload(d, { bytes, originalName: name, mimeType: bytes === PNG ? 'image/png' : 'application/pdf', uploadToken: token });
  return { ...rec, token };
}

export async function version(id: string): Promise<number> {
  const d = await db();
  const [r] = await d.select({ v: quoteRequest.version }).from(quoteRequest).where(eq(quoteRequest.id, id));
  return r.v;
}

export type { Actor };
