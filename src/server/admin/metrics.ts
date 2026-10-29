/**
 * Overview metrics (spec 04 §14). Definitions are documented in docs/quote-workflow.md.
 * - Every count is of unique request IDs (services never multiply a request).
 * - Spam is excluded from every metric except the separate "marked as spam" figure.
 * - Current-state counts cover active (non-archived, non-spam) requests.
 * - Period counts use [start, end) instants of local days in the configured timezone.
 * - All queries are restricted to what the viewer may see.
 */
import { and, desc, eq, gte, inArray, isNull, lt, ne, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { Db } from '../db/client';
import { assignmentEvent, quoteRequest, requestService, statusEvent, user } from '../db/schema';
import { STATUSES, type RequestStatus } from '@/lib/admin/codes';
import { requestScopeCondition, type Actor } from './policy';
import { windowRange, zonedDayKey } from './time';
import { OPEN_STATUSES } from './workflow';

const count = sql<number>`count(*)::int`;

function dayKeys(start: Date, days: number, tz: string): string[] {
  const first = zonedDayKey(start, tz);
  const [y, m, d] = first.split('-').map(Number);
  return Array.from({ length: days }, (_, i) => {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
  });
}

export async function overviewMetrics(db: Db, actor: Actor, days: number, tz: string, now = new Date()) {
  const scope = requestScopeCondition(actor);
  const { start, end } = windowRange(days, now, tz);
  const active = and(eq(quoteRequest.disposition, 'active'), scope);
  const notSpam = and(ne(quoteRequest.disposition, 'spam'), scope);
  const createdIn = and(gte(quoteRequest.createdAt, start), lt(quoteRequest.createdAt, end));

  const byStatus = await db.select({ status: quoteRequest.status, n: count }).from(quoteRequest).where(active).groupBy(quoteRequest.status);
  const current = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<RequestStatus, number>;
  for (const r of byStatus) current[r.status] = r.n;
  const [{ n: unassigned }] = await db.select({ n: count }).from(quoteRequest).where(and(active, isNull(quoteRequest.assigneeId), inArray(quoteRequest.status, OPEN_STATUSES)));
  const [{ n: archived }] = await db.select({ n: count }).from(quoteRequest).where(and(eq(quoteRequest.disposition, 'archived'), scope));

  const [{ n: received }] = await db.select({ n: count }).from(quoteRequest).where(and(notSpam, createdIn));
  const [{ n: quotesSent }] = await db
    .select({ n: sql<number>`count(distinct ${statusEvent.requestId})::int` })
    .from(statusEvent)
    .innerJoin(quoteRequest, eq(quoteRequest.id, statusEvent.requestId))
    .where(and(eq(statusEvent.toStatus, 'quote_sent'), gte(statusEvent.createdAt, start), lt(statusEvent.createdAt, end), notSpam));
  const outcomeIn = (s: RequestStatus) => and(eq(quoteRequest.status, s), gte(quoteRequest.statusChangedAt, start), lt(quoteRequest.statusChangedAt, end), notSpam);
  const [{ n: won }] = await db.select({ n: count }).from(quoteRequest).where(outcomeIn('won'));
  const [{ n: lost }] = await db.select({ n: count }).from(quoteRequest).where(outcomeIn('lost'));
  const [{ n: spam }] = await db
    .select({ n: count })
    .from(quoteRequest)
    .where(and(eq(quoteRequest.disposition, 'spam'), gte(quoteRequest.dispositionAt, start), lt(quoteRequest.dispositionAt, end), scope));

  // Volume per local day (bucketed in the configured zone).
  const created = await db.select({ at: quoteRequest.createdAt }).from(quoteRequest).where(and(notSpam, createdIn)).limit(50000);
  const keys = dayKeys(start, days, tz);
  const perDay = new Map(keys.map((k) => [k, 0]));
  for (const r of created) {
    const k = zonedDayKey(r.at, tz);
    if (perDay.has(k)) perDay.set(k, (perDay.get(k) ?? 0) + 1);
  }

  const services = await db
    .select({ id: requestService.serviceId, n: sql<number>`count(distinct ${requestService.requestId})::int` })
    .from(requestService)
    .innerJoin(quoteRequest, eq(quoteRequest.id, requestService.requestId))
    .where(and(notSpam, createdIn))
    .groupBy(requestService.serviceId)
    .orderBy(desc(sql`2`));
  const countries = await db
    .select({ code: quoteRequest.countryCode, n: count })
    .from(quoteRequest)
    .where(and(notSpam, createdIn))
    .groupBy(quoteRequest.countryCode)
    .orderBy(desc(sql`2`))
    .limit(10);

  return {
    window: { days, start: start.toISOString(), end: end.toISOString(), timezone: tz, firstDay: keys[0], lastDay: keys[keys.length - 1] },
    current: { ...current, unassigned, archived },
    period: { received, quotesSent, won, lost, spam },
    volume: keys.map((day) => ({ day, count: perDay.get(day) ?? 0 })),
    services,
    countries,
  };
}

export type OverviewMetrics = Awaited<ReturnType<typeof overviewMetrics>>;

/** Newest requests needing attention: still new, or open and unassigned. */
export async function attentionList(db: Db, actor: Actor, limit = 6) {
  return db
    .select({ id: quoteRequest.id, reference: quoteRequest.reference, company: quoteRequest.company, createdAt: quoteRequest.createdAt, status: quoteRequest.status, assigneeId: quoteRequest.assigneeId })
    .from(quoteRequest)
    .where(
      and(
        eq(quoteRequest.disposition, 'active'),
        requestScopeCondition(actor),
        inArray(quoteRequest.status, OPEN_STATUSES),
        or(eq(quoteRequest.status, 'new'), isNull(quoteRequest.assigneeId)),
      ),
    )
    .orderBy(desc(quoteRequest.createdAt), desc(quoteRequest.id))
    .limit(limit);
}

/** Latest workflow events within the viewer's scope. */
export async function recentActivity(db: Db, actor: Actor, limit = 10) {
  const scope = requestScopeCondition(actor);
  const actorUser = alias(user, 'act');
  const toUser = alias(user, 'to_user');
  const statuses = await db
    .select({ id: statusEvent.id, at: statusEvent.createdAt, requestId: quoteRequest.id, reference: quoteRequest.reference, from: statusEvent.fromStatus, to: statusEvent.toStatus, actorName: actorUser.name })
    .from(statusEvent)
    .innerJoin(quoteRequest, eq(quoteRequest.id, statusEvent.requestId))
    .leftJoin(actorUser, eq(actorUser.id, statusEvent.actorId))
    .where(and(ne(quoteRequest.disposition, 'spam'), scope))
    .orderBy(desc(statusEvent.createdAt))
    .limit(limit);
  const assignments = await db
    .select({ id: assignmentEvent.id, at: assignmentEvent.createdAt, requestId: quoteRequest.id, reference: quoteRequest.reference, toName: toUser.name, actorName: actorUser.name })
    .from(assignmentEvent)
    .innerJoin(quoteRequest, eq(quoteRequest.id, assignmentEvent.requestId))
    .leftJoin(actorUser, eq(actorUser.id, assignmentEvent.actorId))
    .leftJoin(toUser, eq(toUser.id, assignmentEvent.toUserId))
    .where(and(ne(quoteRequest.disposition, 'spam'), scope))
    .orderBy(desc(assignmentEvent.createdAt))
    .limit(limit);
  return [
    ...statuses.map((s) => ({ kind: s.from ? ('status' as const) : ('received' as const), ...s, toName: null as string | null })),
    ...assignments.map((a) => ({ kind: 'assigned' as const, ...a, from: null as string | null, to: null as string | null })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit);
}
