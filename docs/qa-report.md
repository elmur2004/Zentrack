# QA report

Final build: 28 October 2026. Every result below comes from commands actually run on this machine; nothing is extrapolated.

> This report records the initial build's QA (Gate A). The later post-build audit (03) and the quote dashboard (04) changed the code and extended the suites; their current results supersede the counts and performance figures here: `docs/post-build-audit.md` (issue register and final test runs), `docs/performance-before-after.md`, `docs/seo-audit.md`, `docs/bilingual-accessibility-qa.md`, `docs/animation-enhancements.md`, `docs/admin-qa-report.md`.

## Environment

| Item | Value |
| --- | --- |
| OS | Windows 11 Pro 10.0.26200 |
| Node / npm | 22.14.0 / 10.9.2 |
| App | Next.js 16.4.3 (Turbopack), React 19.3.1, TypeScript 6.0.3 |
| Browsers (Playwright 1.64.1) | Chromium 156.0.8078.4, Firefox 157.0, WebKit 27.2 (desktop Safari profile and iPhone 13 emulation) |
| Lighthouse | 12.8.2 with Playwright’s Chromium, default mobile profile (simulated slow 4G, 4× CPU) and `--preset=desktop` |
| Server under test | `next start -p 3005`, `FORM_MODE=preview`, `SITE_URL` unset (local origin) |

## Commands and results

| Command | Result |
| --- | --- |
| `npm run check:locales` | ✓ 502 dictionary strings + all bilingual content records match (keys, arrays, placeholders, no empty/untranslated strings, no hidden bidi characters) |
| `npm run check:content` | ✓ 0 public projects, 0 public articles; no placeholders, unapproved claims, private fields or source files in `public/` (11 files audited) |
| `npm run lint` | ✓ 0 problems |
| `npm run typecheck` | ✓ 0 errors |
| `npm test` (Vitest) | ✓ 45/45 tests, 4 files |
| `npm run build` | ✓ 41 static outputs (34 locale pages + 404, icons, sitemap, robots); API routes dynamic; no review routes |
| `npm run check:output` | ✓ 647 files scanned against 65 restricted terms (derived from withheld records + markers); no review routes, no source maps. Flag: local origin in canonicals (launch blocker OD-01) |
| `npm run verify` | ✓ exit 0 (all of the above in sequence) |
| `npx playwright test` | ✓ 146/146: 105 Chromium functional, 12 cross-browser (Firefox, WebKit, iPhone 13 emulation), 29 screenshots |
| `npx playwright test --config tests/review/playwright.review.config.ts` (review build) | ✓ 4/4 (gallery dialog EN/AR, fixture screenshot, filters). The English gallery test failed once on the dev server’s first cold compile and passed on re-run |

## What the automated suites cover

**Bilingual and direction (spec §17.2)**

| ID | Result | How |
| --- | --- | --- |
| L01 | ✓ | Every public page in both locales: 200, `lang`/`dir` present in the server HTML, one H1, localized title |
| L02 | ✓ | `/en/services/coordination` ⇄ `/ar/services/coordination` |
| L03 | n/a publicly | No published project/article; switch logic unit-tested; review templates render in both locales |
| L04 | ✓ | Stable-ID query (`service`, `scope`, `country`…) kept on switch (unit + e2e); filters, counts, zero state, clear and Back tested in the review build |
| L05 | ✓ | Typed draft survives the switch (not in storage/URL); selected files trigger a localized confirm that can cancel |
| L06 | ✓ | Back/forward keep the right direction |
| L07 | ✓ (visual) | Arabic headings at 320–1920 px reviewed in screenshots; no clipping, natural shaping |
| L08 | ✓ | `RFI-024` isolated LTR in Arabic; `LOD 400`/`RFI-024` in Arabic table and fixture scope reviewed |
| L09–L11 | ✓ | Arabic + Latin names accepted; email/phone/URL inputs LTR inside RTL form; Arabic-Indic phone and experience digits normalized |
| L12 | ✓ | Logo and illustrations have `transform: none` in Arabic |
| L13 | ✓ | Breadcrumb separators mirrored (`matrix(-1…)`) in Arabic |
| L14 | ✓ | 320 px Arabic header: no overlap, language control visible; 360/390/768/1024 px screenshots reviewed |
| L15 | ✓ | Services disclosure by keyboard; gallery arrows follow reading direction (ArrowLeft = next in Arabic); Home/End |
| L16 | ✓ | Counts 0, 1, 2, 3, 11, 100 in both languages (unit) |
| L17 | ✓ | Errors, empty states, test/received/failure/rate-limit/unavailable states localized; no raw keys |
| L18 | ✓ (review) | Arabic draft article: RTL paragraphs, LTR tokens in table, captions in gallery |
| L19 | ✓ | Localized titles/descriptions, self canonical, reciprocal `en`/`ar`/`x-default` hreflang; sitemap alternates |
| L20 | ✓ | JavaScript disabled: copy, links, Track stages, 11 category descriptions; forms show a `noscript` notice |

**Functional and factual (spec §17.3)**: withheld project/draft article/unknown URLs return real 404 (both locales); no `href="#"`, no placeholder contacts; services preselect the quote form and stay editable; quote/career/partner invalid, valid, duplicate (double click → one request), offline/transport failure (text preserved), rate-limit and unavailable states; uploads reject CAD files, mismatched signatures and oversize files server-side; preview mode never shows “received”; live mode without a provider returns 503 (unit); idempotent replays return the same reference, reused keys with new content get 409 (unit); public projection contains no withheld names (output audit).

**Accessibility**: axe (WCAG 2.0/2.1/2.2 A/AA tags) on 14 pages × 2 locales including 404 — 0 serious/critical violations. Keyboard: skip link, menus, disclosure, drawer (focus moves in, Escape closes, focus returns, scroll lock released), error summary focus + field links, explorer buttons with `aria-pressed`, gallery dialog. Lighthouse accessibility 100 on all audited pages.

**Motion**: reduced motion (content visible, no armed reveals, static vertical Track, hero final frame), Track scroll scrub and anchors, header state without height change, fine-pointer-only tilt (manual), no-JS.

## Performance

Targets are lab aims (spec §15.1); lab tests cannot establish field LCP/INP percentiles.

**Lighthouse (median of 3 runs, `docs/lighthouse/summary.json`)**

| Page | Mobile perf (range) | FCP | LCP | TBT | CLS | Desktop perf | A11y / BP / SEO |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/en` | 83 (83–84) | 1.2 s | 3.3 s | 380 ms | 0 | 100 | 100 / 100 / 100 |
| `/ar` | 76 (75–77) | 0.9 s | 3.6 s | 560 ms | 0 | 99 | 100 / 100 / 100 |
| `/en/services/coordination` | 92 (89–93) | 1.2 s | 2.9 s | 180 ms | 0 | 100 | 100 / 100 / 100 |
| `/ar/request-a-quote` | 82 (82–86) | 0.9 s | 3.6 s | 350 ms | 0 | 100 | 100 / 100 / 100 |

**Applied throttling in real Chrome** (`scripts/measure-vitals.mjs`: 4× CPU, ~1.6 Mbps, 150 ms latency, cache disabled, median of 3; `docs/lighthouse/throttled-vitals.jsonl`)

| Page | FCP = LCP | CLS | Approx. blocking time |
| --- | --- | --- | --- |
| `/en` | 1.47 s | 0 | 519 ms |
| `/ar` | 1.92 s | 0 | 543 ms |
| `/en/services/coordination` | 1.09 s | 0 | 342 ms |
| `/ar/request-a-quote` | 1.88 s | 0 | 1,117 ms |

**Transfer** (`docs/lighthouse/transfer.txt`, compressed): homepage initial JS 151.6 KiB (target ≤ 250) + 38 KiB idle route prefetch; fonts 74.9 KiB EN / 120 KiB AR (target ≤ 450); total first view 363 KiB EN mobile, 413 KiB AR mobile (target ≤ 1.8 MiB); no hero raster (inline SVG).

**Gap — homepage mobile performance below the ≥ 90 aim.** Cause: main-thread work to hydrate a large server-rendered page (≈ 1,190 DOM nodes, RSC payload parse) under Lighthouse’s simulated 4× CPU; Lighthouse attributes that work to the first paint of the hero text (in real throttled Chrome LCP is 1.5–1.9 s). Arabic pages also pay for Arabic text layout. Already done: GSAP loaded on demand, scenes server-rendered with behaviour-only client controllers, illustration code removed from the client bundle, error strings split from dictionaries, no prefetch of the other locale, Arabic weight 500 dropped, hero copy readable from first paint. Further options (not done): split the homepage into deferred sections (lower-priority sections streamed after first paint), reduce SVG node counts further, move the country list behind progressive loading on the quote page. The quote form’s higher blocking time comes from hydrating the ~550-element form including the 257-option country list.

## Defects found and fixed during QA

1. Hydration attribute mismatch from the pre-paint `js` class on `<html>` → `suppressHydrationWarning` on `<html>`.
2. `setState` in an effect in the services disclosure (lint) → state adjusted during render.
3. Country filter values (`SA`) dropped on language switch (unit test) → allow uppercase stable IDs.
4. Review banner pushed the header into a white sticky state → banner pinned to the viewport bottom.
5. Public bundle contained the review media path string → review media route moved under `/{locale}/review/media`, `unoptimized` flag on review images.
6. Error boundary shipped both full dictionaries to every page (~19 KiB gz) → tiny `errors.ts`.
7. Prefetch of the other-locale page pulled all Arabic fonts onto English pages → `prefetch={false}` on the language link.
8. Illustration SVG code and the hero/Track/explorer markup were hydrated as client components → server-rendered with controllers; ScrollTrigger/GSAP on demand (initial JS 256 → 152 KiB).
9. Hero copy started at opacity 0 (not readable at first paint, not an LCP candidate) → transform-only entrance.
10. Track progress test sampled mid-scrub → polling assertion.
11. Bidi control characters had been typed into three Arabic strings → replaced by `<bdi>`-rendered placeholders; `check:locales` now rejects them.

## Not tested / limitations (stated explicitly)

- **Screen readers:** no NVDA, JAWS, VoiceOver or TalkBack session was run. Semantics were checked via axe, roles/names in tests and code review only.
- **Real devices:** iOS Safari and Android Chrome were not tested on hardware; WebKit desktop and iPhone 13 **emulation** only.
- **Text-only 200 % zoom** (browser setting) not run; 320 CSS-px reflow (equivalent to 400 % zoom at 1280 px) passes on every public page in both locales.
- **Live delivery:** no provider configured, so no real enquiry has been received end to end (Gate C).
- **Gallery dialog** exercised only with the synthetic review fixture (no record has two or more available images).
- **Single-instance stores:** rate limiting, idempotency and upload registry are in-memory.
- Lighthouse runs on a developer workstation vary by ±5 points between runs; medians are reported.

## Screenshots

`docs/screenshots/` (33 files), named `page-locale-width[-state]`: home EN/AR at 320, 390, 768, 1024, 1440, 1920 (+ full page, + reduced motion), service detail EN 1440 / AR 390, services AR, infrastructure EN (water selected) / AR 390, How We Work AR (Track mid-scroll), about AR / EN 390, clients, projects empty state, blog empty state, menus (AR 360 drawer, EN services disclosure), quote AR errors / EN test complete / EN upload states, careers, partners AR, privacy AR, 404 AR, and `project-en-1440-review-fixture` (synthetic record, review build). Withheld project imagery is deliberately not included in `docs/`.
