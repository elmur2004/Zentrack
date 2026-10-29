/**
 * npm run db:migrate
 * Applies pending migrations from ./drizzle to the configured database (DATABASE_URL, or the
 * embedded PGlite database). Safe to run repeatedly. Never prints connection strings.
 */
import { closeDb, databaseDriver, runMigrations } from '../src/server/db/client';

async function main() {
  console.log(`Applying migrations (${databaseDriver()})…`);
  await runMigrations();
  await closeDb();
  console.log('✓ Database schema is up to date.');
}

main().catch((e) => {
  console.error('✗ Migration failed:', e instanceof Error ? e.message.replace(/postgres(ql)?:\/\/\S+/g, '[connection]') : e);
  process.exit(1);
});
