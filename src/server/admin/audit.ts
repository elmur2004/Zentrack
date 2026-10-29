import { and, desc, eq, inArray, lt, sql } from 'drizzle-orm';
import type { DbOrTx } from '../db/client';
import { auditEvent, user } from '../db/schema';
import { DomainError } from './errors';
import { scopeOf, type Actor } from './policy';
import { newId } from './util';

export type AuditCategory = 'request' | 'application' | 'file' | 'communication' | 'team' | 'settings' | 'export' | 'auth';
type Category = AuditCategory;

/** Records an administrative action. Metadata must never include bodies, files, URLs or secrets. */
export async function audit(
  db: DbOrTx,
  e: {
    actorId: string | null;
    action: string;
    category: Category;
    requestId?: string | null;
    applicationId?: string | null;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  await db.insert(auditEvent).values({
    id: newId(),
    actorId: e.actorId,
    action: e.action,
    category: e.category,
    requestId: e.requestId ?? null,
    applicationId: e.applicationId ?? null,
    entityId: e.entityId ?? null,
    metadata: e.metadata ?? {},
  });
}

export const OPERATIONAL_AUDIT: Category[] = ['request', 'application', 'file', 'communication', 'export'];
const OPERATIONAL = OPERATIONAL_AUDIT;

/** Owners see everything; managers see the operational subset (no team/settings/auth events). */
export async function listAudit(db: DbOrTx, actor: Actor, opts: { before?: Date; limit?: number; category?: Category }) {
  const scope = scopeOf(actor, 'audit.view');
  if (scope === 'none') throw new DomainError('forbidden');
  const conds = [];
  if (scope === 'operational') conds.push(inArray(auditEvent.category, OPERATIONAL));
  if (opts.category) conds.push(eq(auditEvent.category, opts.category));
  if (opts.before) conds.push(lt(auditEvent.createdAt, opts.before));
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  return db
    .select({
      id: auditEvent.id,
      action: auditEvent.action,
      category: auditEvent.category,
      requestId: auditEvent.requestId,
      applicationId: auditEvent.applicationId,
      entityId: auditEvent.entityId,
      metadata: auditEvent.metadata,
      createdAt: auditEvent.createdAt,
      actorName: user.name,
      reference: sql<string | null>`coalesce((select reference from quote_request q where q.id = ${auditEvent.requestId}), (select reference from application a where a.id = ${auditEvent.applicationId}))`,
    })
    .from(auditEvent)
    .leftJoin(user, eq(user.id, auditEvent.actorId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(auditEvent.createdAt), desc(auditEvent.id))
    .limit(limit);
}
