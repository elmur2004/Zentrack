/**
 * Authentication (Better Auth). Server-only.
 * - Email + password with Better Auth's own hashing; public sign-up disabled (owner provisioning only).
 * - TOTP two-factor plugin (owners can require it for privileged roles in Settings).
 * - Sessions stored in the database; no cookie cache, so logout/revocation takes effect on the next request.
 * - Cookies: HttpOnly, SameSite=Lax, Secure (+ __Secure- prefix) whenever the base URL is https.
 */
import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { twoFactor } from 'better-auth/plugins/two-factor';
import { nextCookies } from 'better-auth/next-js';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { authSchema, teamMember } from '../db/schema';
import { getDb, getDbHandleSync } from '../db/client';

export function authBaseUrl(): string {
  return (process.env.BETTER_AUTH_URL || process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

const g = globalThis as unknown as { __zntAuth?: ReturnType<typeof createAuth>; __zntEphemeralSecret?: string };

/** Admin is available only with a configured secret (an ephemeral one is allowed in development). */
export function authSecret(): string | null {
  const s = process.env.BETTER_AUTH_SECRET?.trim();
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV !== 'production') {
    g.__zntEphemeralSecret ??= randomBytes(32).toString('base64url');
    return g.__zntEphemeralSecret;
  }
  return null;
}

function createAuth(secret: string) {
  const baseURL = authBaseUrl();
  // Sign-in/verification attempts per 5 minutes per client. Raise only on isolated test servers.
  const attempts = Math.max(1, Number(process.env.AUTH_RATE_LIMIT_MAX ?? 10) || 10);
  return betterAuth({
    appName: 'Zentrac Admin',
    baseURL,
    basePath: '/api/auth',
    secret,
    trustedOrigins: [baseURL],
    database: drizzleAdapter(getDbHandleSync().db, { provider: 'pg', schema: authSchema }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      autoSignIn: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
    },
    session: {
      expiresIn: 60 * 60 * 12, // 12 hours
      updateAge: 60 * 60, // refreshed at most hourly while active
      freshAge: 60 * 15,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 120,
      customRules: {
        '/sign-in/email': { window: 300, max: attempts },
        '/two-factor/verify-totp': { window: 300, max: attempts },
        '/two-factor/verify-backup-code': { window: 300, max: attempts },
        '/change-password': { window: 300, max: attempts },
        '/two-factor/enable': { window: 300, max: attempts },
        '/two-factor/disable': { window: 300, max: attempts },
      },
    },
    advanced: {
      cookiePrefix: 'znt',
      defaultCookieAttributes: { sameSite: 'lax', httpOnly: true },
    },
    databaseHooks: {
      session: {
        create: {
          // Only active dashboard members can hold a session (revoked or orphan accounts cannot sign in).
          before: async (s) => {
            const db = await getDb();
            const [m] = await db.select({ status: teamMember.status }).from(teamMember).where(eq(teamMember.userId, s.userId)).limit(1);
            if (!m || m.status !== 'active') throw new APIError('FORBIDDEN', { message: 'No active dashboard membership', code: 'NO_ACTIVE_MEMBERSHIP' });
          },
        },
      },
    },
    plugins: [twoFactor({ issuer: 'Zentrac Admin' }), nextCookies()],
  });
}

/** Returns the auth instance, or null when the admin is not configured (fail closed). */
export function getAuth() {
  const secret = authSecret();
  if (!secret) return null;
  g.__zntAuth ??= createAuth(secret);
  return g.__zntAuth;
}

export type Auth = NonNullable<ReturnType<typeof getAuth>>;
