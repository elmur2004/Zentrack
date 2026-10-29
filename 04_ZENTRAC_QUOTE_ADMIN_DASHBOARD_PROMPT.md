# Zentrac quote-request admin dashboard implementation prompt

Read this prompt completely, inspect the existing Zentrac website and backend, and implement the working system described below. This is a request to build and verify a functional internal application, not just design dashboard screens or create a plan.

## 1. Goal and context

Build a secure, modern, bilingual English/Arabic admin dashboard for managing quote requests submitted through Zentrac's website.

The dashboard must let authorized staff receive, review, assign, follow up on, and track enquiries from initial request to outcome. It must connect to the real website form, persist records, protect uploaded documents, and provide useful operational reporting.

Assume a single-company internal dashboard for Zentrac. Do not add a customer portal, ecommerce, payment collection, full CRM, ERP or multi-tenant SaaS platform unless separately requested. A quote request is an enquiry; it is not automatically a priced quotation, contract or sale.

Read:

1. `01_ZENTRAC_WEBSITE_MASTER_PLAN.md`
2. `02_ZENTRAC_WEBSITE_BUILD_SPEC.md`
3. `03_ZENTRAC_POST_BUILD_AUDIT_AND_POLISH_PROMPT.md`
4. The existing quote form, validation schemas, API/server actions, storage, notification adapter and environment documentation.
5. Existing repository instructions and any later owner decisions.

Reuse compatible existing infrastructure. If there is no backend, implement the required persistence, authentication and private file handling using a suitable supported stack. Select the simplest maintainable architecture that fits the current application and deployment. Document the choice and migrations. Do not assume that local storage, a static JSON file, in-memory arrays or hardcoded demo rows are an acceptable production database.

Missing production credentials must not prevent local development and tests. Use clearly separated local/test services where needed, and identify exactly what remains to configure. Never leave a publicly accessible admin dashboard as a workaround for missing authentication.

## 2. Inspect before implementing

- Identify the actual framework, rendering mode, hosting constraints, database, auth provider, email provider and upload pipeline.
- Check whether form submissions currently persist or merely trigger email. Determine how a durable request record will be created.
- Review the current form fields, service IDs, country codes, source pages and locale handling.
- Check private storage permissions and how existing uploads are associated with a request.
- Inspect current repository changes and preserve unrelated work. Use a branch/checkpoint if available.
- Identify existing admin users/roles without exposing credentials. Do not create an account with a guessed real person's email.
- Create a short implementation checklist and schema migration plan, then proceed with the work.

Use relevant available skills for database design, authentication, frontend UX, Arabic/RTL, accessibility and browser testing. Do not invent installed tools or force an unnecessary framework migration.

## 3. Required screens and routes

Use the site's locale convention, preferably `/en/admin/...` and `/ar/admin/...`. Adapt to an existing sound routing structure if necessary. Admin pages must use their own application shell rather than the public marketing header/footer.

| Screen | Purpose |
| --- | --- |
| Sign in | Secure access through the chosen authentication system |
| Overview | Operational counts, unassigned/new items, recent activity and due follow-ups |
| Quote requests | Searchable, filterable, paginated request inbox |
| Request detail | Complete enquiry, assignment, status, notes, attachments, communication and timeline |
| My queue | Requests assigned to the current staff member, including due follow-ups |
| Archived/spam views | Deliberate non-active records, separate from the main pipeline |
| Team and permissions | Owner-managed membership and role assignment |
| Settings | Allowed workflow/notification settings and verified business configuration |
| Audit activity | Authorized review of sensitive administrative actions |
| Localized unavailable/forbidden/not-found/error states | Clear, safe recovery without exposing data |

Prefer an Overview plus a strong inbox/detail workflow over many thin dashboards. A kanban view is optional after the table workflow is complete. Never make drag-and-drop the only way to change status.

## 4. Brand and admin interface design

Use the Zentrac brand: navy `#0B1624`, orange `#FA5211`, light surfaces based on `#F8F9FA`, Saira for English, and the agreed Arabic font. Use the authentic logo without distortion or mirroring.

Design a clean, restrained operational interface:

- Collapsible desktop sidebar, compact top bar, clear page heading, search/filter toolbar and readable data area.
- Light primary working surface; navy navigation; orange reserved for primary actions and important emphasis.
- Status colors must have labels/icons as well as color and must meet contrast requirements.
- Comfortable information density, consistent columns, clear row actions and visible focus.
- Request detail can use a main content column and a smaller assignment/status/follow-up panel, stacking naturally on mobile.
- Avoid a large marketing-style hero, decorative 3D scenes, unnecessary charts or continuous animation inside the dashboard.
- Keep controls legible and touch targets usable. Do not shrink Arabic labels to force an English-width layout.

Use restrained transitions for opening panels, updating filters, changing tabs and showing feedback, generally around 120–220ms. Important actions should feel immediate. Respect reduced motion and avoid animated numbers that delay reading. The public website's enhanced animations should not be copied wholesale into a data-management workflow.

## 5. Authentication, authorization and sessions

Use the existing reputable authentication provider if one is configured. Otherwise implement an established supported auth solution; do not invent password hashing, session cryptography or recovery flows.

- No public admin registration. Membership is provisioned or invited by an authorized owner.
- Do not create default/shared passwords or hardcode credentials into source code.
- Document a safe initial-owner setup process using a verified identity, without printing secrets.
- Support the provider's MFA capability for privileged accounts where available; report actual configuration, not assumed protection.
- Enforce authentication and role/resource authorization on the server for every admin page, API, mutation, export, download and file-signing action.
- A hidden button or client-side route guard is not authorization.
- Use secure session handling appropriate to the provider; cookie sessions should use appropriate HttpOnly, Secure and SameSite attributes. Do not store session secrets or admin passwords in browser local storage.
- Handle session expiry, logout, revoked access and invalid tokens gracefully. Preserve safe unsaved text in memory when possible without persisting confidential data unnecessarily.
- Ensure logout/revocation prevents subsequent requests and private downloads; stale tabs must not retain actionable access.
- Apply private/no-store caching where appropriate so sensitive SSR/API responses are not shared across users.
- Keep admin routes out of public navigation, sitemap, search indexes and sharing previews; apply suitable noindex metadata. This supplements, but never replaces, access control.
- Do not expose internal notes, staff email addresses, audit records or status details through the public enquiry confirmation endpoint.

### Minimum permission model

Default roles are a proposal; fit them to the owner's team without making every user an administrator.

| Action | Owner | Manager | Reviewer | Read-only |
| --- | --- | --- | --- | --- |
| View all requests | Yes | Yes | Assigned requests only | Assigned requests only |
| View/download associated files | Yes | Yes | Assigned requests only | Assigned requests only |
| Assign/reassign requests | Yes | Yes | No | No |
| Add internal notes and follow-ups | Yes | Yes | Assigned requests only | No |
| Update ordinary workflow status | Yes | Yes | Assigned requests, within allowed transitions | No |
| Draft replies/quotes | Yes | Yes | Assigned requests | No |
| Send external replies/proposals | Yes | Yes | No by default | No |
| Export records | Yes | Yes, within permitted scope | No | No |
| Archive or mark spam | Yes | Yes | No by default | No |
| Manage users/roles/settings | Yes | No | No | No |
| View audit activity | Yes | Operational subset | No | No |
| Permanent deletion | Owner through deliberate process only | No | No | No |

Keep permissions configurable in a controlled policy layer. Test access using direct requests and guessed/changed IDs, not only by observing whether controls are visible.

## 6. Quote request data model

Use database-enforced relationships and stable IDs. Suggested fields:

| Group | Fields |
| --- | --- |
| Identity | Internal immutable ID, human-readable reference, created timestamp, updated timestamp, row/version counter |
| Contact | Name, company, email, optional phone, country code |
| Enquiry | Service IDs, engagement scope, project description, original submission locale |
| Origin | Relevant public form/page, submitted service context; approved campaign attribution only if already collected |
| Ownership | Assigned staff ID, assignment timestamps |
| Workflow | Status, status-change timestamps, outcome reason where relevant |
| Follow-up | Next action, due date/time, reminder state |
| Files | Private attachment records with storage key, original filename, size, type, scan state and request association |
| Communication | Internal notes, draft/outgoing messages, provider receipt state and timestamps |
| Governance | Privacy-policy version/acknowledgement where collected, archive/spam markers, audit relationships |

Keep service/country/status values as stable codes with translated UI labels. Store timestamps in UTC. Display an explicit configured timezone, defaulting to `Africa/Cairo` for this company, and apply date filters using timezone-aware boundaries.

Do not add browser fingerprinting, unnecessary location data, government IDs or speculative lead scoring. Do not silently overwrite the original enquiry when a staff member adds clarification; preserve original submission text and store corrections/updates separately with audit history.

Suggested related tables/entities: requests, request-services, attachments, assignments or assignment events, notes, status events, follow-ups, outgoing-message jobs, team memberships and audit events. Reuse existing models where appropriate.

Apply uniqueness/foreign-key constraints and useful indexes for created date, status, assignee and supported search. Handle Unicode correctly. Do not use a visible sequential reference as the only access-control mechanism.

## 7. Website form integration and reliable receipt

Connect the public quote form to this system without breaking its existing bilingual validation and user experience.

1. Validate input on the server using the shared schema.
2. Verify allowed attachment references and their relationship to this submission.
3. Create the request, its reference and associated records durably.
4. Use an idempotency key so repeated clicks or retries do not create duplicate requests.
5. Queue internal notification work separately from durable receipt, with retry behavior.
6. Return a truthful receipt and request reference to the visitor.
7. Show the request in the authorized dashboard with original locale, service choices and attachment state intact.

If a notification provider fails after the database commit, do not tell the visitor the enquiry was lost or create another record on retry. Record the notification failure and allow a controlled retry. If the request was not saved, return a clear failure and preserve the visitor's entered text.

Public attachments must never become accessible merely because an opaque upload ID is supplied. Verify ownership/session binding and expected state before associating them. A file still quarantined must display that state internally and remain unavailable for staff download until permitted.

If a legacy form only emails requests, document what existing messages can actually be migrated. Do not claim historical email requests are in the dashboard unless an authorized import has been implemented and verified.

## 8. Request inbox behavior

Default columns: reference, company/contact, requested services, country, received date, status, assignee, next follow-up and attachment indicator. Allow a smaller practical column set at narrow widths.

Required capabilities:

- Search by reference, contact name, company and email within the viewer's authorized scope.
- Filter by status, service, country, assignee, unassigned, received-date range, submission language, and follow-up due/overdue.
- Sort by received date, updated date or follow-up date with stable secondary ordering.
- Server-side pagination or a comparably scalable strategy; explicit result count and page state.
- URL-backed non-sensitive filter/sort/page state, preserved on return from a detail screen. Do not put email addresses, names or free-text descriptions in the URL; keep sensitive search terms in protected request/in-memory state.
- Clear filters, empty inbox, no-match, loading, error and retry states in both languages.
- Row selection and permitted bulk actions with explicit selected counts. “Select this page” and “Select all matching” must be distinct if both exist.
- Confirmation for consequential bulk changes showing what will change and how many records are affected.
- No accidental row navigation when interacting with a checkbox, menu or action button.
- Permission-filtered totals; do not reveal unauthorized record counts through filters or summary badges.

When filters change, return to a valid page and preserve keyboard focus. Announce changes politely without reading the entire table. Use a real semantic table on desktop; use a clear mobile layout without duplicate hidden focusable controls.

## 9. Request detail workspace

Display:

- Request reference, received time, original language, current status and assignment.
- Contact/company information with correctly isolated phone/email values.
- Requested services, country, engagement scope and the full unaltered project description.
- Associated files and their validation/scan availability state.
- Internal notes, communication history, follow-up tasks and chronological activity.
- Clear actions appropriate to the user's role.

Provide tabs or sections such as Overview, Files, Notes, Communication and Activity. Preserve useful context while moving between them. A direct link to a valid tab/section should work after reload.

Make “Internal note” visually and semantically distinct from “Message to client.” Never send a private note as an external reply because the two share a composer or ambiguous button.

Use optimistic concurrency for edits. If another staff member changes the request, detect the version conflict, explain it, and allow refresh/reconciliation. Do not silently overwrite newer notes, assignment or status.

For noncritical optimistic UI changes, rollback visibly on failure. For sending messages or consequential status changes, show the actual server-confirmed state. Prevent duplicate actions and preserve unsaved drafts in memory where possible.

## 10. Workflow and status rules

Use a controlled state machine with localized labels. Suggested initial statuses:

| Code | English | Arabic | Meaning |
| --- | --- | --- | --- |
| `new` | New | جديد | Received, awaiting review |
| `in_review` | In review | قيد المراجعة | Staff assessing the enquiry |
| `awaiting_information` | Awaiting information | بانتظار معلومات إضافية | Clarification requested or needed |
| `preparing_quote` | Preparing quote | جارٍ إعداد عرض السعر | Scope accepted for proposal preparation |
| `quote_sent` | Quote sent | تم إرسال عرض السعر | A proposal was actually sent or an offline send was recorded |
| `won` | Won | تم الاتفاق | Confirmed positive outcome entered by authorized staff |
| `lost` | Not proceeding | لم يتم الاتفاق | Closed without proceeding, with reason when appropriate |

Archive and spam are separate record dispositions/flags, not fake sales outcomes. Do not count spam as lost business or archived requests as new workflow stages.

Define allowed transitions, role requirements and any required reason/evidence. Support genuine backward transitions such as awaiting information → in review, or reopening a closed enquiry, with a reason and audit event. Do not enforce an unrealistic one-way workflow.

Do not automatically mark a request won because a PDF was opened or an email was sent. `quote_sent` requires a real recorded sending event, or an explicitly labelled manual offline-send record. An awaiting-information status does not itself send a message to the client.

Require an assignee before preparation/sending if that is the chosen operating rule; make the rule visible rather than failing silently. Store actor, timestamp and previous/new status. Internal workflow changes should not notify the client unless an explicit configured communication action is taken.

## 11. Notes, follow-ups and notifications

Internal notes support plain text or safely sanitized limited formatting. Include author and timestamp, mark edits, and apply authorization on changes. Avoid irreversible note deletion as a routine action; preserve appropriate audit context.

Follow-ups include a short action, due date/time and responsible staff member. Display “Due today” and “Overdue” based on the configured timezone. Do not invent a two-day response SLA or business-hours calendar. Optional SLA settings remain disabled until working hours, holidays and business rules are configured.

Required notifications:

- In-app indicator for newly received/assigned requests and relevant follow-ups.
- Clear read/unread state for each user; reading one request must not mark the entire team's inbox read.
- Optional configured staff email notifications with retry/error state.
- Avoid putting full project descriptions or sensitive attachment links in notification subjects or broadly visible previews.

Do not promise automatic replies or reminders are active until their delivery/scheduling service is configured and tested. If scheduled processing is unavailable, provide accurate due-date views and document the automation dependency.

## 12. Client communication and proposal tracking

Implement useful drafts and communication records. Actual external sending is a separate explicit action available only to permitted roles.

- Use the client's submission/preferred language for the draft, independently of the staff interface language.
- Offer editable templates for acknowledgement, request for missing information, proposal cover message and follow-up.
- Do not auto-send AI-generated replies. An authorized staff member reviews the actual recipient, subject, body and attachments before sending.
- Make the final send action unambiguous; show recipients and attached files. Validate them on the server.
- Keep internal notes, approval evidence and unrelated request files out of outgoing messages.
- Record accepted/queued/sent/failed states as supported by the provider. Provider acceptance is not proof the client read the email.
- Use idempotent message jobs and safe retry handling so a timeout does not trigger duplicate emails.
- Keep a recoverable draft after a failure and show the real failure status.
- If email is not configured, offer a copyable draft or a clearly labelled external-composer action; do not show “sent.”

For version one, support tracking/uploading a prepared proposal PDF with version, issue date and optional expiry/amount/currency fields. Do not build a full pricing engine unless requested. Optional monetary fields require explicit currency; do not assume VAT, exchange rates or automatic tax rules. Changing a draft proposal does not silently overwrite a previously sent version.

Do not automatically generate binding terms, legal promises, scope commitments or proposal totals from the initial enquiry. Keep proposal preparation and external approval explicit.

## 13. File management

- Keep enquiry and proposal files in private storage, associated with their request and authorization scope.
- Verify role and request access before issuing a short-lived download/preview URL. Possession of a request ID is insufficient.
- Validate allowed type, file signature, size and count server-side. Do not rely on filename extension alone.
- Show filename, file size, upload date, source and scan state; isolate mixed-direction filenames.
- Do not execute active content or inject uploaded HTML/SVG directly into the dashboard.
- Avoid unsafe inline rendering of untrusted files; use a controlled preview mechanism and content disposition as appropriate.
- Keep original filenames for display, but use generated safe storage keys. Handle Unicode, duplicate names and unusually long names.
- Prevent unauthorized cross-request attachment association and download, even by a user who can access another request.
- Log relevant administrative file access/actions without logging signed URLs or document contents.
- Honor expiry/revocation, retention decisions and cleanup of abandoned uploads.
- Do not imply a deleted database row has removed the underlying object unless storage deletion was verified.

## 14. Overview metrics and reporting

Use real persisted data only. Do not show fabricated growth percentages or revenue from unpriced enquiries.

Useful initial cards: new requests, unassigned requests, requests in review, awaiting information, quotes sent, won/lost outcomes, and follow-ups due. Include the selected time window and clarify whether a metric is a current-state count or a transition count during the period.

Optional charts: request volume over time, service distribution, country distribution, status distribution, and outcomes. Show them only when meaningful. Empty data should have an honest empty state; an API failure must not appear as a zero count.

Metric definitions must be documented:

- Count unique request IDs; retries and service selections must not inflate totals.
- Exclude spam according to a stated rule and distinguish archived records.
- Date ranges use explicit timezone boundaries; end dates and daylight-saving changes must be handled correctly.
- If displaying a conversion rate, define denominator, period and treatment of still-open requests. Do not mix unrelated cohorts.
- If displaying first-response time, define the actual qualifying staff action and whether business-hours adjustment exists.
- Keep counts consistent with role permissions and active filters.
- Allow switching between chart and readable data where practical. Use labels, not color alone.

Do not implement speculative AI lead scoring, financial forecasting or client profiling for this initial dashboard.

## 15. Exports, archive and deletion

Export is a permissioned server operation. Allow only the authorized and explicitly selected/filter-matched records and intended fields. Show scope/count before exporting sensitive contact data.

- Preserve Arabic text with a suitable UTF-8 export format.
- Escape delimiters/newlines correctly and mitigate spreadsheet formula injection from user-supplied cells; quoting a CSV value alone is not sufficient.
- Exclude internal notes, audit data and attachments by default; require an explicit permitted option for any additional sensitive field.
- Do not create a public permanent download URL for an export.
- Record actor, timestamp, filter/scope and export action without copying the entire dataset into logs.

Archive is reversible and preserves history. Provide restore behavior. Permanent deletion is restricted to the owner, requires a deliberate confirmation explaining the scope, and follows the configured retention policy. No automatic destructive purge should run before that policy is established. Do not delete real enquiries as part of testing.

## 16. Full Arabic and English support

The entire dashboard, including authentication UI where configurable, must work in both languages.

- Set correct `lang`/`dir` before first paint; keep language selection visible.
- Translate navigation, status labels, filters, table columns, buttons, tooltips, dates, validation, dialogs, errors, notifications and exports' headings.
- Sidebar is at inline start: left in English, right in Arabic. Actions and spacing use logical properties.
- Preserve meaningful DOM and keyboard order; avoid double reversals.
- Mirror directional arrows and sequence indicators appropriately; never mirror the logo, documents or technical imagery.
- Keep email, phone, URLs, references and filenames directionally isolated.
- Accept Unicode content; do not auto-translate or modify a customer's original description.
- Store stable enum values and format their translated labels in the interface.
- Use locale-aware counts/plurals and dates. Apply the project's agreed numeral convention consistently.
- Arabic headings and rows may need more height; avoid fixed dimensions that clip glyphs or error messages.
- Switching language preserves the current request, tab, permitted filters and unsaved draft state, or warns before unavoidable loss.
- Test mixed strings such as `طلب ZNT-2026-0042`, `BIM / LOD 400`, international phone numbers and Arabic PDF filenames.

## 17. Error handling, accessibility and performance

Provide distinct loading, empty, no-results, unauthorized, forbidden, not-found, validation, conflict, offline, timeout and server-error states. Do not expose stack traces, SQL details, storage keys or authentication secrets.

Support keyboard navigation, visible focus, semantic tables/labels, accessible dialogs, error summaries, localized announcements, reduced motion, 200% zoom and narrow-screen reflow. Menus/dialogs must restore focus and scrolling on close.

Use pagination, indexed queries, bounded exports and efficient attachment metadata loading. Avoid fetching every full description/file for the overview. Debounce suitable searches, cancel stale requests and prevent old responses replacing newer filter results.

Do not poll aggressively when a tab is hidden. If real-time updates are implemented, authorize subscriptions and avoid broadcasting another user's restricted data. Preserve selection and unsaved work when a new request arrives.

Handle simultaneous staff edits with version checks. Use database transactions for related state changes where required. Monitor provider failures and retry jobs without treating in-memory background tasks as durable infrastructure on a serverless host.

## 18. Tests and acceptance journeys

Use isolated synthetic fixtures, explicitly separated from production records. Test at least owner, manager, assigned reviewer, unassigned reviewer, read-only and unauthenticated access.

Required tests:

1. Submit an English public enquiry; verify one durable dashboard record, matching reference, correct fields and permitted attachment state.
2. Repeat in Arabic with mixed-script details and filename; verify no corruption or reversed identifiers.
3. Retry the same submission; verify no duplicate request or notification job.
4. Simulate notification-provider failure after successful persistence; verify the enquiry survives and can be retried safely.
5. Assign a request; verify only permitted users can view/change it and the audit trail is correct.
6. Attempt direct API access, changed IDs, exports and attachment downloads without sufficient permission; verify server denial.
7. Exercise allowed/backward/reopen transitions and invalid transitions with clear localized errors.
8. Add an internal note; prove it is never sent externally or returned through public endpoints.
9. Draft a client reply; verify intended language, recipient and attachments; test sending only through the configured test destination/adapter.
10. Simulate two users editing the same record; verify no silent lost update.
11. Filter, sort, paginate, return from detail, change language and reload; verify stable authorized results and state.
12. Test due dates across timezone boundaries, midnight and daylight-saving changes where applicable.
13. Export Arabic/user-supplied content including formula-like values; verify encoding, permission scope and spreadsheet safety.
14. Archive/restore a test record; verify metrics and activity update correctly. Do not purge real records.
15. Log out, expire/revoke a session and revisit a stale tab/private file link; verify access is denied appropriately.
16. Use the dashboard on 360/390px mobile, tablet and desktop in both languages; verify keyboard, focus, touch and reduced-motion behavior.
17. Simulate empty database, API failure, offline mode, rate limiting and long text; verify honest recovery states.
18. Run production build, type/lint checks, critical unit/integration tests and browser tests. Do not mark unexecuted checks as passed.

Mock-only UI tests are insufficient for persistence/authentication/file authorization. Include integration checks against isolated real local/test services or clearly identify what remains unverified.

## 19. Deliverables and documentation

Deliver the working implementation and update the website's quote integration. Include:

- Database schema, reversible migrations where practical, indexes and synthetic seed data isolated from production.
- Server-enforced permission policy and tests.
- Authentication/bootstrap-owner setup instructions, without real credentials.
- `.env.example` with variable descriptions and no secrets.
- Private file, notification and background-job configuration.
- Bilingual UI dictionaries, localized status mappings and data formatting helpers.
- Audit log, workflow and metric definitions.
- `docs/admin-setup.md`, `docs/admin-permissions.md`, `docs/quote-workflow.md`, and `docs/admin-qa-report.md`.
- Screenshots of EN/AR inbox, request detail, overview and mobile states using synthetic data.
- Clear production dependencies: verified owner identity, provider credentials, storage, email destination, retention policy and any scheduling setup.

Production readiness requires actual persistence, server-side authorization, private attachments, truthful communications, and verified integration. An attractive dashboard populated with demo data does not meet the request.

## 20. How to finish

Proceed through inspect → model → implement → integrate → test → polish → document. Do not stop after proposing the schema or building the first dashboard screen.

In your final response, report the local/authorized preview URL, implemented screens, real form-to-dashboard flow, roles, tests actually run, screenshots/docs, and remaining external configuration. Explicitly distinguish working production integrations from local/test adapters.

Do not publicly deploy, invite real staff, send real client emails, purchase services or delete real records during this development task without explicit authorization for that action. Continue all independent implementation and verification work rather than treating an unavailable credential as a reason to stop the entire project.
