import '@/styles/site.css';
import type { Metadata } from 'next';
import { isLocale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RevealController } from '@/components/motion/RevealController';
import { JsonLd } from '@/components/ui/JsonLd';
import { organizationJsonLd } from '@/lib/seo';
import { isReviewBuild } from '@/lib/site';
import { getPublicSiteSettings } from '@/server/public/site-settings';

/**
 * Incremental static regeneration: pages stay prerendered, and owner-managed details (contact
 * channels from the dashboard) are refreshed at most every 5 minutes — and immediately when the
 * owner saves them (revalidatePath in the settings action). Pages built without database access
 * pick the details up on their first regeneration.
 */
export const revalidate = 300;

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return {
    title: { default: t.meta.defaultTitle, template: t.meta.titleTemplate },
    description: t.meta.defaultDescription,
    applicationName: t.meta.siteName,
  };
}

/** Public marketing site chrome: header, footer, motion controller and organisation data. */
export default async function SiteLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : 'en';
  const t = getMessages(locale);
  const { contacts } = await getPublicSiteSettings();
  return (
    <>
      <a className="skip-link" href="#main">
        {t.common.skipToContent}
      </a>
      {isReviewBuild() ? (
        <div className="review-banner" role="note">
          {t.review.banner}
        </div>
      ) : null}
      <Header locale={locale} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer locale={locale} contacts={contacts} />
      <RevealController />
      <JsonLd data={organizationJsonLd(locale, contacts)} />
    </>
  );
}
