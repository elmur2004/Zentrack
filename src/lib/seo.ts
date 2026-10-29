import type { Metadata } from 'next';
import { locales, ogLocale, otherLocale, type Locale } from '@/i18n/config';
import { localePath } from '@/i18n/routes';
import { getMessages } from '@/i18n/messages';
import { absoluteUrl, getSiteUrl, isReviewBuild } from './site';
import type { ContactChannels } from './contacts';

interface PageMetaInput {
  locale: Locale;
  /** Locale-neutral path, e.g. "services/coordination" ("" for home) */
  path: string;
  title: string;
  description: string;
  /** Use the title as-is (no " · Zentrac" suffix) */
  absoluteTitle?: boolean;
  /** true = noindex, nofollow; 'follow' = noindex, follow (page kept out of search, links still followed). */
  noindex?: boolean | 'follow';
  type?: 'website' | 'article';
}

/** Localized title/description, self-canonical URL and reciprocal hreflang alternates. */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  absoluteTitle,
  noindex,
  type = 'website',
}: PageMetaInput): Metadata {
  const t = getMessages(locale);
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = localePath(l, path);
  languages['x-default'] = localePath('en', path);
  const robotsOff = noindex === true || isReviewBuild();
  const fullTitle = absoluteTitle ? title : t.meta.titleTemplate.replace('%s', title);

  return {
    metadataBase: new URL(getSiteUrl()),
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: localePath(locale, path), languages },
    openGraph: {
      type,
      siteName: t.meta.siteName,
      title: fullTitle,
      description,
      url: localePath(locale, path),
      locale: ogLocale[locale],
      alternateLocale: [ogLocale[otherLocale(locale)]],
      images: [{ url: `/og/og-${locale}.png`, width: 1200, height: 630, alt: t.meta.ogImageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [`/og/og-${locale}.png`],
    },
    robots: robotsOff ? { index: false, follow: false } : noindex === 'follow' ? { index: false, follow: true } : undefined,
  };
}

export function organizationJsonLd(locale: Locale, contacts?: ContactChannels) {
  const t = getMessages(locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${getSiteUrl()}/#organization`,
    name: 'Zentrac',
    alternateName: 'زينتراك',
    url: absoluteUrl(localePath(locale)),
    logo: absoluteUrl('/brand/zentrac-logo-horizontal-on-light.png'),
    description: t.meta.defaultDescription,
    foundingDate: '2026',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '6th Floor, 1 Roxy Square',
      addressLocality: 'Heliopolis, Cairo',
      addressCountry: 'EG',
    },
    // Owner-managed channels (dashboard); omitted when not set.
    ...(contacts?.email ? { email: contacts.email } : {}),
    ...(contacts?.phone ? { telephone: contacts.phone.replace(/\s/g, '') } : {}),
    ...(contacts?.linkedin ? { sameAs: [contacts.linkedin] } : {}),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; href: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}

export function serviceJsonLd(locale: Locale, name: string, description: string, href: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: absoluteUrl(href),
    inLanguage: locale,
    provider: { '@id': `${getSiteUrl()}/#organization` },
  };
}
