import type { Metadata } from 'next';
import { getAdminMessages } from '@/i18n/admin';
import { adminLocale, adminPageContext } from '@/server/admin/page-context';
import { InboxSection } from '@/server/admin/inbox-page';
import { PageHead } from '@/components/admin/StatePanel';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/queue'>): Promise<Metadata> {
  return { title: getAdminMessages(await adminLocale(params)).inbox.titles.queue };
}

export default async function QueuePage({ params, searchParams }: PageProps<'/[locale]/admin/queue'>) {
  const ctx = await adminPageContext(params);
  return (
    <>
      <PageHead title={ctx.t.inbox.titles.queue} lead={ctx.t.inbox.leads.queue} />
      <InboxSection ctx={ctx} view="queue" searchParams={await searchParams} />
    </>
  );
}
