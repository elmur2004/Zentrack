/**
 * Built-in scheduler (owner decision OD-27): runs inside the Node.js server started by
 * `next start`, so no external cron is required.
 *
 *   JOBS_SCHEDULER=internal  (default in production when a database is configured)
 *   JOBS_SCHEDULER=off       (disable, e.g. when an external scheduler calls POST /api/jobs/run,
 *                             or on isolated test servers)
 *
 * Every 5 minutes: notifications, abandoned uploads, rate-limit sweep. Every 24 hours (first run
 * 10 minutes after start): retention. Overlapping runs are skipped. Errors are logged by class
 * name only (never payloads).
 */
import { databaseConfigured, getDb } from './db/client';
import { runFrequentJobs } from './jobs';
import { applyRetention } from './admin/retention';

const FREQUENT_MS = 5 * 60 * 1000;
const DAILY_MS = 24 * 60 * 60 * 1000;
const FIRST_DAILY_MS = 10 * 60 * 1000;

const g = globalThis as unknown as { __zntScheduler?: { frequent: ReturnType<typeof setInterval>; daily: ReturnType<typeof setTimeout> } };

export function schedulerMode(): 'internal' | 'off' {
  const v = process.env.JOBS_SCHEDULER?.trim().toLowerCase();
  if (v === 'off' || v === 'external') return 'off';
  if (v === 'internal') return 'internal';
  return process.env.NODE_ENV === 'production' ? 'internal' : 'off';
}

function guarded(name: string, fn: () => Promise<unknown>) {
  let running = false;
  return async () => {
    if (running) return;
    running = true;
    try {
      await fn();
    } catch (e) {
      console.error(`[scheduler] ${name} failed`, e instanceof Error ? e.name : typeof e);
    } finally {
      running = false;
    }
  };
}

export function startInternalScheduler(): boolean {
  if (g.__zntScheduler || schedulerMode() !== 'internal' || !databaseConfigured()) return false;
  const frequent = guarded('frequent jobs', async () => runFrequentJobs(await getDb()));
  const retention = guarded('retention', async () => applyRetention(await getDb()));
  const frequentTimer = setInterval(frequent, FREQUENT_MS);
  frequentTimer.unref?.();
  const dailyTimer = setTimeout(function daily() {
    void retention();
    const next = setTimeout(daily, DAILY_MS);
    next.unref?.();
    if (g.__zntScheduler) g.__zntScheduler.daily = next;
  }, FIRST_DAILY_MS);
  dailyTimer.unref?.();
  g.__zntScheduler = { frequent: frequentTimer, daily: dailyTimer };
  return true;
}
