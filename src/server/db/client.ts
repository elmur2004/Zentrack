/**
 * Database access. Server-only (never import from client components).
 *
 *  - DATABASE_URL set      → PostgreSQL through node-postgres (production / staging).
 *  - otherwise             → embedded PGlite (PostgreSQL compiled to WASM):
 *                            PGLITE_DATA_DIR (default .data/pglite) for local use,
 *                            PGLITE_DATA_DIR=memory for isolated tests.
 *
 * PGlite databases are migrated automatically on first use. PostgreSQL is migrated explicitly
 * with `npm run db:migrate` (never implicitly in production).
 */
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { drizzle as drizzlePg, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from './schema';

export type Db = NodePgDatabase<typeof schema>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export type DbOrTx = Db | Tx;

interface Handle {
  db: Db;
  driver: 'postgres' | 'pglite';
  ready: Promise<void>;
  close: () => Promise<void>;
}

const g = globalThis as unknown as { __zntDb?: Handle };

export function migrationsFolder(): string {
  return resolve(/*turbopackIgnore: true*/ process.env.DRIZZLE_MIGRATIONS_DIR ?? join(/*turbopackIgnore: true*/ process.cwd(), 'drizzle'));
}

export function databaseDriver(): 'postgres' | 'pglite' {
  return process.env.DATABASE_URL?.trim() ? 'postgres' : 'pglite';
}

function createHandle(): Handle {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    const pool = new Pool({ connectionString: url, max: Number(process.env.DATABASE_POOL_MAX ?? 10) });
    const db = drizzlePg(pool, { schema });
    return { db, driver: 'postgres', ready: Promise.resolve(), close: () => pool.end() };
  }
  const dir = process.env.PGLITE_DATA_DIR?.trim() || '.data/pglite';
  let client: PGlite;
  if (dir === 'memory') {
    client = new PGlite();
  } else {
    const abs = resolve(/*turbopackIgnore: true*/ dir);
    if (!existsSync(/*turbopackIgnore: true*/ abs)) mkdirSync(/*turbopackIgnore: true*/ abs, { recursive: true });
    client = new PGlite(/*turbopackIgnore: true*/ abs);
  }
  const db = drizzlePglite(client, { schema }) as unknown as Db;
  const ready = migratePglite(drizzlePglite(client, { schema }), { migrationsFolder: migrationsFolder() });
  return { db, driver: 'pglite', ready, close: () => client.close() };
}

/** Returns the shared database (creating and, for PGlite, migrating it on first use). */
export async function getDb(): Promise<Db> {
  if (!g.__zntDb) g.__zntDb = createHandle();
  await g.__zntDb.ready;
  return g.__zntDb.db;
}

/** Synchronous handle for libraries that need the instance at construction (await `ready` before use). */
export function getDbHandleSync(): Handle {
  if (!g.__zntDb) g.__zntDb = createHandle();
  return g.__zntDb;
}

export async function closeDb(): Promise<void> {
  const h = g.__zntDb;
  g.__zntDb = undefined;
  if (h) await h.close();
}

/** Explicit migration for PostgreSQL deployments (`npm run db:migrate`). */
export async function runMigrations(): Promise<void> {
  const h = g.__zntDb ?? (g.__zntDb = createHandle());
  if (h.driver === 'postgres') await migratePg(h.db, { migrationsFolder: migrationsFolder() });
  else await h.ready;
}

/** True when a database is configured or the local embedded database is allowed. */
export function databaseConfigured(): boolean {
  if (process.env.DATABASE_URL?.trim()) return true;
  return process.env.DATABASE_DRIVER?.trim() === 'pglite';
}
