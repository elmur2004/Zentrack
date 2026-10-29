/**
 * Stable codes shared by the database schema, server and dashboard UI.
 * Labels live in the admin dictionaries (src/i18n/admin); never store translated text.
 */
export const ROLES = ['owner', 'manager', 'reviewer', 'read_only'] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = ['new', 'in_review', 'awaiting_information', 'preparing_quote', 'quote_sent', 'won', 'lost'] as const;
export type RequestStatus = (typeof STATUSES)[number];

export const DISPOSITIONS = ['active', 'archived', 'spam'] as const;
export type Disposition = (typeof DISPOSITIONS)[number];

/** Partner enquiries and career applications (public partner/careers forms). */
export const APPLICATION_KINDS = ['partner', 'career'] as const;
export type ApplicationKind = (typeof APPLICATION_KINDS)[number];
export const APPLICATION_STATUSES = ['new', 'in_review', 'contacted', 'closed'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export const APPLICATION_VIEWS = ['active', 'archived', 'spam'] as const;
export type ApplicationView = (typeof APPLICATION_VIEWS)[number];

export const MESSAGE_STATUSES = ['draft', 'queued', 'sending', 'sent', 'test_delivered', 'failed', 'sent_offline'] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const SCAN_STATES = ['unscanned', 'pending_scan', 'clean', 'infected', 'released'] as const;
export type ScanStateCode = (typeof SCAN_STATES)[number];

/** Fields a staff member may clarify (stored beside the original submission, never over it). */
export const CLARIFY_FIELDS = ['contact_name', 'company', 'email', 'phone', 'country', 'scope', 'services', 'description', 'other'] as const;
export type ClarifyField = (typeof CLARIFY_FIELDS)[number];

export const TEMPLATE_KEYS = ['acknowledgement', 'missing_information', 'proposal_cover', 'follow_up'] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

/** ISO 4217 codes offered for optional proposal amounts (explicit currency; no conversion or tax). */
export const CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP', 'SAR', 'AED', 'QAR', 'KWD', 'OMR', 'BHD', 'JOD'] as const;

export const LIST_VIEWS = ['inbox', 'queue', 'archived', 'spam'] as const;
export type ListView = (typeof LIST_VIEWS)[number];
export const LIST_SORTS = ['received', 'updated', 'follow_up'] as const;
export type ListSort = (typeof LIST_SORTS)[number];
export const FOLLOW_UP_FILTERS = ['overdue', 'today', 'due', 'none'] as const;
export type FollowUpFilter = (typeof FOLLOW_UP_FILTERS)[number];
export const PAGE_SIZES = [10, 25, 50] as const;

export const METRIC_WINDOWS = [7, 30, 90] as const;

export const EXPORT_OPTIONAL_FIELDS = ['contact', 'email', 'phone', 'description'] as const;
export type ExportOptionalField = (typeof EXPORT_OPTIONAL_FIELDS)[number];
