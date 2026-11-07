# Zentrac website

Bilingual (English / Arabic) website for **Zentrac — Engineering and BIM Consultancy**. Built from the handoff documents `01_ZENTRAC_WEBSITE_MASTER_PLAN.md` and `02_ZENTRAC_WEBSITE_BUILD_SPEC.md` and the five supplied source files (kept, unmodified, in this folder).

- English at `/en` (LTR), Arabic at `/ar` (RTL), `/` → `/en`. Every page and state exists in both languages from one implementation.
- 18 page families × 2 locales (36 static pages, including Buildings with its building-section explorer), 5 service pages, case-study and article templates, three forms, localized 404/error pages.
- Signature motion: hero “coordination model” assembly, infrastructure explorer, the Zentrac Track — all with reduced-motion, mobile and no-JS fallbacks.
- Project records are **withheld** (no written approvals in the sources); the public site shows a capability-led fallback, and a private review build renders all records through the real templates.
- **Quote dashboard** at `/en/admin` and `/ar/admin` (built from `04_ZENTRAC_QUOTE_ADMIN_DASHBOARD_PROMPT.md`): the website's quote form stores requests durably in PostgreSQL; authorized staff review, assign, follow up, message clients and track outcomes. Server-enforced roles (owner, manager, reviewer, read-only), Better Auth sessions with optional TOTP two-factor, private quarantined files, audit log, bilingual RTL/LTR interface. See `docs/admin-setup.md`.
- **Owner decisions of 28 Oct 2026** (`docs/open-decisions.md`): partner enquiries and career applications (with private CVs) are stored in the dashboard (Partners & careers); the owner edits the public contact details in the dashboard and can pause the partner/careers forms; the privacy policy is approved (version 2026-10-28) with automatic retention; two-factor authentication is optional; the site copy was reviewed and approved in both languages.

## Stack (pinned)

Next.js 16.4.3 (App Router, Turbopack) · React 19.3.1 · TypeScript 6.0.3 · Tailwind CSS 4.3.3 · GSAP 3.15.0 (loaded on demand) · Zod 4.6.7 · Vitest 5.0.5 · Playwright 1.64.1 + @axe-core/playwright 4.14.0 · ESLint 9.39.5 (eslint-config-next 16.4.3) · npm 10 / Node ≥ 22.12 (tested on 22.14.0). Fonts: Saira (Latin) and IBM Plex Sans Arabic, self-hosted from Fontsource (OFL).

## Run it

```bash
npm ci
npm run dev                         # http://localhost:3000 → /en
npm run dev:review                  # PRIVATE review build: http://localhost:3100/en/review
```

Production build locally (PowerShell: `$env:FORM_MODE='preview'; npm run build`):

```bash
FORM_MODE=preview npm run build
FORM_MODE=preview npm run start     # http://localhost:3000
```

Copy `.env.example` to `.env.local` for local settings (this checkout's `.env.local` runs the quote form in **live** mode against a local embedded database — see `docs/admin-setup.md`). Forms run in **preview** mode locally: they validate fully but send nothing and say so (“Test completed; no request was sent.”). See `docs/deployment.md` for live mode.

## Scripts

| Script | What it does |
| --- | --- |
| `dev`, `build`, `start` | Next.js development server, production build, production server |
| `dev:review` | Private review build (`ZENTRAC_REVIEW=1`, separate `.next-review` dir). Never deploy |
| `lint`, `typecheck` | ESLint, `tsc --noEmit` |
| `test` | Vitest unit tests (locale routing, Arabic plurals, validation, upload signatures, projection allowlist, API idempotency/rejection) |
| `test:e2e` | Playwright against the production build (starts `next start` on :3005 in preview mode) |
| `test:review` | Playwright against the private review build (run `npm run dev:review` first): gallery dialog, filters, synthetic fixture |
| `check:locales` | English/Arabic parity: keys, arrays, placeholders, empty/untranslated strings, hidden bidi characters |
| `check:content` | Placeholders and unapproved claims, private fields in the public projection, projection freshness, source files in `public/` |
| `check:output` | After a build: scans `.next` + `public` for withheld names/parties, private markers, source filenames, review routes, source maps |
| `check:release` | `check:output` that also fails on a localhost/unset production origin |
| `content:project` | Rebuilds the public JSON projection from approved private records |
| `fonts` | Copies the self-hosted font files from Fontsource |
| `test:admin` | Dashboard browser journeys (Chromium, Firefox, WebKit) against an isolated test server on :3006 with a fresh synthetic database |
| `db:migrate`, `db:generate` | Apply / generate database migrations (`drizzle/`) |
| `admin:create-owner` | Create the first owner from the server console (password typed, never stored in plain text) |
| `db:seed:test` | Synthetic demo data for an empty LOCAL database only |
| `jobs:run` | Run every background job once: staff notifications, abandoned-upload clean-up, rate-limit sweep, retention (the production server also runs them on its built-in scheduler) |
| `verify` | locales → content → lint → typecheck → unit tests → build → output audit |

Other tooling: `node scripts/screenshots.mjs`, `scripts/lighthouse.mjs`, `scripts/measure-vitals.mjs`, `scripts/measure-transfer.mjs`, `scripts/route-smoke.mjs`, `scripts/generate-og.mjs`, `python scripts/extract-logo.py .`.

## Structure

```
src/app/[locale]/…          pages (root layout sets lang/dir on the server), not-found, error
src/app/[locale]/review/…   *.review.tsx — compiled only in the private review build
src/app/[locale]/(site)/…    public pages (route group with the marketing header/footer)
src/app/[locale]/admin/…    dashboard (own shell; sign-in, invite, overview, requests, queue, archive, partners & careers, team, settings, audit, account)
src/app/api/…               enquiries, uploads, auth, admin (requests, files, export, proposals), jobs (Node runtime)
src/server/                 database schema/client, auth, dashboard domain services (policy, workflow, files, …), email, storage
drizzle/                    SQL migrations (+ manual down scripts)
src/proxy.ts                "/" → "/en"; unprefixed paths → "/en/…"
src/components/             layout, sections, motion (scenes + behaviour controllers), forms, projects, articles, ui
src/content/public/         services, networks, Track, editorial records, generated public projection
src/i18n/                   locale config, route registry, formatting, en/ar dictionaries
src/lib/                    SEO, content types + allowlist projection, form schema/config, server stores, checks
src/styles/                 tokens, fonts, base, components, pages, scenes, print
private-source/content/     PRIVATE project/asset/article records (not imported by public routes)
private-source/extracted/   PRIVATE source extraction (git-ignored)
docs/                       decisions, inventory, design system, motion, routes, QA, editing, deployment, screenshots
tests/unit, tests/e2e       Vitest and Playwright suites
```

## Documentation

- `docs/task-checklist.md` — phase status · `docs/open-decisions.md` — owner inputs and launch blockers
- `docs/source-inventory.md`, `docs/content-decisions.md`, `docs/asset-manifest.json` — sources, conflicts, assets
- `docs/design-system.md`, `docs/motion-storyboard.md`, `docs/route-matrix.md` — design, motion, routes
- `docs/qa-report.md` (+ `docs/screenshots`, `docs/lighthouse`) — test evidence
- `docs/content-editing.md`, `docs/deployment.md` — maintaining and releasing (contact details, privacy policy, hosting, scheduler)
- `docs/qa/content-review/` — the English and Arabic review tables behind the 28 Oct 2026 content approval
- `docs/admin-setup.md`, `docs/admin-permissions.md`, `docs/quote-workflow.md`, `docs/admin-qa-report.md` (+ `docs/screenshots/admin`) — quote dashboard
- `docs/post-build-audit.md` (issue register), `docs/seo-audit.md`, `docs/animation-enhancements.md`, `docs/performance-before-after.md`, `docs/bilingual-accessibility-qa.md`, `docs/final-release-checklist.md` (+ `docs/qa/before`, `docs/qa/after`) — post-build audit (03)

## Status

Local implementation complete (spec Gate A); content approved. Not deployed. Public release still needs the owner inputs listed under "Still open" in `docs/open-decisions.md` — at minimum a production domain, managed PostgreSQL and an auth secret with HTTPS; the owner account (mark@zentrack.com) is then created on the server. Named projects additionally need the parties' written permission.
