# Quote-request workflow, data and metric definitions

A quote request is an **enquiry**, not a priced quotation, contract or sale.

## 1. From the website to the dashboard

1. The visitor fills the bilingual quote form (`/en|ar/request-a-quote`). The browser and the server validate with the same schema (`src/lib/forms/schema.ts`).
2. Attachments upload one at a time to `/api/uploads`: declared type, extension, size and the file's content signature are checked; the bytes go to private storage with a random key. The upload is bound to an `HttpOnly`, `SameSite=Strict` upload-session cookie (2 h). The original filename is display metadata only (path, control and bidi-override characters removed).
3. On submit, `/api/enquiries` (same-origin only, rate-limited) calls `createFromPublicSubmission`, which in **one transaction** creates the request with a non-sequential reference (`ZNT-2026-7K3QF9`), its services, the attachment associations (only uploads from the same browser session, unused, under 2 h old, within the size limits), the first status event, an audit entry, in-app notifications and any staff-email jobs.
4. **Idempotency:** the browser sends a random key. The same key with the same content returns the original reference and creates nothing; the same key with different content is rejected. Two simultaneous identical submissions resolve to one record (unique index).
5. The visitor sees "Your request has been received. Reference: …". The receipt contains **only** `status` and `reference` — never notes, staff, status or audit data. If the database write fails, the visitor sees a failure, keeps their text and can retry safely.
6. Staff-email jobs run after the response. A provider failure is recorded on the job (sanitised error) and retried later; it never touches the stored enquiry.

Partner enquiries and career applications are separate dashboard records (Partners & careers, owner decision OD-05 of 28 Oct 2026): the same endpoint stores them in one transaction with a `PTR-2026-…` or `CAR-2026-…` reference, an audit entry and owner/manager notifications. A career application's CV goes through the same private, session-bound, quarantined upload path as quote attachments. They have their own short workflow (New → In review → Contacted → Closed; reopening needs a reason), internal notes and archive/spam, no assignment, and are visible to owners and managers only. The owner can pause either form in Settings; the endpoint then answers `503 closed` and the page explains it. No historical requests were migrated: the site never stored live enquiries before these versions.

## 2. Statuses

| Code | English | Arabic | Meaning |
| --- | --- | --- | --- |
| `new` | New | جديد | Received, awaiting review |
| `in_review` | In review | قيد المراجعة | Staff assessing the enquiry |
| `awaiting_information` | Awaiting information | بانتظار معلومات إضافية | Clarification requested or needed (changing the status sends nothing) |
| `preparing_quote` | Preparing quote | جارٍ إعداد عرض السعر | Scope accepted for proposal preparation |
| `quote_sent` | Quote sent | تم إرسال عرض السعر | A proposal was actually sent, or an offline send was recorded |
| `won` | Won | تم الاتفاق | Confirmed positive outcome |
| `lost` | Not proceeding | لم يتم الاتفاق | Closed without proceeding |

### Allowed transitions

| From | To | Rules |
| --- | --- | --- |
| New | In review, Awaiting information, Not proceeding | Not proceeding needs a reason |
| In review | Awaiting information, Preparing quote, Not proceeding | Preparing quote needs an assignee (setting, on by default) |
| Awaiting information | In review, Preparing quote, Not proceeding | — |
| Preparing quote | Quote sent, In review, Awaiting information, Not proceeding | Quote sent needs **evidence**: a sent proposal message (provider-accepted or test outbox) or a labelled offline-send record, plus an assignee |
| Quote sent | Won, Not proceeding, Preparing quote, Awaiting information | Any move except Won needs a reason |
| Won / Not proceeding | In review (reopen) | Reason required |

Every change stores actor, time, previous and new status, reason and evidence (`status_event`) and an audit entry. Requests use **optimistic concurrency**: each change sends the version the person saw; if someone else changed the request meanwhile, the change is refused with "Someone else changed this request…" and a Refresh button (unsaved text stays). Nothing marks a request Won automatically, and workflow changes never message the client.

## 3. Archive, spam and deletion (dispositions, not statuses)

- **Archive** and **Mark as spam** move a request out of the active pipeline without changing its status or history; both are reversible (**Restore to active**). Bulk versions require a confirmation that states the count.
- **Permanent deletion** is owner-only, only for archived/spam records, and needs the reference typed. It removes the request, its notes, messages, follow-ups, proposals and stored files (database storage: in the same transaction; filesystem storage: deletion is verified and any unverified file is reported). An audit entry with the reference remains. No automatic purge runs.

## 4. Notes, clarifications, follow-ups

- **Internal notes** (amber, "Visible to staff only") are plain text, stored in `request_note`; edits keep the previous text in `note_revision`; there is no routine note deletion. Notes are never read by the messaging code, the public endpoints or exports.
- **Clarifications** (corrected email, phone, scope…) are stored beside the original submission, never over it. A clarified email address becomes an allowed recipient.
- **Follow-ups**: action, due date/time (entered and shown in the configured timezone) and a responsible person who can see the request. "Due today" and "Overdue" are computed live; no SLA or business-hours calendar is assumed and no reminder emails are sent.

## 5. Client communication and proposals

- Drafts start from editable templates (acknowledgement, missing information, proposal cover, follow-up) **in the client's submission language**, whatever the staff interface language. Recipients are limited to the email on file and clarified emails.
- Attachments are limited to **this request's** proposal PDFs (never client uploads, notes or other requests' files).
- Sending is a separate, confirmed action (owners/managers) showing recipient, subject and attachments. The message is claimed (`sending`) before the provider call and uses a stable Message-ID, so a retry does not create a second message; a crash mid-send is never retried automatically ("Mark as failed so it can be retried").
- States: Draft · Sending · Accepted by the mail provider (not proof of reading) · Delivered to the local test outbox · Failed (draft kept, error shown) · Recorded as sent outside the dashboard.
- Without an email transport: copy the message, or open it in the email app (nothing is recorded), then **Record an offline send**.
- **Proposals**: PDF, version number, issue date, optional expiry, optional amount with an explicit ISO currency (no tax, VAT or exchange rates). A version becomes immutable once sent; changes mean a new version.

## 6. Files

| State | Meaning | Downloadable |
| --- | --- | --- |
| Not scanned — release required | No scanner configured (default) | No, until an owner/manager releases it (audited) |
| Released after review | Deliberately released | Yes |
| Scanned — no threat found / Blocked | Only with a configured scanner (`FILE_SCAN_MODE=test` is a local test scanner) | Clean only |

Staff-uploaded proposal PDFs are treated as internal documents (released by the uploader) unless a scanner is configured. Images can be previewed inline; PDFs always download as attachments. Responses are `private, no-store`, `nosniff`, sandboxed CSP, never HTML.

## 7. Notifications

- In-app, per person: new requests (owners and managers, setting), assignment to you, follow-ups assigned to you. Opening a request marks its notifications read for **you only**. The count refreshes every 60 s while the tab is visible.
- Optional staff email (Settings + personal opt-in + SMTP): reference and a dashboard link only — no names, descriptions or file links. Jobs retry up to 5 times; owners can requeue failures in Settings.

## 8. Metric definitions (Overview)

- **Unique requests.** Every figure counts request IDs; several services never count a request twice; form retries never create duplicates.
- **Spam** is excluded from every figure except "Marked as spam" (marked during the period). **Archived** requests count as received but are not in the current pipeline.
- **Current pipeline** = active (not archived, not spam) requests right now, by status; "Open and unassigned" = active, status New…Quote sent, no assignee; "Follow-ups due" = open follow-ups due today or overdue.
- **During the period** (7/30/90 days) = whole local days in the configured timezone (default Africa/Cairo), including 23- and 25-hour DST days:
  - Requests received — created in the period (not spam).
  - Requests moved to quote sent — distinct requests with at least one move to Quote sent in the period.
  - Outcomes — requests whose **current** status is Won / Not proceeding and was set in the period (a request reopened later drops out).
- No conversion rate, revenue, response-time or forecast figure is shown until those definitions are agreed. A failed metric query shows an error, never zeros. All figures respect the viewer's permissions (a reviewer's overview covers their assigned requests).

## 9. Exports

Owner/manager only. Scope: the selected rows or all rows matching the current filters (max 5,000; the count is shown before downloading). Default columns: reference, received time (with timezone), status, record state, services, country, company, language, scope, assignee. Contact name, email, phone and project description are explicit opt-ins. Never exported: internal notes, audit data, files. Format: UTF-8 with BOM, quoted cells, CRLF; any cell starting with `= + - @ | %`, tab, CR (or full-width variants, or after leading spaces) is prefixed with `'` so spreadsheets treat it as text. Generated per request, `no-store`, no stored file or link. The audit entry records scope, count and columns — never the data.

## 10. Audit log

Recorded (actor, time, request, entity, small non-sensitive metadata): request received/assigned/status changed/archived/restored/marked spam/clarified/deleted; partner/career record received/status changed/note added/archived/restored/marked spam/deleted; notes added/edited; follow-ups; messages drafted/sent/failed/offline; proposals; file link issued/downloaded/released; exports; invitations, role changes, access revoked/restored, owner bootstrap; settings (which keys changed, never the values); notification requeues. Retention deletions are recorded with the actor "Website form"/system, the reference and the reason `retention`. Never recorded: message bodies, note text, file contents, signed links, passwords, tokens.

## 10a. Retention (owner decision OD-25, stated in the privacy policy)

The built-in scheduler applies it daily (`src/server/admin/retention.ts`, periods in `src/lib/legal.ts`): quote requests are deleted 24 months after the last activity (`updated_at`, which every staff action moves forward), except requests marked **Won**, which stay until an owner deletes them; partner enquiries after 24 months; career applications and CVs after 12 months; anything marked as spam 30 days after it was marked; never-submitted uploads after 24 hours. Files are removed from private storage with their record. Settings → Retention shows what is due now and within the next 30 days.

## 11. Data model (PostgreSQL)

`quote_request` (immutable ID, unique non-sequential reference, version, original contact/enquiry fields, locale, origin page/service, privacy acknowledgement + policy version, idempotency key hash + payload hash, status, assignee, disposition) · `application` (partner enquiries and career applications: kind, kind-specific fields checked per kind, same governance and idempotency columns, own status set) + `application_note` · `public_rate_limit` (hashed form-protection counters) · `request_service` · `request_clarification` · `attachment` (+ `file_blob` for database storage) · `request_note` + `note_revision` · `status_event` · `assignment_event` · `follow_up` · `message` + `message_attachment` · `proposal` · `notification_job` · `in_app_notification` · `request_read` (per-person unread state) · `audit_event` · `team_member` · `invitation` (token stored as SHA-256 hash) · `setting` · Better Auth: `user`, `session`, `account`, `verification`, `two_factor`, `rate_limit`.

Constraints: foreign keys, check constraints for every code list (status, disposition, locale, role, scan state, message state), ISO country/currency formats, amount-requires-currency. Indexes: created/updated date (with ID for stable ordering), status, assignee, disposition, lower(email), open follow-ups by due date, unread notifications, audit by date/category/request. Timestamps are `timestamptz` (UTC).
