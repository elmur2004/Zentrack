/**
 * Retention (owner decision 28 Oct 2026, OD-25; stated in the approved privacy policy).
 *
 *  - Quote requests: deleted RETENTION.quoteMonths after the last activity on them. Requests
 *    marked Won (an engagement followed) and requests with an open follow-up are kept until an
 *    owner deletes them deliberately.
 *  - Partner enquiries: RETENTION.partnerMonths after the last activity.
 *  - Career applications (and any CV): RETENTION.careerMonths after the last activity.
 *  - Anything marked as spam: RETENTION.spamDays after it was marked.
 *  - Abandoned uploads (never submitted): see cleanupAbandonedUploads (24 hours).
 *
 * "Last activity" is the record's updated_at, which every staff action (status, note, message,
 * follow-up, file, assignment) moves forward. Deletions run in small batches, remove the files
 * from private storage, and leave an audit entry with the reference only (actor: system).
 */
import { and, asc, eq, exists, lt, ne, not, or, sql } from 'drizzle-orm';
import { monthsBefore, RETENTION } from '@/lib/legal';
import type { Db } from '../db/client';
import { application, followUp, publicRateLimit, quoteRequest } from '../db/schema';
import { removeApplication } from './applications';
import { removeRequest } from './requests';

const DAY = 24 * 60 * 60 * 1000;

function cutoffs(now: Date) {
  return {
    quote: monthsBefore(now, RETENTION.quoteMonths),
    partner: monthsBefore(now, RETENTION.partnerMonths),
    career: monthsBefore(now, RETENTION.careerMonths),
    spam: new Date(now.getTime() - RETENTION.spamDays * DAY),
  };
}

const openFollowUp = () =>
  exists(
    sql`(select 1 from ${followUp} where ${followUp.requestId} = ${quoteRequest.id} and ${followUp.completedAt} is null and ${followUp.cancelledAt} is null)`,
  );

function expiredRequests(now: Date) {
  const c = cutoffs(now);
  return or(
    and(eq(quoteRequest.disposition, 'spam'), lt(quoteRequest.dispositionAt, c.spam)),
    and(ne(quoteRequest.status, 'won'), lt(quoteRequest.updatedAt, c.quote), not(openFollowUp())),
  );
}

function expiredApplications(now: Date) {
  const c = cutoffs(now);
  return or(
    and(eq(application.disposition, 'spam'), lt(application.dispositionAt, c.spam)),
    and(eq(application.kind, 'partner'), lt(application.updatedAt, c.partner)),
    and(eq(application.kind, 'career'), lt(application.updatedAt, c.career)),
  );
}

export interface RetentionResult {
  requests: number;
  applications: number;
  failed: number;
}

/** Deletes records whose retention period has ended. Safe to run repeatedly and concurrently. */
export async function applyRetention(db: Db, now = new Date(), batch = 50): Promise<RetentionResult> {
  const result: RetentionResult = { requests: 0, applications: 0, failed: 0 };
  const requests = await db
    .select({ id: quoteRequest.id, reference: quoteRequest.reference })
    .from(quoteRequest)
    .where(expiredRequests(now))
    .orderBy(asc(quoteRequest.updatedAt))
    .limit(batch);
  for (const r of requests) {
    try {
      // Re-check inside the delete path: the record may have changed since it was selected.
      const [still] = await db.select({ id: quoteRequest.id }).from(quoteRequest).where(and(eq(quoteRequest.id, r.id), expiredRequests(now))).limit(1);
      if (!still) continue;
      await removeRequest(db, r, null, 'retention');
      result.requests += 1;
    } catch {
      result.failed += 1;
    }
  }
  const apps = await db
    .select({ id: application.id, reference: application.reference, kind: application.kind })
    .from(application)
    .where(expiredApplications(now))
    .orderBy(asc(application.updatedAt))
    .limit(batch);
  for (const a of apps) {
    try {
      const [still] = await db.select({ id: application.id }).from(application).where(and(eq(application.id, a.id), expiredApplications(now))).limit(1);
      if (!still) continue;
      await removeApplication(db, a, null, 'retention');
      result.applications += 1;
    } catch {
      result.failed += 1;
    }
  }
  return result;
}

/** Counts for the Settings page: due now, and due within the next `days` days. */
export async function retentionForecast(db: Db, now = new Date(), days = 30) {
  const later = new Date(now.getTime() + days * DAY);
  const requests = async (at: Date) => (await db.select({ n: sql<number>`count(*)::int` }).from(quoteRequest).where(expiredRequests(at)))[0]?.n ?? 0;
  const apps = async (at: Date) => (await db.select({ n: sql<number>`count(*)::int` }).from(application).where(expiredApplications(at)))[0]?.n ?? 0;
  return {
    dueNow: (await requests(now)) + (await apps(now)),
    dueSoon: (await requests(later)) + (await apps(later)),
  };
}

/** Form-protection counters older than RETENTION.rateLimitHours. */
export async function sweepRateLimits(db: Db, now = Date.now()) {
  const cutoff = now - RETENTION.rateLimitHours * 60 * 60 * 1000;
  const deleted = await db.delete(publicRateLimit).where(lt(publicRateLimit.windowStart, cutoff)).returning({ bucket: publicRateLimit.bucket });
  return deleted.length;
}

