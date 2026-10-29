import { allStaticRoutes } from '@/i18n/routes';
import { publicArticles, publicProjects } from '@/content/public';

/**
 * Every published public page path, locale-neutral ("" for home, "services/coordination", …).
 * One source for the sitemap and for the proxy's 404 handling, built from the same route registry
 * and public content projection as the pages themselves (withheld records are never in it).
 */
export function publicRoutePaths(): string[] {
  return [
    ...allStaticRoutes(),
    ...publicProjects.map((p) => `projects/${p.slug}`),
    ...publicArticles.map((a) => `blog/${a.slug}`),
  ];
}

/**
 * Index pages that have nothing published yet (OD-29, decided 28 Oct 2026): they stay reachable
 * from the navigation but are `noindex, follow` and left out of the sitemap until the first
 * project or article is published.
 */
export function emptyIndexPaths(): string[] {
  return [...(publicProjects.length ? [] : ['projects']), ...(publicArticles.length ? [] : ['blog'])];
}

/** Paths listed in the sitemap: every published page except empty index pages. */
export function sitemapPaths(): string[] {
  const empty = new Set(emptyIndexPaths());
  return publicRoutePaths().filter((p) => !empty.has(p));
}
