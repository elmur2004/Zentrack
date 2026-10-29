import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { localeSwitchLabel, otherLocale } from '@/i18n/config';
import { getAdminMessages } from '@/i18n/admin';
import { adminLocale } from '@/server/admin/page-context';
import { adminAvailable, getActor } from '@/server/auth/session';
import { SignInForm } from '@/components/admin/auth/SignInForm';
import { StatePanel } from '@/components/admin/StatePanel';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/sign-in'>): Promise<Metadata> {
  return { title: getAdminMessages(await adminLocale(params)).auth.signInTitle };
}

function safeNext(value: string | string[] | undefined, locale: string): string {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v || !v.startsWith(`/${locale}/admin`) || v.startsWith('//') || /[\s\\]/.test(v) || v.includes('/sign-in')) return '';
  return v;
}

export default async function SignInPage({ params, searchParams }: PageProps<'/[locale]/admin/sign-in'>) {
  const locale = await adminLocale(params);
  const t = getAdminMessages(locale);
  const sp = await searchParams;
  const next = safeNext(sp.next, locale);
  const reason = sp.reason === 'expired' || sp.reason === 'signed-out' ? sp.reason : '';
  if (adminAvailable() && (await getActor())) redirect(next || `/${locale}/admin`);
  const other = otherLocale(locale);
  const qs = new URLSearchParams();
  if (next) qs.set('next', next.replace(/^\/(en|ar)\//, `/${other}/`));

  return (
    <div className="adm-auth">
      <main className="adm-auth__card" id="adm-main">
        <div className="adm-auth__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/zentrac-logo-horizontal-on-light.png" alt="Zentrac" width={163} height={30} className="adm-auth__logo" />
          <Link href={`/${other}/admin/sign-in${qs.size ? `?${qs}` : ''}`} className="adm-lang" lang={other} hrefLang={other} prefetch={false} title={t.shell.languageLabel}>
            {localeSwitchLabel[other]}
          </Link>
        </div>
        <div>
          <h1 className="adm-h1">{t.auth.signInTitle}</h1>
          <p className="adm-lead">{t.auth.signInLead}</p>
        </div>
        {adminAvailable() ? <SignInForm locale={locale} next={next} notice={reason} /> : <StatePanel locale={locale} kind="unavailable" />}
        <p className="adm-auth__foot">{t.auth.invitationOnly}</p>
      </main>
    </div>
  );
}
