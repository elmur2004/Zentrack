/**
 * Permissioned CSV export (spec 04 §15).
 * - Owner/manager only; scope is either explicitly selected IDs or the current filter (bounded).
 * - Default columns exclude personal contact data; contact/email/phone/description are explicit
 *   opt-ins. Internal notes, audit data and files are never exported.
 * - UTF-8 with BOM (Arabic opens correctly in spreadsheet tools), RFC 4180 quoting, CRLF rows,
 *   and spreadsheet formula-injection neutralisation for every user-supplied cell.
 * - Generated per request and streamed; no stored file or public URL. The audit entry records
 *   scope, count and columns only — never the data.
 */
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { Db } from '../db/client';
import { quoteRequest, user } from '../db/schema';
import { EXPORT_OPTIONAL_FIELDS, type ExportOptionalField } from '@/lib/admin/codes';
import type { ListQuery } from '@/lib/admin/query';
import { countryLabel, isoLocal, scopeLabel, serviceLabel } from '@/lib/admin/labels';
import { getAdminMessages } from '@/i18n/admin';
import { audit } from './audit';
import { DomainError } from './errors';
import { assertCan, can, type Actor } from './policy';
import { isRequestId, matchingRequestIds } from './requests';

export const EXPORT_MAX_ROWS = 5000;

/** Neutralises cells a spreadsheet could interpret as a formula, then applies CSV quoting. */
export function csvCell(value: string | number | null | undefined): string {
  let v = value == null ? '' : String(value);
  if (/^[=+\-@\t\r|%＝＋－＠]/.test(v) || /^[\s ]+[=+\-@|%＝＋－＠]/.test(v)) v = `'${v}`;
  return `"${v.replace(/"/g, '""')}"`;
}

export function csvRow(cells: Array<string | number | null | undefined>): string {
  return cells.map(csvCell).join(',');
}

export interface ExportInput {
  scope: 'selected' | 'filtered';
  ids?: string[];
  query?: ListQuery;
  include: string[];
  language: 'en' | 'ar';
}

async function resolveIds(db: Db, actor: Actor, input: ExportInput, tz: string): Promise<string[]> {
  if (input.scope === 'selected') {
    const ids = [...new Set((input.ids ?? []).filter(isRequestId))];
    if (!ids.length) throw new DomainError('validation', { field: 'selection' });
    if (ids.length > EXPORT_MAX_ROWS) throw new DomainError('validation', { field: 'selection', code: 'too_many' });
    return ids;
  }
  if (!input.query) throw new DomainError('validation', { field: 'query' });
  const { ids, truncated } = await matchingRequestIds(db, actor, input.query, tz, EXPORT_MAX_ROWS);
  if (truncated) throw new DomainError('validation', { field: 'selection', code: 'too_many' });
  return ids;
}

/** Count shown in the confirmation dialog before anything is generated. */
export async function previewExport(db: Db, actor: Actor, input: ExportInput, tz: string) {
  assertCan(actor, 'request.export');
  const ids = await resolveIds(db, actor, input, tz);
  const rows = await db.select({ assigneeId: quoteRequest.assigneeId }).from(quoteRequest).where(inArray(quoteRequest.id, ids));
  return { count: rows.filter((r) => can(actor, 'request.view', r)).length };
}

export async function buildExport(db: Db, actor: Actor, input: ExportInput, tz: string) {
  assertCan(actor, 'request.export');
  const include = input.include.filter((f): f is ExportOptionalField => (EXPORT_OPTIONAL_FIELDS as readonly string[]).includes(f));
  const ids = await resolveIds(db, actor, input, tz);
  const lang = input.language;
  const t = getAdminMessages(lang);
  const assignee = alias(user, 'assignee');
  const rows = await db
    .select({
      id: quoteRequest.id,
      reference: quoteRequest.reference,
      createdAt: quoteRequest.createdAt,
      status: quoteRequest.status,
      disposition: quoteRequest.disposition,
      countryCode: quoteRequest.countryCode,
      company: quoteRequest.company,
      contactName: quoteRequest.contactName,
      email: quoteRequest.email,
      phone: quoteRequest.phone,
      submissionLocale: quoteRequest.submissionLocale,
      engagementScope: quoteRequest.engagementScope,
      description: quoteRequest.description,
      assigneeId: quoteRequest.assigneeId,
      assigneeName: assignee.name,
      services: sql<string[]>`coalesce((select array_agg(rs.service_id order by rs.service_id) from request_service rs where rs.request_id = ${quoteRequest.id}), '{}')`,
    })
    .from(quoteRequest)
    .leftJoin(assignee, eq(assignee.id, quoteRequest.assigneeId))
    .where(and(inArray(quoteRequest.id, ids)))
    .orderBy(desc(quoteRequest.createdAt), desc(quoteRequest.id));
  const permitted = rows.filter((r) => can(actor, 'request.view', r));

  const c = t.export.columns;
  const header = [c.reference, `${c.received} (${tz})`, c.status, c.disposition, c.services, c.country, c.company];
  if (include.includes('contact')) header.push(c.contact);
  if (include.includes('email')) header.push(c.email);
  if (include.includes('phone')) header.push(c.phone);
  header.push(c.language, c.scope, c.assignee);
  if (include.includes('description')) header.push(c.description);

  const lines = [csvRow(header)];
  for (const r of permitted) {
    const cells: Array<string | null> = [
      r.reference,
      isoLocal(r.createdAt, tz),
      t.status[r.status],
      t.disposition[r.disposition],
      r.services.map((s) => serviceLabel(lang, s)).join('; '),
      `${countryLabel(lang, r.countryCode)} (${r.countryCode})`,
      r.company,
    ];
    if (include.includes('contact')) cells.push(r.contactName);
    if (include.includes('email')) cells.push(r.email);
    if (include.includes('phone')) cells.push(r.phone ?? '');
    cells.push(t.languages[r.submissionLocale], scopeLabel(lang, r.engagementScope), r.assigneeName ?? t.common.unassigned);
    if (include.includes('description')) cells.push(r.description);
    lines.push(csvRow(cells));
  }
  const csv = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(lines.join('\r\n') + '\r\n', 'utf8')]);

  const q = input.query;
  await audit(db, {
    actorId: actor.userId,
    action: 'export.created',
    category: 'export',
    metadata: {
      scope: input.scope,
      count: permitted.length,
      columns: include,
      language: lang,
      // Non-sensitive filter summary only (no search text).
      filters: q
        ? { view: q.view, status: q.status, service: q.service, country: q.country, assignee: q.assignee ? 'set' : '', lang: q.lang, from: q.from, to: q.to, followUp: q.followUp, search: q.q ? 'yes' : 'no' }
        : null,
    },
  });
  const stamp = new Date().toISOString().slice(0, 10);
  return { filename: `zentrac-quote-requests-${stamp}.csv`, csv, count: permitted.length };
}
