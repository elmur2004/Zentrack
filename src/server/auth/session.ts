/**
 * Resolves the signed-in staff member from the live session on every admin request.
 * Role and access state are read from the database each time, so role changes and revocations
 * take effect immediately (there is no session cookie cache).
 */
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { databaseConfigured, getDb } from '../db/client';
import { teamMember } from '../db/schema';
import { DomainError } from '../admin/errors';
import type { SessionActor } from '../admin/policy';
import { getSettings } from '../admin/settings';
import { getAuth } from './auth';

/** The dashboard is available only with a database and an auth secret (fail closed otherwise). */
export function adminAvailable(): boolean {
  return databaseConfigured() && !!getAuth();
}

export async function actorFromHeaders(h: Headers): Promise<SessionActor | null> {
  if (!adminAvailable()) return null;
  const auth = getAuth();
  if (!auth) return null;
  const db = await getDb();
  const s = await auth.api.getSession({ headers: h }).catch(() => null);
  if (!s) return null;
  const [m] = await db.select({ role: teamMember.role, status: teamMember.status }).from(teamMember).where(eq(teamMember.userId, s.user.id)).limit(1);
  if (!m || m.status !== 'active') return null;
  const settings = await getSettings(db);
  const privileged = m.role === 'owner' || m.role === 'manager';
  const twoFactorEnabled = !!(s.user as { twoFactorEnabled?: boolean | null }).twoFactorEnabled;
  return {
    userId: s.user.id,
    name: s.user.name,
    email: s.user.email,
    role: m.role,
    twoFactorEnabled,
    sessionId: s.session.id,
    mfaEnrolmentRequired: settings.requireMfaForPrivileged && privileged && !twoFactorEnabled,
  };
}

/** One session lookup per server render (layout and page share it). */
const resolveActor = cache(async () => actorFromHeaders(await headers()));

export async function getActor(): Promise<SessionActor | null> {
  return resolveActor();
}

function safeNext(path: string | null, locale: string): string {
  if (!path || !path.startsWith(`/${locale}/admin`) || path.startsWith('//') || /[\s\\]/.test(path)) return '';
  if (path.includes('/sign-in') || path.includes('/invite/')) return '';
  return path;
}

/** For pages: redirects to sign-in (or to account security when MFA enrolment is required). */
export async function requireActor(locale: string, opts: { allowMfaPending?: boolean } = {}): Promise<SessionActor> {
  const h = await headers();
  const actor = await resolveActor();
  if (!actor) {
    const next = safeNext(h.get('x-znt-path'), locale);
    redirect(`/${locale}/admin/sign-in${next ? `?next=${encodeURIComponent(next)}` : ''}`);
  }
  if (actor.mfaEnrolmentRequired && !opts.allowMfaPending) redirect(`/${locale}/admin/account?mfa=required`);
  return actor;
}

/** For server actions and route handlers: throws a domain error instead of redirecting. */
export async function requireActionActor(): Promise<SessionActor> {
  if (!adminAvailable()) throw new DomainError('unavailable');
  const actor = await getActor();
  if (!actor) throw new DomainError('unauthenticated');
  if (actor.mfaEnrolmentRequired) throw new DomainError('mfa_required');
  return actor;
}
