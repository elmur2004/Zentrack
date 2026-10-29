/**
 * Isolated dashboard test server (used by tests/admin/playwright.admin.config.ts).
 * - Fresh embedded database under .data/e2e (synthetic data only; deleted on each start).
 * - Seeds fictional accounts and requests (random passwords → .data/e2e/credentials.json).
 * - Local TEST adapters: email outbox file directory, no external services contacted.
 * - Random per-run auth secret; serves the production build with `next start`.
 */
import { execSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const port = process.env.ADMIN_E2E_PORT ?? '3006';
const dir = '.data/e2e';
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

// Serve a private copy of the production build: pages regenerated at runtime (ISR) with this
// run's synthetic settings stay in .data/e2e and never reach the real .next output.
if (!existsSync('.next/BUILD_ID')) throw new Error('Run `npm run build` first.');
const distDir = `${dir}/next`;
cpSync('.next', distDir, { recursive: true, filter: (src) => !/^\.next[\\/](cache|dev|trace)([\\/]|$)/.test(src) });

const env = {
  ...process.env,
  NODE_ENV: 'production',
  FORM_MODE: 'live',
  DATABASE_URL: '',
  DATABASE_DRIVER: 'pglite',
  PGLITE_DATA_DIR: `${dir}/pglite`,
  EMAIL_TRANSPORT: 'outbox',
  OUTBOX_DIR: `${dir}/outbox`,
  FILE_SCAN_MODE: '',
  STORAGE_DRIVER: 'database',
  BETTER_AUTH_SECRET: randomBytes(32).toString('base64url'),
  BETTER_AUTH_URL: `http://localhost:${port}`,
  SITE_URL: '',
  AUTH_RATE_LIMIT_MAX: '500',
  ENQUIRY_RATE_LIMIT: '500',
  UPLOAD_RATE_LIMIT: '500',
  // The built-in scheduler stays off so the suite controls when jobs run.
  JOBS_SCHEDULER: 'off',
  SEED_CREDENTIALS_FILE: `${dir}/credentials.json`,
  ZENTRAC_DIST_DIR: distDir,
  JOBS_RUNNER_TOKEN: '',
};

// Optional: run against a LOCAL PostgreSQL test database instead of the embedded one.
// The database is emptied with the down migration, re-migrated, then seeded.
const pgUrl = process.env.ADMIN_E2E_DATABASE_URL?.trim();
if (pgUrl) {
  if (!/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(pgUrl)) throw new Error('ADMIN_E2E_DATABASE_URL must point to a local test database');
  const { default: pg } = await import('pg');
  const { readFileSync, readdirSync } = await import('node:fs');
  const client = new pg.Client({ connectionString: pgUrl });
  await client.connect();
  // Newest first. On an empty database the later scripts fail harmlessly (nothing to undo).
  for (const file of readdirSync('drizzle/down').filter((f) => f.endsWith('.down.sql')).sort().reverse()) {
    try {
      await client.query(readFileSync(`drizzle/down/${file}`, 'utf8'));
    } catch {
      await client.query('ROLLBACK').catch(() => {});
    }
  }
  await client.end();
  Object.assign(env, { DATABASE_URL: pgUrl, DATABASE_DRIVER: '', PGLITE_DATA_DIR: '' });
  execSync('npx tsx scripts/db-migrate.ts', { env: { ...env, NODE_ENV: 'test' }, stdio: 'inherit' });
}

execSync('npx tsx scripts/db-seed-test.ts', { env: { ...env, NODE_ENV: 'test' }, stdio: 'inherit' });

const next = require.resolve('next/dist/bin/next');
const child = spawn(process.execPath, [next, 'start', '-p', port], { env, stdio: 'inherit' });
const stop = () => child.kill();
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('exit', stop);
child.on('exit', (code) => process.exit(code ?? 0));
