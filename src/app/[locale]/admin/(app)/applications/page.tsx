import type { Metadata } from 'next';
import Link from 'next/link';
import { getAdminMessages } from '@/i18n/admin';
import { getMessages } from '@/i18n/messages';
import { labelMaps } from '@/lib/admin/labels';
import { listApplications, normalizeApplicationQuery } from '@/server/admin/applications';
import { adminLocale, adminPageContext } from '@/server/admin/page-context';
import { scopeOf } from '@/server/admin/policy';
import { ApplicationsList, type ApplicationListData } from '@/components/admin/ApplicationsList';
import { PageHead, StatePanel } from '@/components/admin/StatePanel';
import { IconInfo } from '@/components/admin/icons';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/applications'>): Promise<Metadata> {
  return { title: getAdminMessages(await adminLocale(params)).applications.title };
}

/** Partner enquiries and career applications (owners and managers). */
export default async function ApplicationsPage({ params, searchParams }: PageProps<'/[locale]/admin/applications'>) {
  const { locale, t, actor, db, settings } = await adminPageContext(params);
  if (scopeOf(actor, 'application.view') === 'none') return <StatePanel locale={locale} kind="forbidden" />;
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]);
  const query = normalizeApplicationQuery({ view: one('view'), kind: one('kind'), status: one('status'), page: one('page') });
  const data = await listApplications(db, actor, query);
  const forms = getMessages(locale).forms;
  const paused = [!settings.partnerIntakeOpen ? t.applications.formsPaused.partner : null, !settings.careerIntakeOpen ? t.applications.formsPaused.career : null].filter(Boolean);
  return (
    <>
      <PageHead title={t.applications.title} lead={t.applications.lead} />
      {paused.length ? (
        <p className="adm-alert adm-alert--info" style={{ marginBlockEnd: 12 }} data-testid="forms-paused">
          <IconInfo size={16} />
          <span>
            {paused.join(' ')}{' '}
            {scopeOf(actor, 'settings.manage') !== 'none' ? (
              <Link className="adm-link" href={`/${locale}/admin/settings#website-forms`}>
                {t.applications.formsSettings}
              </Link>
            ) : null}
          </span>
        </p>
      ) : null}
      <ApplicationsList
        locale={locale}
        initialQuery={{ ...query, page: data.page }}
        initialData={data as unknown as ApplicationListData}
        labels={{ partnerTypes: forms.partnerTypes as Record<string, string>, disciplines: forms.disciplines as Record<string, string>, countries: labelMaps(locale).countries }}
        timezone={settings.timezone}
      />
    </>
  );
}
