import 'server-only';
import { createHash } from 'node:crypto';
import { newId } from './store';

export type PreviewResult = { status: 'test'; reference: string };

export function hashPayload(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

/**
 * Preview adapter: the submission has been validated; nothing is sent or stored, and the
 * visitor sees a clearly labelled TEST- reference. Live submissions never come here: they are
 * stored in the dashboard database (src/server/admin/requests.ts, applications.ts).
 */
export function previewReceipt(): PreviewResult {
  const year = new Date().getUTCFullYear();
  return { status: 'test', reference: `TEST-${year}-${newId('', 3).toUpperCase()}` };
}
