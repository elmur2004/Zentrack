import { defineConfig } from 'drizzle-kit';

/** Generates SQL migrations from src/server/db/schema.ts into ./drizzle (PostgreSQL dialect). */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  strict: true,
  verbose: true,
});
