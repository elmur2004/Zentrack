# Deployment

Nothing has been deployed. This describes what a release needs; perform it only when the owner asks (spec §18 Gate C). Dashboard specifics: `docs/admin-setup.md`.

## Hosting decision (OD-20, decided 28 Oct 2026)

**One Node.js server process (`next start`) behind an HTTPS reverse proxy or load balancer, with managed PostgreSQL.** This is the configuration the site is built and tested for:

- The built-in job scheduler runs inside that process (notifications, clean-up, retention; `JOBS_SCHEDULER`, see below).
- Public pages are prerendered and refreshed by incremental static regeneration (ISR): at most every 5 minutes, and at once when the owner saves contact details or form settings in the dashboard. Next.js writes regenerated pages into the build directory, so **`.next/` must be writable at runtime** (the default for `next start`; a read-only container needs a Next.js `cacheHandler`).
- Rate limits for the public forms are counted in PostgreSQL, so they also hold if a second instance is ever added. With several instances, on-demand page refresh reaches only the instance that handled the save; the others catch up within the 5-minute ISR window (or configure a shared `cacheHandler`).
- Serverless platforms also work for the app itself, but then set `JOBS_SCHEDULER=off` and call `POST /api/jobs/run` from the platform scheduler.

## Host requirements

- Node.js ≥ 22.12 (built and tested on 22.14.0) with the npm lockfile (`npm ci`).
- A Node runtime for the route handlers (`/api/enquiries`, `/api/uploads`, `/api/auth/*`, `/api/admin/*`, `/api/jobs/run`), the dashboard pages and the proxy. Public marketing pages are prerendered (SSG + ISR); the quote, partner and careers pages render per request (their form mode and the owner's form settings are read at runtime).
- **PostgreSQL 16 or newer** for quote requests, partner enquiries, career applications and the dashboard (`DATABASE_URL`, TLS). Requirements decided for OD-22: daily automated backups kept at least 30 days (point-in-time recovery if the provider offers it), a restore test before launch and after major upgrades, and a region that suits the business (provider and purchase are the owner's choice). Apply migrations with `npm run db:migrate` before starting a new version.

## Environment variables

See `.env.example` (names and descriptions only). Server-only; never prefix secrets with `NEXT_PUBLIC_`.

| Variable | Required for release | Notes |
| --- | --- | --- |
| `SITE_URL` | Yes | Verified origin, no trailing slash. Canonical, hreflang, sitemap, OG URLs |
| `FORM_MODE` | Yes | `live`: quote requests, partner enquiries and career applications are stored in the database. `preview`: test only. Unset: unavailable. Read **at request time** |
| `DATABASE_URL` | Yes (forms, dashboard) | Managed PostgreSQL, TLS. `DATABASE_POOL_MAX` optional |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Yes (dashboard) | Random ≥ 32 chars; HTTPS origin. Without the secret the dashboard stays closed |
| `JOBS_SCHEDULER` | No | `internal` (default in production with a database): built-in scheduler — notifications and clean-up every 5 minutes, retention daily. `off`: use an external scheduler |
| `JOBS_RUNNER_TOKEN` | Only with an external scheduler | Enables `POST /api/jobs/run` |
| `EMAIL_TRANSPORT`, `SMTP_*` | No — leave unset (owner decision OD-24: no SMTP) | Unset = staff copy drafts / open their own email app and record offline sends. `smtp` would enable sending later; `outbox` is a local test adapter |
| `STORAGE_DRIVER`, `PRIVATE_STORAGE_DIR` | Optional | Default: private database storage. `filesystem` needs a persistent private volume |
| `FILE_SCAN_MODE` | No | Leave empty: no scanner is integrated (OD-06), so every uploaded file stays quarantined until an owner or manager releases it. `test` is a local test scanner |
| `AUTH_RATE_LIMIT_MAX` | No | Default 10 attempts / 5 min per client; raise only on isolated test servers |
| `ENQUIRY_RATE_LIMIT`, `UPLOAD_RATE_LIMIT` | No | Per-client limits per 10 minutes (defaults 8 and 30), counted in the database in live mode |
| `DATABASE_DRIVER`, `PGLITE_DATA_DIR`, `OUTBOX_DIR` | **Never in production** | Local/test adapters |
| `ZENTRAC_REVIEW`, `ZENTRAC_DIST_DIR` | **Never in production** | Private review build; isolated build copy for the dashboard test server |

No longer used (removed 28 Oct 2026): `ENQUIRY_WEBHOOK_URL`/`ENQUIRY_WEBHOOK_SECRET` (partner and career forms are stored in the dashboard), `CONTACT_EMAIL`/`CONTACT_PHONE`/`CONTACT_WHATSAPP`/`CONTACT_LINKEDIN_URL` (edited in the dashboard: Settings → Public contact details) and `PRIVACY_POLICY_VERSION` (the approved version is in `src/lib/legal.ts`).

## Release procedure

```bash
npm ci
npm run fonts                       # only if public/fonts is missing
npm run check:locales && npm run check:content
npm run lint && npm run typecheck && npm test
SITE_URL=https://<verified-domain> npm run build
npm run check:release               # fails on leaks or a localhost origin
npm run test:e2e                    # public site against the build (:3005, preview mode)
npm run test:admin                  # dashboard against an isolated copy of the build (:3006, synthetic data)
DATABASE_URL=... npm run db:migrate # production database
npm run start
npm run admin:create-owner -- --email mark@zentrack.com --name "Mark Mofreh"   # first release only; Mark types his password
```

After the first start, the owner signs in and fills in **Settings → Public contact details**; every public page shows them within a minute (no rebuild).

Before switching DNS:

1. With the owner's authorization, send one real test enquiry of each kind (quote, partner, career with a CV) end to end; confirm each appears in the dashboard with an in-app notification and that files are quarantined.
2. Confirm `/sitemap.xml` and canonical tags use the production origin; submit the sitemap (OD-28).
3. Confirm `/en/admin` returns `X-Robots-Tag: noindex` and `Cache-Control: private, no-store`, and that the dashboard requires sign-in.
4. Check that `private-source/`, the original PDFs/DOCX/XLSX, `.next-review/`, `.data/`, `docs/` and `tests/` are **not** in the deployment artifact (`next.config.ts` excludes them from tracing; add them to `.dockerignore`/platform ignore files for file-copy deployments).
5. Protect any remote preview with authentication; `noindex` is not access control.

## Rollback

Redeploy the previous build. Database migrations are additive; do not run the down scripts (`drizzle/down/`) on a database with real data — they drop dashboard tables. Back up the database before each migration.

## Security headers

`next.config.ts` sets `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` (camera/mic/geolocation off), disables `X-Powered-By` and browser source maps, and adds `X-Robots-Tag: noindex, nofollow, noarchive`, `Cache-Control: private, no-store` and `Referrer-Policy: no-referrer` on `/{en,ar}/admin/*`, `/api/admin/*`, `/api/auth/*` and `/api/jobs/*`. Private file responses add a sandboxed `Content-Security-Policy`, `nosniff` and attachment disposition.

`src/proxy.ts` adds the page Content-Security-Policy: a strict per-request nonce policy (`'strict-dynamic'`, no inline or eval) on dashboard pages, and a same-origin policy on public pages (inline scripts allowed because Next.js inlines the prerendered RSC payload; no other origin, no eval, no framing, `base-uri`/`form-action 'self'`). `upgrade-insecure-requests` is added when `SITE_URL` is https. If a CDN, analytics or font host is ever added, its origin must be added to the policy (and to the privacy policy). Rationale and tests: `docs/post-build-audit.md` (SEC-01).

The proxy also enforces the canonical URL policy (lowercase, one redirect) and serves the localized 404 for any public path not in the route registry. Configure HTTPS and a single canonical host (apex or `www`) at the host/CDN.
