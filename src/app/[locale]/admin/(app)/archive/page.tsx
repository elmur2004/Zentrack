import type { Metadata } from 'next';
import Link from 'next/link';
import { getAdminMessages } from '@/i18n/admin';
import { adminLocale, adminPageContext } from '@/server/admin/page-context';
import { InboxSection } from '@/server/admin/inbox-page';
import { PageHead } from '@/components/admin/StatePanel';

export async function generateMetadata({ params }: PageProps<'/[locale]/admin/archive'>): Promise<Metadata> {
  return { title: getAdminMessages(await adminLocale(params)).shell.nav.archive };
}

/** Deliberate non-active records, kept apart from the working pipeline. */
export default async function ArchivePage({ params, searchParams }: PageProps<'/[locale]/admin/archive'>) {
  const ctx = await adminPageContext(params);
  const sp = await searchParams;
  const view = sp.view === 'spam' ? 'spam' : 'archived';
  const { t, locale } = ctx;
  return (
    <>
      <PageHead title={t.inbox.titles[view]} lead={t.inbox.leads[view]} />
      <nav className="adm-tabs" aria-label={t.shell.nav.archive} style={{ marginBlockEnd: 16 }}>
        <Link href={`/${locale}/admin/archive`} className="adm-tab" aria-current={view === 'archived' ? 'page' : undefined} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
          {t.inbox.archiveTabs.archived}
        </Link>
        <Link href={`/${locale}/admin/archive?view=spam`} className="adm-tab" aria-current={view === 'spam' ? 'page' : undefined} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
          {t.inbox.archiveTabs.spam}
        </Link>
      </nav>
      <InboxSection ctx={ctx} view={view} searchParams={sp} />
    </>
  );
}
