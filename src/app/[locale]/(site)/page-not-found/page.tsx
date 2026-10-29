import type { Metadata } from 'next';
import { getMessages } from '@/i18n/messages';
import { isLocale } from '@/i18n/config';
import { resolveLocale } from '@/lib/page';
import { NotFoundView } from '@/components/layout/NotFoundView';

/**
 * Server-rendered localized 404 (BUG-01). The proxy rewrites every public URL that is not in the
 * route registry to this page with a 404 status, so visitors without JavaScript, crawlers and
 * assistive technology get the full page (site navigation, lang/dir, recovery links) in the HTML.
 * A direct request to this path is not in the registry either, so it is a 404 too.
 * Rendered per request so the status set by the proxy is never replaced by a cached 200.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/[locale]/page-not-found'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return {
    title: { absolute: `${t.notFound.meta.title} · ${t.meta.siteName}` },
    description: t.notFound.text,
    robots: { index: false, follow: true },
  };
}

export default async function PageNotFound({ params }: PageProps<'/[locale]/page-not-found'>) {
  const locale = await resolveLocale(params);
  return <NotFoundView locale={locale} />;
}
