import type { Metadata } from 'next';
import { getAdminMessages } from '@/i18n/admin';
import { adminLocale, adminPageContext } from '@/server/admin/page-context';
import { InboxSection } from '@/server/admin/inbox-page';
import { PageHead } from '@/components/admin/StatePanel';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/requests'>): Promise<Metadata> {
  return { title: getAdminMessages(await adminLocale(params)).inbox.titles.inbox };
}

export default async function RequestsPage({ params, searchParams }: PageProps<'/[locale]/admin/requests'>) {
  const ctx = await adminPageContext(params);
  return (
    <>
      <PageHead title={ctx.t.inbox.titles.inbox} lead={ctx.t.inbox.leads.inbox} />
      <InboxSection ctx={ctx} view="inbox" searchParams={await searchParams} />
    </>
  );
}
