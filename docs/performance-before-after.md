# Performance before / after (03 §8)

All numbers are **lab** measurements on one Windows 11 machine against the production build. They diagnose problems; they are not field Core Web Vitals (no live site, so no p75 LCP/INP/CLS exists yet), and Total Blocking Time is not INP.

## Conditions

| Item | Value |
| --- | --- |
| Build | `next build` (Turbopack) + `next start -p 3005`, `FORM_MODE=preview`, `SITE_URL` unset |
| Before | 27 Oct 2026 22:45 UTC build (start of this audit) — `docs/qa/before/` |
| After | Final build of 28 Oct 2026 — `docs/qa/after/` |
| Lighthouse | 12.8.2, Playwright Chromium (headless new), default **mobile** (simulated slow 4G, 4× CPU, Moto G Power viewport) and `--preset=desktop`; **3 runs per page and preset, median by performance score, range shown** (`scripts/lighthouse.mjs --runs=3`) |
| Applied throttling | `scripts/measure-vitals.mjs`: real Chrome with 4× CPU, 150 ms RTT, 1.6 Mbps, cache disabled; browser's own FCP/LCP/CLS/long-task entries; median of 3 |
| Transfer | `scripts/measure-transfer.mjs`: first-view compressed bytes per resource type |
| Diagnosis | Chrome traces and CPU profiles with 4× CPU slowdown (no network throttling); `scripts/dom-weight.mjs` |
| Pages | Home EN/AR, a service page (EN), the quote form (AR) — the same four as the baseline |

## Lighthouse (median of 3)

| Page | Preset | Performance before → after (range) | LCP | TBT | FCP | Speed Index | CLS | A11y / BP / SEO (after) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/en` | mobile | **83 → 89** (83–84 → 87–92) | 3.3 s → 3.1 s | 380 ms → 260 ms | 1.2 s → 1.2 s | 2.0 s → 1.9 s | 0 → 0 | 100 / 100 / 100 |
| `/en` | desktop | **100 → 100** (100–100 → 100–100) | 0.7 s → 0.7 s | 20 ms → 40 ms | 0.3 s → 0.3 s | 0.7 s → 0.7 s | 0 → 0 | 100 / 100 / 100 |
| `/ar` | mobile | **76 → 82** (75–77 → 82–85) | 3.6 s → 3.6 s | 560 ms → 360 ms | 0.9 s → 1.2 s | 2.4 s → 2.3 s | 0 → 0 | 100 / 100 / 100 |
| `/ar` | desktop | **99 → 99** (99–99 → 99–99) | 0.9 s → 0.8 s | 60 ms → 40 ms | 0.3 s → 0.3 s | 1.0 s → 0.8 s | 0 → 0 | 100 / 100 / 100 |
| `/en/services/coordination` | mobile | **92 → 89** (89–93 → 88–91) | 2.9 s → 2.8 s | 180 ms → 310 ms | 1.2 s → 1.1 s | 1.6 s → 2.7 s | 0 → 0 | 100 / 100 / 100 |
| `/en/services/coordination` | desktop | **100 → 100** (100–100 → 100–100) | 0.8 s → 0.6 s | 40 ms → 20 ms | 0.3 s → 0.3 s | 0.6 s → 0.5 s | 0 → 0 | 100 / 100 / 100 |
| `/ar/request-a-quote` | mobile | **82 → 79** (82–86 → 75–80) | 3.6 s → 3.8 s | 350 ms → 390 ms | 0.9 s → 1.2 s | 1.4 s → 2.9 s | 0 → 0 | 100 / 100 / 100 |
| `/ar/request-a-quote` | desktop | **100 → 100** (99–100 → 100–100) | 0.7 s → 0.8 s | 20 ms → 20 ms | 0.3 s → 0.3 s | 0.6 s → 0.6 s | 0 → 0 | 100 / 100 / 100 |

## Applied-throttling lab (median of 3, mobile emulation)

| Page | FCP before → after | LCP before → after | TBT (long-task excess) before → after | Long tasks | CLS |
| --- | --- | --- | --- | --- | --- |
| `/en` | 1468 → 1428 ms | 1468 → 1428 ms | 519 → 491 ms | 4 → 4 | 0 → 0 |
| `/ar` | 1916 → 1860 ms | 1916 → 1860 ms | 543 → 514 ms | 4 → 4 | 0 → 0 |
| `/en/services/coordination` | 1092 → 1104 ms | 1092 → 1104 ms | 342 → 387 ms | 2 → 2 | 0 → 0 |
| `/ar/request-a-quote` | 1880 → 1860 ms | 1880 → 1860 ms | 1117 → 1133 ms | 4 → 3 | 0 → 0 |

## First-view transfer

| Page | Viewport | Total before → after (KiB) | Fonts | All scripts | Initial JS in HTML |
| --- | --- | --- | --- | --- | --- |
| `/en` | mobile | 362.8 → **282.0** | 74.9 → 36.6 | 189.8 → 152.7 | 151.6 → 152.7 |
| `/en` | desktop | 400.3 → **321.9** | 74.9 → 36.6 | 199.0 → 162.5 | 151.6 → 152.7 |
| `/ar` | mobile | 412.9 → **369.5** | 120.0 → 120.0 | 189.8 → 152.7 | 151.6 → 152.7 |
| `/ar` | desktop | 452.7 → **411.6** | 120.0 → 120.0 | 199.0 → 162.5 | 151.6 → 152.7 |
| `/ar/request-a-quote` | mobile | 386.5 → **392.3** | 120.0 → 120.0 | 189.8 → 191.6 | 187.3 → 188.5 |
| `/ar/request-a-quote` | desktop | 435.6 → **435.5** | 120.0 → 120.0 | 199.0 → 201.4 | 187.3 → 188.5 |

## What was slow, and what changed

Diagnosis on the home page (4× CPU): the largest-contentful element is the hero lead paragraph, painted in the **first** frame (observed FCP = LCP). Lighthouse's simulated LCP was 3.3–3.6 s because, on a fast local load, the framework's startup scripts run before that first paint, so the simulation places their CPU time in front of it. Main-thread time was dominated by framework start-up (React DOM ≈ 72 KB gz, router + RSC client ≈ 46 KB gz: ~90 % of initial JavaScript), parsing and hydrating a 117 KB inline RSC payload, and style/layout/paint for a 1,250-element page (554 of them SVG).

| Change | Why | Measured effect |
| --- | --- | --- |
| Static decorative SVG artwork (hero, schematic, 11 technical illustrations on Home) injected as pre-serialized markup on the outer `<svg>` | React no longer serializes, parses and hydrates ~550 static SVG nodes; DOM identical (unit-tested byte-for-byte against React's renderer) | Home RSC payload 117 → 105 KB; with the next change, script time on a 4× CPU ≈ 1,060 → ≈ 890 ms |
| Reveal controller classifies elements from the IntersectionObserver's first report | Removed a read/write loop that forced one style + layout recalculation per `[data-reveal]` element at start-up | A ~100 ms (4×) hotspot disappeared from the CPU profile |
| GSAP + ScrollTrigger never loaded on phones (the scroll-driven Track exists only ≥ 64 rem) | ~40 KB gz of JavaScript downloaded and executed for nothing on phones when the Track approached | Verified: no GSAP request after scrolling all of `/en` at 390 px; still loaded on desktop |
| English pages render the Arabic language-switch label with a 3.7 KB subset of IBM Plex Sans Arabic (renamed per the OFL) | The 43 KB Arabic font was downloaded at high priority on every English page view for one word | English pages now load Saira + 3.7 KB; Arabic pages unchanged |

Measured and **not** adopted:
- `content-visibility: auto` on below-the-fold sections: −60 % paint but only ≈ −40 ms blocking time (4× CPU), and it changes layout measurement for the scroll-driven Track and anchor jumps. Not worth the risk.
- Static (non-animated) hero on phones: the sequence costs ≈ 40 ms of blocking time (4× CPU); kept as the signature scene.
- Prerendering the form pages again: their form mode must come from the runtime environment (a build without production secrets must never bake in the wrong mode). Cost: slightly later TTFB and no full prefetch.

## Remaining gaps and trade-offs (honest)

- **Scope of the comparison.** The "before" set is the initial build (27 Oct, 22:45 UTC), measured before the quote dashboard was integrated. That integration also changed public pages: the stylesheet is now split into a shared core file and a site file (two render-blocking requests instead of one), the quote/partner/careers pages render per request, and every request passes through the proxy. The table therefore shows the combined effect of the dashboard integration and this audit's fixes.
- **The ≥ 90 mobile aim is not met as a median.** Home EN reached 92 in its best run but its median is 89 (87–92); the service page 89 (88–91); Home AR 82 (82–85); the Arabic quote page 79 (75–80). Desktop scores are 99–100 everywhere.
- **Run-to-run variance.** In some runs Chrome's first paint (unthrottled, as Lighthouse observes it) came at 1.5–1.7 s instead of 0.5–0.8 s on the same page; these runs inflate the simulated Speed Index (service page 1.6 → 2.7 s, quote page 1.4 → 2.9 s) and landed on the median for two pages. The applied-throttling measurements, which are steadier, show LCP of 1.1–1.9 s on all four pages, unchanged or slightly better than before, and CLS 0.
- **Why simulated LCP stays near 3–3.8 s on mobile.** On every page the LCP element is text painted in the first frame (observed LCP = FCP). Lighthouse's simulation places the framework's start-up work (React DOM + router + RSC client ≈ 118 KB gz, about 90 % of the initial JavaScript) in front of that paint because it ran first on a fast local load. Reducing it further would mean leaving the App Router or removing interactive features.
- **Arabic pages** need two Arabic font files (400/600, 89 KB, preloaded) and Arabic shaping costs more layout time; both are inherent to correct Arabic typography.
- **Quote page.** It carries the largest client component (the form: ~370 elements including a 258-country list, 188 KB initial JS with the framework) and now renders per request (TTFB 11 → 54 ms locally) so the form mode is always correct. Not attempted: rendering the country list without hydration and splitting upload/validation code into on-demand chunks; worth revisiting once field data shows whether real users are affected.
- **Rejected after measurement:** `experimental.inlineCss`. Next.js embeds the CSS in both the HTML and the RSC payload (home HTML 181 → 367 KB raw, 67 KB gzipped), which raised blocking time (home median 89 → 81, TBT 260 → 490 ms) more than removing the two stylesheet requests saved.
- **INP** cannot be measured in the lab; check the field INP (and LCP/CLS at p75) in Search Console/CrUX after launch.

## Other checks

- **CLS:** 0 on every measured page (fonts use `font-display: swap` with a metric-adjusted fallback for Saira; images and illustrations have dimensions; validation messages appear below fields without moving the submit button during a press — BUG-02).
- **Fonts:** Saira variable Latin subset (33 KB) preloaded on every page; Arabic pages also preload IBM Plex Sans Arabic 400 and 600 (Arabic subset, ~89 KB together); English pages no longer download them.
- **Images:** the only raster image above the fold is the 17 KB logo (preloaded, explicit size). Project imagery is withheld (OD-07/08), so no responsive photo pipeline is exercised yet; `next/image` with AVIF/WebP is configured for when it is.
- **Caching:** hashed `/_next/static/*` assets are immutable; public pages are static HTML; form pages, API responses, dashboard and auth responses are `private, no-store` (no shared caching of personal data). No service worker exists and none was added.
- **Listeners and memory:** every controller removes its listeners/observers on unmount; repeated client navigation re-creates them once (no duplicate ScrollTriggers); no perpetual animation loops.
