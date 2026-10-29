-- DOWN migration for 0001_owner_decisions_applications (manual, destructive).
-- Removes partner enquiries, career applications (and their CV files' rows), application notes and
-- the shared public rate-limit table, then restores the 0000 attachment constraints.
-- Run only on a database you intend to empty, after a verified backup. Not wired to any npm script.
BEGIN;
DELETE FROM "attachment" WHERE "application_id" IS NOT NULL OR "kind" = 'cv';
ALTER TABLE "attachment" DROP CONSTRAINT IF EXISTS "attachment_owner_chk";
ALTER TABLE "attachment" DROP CONSTRAINT IF EXISTS "attachment_kind_chk";
DROP INDEX IF EXISTS "attachment_unassociated_idx";
DROP INDEX IF EXISTS "attachment_application_idx";
DROP INDEX IF EXISTS "audit_event_application_idx";
DROP INDEX IF EXISTS "in_app_notification_application_idx";
ALTER TABLE "attachment" DROP COLUMN IF EXISTS "application_id";
ALTER TABLE "audit_event" DROP COLUMN IF EXISTS "application_id";
ALTER TABLE "in_app_notification" DROP COLUMN IF EXISTS "application_id";
ALTER TABLE "notification_job" DROP COLUMN IF EXISTS "application_id";
DROP TABLE IF EXISTS "application_note" CASCADE;
DROP TABLE IF EXISTS "application" CASCADE;
DROP TABLE IF EXISTS "public_rate_limit" CASCADE;
CREATE INDEX "attachment_unassociated_idx" ON "attachment" USING btree ("created_at") WHERE "attachment"."request_id" is null;
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_kind_chk" CHECK ("attachment"."kind" in ('enquiry','proposal'));
-- 1793200192744 = the `when` of 0001 in drizzle/meta/_journal.json (stored as created_at by the migrator).
DELETE FROM "drizzle"."__drizzle_migrations" WHERE "created_at" = 1793200192744;
COMMIT;
