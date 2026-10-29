import '@/styles/core.css';
import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { preload } from 'react-dom';
import { isLocale, localeDir, locales } from '@/i18n/config';
import { getSiteUrl, isReviewBuild } from '@/lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** Shared document shell for the public site and the admin dashboard (each has its own layout). */
export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(getSiteUrl()),
    formatDetection: { telephone: false, email: false, address: false },
    robots: isReviewBuild() ? { index: false, follow: false } : undefined,
  };
}

export const viewport: Viewport = {
  themeColor: '#0b1624',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Preload only the fonts this locale needs for first paint.
  preload('/fonts/saira-latin-wght.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  if (locale === 'ar') {
    preload('/fonts/ibm-plex-sans-arabic-arabic-400.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
    preload('/fonts/ibm-plex-sans-arabic-arabic-600.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  }

  return (
    // lang/dir are server-rendered, so direction is correct before first paint.
    // suppressHydrationWarning: the inline script adds the `js` class before hydration.
    <html lang={locale} dir={localeDir[locale]} suppressHydrationWarning>
      <head>
        <script
          // Marks JS availability before first paint (progressive-enhancement styles only).
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
