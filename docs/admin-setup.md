# Quote dashboard — setup and operations

The dashboard is part of the website application (same Next.js build). It lives at `/en/admin` and `/ar/admin`, is never linked from the public site, sends `noindex` and `private, no-store` on every response, and stays **closed** unless a database and an authentication secret are configured.

It holds quote requests, and since 28 Oct 2026 also **partner enquiries and career applications** (Partners & careers, `/admin/applications`), the **public contact details** shown on the website, and the switches that pause the partner and careers forms (Settings). Owner decisions behind these changes: `docs/open-decisions.md` (OD-02, OD-04, OD-05, OD-25–OD-27).

Nothing has been deployed. No real staff were invited, no real email was sent, and only synthetic data was used.

## Architecture (and why)

| Concern | Choice | Notes |
| --- | --- | --- |
| Database | **PostgreSQL** through Drizzle ORM 0.45 | Production: any managed PostgreSQL via `DATABASE_URL` (verified on PostgreSQL 17.9). Local/tests: **PGlite** (PostgreSQL compiled to WASM) — same SQL, no install. |
| Migrations | `drizzle/0000_initial_quote_dashboard.sql` (26 tables) and `drizzle/0001_owner_decisions_applications.sql` (partner/career records, notes, shared rate-limit counters; additive) | Apply with `npm run db:migrate`. Manual, destructive down migrations are in `drizzle/down/` (not wired to any script). |
| Authentication | **Better Auth 1.7** (email + password, TOTP two-factor plugin, database sessions, database rate limiting) | No public sign-up. Password hashing, sessions and TOTP are Better Auth's; nothing is hand-rolled. |
| Authorization | `src/server/admin/policy.ts` | One policy module used by every page, action, route, export and file link. See `docs/admin-permissions.md`. |
| Files | Private storage, database by default (`file_blob`, bytea) or a private directory | Never under `public/`. Downloads use 60-second links bound to user + session and re-checked on every request. |
| Email | Adapter: `none` (default) · `outbox` (local test) · `smtp` | Without SMTP, staff copy drafts or record offline sends; nothing is shown as "sent". |
| Background work | Durable `notification_job` rows; built-in scheduler (`src/server/scheduler.ts`) | Notifications and clean-up every 5 minutes, retention daily, inside the Node server. Also after each submission, by `npm run jobs:run`, or by an external scheduler calling `POST /api/jobs/run`. |
| Public settings | `setting` rows `publicContacts`, `partnerIntakeOpen`, `careerIntakeOpen` | Read by the public pages (ISR, refreshed on save); never read during `next build`. |

Why not a third-party CMS/CRM: the brief asked for a single-company internal tool with server-enforced roles, private files and an audit trail tied to the existing form; one PostgreSQL database and the existing Next.js app are the simplest maintainable stack that meets it.

## Local development

```bash
npm ci
cp .env.example .env.local        # then set the local values below (a generated .env.local already exists in this checkout)
npm run dev                       # http://localhost:3000/en/admin
```

Local `.env.local` (development only):

```ini
FORM_MODE=live                    # the public quote, partner and careers forms write to the local database
DATABASE_DRIVER=pglite
PGLITE_DATA_DIR=.data/pglite      # one process at a time; stop the dev server before running scripts
BETTER_AUTH_SECRET=<random, ≥ 32 chars>
BETTER_AUTH_URL=http://localhost:3000
EMAIL_TRANSPORT=outbox            # messages are written to .data/outbox and delivered to no one
OUTBOX_DIR=.data/outbox
```

This checkout's local database already has the owner **mark@zentrack.com** (temporary password in `.data/owner-temporary-login.txt`; change it in Your account, then delete the file). To create a local owner on another machine (interactive; the password is typed, not echoed, never stored in plain text):

```bash
npm run admin:create-owner -- --email you@company.example --name "Your Name"
```

Optional synthetic demo data (local database must be empty; refuses anything but a local database):

```bash
npm run db:seed:test              # writes random test passwords to .data/test-credentials.json (gitignored)
```

Isolated test server (fresh synthetic database on :3006, used by the browser tests and screenshots):

```bash
npm run build
node scripts/e2e-admin-server.mjs           # credentials in .data/e2e/credentials.json
node scripts/admin-screenshots.mjs          # docs/screenshots/admin
```

## Production setup (when the owner authorizes a release)

1. **Database.** Provision managed PostgreSQL (encrypted at rest, automated backups, TLS). Set `DATABASE_URL` (with `sslmode=require` where supported). Run `npm run db:migrate` from the release environment. Do **not** use PGlite in production.
2. **Secret.** Set `BETTER_AUTH_SECRET` to a random value of at least 32 characters (`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`). Keep it in the host's secret store. Without it the dashboard answers "unavailable".
3. **Origin.** Set `SITE_URL` and `BETTER_AUTH_URL` to the verified HTTPS origin. Cookies become `Secure` with the `__Secure-` prefix automatically on HTTPS.
4. **First owner (decided 28 Oct 2026: Mark Mofreh, mark@zentrack.com).** On the production server, someone with server access runs `npm run admin:create-owner -- --email mark@zentrack.com --name "Mark Mofreh"` and Mark types his own password (12–128 characters; it is never stored in code or files). No password is built into the application. The script refuses if an active owner already exists. Everyone else is invited from **Team & permissions** (single-use link, 72 hours, shared by the owner through a trusted channel).
5. **Two-factor (owner decision OD-26: not required).** Two-factor authentication stays available and optional for every account (Your account). **Settings → Require two-factor authentication for owners and managers** remains off, and the overview no longer warns about it. Turning it on later confines owners/managers without 2FA to Your account until they enrol.
6. **Forms.** Set `FORM_MODE=live`. Quote requests, partner enquiries and career applications are then stored in the dashboard (no webhook). The owner can pause the partner or careers form in **Settings → Website forms**; visitors then see "not accepting at the moment" instead of the form.
7. **Privacy policy.** The approved policy (version `2026-10-28`, OD-04) is part of the code (`src/lib/legal.ts` and the dictionaries); every submission records that version. Change the text, the version and the date together.
8. **Public contact details.** In **Settings → Public contact details** enter the email, phone, WhatsApp number and LinkedIn page that should appear on the website (each optional; empty fields are hidden). Saved values appear on every public page within a minute, and the email becomes the privacy-request channel in the policy.
9. **Email — skipped by owner decision (OD-24).** Leave `EMAIL_TRANSPORT` unset: staff copy drafts or open them in their own email app and record important sends as offline sends; in-app notifications still work. If an email provider is added later: Set `EMAIL_TRANSPORT=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` (a verified sender domain with SPF/DKIM/DMARC). Send a test to an internal mailbox first. Staff notification emails additionally need **Settings → Send staff email notifications** and each member's opt-in.
10. **Files.** Default storage is the database (no extra setup). For `STORAGE_DRIVER=filesystem`, mount a persistent private volume at `PRIVATE_STORAGE_DIR` (outside the web root; the app refuses a path inside `public/`). Decision OD-06: no malware scanner for launch. Quote attachments and CVs are accepted at first contact but stay "Not scanned" (not downloadable) until an owner/manager reviews the source and releases them. If a scanner (e.g. ClamAV) is integrated later, update the Files section of the privacy policy.
11. **Scheduler (decision OD-27).** Nothing to configure: the built-in scheduler runs in the `next start` process (`JOBS_SCHEDULER=internal` is the production default). On serverless hosting set `JOBS_SCHEDULER=off` and `JOBS_RUNNER_TOKEN` (≥ 32 chars), and call `POST /api/jobs/run` with `Authorization: Bearer <token>` every 5 minutes; or run `npm run jobs:run` from cron.
12. **Hosting (decision OD-20).** One Node.js server process behind HTTPS (see `docs/deployment.md`). Form rate limits are counted in PostgreSQL, so they hold across instances; sign-in limits are database-backed too.

## Operations

| Task | How |
| --- | --- |
| Back up | Managed PostgreSQL backups (includes files when `STORAGE_DRIVER=database`). Test a restore before go-live. |
| Migrate | `npm run db:migrate` (idempotent). New schema changes: edit `src/server/db/schema.ts`, `npm run db:generate`, review the SQL, add a down script. |
| Roll back the app | Redeploy the previous build. Migrations are additive; the down script drops everything and is for empty/test databases only. |
| Rotate the auth secret | Change `BETTER_AUTH_SECRET` and restart: everyone is signed out; in-progress TOTP enrolments and outstanding file links stop working. Enrolled TOTP secrets are encrypted with the secret, so members re-enrol after a rotation. |
| Remove a person | Team & permissions → Revoke access (all sessions end immediately). Their history stays attributed. |
| Lost authenticator | The member uses a backup code; otherwise an owner revokes and re-invites them. |
| Retention (decision OD-25) | Automatic and daily, as the privacy policy states: quote requests 24 months after the last activity (Won requests are kept until an owner deletes them), partner enquiries 24 months, career applications and CVs 12 months, spam 30 days after marking, never-submitted uploads 24 hours, form-protection counters 24 hours. Each deletion is audited with the reference only. Owners can still delete archived/spam records sooner (typed confirmation). Settings → Retention shows what is due now and within 30 days. The periods live in `src/lib/legal.ts`. |
| Partner enquiries and career applications | Partners & careers: filter by type and status, search (never in the URL), open a record, set its status (New → In review → Contacted → Closed; reopening needs a reason), add internal notes, release and download a CV, archive/spam/restore; owners delete. Replies are written in the staff member's own email app; nothing is sent or recorded as sent. |
| Contact details | Settings → Public contact details (owner). Saving refreshes every public page. |
| Audit | Audit activity page (owners: everything; managers: request, partner/career, file, communication and export events). |

## What is local/test-only

| Adapter | Status |
| --- | --- |
| PGlite (`DATABASE_DRIVER=pglite`) | Local/test only. Production uses PostgreSQL (`DATABASE_URL`). |
| `EMAIL_TRANSPORT=outbox` | Local test outbox (files in `OUTBOX_DIR`); shown in the UI as "Delivered to the local test outbox (not sent to the client)". |
| `FILE_SCAN_MODE=test` | Detects only the antivirus test string; never a real scanner. |
| Seed data, `.data/` | Synthetic, local, gitignored. |
| Raised `AUTH_RATE_LIMIT_MAX` | Isolated test server only. |

## Remaining production dependencies

Managed PostgreSQL + backups (OD-22) · `BETTER_AUTH_SECRET` and HTTPS origin (OD-23) · creating the owner account mark@zentrack.com on the production server at launch.

Resolved on 28 Oct 2026: first owner = mark@zentrack.com; no SMTP; privacy policy approved; partner/career forms stored in the dashboard; contact details edited in the dashboard; retention periods and scheduler; hosting and shared rate limiting; two-factor not required; no scanner for launch (manual release).
