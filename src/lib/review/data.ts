/**
 * PRIVATE REVIEW ONLY. Imported exclusively by `*.review.tsx` / `*.review.ts` route files,
 * which Next compiles only when ZENTRAC_REVIEW=1. Never import this from a public module:
 * `npm run check:output` fails the public build if private names reach its output.
 */
import { internalProjects } from '@private/projects.internal';
import { internalAssets as registerAssets } from '@private/assets.internal';
import { draftArticles } from '@private/articles.drafts';
import { fixtureAssets, fixtureProject } from '@private/fixtures';
import { articleToPublic, projectToPublic } from '@/lib/content/projection';
import type { PublicArticle, PublicProject } from '@/lib/content/types';

export const REVIEW_MEDIA_PREFIX = '/en/review/media/';

/** Register assets plus the synthetic QA fixture images (review build only). */
const internalAssets = [...registerAssets, ...fixtureAssets];

export function reviewProjects(): PublicProject[] {
  return [...internalProjects.filter((p) => p.id.startsWith('P')), fixtureProject]
    .map((p) =>
      projectToPublic(p, internalAssets, {
        review: true,
        mediaUrl: (a) => (a.actualFile ? `${REVIEW_MEDIA_PREFIX}${a.id}` : undefined),
      }),
    )
    .filter((p): p is PublicProject => !!p);
}

export function reviewProject(slug: string) {
  return reviewProjects().find((p) => p.slug === slug);
}

export function registerOnlyGroups() {
  return internalProjects.filter((p) => p.id.startsWith('R'));
}

export function reviewArticles(): PublicArticle[] {
  return draftArticles.map((a) => articleToPublic(a, { review: true })).filter((a): a is PublicArticle => !!a);
}

export function reviewArticle(slug: string) {
  return reviewArticles().find((a) => a.slug === slug);
}

export { internalAssets, internalProjects, draftArticles };
