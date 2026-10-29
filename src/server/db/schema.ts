/**
 * Database schema (PostgreSQL dialect; PGlite locally/in tests, PostgreSQL via DATABASE_URL in production).
 * Auth tables follow Better Auth's core + two-factor + database rate-limit models.
 * App tables hold quote requests and their workflow. All timestamps are timestamptz (UTC).
 */
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/** bytea: node-postgres returns Buffer, PGlite returns Uint8Array — normalized to Buffer. */
const bytea = customType<{ data: Buffer; driverData: Buffer | Uint8Array }>({
  dataType: () => 'bytea',
  toDriver: (v) => v,
  fromDriver: (v) => (Buffer.isBuffer(v) ? v : Buffer.from(v)),
});

// ---------------------------------------------------------------------------
// Better Auth
// ---------------------------------------------------------------------------
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: ts('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => [index('session_user_idx').on(t.userId)],
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: ts('access_token_expires_at'),
    refreshTokenExpiresAt: ts('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [index('account_user_idx').on(t.userId)],
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: ts('expires_at').notNull(),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
);

export const twoFactor = pgTable(
  'two_factor',
  {
    id: text('id').primaryKey(),
    secret: text('secret').notNull(),
    backupCodes: text('backup_codes').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    verified: boolean('verified').default(true),
    failedVerificationCount: integer('failed_verification_count').default(0),
    lockedUntil: ts('locked_until'),
  },
  (t) => [index('two_factor_user_idx').on(t.userId), index('two_factor_secret_idx').on(t.secret)],
);

export const rateLimit = pgTable('rate_limit', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
});

// ---------------------------------------------------------------------------
// Team, invitations, settings
// ---------------------------------------------------------------------------
// Relative import: drizzle-kit loads this file without the app's path aliases.
import type { ApplicationKind, ApplicationStatus, Disposition, MessageStatus, RequestStatus, Role } from '../../lib/admin/codes';
export { ROLES, STATUSES, DISPOSITIONS, MESSAGE_STATUSES, APPLICATION_KINDS, APPLICATION_STATUSES } from '../../lib/admin/codes';
export type { Role, RequestStatus, Disposition, MessageStatus, ApplicationKind, ApplicationStatus } from '../../lib/admin/codes';

export const teamMember = pgTable(
  'team_member',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').$type<Role>().notNull(),
    status: text('status').$type<'active' | 'revoked'>().notNull().default('active'),
    notifyEmail: boolean('notify_email').notNull().default(false),
    invitedBy: text('invited_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
    revokedAt: ts('revoked_at'),
  },
  (t) => [
    check('team_member_role_chk', sql`${t.role} in ('owner','manager','reviewer','read_only')`),
    check('team_member_status_chk', sql`${t.status} in ('active','revoked')`),
  ],
);

export const invitation = pgTable(
  'invitation',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    role: text('role').$type<Role>().notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: ts('created_at').notNull().defaultNow(),
    expiresAt: ts('expires_at').notNull(),
    acceptedAt: ts('accepted_at'),
    revokedAt: ts('revoked_at'),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  },
  (t) => [
    index('invitation_email_idx').on(t.email),
    check('invitation_role_chk', sql`${t.role} in ('owner','manager','reviewer','read_only')`),
  ],
);

export const setting = pgTable('setting', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Quote requests
// ---------------------------------------------------------------------------
export const quoteRequest = pgTable(
  'quote_request',
  {
    id: text('id').primaryKey(),
    reference: text('reference').notNull().unique(),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
    version: integer('version').notNull().default(1),
    // contact (original submission; never overwritten)
    contactName: text('contact_name').notNull(),
    company: text('company').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    countryCode: text('country_code').notNull(),
    // enquiry
    engagementScope: text('engagement_scope'),
    description: text('description').notNull(),
    submissionLocale: text('submission_locale').$type<'en' | 'ar'>().notNull(),
    // origin
    sourcePage: text('source_page'),
    sourceService: text('source_service'),
    // governance
    privacyAcknowledgedAt: ts('privacy_acknowledged_at'),
    privacyPolicyVersion: text('privacy_policy_version'),
    idempotencyKeyHash: text('idempotency_key_hash').notNull().unique(),
    payloadHash: text('payload_hash').notNull(),
    // workflow
    status: text('status').$type<RequestStatus>().notNull().default('new'),
    statusChangedAt: ts('status_changed_at').notNull().defaultNow(),
    outcomeReason: text('outcome_reason'),
    assigneeId: text('assignee_id').references(() => user.id, { onDelete: 'set null' }),
    assignedAt: ts('assigned_at'),
    disposition: text('disposition').$type<Disposition>().notNull().default('active'),
    dispositionAt: ts('disposition_at'),
    dispositionBy: text('disposition_by').references(() => user.id, { onDelete: 'set null' }),
    dispositionReason: text('disposition_reason'),
  },
  (t) => [
    index('quote_request_created_idx').on(t.createdAt, t.id),
    index('quote_request_status_idx').on(t.status),
    index('quote_request_assignee_idx').on(t.assigneeId),
    index('quote_request_disposition_idx').on(t.disposition),
    index('quote_request_updated_idx').on(t.updatedAt, t.id),
    index('quote_request_email_idx').on(sql`lower(${t.email})`),
    check(
      'quote_request_status_chk',
      sql`${t.status} in ('new','in_review','awaiting_information','preparing_quote','quote_sent','won','lost')`,
    ),
    check('quote_request_disposition_chk', sql`${t.disposition} in ('active','archived','spam')`),
    check('quote_request_locale_chk', sql`${t.submissionLocale} in ('en','ar')`),
    check('quote_request_country_chk', sql`${t.countryCode} ~ '^[A-Z]{2}$'`),
  ],
);

// ---------------------------------------------------------------------------
// Partner enquiries and career applications (public partner/careers forms)
// ---------------------------------------------------------------------------
/**
 * One table for both public forms. Kind-specific fields are nullable and checked per kind.
 * Separate from quote_request on purpose: a lighter workflow (no services, proposals or quote
 * outcomes) and narrower access (owners and managers only; see policy.ts).
 */
export const application = pgTable(
  'application',
  {
    id: text('id').primaryKey(),
    reference: text('reference').notNull().unique(),
    kind: text('kind').$type<ApplicationKind>().notNull(),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
    version: integer('version').notNull().default(1),
    // submission (original; never overwritten)
    contactName: text('contact_name').notNull(),
    company: text('company'),
    email: text('email').notNull(),
    phone: text('phone'),
    countryCode: text('country_code'),
    partnerType: text('partner_type'),
    discipline: text('discipline'),
    experienceYears: integer('experience_years'),
    portfolioUrl: text('portfolio_url'),
    description: text('description'),
    submissionLocale: text('submission_locale').$type<'en' | 'ar'>().notNull(),
    sourcePage: text('source_page'),
    // governance
    privacyAcknowledgedAt: ts('privacy_acknowledged_at'),
    privacyPolicyVersion: text('privacy_policy_version'),
    idempotencyKeyHash: text('idempotency_key_hash').notNull().unique(),
    payloadHash: text('payload_hash').notNull(),
    // workflow
    status: text('status').$type<ApplicationStatus>().notNull().default('new'),
    statusChangedAt: ts('status_changed_at').notNull().defaultNow(),
    outcomeReason: text('outcome_reason'),
    disposition: text('disposition').$type<Disposition>().notNull().default('active'),
    dispositionAt: ts('disposition_at'),
    dispositionBy: text('disposition_by').references(() => user.id, { onDelete: 'set null' }),
    dispositionReason: text('disposition_reason'),
  },
  (t) => [
    index('application_created_idx').on(t.createdAt, t.id),
    index('application_kind_idx').on(t.kind, t.disposition),
    index('application_status_idx').on(t.status),
    index('application_updated_idx').on(t.updatedAt),
    index('application_email_idx').on(sql`lower(${t.email})`),
    check('application_kind_chk', sql`${t.kind} in ('partner','career')`),
    check('application_status_chk', sql`${t.status} in ('new','in_review','contacted','closed')`),
    check('application_disposition_chk', sql`${t.disposition} in ('active','archived','spam')`),
    check('application_locale_chk', sql`${t.submissionLocale} in ('en','ar')`),
    check('application_country_chk', sql`${t.countryCode} is null or ${t.countryCode} ~ '^[A-Z]{2}$'`),
    check('application_experience_chk', sql`${t.experienceYears} is null or (${t.experienceYears} >= 0 and ${t.experienceYears} <= 60)`),
    check(
      'application_fields_chk',
      sql`(${t.kind} = 'partner' and ${t.company} is not null and ${t.countryCode} is not null and ${t.partnerType} is not null and ${t.description} is not null)
        or (${t.kind} = 'career' and ${t.discipline} is not null)`,
    ),
  ],
);

/** Internal notes on a partner enquiry or career application (staff only). */
export const applicationNote = pgTable(
  'application_note',
  {
    id: text('id').primaryKey(),
    applicationId: text('application_id')
      .notNull()
      .references(() => application.id, { onDelete: 'cascade' }),
    authorId: text('author_id').references(() => user.id, { onDelete: 'set null' }),
    body: text('body').notNull(),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('application_note_application_idx').on(t.applicationId, t.createdAt)],
);

/**
 * Fixed-window counters for the public form endpoints, shared by every server instance
 * (OD-20). Rows are tiny and swept by the job runner.
 */
export const publicRateLimit = pgTable('public_rate_limit', {
  bucket: text('bucket').primaryKey(),
  windowStart: bigint('window_start', { mode: 'number' }).notNull(),
  count: integer('count').notNull(),
});

export const requestService = pgTable(
  'request_service',
  {
    requestId: text('request_id')
      .notNull()
      .references(() => quoteRequest.id, { onDelete: 'cascade' }),
    serviceId: text('service_id').notNull(),
  },
  (t) => [primaryKey({ columns: [t.requestId, t.serviceId] }), index('request_service_service_idx').on(t.serviceId)],
);

/** Staff clarifications/corrections stored beside (never over) the original submission. */
export const requestClarification = pgTable(
  'request_clarification',
  {
    id: text('id').primaryKey(),
    requestId: text('request_id')
      .notNull()
      .references(() => quoteRequest.id, { onDelete: 'cascade' }),
    field: text('field').notNull(),
    value: text('value').notNull(),
    note: text('note'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('request_clarification_request_idx').on(t.requestId)],
);

export const attachment = pgTable(
  'attachment',
  {
    id: text('id').primaryKey(),
    requestId: text('request_id').references(() => quoteRequest.id, { onDelete: 'cascade' }),
    /** CVs belong to a career application instead of a quote request (never both). */
    applicationId: text('application_id').references(() => application.id, { onDelete: 'cascade' }),
    kind: text('kind').$type<'enquiry' | 'proposal' | 'cv'>().notNull(),
    storageKey: text('storage_key').notNull().unique(),
    originalName: text('original_name').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    mimeType: text('mime_type').notNull(),
    sha256: text('sha256').notNull(),
    /** unscanned (no scanner configured) → released (manual review) | clean | infected (scanner) */
    scanState: text('scan_state').$type<'unscanned' | 'pending_scan' | 'clean' | 'infected' | 'released'>().notNull(),
    uploadSessionHash: text('upload_session_hash'),
    uploadedBy: text('uploaded_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: ts('created_at').notNull().defaultNow(),
    associatedAt: ts('associated_at'),
    releasedBy: text('released_by').references(() => user.id, { onDelete: 'set null' }),
    releasedAt: ts('released_at'),
    storageDeletedAt: ts('storage_deleted_at'),
  },
  (t) => [
    index('attachment_request_idx').on(t.requestId),
    index('attachment_application_idx').on(t.applicationId),
    index('attachment_unassociated_idx').on(t.createdAt).where(sql`${t.requestId} is null and ${t.applicationId} is null`),
    check('attachment_kind_chk', sql`${t.kind} in ('enquiry','proposal','cv')`),
    check('attachment_scan_chk', sql`${t.scanState} in ('unscanned','pending_scan','clean','infected','released')`),
    check('attachment_owner_chk', sql`${t.requestId} is null or ${t.applicationId} is null`),
  ],
);

/**
 * Private object storage (STORAGE_DRIVER=database, the default). Rows are addressed only by a
 * generated storage key and are never reachable through a public URL. The filesystem driver
 * stores the same keys under PRIVATE_STORAGE_DIR instead.
 */
export const fileBlob = pgTable('file_blob', {
  storageKey: text('storage_key').primaryKey(),
  bytes: bytea('bytes').notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const requestNote = pgTable(
  'request_note',
  {
    id: text('id').primaryKey(),
    requestId: text('request_id')
      .notNull()
      .references(() => quoteRequest.id, { onDelete: 'cascade' }),
    authorId: text('author_id').references(() => user.id, { onDelete: 'set null' }),
    body: text('body').notNull(),
    createdAt: ts('created_at').notNull().defaultNow(),
    editedAt: ts('edited_at'),
    revision: integer('revision').notNull().default(1),
  },
  (t) => [index('request_note_request_idx').on(t.requestId, t.createdAt)],
);

export const noteRevision = pgTable('note_revision', {
  id: text('id').primaryKey(),
  noteId: text('note_id')
    .notNull()
    .references(() => requestNote.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  editedBy: text('edited_by').references(() => user.id, { onDelete: 'set null' }),
  editedAt: ts('edited_at').notNull().defaultNow(),
});

export const statusEvent = pgTable(
  'status_event',
  {
    id: text('id').primaryKey(),
    requestId: text('request_id')
      .notNull()
      .references(() => quoteRequest.id, { onDelete: 'cascade' }),
    fromStatus: text('from_status'),
    toStatus: text('to_status').notNull(),
    actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
    reason: text('reason'),
    evidenceMessageId: text('evidence_message_id'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('status_event_request_idx').on(t.requestId, t.createdAt), index('status_event_created_idx').on(t.createdAt)],
);

export const assignmentEvent = pgTable(
  'assignment_event',
  {
    id: text('id').primaryKey(),
    requestId: text('request_id')
      .notNull()
      .references(() => quoteRequest.id, { onDelete: 'cascade' }),
    fromUserId: text('from_user_id').references(() => user.id, { onDelete: 'set null' }),
    toUserId: text('to_user_id').references(() => user.id, { onDelete: 'set null' }),
    actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('assignment_event_request_idx').on(t.requestId)],
);

export const followUp = pgTable(
  'follow_up',
  {
    id: text('id').primaryKey(),
    requestId: text('request_id')
      .notNull()
      .references(() => quoteRequest.id, { onDelete: 'cascade' }),
    action: text('action').notNull(),
    dueAt: ts('due_at').notNull(),
    assigneeId: text('assignee_id').references(() => user.id, { onDelete: 'set null' }),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: ts('created_at').notNull().defaultNow(),
    completedAt: ts('completed_at'),
    completedBy: text('completed_by').references(() => user.id, { onDelete: 'set null' }),
    cancelledAt: ts('cancelled_at'),
  },
  (t) => [index('follow_up_request_idx').on(t.requestId), index('follow_up_due_idx').on(t.dueAt).where(sql`${t.completedAt} is null and ${t.cancelledAt} is null`)],
);

/** Outbound client communication. Internal notes live in request_note — never here. */
export const message = pgTable(
  'message',
  {
    id: text('id').primaryKey(),
    requestId: text('request_id')
      .notNull()
      .references(() => quoteRequest.id, { onDelete: 'cascade' }),
    templateKey: text('template_key'),
    isProposal: boolean('is_proposal').notNull().default(false),
    language: text('language').$type<'en' | 'ar'>().notNull(),
    toEmail: text('to_email').notNull(),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    status: text('status').$type<MessageStatus>().notNull().default('draft'),
    transport: text('transport'),
    idempotencyKey: text('idempotency_key').notNull().unique(),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    providerMessageId: text('provider_message_id'),
    version: integer('version').notNull().default(1),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
    sentBy: text('sent_by').references(() => user.id, { onDelete: 'set null' }),
    sentAt: ts('sent_at'),
  },
  (t) => [
    index('message_request_idx').on(t.requestId, t.createdAt),
    check('message_status_chk', sql`${t.status} in ('draft','queued','sending','sent','test_delivered','failed','sent_offline')`),
  ],
);

export const messageAttachment = pgTable(
  'message_attachment',
  {
    messageId: text('message_id')
      .notNull()
      .references(() => message.id, { onDelete: 'cascade' }),
    // NO ACTION (checked at statement end) so a deliberate request deletion can cascade cleanly.
    attachmentId: text('attachment_id')
      .notNull()
      .references(() => attachment.id),
  },
  (t) => [primaryKey({ columns: [t.messageId, t.attachmentId] })],
);

export const proposal = pgTable(
  'proposal',
  {
    id: text('id').primaryKey(),
    requestId: text('request_id')
      .notNull()
      .references(() => quoteRequest.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    attachmentId: text('attachment_id')
      .notNull()
      .references(() => attachment.id),
    issueDate: date('issue_date', { mode: 'string' }).notNull(),
    expiryDate: date('expiry_date', { mode: 'string' }),
    amount: numeric('amount', { precision: 14, scale: 2 }),
    currency: text('currency'),
    status: text('status').$type<'draft' | 'sent'>().notNull().default('draft'),
    sentAt: ts('sent_at'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('proposal_request_version_uq').on(t.requestId, t.version),
    check('proposal_money_chk', sql`(${t.amount} is null and ${t.currency} is null) or (${t.amount} is not null and ${t.currency} ~ '^[A-Z]{3}$')`),
    check('proposal_status_chk', sql`${t.status} in ('draft','sent')`),
  ],
);

/** Durable staff-notification work (email). Processed after commit; retryable. */
export const notificationJob = pgTable(
  'notification_job',
  {
    id: text('id').primaryKey(),
    requestId: text('request_id').references(() => quoteRequest.id, { onDelete: 'cascade' }),
    applicationId: text('application_id').references(() => application.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    recipientUserId: text('recipient_user_id').references(() => user.id, { onDelete: 'cascade' }),
    status: text('status').$type<'queued' | 'sending' | 'sent' | 'test_delivered' | 'failed' | 'skipped'>().notNull().default('queued'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    idempotencyKey: text('idempotency_key').notNull().unique(),
    createdAt: ts('created_at').notNull().defaultNow(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [index('notification_job_status_idx').on(t.status, t.createdAt)],
);

/** In-app notifications, read state per user. */
export const inAppNotification = pgTable(
  'in_app_notification',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    requestId: text('request_id').references(() => quoteRequest.id, { onDelete: 'cascade' }),
    applicationId: text('application_id').references(() => application.id, { onDelete: 'cascade' }),
    createdAt: ts('created_at').notNull().defaultNow(),
    readAt: ts('read_at'),
  },
  (t) => [
    index('in_app_notification_user_idx').on(t.userId, t.readAt),
    uniqueIndex('in_app_notification_dedupe_uq').on(t.userId, t.kind, t.requestId),
    index('in_app_notification_application_idx').on(t.applicationId),
  ],
);

/** Per-user "opened" marker for unread styling in the inbox. */
export const requestRead = pgTable(
  'request_read',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    requestId: text('request_id')
      .notNull()
      .references(() => quoteRequest.id, { onDelete: 'cascade' }),
    readAt: ts('read_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.requestId] })],
);

/** Sensitive administrative actions. Metadata never contains message bodies, files or signed URLs. */
export const auditEvent = pgTable(
  'audit_event',
  {
    id: text('id').primaryKey(),
    actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    category: text('category').$type<'request' | 'application' | 'file' | 'communication' | 'team' | 'settings' | 'export' | 'auth'>().notNull(),
    requestId: text('request_id').references(() => quoteRequest.id, { onDelete: 'set null' }),
    applicationId: text('application_id').references(() => application.id, { onDelete: 'set null' }),
    entityId: text('entity_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('audit_event_created_idx').on(t.createdAt),
    index('audit_event_request_idx').on(t.requestId),
    index('audit_event_application_idx').on(t.applicationId),
    index('audit_event_category_idx').on(t.category, t.createdAt),
  ],
);

export const authSchema = { user, session, account, verification, twoFactor, rateLimit };
