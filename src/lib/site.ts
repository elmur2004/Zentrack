/**
 * Site origin comes only from configuration (SITE_URL). It is never hardcoded or guessed.
 * Without it the build uses a local origin and is flagged as non-production by check:output.
 */
export const LOCAL_ORIGIN = 'http://localhost:3000';

export function getSiteUrl(): string {
  const raw = process.env.SITE_URL?.trim();
  if (raw && /^https?:\/\/[^\s/]+$/i.test(raw.replace(/\/$/, ''))) return raw.replace(/\/$/, '');
  return LOCAL_ORIGIN;
}

export function hasConfiguredOrigin(): boolean {
  return getSiteUrl() !== LOCAL_ORIGIN;
}

export function isReviewBuild(): boolean {
  return process.env.ZENTRAC_REVIEW === '1';
}

export function absoluteUrl(path: string): string {
  return `${getSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}
