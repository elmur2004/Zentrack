import 'server-only';
import { randomBytes } from 'node:crypto';

/**
 * Process-local stores for the preview adapter, idempotency and rate limiting.
 * Single-instance only: production must replace these with shared storage (docs/deployment.md).
 * Kept on globalThis so development hot reloads do not reset them.
 */
interface UploadRecord {
  id: string;
  kind: 'attachment' | 'cv';
  size: number;
  type: string;
  createdAt: number;
}
interface IdemRecord {
  hash: string;
  status: number;
  body: unknown;
  createdAt: number;
}

const g = globalThis as unknown as {
  __zntUploads?: Map<string, UploadRecord>;
  __zntIdem?: Map<string, IdemRecord>;
  __zntRate?: Map<string, number[]>;
};
const uploads = (g.__zntUploads ??= new Map());
const idem = (g.__zntIdem ??= new Map());
const rate = (g.__zntRate ??= new Map());

const HOUR = 60 * 60 * 1000;

function sweep() {
  const now = Date.now();
  for (const [k, v] of uploads) if (now - v.createdAt > HOUR) uploads.delete(k);
  for (const [k, v] of idem) if (now - v.createdAt > 24 * HOUR) idem.delete(k);
}

export function newId(prefix: string, bytes = 9): string {
  return `${prefix}${randomBytes(bytes).toString('hex')}`;
}

export function registerUpload(rec: Omit<UploadRecord, 'id' | 'createdAt'>): UploadRecord {
  sweep();
  const full = { ...rec, id: newId('upl_'), createdAt: Date.now() };
  uploads.set(full.id, full);
  return full;
}

export function getUpload(id: string): UploadRecord | undefined {
  return uploads.get(id);
}

export function getIdempotent(key: string): IdemRecord | undefined {
  sweep();
  return idem.get(key);
}

export function setIdempotent(key: string, rec: Omit<IdemRecord, 'createdAt'>) {
  idem.set(key, { ...rec, createdAt: Date.now() });
}

let rateCalls = 0;

/** Sliding-window limiter: true if the request is allowed. Idle buckets are dropped regularly. */
export function allowRequest(bucket: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (++rateCalls % 200 === 0) {
    for (const [k, hits] of rate as Map<string, number[]>) if (!hits.length || now - hits[hits.length - 1] > Math.max(windowMs, HOUR)) rate.delete(k);
  }
  const hits = (rate.get(bucket) ?? []).filter((t: number) => now - t < windowMs);
  if (hits.length >= limit) {
    rate.set(bucket, hits);
    return false;
  }
  hits.push(now);
  rate.set(bucket, hits);
  return true;
}

export function resetStoresForTests() {
  uploads.clear();
  idem.clear();
  rate.clear();
}
