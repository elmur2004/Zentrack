CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignment_event" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"from_user_id" text,
	"to_user_id" text,
	"actor_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachment" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text,
	"kind" text NOT NULL,
	"storage_key" text NOT NULL,
	"original_name" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"mime_type" text NOT NULL,
	"sha256" text NOT NULL,
	"scan_state" text NOT NULL,
	"upload_session_hash" text,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"associated_at" timestamp with time zone,
	"released_by" text,
	"released_at" timestamp with time zone,
	"storage_deleted_at" timestamp with time zone,
	CONSTRAINT "attachment_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "attachment_kind_chk" CHECK ("attachment"."kind" in ('enquiry','proposal')),
	CONSTRAINT "attachment_scan_chk" CHECK ("attachment"."scan_state" in ('unscanned','pending_scan','clean','infected','released'))
);
--> statement-breakpoint
CREATE TABLE "audit_event" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"category" text NOT NULL,
	"request_id" text,
	"entity_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_blob" (
	"storage_key" text PRIMARY KEY NOT NULL,
	"bytes" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follow_up" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"action" text NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"assignee_id" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by" text,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "in_app_notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"token_hash" text NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"user_id" text,
	CONSTRAINT "invitation_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "invitation_role_chk" CHECK ("invitation"."role" in ('owner','manager','reviewer','read_only'))
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"template_key" text,
	"is_proposal" boolean DEFAULT false NOT NULL,
	"language" text NOT NULL,
	"to_email" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"transport" text,
	"idempotency_key" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"provider_message_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_by" text,
	"sent_at" timestamp with time zone,
	CONSTRAINT "message_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "message_status_chk" CHECK ("message"."status" in ('draft','queued','sending','sent','test_delivered','failed','sent_offline'))
);
--> statement-breakpoint
CREATE TABLE "message_attachment" (
	"message_id" text NOT NULL,
	"attachment_id" text NOT NULL,
	CONSTRAINT "message_attachment_message_id_attachment_id_pk" PRIMARY KEY("message_id","attachment_id")
);
--> statement-breakpoint
CREATE TABLE "note_revision" (
	"id" text PRIMARY KEY NOT NULL,
	"note_id" text NOT NULL,
	"body" text NOT NULL,
	"edited_by" text,
	"edited_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_job" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text,
	"kind" text NOT NULL,
	"recipient_user_id" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_job_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "proposal" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"version" integer NOT NULL,
	"attachment_id" text NOT NULL,
	"issue_date" date NOT NULL,
	"expiry_date" date,
	"amount" numeric(14, 2),
	"currency" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"sent_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_money_chk" CHECK (("proposal"."amount" is null and "proposal"."currency" is null) or ("proposal"."amount" is not null and "proposal"."currency" ~ '^[A-Z]{3}$')),
	CONSTRAINT "proposal_status_chk" CHECK ("proposal"."status" in ('draft','sent'))
);
--> statement-breakpoint
CREATE TABLE "quote_request" (
	"id" text PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"contact_name" text NOT NULL,
	"company" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"country_code" text NOT NULL,
	"engagement_scope" text,
	"description" text NOT NULL,
	"submission_locale" text NOT NULL,
	"source_page" text,
	"source_service" text,
	"privacy_acknowledged_at" timestamp with time zone,
	"privacy_policy_version" text,
	"idempotency_key_hash" text NOT NULL,
	"payload_hash" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"outcome_reason" text,
	"assignee_id" text,
	"assigned_at" timestamp with time zone,
	"disposition" text DEFAULT 'active' NOT NULL,
	"disposition_at" timestamp with time zone,
	"disposition_by" text,
	"disposition_reason" text,
	CONSTRAINT "quote_request_reference_unique" UNIQUE("reference"),
	CONSTRAINT "quote_request_idempotency_key_hash_unique" UNIQUE("idempotency_key_hash"),
	CONSTRAINT "quote_request_status_chk" CHECK ("quote_request"."status" in ('new','in_review','awaiting_information','preparing_quote','quote_sent','won','lost')),
	CONSTRAINT "quote_request_disposition_chk" CHECK ("quote_request"."disposition" in ('active','archived','spam')),
	CONSTRAINT "quote_request_locale_chk" CHECK ("quote_request"."submission_locale" in ('en','ar')),
	CONSTRAINT "quote_request_country_chk" CHECK ("quote_request"."country_code" ~ '^[A-Z]{2}$')
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "request_clarification" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"field" text NOT NULL,
	"value" text NOT NULL,
	"note" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_note" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"author_id" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"edited_at" timestamp with time zone,
	"revision" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_read" (
	"user_id" text NOT NULL,
	"request_id" text NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "request_read_user_id_request_id_pk" PRIMARY KEY("user_id","request_id")
);
--> statement-breakpoint
CREATE TABLE "request_service" (
	"request_id" text NOT NULL,
	"service_id" text NOT NULL,
	CONSTRAINT "request_service_request_id_service_id_pk" PRIMARY KEY("request_id","service_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "setting" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_event" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"actor_id" text,
	"reason" text,
	"evidence_message_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"user_id" text PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"notify_email" boolean DEFAULT false NOT NULL,
	"invited_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "team_member_role_chk" CHECK ("team_member"."role" in ('owner','manager','reviewer','read_only')),
	CONSTRAINT "team_member_status_chk" CHECK ("team_member"."status" in ('active','revoked'))
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"two_factor_enabled" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_event" ADD CONSTRAINT "assignment_event_request_id_quote_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."quote_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_event" ADD CONSTRAINT "assignment_event_from_user_id_user_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_event" ADD CONSTRAINT "assignment_event_to_user_id_user_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_event" ADD CONSTRAINT "assignment_event_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_request_id_quote_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."quote_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_released_by_user_id_fk" FOREIGN KEY ("released_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_request_id_quote_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."quote_request"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up" ADD CONSTRAINT "follow_up_request_id_quote_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."quote_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up" ADD CONSTRAINT "follow_up_assignee_id_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up" ADD CONSTRAINT "follow_up_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up" ADD CONSTRAINT "follow_up_completed_by_user_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_app_notification" ADD CONSTRAINT "in_app_notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_app_notification" ADD CONSTRAINT "in_app_notification_request_id_quote_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."quote_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_request_id_quote_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."quote_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_sent_by_user_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_attachment" ADD CONSTRAINT "message_attachment_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_attachment" ADD CONSTRAINT "message_attachment_attachment_id_attachment_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_revision" ADD CONSTRAINT "note_revision_note_id_request_note_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."request_note"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_revision" ADD CONSTRAINT "note_revision_edited_by_user_id_fk" FOREIGN KEY ("edited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_job" ADD CONSTRAINT "notification_job_request_id_quote_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."quote_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_job" ADD CONSTRAINT "notification_job_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_request_id_quote_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."quote_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_attachment_id_attachment_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal" ADD CONSTRAINT "proposal_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_request" ADD CONSTRAINT "quote_request_assignee_id_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_request" ADD CONSTRAINT "quote_request_disposition_by_user_id_fk" FOREIGN KEY ("disposition_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_clarification" ADD CONSTRAINT "request_clarification_request_id_quote_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."quote_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_clarification" ADD CONSTRAINT "request_clarification_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_note" ADD CONSTRAINT "request_note_request_id_quote_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."quote_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_note" ADD CONSTRAINT "request_note_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_read" ADD CONSTRAINT "request_read_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_read" ADD CONSTRAINT "request_read_request_id_quote_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."quote_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_service" ADD CONSTRAINT "request_service_request_id_quote_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."quote_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setting" ADD CONSTRAINT "setting_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_event" ADD CONSTRAINT "status_event_request_id_quote_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."quote_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_event" ADD CONSTRAINT "status_event_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "assignment_event_request_idx" ON "assignment_event" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "attachment_request_idx" ON "attachment" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "attachment_unassociated_idx" ON "attachment" USING btree ("created_at") WHERE "attachment"."request_id" is null;--> statement-breakpoint
CREATE INDEX "audit_event_created_idx" ON "audit_event" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_event_request_idx" ON "audit_event" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "audit_event_category_idx" ON "audit_event" USING btree ("category","created_at");--> statement-breakpoint
CREATE INDEX "follow_up_request_idx" ON "follow_up" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "follow_up_due_idx" ON "follow_up" USING btree ("due_at") WHERE "follow_up"."completed_at" is null and "follow_up"."cancelled_at" is null;--> statement-breakpoint
CREATE INDEX "in_app_notification_user_idx" ON "in_app_notification" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE UNIQUE INDEX "in_app_notification_dedupe_uq" ON "in_app_notification" USING btree ("user_id","kind","request_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "message_request_idx" ON "message" USING btree ("request_id","created_at");--> statement-breakpoint
CREATE INDEX "notification_job_status_idx" ON "notification_job" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_request_version_uq" ON "proposal" USING btree ("request_id","version");--> statement-breakpoint
CREATE INDEX "quote_request_created_idx" ON "quote_request" USING btree ("created_at","id");--> statement-breakpoint
CREATE INDEX "quote_request_status_idx" ON "quote_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quote_request_assignee_idx" ON "quote_request" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "quote_request_disposition_idx" ON "quote_request" USING btree ("disposition");--> statement-breakpoint
CREATE INDEX "quote_request_updated_idx" ON "quote_request" USING btree ("updated_at","id");--> statement-breakpoint
CREATE INDEX "quote_request_email_idx" ON "quote_request" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "request_clarification_request_idx" ON "request_clarification" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "request_note_request_idx" ON "request_note" USING btree ("request_id","created_at");--> statement-breakpoint
CREATE INDEX "request_service_service_idx" ON "request_service" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "status_event_request_idx" ON "status_event" USING btree ("request_id","created_at");--> statement-breakpoint
CREATE INDEX "status_event_created_idx" ON "status_event" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "two_factor_user_idx" ON "two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "two_factor_secret_idx" ON "two_factor" USING btree ("secret");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");