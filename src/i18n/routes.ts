import { locales, type Locale } from './config';

/**
 * Single registry of locale-neutral page IDs and their stable slugs.
 * English slugs are kept under /ar for maintainability (spec §6.1).
 */
export const staticPages = {
  home: '',
  about: 'about',
  services: 'services',
  infrastructure: 'infrastructure',
  buildings: 'buildings',
  howWeWork: 'how-we-work',
  clients: 'clients',
  projects: 'projects',
  blog: 'blog',
  quote: 'request-a-quote',
  partners: 'partners',
  careers: 'careers',
  privacy: 'privacy',
} as const;

export type StaticPageId = keyof typeof staticPages;

export const serviceSlugs = [
  'bim-modelling',
  'coordination',
  'shop-drawings',
  'design-review',
  'quantities-as-built',
] as const;
export type ServiceSlug = (typeof serviceSlugs)[number];

export function localePath(locale: Locale, path = ''): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  return clean ? `/${locale}/${clean}` : `/${locale}`;
}

export function pageHref(locale: Locale, id: StaticPageId, hash?: string): string {
  return localePath(locale, staticPages[id]) + (hash ? `#${hash}` : '');
}

export function serviceHref(locale: Locale, slug: ServiceSlug): string {
  return localePath(locale, `services/${slug}`);
}

export function projectHref(locale: Locale, slug: string): string {
  return localePath(locale, `projects/${slug}`);
}

export function articleHref(locale: Locale, slug: string): string {
  return localePath(locale, `blog/${slug}`);
}

/** Query parameters that are safe to carry across a language switch (stable IDs only). */
export const portableQueryKeys = ['service', 'scope', 'country', 'sector', 'type'] as const;

/** Stable IDs: service/scope slugs (lowercase) and ISO country codes (uppercase). */
const SAFE_VALUE = /^[A-Za-z0-9-]{1,40}$/;

/**
 * Builds the equivalent URL in another locale. Keeps the same page, only the
 * allow-listed query parameters with stable ID values, and a safe section anchor.
 * Never accepts an absolute/external target.
 */
export function switchLocaleHref(
  pathname: string,
  target: Locale,
  search?: string | URLSearchParams | null,
  hash?: string | null,
): string {
  let path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  // reject protocol-relative or otherwise odd paths
  if (path.startsWith('//')) path = '/';
  const segments = path.split('/').filter(Boolean);
  if (segments.length && (locales as readonly string[]).includes(segments[0])) segments.shift();
  const rest = segments.filter((s) => /^[a-z0-9-]+$/i.test(s)).join('/');
  let href = localePath(target, rest);

  const params = typeof search === 'string' || search == null ? new URLSearchParams(search ?? '') : search;
  const kept = new URLSearchParams();
  for (const key of portableQueryKeys) {
    for (const value of params.getAll(key)) {
      if (SAFE_VALUE.test(value)) kept.append(key, value);
    }
  }
  const qs = kept.toString();
  if (qs) href += `?${qs}`;

  const anchor = (hash ?? '').replace(/^#/, '');
  if (anchor && /^[a-z0-9-]{1,60}$/i.test(anchor)) href += `#${anchor}`;
  return href;
}

/** All public static routes (without dynamic records), used by sitemap and tests. */
export function allStaticRoutes(): string[] {
  const out: string[] = [];
  for (const id of Object.keys(staticPages) as StaticPageId[]) out.push(staticPages[id]);
  for (const slug of serviceSlugs) out.push(`services/${slug}`);
  return out;
}
