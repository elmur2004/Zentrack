# Final release checklist

Four separate states — do not merge them:

| State | Where it stands (28 Oct 2026, after the owner's decisions) |
| --- | --- |
| **Implementation complete** | Yes for the build spec, the quote dashboard (04), the post-build audit (03) and the owner decisions of 28 Oct 2026 (partner/career records, dashboard-edited contacts, approved privacy policy with retention, scheduler, shared rate limits) |
| **Public content approved** | Yes for the site copy in both languages and the privacy policy (OD-04, OD-11–13). Not approved: the eight project case studies, which need the parties' written permission (OD-07/08); articles stay private drafts (OD-18) |
| **Integrations configured** | No. Domain, PostgreSQL and auth secret/HTTPS are not set (local/test adapters only). No SMTP by owner decision (OD-24). The owner account mark@zentrack.com exists in the local development database; on the production server it is created once at launch |
| **Deployment performed** | No. Nothing has been deployed; no DNS, account or paid service was touched; no real enquiry or email was sent |

## Implementation readiness (verified on the final build)

- [x] Static checks: locales (544 public + 999 dashboard strings in parity), content, lint, typecheck — pass
- [x] Unit + integration tests on an embedded PostgreSQL (intake for all three forms, CV quarantine, permissions, retention, contact validation, shared rate limits) — 114/114
- [x] Public browser suite (Chromium + Firefox + WebKit + mobile WebKit + screenshots): routes, 404s, forms, uploads, locale switching, journeys J1–J10 in EN and AR, CSP, responsive/zoom/text spacing/forced colours, a11y, approved privacy policy, noindex on empty index pages — 199/199
- [x] Dashboard browser suite (Firefox, WebKit, Chromium; isolated database and build copy; synthetic accounts) including partner/career intake → dashboard, CV release/download, contact details → public pages, pausing a form — 30/30
- [x] Private review build suite (gallery, filters) — 4/4
- [x] Output audit: no withheld project names/parties, private sources, review routes, source maps or configured secrets in `.next`/`public` (1,073 files)
- [x] Security headers + Content-Security-Policy (strict nonce on the dashboard), private no-store/noindex on dashboard/auth/jobs
- [x] Canonical URL policy, server-rendered localized 404s, sitemap (15 indexable pages × 2 languages) and robots from the route registry
- [ ] Field Core Web Vitals — impossible before launch (no traffic)
- [ ] Real screen-reader and physical-device pass, and a native Arabic read-through — recommended before launch (`docs/bilingual-accessibility-qa.md`)

## Owner inputs and external configuration (blocking items first)

| ID | Needed | Affected feature | Safe fallback today |
| --- | --- | --- | --- |
| OD-01 | Production domain → `SITE_URL` (https) | Canonical, hreflang, sitemap, OG URLs, `upgrade-insecure-requests` | Local origin; `npm run check:release` fails on purpose |
| — | At launch: create the owner on the production server: `npm run admin:create-owner -- --email mark@zentrack.com --name "Mark Mofreh"` (Mark types his own password, 12+ characters) | Dashboard access | Dashboard closed until an owner exists |
| OD-22 | Provision managed PostgreSQL (16+, TLS, daily backups ≥ 30 days, restore test) → `DATABASE_URL` | All three forms and the dashboard | Forms fail closed ("temporarily unavailable"); embedded database for development/tests only |
| OD-23 | `BETTER_AUTH_SECRET` in the host's secret store, `BETTER_AUTH_URL` (https) | Dashboard sign-in | Dashboard fails closed without a secret |
| — | After the first sign-in: enter the verified contact details (Settings → Public contact details) | Footer, contact band, quote page, privacy-request channel | Address only; the privacy policy points to the postal address |
| OD-07/08 | Written permission to name each project and its parties, plus original images | Projects, home H06 | All records withheld; capability text shown |
| OD-03 | Logo master (vector) | Print/retina fidelity | Raster derivative |
| OD-14 | Exact English legal name | Legal use | "Zentrac" / «زينتراك» with the office address |
| OD-28 | Search Console (or equivalent) access for the production domain | Indexing follow-through | Not possible before launch |

Decided on 28 Oct 2026 (no longer blocking): owner account mark@zentrack.com (OD-21), no SMTP (OD-24), privacy policy (OD-04), contact channels in the dashboard (OD-02), partner/career forms in the dashboard (OD-05), no scanner for launch with manual release (OD-06), copy and Arabic approval (OD-11–13), no two-factor requirement (OD-26), retention (OD-25), built-in scheduler (OD-27), hosting and shared rate limiting (OD-20), empty index pages `noindex` (OD-29), and the content options OD-09, OD-10, OD-15–OD-19. Details: `docs/open-decisions.md`.

## Release steps

Follow `docs/deployment.md` ("Release procedure"). In short: `npm ci` → checks → `SITE_URL=https://… npm run build` → `npm run check:release` → e2e suites → `DATABASE_URL=… npm run db:migrate` → start → create the first owner → enter the contact details → one authorized end-to-end test of each form.

## Post-launch checks

- [ ] `https://<domain>/robots.txt` and `/sitemap.xml` use the production origin; spot-check canonical/hreflang on 3 pages per locale.
- [ ] Verify the domain in Search Console; submit the sitemap; inspect `/en` and `/ar`; check that `/en/admin` returns `X-Robots-Tag: noindex` and requires sign-in. No ranking or rich-result outcome is promised.
- [ ] HTTPS redirect and one canonical host (apex vs `www`) configured at the host/CDN (the app normalizes case and slashes; host and protocol are a hosting setting).
- [ ] Response headers on a public page, a 404 and a dashboard page include the Content-Security-Policy (check the browser console for violations once with real assets and any CDN in front).
- [ ] One authorized real quote, partner enquiry and career application (with a CV) → each appears once in the dashboard with an in-app notification; files quarantined; no personal data in logs.
- [ ] The contact details entered in the dashboard appear on the footer, quote page and privacy policy within a minute.
- [ ] Core Web Vitals field data (CrUX / Search Console) after enough traffic: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at p75. Lab numbers are in `docs/performance-before-after.md`.
- [ ] Database backup and restore drill; the built-in scheduler is running (Settings → Retention shows "on"); `npm audit` monthly.
- [ ] Screen-reader pass (NVDA, VoiceOver iOS) of the quote journey and explorer in both languages.
