-- DOWN migration for 0000_initial_quote_dashboard (manual, destructive).
-- Drops every dashboard table. Run only on a database you intend to empty, after a verified backup.
-- Not wired to any npm script on purpose.
BEGIN;
DROP TABLE IF EXISTS "message_attachment" CASCADE;
DROP TABLE IF EXISTS "proposal" CASCADE;
DROP TABLE IF EXISTS "note_revision" CASCADE;
DROP TABLE IF EXISTS "request_note" CASCADE;
DROP TABLE IF EXISTS "request_clarification" CASCADE;
DROP TABLE IF EXISTS "request_service" CASCADE;
DROP TABLE IF EXISTS "request_read" CASCADE;
DROP TABLE IF EXISTS "in_app_notification" CASCADE;
DROP TABLE IF EXISTS "notification_job" CASCADE;
DROP TABLE IF EXISTS "follow_up" CASCADE;
DROP TABLE IF EXISTS "status_event" CASCADE;
DROP TABLE IF EXISTS "assignment_event" CASCADE;
DROP TABLE IF EXISTS "message" CASCADE;
DROP TABLE IF EXISTS "attachment" CASCADE;
DROP TABLE IF EXISTS "file_blob" CASCADE;
DROP TABLE IF EXISTS "audit_event" CASCADE;
DROP TABLE IF EXISTS "quote_request" CASCADE;
DROP TABLE IF EXISTS "invitation" CASCADE;
DROP TABLE IF EXISTS "setting" CASCADE;
DROP TABLE IF EXISTS "team_member" CASCADE;
DROP TABLE IF EXISTS "two_factor" CASCADE;
DROP TABLE IF EXISTS "rate_limit" CASCADE;
DROP TABLE IF EXISTS "verification" CASCADE;
DROP TABLE IF EXISTS "account" CASCADE;
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
DROP TABLE IF EXISTS "drizzle"."__drizzle_migrations";
COMMIT;
