import type {
  InternalArticle,
  InternalAsset,
  InternalProject,
  PublicArticle,
  PublicImage,
  PublicProject,
} from './types';
import type { Localized } from '@/i18n/config';

const ATTRIBUTION: Record<InternalProject['attribution'], Localized<string>> = {
  'founder-bim-experts': { en: 'Founder / BIM Experts experience', ar: 'خبرة المؤسس / BIM Experts' },
  'zentrac-confirmed': { en: 'Zentrac project', ar: 'مشروع زينتراك' },
};

/** Placeholders and unapproved claims that must never reach public output. */
export const FORBIDDEN_PUBLIC_PATTERNS: RegExp[] = [
  /\[(?:email|phone|website|xx|founder photo|to confirm|legal text[^\]]*)\]/i,
  /\bTBC\b/,
  /\bnull\b|\bundefined\b/,
  /\bzero rework\b/i,
  /\bclash-free\b/i,
  /\bISO[- ]certified\b/i,
  /\bdigital twin\b/i,
  /\b(?:30|40)\+/,
  /\b1M\+/i,
  /\b8 years\b/i,
  /\ball (?:project )?files are covered by an NDA\b/i,
];

export function hasForbiddenText(value: string): RegExp | undefined {
  return FORBIDDEN_PUBLIC_PATTERNS.find((re) => re.test(value));
}

function complete(l: Localized<string> | undefined): boolean {
  return !!l && l.en.trim().length > 0 && l.ar.trim().length > 0;
}

function completeList(l: Localized<string[]> | undefined): boolean {
  return !!l && l.en.length > 0 && l.en.length === l.ar.length && [...l.en, ...l.ar].every((s) => s.trim());
}

export interface ProjectionOptions {
  /** Private review only: include withheld/draft records and use review media URLs. */
  review?: boolean;
  mediaUrl?: (asset: InternalAsset) => string | undefined;
}

/**
 * Builds the public object from an explicit allowlist — never by spreading the internal record.
 * Approval of a title does not imply approval of images, parties or other fields.
 */
export function projectToPublic(
  p: InternalProject,
  assets: InternalAsset[],
  opts: ProjectionOptions = {},
): PublicProject | null {
  const approved = p.publication.state === 'approved';
  if (!approved && !opts.review) return null;
  const allow = (field: InternalProject['publication']['approvedFields'][number]) =>
    opts.review || p.publication.approvedFields.includes(field);

  if (!allow('title') || !complete(p.title)) return null;

  const images: PublicImage[] = [];
  if (allow('images')) {
    for (const id of p.assetIds) {
      const a = assets.find((x) => x.id === id);
      if (!a) continue;
      const assetOk = opts.review || (a.publication.state === 'approved' && a.publicFile);
      if (!assetOk) continue;
      const src = opts.review ? opts.mediaUrl?.(a) : a.publicFile;
      const size = a.actualSize;
      if (!src || !size) continue;
      images.push({
        src,
        width: size.width,
        height: size.height,
        ...(opts.review ? { unoptimized: true } : {}),
        alt: { ...a.alt },
        caption: complete(a.caption) ? { ...a.caption } : undefined,
      });
    }
  }

  return {
    id: p.id,
    slug: p.slug,
    title: { en: p.title.en, ar: p.title.ar },
    summary: allow('summary') && complete(p.summary) ? { en: p.summary.en, ar: p.summary.ar } : undefined,
    scope: allow('scope') && completeList(p.scope) ? { en: [...p.scope.en], ar: [...p.scope.ar] } : undefined,
    packageLabel:
      allow('package') && complete(p.packageLabel) ? { en: p.packageLabel!.en, ar: p.packageLabel!.ar } : undefined,
    countryCode: allow('country') ? p.countryCode : undefined,
    sector: allow('sector') ? p.sector : undefined,
    serviceIds: allow('services') ? [...p.serviceIds] : [],
    networkIds: allow('networks') ? [...p.networkIds] : [],
    attributionLabel: { ...ATTRIBUTION[p.attribution] },
    owners: allow('owner') ? p.projectParties.map((x) => ({ name: x.name, role: { ...x.role } })) : [],
    directAppointingParty: allow('appointingParty') ? p.directAppointingParty : undefined,
    images,
    featured: !!p.featured,
  };
}

export function wordsIn(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function articleToPublic(a: InternalArticle, opts: { review?: boolean } = {}): PublicArticle | null {
  const ok = a.publication.state === 'approved' && !!a.publishedAt && !!a.publication.technicalReview;
  if (!ok && !opts.review) return null;
  const minutes = (blocks: InternalArticle['body']['en'], wpm: number) => {
    const words = blocks.reduce(
      (n, b) => n + wordsIn([b.text ?? '', ...(b.items ?? []), ...(b.rows ?? []).flat()].join(' ')),
      0,
    );
    return Math.max(1, Math.round(words / wpm));
  };
  return {
    id: a.id,
    slug: a.slug,
    topic: a.topic,
    title: { ...a.title },
    excerpt: { ...a.excerpt },
    body: { en: a.body.en.map((b) => ({ ...b })), ar: a.body.ar.map((b) => ({ ...b })) },
    references: a.references.map((r) => ({ title: r.title, url: r.url })),
    relatedServiceIds: [...a.relatedServiceIds],
    publishedAt: a.publishedAt ?? '',
    updatedAt: a.updatedAt,
    author: a.author ? { ...a.author } : undefined,
    readingMinutes: { en: minutes(a.body.en, 220), ar: minutes(a.body.ar, 180) },
  };
}
