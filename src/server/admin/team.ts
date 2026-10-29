/**
 * Team membership (spec 04 §5). No public registration: the first owner is created from the
 * server console (scripts/admin-create-owner.ts); everyone else joins through an owner-created,
 * single-use, expiring invitation link that the owner shares through a trusted channel.
 * Passwords are hashed by Better Auth; nothing here stores or logs a password or raw token.
 */
import { randomBytes } from 'node:crypto';
import { and, asc, desc, eq, gt, isNull, ne, sql } from 'drizzle-orm';
import type { Db } from '../db/client';
import { invitation, session, teamMember, user } from '../db/schema';
import { ROLES, type Role } from '@/lib/admin/codes';
import { isEmail } from '@/lib/forms/schema';
import { getAuth } from '../auth/auth';
import { audit } from './audit';
import { DomainError } from './errors';
import { assertCan, type Actor } from './policy';
import { newId, sha256Hex } from './util';

export const INVITE_TTL_MS = 72 * 60 * 60 * 1000;
export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

export async function listTeam(db: Db, actor: Actor) {
  assertCan(actor, 'team.manage');
  const members = await db
    .select({
      userId: teamMember.userId,
      name: user.name,
      email: user.email,
      role: teamMember.role,
      status: teamMember.status,
      notifyEmail: teamMember.notifyEmail,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: teamMember.createdAt,
      revokedAt: teamMember.revokedAt,
      lastActiveAt: sql<Date | null>`(select max(s.updated_at) from session s where s.user_id = ${teamMember.userId})`.mapWith(teamMember.createdAt),
    })
    .from(teamMember)
    .innerJoin(user, eq(user.id, teamMember.userId))
    .orderBy(asc(teamMember.status), asc(user.name));
  const invitations = await db
    .select({ id: invitation.id, email: invitation.email, name: invitation.name, role: invitation.role, createdAt: invitation.createdAt, expiresAt: invitation.expiresAt })
    .from(invitation)
    .where(and(isNull(invitation.acceptedAt), isNull(invitation.revokedAt), gt(invitation.expiresAt, new Date())))
    .orderBy(desc(invitation.createdAt));
  return { members, invitations };
}

/** Active members for assignee pickers and filters (owners/managers only). */
export async function listAssignableMembers(db: Db, actor: Actor) {
  if (actor.role !== 'owner' && actor.role !== 'manager') return [];
  return db
    .select({ id: teamMember.userId, name: user.name, role: teamMember.role })
    .from(teamMember)
    .innerJoin(user, eq(user.id, teamMember.userId))
    .where(eq(teamMember.status, 'active'))
    .orderBy(asc(user.name));
}

export async function createInvitation(db: Db, actor: Actor, input: { email: string; name: string; role: string }) {
  assertCan(actor, 'team.manage');
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!isEmail(email)) throw new DomainError('validation', { field: 'email' });
  if ([...name].length < 2 || [...name].length > 100) throw new DomainError('validation', { field: 'name' });
  if (!(ROLES as readonly string[]).includes(input.role)) throw new DomainError('validation', { field: 'role' });
  const [existing] = await db.select({ id: user.id }).from(user).where(sql`lower(${user.email}) = ${email}`).limit(1);
  if (existing) throw new DomainError('already_exists');
  const token = randomBytes(32).toString('base64url');
  const id = newId();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  await db.transaction(async (tx) => {
    // A newer invitation replaces any pending one for the same address.
    await tx
      .update(invitation)
      .set({ revokedAt: new Date() })
      .where(and(eq(invitation.email, email), isNull(invitation.acceptedAt), isNull(invitation.revokedAt)));
    await tx.insert(invitation).values({ id, email, name, role: input.role as Role, tokenHash: sha256Hex(token), createdBy: actor.userId, expiresAt });
    await audit(tx, { actorId: actor.userId, action: 'team.invited', category: 'team', entityId: id, metadata: { role: input.role } });
  });
  // The raw token is returned once for the owner to share; only its hash is stored.
  return { id, token, expiresAt };
}

export async function revokeInvitation(db: Db, actor: Actor, id: string) {
  assertCan(actor, 'team.manage');
  const [r] = await db
    .update(invitation)
    .set({ revokedAt: new Date() })
    .where(and(eq(invitation.id, id), isNull(invitation.acceptedAt), isNull(invitation.revokedAt)))
    .returning({ id: invitation.id });
  if (!r) throw new DomainError('not_found');
  await audit(db, { actorId: actor.userId, action: 'team.invitation_revoked', category: 'team', entityId: id });
}

export async function findInvitation(db: Db, token: string) {
  if (!/^[A-Za-z0-9_-]{30,60}$/.test(token)) return null;
  const [inv] = await db
    .select({ id: invitation.id, email: invitation.email, name: invitation.name, role: invitation.role, expiresAt: invitation.expiresAt })
    .from(invitation)
    .where(and(eq(invitation.tokenHash, sha256Hex(token)), isNull(invitation.acceptedAt), isNull(invitation.revokedAt), gt(invitation.expiresAt, new Date())))
    .limit(1);
  return inv ?? null;
}

function checkPassword(password: string) {
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) throw new DomainError('validation', { field: 'password' });
}

/** Creates a credential account through Better Auth (its hashing). Console/bootstrap use only. */
export async function createCredentialUser(email: string, name: string, password: string) {
  const auth = getAuth();
  if (!auth) throw new DomainError('unavailable');
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);
  const created = await ctx.internalAdapter.createUser({ email, name, emailVerified: true }, { method: 'admin' });
  await ctx.internalAdapter.linkAccount({ userId: created.id, providerId: 'credential', accountId: created.id, password: hash });
  return created.id;
}

/** Accepts a valid invitation: creates the account (Better Auth hashing) and the membership. */
export async function acceptInvitation(db: Db, token: string, password: string) {
  checkPassword(password);
  const inv = await findInvitation(db, token);
  if (!inv) throw new DomainError('invite_invalid');
  // Claim first so a token can only ever be used once.
  const [claimed] = await db
    .update(invitation)
    .set({ acceptedAt: new Date() })
    .where(and(eq(invitation.id, inv.id), isNull(invitation.acceptedAt), isNull(invitation.revokedAt)))
    .returning({ id: invitation.id, createdBy: invitation.createdBy });
  if (!claimed) throw new DomainError('invite_invalid');
  let createdUserId: string | null = null;
  try {
    const [existing] = await db.select({ id: user.id }).from(user).where(sql`lower(${user.email}) = ${inv.email}`).limit(1);
    if (existing) throw new DomainError('already_exists');
    createdUserId = await createCredentialUser(inv.email, inv.name, password);
    await db.insert(teamMember).values({ userId: createdUserId, role: inv.role, invitedBy: claimed.createdBy });
    await db.update(invitation).set({ userId: createdUserId }).where(eq(invitation.id, inv.id));
    await audit(db, { actorId: createdUserId, action: 'team.invitation_accepted', category: 'team', entityId: inv.id, metadata: { role: inv.role } });
    return { email: inv.email };
  } catch (e) {
    // Undo a half-finished acceptance so the invitation can be used again.
    if (createdUserId) {
      const [member] = await db.select({ id: teamMember.userId }).from(teamMember).where(eq(teamMember.userId, createdUserId)).limit(1);
      if (!member) await db.delete(user).where(eq(user.id, createdUserId));
    }
    await db.update(invitation).set({ acceptedAt: null, userId: null }).where(eq(invitation.id, inv.id));
    throw e;
  }
}

async function otherActiveOwners(db: Db, exceptUserId: string) {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(teamMember)
    .where(and(eq(teamMember.role, 'owner'), eq(teamMember.status, 'active'), ne(teamMember.userId, exceptUserId)));
  return r?.n ?? 0;
}

export async function changeRole(db: Db, actor: Actor, userId: string, role: string) {
  assertCan(actor, 'team.manage');
  if (!(ROLES as readonly string[]).includes(role)) throw new DomainError('validation', { field: 'role' });
  const [m] = await db.select().from(teamMember).where(eq(teamMember.userId, userId)).limit(1);
  if (!m) throw new DomainError('not_found');
  if (m.role === role) return { changed: false };
  if (m.role === 'owner' && m.status === 'active' && (await otherActiveOwners(db, userId)) === 0) throw new DomainError('last_owner');
  await db.update(teamMember).set({ role: role as Role, updatedAt: new Date() }).where(eq(teamMember.userId, userId));
  await audit(db, { actorId: actor.userId, action: 'team.role_changed', category: 'team', entityId: userId, metadata: { from: m.role, to: role } });
  return { changed: true };
}

/** Revocation deletes every session immediately; the next request from any tab is denied. */
export async function setMemberAccess(db: Db, actor: Actor, userId: string, status: 'active' | 'revoked') {
  assertCan(actor, 'team.manage');
  if (userId === actor.userId) throw new DomainError('validation', { field: 'self' });
  const [m] = await db.select().from(teamMember).where(eq(teamMember.userId, userId)).limit(1);
  if (!m) throw new DomainError('not_found');
  if (m.status === status) return { changed: false };
  if (status === 'revoked' && m.role === 'owner' && (await otherActiveOwners(db, userId)) === 0) throw new DomainError('last_owner');
  await db.transaction(async (tx) => {
    await tx
      .update(teamMember)
      .set({ status, revokedAt: status === 'revoked' ? new Date() : null, updatedAt: new Date() })
      .where(eq(teamMember.userId, userId));
    if (status === 'revoked') await tx.delete(session).where(eq(session.userId, userId));
    await audit(tx, { actorId: actor.userId, action: status === 'revoked' ? 'team.access_revoked' : 'team.access_restored', category: 'team', entityId: userId });
  });
  return { changed: true };
}

/** Members choose their own staff-email preference; owners may set it for anyone. */
export async function setNotifyEmail(db: Db, actor: Actor, userId: string, enabled: boolean) {
  if (userId !== actor.userId) assertCan(actor, 'team.manage');
  await db.update(teamMember).set({ notifyEmail: enabled, updatedAt: new Date() }).where(eq(teamMember.userId, userId));
  await audit(db, { actorId: actor.userId, action: 'team.notification_preference', category: 'team', entityId: userId, metadata: { enabled } });
}

/** Console-only bootstrap. Refuses when an active owner already exists. */
export async function bootstrapOwner(db: Db, input: { email: string; name: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  if (!isEmail(email)) throw new DomainError('validation', { field: 'email' });
  if ([...input.name.trim()].length < 2) throw new DomainError('validation', { field: 'name' });
  checkPassword(input.password);
  const [owner] = await db.select({ id: teamMember.userId }).from(teamMember).where(and(eq(teamMember.role, 'owner'), eq(teamMember.status, 'active'))).limit(1);
  if (owner) throw new DomainError('already_exists');
  const [existing] = await db.select({ id: user.id }).from(user).where(sql`lower(${user.email}) = ${email}`).limit(1);
  if (existing) throw new DomainError('already_exists');
  const userId = await createCredentialUser(email, input.name.trim(), input.password);
  await db.insert(teamMember).values({ userId, role: 'owner' });
  await audit(db, { actorId: null, action: 'team.owner_bootstrapped', category: 'team', entityId: userId });
  return { userId };
}
