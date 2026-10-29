# Post-build audit (03) — issue register

Audit of the public site and the quote dashboard after the initial build, 27–28 October 2026. Every issue followed **reproduce → identify cause → fix → verify → check affected regressions**; "Fixed" means the listed verification passed on the final production build, not that code changed.

Companion reports: `docs/seo-audit.md`, `docs/animation-enhancements.md`, `docs/performance-before-after.md`, `docs/bilingual-accessibility-qa.md`, `docs/final-release-checklist.md`. Dashboard-specific QA (04): `docs/admin-qa-report.md`.

## Baseline (before changes)

| Item | Baseline result | Evidence |
| --- | --- | --- |
| Stack | Next.js 16.4.3 (App Router, Turbopack), React 19.3.1, TypeScript 6, npm lockfile; Node 22.14.0; no Git repository (zip checkpoint `.checkpoints/2026-10-28-before-dashboard-and-audit.zip`) | `package.json` |
| Route inventory | 17 public pages per locale (12 pages + 5 service details), unknown/withheld URLs expected 404, dashboard routes private | `docs/route-matrix.md` |
| Crawl from `/en` and `/ar` | 34 pages reachable, all 200, 0 console errors, 0 failed requests, 0 `href="#"`, 0 duplicate titles, 1 H1 each | `docs/qa/before/crawl.json` |
| Static checks | locales, content, lint, typecheck, unit tests, build, output audit: pass | `docs/qa-report.md` |
| Accessibility (axe, 28 page/locale combinations) | 0 serious/critical | `tests/e2e/a11y.spec.ts` |
| Lighthouse mobile (median of 3) | `/en` 83, `/ar` 76, `/en/services/coordination` 92, `/ar/request-a-quote` 82 | `docs/qa/before/lighthouse-summary.json` |
| Screenshots / recordings / filmstrips | EN/AR, 320–1920 px, menus, errors, empty states | `docs/qa/before/` |

The baseline crawl and checks were clean, so most defects below were found by new, deeper checks (no-JS rendering, forced colours, text spacing, CSP, URL variants, journeys under load, motion filmstrips).

## Summary

| ID | Sev. | Title | Status |
| --- | --- | --- | --- |
| BUG-01 | P1 | Every 404 was an empty, client-rendered shell (blank without JavaScript, Home title, no `lang`/`dir`) | Fixed |
| BUG-02 | P1 | After an invalid quote submit, fixing the fields and pressing Send did nothing (click lost) | Fixed |
| SEC-01 | P2 | No Content-Security-Policy | Fixed (enforced) |
| SEC-02 | P2 | No automated check for credentials in build output | Fixed (check added) |
| SEC-03 | P3 | Zod's `eval` probe raised a CSP violation on the quote page | Fixed |
| SEO-01 | P2 | Mixed-case URLs were not canonicalized (`/EN` → `/en/EN` → 404) | Fixed |
| SEO-02 | P3 | About page title repeated the brand ("About Zentrac · Zentrac") | Fixed |
| A11Y-01 | P2 | Form-field focus indicator vanished in forced-colours mode (public and dashboard) | Fixed |
| A11Y-02 | P2 | Issue-register table scrolls sideways on narrow screens / enlarged text spacing but was not keyboard-reachable | Fixed |
| A11Y-03 | P2 | Focus sometimes did not move to the form result or error summary (timing) | Fixed |
| MOT-01 | P2 | Hero: orange fragment visible at 0 ms; coordination route mostly invisible at the end | Fixed |
| MOT-02 | P2 | Explorer: trace re-drew on every click; selection linked to the diagram by colour only | Fixed |
| MOT-03 | P2 | Track: highlighted stage not updated when entering mid-Track | Fixed |
| MOT-04 | P2 | Track: GSAP initialisation could cut a visitor's scroll short | Fixed |
| MOT-05 | P3 | Hero sequence order, Track direction/contrast, missing pressed/feedback states | Fixed |
| PERF-01 | P2 | Mobile Lighthouse below the 90 aim on Home (83 EN / 76 AR) | Partly resolved: Home EN 83 → 89 (best run 92), AR 76 → 82, blocking time −120 / −200 ms; mobile medians remain below 90, and the service (92 → 89) and Arabic quote (82 → 79) pages moved within run variance — open, see the performance report |
| PERF-02 | P2 | Reveal controller forced one style/layout recalculation per element on load | Fixed |
| PERF-03 | P3 | English pages downloaded the 43 KB Arabic font for one word | Fixed |
| PERF-04 | P3 | Phones downloaded and ran GSAP for a Track that is static on phones | Fixed |
| DEP-01 | P3 | `npm audit`: 4 moderate advisories in the dev-only `drizzle-kit` toolchain | Accepted, documented |
| NOTE-01 | — | Form pages render per request (since the dashboard work), so the router cannot prefetch them fully | Accepted trade-off |
| QA-01 | — | Baseline full-page screenshots scrolled too fast, leaving reveal areas blank (capture artefact, not a site defect) | Script corrected |

No P0 issue (sensitive-data exposure, destructive behaviour, site-wide failure) was found: withheld records, private sources and secrets are absent from the output (`npm run check:output`, crawl, 404 checks).

## P1

### BUG-01 — 404 pages were empty client-rendered shells
- **Affected:** every unknown public URL in both locales, unknown service slugs, withheld project and draft article URLs; all devices.
- **Reproduce:** request `/ar/does-not-exist` (or `/en/services/survey`, `/en/projects/sedra`) with JavaScript off, or read the raw HTML.
- **Observed:** status 404, but the HTML was Next.js's error shell `<html id="__next_error__"><body></body>` — no `lang`/`dir`, no heading, no links, title of the home page; with JavaScript the localized page appeared only after a client render.
- **Expected:** a server-rendered localized 404 with navigation and recovery links.
- **Cause:** a page-level `notFound()` is caught by a client error boundary; React has no server-side error boundaries, so the error reaches the document shell and Next.js falls back to client rendering. (`dynamicParams = false` was ruled out by experiment.)
- **Fix:** the proxy now recognises published public paths from the same registry as the sitemap (`src/lib/public-routes.ts`) and rewrites anything else to the server-rendered localized 404 route (`/[locale]/page-not-found`, rendered per request) **with status 404**. The `not-found` boundary remains as a backstop.
- **Verify:** `tests/e2e/routes.spec.ts` (14 URLs: server HTML has `lang`/`dir`, the localized H1, a recovery link, the 404 title, no canonical, no `__next_error__`), journeys J7 and J10 (no-JS), `scripts` no-JS probe. Private review routes still work in the review build (`tests/review`).
- **Status:** Fixed.

### BUG-02 — Send ignored after correcting an invalid submission
- **Affected:** quote/partner/career forms, EN and AR, mouse and touch.
- **Reproduce:** press Send on the empty quote form, fill every field (privacy checkbox last), press Send.
- **Observed:** nothing happened; no request was sent; the error summary stayed (6 of 6 runs).
- **Expected:** the corrected form submits.
- **Cause:** pressing Send blurs the last field; its blur validation removed the error message, the layout moved up and the pointer release landed below the moved button, so no click fired.
- **Fix:** errors now clear as soon as a field becomes valid (while typing), and blur validation that happens during a pointer press is applied after the press ends (`EnquiryForm.tsx`).
- **Verify:** `forms.spec.ts` "BUG-02 … (EN and AR)", journey J1 (EN, AR); the form/journey/interaction specs passed three repeated runs under 4 parallel workers (126/126).
- **Status:** Fixed.

## P2

### SEC-01 — Content-Security-Policy
- **Before:** none. **Fix (`src/proxy.ts`):** dashboard pages render per request and get a strict policy — a fresh nonce per response that Next.js applies to its scripts, `'strict-dynamic'`, the hash of the one inline `js`-class script, no `unsafe-eval`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri`/`form-action 'self'`; a client-supplied CSP header is discarded. Public pages are prerendered and Next.js inlines their RSC payload, so a per-request nonce is impossible there: they get a same-origin policy that allows inline scripts but blocks every other script origin, `eval`, plugins, framing, `<base>` and form-target hijacking. `upgrade-insecure-requests` is added when `SITE_URL` is https. Existing headers (nosniff, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy; private no-store/noindex on dashboard and auth routes) are unchanged.
- **Verify:** `tests/e2e/security.spec.ts` (headers on public/404 pages; home, explorer, Arabic Track with GSAP, quote upload with zero violations), `tests/admin/02-access.spec.ts` SEC-01 (nonce changes per request, every executable script carries it, forged header ignored, inbox/detail tabs/team/settings/audit/account with zero violations), `06-mfa.spec.ts` (QR code `data:` image and enrolment under the strict policy).
- **Status:** Fixed (enforced, not report-only, after the full public suite in 4 browser engines and the dashboard suite in 3 engines passed).

### SEC-02 — Credential leak check
- **Fix:** `npm run check:output` now also fails if browser chunks read a server-only secret (`env.NAME`) or if the configured values of `BETTER_AUTH_SECRET`, `DATABASE_URL`, `SMTP_*`, webhook/job tokens or `ADMIN_OWNER_PASSWORD` (process env and `.env.local`) appear anywhere in the build output. Values are compared, never printed.
- **Verify:** passes on the final build (1 configured local secret checked, absent). An admin help string naming `DATABASE_URL` was correctly not flagged (rule tested against code-read and text samples).
- **Status:** Fixed. No exposure found, so no credential rotation is needed.

### SEO-01 — URL casing
- **Reproduce:** `/EN` → 307 to `/en/EN` (404); `/en/Services` → 404.
- **Fix:** one 308 to the lowercase URL for public pages (query kept); dashboard URLs only normalize the locale/"admin" segments because invitation tokens and record IDs are case-sensitive; percent-escapes untouched. Trailing/duplicate slashes were already 308 (Next.js).
- **Verify:** `routes.spec.ts` "canonical URL policy" (7 cases incl. an admin token). **Status:** Fixed.

### A11Y-01 — Focus in forced-colours mode
- **Reproduce:** Windows High Contrast / `forced-colors: active`, tab into a form field.
- **Cause:** `outline: none` + a box-shadow ring; forced colours remove box-shadows.
- **Fix:** transparent 2 px outline (invisible normally, drawn in the system colour in forced colours) for public fields and dashboard inputs.
- **Verify:** `responsive.spec.ts` forced-colours test (EN, AR); screenshots `docs/qa/after/screenshots/forced-colors-quote-{en,ar}-1280.png`. **Status:** Fixed.

### A11Y-02 — Scrollable issue register
- **Reproduce:** home at 390 px with WCAG 1.4.12 text spacing: the register's status column scrolls sideways; keyboard users could not reach it.
- **Fix:** the scroll wrapper is a focusable, labelled region (`tabindex="0"`, `role="region"`, named by the register title) with an inset focus ring. The table scrolls rather than clipping (tables are a permitted reflow exception).
- **Verify:** `responsive.spec.ts` text-spacing test (EN, AR). **Status:** Fixed.

### A11Y-03 — Focus after submit
- **Observed (intermittent, under load):** the result panel appeared but did not receive focus, so a screen-reader user could miss the confirmation.
- **Cause:** focus was requested in `requestAnimationFrame`, which can run before React commits the panel.
- **Fix:** focus moves in a post-commit effect.
- **Verify:** three repeated parallel runs of the form/journey specs (126/126). **Status:** Fixed.

### MOT-01 … MOT-04 — Motion defects
Details, causes and before/after filmstrips: `docs/animation-enhancements.md`. Summary: the hero's dash bug (global `non-scaling-stroke` vs `pathLength` dashes) is fixed at the cause; the explorer draws once and labels the selected layer on the diagram; the Track syncs the active stage on entry and waits for a scroll pause before ScrollTrigger measures. Verified by filmstrips, recordings, `interactions.spec.ts`, journeys J4/J5 (EN, AR).

### PERF-01 … PERF-04 — Performance
Measurements, conditions and trade-offs: `docs/performance-before-after.md` (the "before" set predates the dashboard integration, which also split the stylesheet and made the form pages render per request). Fixes: static decorative SVG artwork is injected as pre-serialized markup (identical DOM, verified byte-for-byte against React's renderer in `tests/unit/static-svg.test.ts`), the reveal controller no longer forces layout, GSAP is not downloaded on phones, and English pages load a 3.7 KB subset instead of the 43 KB Arabic font. Inlining the CSS was tried and rejected after measurement (it raised blocking time).

## P3 and notes

| ID | Detail | Verification |
| --- | --- | --- |
| SEC-03 | Zod 4 probes `new Function` on first parse; under the CSP that logs a violation before falling back. `z.config({ jitless: true })` in the shared form schema | `security.spec.ts` (no violation on the quote page) |
| SEO-02 | English meta title "About Us · Zentrac" (H1 unchanged) | crawl (`docs/qa/after/crawl.json`) |
| MOT-05 | Hero beat order and handover, Track contrast/direction/total, pressed and feedback states | filmstrips |
| DEP-01 | `esbuild ≤ 0.24.2` dev-server advisory via `drizzle-kit` → `@esbuild-kit/*` (dev dependency used only for `npm run db:generate`; the dev server it concerns is never started). The offered fix downgrades `drizzle-kit` to 0.18 (breaking); not applied. Production dependencies: no advisory beyond this chain | `npm audit` |
| NOTE-01 | Quote, partner and careers pages read the form mode at request time (so a build without production secrets can never bake in the wrong mode). Cost: slightly later TTFB and partial prefetch (the router cancels full prefetches of per-request pages — the crawler ignores these cancellations) | crawl, Lighthouse |
| QA-01 | `scripts/screenshots.mjs` now scrolls slowly enough for every reveal observer before full-page captures | after screenshots |

## Verification run on the final build

| Command | Result |
| --- | --- |
| `npm run check:locales && npm run check:content` | pass |
| `npm run lint && npm run typecheck` | pass |
| `npm test` (Vitest: unit + dashboard integration on embedded PostgreSQL) | 93/93 |
| `npm run build && npm run check:output` | pass (leak + credential audit) |
| `npx playwright test` (public: Chromium full suite, Firefox/WebKit/mobile WebKit cross-browser, screenshots) | 196/196 |
| form/journey/interaction specs × 3 repeats, 4 workers | 126/126 |
| `npm run test:admin` (dashboard, Firefox + WebKit + Chromium, isolated database) | 25/25 |
| `npx playwright test --config tests/review/playwright.review.config.ts` (private review build: gallery, filters) | 4/4 |
| Crawl `node scripts/audit-crawl.mjs` | 34 pages, all 200, 0 console errors, 0 failed requests, SEO checks clean (`docs/qa/after/crawl.json`) |

## Not verified

Real screen readers (NVDA, JAWS, VoiceOver, TalkBack) and physical phones; field Core Web Vitals (no live site); production HTTPS, CDN and multi-instance behaviour; real email delivery and malware scanning (not configured); third-party validators (the site is not public, so no URL was submitted). Details in `docs/bilingual-accessibility-qa.md` and `docs/final-release-checklist.md`.
