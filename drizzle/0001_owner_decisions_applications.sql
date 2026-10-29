CREATE TABLE "application" (
	"id" text PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"contact_name" text NOT NULL,
	"company" text,
	"email" text NOT NULL,
	"phone" text,
	"country_code" text,
	"partner_type" text,
	"discipline" text,
	"experience_years" integer,
	"portfolio_url" text,
	"description" text,
	"submission_locale" text NOT NULL,
	"source_page" text,
	"privacy_acknowledged_at" timestamp with time zone,
	"privacy_policy_version" text,
	"idempotency_key_hash" text NOT NULL,
	"payload_hash" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"outcome_reason" text,
	"disposition" text DEFAULT 'active' NOT NULL,
	"disposition_at" timestamp with time zone,
	"disposition_by" text,
	"disposition_reason" text,
	CONSTRAINT "application_reference_unique" UNIQUE("reference"),
	CONSTRAINT "application_idempotency_key_hash_unique" UNIQUE("idempotency_key_hash"),
	CONSTRAINT "application_kind_chk" CHECK ("application"."kind" in ('partner','career')),
	CONSTRAINT "application_status_chk" CHECK ("application"."status" in ('new','in_review','contacted','closed')),
	CONSTRAINT "application_disposition_chk" CHECK ("application"."disposition" in ('active','archived','spam')),
	CONSTRAINT "application_locale_chk" CHECK ("application"."submission_locale" in ('en','ar')),
	CONSTRAINT "application_country_chk" CHECK ("application"."country_code" is null or "application"."country_code" ~ '^[A-Z]{2}$'),
	CONSTRAINT "application_experience_chk" CHECK ("application"."experience_years" is null or ("application"."experience_years" >= 0 and "application"."experience_years" <= 60)),
	CONSTRAINT "application_fields_chk" CHECK (("application"."kind" = 'partner' and "application"."company" is not null and "application"."country_code" is not null and "application"."partner_type" is not null and "application"."description" is not null)
        or ("application"."kind" = 'career' and "application"."discipline" is not null))
);
--> statement-breakpoint
CREATE TABLE "application_note" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"author_id" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_rate_limit" (
	"bucket" text PRIMARY KEY NOT NULL,
	"window_start" bigint NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attachment" DROP CONSTRAINT "attachment_kind_chk";--> statement-breakpoint
DROP INDEX "attachment_unassociated_idx";--> statement-breakpoint
ALTER TABLE "attachment" ADD COLUMN "application_id" text;--> statement-breakpoint
ALTER TABLE "audit_event" ADD COLUMN "application_id" text;--> statement-breakpoint
ALTER TABLE "in_app_notification" ADD COLUMN "application_id" text;--> statement-breakpoint
ALTER TABLE "notification_job" ADD COLUMN "application_id" text;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_disposition_by_user_id_fk" FOREIGN KEY ("disposition_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_note" ADD CONSTRAINT "application_note_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_note" ADD CONSTRAINT "application_note_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "application_created_idx" ON "application" USING btree ("created_at","id");--> statement-breakpoint
CREATE INDEX "application_kind_idx" ON "application" USING btree ("kind","disposition");--> statement-breakpoint
CREATE INDEX "application_status_idx" ON "application" USING btree ("status");--> statement-breakpoint
CREATE INDEX "application_updated_idx" ON "application" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "application_email_idx" ON "application" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "application_note_application_idx" ON "application_note" USING btree ("application_id","created_at");--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_app_notification" ADD CONSTRAINT "in_app_notification_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_job" ADD CONSTRAINT "notification_job_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachment_application_idx" ON "attachment" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "audit_event_application_idx" ON "audit_event" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "in_app_notification_application_idx" ON "in_app_notification" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "attachment_unassociated_idx" ON "attachment" USING btree ("created_at") WHERE "attachment"."request_id" is null and "attachment"."application_id" is null;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_owner_chk" CHECK ("attachment"."request_id" is null or "attachment"."application_id" is null);--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_kind_chk" CHECK ("attachment"."kind" in ('enquiry','proposal','cv'));