/**
 * Background work, run by the built-in scheduler (src/server/scheduler.ts), `npm run jobs:run`,
 * or POST /api/jobs/run from an external scheduler:
 *  - frequent: staff notification emails (retries), abandoned-upload clean-up, rate-limit sweep;
 *  - daily:    retention deletions (docs/open-decisions.md OD-25, stated in the privacy policy).
 * Every step is safe to repeat and to run on several instances at once.
 */
import type { Db } from './db/client';
import { cleanupAbandonedUploads } from './admin/files';
import { processNotificationJobs } from './admin/notifications';
import { applyRetention, sweepRateLimits, type RetentionResult } from './admin/retention';

export interface JobRunResult {
  notifications: { sent: number; failed: number; skipped: number };
  uploads: { removed: number; failed: number };
  rateLimits: number;
  retention?: RetentionResult;
}

export async function runFrequentJobs(db: Db, notificationLimit = 50): Promise<JobRunResult> {
  const notifications = await processNotificationJobs(db, notificationLimit);
  const uploads = await cleanupAbandonedUploads(db);
  const rateLimits = await sweepRateLimits(db);
  return { notifications, uploads, rateLimits };
}

export async function runAllJobs(db: Db, notificationLimit = 50): Promise<JobRunResult> {
  const frequent = await runFrequentJobs(db, notificationLimit);
  const retention = await applyRetention(db);
  return { ...frequent, retention };
}
