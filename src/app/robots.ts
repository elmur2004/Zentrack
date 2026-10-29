import type { MetadataRoute } from 'next';
import { absoluteUrl, isReviewBuild } from '@/lib/site';

/** Robots directives are not access control; private review builds must also be access-protected. */
export default function robots(): MetadataRoute.Robots {
  if (isReviewBuild()) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
