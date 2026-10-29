import type { Metadata } from 'next';
import { getAdminMessages } from '@/i18n/admin';
import { ROLES } from '@/lib/admin/codes';
import { adminLocale, adminPageContext } from '@/server/admin/page-context';
import { POLICY, scopeOf, type Capability } from '@/server/admin/policy';
import { listTeam } from '@/server/admin/team';
import { PageHead, StatePanel } from '@/components/admin/StatePanel';
import { TeamManager } from '@/components/admin/TeamManager';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/team'>): Promise<Metadata> {
  return { title: getAdminMessages(await adminLocale(params)).team.title };
}

const MATRIX: Capability[] = [
  'request.view',
  'file.download',
  'request.assign',
  'request.note',
  'followup.manage',
  'request.status',
  'message.draft',
  'message.send',
  'request.export',
  'request.archive',
  'request.spam',
  'file.release',
  'team.manage',
  'settings.manage',
  'audit.view',
  'request.delete',
  'application.view',
  'application.manage',
  'application.delete',
];

export default async function TeamPage({ params }: PageProps<'/[locale]/admin/team'>) {
  const { locale, t, actor, db, settings } = await adminPageContext(params);
  if (scopeOf(actor, 'team.manage') === 'none') return <StatePanel locale={locale} kind="forbidden" />;
  const { members, invitations } = await listTeam(db, actor);
  const scopeLabel = { all: t.team.scopeAll, assigned: t.team.scopeAssigned, operational: t.team.scopeOperational, none: t.team.scopeNone };
  return (
    <>
      <PageHead title={t.team.title} lead={t.team.lead} />
      <TeamManager locale={locale} me={actor.userId} members={members} invitations={invitations} timezone={settings.timezone} />
      <section className="adm-card" style={{ marginBlockStart: 16 }} aria-labelledby="perm-matrix">
        <div className="adm-card__head">
          <h2 className="adm-h2" id="perm-matrix">
            {t.team.matrix}
          </h2>
          <span className="adm-small adm-muted">{t.team.matrixCaption}</span>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table adm-matrix" data-testid="permission-matrix">
            <thead>
              <tr>
                <th scope="col">{t.team.capability}</th>
                {ROLES.map((r) => (
                  <th key={r} scope="col">
                    {t.roles[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((cap) => (
                <tr key={cap}>
                  <th scope="row" style={{ fontWeight: 500 }}>
                    {t.team.capabilities[cap as keyof typeof t.team.capabilities]}
                  </th>
                  {ROLES.map((r) => (
                    <td key={r}>{scopeLabel[POLICY[r][cap]]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="adm-card__foot adm-help">{t.team.reviewerNote}</p>
      </section>
    </>
  );
}
