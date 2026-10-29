import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAdminMessages } from '@/i18n/admin';
import { getMessages } from '@/i18n/messages';
import { labelMaps } from '@/lib/admin/labels';
import { getApplicationDetail } from '@/server/admin/applications';
import { isDomainError } from '@/server/admin/errors';
import { adminLocale, adminPageContext } from '@/server/admin/page-context';
import { ApplicationWorkspace, type ApplicationDetailData } from '@/components/admin/ApplicationWorkspace';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/applications/[id]'>): Promise<Metadata> {
  return { title: getAdminMessages(await adminLocale(params)).applications.title };
}

export default async function ApplicationDetailPage({ params }: PageProps<'/[locale]/admin/applications/[id]'>) {
  const ctx = await adminPageContext(params);
  const { id } = await params;
  let detail;
  try {
    detail = await getApplicationDetail(ctx.db, ctx.actor, id);
  } catch (e) {
    // Unknown, deleted and not-permitted IDs all look the same (no existence oracle).
    if (isDomainError(e) && e.code === 'not_found') notFound();
    throw e;
  }
  const forms = getMessages(ctx.locale).forms;
  return (
    <ApplicationWorkspace
      locale={ctx.locale}
      detail={detail as unknown as ApplicationDetailData}
      labels={{ partnerTypes: forms.partnerTypes as Record<string, string>, disciplines: forms.disciplines as Record<string, string>, countries: labelMaps(ctx.locale).countries }}
      timezone={ctx.settings.timezone}
    />
  );
}
