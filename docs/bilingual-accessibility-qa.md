# Bilingual, RTL/LTR and accessibility QA (03 §5, §6, §9, §10)

Target: WCAG 2.2 AA. Automated results are evidence for specific checks, not a certification. Tested on the production build with Playwright 1.64.1 (Chromium 1248, Firefox, WebKit; mobile WebKit = iPhone 13 emulation) and axe-core 4.14. **All device checks are emulation in desktop browsers; no physical phone or screen reader was used** (see "Not tested").

## English / Arabic parity

| Check | Result | Evidence |
| --- | --- | --- |
| Dictionary parity (public + dashboard, incl. plural objects zero/one/two/few/many/other) | Pass | `npm run check:locales` |
| No raw keys, placeholders or `undefined` in visible text, every page, both locales | Pass | `routes.spec.ts` |
| `lang`/`dir` correct in the server HTML (before hydration) on all 34 pages and on 404 pages | Pass (404 pages fixed — BUG-01) | `routes.spec.ts` |
| Localized metadata, breadcrumbs, captions, errors, empty states, 404 | Pass | crawl titles/descriptions (`docs/seo-audit.md`), `forms.spec.ts` L17, J7 |
| Arabic-Indic digits accepted in phone fields; narrative content unchanged | Pass | `forms.spec.ts` L10/L11 |
| Language switch keeps route, service ID, query (`?service=…&scope=…`) and `#anchor`; back/forward keep direction; reload keeps language | Pass | `locale.spec.ts`, journey J2 (EN→AR and AR→EN) |
| Form text survives a language switch; selected files trigger an honest localized warning (switch cancelled = nothing lost) | Pass | `locale.spec.ts` L05, journey J8 (both directions) |
| Explicit language URLs never overridden (no Accept-Language/geo/cookie redirect) | Pass | `routes.spec.ts` (root redirect ignores `accept-language: ar`) |
| Arabic text never split per glyph or letter-spaced | Pass (code review of all motion; Arabic `letter-spacing: 0` overrides) | `components.css` |

Arabic copy quality (terminology, rhythm, spelling) still needs a professional Arabic engineering review — **OD-13** — before launch; this audit checked completeness and mechanics, not editorial quality.

## RTL/LTR and mixed direction

| Check | Result | Evidence |
| --- | --- | --- |
| Logical CSS (inline/block properties) throughout; no double reversal | Pass (review + screenshots) | `docs/qa/after/screenshots/`, filmstrips |
| Logo, drawings, schematic, hero geometry never mirrored | Pass | `interactions.spec.ts` L12/L13, J4 (`transform: none` on the schematic in Arabic) |
| Forward/back arrows and breadcrumb chevrons follow reading direction | Pass | `interactions.spec.ts` |
| Latin tokens in Arabic sentences keep order: BIM, LOD 400, LV / MV, RFI-024, Phase 1B, ZNT-2026-0042, emails, filenames | Pass | `interactions.spec.ts` L08, J8 (`مخطط-التنسيق-01.pdf`, `RFI-024`, `Phase 1B`), dashboard tests (`ZNT-2026-0042`) |
| Explorer label in Arabic sits on the same geometry, text reads dot → number → name right-to-left | Pass | `docs/qa/after/filmstrips/explorer-ar-*.png` |
| Track progress grows from the inline start (right in Arabic); "02 / 06" reads correctly | Pass | `docs/qa/after/filmstrips/track-ar-1440.png` |
| Gallery: "next" follows reading direction (ArrowLeft in Arabic), Home/End, Escape, focus restore | Pass (private review build fixture) | `tests/review/gallery.spec.ts` |
| Long Arabic validation messages and filenames wrap without clipping | Pass | `forms.spec.ts` L17, text-spacing test, screenshot `quote-ar-390-errors.png` |

## Keyboard and focus

| Journey | Result | Evidence |
| --- | --- | --- |
| Skip link first, moves to main content | Pass | forced-colours test, a11y review |
| Desktop services disclosure by keyboard | Pass | `interactions.spec.ts` |
| Mobile menu: open with Enter, focus stays in the drawer, Escape closes, focus returns to the toggle, page scroll lock released; touch follow-link closes the drawer | Pass (EN, AR) | journey J3 |
| Explorer: Enter and Space select; single pressed state after rapid input | Pass (EN, AR) | journey J4 |
| Track stations are real links; anchor entry lands below the sticky header and highlights the right stage | Pass (EN, AR) | journey J5, `interactions.spec.ts` M08 |
| Forms: error summary receives focus and links to fields; result receives focus; Send works after corrections | Pass (EN, AR) | `forms.spec.ts`, BUG-02, A11Y-03 |
| Scrollable issue register reachable by keyboard | Pass (fixed) | A11Y-02, `responsive.spec.ts` |
| Focus visible on navy, white and orange surfaces; in forced colours | Pass (forced colours fixed) | A11Y-01 |
| Dashboard: keyboard-only key screens, dialogs, menu Escape/focus return | Pass | `tests/admin/05-ux.spec.ts` |

## Screen-reader structure (automated and code review; no live screen reader)

- Landmarks (header/nav/main/footer), one H1 per page, no skipped heading levels on any crawled page (`docs/qa/after/crawl.json`).
- Accessible names: axe "serious/critical" = 0 on 28 public page/locale combinations and on the dashboard's key screens in both languages (`a11y.spec.ts`, `05-ux.spec.ts`).
- Decorative SVGs are `aria-hidden`; the on-diagram explorer label duplicates the announced description and is hidden from assistive technology.
- Live regions: form status and explorer description are polite; scroll-driven Track changes are not announced; toasts are not repeated.
- Reading order in Arabic = DOM order (no visual reordering with `order`/`row-reverse`).

## Responsive and display adaptations

| Check | Result | Evidence |
| --- | --- | --- |
| Widths 320, 360, 390, 430, 768, 1024, 1280, 1440, 1920 × 7 templates (home, service, infrastructure, how we work, quote, privacy, 404) × EN/AR: no horizontal page scrolling | Pass (126 page loads) | `responsive.spec.ts` |
| 200 % zoom (640 × 450 CSS px) and 400 % zoom (320 × 256): content reflows, sticky header ≤ 35 % of the height, H1 visible | Pass | `responsive.spec.ts` |
| WCAG 1.4.12 text spacing (line 1.5, letters 0.12 em, words 0.16 em, paragraphs 2 em) on home, service, quote, how we work: no clipped text, no page scroll | Pass after A11Y-02 | `responsive.spec.ts` |
| Phone landscape 844 × 390: header ≤ 30 % of the height, every drawer link reachable, focused form field not under the sticky header | Pass | `responsive.spec.ts` |
| Forced colours (Chromium emulation): skip link and fields keep visible focus and borders | Pass after A11Y-01 | `responsive.spec.ts`, `docs/qa/after/screenshots/forced-colors-quote-{en,ar}-1280.png` |
| Reduced motion at load and switched on mid-session | Pass | `interactions.spec.ts`, `responsive.spec.ts` |
| No JavaScript: reading, navigation (footer links work without the menu script), Track stages, honest form notice, server-rendered 404 | Pass (EN, AR) | journey J10 |
| Touch targets: header controls, menu toggle, language switch, Track stations ≥ 44 px | Pass (CSS review; 320 px header test) | `interactions.spec.ts`, `components.css` |
| Cross-browser: home EN/AR direction and overflow, language switch, quote test submission | Pass in Firefox, WebKit, mobile WebKit | `cross-browser.spec.ts` |

Visual review set (after): `docs/qa/after/screenshots/` — includes an Arabic form-error state at 390 px and the long synthetic project title from the private review fixture (`project-en-1440-review-fixture.png`), as required by 03 §10.

## Not tested (named gaps)

- NVDA + Firefox/Chrome, JAWS, VoiceOver (macOS/iOS) and TalkBack: not available in this environment. Recommended before launch: one pass of the quote journey and the explorer in each language with NVDA and VoiceOver iOS.
- Physical devices (iOS Safari, Android Chrome), on-screen keyboards, real browser zoom and OS-level text scaling: emulated only.
- Windows High Contrast themes other than Chromium's forced-colours emulation.
- Professional Arabic language review (OD-13) and owner copy review (OD-12).
