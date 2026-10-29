import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { localePath } from '@/i18n/routes';
import { sitemapPaths } from '@/lib/public-routes';
import { absoluteUrl, isReviewBuild } from '@/lib/site';

/** Published, indexable routes only, from the same registry and public projection as the pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (isReviewBuild()) return [];
  return sitemapPaths().flatMap((path) =>
    locales.map((locale) => ({
      url: absoluteUrl(localePath(locale, path)),
      alternates: {
        languages: {
          en: absoluteUrl(localePath('en', path)),
          ar: absoluteUrl(localePath('ar', path)),
          'x-default': absoluteUrl(localePath('en', path)),
        },
      },
    })),
  );
}
