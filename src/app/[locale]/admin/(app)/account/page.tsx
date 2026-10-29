import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { getAdminMessages } from '@/i18n/admin';
import { teamMember } from '@/server/db/schema';
import { adminLocale, adminPageContext } from '@/server/admin/page-context';
import { PageHead } from '@/components/admin/StatePanel';
import { AccountSecurity } from '@/components/admin/auth/AccountSecurity';
import { IconAlert } from '@/components/admin/icons';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/account'>): Promise<Metadata> {
  return { title: getAdminMessages(await adminLocale(params)).account.title };
}

export default async function AccountPage({ params }: PageProps<'/[locale]/admin/account'>) {
  // Reachable while two-factor enrolment is pending, so the user can complete it.
  const { locale, t, actor, db, settings } = await adminPageContext(params, { allowMfaPending: true });
  const [member] = await db.select({ notifyEmail: teamMember.notifyEmail }).from(teamMember).where(eq(teamMember.userId, actor.userId)).limit(1);
  const policyRequires = settings.requireMfaForPrivileged && (actor.role === 'owner' || actor.role === 'manager');
  return (
    <>
      <PageHead title={t.account.title} />
      {actor.mfaEnrolmentRequired ? (
        <p className="adm-alert adm-alert--warn" role="alert" style={{ marginBlockEnd: 16 }} data-testid="mfa-required">
          <IconAlert size={16} />
          <span>{t.account.mfaRequired}</span>
        </p>
      ) : null}
      <section className="adm-card" style={{ marginBlockEnd: 16 }}>
        <div className="adm-card__head">
          <h2 className="adm-h2">{t.account.profile}</h2>
        </div>
        <div className="adm-card__body">
          <dl className="adm-dl">
            <dt>{t.team.name}</dt>
            <dd>
              <bdi>{actor.name}</bdi>
            </dd>
            <dt>{t.team.email}</dt>
            <dd className="adm-ltr">{actor.email}</dd>
            <dt>{t.team.role}</dt>
            <dd>
              {t.roles[actor.role]} — <span className="adm-muted">{t.roleHelp[actor.role]}</span>
            </dd>
          </dl>
        </div>
      </section>
      <AccountSecurity locale={locale} userId={actor.userId} twoFactorEnabled={actor.twoFactorEnabled} mfaRequiredByPolicy={policyRequires} notifyEmail={!!member?.notifyEmail} />
    </>
  );
}
