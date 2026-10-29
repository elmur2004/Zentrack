import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAdminMessages } from '@/i18n/admin';
import { labelMaps } from '@/lib/admin/labels';
import { emailTransport } from '@/server/email/transport';
import { isDomainError } from '@/server/admin/errors';
import { adminLocale, adminPageContext } from '@/server/admin/page-context';
import { getRequestDetail } from '@/server/admin/requests';
import { listAssignableMembers } from '@/server/admin/team';
import { RequestWorkspace } from '@/components/admin/detail/Workspace';
import { TABS, type TabId } from '@/components/admin/detail/types';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/requests/[id]'>): Promise<Metadata> {
  return { title: getAdminMessages(await adminLocale(params)).inbox.titles.inbox };
}

export default async function RequestDetailPage({ params, searchParams }: PageProps<'/[locale]/admin/requests/[id]'>) {
  const ctx = await adminPageContext(params);
  const { id } = await params;
  const sp = await searchParams;
  let detail;
  try {
    detail = await getRequestDetail(ctx.db, ctx.actor, id);
  } catch (e) {
    // Unknown, deleted and not-permitted IDs all look the same (no existence oracle).
    if (isDomainError(e) && e.code === 'not_found') notFound();
    throw e;
  }
  const members = await listAssignableMembers(ctx.db, ctx.actor);
  const tab = (TABS as readonly string[]).includes(String(sp.tab)) ? (sp.tab as TabId) : 'overview';
  return (
    <RequestWorkspace
      locale={ctx.locale}
      detail={detail}
      me={{ id: ctx.actor.userId, role: ctx.actor.role }}
      members={members}
      labels={labelMaps(ctx.locale)}
      timezone={ctx.settings.timezone}
      transport={emailTransport()}
      requireAssignee={ctx.settings.requireAssigneeForQuote}
      initialTab={tab}
      nowIso={new Date().toISOString()}
    />
  );
}
