/**
 * Follow-up tasks (spec 04 §11). Due dates are entered and displayed in the configured timezone
 * and stored in UTC. No SLA or business-hours calendar is assumed. Reminder emails are not sent;
 * due/overdue views are computed live from the stored due time.
 */
import { and, asc, eq, isNull, lt, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { Db } from '../db/client';
import { followUp, quoteRequest, teamMember, user } from '../db/schema';
import { audit } from './audit';
import { DomainError } from './errors';
import { notifyFollowUpAssigned } from './notifications';
import { assertCan, can, requestScopeCondition, type Actor } from './policy';
import { isRequestId } from './requests';
import { parseLocalDateTime, zonedDayKey, zonedDayRange } from './time';
import { newId } from './util';

export async function addFollowUp(db: Db, actor: Actor, requestId: string, input: { action: string; dueLocal: string; assigneeId?: string | null }, tz: string) {
  const action = input.action.trim();
  if (!action || [...action].length > 200) throw new DomainError('validation', { field: 'action' });
  const dueAt = parseLocalDateTime(input.dueLocal, tz);
  if (!dueAt) throw new DomainError('validation', { field: 'due' });
  if (!isRequestId(requestId)) throw new DomainError('not_found');
  return db.transaction(async (tx) => {
    const [req] = await tx.select({ assigneeId: quoteRequest.assigneeId }).from(quoteRequest).where(eq(quoteRequest.id, requestId)).for('update');
    if (!req || !can(actor, 'request.view', req)) throw new DomainError('not_found');
    assertCan(actor, 'followup.manage', req);
    const assigneeId = input.assigneeId || actor.userId;
    if (assigneeId !== actor.userId) {
      const [m] = await tx.select({ role: teamMember.role, status: teamMember.status }).from(teamMember).where(eq(teamMember.userId, assigneeId)).limit(1);
      // The responsible person must be able to see the request.
      const sees = m && m.status === 'active' && (m.role === 'owner' || m.role === 'manager' || req.assigneeId === assigneeId);
      if (!sees) throw new DomainError('validation', { field: 'assignee' });
    }
    const id = newId();
    await tx.insert(followUp).values({ id, requestId, action, dueAt, assigneeId, createdBy: actor.userId });
    await tx.update(quoteRequest).set({ updatedAt: new Date() }).where(eq(quoteRequest.id, requestId));
    await audit(tx, { actorId: actor.userId, action: 'followup.added', category: 'request', requestId, entityId: id });
    await notifyFollowUpAssigned(tx, requestId, assigneeId, actor.userId);
    return { id };
  });
}

export async function closeFollowUp(db: Db, actor: Actor, id: string, outcome: 'completed' | 'cancelled') {
  return db.transaction(async (tx) => {
    const [f] = await tx
      .select({ id: followUp.id, requestId: followUp.requestId, completedAt: followUp.completedAt, cancelledAt: followUp.cancelledAt, assigneeId: quoteRequest.assigneeId })
      .from(followUp)
      .innerJoin(quoteRequest, eq(quoteRequest.id, followUp.requestId))
      .where(eq(followUp.id, id))
      .for('update');
    if (!f || !can(actor, 'request.view', f)) throw new DomainError('not_found');
    assertCan(actor, 'followup.manage', f);
    if (f.completedAt || f.cancelledAt) throw new DomainError('conflict');
    const now = new Date();
    await tx
      .update(followUp)
      .set(outcome === 'completed' ? { completedAt: now, completedBy: actor.userId } : { cancelledAt: now })
      .where(eq(followUp.id, id));
    await tx.update(quoteRequest).set({ updatedAt: now }).where(eq(quoteRequest.id, f.requestId));
    await audit(tx, { actorId: actor.userId, action: outcome === 'completed' ? 'followup.completed' : 'followup.cancelled', category: 'request', requestId: f.requestId, entityId: id });
    return { ok: true };
  });
}

/** Open follow-ups due before the end of today (overdue first), within the actor's scope. */
export async function dueFollowUps(db: Db, actor: Actor, tz: string, opts: { mine?: boolean; limit?: number } = {}) {
  const now = new Date();
  const todayEnd = zonedDayRange(zonedDayKey(now, tz), tz).end;
  const assignee = alias(user, 'fu_assignee');
  return db
    .select({
      id: followUp.id,
      action: followUp.action,
      dueAt: followUp.dueAt,
      requestId: quoteRequest.id,
      reference: quoteRequest.reference,
      company: quoteRequest.company,
      assigneeName: assignee.name,
    })
    .from(followUp)
    .innerJoin(quoteRequest, eq(quoteRequest.id, followUp.requestId))
    .leftJoin(assignee, eq(assignee.id, followUp.assigneeId))
    .where(
      and(
        isNull(followUp.completedAt),
        isNull(followUp.cancelledAt),
        lt(followUp.dueAt, todayEnd),
        eq(quoteRequest.disposition, 'active'),
        requestScopeCondition(actor),
        opts.mine ? eq(followUp.assigneeId, actor.userId) : undefined,
      ),
    )
    .orderBy(asc(followUp.dueAt))
    .limit(opts.limit ?? 10);
}

/** Open follow-ups due today or overdue, across everything the actor may view. */
export async function dueCount(db: Db, actor: Actor, tz: string) {
  const now = new Date();
  const todayEnd = zonedDayRange(zonedDayKey(now, tz), tz).end;
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(followUp)
    .innerJoin(quoteRequest, eq(quoteRequest.id, followUp.requestId))
    .where(and(isNull(followUp.completedAt), isNull(followUp.cancelledAt), lt(followUp.dueAt, todayEnd), eq(quoteRequest.disposition, 'active'), requestScopeCondition(actor)));
  return row?.n ?? 0;
}

export async function myDueCount(db: Db, actor: Actor, tz: string) {
  const now = new Date();
  const todayEnd = zonedDayRange(zonedDayKey(now, tz), tz).end;
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(followUp)
    .innerJoin(quoteRequest, eq(quoteRequest.id, followUp.requestId))
    .where(
      and(
        isNull(followUp.completedAt),
        isNull(followUp.cancelledAt),
        lt(followUp.dueAt, todayEnd),
        eq(followUp.assigneeId, actor.userId),
        eq(quoteRequest.disposition, 'active'),
        requestScopeCondition(actor),
      ),
    );
  return row?.n ?? 0;
}
