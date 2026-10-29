# Quote dashboard — QA report

Date: 28 Oct 2026 · Windows 11 · Node 22.14.0 · Next.js 16.4.3 production build · Playwright 1.64.1 (bundled Chromium, Firefox, WebKit) · synthetic data only (`example.invalid`, fictional companies). No real staff, clients, email or records were involved; nothing was deployed.

## Results

> **Owner decisions of 28 Oct 2026** (final build, same machine): `npm run verify` passes — locales 544 public + 999 dashboard strings, content, lint, typecheck, `npm test` **114/114**, build, output audit (1,073 files). `npm run test:admin` **30/30** (adds P1–P5: partner enquiry → Partners & careers with status and notes, reviewers locked out; Arabic career application with a CV kept in quarantine until a manager releases it, then downloaded; contact details saved in Settings → shown on the public footer, quote page, privacy policy and structured data, then removed; pausing the careers form; the approved privacy policy). Public suite **199/199**, review suite 4/4. New integration suites: `applications` (9), `intake-api` (4), `retention` (4), plus `contacts` (4, unit). Screenshots of the new screens: `docs/screenshots/admin/applications-*.png`, `application-*.png`, `settings-contacts-en.png`, `settings-forms-en.png`, `settings-retention-en.png`.
>
> Updated after the post-build audit (03): `npm test` 93/93, `npm run test:admin` **25/25** (adds SEC-01: strict per-request nonce Content-Security-Policy on every dashboard screen, with zero violations; the MFA journey now also asserts zero CSP violations), public suite 196/196. Dashboard text inputs gained a forced-colours focus outline (A11Y-01). Details: `docs/post-build-audit.md`. The table below is the dashboard's own QA run.

| Check | Command | Result |
| --- | --- | --- |
| Locale parity (EN/AR keys, plurals, placeholders, bidi controls) | `npm run check:locales` | ✓ 504 public + 807 dashboard strings |
| Content / claims audit | `npm run check:content` | ✓ |
| Lint (whole repo) | `npm run lint` | ✓ 0 problems |
| Types | `npm run typecheck` | ✓ 0 errors |
| Unit + integration (real PostgreSQL engine, no mocks for persistence/auth/files) | `npm test` | ✓ 82/82 (45 public-site + 37 dashboard) |
| Production build | `npm run build` | ✓ no warnings |
| Build-output leak audit | `npm run check:output` | ✓ 1,021 files, no restricted terms, no source maps, no review routes |
| Dashboard browser journeys (isolated test server, embedded PostgreSQL) | `npm run test:admin` | ✓ 24/24 (Chromium 20, Firefox 2, WebKit 2) |
| Same Chromium journeys on **PostgreSQL 17.9** (throwaway local instance, removed afterwards) | `ADMIN_E2E_DATABASE_URL=… npm run test:admin` | ✓ 20/20 — also proves the down migration + re-migration |
| HTTP smoke (sign-in, intake, retry, upload binding, scoping, CSRF, headers) | scratch script | ✓ 20/20 on embedded PostgreSQL and 20/20 on PostgreSQL 17.9 |
| Public website browser suite (regression after the route restructure) | `npm run test:e2e` | ✓ 146/146 |
| Accessibility (axe, WCAG 2.2 A/AA tags) — 8 screens + 5 detail tabs × EN/AR + sign-in EN/AR | in `05-ux.spec.ts` | ✓ no serious/critical issues |

Integration suites (`tests/unit/admin`): `intake` (7), `permissions` (10), `workflow` (6), `time` (6), `export` (4), `auth` (4).

## Acceptance tests (spec §18)

| # | Requirement | Evidence |
| --- | --- | --- |
| 1 | English enquiry → one record, same reference, fields, attachment state | Browser A1 (real form → dashboard, quarantine → release → download); `intake` test |
| 2 | Arabic, mixed script, Arabic filename | Browser A2 (exact text, RTL, isolated reference, normalised phone, filename); byte-exact check in PostgreSQL 17.9 |
| 3 | Retry → no duplicate request or job | Browser A3; `intake` (replay, conflicting reuse, job count unchanged) |
| 4 | Notification provider fails after persistence; safe retry | `intake` (simulated outbox failure → job `failed` with sanitised error, request intact, retry delivers once, emails contain no names/descriptions). Browser-level not run: it needs a server restart with a failure flag. |
| 5 | Assignment, visibility, audit | Browser A5; `permissions` |
| 6 | Direct API / changed IDs / export / download denied | Browser A6 (anonymous 307/401, cross-origin 403, outsider 404/403, read-only controls absent); `permissions` (tampered/expired/foreign tokens) |
| 7 | Allowed, backward, reopen, invalid transitions; localized errors | Browser A7 (EN + AR error text); `workflow` |
| 8 | Internal note never external or public | Browser A8 (note marker absent from draft, outbox file and public receipt); `workflow` |
| 9 | Draft language, recipient, attachments; test adapter only | Browser A9 (Arabic draft from English UI, recipient on file, outbox "test delivery"); `workflow` (proposal-only attachments, cross-request rejected, failure keeps draft, retry) |
| 10 | Two editors, no silent lost update | Browser A10 (conflict banner + refresh); `workflow` (status, assignment, note revisions) |
| 11 | Filter/sort/paginate/return/language/reload | Browser A11, A11b (page vs all-matching selection, confirmation), A11c (language switch keeps request, tab and unsaved text) |
| 12 | Timezone, midnight, DST | `time` (25-hour 29 Oct 2026, 23-hour 24 Apr 2026, repeated/skipped wall times, inclusive local-day filters); Browser A12 (overdue/today badges) |
| 13 | Export: Arabic, formulas, scope | Browser A13 (BOM, Arabic headers, `'=HYPERLINK…`, no emails by default); `export` |
| 14 | Archive/restore, metrics, activity | Browser A14; `workflow` (metrics: unique requests, spam excluded, archive separate, scoped for reviewers) |
| 15 | Logout, revocation, stale tab and file link | Browser A15 (stale link → 401 after sign-out, revoked tab → 401 + redirect, revoked sign-in refused); `auth`, `permissions` |
| 16 | 360/390/768/1440 px, EN/AR, keyboard, focus, reduced motion | Browser A16 ×3 (no horizontal scroll at 360/390/768 in both languages, drawer + Escape + focus return, tab arrow keys incl. RTL, dialog focus trap/restore, reduced-motion durations); cross-browser phone check in Firefox/WebKit |
| 17 | Empty DB, API failure, offline, rate limit, long text | Browser A17 + A6 (no-match, honest empty queue/zeros for an unassigned reviewer, 500 → error + retry, offline → message + retry, 429 explained, long Arabic text without overflow); `auth` (real 429 after 10 failed sign-ins) |
| 18 | Build, types, lint, unit/integration, browser | All run (table above) |

## Defects found during QA and fixed

| Defect | Found by | Fix |
| --- | --- | --- |
| Settings could not be saved (Zod 4 `z.record` with enum keys is exhaustive) | integration test | `z.partialRecord` |
| A repeated DST wall time (23:30 on 29 Oct) resolved to the later instant | timezone review + test | `zonedTimeToUtc` evaluates both offsets and verifies each |
| Non-existent dates (30 Feb) rolled over silently | test | rejected |
| Sign-in: email typed before hydration was cleared (WebKit) | cross-browser test | uncontrolled inputs read via FormData; `method="post"` so a pre-load submit never puts credentials in a URL |
| Whole page wider than the viewport on the inbox | screenshot review | visually-hidden labels were escaping the table's scroll container (`position: relative`) |
| Inbox columns cut off at 1440 px in Arabic | screenshot review | container-query column folding (country/services/files, then follow-up) |
| Sticky table header misplaced in the scroll wrapper | screenshot review | removed sticky header (tables are paginated) |
| Pagination overflowed at 360 px | browser test | wrapping |
| `aria-selected` on links (axe critical) | axe | `aria-current` |
| Audit details exposed internal user IDs | screenshot review | names and translated labels |
| Native file input showed browser-English text in Arabic | screenshot review | localized picker |
| Long Arabic product label squeezed beside the logo | screenshot review | logo above label |
| Turbopack traced the whole project (dynamic data paths) | build warnings | runtime data paths excluded from tracing |
| Leak audit false positive on the `Africa/Kigali` tz identifier in the DB engine | `check:output` | precise exception for the tz identifier only |

## Screenshots (synthetic data)

`docs/screenshots/admin/`: `overview-en/ar`, `inbox-en/ar`, `detail-en/ar`, `detail-communication-en/ar`, `team-en`, `settings-ar`, `mobile-inbox-en/ar`, `mobile-detail-en/ar`, `mobile-menu-en/ar`, `sign-in-en/ar` (regenerate: `node scripts/e2e-admin-server.mjs` then `node scripts/admin-screenshots.mjs`).

## Not verified (and why)

- **Real email delivery** — no SMTP credentials; only the local test outbox was used (by design: no real email may be sent).
- **Malware scanning** — no scanner integrated; the manual-release path and the test scanner were tested.
- **HTTPS-only behaviour** — `Secure`/`__Secure-` cookies apply automatically on an https origin; not exercised on a real HTTPS host.
- **Assistive technology and real devices** — automated axe, keyboard and viewport checks only; no NVDA/JAWS/VoiceOver or physical phone/touch session.
- **Multiple app instances / serverless** — not exercised; see `docs/admin-setup.md` (shared rate limiting for the public form).
- **Load/performance of the dashboard** — not benchmarked (internal tool; paginated queries and indexes are in place).
