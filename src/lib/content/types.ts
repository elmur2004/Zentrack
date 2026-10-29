import type { Localized } from '@/i18n/config';

export type PublicationState = 'draft' | 'withheld' | 'approved';

export interface SourceRef {
  fileId: 'F1' | 'F2' | 'F3' | 'F4' | 'F5';
  locator: string;
}

export type SectorId = 'residential' | 'urban' | 'sports' | 'parks' | 'canals' | 'wastewater' | 'roads';

/** Fields that may be individually approved for publication. */
export type ProjectField =
  | 'title'
  | 'summary'
  | 'scope'
  | 'country'
  | 'sector'
  | 'package'
  | 'services'
  | 'networks'
  | 'owner'
  | 'appointingParty'
  | 'images';

export interface InternalProject {
  id: string;
  slug: string;
  title: Localized<string>;
  summary: Localized<string>;
  scope: Localized<string[]>;
  packageLabel?: Localized<string>;
  countryCode?: string;
  sector?: SectorId;
  serviceIds: string[];
  networkIds: string[];
  attribution: 'founder-bim-experts' | 'zentrac-confirmed';
  /** Parties named in sources. A project owner/developer is never relabelled as the direct client. */
  projectParties: Array<{ name: string; role: Localized<string> }>;
  directAppointingParty?: string;
  dates?: { start?: string; end?: string };
  assetIds: string[];
  featured?: boolean;
  publication: {
    state: PublicationState;
    approvedFields: ProjectField[];
    /** PRIVATE — never serialized publicly */
    approvalEvidence?: string;
  };
  sources: SourceRef[];
  internalNotes: string[];
}

export interface InternalAsset {
  id: string;
  projectId: string;
  /** Path referenced by the register (may not exist in the supplied package). */
  registeredPath: string;
  registeredSize?: { width: number; height: number };
  /** Actual extracted file available locally (private-source/extracted/...), if any. */
  actualFile?: string;
  actualSize?: { width: number; height: number };
  source: SourceRef[];
  description: Localized<string>;
  alt: Localized<string>;
  caption: Localized<string>;
  publication: { state: PublicationState; approvalEvidence?: string };
  /** Public optimized derivative under /public/media, created only after approval. */
  publicFile?: string;
  internalNotes: string[];
}

export interface PublicImage {
  src: string;
  width: number;
  height: number;
  /** Private review only: source images are served as-is, not through the optimizer. */
  unoptimized?: boolean;
  alt: Localized<string>;
  caption?: Localized<string>;
}

export interface PublicParty {
  name: string;
  role: Localized<string>;
}

export interface PublicProject {
  id: string;
  slug: string;
  title: Localized<string>;
  summary?: Localized<string>;
  scope?: Localized<string[]>;
  packageLabel?: Localized<string>;
  countryCode?: string;
  sector?: SectorId;
  serviceIds: string[];
  networkIds: string[];
  attributionLabel: Localized<string>;
  owners: PublicParty[];
  directAppointingParty?: string;
  images: PublicImage[];
  featured: boolean;
}

export interface ArticleBlock {
  type: 'p' | 'h2' | 'h3' | 'ul' | 'table' | 'note';
  text?: string;
  items?: string[];
  rows?: string[][];
  caption?: string;
}

export interface InternalArticle {
  id: string;
  slug: string;
  topic: string;
  title: Localized<string>;
  excerpt: Localized<string>;
  body: Localized<ArticleBlock[]>;
  references: Array<{ title: string; url?: string; note?: Localized<string> }>;
  relatedServiceIds: string[];
  /** Confirmed editorial date (ISO). Never invented. */
  publishedAt?: string;
  updatedAt?: string;
  author?: Localized<string>;
  publication: { state: PublicationState; technicalReview?: string };
  internalNotes: string[];
}

export interface PublicArticle {
  id: string;
  slug: string;
  topic: string;
  title: Localized<string>;
  excerpt: Localized<string>;
  body: Localized<ArticleBlock[]>;
  references: Array<{ title: string; url?: string }>;
  relatedServiceIds: string[];
  publishedAt: string;
  updatedAt?: string;
  author?: Localized<string>;
  readingMinutes: Localized<number>;
}
