/**
 * Runs once when a Next.js server instance starts. Starts the built-in job scheduler on the
 * Node.js runtime (never during `next build`, never on the Edge runtime). See src/server/scheduler.ts.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  const { startInternalScheduler } = await import('./server/scheduler');
  startInternalScheduler();
}
