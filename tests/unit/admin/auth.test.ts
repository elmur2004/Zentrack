import './env';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { teamMember } from '@/server/db/schema';
import { getAuth } from '@/server/auth/auth';
import { createCredentialUser } from '@/server/admin/team';
import { db } from './fixtures';

const BASE = 'http://localhost:3999';
const PASSWORD = 'correct horse battery staple (test)';

function post(path: string, body: unknown, ip = '203.0.113.10', cookie?: string) {
  return getAuth()!.handler(
    new Request(`${BASE}/api/auth${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: BASE, 'x-forwarded-for': ip, ...(cookie ? { cookie } : {}) },
      body: JSON.stringify(body),
    }),
  );
}

describe('authentication (Better Auth, real handler and database)', () => {
  let email = '';
  let userId = '';
  beforeAll(async () => {
    const d = await db();
    email = `auth.test@example.invalid`;
    userId = await createCredentialUser(email, 'Auth Test', PASSWORD);
    await d.insert(teamMember).values({ userId, role: 'manager' });
  }, 60_000);

  it('signs in with an HttpOnly, SameSite=Lax session cookie and no token in browser storage', async () => {
    const res = await post('/sign-in/email', { email, password: PASSWORD }, '203.0.113.1');
    expect(res.status).toBe(200);
    const cookies = res.headers.getSetCookie();
    const session = cookies.find((c) => c.startsWith('znt.session_token='));
    expect(session).toBeTruthy();
    expect(session).toMatch(/HttpOnly/i);
    expect(session).toMatch(/SameSite=Lax/i);
    const cookie = session!.split(';')[0];
    const who = await getAuth()!.api.getSession({ headers: new Headers({ cookie }) });
    expect(who?.user.email).toBe(email);
    // Sign-out invalidates the session server-side.
    await post('/sign-out', {}, '203.0.113.1', cookie);
    expect(await getAuth()!.api.getSession({ headers: new Headers({ cookie }) })).toBeNull();
  });

  it('has no public registration', async () => {
    const res = await post('/sign-up/email', { email: 'new.person@example.invalid', password: PASSWORD, name: 'New' }, '203.0.113.2');
    expect(res.status).toBeGreaterThanOrEqual(400);
    const res2 = await post('/sign-in/email', { email: 'new.person@example.invalid', password: PASSWORD }, '203.0.113.2');
    expect(res2.status).toBe(401);
  });

  it('rate-limits repeated sign-in attempts per client', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i += 1) statuses.push((await post('/sign-in/email', { email, password: 'wrong password!' }, '203.0.113.99')).status);
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(statuses.slice(10)).toEqual([429, 429]);
    // Another client is unaffected.
    expect((await post('/sign-in/email', { email, password: PASSWORD }, '203.0.113.100')).status).toBe(200);
  });

  it('refuses sessions for revoked members even with the right password', async () => {
    const d = await db();
    await d.update(teamMember).set({ status: 'revoked' }).where(eq(teamMember.userId, userId));
    const res = await post('/sign-in/email', { email, password: PASSWORD }, '203.0.113.3');
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe('NO_ACTIVE_MEMBERSHIP');
    await d.update(teamMember).set({ status: 'active' }).where(eq(teamMember.userId, userId));
  });
});
