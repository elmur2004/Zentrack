import type { PublicArticle, PublicProject } from '@/lib/content/types';
import projectsData from './projects.generated.json';
import articlesData from './articles.generated.json';

/**
 * Public content projection. These JSON files are written ONLY by
 * `npm run content:project` from approved internal records (see docs/content-editing.md).
 * Every public channel (pages, sitemap, metadata, JSON-LD) reads from here.
 */
export const publicProjects: PublicProject[] = projectsData as unknown as PublicProject[];

export const publicArticles: PublicArticle[] = (articlesData as unknown as PublicArticle[])
  .filter((a) => !!a.publishedAt)
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

export function getPublicProject(slug: string): PublicProject | undefined {
  return publicProjects.find((p) => p.slug === slug);
}

export function getPublicArticle(slug: string): PublicArticle | undefined {
  return publicArticles.find((a) => a.slug === slug);
}

/** Minimum number of approved records before project filters become useful (spec §9.6). */
export const FILTER_THRESHOLD = 4;

/** Reviewed public downloads (e.g. company profile). Empty until a public PDF is approved. */
export const publicDownloads: Array<{
  id: 'company-profile';
  href: string;
  language: 'en' | 'ar';
  bytes: number;
}> = [];
