/**
 * npm run jobs:run
 * Runs every background job once: staff notifications, abandoned-upload clean-up, rate-limit
 * sweep and retention deletions. The production server already runs these on its built-in
 * scheduler (JOBS_SCHEDULER, src/server/scheduler.ts); use this for maintenance or an external cron.
 */
import { closeDb, getDb } from '../src/server/db/client';
import { runAllJobs } from '../src/server/jobs';

async function main() {
  const db = await getDb();
  const r = await runAllJobs(db, 100);
  await closeDb();
  console.log(`Notifications: sent ${r.notifications.sent}, failed ${r.notifications.failed}, skipped ${r.notifications.skipped}.`);
  console.log(`Abandoned uploads removed: ${r.uploads.removed}${r.uploads.failed ? ` (${r.uploads.failed} could not be removed)` : ''}.`);
  console.log(`Expired form-protection counters removed: ${r.rateLimits}.`);
  if (r.retention) console.log(`Retention: ${r.retention.requests} quote request(s) and ${r.retention.applications} partner/career record(s) deleted${r.retention.failed ? `, ${r.retention.failed} failed` : ''}.`);
}

main().catch((e) => {
  console.error('✗ Job run failed:', e instanceof Error ? e.name : e);
  process.exit(1);
});
