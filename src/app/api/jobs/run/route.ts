import { timingSafeEqual } from 'node:crypto';
import { databaseConfigured, getDb } from '@/server/db/client';
import { runAllJobs } from '@/server/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Optional external scheduler entry point (the built-in scheduler normally does this work):
 *   POST /api/jobs/run   Authorization: Bearer <JOBS_RUNNER_TOKEN>
 * Processes queued staff notifications, removes abandoned (never submitted) uploads, sweeps
 * form-protection counters and applies the retention periods.
 * Disabled (404) unless JOBS_RUNNER_TOKEN is configured.
 */
export async function POST(request: Request) {
  const expected = process.env.JOBS_RUNNER_TOKEN?.trim();
  const headers = { 'content-type': 'application/json', 'cache-control': 'no-store' };
  if (!expected || expected.length < 32 || !databaseConfigured()) return new Response(JSON.stringify({ code: 'not_found' }), { status: 404, headers });
  const given = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return new Response(JSON.stringify({ code: 'forbidden' }), { status: 403, headers });
  const result = await runAllJobs(await getDb(), 50);
  return new Response(JSON.stringify(result), { status: 200, headers });
}
