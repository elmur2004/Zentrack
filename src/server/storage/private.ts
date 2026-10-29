/**
 * Private file storage. Server-only.
 *
 *  STORAGE_DRIVER=database   (default) bytes live in the `file_blob` table of the configured
 *                            database: private by default, transactional, backed up with the data.
 *  STORAGE_DRIVER=filesystem bytes live under PRIVATE_STORAGE_DIR (default .data/private), which
 *                            must be a persistent volume outside the web root.
 *
 * Objects are addressed only by generated keys; original filenames are display metadata.
 * Nothing here ever produces a public URL.
 */
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { DbOrTx } from '../db/client';
import { fileBlob } from '../db/schema';

export type StorageDriver = 'database' | 'filesystem';

export function storageDriver(): StorageDriver {
  return process.env.STORAGE_DRIVER?.trim() === 'filesystem' ? 'filesystem' : 'database';
}

/** Random, path-safe key (never derived from the uploaded filename). */
export function newStorageKey(): string {
  return `obj_${randomBytes(20).toString('hex')}`;
}

const KEY_RE = /^obj_[a-f0-9]{40}$/;

function baseDir(): string {
  const dir = resolve(/*turbopackIgnore: true*/ process.env.PRIVATE_STORAGE_DIR?.trim() || '.data/private');
  const publicDir = resolve(/*turbopackIgnore: true*/ 'public');
  const rel = relative(publicDir, dir);
  if (rel === '' || (!rel.startsWith('..') && !rel.startsWith(sep) && !/^[a-zA-Z]:/.test(rel))) {
    throw new Error('PRIVATE_STORAGE_DIR must not be inside the public web root');
  }
  return dir;
}

function pathFor(key: string): string {
  if (!KEY_RE.test(key)) throw new Error('invalid storage key');
  return join(/*turbopackIgnore: true*/ baseDir(), key.slice(4, 6), key);
}

export async function putObject(db: DbOrTx, key: string, bytes: Buffer): Promise<void> {
  if (storageDriver() === 'database') {
    await db.insert(fileBlob).values({ storageKey: key, bytes });
    return;
  }
  const p = pathFor(key);
  await mkdir(/*turbopackIgnore: true*/ join(/*turbopackIgnore: true*/ p, '..'), { recursive: true });
  await writeFile(/*turbopackIgnore: true*/ p, bytes, { flag: 'wx', mode: 0o600 });
}

export async function getObject(db: DbOrTx, key: string): Promise<Buffer | null> {
  if (storageDriver() === 'database') {
    const [row] = await db.select({ bytes: fileBlob.bytes }).from(fileBlob).where(eq(fileBlob.storageKey, key)).limit(1);
    return row?.bytes ?? null;
  }
  try {
    return await readFile(/*turbopackIgnore: true*/ pathFor(key));
  } catch {
    return null;
  }
}

/** Deletes the object and verifies it is gone. Returns true only when deletion was confirmed. */
export async function deleteObject(db: DbOrTx, key: string): Promise<boolean> {
  if (storageDriver() === 'database') {
    await db.delete(fileBlob).where(eq(fileBlob.storageKey, key));
    const [left] = await db.select({ k: fileBlob.storageKey }).from(fileBlob).where(eq(fileBlob.storageKey, key)).limit(1);
    return !left;
  }
  const p = pathFor(key);
  await rm(/*turbopackIgnore: true*/ p, { force: true });
  try {
    await stat(/*turbopackIgnore: true*/ p);
    return false;
  } catch {
    return true;
  }
}
