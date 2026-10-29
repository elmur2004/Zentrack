import type { Metadata } from 'next';
import Link from 'next/link';
import { getAdminMessages } from '@/i18n/admin';
import { formatDateTime } from '@/lib/admin/format';
import { user } from '@/server/db/schema';
import { listAudit, OPERATIONAL_AUDIT } from '@/server/admin/audit';
import { adminLocale, adminPageContext } from '@/server/admin/page-context';
import { scopeOf } from '@/server/admin/policy';
import { PageHead, StatePanel } from '@/components/admin/StatePanel';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/audit'>): Promise<Metadata> {
  return { title: getAdminMessages(await adminLocale(params)).audit.title };
}

const CATEGORIES = ['request', 'application', 'file', 'communication', 'export', 'team', 'settings', 'auth'] as const;
type Category = (typeof CATEGORIES)[number];

type T = ReturnType<typeof getAdminMessages>;

/**
 * Readable details from non-sensitive metadata (bodies, files and links are never stored).
 * Internal user IDs are shown as names and stable codes as translated labels.
 */
function details(action: string, meta: Record<string, unknown>, t: T, names: Map<string, string>): string {
  const m = meta ?? {};
  const name = (id: unknown) => (typeof id === 'string' && id ? (names.get(id) ?? t.common.formerMember) : t.common.unassigned);
  const status = (code: unknown) => (typeof code === 'string' && code in t.status ? t.status[code as keyof T['status']] : String(code ?? ''));
  const role = (code: unknown) => (typeof code === 'string' && code in t.roles ? t.roles[code as keyof T['roles']] : String(code ?? ''));
  const appStatus = (code: unknown) =>
    typeof code === 'string' && code in t.applications.status ? t.applications.status[code as keyof T['applications']['status']] : String(code ?? '');
  switch (action) {
    case 'application.status_changed':
      return `${appStatus(m.from)} → ${appStatus(m.to)}`;
    case 'application.received':
      return typeof m.kind === 'string' && m.kind in t.applications.kinds ? t.applications.kinds[m.kind as keyof T['applications']['kinds']] : '';
    case 'application.deleted':
      return [typeof m.reference === 'string' ? m.reference : '', m.reason === 'retention' ? t.settings.retentionTitle : ''].filter(Boolean).join(' · ');
    case 'request.status_changed':
      return `${status(m.from)} → ${status(m.to)}`;
    case 'request.assigned':
      return `${name(m.from)} → ${name(m.to)}`;
    case 'request.archived':
    case 'request.marked_spam':
    case 'request.restored':
      return typeof m.from === 'string' && m.from in t.disposition ? `${t.disposition[m.from as keyof T['disposition']]} →` : '';
    case 'team.role_changed':
      return `${role(m.from)} → ${role(m.to)}`;
    case 'team.invited':
    case 'team.invitation_accepted':
      return role(m.role);
    case 'export.created': {
      const cols = Array.isArray(m.columns) ? (m.columns as string[]).map((c) => t.export.fields[c as keyof T['export']['fields']] ?? c).join(', ') : '';
      return [`${t.export.title}: ${String(m.count ?? 0)}`, cols].filter(Boolean).join(' · ');
    }
    case 'request.deleted':
      return [typeof m.reference === 'string' ? m.reference : '', m.reason === 'retention' ? t.settings.retentionTitle : ''].filter(Boolean).join(' · ');
    case 'proposal.added':
      return typeof m.version === 'number' ? t.detail.proposals.version.replace('{version}', String(m.version)) : '';
    case 'message.sent':
      return typeof m.status === 'string' && m.status in t.messageStatus ? t.messageStatus[m.status as keyof T['messageStatus']] : '';
    case 'settings.updated':
      return Array.isArray(m.keys) ? (m.keys as string[]).join(', ') : '';
    default:
      return '';
  }
}

export default async function AuditPage({ params, searchParams }: PageProps<'/[locale]/admin/audit'>) {
  const { locale, t, actor, db, settings } = await adminPageContext(params);
  const scope = scopeOf(actor, 'audit.view');
  if (scope === 'none') return <StatePanel locale={locale} kind="forbidden" />;
  const sp = await searchParams;
  const category = (CATEGORIES as readonly string[]).includes(String(sp.category)) ? (sp.category as Category) : undefined;
  const beforeRaw = typeof sp.before === 'string' ? new Date(sp.before) : null;
  const before = beforeRaw && !Number.isNaN(beforeRaw.getTime()) ? beforeRaw : undefined;
  const rows = await listAudit(db, actor, { before, category, limit: 50 });
  const names = new Map((await db.select({ id: user.id, name: user.name }).from(user)).map((u) => [u.id, u.name]));
  const allowed = scope === 'operational' ? CATEGORIES.filter((c) => (OPERATIONAL_AUDIT as readonly string[]).includes(c)) : CATEGORIES;
  const actions = t.audit.actions as Record<string, string>;
  const base = `/${locale}/admin/audit`;
  const older = rows.length === 50 ? `${base}?${new URLSearchParams({ ...(category ? { category } : {}), before: rows[rows.length - 1].createdAt.toISOString() })}` : null;

  return (
    <>
      <PageHead title={t.audit.title} lead={t.audit.lead} />
      {scope === 'operational' ? <p className="adm-alert adm-alert--info" style={{ marginBlockEnd: 12 }}>{t.audit.managerNote}</p> : null}
      <form className="adm-row" method="get" action={base} style={{ marginBlockEnd: 12, alignItems: 'flex-end' }}>
        <div className="adm-field">
          <label htmlFor="audit-cat" className="adm-label">
            {t.audit.category}
          </label>
          <select id="audit-cat" name="category" className="adm-select" defaultValue={category ?? ''}>
            <option value="">{t.common.any}</option>
            {allowed.map((c) => (
              <option key={c} value={c}>
                {t.audit.categories[c]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="adm-btn">
          {t.common.apply}
        </button>
      </form>
      <div className="adm-card">
        {rows.length ? (
          <div className="adm-table-wrap">
            <table className="adm-table adm-table--cards" data-testid="audit-table">
              <thead>
                <tr>
                  <th scope="col">{t.audit.when}</th>
                  <th scope="col">{t.audit.actor}</th>
                  <th scope="col">{t.audit.action}</th>
                  <th scope="col">{t.audit.request}</th>
                  <th scope="col">{t.audit.details}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="adm-table__nowrap">{formatDateTime(locale, r.createdAt, settings.timezone)}</td>
                    <td data-label={t.audit.actor}>{r.actorName ?? t.common.system}</td>
                    <td data-label={t.audit.action}>
                      {actions[r.action] ?? r.action}
                      <span className="adm-table__sub">{t.audit.categories[r.category]}</span>
                    </td>
                    <td data-label={t.audit.request}>
                      {r.requestId && r.reference ? (
                        <Link className="adm-link adm-ltr" href={`/${locale}/admin/requests/${r.requestId}`}>
                          {r.reference}
                        </Link>
                      ) : r.applicationId && r.reference ? (
                        <Link className="adm-link adm-ltr" href={`/${locale}/admin/applications/${r.applicationId}`}>
                          {r.reference}
                        </Link>
                      ) : r.action === 'request.deleted' || r.action === 'application.deleted' ? (
                        <span className="adm-muted">{t.audit.deleted}</span>
                      ) : (
                        <span className="adm-muted">{t.common.dash}</span>
                      )}
                    </td>
                    <td data-label={t.audit.details} className="adm-small adm-muted" style={{ overflowWrap: 'anywhere' }}>
                      <bdi>{details(r.action, r.metadata as Record<string, unknown>, t, names)}</bdi>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="adm-empty">{t.audit.empty}</p>
        )}
        {older ? (
          <div className="adm-pagination">
            <span />
            <Link className="adm-btn adm-btn--sm" href={older}>
              {t.audit.older}
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
}
