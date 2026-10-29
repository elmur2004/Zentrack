import { locale as rootLocale } from 'next/root-params';
import { isLocale, type Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { NotFoundView } from '@/components/layout/NotFoundView';

/**
 * Boundary for notFound() thrown inside a page. Next.js renders this boundary in the browser
 * (React has no server-side error boundaries), so unknown public URLs never rely on it: the proxy
 * rewrites them to the server-rendered 404 route (page-not-found) with a real 404 status. This
 * remains the backstop, e.g. for a record removed after the route registry was built.
 */
export default async function NotFound() {
  const raw = await rootLocale();
  const locale: Locale = isLocale(raw) ? raw : 'en';
  const t = getMessages(locale);
  return (
    <>
      <title>{`${t.notFound.meta.title} · ${t.meta.siteName}`}</title>
      <NotFoundView locale={locale} />
    </>
  );
}
