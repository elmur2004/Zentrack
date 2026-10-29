export const PAGES = [
  '',
  'about',
  'services',
  'services/bim-modelling',
  'services/coordination',
  'services/shop-drawings',
  'services/design-review',
  'services/quantities-as-built',
  'infrastructure',
  'how-we-work',
  'clients',
  'projects',
  'blog',
  'request-a-quote',
  'partners',
  'careers',
  'privacy',
];

/** URLs that must return a real 404 publicly (withheld record, draft article, unknown pages, review area). */
export const NOT_PUBLIC = [
  'projects/amaala-staff-village-zone-4',
  'projects/sedra',
  'blog/what-is-an-rfi',
  'services/survey',
  'review',
  'review/projects',
  'does-not-exist',
];

export const LOCALES = ['en', 'ar'] as const;
export const url = (locale: string, path: string) => `/${locale}${path ? `/${path}` : ''}`;
