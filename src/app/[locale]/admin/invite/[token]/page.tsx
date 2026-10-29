import type { Metadata } from 'next';
import Link from 'next/link';
import { getAdminMessages } from '@/i18n/admin';
import { fmt } from '@/i18n/format';
import { getDb } from '@/server/db/client';
import { adminLocale } from '@/server/admin/page-context';
import { findInvitation } from '@/server/admin/team';
import { adminAvailable } from '@/server/auth/session';
import { InviteForm } from '@/components/admin/auth/InviteForm';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/invite/[token]'>): Promise<Metadata> {
  return { title: getAdminMessages(await adminLocale(params)).invite.title };
}

export default async function InvitePage({ params }: PageProps<'/[locale]/admin/invite/[token]'>) {
  const locale = await adminLocale(params);
  const t = getAdminMessages(locale);
  const { token } = await params;
  const invitation = adminAvailable() ? await findInvitation(await getDb(), token) : null;

  return (
    <div className="adm-auth">
      <main className="adm-auth__card" id="adm-main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/zentrac-logo-horizontal-on-light.png" alt="Zentrac" width={163} height={30} className="adm-auth__logo" />
        {invitation ? (
          <>
            <div>
              <h1 className="adm-h1">{t.invite.title}</h1>
              <p className="adm-lead">{fmt(t.invite.lead, { role: t.roles[invitation.role] })}</p>
            </div>
            <dl className="adm-dl">
              <dt>{t.team.name}</dt>
              <dd>
                <bdi>{invitation.name}</bdi>
              </dd>
              <dt>{t.team.email}</dt>
              <dd className="adm-ltr">{invitation.email}</dd>
            </dl>
            <InviteForm locale={locale} token={token} />
          </>
        ) : (
          <div className="adm-stack--sm" data-testid="invite-invalid">
            <h1 className="adm-h1">{t.invite.invalidTitle}</h1>
            <p className="adm-lead">{t.invite.invalidText}</p>
            <Link className="adm-btn" href={`/${locale}/admin/sign-in`}>
              {t.invite.signIn}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
