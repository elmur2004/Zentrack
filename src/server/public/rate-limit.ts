import 'server-only';
/**
 * Rate limiting for the public form endpoints (owner decision OD-20).
 * With a database configured the counters live in PostgreSQL (public_rate_limit), so the limit
 * holds across every server instance; the network address is stored only as a keyed hash and
 * the rows are swept after RETENTION.rateLimitHours. Without a database (preview builds) the
 * process-local limiter is used. A database error never blocks a visitor: it falls back to the
 * process-local limiter.
 */
import { createHmac } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { getFormMode } from '@/lib/forms/config';
import { allowRequest } from '@/lib/server/store';
import { databaseConfigured, getDb } from '../db/client';
import { publicRateLimit } from '../db/schema';

function bucketKey(bucket: string): string {
  const secret = process.env.BETTER_AUTH_SECRET?.trim() || (globalThis as { __zntEphemeralSecret?: string }).__zntEphemeralSecret || 'zentrac-rate-limit';
  return createHmac('sha256', `${secret}:rate-limit`).update(bucket).digest('base64url').slice(0, 32);
}

export async function allowPublicRequest(bucket: string, limit: number, windowMs: number): Promise<boolean> {
  // Preview mode stores nothing, so it keeps the process-local limiter.
  if (!databaseConfigured() || getFormMode() !== 'live') return allowRequest(bucket, limit, windowMs);
  try {
    const db = await getDb();
    const now = Date.now();
    const windowStart = now - (now % windowMs);
    const [row] = await db
      .insert(publicRateLimit)
      .values({ bucket: bucketKey(bucket), windowStart, count: 1 })
      .onConflictDoUpdate({
        target: publicRateLimit.bucket,
        set: {
          count: sql`case when ${publicRateLimit.windowStart} = ${windowStart} then ${publicRateLimit.count} + 1 else 1 end`,
          windowStart: sql`${windowStart}`,
        },
      })
      .returning({ count: publicRateLimit.count });
    return (row?.count ?? 1) <= limit;
  } catch (e) {
    console.error('[rate-limit] shared counter unavailable', e instanceof Error ? e.name : typeof e);
    return allowRequest(bucket, limit, windowMs);
  }
}
