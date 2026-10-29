import '@/styles/admin.css';
import type { Metadata } from 'next';
import { getAdminMessages } from '@/i18n/admin';
import { adminLocale } from '@/server/admin/page-context';

export const dynamic = 'force-dynamic';

/** Private dashboard: never indexed or previewed (also enforced by X-Robots-Tag headers). */
export async function generateMetadata({ params }: LayoutProps<'/[locale]/admin'>): Promise<Metadata> {
  const t = getAdminMessages(await adminLocale(params));
  return {
    title: { default: t.meta.title, template: t.meta.titleTemplate },
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
    referrer: 'no-referrer',
  };
}

export default function AdminRootLayout({ children }: LayoutProps<'/[locale]/admin'>) {
  return <div className="adm-root">{children}</div>;
}
