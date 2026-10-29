# Zentrac bilingual website build specification

Version 1.0 · 27 October 2026 · Antigravity implementation brief

**Outcome:** A distinctive, modern engineering website in complete English and Arabic, grounded in Zentrac's supplied materials, with sophisticated purposeful animation and fully engineered LTR/RTL behavior.

**Companion:** `01_ZENTRAC_WEBSITE_MASTER_PLAN.md` describes execution phases, skill blueprints, tools, and delivery gates. This specification is the implementation contract. All timings, component dimensions, architecture choices, and UI copy identified as proposed are design recommendations, not claims extracted from the original files.

## 1. Product brief and priorities

Zentrac's visitors are developers, owners, contractors, and engineering consultants looking for BIM modelling, coordination, shop drawings, design review, quantities, and as-built support. Within the first screen, a visitor should understand the service, recognize infrastructure expertise, and know how to enquire. The site should make technical work understandable without oversimplifying its scope.

Priority order: accurate content; equal Arabic/English usability; brand quality; clear conversion; accessibility; responsive speed; memorable animation. These priorities work together. An impressive animation that hides the service or breaks Arabic is a failed implementation.

Build all page families described below. Do not replace the requested website with a single scrolling landing page. Do not add ecommerce, accounts, client dashboards, payment collection, an AI chatbot, or a heavy CMS unless separately requested.

### The intended visual idea

**Engineering clarity made visible.** Technical layers align, utility paths become readable, and drawings emerge from coordinated geometry. Use the profile's positioning, “Engineered to Be Built.”, as a brand line. Use the plain service descriptor prominently so visitors do not have to interpret a slogan to understand the business.

The website must feel designed for Zentrac: dark technical scenes, light editorial sections, orange coordination paths, square or subtly chamfered geometry, strong bilingual typography, and real engineering evidence when permitted. Avoid generic software dashboards, unrelated neon blobs, stock skyscraper slideshows, and endless identical cards.

## 2. Source files and authority

### Exact files supplied

| ID | File | What it supplies | Required inspection |
| --- | --- | --- | --- |
| F1 | `Zentrac_Media_Brief_AR.pdf` | Company facts, founder history, project boundaries, disclosure restrictions, corrections | All 15 pages, including Arabic notes and project cards |
| F2 | `Zentrac Company Profile.pdf` | Brand, logo appearance, typography, marketing narrative, service/process language, example imagery | All 17 pages; visuals and text |
| F3 | `Zentrac_Media_Register.xlsx` | Stable project/asset IDs, source references, unresolved fields, candidate metrics | All five worksheets: Projects, Questionnaire, Assets, Metrics, Decisions |
| F4 | `Zentrac Website — Simple Copy v2 (formal).docx` | Website information architecture and English copy | Paragraphs, tables, bracketed placeholders |
| F5 | `Zentrac Website Page Mockups (1).pdf.pdf` | Fourteen page-layout examples and content relationships | Render every page; most content is rasterized |

Discover paths recursively within the actual workspace. The original filenames may contain Unicode punctuation and spaces. Preserve the originals. The source documents mention other presentations, CVs, drawings, and `03_Project_Images/...` paths: these are **references**, not proof those files are available. Inventory the actual directory before assuming an asset exists.

### Resolve conflicts by subject

- F1 and F3 control factual qualifications, historical attribution, unresolved metrics, and publication status.
- F4 controls the intended site structure and serves as the base English copy, subject to those qualifications.
- F2 controls the visual brand and provides editorial direction, but its polished presentation does not remove factual restrictions.
- F5 is a structural reference to modernize, not a pixel-perfect design requirement and not permission to publish every item shown.
- A later explicit owner clarification can update an identified field. Record the clarification and scope; do not turn one approval into approval of all assets or claims.
- External inspiration sites supply design ideas only. Their facts, images, client logos, performance metrics, code, and brand identities must not enter Zentrac's site.

### Important conflicts already identified

| Item | Source issue | Build decision |
| --- | --- | --- |
| “8 years” | Profile/copy can read as company age; company founded in 2026 | Prefer “Founder experience since 2018”; never “Zentrac has operated for eight years” |
| “13 projects” | Register describes 13 historical project groups; F4 brackets the count | No corporate achievement counter; retain register count privately |
| “3 countries” | Refers to historical founder/practice assignments | Qualify as founder experience if used; not office locations or current client count |
| “11 networks” | Includes roads, landscape/grading, and canals | Use 11 infrastructure categories as a service taxonomy; do not imply 11 utility networks on every job |
| Our Clients | Named owners/developers are project parties, not established direct customers | Public audience section describes client types; no invented logo wall |
| Specialist services | F4/F2 say specialist partners; F1/F3 say operational arrangements remain unconfirmed | Build conditional module; do not publish an established partnership claim until confirmed |
| NDA | F4 promises all files are covered; agreement/process not supplied | Use neutral confidential-enquiry wording; do not assert an automatically executed NDA |
| Qiddiya imagery | Package association may overlap Park Ride/Welcome Center | Keep package/image mapping under review; no automatic 4B/4C/4D attribution |
| Downloadable profile | Existing PDF contains unresolved metrics, projects, and contact placeholders | Build download capability, but only expose a reviewed public PDF |
| Quote turnaround | `[XX] working days` is unresolved | Omit a numeric response promise |
| Contacts | Email, phone, WhatsApp and LinkedIn not confirmed | Config-driven; omit unknown links instead of inventing them |

## 3. Brand facts and copy boundaries

### Source-backed facts

| Field | Working value | Source |
| --- | --- | --- |
| Display name | Zentrac / زينتراك | F1 p1; F2 |
| Arabic company name | زينتراك للاستشارات و الخدمات الهندسية المتكاملة | F1 p1; F3 Decisions D01 |
| Founding year | 2026 | F1 p1; F3 Questionnaire row 8 |
| Founder | Mark Mofreh / مارك مفرح | F1 pp2,5 |
| Founder background | Civil engineer; roads/infrastructure career began in 2018; previous individual practice BIM Experts | F1 pp2,5; F4 About |
| Office address | 6th Floor, 1 Roxy Square, Heliopolis, Cairo, Egypt | F1 p2; F3 Questionnaire row 9 |
| Arabic address | الدور السادس، 1 ميدان روكسي، مصر الجديدة، القاهرة، مصر | Translation of the supplied address |
| Historical countries | Saudi Arabia, Egypt, Rwanda | F1 project cards; F3 Projects |
| Brand line | Engineered to Be Built. | F2 |

The long English legal name is written `Zentrac for integreted Engineering Consultancies and Services` in F1. Preserve that spelling in the internal source record; do not silently “correct” an unverified legal name. Use the short brand name publicly until the legal rendering is confirmed. Do not publish incorporation numbers, professional licensing claims, or detailed registration dates that have not been supplied.

Do not create claims such as “zero rework,” “clash-free,” “ISO-certified,” guaranteed consultant approval, a digital-twin capability, percentage savings, 30+ projects, 40+ engineers, or 1M+ square metres. Do not use project-wide area, stadium capacity, or development value as Zentrac's delivery scope. Submitted drawings are not automatically approved drawings.

### Tone and proposed hero copy

Use clear, professional English and Modern Standard Arabic. Avoid marketing superlatives and dense noun stacks. Keep engineering acronyms where useful and explain them on first substantive use.

| Element | English | Arabic |
| --- | --- | --- |
| Eyebrow | Engineering and BIM Consultancy | استشارات هندسية ونمذجة معلومات البناء |
| H1 | Engineered to Be Built. | هندسة قابلة للتنفيذ. |
| Supporting copy | We provide BIM modelling, coordination and shop drawings for infrastructure, landscape and building projects. | نقدم خدمات نمذجة معلومات البناء والتنسيق وإعداد المخططات التنفيذية لمشروعات البنية التحتية وتنسيق المواقع والمباني. |
| Primary CTA | Request a Quote | اطلب عرض سعر |
| Secondary CTA | Explore Our Services | استكشف خدماتنا |
| Hero visual caption | Illustrative coordination model | نموذج توضيحي للتنسيق |

The Arabic brand line is a proposed transcreation, not an existing verified slogan. Keep it editable in the content dictionary. The supporting copy is based on F4. Do not hardcode any of this into an image.

## 4. Inspiration research and adaptation

The five references were inspected on 27 October 2026 through public page retrieval and browser views. Observations below concern the views inspected, not exhaustive audits of every page. Exact animation timings and underlying libraries were not measured. All Zentrac motion timings later in this document are original proposed specifications.

| Reference | Observed design cues | Adapt for Zentrac | Do not import |
| --- | --- | --- | --- |
| [Imtyaze](https://www.imtyaze.com/) | Arabic RTL hero; deep blue grid; oversized brand symbol; clear paired CTAs; product/process sections | Technical grid discipline, strong bilingual hero balance, easily understood explanatory scenes | Education imagery, plus symbol, cyan identity, demo data |
| [ByteForce](https://www.byteforceinc.com/) | Floating light header, orange hero field, isometric illustration, changing typed heading, service selectors | Large-scale composition and interactive service exploration | Repeated typing for essential text, agency claims, logo wall, orange-purple palette |
| [B Systems](https://www.bsystemseg.com/) | Compact floating navigation, large headline, layered system illustration, numbered methodology and technical dial controls | Layered infrastructure concept, process story, purposeful network controls | Purple/pink glow theme, software terminology, decorative status claims |
| [Mindoo](https://mindooco.com/en) | Compact pill navigation, language control, large positioning headline, system graph, modular numbered content | Editorial hierarchy, disciplined numbered systems, language visibility | Graph values, business-management copy, lavender identity or low-contrast text treatments |
| [Elshrouk](https://elshroukvet.com/ar) | Strong Arabic typography, restrained orange accent, real photography, sector sections, workflow, localized navigation | Native Arabic rhythm, clear sector navigation, photography restraint, purposeful CTAs | Poultry identity, business numbers, farm content, supplied-photo rights assumptions |

Take the design principles, then make them belong to engineering. The target is not a collage of five websites. Preserve a single palette, type system, spacing rhythm, icon family, and motion grammar.

## 5. Visual system

### 5.1 Measured source tokens

The following values were extracted from vector colors and font metadata in F2. They are source measurements, not guesses from a screenshot:

| Token | Value | Use |
| --- | --- | --- |
| `brand-navy` | `#0B1624` | Hero, dark sections, primary ink |
| `brand-orange` | `#FA5211` | Accent paths, primary CTA fill, active indicators |
| `brand-paper` | `#F8F9FA` | Light sections |
| `brand-line` | `#E5E7EB` | Light dividers |
| English brand family | Saira | Regular, Medium, SemiBold observed |

Proposed supporting tokens: `surface-white #FFFFFF`, `surface-dark #142337`, `text-muted #526171`, `text-on-dark #E8EEF4`, `text-muted-on-dark #B4C0CE`, `orange-text #C23A08`. Validate combinations in actual rendered states.

Contrast detail: the source orange against white is approximately 3.34:1; orange against the source navy is approximately 5.44:1. Therefore use **navy text on orange buttons**. For normal-size orange-colored links on a light background, use the darker semantic orange `#C23A08` (approximately 5.38:1 against white), or navy text plus an orange underline. These are computed color ratios, not a completed accessibility audit.

Use approximately 55–65% light surfaces, 25–35% deep navy, and 5–10% orange across a representative page. This is a composition guide, not a rigid pixel calculation. Avoid full-page orange backgrounds. Dark sections should provide emphasis and rest, not obscure long body text.

### 5.2 Logo and geometry

- Use the authentic supplied logo. Inspect whether a clean standalone vector or image exists; extract an embedded original where possible. Preserve aspect ratio and its diagonal cuts.
- Do not ask an image model to redraw the logo. Do not typeset a near imitation. If only a composite PDF image is available, extract a clean crop for local review and flag the need for the original master.
- Provide appropriate light/dark variants only if faithful to the original. Never globally invert a logo with CSS.
- Keep approximately one symbol-height of clear space where practical. Proposed header wordmark width: 132–164px desktop, 112–132px mobile, adjusted for actual artwork.
- Do not mirror the mark, wordmark, photography, drawing geometry, coordinate axes, or technical symbols in Arabic.
- Borrow the logo's diagonal direction for a few image masks, section markers, and CTA accents. Preserve controls' full rectangular hit areas and visible focus outlines.
- Use 4–8px corner radius for standard controls and panels; reserve 12–16px for larger image frames. Avoid pill-shaped everything.
- Technical illustrations must be original illustrative SVG/CSS geometry or approved project imagery. Label conceptual visuals as illustrative where confusion with a real project is possible.

### 5.3 Typography

| Role | English | Arabic |
| --- | --- | --- |
| Main family | Saira | IBM Plex Sans Arabic, proposed companion |
| Body weight | 400 | 400 |
| UI/emphasis | 500–600 | 500–600 |
| Display weight | 600 | 600–700 if available |
| H1 desktop | 64–88px, line-height 1.06–1.15 | 54–72px, line-height 1.25–1.4 |
| H1 mobile | 38–46px, line-height 1.12–1.2 | 34–42px, line-height 1.3–1.45 |
| H2 desktop | 40–56px | 36–48px |
| Body | 17–18px, line-height 1.65 | 18–19px, line-height 1.85 |
| Small text | Usually 14px minimum | Usually 15px minimum |

Use fluid `clamp()` scales and verify actual copy. Do not force identical font sizes or line counts across scripts. Load properly licensed WOFF2 font files from the official source, preserve license notices, and self-host where supported. Do not extract embedded subset fonts from the PDF for web reuse.

Arabic: no letter-spacing, uppercase transform, artificial kashida, faux condensed text, or character-by-character splitting. Avoid full justification. Preserve diacritics and glyph ascenders/descenders; do not apply a tight clipping mask around Arabic lines. English headings may have slight negative tracking, but test Saira legibility. Keep body lines approximately 55–75 Latin characters; use actual Arabic line length and reading comfort rather than forcing that character count.

### 5.4 Layout and spacing

- Max page content width: 1280px; wide visual scenes may reach 1440px. Reading width: 680–760px.
- Desktop content grid: 12 columns with 24–32px gaps; tablet 8 columns; mobile 4 columns or one content column.
- Page gutters: 20px at narrow mobile, 24–32px tablet, 40–64px desktop. At 320px, 16px is permitted.
- Section padding: 96–128px desktop, 64–80px tablet, 48–64px mobile. Inner-page heroes may be shorter.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 80, 96, 128px. Allow optical adjustment, especially Arabic baselines.
- Media ratios: hero approximately 5:4 or 4:3; project covers 16:10; drawing galleries keep the source aspect ratio with containment.
- Breakpoints are content-driven; start with 640, 768, 1024, 1280, 1536px. Collapse navigation when translated text no longer fits, even before an arbitrary breakpoint.
- Use `min-block-size`, not fixed heights around copy. Use `svh` where viewport-height behavior is necessary; let mobile content grow.
- No accidental horizontal page scrolling. A clearly labelled technical table may scroll within its own container.
- Do not place essential content in hover-only overlays. Keep titles, attribution, and CTA meaning visible.

## 6. English, Arabic, RTL and LTR requirements

This section applies to every page and every UI state, not only the homepage.

### 6.1 Locale architecture

1. Support `en` and `ar` using locale-prefixed routes. Use one registry of locale-neutral page/content IDs and stable slugs. Keeping English slugs under `/ar` is acceptable and is the default for maintainability.
2. `/` redirects to `/en`. An explicit locale URL always wins over browser language or stored preference. Do not repeatedly redirect visitors based on geography or `Accept-Language`.
3. Render `<html lang="en" dir="ltr">` or `<html lang="ar" dir="rtl">` on the server before first paint. Do not flip direction only after hydration.
4. Select the correct font and dictionary at the same time as the route. Avoid a flash of English copy in Arabic layout.
5. Language links display `العربية` on English pages and `English` on Arabic pages. No flags as language symbols.
6. Switching locale preserves the equivalent page, content ID, valid service/filter query parameters, and stable section anchor. It must not always return to the homepage.
7. Missing translations fail validation. Do not silently show English body copy inside an Arabic page. An unpublished equivalent record should remain unpublished in both locales for the initial launch.
8. Translate navigation, button labels, headings, captions, alt text, breadcrumbs, validation messages, upload notices, loading/empty states, 404/error pages, consent copy, metadata, and screen-reader labels.
9. Store complete messages, not fragments assembled by concatenation. Use parameterized messages and locale-aware plural forms for result counts; Arabic needs more than singular/plural.
10. Do not use browser auto-translation as the site's Arabic implementation.

### 6.2 Logical layout and DOM order

Prefer `margin-inline`, `padding-inline`, `padding-block`, `inset-inline-start`, `inset-inline-end`, `border-inline-start`, `text-align: start`, and `text-align: end`. Use direction-aware utility equivalents when the installed CSS framework supports them.

Do not globally apply `row-reverse` on top of `dir="rtl"`; that can double-reverse flex layouts. Define one meaningful DOM reading order and let direction-aware layout place it. The primary message precedes supplementary illustration in DOM order in both languages. Keep focus order consistent with reading order; no positive `tabindex` to repair a broken layout.

| Element | English | Arabic |
| --- | --- | --- |
| Header brand | Inline start, left | Inline start, right |
| Header actions | Inline end, right | Inline end, left |
| Hero text | Start column | Start column on the right |
| Hero visual | End column | End column on the left; artwork itself unchanged |
| Reading text | Left/start aligned | Right/start aligned |
| Breadcrumb progression | Left to right | Right to left |
| Timeline progression | Left to right on horizontal desktop | Right to left on horizontal desktop |
| Mobile timeline | Top to bottom | Top to bottom; markers on inline start |
| Form label and help text | Start aligned | Start aligned in Arabic |
| Next/forward arrow | Right | Left |
| Back arrow | Left | Right |
| Modal close control | Inline end | Inline end |
| Technical diagram | Original coordinate space | Original coordinate space; translated surrounding labels |
| Numbers/email/file names | Isolated LTR where needed | Isolated LTR where needed |

### 6.3 Mixed text and bidirectional isolation

Direction belongs in HTML semantics, not just CSS. Use `<bdi>` for unknown inline content and `<span dir="ltr">` for known Latin identifiers when appropriate. Never manually reverse strings or inject hidden bidi control characters into stored content.

Examples the UI must handle correctly:

```html
<!-- Arabic sentence with a Latin technical term -->
<p dir="rtl">
  نمذجة وفق مستوى التطوير <bdi dir="ltr">LOD 400</bdi>
</p>

<!-- A fictional fixture for testing, never a public company contact -->
<a href="mailto:test@example.invalid" dir="ltr">test@example.invalid</a>

<!-- Stable machine reference; localize its label, not the identifier -->
<p dir="rtl">رقم الطلب: <bdi dir="ltr">ZNT-2026-0042</bdi></p>
```

Test parentheses, slashes, hyphens, plus signs, units, punctuation, and line wrapping around `BIM`, `BEP`, `LOD 400`, `LV / MV`, `RFI-024`, `Zone 4`, `Phase 1B`, `25 km`, `12.5 m²`, email addresses, URLs, and filenames. The examples do not authorize public quantitative claims.

### 6.4 Inputs and numeric formatting

- Names, company names, project descriptions, and free text accept Arabic and Latin characters; use `dir="auto"` where appropriate. Do not restrict names to ASCII or use an English-only name regex.
- Email, URL, phone, and reference-ID values use LTR direction even within an RTL form; labels/errors remain Arabic. Use suitable `type`, `inputmode`, and autocomplete tokens.
- Phone `+` stays at the beginning. Do not reverse digits. Permit international formatting; normalize deliberately and validate on the server.
- Normalize Arabic-Indic `٠١٢٣٤٥٦٧٨٩` and Eastern Arabic `۰۱۲۳۴۵۶۷۸۹` input digits for numeric/phone processing, without changing the user's names or narrative text.
- Proposed display convention: Western digits `0–9` in both locales for engineering quantities, dates, IDs, and counts; format Arabic UI with an explicit Latin numbering system where required. This is a design decision, not a claim that Arabic requires Western digits.
- Use `Intl.NumberFormat` and locale-aware messages; do not format numbers by string replacement. Keep units outside the numeric value and isolate as needed.
- Dates: store ISO data; display an unambiguous localized Gregorian date. Avoid ambiguous `10/11/26`. Do not convert to Hijri unless separately requested.
- Country and service selections submit stable codes/IDs, not translated visible labels. Render labels in the active locale.
- Keep native text selection, copy/paste, browser autofill, password-manager behavior for contact fields, and mobile keyboards working.
- A locale switch during a form must not silently erase text. Preserve non-file draft state in memory across the switch. Do not persist sensitive descriptions to local storage by default. If selected files cannot survive, warn in the current language before navigation and allow cancellation/reselection.

### 6.5 Directional icons and movement

Mirror only semantic directional icons: next/back arrows, breadcrumb chevrons, progression arrows, and horizontal step flow. Do not mirror checkmarks, clocks, search icons, phone icons, download icons, play controls, logos, documents, maps, real engineering drawings, or text inside images.

For slide-in movement from the reading start, compute a direction multiplier. For a progress line, use the locale's reading progression. A drawing's pipe directions, north arrow, coordinates, or actual network geometry must never flip because of locale. Never put `scaleX(-1)` on a parent containing text or media just to obtain RTL.

Horizontal tab keyboard movement follows visual direction; Home/End go to the first/last semantic item. Vertical lists keep Up/Down behavior. Avoid depending on raw RTL `scrollLeft` assumptions; use measured geometry or a proven abstraction and verify across browsers.

### 6.6 Translation glossary

| English | Arabic preferred term |
| --- | --- |
| About Us | من نحن |
| Services | خدماتنا |
| Infrastructure | البنية التحتية |
| How We Work | كيف نعمل |
| Projects | المشروعات |
| Blog / Insights | المعرفة |
| Our Clients / Who We Work With | الجهات التي نخدمها |
| Partners | الشراكات |
| Careers | فرص العمل |
| Privacy Policy | سياسة الخصوصية |
| BIM modelling | نمذجة معلومات البناء |
| Coordination | التنسيق بين التخصصات |
| Clash detection | كشف التعارضات |
| Shop drawings | المخططات التنفيذية |
| Combined services drawings | مخططات تنسيق الخدمات |
| Design review | مراجعة التصميم |
| Quantity take-off | حصر الكميات |
| As-built models | نماذج الحالة المنفذة |
| Landscape | تنسيق المواقع |
| Grading | تسوية المناسيب |
| Site support | الدعم الفني للموقع |
| BIM Execution Plan / BEP | خطة تنفيذ نمذجة معلومات البناء (BEP) |
| Request for Information / RFI | طلب استيضاح فني (RFI) |
| Level of Development / LOD | مستوى التطوير (LOD) |
| Selected Founder and BIM Experts Experience | خبرات مختارة للمؤسس ومكتبه السابق BIM Experts |
| Download Company Profile | تحميل الملف التعريفي للشركة |
| View Project | عرض المشروع |
| View All Projects | عرض جميع المشروعات |
| Send Request | إرسال الطلب |
| Sending… | جارٍ الإرسال… |
| Try Again | حاول مرة أخرى |
| Clear Filters | مسح عوامل التصفية |
| No matching projects | لا توجد مشروعات مطابقة |
| Back to Services | العودة إلى الخدمات |

Treat this glossary as the default editorial standard, with a final Arabic engineering-language review. Do not translate proper names inconsistently between cards and detail pages. Keep the English name in a bidi-isolated span when transliteration is uncertain.

## 7. Route and navigation architecture

`{locale}` below means both `en` and `ar`. A page family marked conditional still requires a complete template and a working private local preview; it must not leak an unapproved record into public navigation or output.

| Route | Purpose | Template/content behavior |
| --- | --- | --- |
| `/{locale}` | Homepage | Full signature experience |
| `/{locale}/about` | Company and founder | Distinguish 2026 company from experience since 2018 |
| `/{locale}/services` | Service overview | Five services, deliverables, enquiry links |
| `/{locale}/services/bim-modelling` | Service detail | Model scope and deliverables |
| `/{locale}/services/coordination` | Service detail | Federation, clash reporting, issue follow-up |
| `/{locale}/services/shop-drawings` | Service detail | Drawings from coordinated models |
| `/{locale}/services/design-review` | Service detail | Incoming design review and RFIs |
| `/{locale}/services/quantities-as-built` | Service detail | Take-offs, site support, as-built scope |
| `/{locale}/infrastructure` | Network expertise | All 11 categories and interactive illustration |
| `/{locale}/how-we-work` | Zentrac Track | Six stages and engagement options |
| `/{locale}/clients` | Audiences | Developers, contractors, consultants; not a logo wall |
| `/{locale}/projects` | Experience index | Approved records; thoughtful empty fallback otherwise |
| `/{locale}/projects/{slug}` | Case study | Source-linked scope and attribution; approved records only publicly |
| `/{locale}/blog` | Knowledge index | Reviewed published articles only |
| `/{locale}/blog/{slug}` | Article | Complete bilingual article template |
| `/{locale}/request-a-quote` | Conversion | Quote form and confirmed office information |
| `/{locale}/partners` | Partner enquiry | Capabilities-oriented invitation; no invented partners |
| `/{locale}/careers` | Project-based talent enquiry | CV/portfolio form; no invented vacancies |
| `/{locale}/privacy` | Privacy | Reviewed localized policy or private template |
| Localized not-found/error states | Recovery | Real HTTP status and useful navigation |

Desktop primary navigation: About, Services, Infrastructure, How We Work, Projects, Insights; language switch; Request a Quote. A single Services disclosure may expose the five detail pages. Footer adds Clients, Partners, Careers, and Privacy. Home remains reachable through the logo. If Arabic navigation becomes crowded, collapse earlier; do not shrink it into illegibility.

Header height target: 80px desktop, 64–72px mobile. Start with a transparent dark-hero variant and transition to an opaque navy header after leaving the hero; retain sufficient contrast in both states. Do not change geometry enough to create a layout shift. Reserve top space or scroll margins so anchors and focused elements are not hidden.

Mobile menu: labelled toggle; `aria-expanded`; accessible dialog/drawer; Escape and close button; inert background; focus trap while open; focus returns to the trigger; body scroll restored after closing. Internal route selection closes it. Place language and quote actions prominently. Do not require hover to open any menu.

Footer: logo, short descriptor, grouped links, verified address, real contact links only, profile download only when available, privacy link, and current copyright year. A public email/phone/social placeholder is unacceptable.

## 8. Homepage composition

### H01 — Signature hero

Use a navy canvas, restrained technical grid, large headline, and original isometric infrastructure scene. At desktop, approximately 45% text and 55% visual. The copy stays readable from first paint; animation is an enhancement. In Arabic, text moves to the right and illustration to the left without flipping the illustration itself.

Show the eyebrow, H1, supporting paragraph, primary/secondary CTA, and three small text descriptors: Infrastructure / Landscape / Buildings, translated to البنية التحتية / تنسيق المواقع / المباني. Avoid unsupported numeric proof points in this area.

The scene contains a ground plane, road corridor, a few neutral masses, utility paths, and an abstract drawing plane. The model is explicitly illustrative. It should convey review → model → coordinate → drawings through finite motion, not pretend to be a live BIM viewer. Desktop scene can gently react to pointer position within ±3 degrees; touch and reduced-motion variants stay static. Never obscure the CTA with the scene.

### H02 — The design-to-site problem

Light background. A large editorial statement on one side, three numbered problems on the other: conflicting information, coordination issues, and drawings returned with comments. Use the profile's buildability narrative without promising a measurable reduction. Proposed heading: “Resolve coordination issues before they reach site.” / “عالج مشكلات التنسيق قبل وصولها إلى الموقع.”

Use a thin orange rule that completes as the section enters. Avoid three oversized icon cards when simple numbered text is clearer. Body text remains visible even if the enhancement script fails.

### H03 — Service preview

Five numbered service rows, not five repeated tall cards. Each row includes name, one-sentence scope, deliverable cue, and detail-page link. Desktop hover/focus may update one supporting illustration; mobile expands content naturally or uses explicit selection. An interactive heading must be a button or link with a clear action, not a clickable `div`.

Never make the only route to the service depend on hover. The service name remains visible while another item is active. Use `aria-controls` for actual disclosure controls and a dedicated link for navigation.

### H04 — Why Zentrac

Four concise principles from the source material: review before modelling; coordinate before issuing; infrastructure focus; work to the agreed BEP/templates. Use a two-by-two editorial layout with small technical symbols. Avoid claiming certification or guaranteed error-free output. The adjacent visual can show an illustrative issue register with no fabricated project performance numbers.

### H05 — Infrastructure explorer

Dark feature section with the heading “Eleven infrastructure categories. One coordinated approach.” / “أحد عشر مجالًا للبنية التحتية. نهج تنسيق متكامل.” The wording is proposed to accommodate roads, landscape, and canals in the source taxonomy.

Use a schematic on one side and 11 clearly labelled selectors on the other. Selecting a category highlights its schematic element and changes a short description. Default to a combined overview with a separate “Show all” / “عرض الكل” control. Use native buttons with selected state; a simplified mobile list must expose all categories without hover.

The diagram is conceptual, not dimensionally correct construction guidance. Use orange for the selected path, muted neutral lines for context, and labels/line styles in addition to color. Do not fabricate engineering standards for clearances or installation depths.

### H06 — Selected experience

If approved records exist, show three featured case-study cards with exact scope and visible founder/BIM Experts attribution. Prefer varied but disciplined image proportions: one wide feature plus two supporting items. Each image must belong to its record.

If no project records are cleared, omit named cards from the public homepage. Substitute a polished “What a coordinated package includes” section using original generic illustrations of a model, a drawing, and an issue register. This is a capability illustration, not a fictional case study. The full named cards still exist in the private local review build.

### H07 — The Zentrac Track

Six-stage process: Review, Model, Coordinate, Drawings, Quantities, Site Support. Desktop uses a sticky visual and normal-flow stage text; the orange line progresses with scroll. Stages are always readable and individually linkable. Mobile uses a vertical timeline with compact illustrations and one-time reveals.

Keep “Join at the stage you need” / “ابدأ من المرحلة التي تحتاج إليها” near the process. The engagement model is flexible; do not imply every client must buy all six stages.

### H08 — Who we work with

Three audience panels: developers/owners, contractors, engineering consultants. Explain the relevant deliverables and link to Clients or preselect an enquiry category. This replaces unsupported direct-client logo claims. Do not add testimonials until a real, approved statement exists.

### H09 — Insights

Show the three newest actually published articles, ordered by editorial publication date. If there are none, remove this section from the homepage; the knowledge index may show a concise useful empty state. Never manufacture articles, author credentials, publication dates, or “read time” for unwritten content.

### H10 — Contact band

Proposed heading: “Have a project?” / “هل لديك مشروع؟”

Proposed copy: “Tell us about your scope and the support you need.” / “أخبرنا بنطاق مشروعك والدعم الذي تحتاج إليه.” Primary quote CTA; WhatsApp only with a verified number. Do not say all documents are covered by an NDA unless the actual process and agreement support that statement.

Use a strong orange accent and navy text; a full orange band is acceptable as the page's main accent area. On quote, careers, and privacy pages, use a shorter contextual closing section instead of repeating an enquiry banner that distracts from the current task.

## 9. Inner-page specifications

### 9.1 About

Order: short company introduction → founder biography → clear chronology → working principles → contact CTA. State company establishment in 2026 separately from founder experience beginning in 2018. Explain the former individual practice BIM Experts and defined outsourced packages without implying they were all corporate Zentrac contracts.

If no confirmed portrait is available, use a high-quality typographic panel with the founder's name and an original abstract engineering motif. Do not use the profile's generic people image as a real founder/team photo. Do not invent team members or use a historical “PRESENT” job label as current employment.

Values: Quality, Clarity, Confidentiality, Honesty. Phrase confidentiality as a working principle without inventing legal terms. Avoid a metric counter strip based on unresolved numbers.

### 9.2 Services index and detail pages

Services index: concise hero → five detailed service rows → flexible scope band → conditional specialist-service information → quote CTA. Each service detail uses: breadcrumb, H1, short summary, what is included, inputs needed, deliverables, process, related approved experience, and preselected quote CTA.

Input/output examples below are implementation/editorial recommendations based on the supplied service descriptions; contractual scope remains project-specific.

| Service / slug | Source-backed scope | Inputs to discuss | Deliverables to show |
| --- | --- | --- | --- |
| BIM Modelling / `bim-modelling` | Infrastructure, landscape, buildings, agreed BEP/LOD; F4 mentions up to LOD 400 | Design drawings, BEP, coordinates, model requirements, scope boundaries | Agreed discipline models; RFI register |
| Coordination / `coordination` | Federated models, clash detection, tracked follow-up | Discipline models, coordination rules, issue priorities, responsibility matrix | Coordinated/federated model; clash report; RFI register |
| Shop Drawings / `shop-drawings` | Shop and combined services drawings from coordinated models | Model, title blocks, drawing list, review requirements | Shop drawings; combined services drawings; relevant clash report |
| Design Review / `design-review` | Identify missing/conflicting design information before modelling | Design package, specifications, reference information | Review report; RFI register |
| Quantities and As-built / `quantities-as-built` | Model-based take-offs, construction support, as-built models | Measurement rules, agreed model scope, verified site changes | Quantity take-off; updated/as-built models within agreed scope |

“Ready for consultant review” does not mean “approved.” An as-built model must be based on supplied/verified site information; do not imply a survey has occurred merely because a model is updated. LOD 400 is not a blanket guarantee of accuracy, fabrication suitability, or every element's detail. Describe the agreed scope and intended use.

Every detail page includes the compact sequence Review → Model → Coordinate → Deliver, adapting emphasis to the service. This is a simplified explanatory sequence, not a claim that each purchased scope includes every service.

Related records: BIM Modelling → P05; Coordination → P01; Shop Drawings → P02; Quantities/As-built → P01; Design Review has no confirmed related case. Render only if the record and relevant asset are approved. Missing related content should remove the module without leaving a blank container.

### 9.3 Infrastructure

Hero → interactive explorer → all 11 category descriptions → deliverables/coordination interfaces → approved related projects if available → quote CTA. All category descriptions must remain readable without the interactive diagram.

| Stable ID | English | Arabic |
| --- | --- | --- |
| `water` | Water | المياه |
| `sewerage` | Sewerage | الصرف الصحي |
| `irrigation` | Irrigation | الري |
| `stormwater` | Stormwater | تصريف مياه الأمطار |
| `firefighting` | Firefighting | مكافحة الحريق |
| `lv-mv` | LV / MV Power | كهرباء الجهد المنخفض والمتوسط |
| `street-lighting` | Street Lighting | إنارة الطرق |
| `cctv-telecom` | CCTV and Telecom | المراقبة والاتصالات |
| `roads` | Roads | الطرق |
| `landscape-grading` | Landscape and Grading | تنسيق المواقع وتسوية المناسيب |
| `canals` | Canals | القنوات |

Describe modelling/coordination support without extending design authority to every discipline. Do not present the 11 entries as a list of statutory licenses or independently verified current departments.

### 9.4 How We Work

Use six stages with a visible number, title, short explanation, expected input, and output. Preserve the source distinction between an engineering review and simply producing a model.

| Stage | English / Arabic | Explanation |
| --- | --- | --- |
| 01 | Review / المراجعة | Review supplied drawings and site information; record gaps |
| 02 | Model / النمذجة | Build models to agreed BEP and scope |
| 03 | Coordinate / التنسيق | Run clash checks and track coordination issues |
| 04 | Drawings / المخططات | Extract agreed shop drawings from the model |
| 05 | Quantities / الكميات | Prepare agreed model-based quantities and schedules |
| 06 | Site Support / دعم الموقع | Support queries, updates, and as-built handover |

Engagement options: One package / حزمة محددة; One network / شبكة محددة; Coordination only / التنسيق فقط; Full agreed scope / النطاق المتكامل المتفق عليه. Each links to the quote form with stable preselection. Do not add unverified turnaround times.

### 9.5 Clients and Partners

Clients describes who the service is for, not a fabricated customer roster. Use three substantial audience sections, each with needs, appropriate deliverables, and an enquiry CTA.

Partners invites relevant consultants, contractors, survey firms, and engineering companies to discuss collaboration. Use a partner enquiry type on the common contact form or a small dedicated form. Do not label organizations as existing partners, display their logos, or claim geographic partnerships solely because they appear in historical title blocks.

### 9.6 Project index

Title may be “Selected Experience” / “خبرات مختارة”. Place the exact founder/BIM Experts attribution near the introduction and on every applicable card. Use filters only when enough approved records exist to make them useful: country, service, and sector. No full search engine is necessary for eight records.

Store filters in query parameters using stable IDs. Support reset, browser Back, locale switching, and an informative zero-results state. Preserve focus after filtering; announce the result count politely. A small set should update instantly without a full-page loader. No artificial loading delays.

Cards: cover image or well-designed text treatment; project name; country; assigned package; service tags; attribution; detail link. Never infer a missing completion date or “completed” status.

### 9.7 Project detail

Use: breadcrumb → title and attribution → permitted hero media → compact facts → assigned scope → services/deliverables → permitted technical gallery → relevant service links → project enquiry. Omit unknown values instead of showing `TBC`, `null`, or brackets publicly.

Separate “Project owner/developer” from “Direct appointing party.” Show the latter only when confirmed. Never relabel the owner as the direct client. Avoid template headings such as “The results” when no verified outcomes exist; use “Scope and deliverables.”

Gallery: contain drawings rather than crop away data; provide captions; accessible zoom dialog with labelled controls, Escape, keyboard navigation, focus restoration, and background scroll lock. Arrow direction follows UI navigation, not the drawing's orientation. Do not allow unapproved originals to be fetched by a hidden download URL.

### 9.8 Knowledge index and article

Six source-proposed topics: utility clashes on site; design review; LOD 400; clash reports; rejected shop drawings; RFIs. These are topics, not completed source articles. Implement all six as private draft records if needed to exercise the template. Write and technically review articles before publication; cite primary technical references and avoid inventing a byline.

Index: title, intro, topic filters only if useful, published cards, empty state. Article: breadcrumb, H1, excerpt, confirmed date/byline, optional reading time calculated from actual text, readable body, semantic headings, accessible tables, technical images, references, related services, and contextual CTA. Use real `time` values. Keep Arabic paragraphs RTL and embedded code/identifiers LTR. Do not render untrusted raw HTML from content.

### 9.9 Quote, careers and privacy

Quote and careers behaviors are specified in §13. Careers copy says project-based collaboration with BIM engineers/modellers; no fabricated open job listings. The privacy page has a complete styled template in both languages but must not invent the controller's legal name, retention duration, processors, or user-rights process. A legal-policy draft is not approved operational policy.

## 10. Project and media mapping

### 10.1 Core project records

All eight selected records currently have unresolved disclosure/permission status in F1/F3. Initial public publication state is **withheld**. Preserve the following internally so the finished site is ready for legitimate approval without rebuilding its templates.

| ID | Project | Scope to preserve | Assets in F3 | Important qualification |
| --- | --- | --- | --- | --- |
| P01 | AMAALA Staff Village — Zone 4 | Sewerage, irrigation, firefighting, water, LV; grading and as-built within assigned package | A07–A09 | Not the entire community; 211 is not a verified independent-clash result |
| P02 | SEDRA | Landscape modelling/drawings in 1B/2; utilities modelling/coordination in 3/4 | A01–A06 | Associate each image with its actual phase; developer is not proved direct client |
| P03 | Resort Core Bulk Utilities / Qiddiya | Assigned roads, landscape, utilities modelling/coordination/drawings | A10–A14 | Verify whether imagery belongs to this package or Park Ride/Welcome Center |
| P04 | King Fahd Sports City | Assigned stormwater-network modelling/coordination | A15 | Not stadium-wide design or development responsibility |
| P05 | King Salman Park — Arabian Gardens | Landscape BIM/shop drawings; setting-out, grading, water features | A16–A17 | Submitted is not approved; no irrigation scope added from assumption |
| P06 | Dabaa | Separately recorded canal modelling/shop-drawing packages | None selected | Do not total 25+6+1 km into a public 32 km achievement |
| P07 | Kigali Centralized Sewerage | Recorded sewerage design/modelling support | None selected | Exact design responsibility and reviewer authority need confirmation |
| P08 | Ghorayzat WWTP, Sohag | Recorded design/modelling support across listed workstreams | None selected | Do not invent plant capacity, accepted disciplines, or total project responsibility |

The remaining five register groups are R03 Park Ride and Welcome Center, R04 Mansoura 1, R07 Ibrahim Al Khaleel Road, R08 Breiman, and R09 Al Bairaq. Preserve their IDs and source data; do not assume their country or add them to public counts without validation. Do not merge R03 into P03 automatically.

### 10.2 Image handling priorities

| Asset | Registered resolution | Best candidate use after approval |
| --- | --- | --- |
| A06 / SEDRA | 1959×1120 | Stronger SEDRA project overview candidate |
| A05 / SEDRA | 1578×788 | Road/roundabout detail card |
| A07 / AMAALA | 1538×649 | Wide technical coordination view |
| A08 / AMAALA | 599×276 | Small detail only; not a hero or performance proof |
| A09 / AMAALA | 729×688 | Small supporting view |
| A10 / Qiddiya review group | 1805×1346 | Candidate overview after package association is resolved |
| A13 / Qiddiya review group | 2148×724 | Wide technical view after association review |
| A14 / Qiddiya review group | 1816×706 | Separate network view after association review |
| A15 / King Fahd | 1869×1248 | Technical stormwater-related view, association to confirm |
| A16 / KSP | 834×1179 | Historical report page; usually avoid as decorative cover |
| A17 / KSP | 4723×3338 | Drawing detail after disclosure review |
| A18 / founder candidate | 359×470 | Identity and permission unconfirmed; not a full-width portrait |

Registered resolutions refer to referenced originals. Extracted PDF copies may be lower resolution or recompressed: measure the actual file. Never upscale a small technical image and describe it as high resolution. Never use AI to invent missing geometry, labels, report contents, or engineering evidence.

Create derivatives with explicit width/height, focal point, `object-fit` choice, localized alt/caption, source ID, and approval state. Optimize approved images as WebP/AVIF where supported, preserving a compatible fallback. Lazy-load below-fold media. Do not lazy-load the actual largest first-screen image. Do not embed entire page screenshots as the website's text/layout.

## 11. Motion design and interaction specification

### 11.1 Common grammar

Motion communicates alignment, sequencing, connection, and handover. Use CSS for simple button/focus/accordion states; use one GSAP-based orchestration layer for complex SVG/scroll sequences. Do not add multiple competing animation libraries, a smooth-scroll engine, WebGL, or a cursor replacement by default.

Base tokens: fast 160ms, UI 220ms, reveal 500–650ms, scene 900–1600ms; entrance ease `cubic-bezier(0.22, 1, 0.36, 1)` or an equivalent GSAP ease. These are starting values to tune, not measured timings from the reference sites.

### 11.2 Scene and microinteraction table

| ID | Trigger and behavior | Timing/distance | RTL and mobile | Reduced motion |
| --- | --- | --- | --- | --- |
| M01 Hero copy | First render, small line/block entrance; no typing loop | 450–600ms; 12–20px Y; total stagger ≤240ms | Arabic by complete line/block, never glyph; mobile smaller displacement | Fully visible immediately |
| M02 Hero assembly | Decorative utility layers align with road plane; drawing plane appears | One 1400–1800ms sequence; transforms/opacity | Scene placement swaps; geometry unchanged; simplified mobile layers | Final coordinated illustration |
| M03 Hero pointer response | Fine-pointer movement only within hero | Max ±3° tilt, 6–10px shift, eased reset | Off on touch; no cursor takeover | Off |
| M04 Header | Cross hero boundary; surface/line changes | 180–220ms; no large height change | Same behavior both locales | Instant state change |
| M05 Section reveal | First entry near 85% viewport height | 450–600ms; Y 16–24px; groups stagger 50–70ms | Smaller 10–16px mobile; full paragraphs | No transform/opacity entrance |
| M06 Service interaction | Hover/focus/explicit selection | Indicator 180ms; supporting visual 250–350ms | Selectable on touch; focus equivalent | Immediate selected state |
| M07 Network selection | Click, keyboard, optional hover preview | Highlight 200–300ms; one path draw 400–700ms | Labels outside unchanged coordinate diagram; mobile buttons/list | Instant highlight |
| M08 Zentrac Track | Normal page scroll activates current stage | Scrub approximately 0.4–0.6s if useful; one visual only | Horizontal flow reverses; mobile vertical unpinned | All stages static and visible |
| M09 Project card | Hover/focus | Image scale max 1.025 over 250–350ms; arrow 3–4px | Arrow points reading-forward; no hover dependency | No scale; clear focus outline |
| M10 Filters | User changes filter | Optional 160–200ms fade; no dramatic reordering flyout | Preserve focus and count announcements | Instant list update |
| M11 Accordion/menu | Explicit activation | 180–260ms; controlled size transition | No fixed Arabic content heights | Instant open/close |
| M12 Page navigation | Browser/framework route change | Optional 120–180ms content fade, only if navigation remains immediate | Correct new language/direction before reveal | No transition |
| M13 CTA detail | Hover/focus; arrow moves in reading direction | 160ms, 3px | Mirror arrow movement only | Color/border state only |
| M14 Form feedback | Real async state change | Small localized spinner/status | Layout reserves feedback room; screen-reader status | Static progress text is sufficient |

No animation should make the visitor wait for a CTA. Do not fade the entire page to zero while loading routes. No fake preloader, progress percentage, delayed cursor, auto-rotating text, continuous logo marquee, or animated numeric claims.

### 11.3 Signature hero storyboard

Static initial HTML includes text and a usable final-frame fallback. When enhancement is ready, animate only the decorative scene:

1. **0–300ms:** technical base plane and a few reference lines become clear.
2. **200–850ms:** utility layers move from small offsets into aligned positions; use 2–3 meaningful groups, not hundreds of individually animated segments.
3. **650–1300ms:** an orange coordination path traces through selected interfaces; show a conceptual issue marker resolving visually without claiming a real metric.
4. **1100–1750ms:** a drawing plane settles into place; the scene reaches a stable final composition.
5. **After completion:** stay still, except optional fine-pointer response. A Replay control is optional; no perpetual loop is required.

Keep the actual geometric model conceptual. Do not imply this animation loads a real RVT/IFC file. If real model viewing is later requested, scope that separately.

### 11.4 Zentrac Track mechanics

Prefer CSS sticky positioning for one illustration beside six normal-flow sections. Use intersection/scroll progress to activate the matching step. Do not pin the entire page for multiple screen lengths or intercept wheel/touch scrolling. Set a maximum desktop scene height that remains usable on short screens. On mobile and reduced motion, remove sticky/pin behavior and render a vertical sequence.

Clicking a stage uses a real anchor, scrolls to the stage with header offset, and moves focus only when appropriate for user navigation. Do not repeatedly announce changes caused solely by scrolling. Keep inactive text readable. The full process must still print and work with JavaScript disabled.

### 11.5 Engineering requirements for animation

- Use scoped GSAP contexts/`useGSAP`; tear down listeners, timelines, and ScrollTriggers on unmount and when relevant dependencies change. Use `contextSafe` for delayed event-created GSAP work when needed.
- Rebuild measurements after fonts/images settle or layout/locale changes. Do not create duplicate triggers after navigation or React development-mode remounts.
- Choose a single owner for each animated transform. Use nested wrappers when hover scale and scroll translation must coexist.
- Check `prefers-reduced-motion` in both CSS and JavaScript; respond if the preference changes during the session.
- Implement semantic final state first. JavaScript errors must not leave content at `opacity:0`, translated offscreen, or inside a permanent clipping mask.
- Prefer transform and opacity; use SVG stroke drawing sparingly. Avoid full-screen animated blur, huge backdrop filters, layout thrashing, and perpetual offscreen loops.
- Pause decorative work when offscreen or the tab is hidden. Never poll layout on every frame without need.
- Keep motion outside focus rings and hit targets. Hover/focus states must remain visible after an animation completes.
- A continuous decorative animation lasting more than five seconds requires pause/stop treatment; the default design avoids those loops.
- Respect reduced data/low-performance conditions when supported, but never rely on unsupported browser signals for core functionality.
- Test fast scroll, reversed scroll, orientation changes, viewport resize, locale changes, and direct deep-link navigation.

Official implementation references: [GSAP React](https://gsap.com/resources/React/) and [reduced-motion media query](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion). Verify the exact API against installed versions.

## 12. Application and content architecture

### 12.1 Default implementation

For a new project, use Next.js App Router and TypeScript. Render reading content on the server; keep client components narrowly scoped to menus, filters, forms, and interactive scenes. Use Tailwind CSS plus shared semantic CSS tokens. A well-maintained equivalent existing stack is acceptable when it meets all requirements.

Use local typed content or trusted local MDX for initial editing. Keep translation dictionaries separate from business records. Prefer one shared component implementation per page family rather than independent English/Arabic copies that drift. An established i18n package may be used if it supplies message formatting and route utilities without unnecessary complexity.

Use GSAP and `@gsap/react` for signature motion, CSS for simple interactions, Zod or an equivalent shared schema validator, Playwright for user journeys, axe for automated accessibility checks, and a small unit-test framework for critical content/routing logic. Use the repository's existing package manager and commit the lockfile. Do not mix package managers.

### 12.2 Suggested code organization

| Directory/file | Responsibility |
| --- | --- |
| `src/app/[locale]/` | Locale pages, shared layout, service/project/article routes |
| `src/app/api/` | Server-only enquiry/upload endpoints when configured |
| `src/components/layout/` | Header, footer, navigation, container, breadcrumbs |
| `src/components/ui/` | Button, field, disclosure, dialog, status, link primitives |
| `src/components/sections/` | Page-level editorial sections |
| `src/components/motion/` | HeroAssembly, Reveal, NetworkExplorer, ZentracTrack |
| `src/components/forms/` | Quote and career forms with localized states |
| `src/content/public/` | Explicitly publishable data only |
| `private-source/` | Local-only full inventory and draft records; excluded from deployment |
| `src/i18n/` | Locale config, dictionaries, route resolution, formatting helpers |
| `src/lib/` | Validation, content projection, SEO, form adapters |
| `src/styles/` | Tokens, typography, logical layout, print, motion preferences |
| `public/brand/` | Verified brand assets only |
| `public/media/` | Approved optimized public media only |
| `public/downloads/` | Reviewed public documents only |
| `tests/` | Critical automated tests and non-sensitive fixtures |
| `docs/` | Decisions, source references, storyboard, QA, handoff |

Adapt this to the existing repository. Do not expose `private-source` through a catch-all static route or upload it as part of a public source package. Repository privacy and deployment artifact contents are separate checks.

### 12.3 Internal types and public projection

Example schema shape; adjust details to the chosen implementation:

```ts
type Locale = 'en' | 'ar';
type Localized<T> = Record<Locale, T>;
type PublicationState = 'draft' | 'withheld' | 'approved';

interface SourceRef {
  fileId: 'F1' | 'F2' | 'F3' | 'F4' | 'F5';
  locator: string; // e.g. "Projects!A8:O8" or "page 6"
}

interface InternalProject {
  id: string;
  slug: string;
  title: Localized<string>;
  summary: Localized<string>;
  scope: Localized<string[]>;
  countryCode?: string;
  serviceIds: string[];
  attribution: 'founder-bim-experts' | 'zentrac-confirmed';
  projectParties: Array<{ name: string; role: Localized<string> }>;
  directAppointingParty?: string;
  dates?: { start?: string; end?: string };
  assetIds: string[];
  publication: {
    state: PublicationState;
    approvedFields: string[];
    approvalEvidence?: string; // PRIVATE; never serialized publicly
  };
  sources: SourceRef[];
  internalNotes: string[];
}

interface PublicProject {
  id: string;
  slug: string;
  title: Localized<string>;
  summary: Localized<string>;
  scope: Localized<string[]>;
  attributionLabel: Localized<string>;
  serviceIds: string[];
  images: Array<{
    src: string;
    width: number;
    height: number;
    alt: Localized<string>;
    caption?: Localized<string>;
  }>;
}
```

Create the public object by an explicit allowlist, not by spreading the internal object and deleting a few keys. Include optional facts only when permitted. Approval for a project title does not imply approval for every photo, party name, metric, or document. Source references and evidence notes belong in internal records, not automatically in public JSON.

An asset record should include actual file path, source locator, project ID, width/height, format, rights/publication state, authorized derivatives, focal point, localized alt/caption, and public destination. Keep the original source path private. Services, network categories, and article topics should use stable IDs in filters, forms, and relationships.

### 12.4 Publication behavior

- Private local review can show draft/withheld records with a clear review banner. It is separate from the public content projection.
- If a remote preview is used, protect it with authentication/access control; `noindex` alone does not make a preview private.
- Public routes, static generation, API responses, client bundles, RSC payloads, HTML source, source maps, JSON-LD, Open Graph images, search indexes, sitemaps, feeds, and downloads must all use the same public projection.
- A withheld project's direct public URL returns a real not-found response. Hiding its card is insufficient.
- Production must not copy the source PDFs, workbook, DOCX, draft translations, approval evidence, or original project images into public folders.
- Initial public project count can legitimately be zero. Render a purposeful capability-led fallback, while retaining finished templates privately.
- A disabled feature should not produce a dead `#` link. Omit the control or explain its genuine local-review status.
- Enforce bilingual publication parity initially: publish a record only when both languages and their relevant metadata are complete.
- Add a build-time validation script that fails if public content contains unresolved placeholders or a restricted record/asset.

## 13. Forms, upload, and enquiry experience

### 13.1 Quote form fields

All length/file limits below are proposed technical defaults, configurable after the owner's operational decision.

| Field | Required | Behavior and validation |
| --- | --- | --- |
| Name / الاسم | Yes | Unicode; trim outer whitespace; 2–100 characters |
| Company / الشركة | Yes | Unicode; 2–160 characters; do not require a specific legal suffix |
| Email / البريد الإلكتروني | Yes | Email input; server validation; max 254 characters; no ASCII-only name assumptions applied to email |
| Phone / رقم الهاتف | No | LTR international value; accept common separators and Arabic digits; validate normalized value when present |
| Country / الدولة | Yes | Localized country labels with stable country code; keyboard searchable if custom |
| Service / الخدمة | Yes | Five service IDs plus “Not sure / لست متأكدًا”; allow deliberate multiple selection if designed clearly |
| Engagement scope / نطاق التكليف | No | Package/network/coordination/full-scope stable values |
| Project details / تفاصيل المشروع | Yes | Unicode, 20–4000 characters; short helper asking for a non-confidential overview |
| Attachments / المرفقات | No | Conditional on configured private pipeline and approved collection process |
| Privacy acknowledgement | Yes when collecting data | Unchecked by default; links to current policy; accurate wording |

Do not require budget, sensitive identification, full drawings, or unnecessary personal details for initial contact. If a page preselects a service, show the selection visibly and allow changing it. Do not expose hidden preselection that the visitor cannot inspect.

### 13.2 Careers form

Fields: Name, Email, Discipline, Years of experience, Portfolio link, CV, privacy acknowledgement. Name/email/discipline are required; require at least one of CV or portfolio link when submission is enabled. Experience can be an optional non-negative number with a sensible configurable upper bound, never a filter that falsely rejects an experienced applicant. Portfolio URL must use an allowed web scheme; do not server-fetch arbitrary submitted links.

CV default: one PDF, maximum 5 MiB. Do not require date of birth, national ID, marital status, or a photograph. No automated suitability scoring is needed. Confirmation means application receipt, not a job offer or promised interview.

### 13.3 Form states and microcopy

Every form must implement idle, editing, client validation error, uploading if applicable, submitting, received, server field error, transport error, rate-limited, and unavailable/configuration states. Preserve entered text after failures. Disable duplicate submission while a request is pending, without making the whole form impossible to read.

| State | English | Arabic |
| --- | --- | --- |
| Missing name | Please enter your name. | يرجى إدخال الاسم. |
| Invalid email | Enter a valid email address. | يرجى إدخال بريد إلكتروني صحيح. |
| Missing service | Select a service or choose “Not sure”. | اختر خدمة أو اختر «لست متأكدًا». |
| Details too short | Please add a little more detail about your project. | يرجى إضافة مزيد من التفاصيل عن المشروع. |
| Upload too large | This file exceeds the allowed size. | يتجاوز هذا الملف الحجم المسموح به. |
| Submitting | Sending your request… | جارٍ إرسال طلبك… |
| Received | Your request has been received. Reference: {id} | تم استلام طلبك. رقم الطلب: {id} |
| Failure | We could not send your request. Your details are still here. Please try again. | تعذر إرسال الطلب. ما زالت بياناتك موجودة؛ يرجى المحاولة مرة أخرى. |
| Unavailable | Online submission is temporarily unavailable. | الإرسال عبر الموقع غير متاح مؤقتًا. |
| Local test mode | Preview only. This test will not send a real enquiry. | معاينة فقط. لن يرسل هذا الاختبار استفسارًا فعليًا. |

“Received” is allowed only after the chosen backend has durably accepted the submission. A front-end timeout simulation is not proof of receipt. If a local test adapter is used, use separate wording such as “Test completed; no request was sent.” Do not show the production success message in test mode.

### 13.4 Accessibility and interaction

- Use visible labels, not placeholders as labels. Mark required/optional fields in text consistently.
- Associate helper/error text with `aria-describedby`; set `aria-invalid` on invalid fields.
- Validate sensibly after blur and on submit; do not announce errors for every keystroke.
- On invalid submit, show an error summary with links to fields and move focus to that summary or the first invalid field consistently.
- Announce real async status through a polite live region. Do not repeatedly announce animation progress.
- Keep input font size at least 16px on mobile to avoid unwanted zoom behavior.
- Support Enter submission where appropriate; Enter in a multiline description inserts a newline.
- Do not clear text until confirmed success. Provide a deliberate “Send another request” action afterward.
- Reserve room for inline error text or allow the layout to grow; avoid fixed-height cards that clip Arabic messages.
- Use 44×44px minimum project target for touch controls; ensure file-remove buttons and checkbox labels are easy to activate.
- Preserve form text across a recoverable error and deliberate locale switching. Never put personal form values in query parameters.

### 13.5 Upload pipeline

Quote defaults: up to 3 files, 10 MiB each, 20 MiB combined; PDF, JPEG, PNG only. Show the actual allowed types and limits in both languages before selection. Support a native file-picker button even if drag-and-drop is offered. List filename, size, status, and a labelled remove button. Keep Arabic filenames readable using bidi isolation.

Raw CAD/BIM files such as RVT, DWG, IFC and archives are outside this first-contact upload default. Explain that detailed model exchange can be arranged after scope/confidentiality discussion. Do not pretend a PDF upload form is a full BIM file exchange system.

Validate extension, content signature, declared type, count, individual size, and aggregate size on the server. Generate storage keys; do not trust the original filename as a path. Quarantine uploads and scan them before staff retrieval; keep storage private and access time-limited. Never serve submitted files from the public website directory. Apply server and storage quotas, reject dangerous content, clean up abandoned uploads, and test failure paths. See [OWASP file upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

If the selected backend cannot provide the required private handling, ship the quote flow without attachments and clearly describe that limitation. The separate careers flow must also handle its own CV requirement honestly; it may accept a portfolio URL until private CV handling is configured.

Do not promise “all files are covered by an NDA.” If an NDA-before-upload process is later confirmed, implement that real workflow explicitly. A checkbox acknowledging a privacy policy is not an NDA.

### 13.6 Endpoint and provider contract

Choose a deployment-compatible server endpoint or server action. Example contracts, to adapt to the framework:

| Endpoint/action | Input | Successful outcome | Failure behavior |
| --- | --- | --- | --- |
| Create upload session | Allowed file metadata, locale, anti-abuse token | Scoped private upload session | Localized error code; no public URL |
| Finalize upload | Opaque upload IDs | Verified attachment references | Quarantine/rejection; no premature availability |
| Submit enquiry | Locale, stable service IDs, validated fields, attachment IDs, idempotency key | Durable receipt and reference ID | Structured field/transport error |
| Submit career enquiry | Locale, validated career fields, CV reference or portfolio URL | Durable receipt | Same honest failure model |

Return language-neutral error codes plus field IDs; translate them in the UI. Never send raw internal stack traces to visitors. Enforce request-size limits, shared-storage rate limits appropriate to the host, origin/CSRF protections appropriate to the endpoint, server validation, and output escaping. Treat user text as data, not HTML or mail headers. Make repeated submissions with the same idempotency key safe.

Email notifications should link staff to private authorized records/files, not expose public attachment links. If the selected architecture stores no durable enquiry record and relies only on an email provider, label success as the precise provider acceptance event and document the delivery limitations. Prefer durable receipt with a retryable notification step.

Proposed environment configuration: `SITE_URL`, `FORM_MODE`, `ENQUIRY_RECIPIENT`, provider credentials, private storage configuration, allowed upload limits, optional analytics ID. Secrets remain server-only; never use a public client prefix for credentials. `FORM_MODE=preview` is visibly test-only; public live submission must fail closed when required configuration is absent. Retention periods, lawful handling language, and staff access procedures require owner decisions; do not invent them as published policy.

## 14. Search, metadata, and sharing

- Generate localized title and description for every indexable route. Use accurate service/place wording; no keyword stuffing or unsupported geographic offices.
- Give each published EN and AR page its own self-canonical URL and reciprocal `hreflang` alternates. Use `en` and `ar`; `x-default` points to the defined default entry. Do not canonicalize every Arabic page to English.
- Read the verified production origin from configuration. Never hardcode an assumed Zentrac domain or ship localhost canonicals in production.
- Generate sitemap entries only for published records and routes. Exclude private previews, withheld projects, drafts, test forms, and internal documents.
- Keep `robots.txt` and metadata consistent. Remember robots directives do not provide access control.
- Include localized Open Graph title/description/image text where images are generated. Use the actual logo and generic brand art, not an unapproved project rendering.
- For Open Graph locale, use the chosen supported regional mapping consistently; language routing remains `/en` and `/ar`.
- Use Organization, Service, BreadcrumbList, and Article structured data only where their fields are accurate. Do not add ratings, certifications, reviews, employee counts, unknown telephone numbers, or invented social `sameAs` links.
- Structured data must match visible content and publication status. An article's author/date must be genuine.
- Use one descriptive H1 per page, clear heading hierarchy, descriptive link labels, and useful image alternatives.
- Provide favicon/app icons derived faithfully from the logo. Do not replace the logo with a stock building icon.
- A downloadable profile link indicates language, PDF format, and actual file size. If only an English public PDF exists, label it “Company profile — English PDF” in both interfaces rather than implying an Arabic document.
- Preserve meaningful 404 status for unknown routes and withheld items. Do not redirect every missing page to the homepage.
- URL-encode query parameters properly. Locale switching must not preserve an arbitrary external redirect target.

## 15. Performance and accessibility requirements

### 15.1 Performance targets

Targets for the finished implementation, not measurements of work already performed:

| Measure | Target and interpretation |
| --- | --- |
| LCP | ≤2.5s at the 75th percentile in field data when enough data exists |
| INP | ≤200ms at the 75th percentile in field data |
| CLS | ≤0.1 at the 75th percentile in field data |
| Lab quality | Aim for Lighthouse mobile performance ≥90 on the representative production build; report actual environment and result |
| Initial JS | Aim for ≤250 KiB compressed on the homepage, including framework/runtime; justify exceptions with measurement |
| First-view payload | Aim for ≤1.8 MiB mobile and ≤2.5 MiB desktop, including fonts and required hero assets |
| Hero image/poster | Aim for ≤250–350 KiB at the delivered breakpoint |
| Fonts | Load only needed locale subsets/weights; aim for ≤450 KiB initial font transfer |
| Motion | No persistent animation-caused long tasks or visibly dropped scrolling on the agreed test device |

Lab tests cannot establish field INP or real-user percentile guarantees. Use [Web Vitals guidance](https://web.dev/articles/vitals) to distinguish lab evidence from post-launch field monitoring.

Reserve image dimensions and scene space. Use responsive `sizes`/sources and image optimization appropriate to the hosting mode. Preload only the truly critical font/image, not every asset. Defer below-fold scenes; stop unnecessary work when hidden. Avoid large video backgrounds and heavy 3D payloads in this version. Use cacheable immutable hashed assets and useful error fallbacks.

### 15.2 Accessibility baseline

Target WCAG 2.2 AA and verify actual components. Provide semantic landmarks, skip navigation, accessible names, visible focus, keyboard-operable menus/dialogs/tabs, status messages, sufficient contrast, and readable reflow. Do not rely on color, hover, animation, or spatial position alone. Use native controls where they fit. Check zoom, text spacing, reduced motion, and meaningful screen-reader order. Reference: [WCAG quick reference](https://www.w3.org/WAI/WCAG22/quickref/).

Project-specific details:

- Every decorative SVG is hidden from assistive technology; informative diagrams have a meaningful text explanation outside the artwork.
- Button/link focus rings remain visible against navy, white, and orange, including inside clipped image wrappers.
- Normal text targets 4.5:1 contrast; large text and essential component boundaries follow their applicable thresholds.
- Use the 44px project touch target even where the standard's minimum is smaller.
- Screen readers should encounter each heading once. If an animated clone exists, hide the clone and preserve the semantic original.
- Tooltips must also work by focus and be dismissible where needed; essential copy must not live only in a tooltip.
- Do not auto-play sound or flashing content. Do not trap a reader in a scene or gallery.
- 200% text zoom and 320 CSS-pixel reflow must not remove essential content or controls.
- Print styles remove decorative motion/navigation, show meaningful process content, preserve RTL, and avoid dark full-page backgrounds.
- Test at least one desktop screen reader and a mobile screen-reader path when available; state any untested combination explicitly.

## 16. Component state checklist

| Component | States to implement and inspect |
| --- | --- |
| Button | Default, hover, keyboard focus, active, disabled, pending; icon-only label if applicable |
| Text link | Default, hover/focus, visited where useful; clear external/download meaning |
| Navigation | Desktop, collapsed, open, active route, keyboard traversal, long Arabic label |
| Language switch | Both labels, equivalent route, pending navigation, form-draft warning if needed |
| Service row | Default, hover/focus, selected, expanded, touch interaction |
| Network explorer | All, one selected, keyboard selection, static mobile, reduced motion, no-JS list |
| Process track | Each stage, deep-linked stage, reverse scroll, mobile vertical, reduced motion |
| Project card | Approved image, missing image, long name, attribution, keyboard focus |
| Filters | None selected, several selected, zero results, reset, locale switch, Back |
| Article card | Long title, optional image, confirmed date, no published posts |
| Gallery dialog | Open/close, first/last image, keyboard, long caption, no image, RTL |
| Form field | Empty, filled, focused, invalid, disabled, autofilled, mixed script |
| Upload | Empty, selected, uploading, uploaded, rejected, oversized, removed, transport failure |
| Submission | Pending, received, retryable failure, field errors, rate limit, unavailable, test mode |
| Download | Available with format/size, withheld/absent, failed request |
| Error page | 404, server error, retry action, localized navigation recovery |

## 17. Verification matrix and acceptance tests

### 17.1 Viewports and browser coverage

Use browser automation for broad route checks and visual inspection for design quality. Test every public route in both locales for load, title, direction, one H1, navigation, missing translations, and overflow. Capture representative page families at the following widths:

| Width | Purpose |
| --- | --- |
| 320px | Reflow and long Arabic labels; no page overflow |
| 360px and 390px | Common narrow mobile layouts and touch controls |
| 430px | Wider mobile; hero composition and form widths |
| 768px | Tablet portrait and navigation collapse |
| 1024px | Tablet/compact laptop; sticky scenes and menu fit |
| 1280px and 1440px | Primary desktop design review |
| 1920px | Maximum widths, readable line length, oversized whitespace |

Use portrait and landscape on a representative mobile device. Verify current Chromium, Firefox, and WebKit/Safari where available; include iOS Safari and Android Chrome behavior through actual devices or clearly identified emulation. Emulation is not an actual-device test. Document browser versions and limitations.

### 17.2 Bilingual and direction test cases

| ID | Test | Pass condition |
| --- | --- | --- |
| L01 | Direct-open every `/en` and `/ar` page | Correct language/direction before hydration |
| L02 | Switch locale on a service detail | Same service, translated content, correct URL |
| L03 | Switch on a project/article | Same content ID; no homepage reset or unpublished leak |
| L04 | Switch with active project filters | Equivalent results and translated labels; stable IDs |
| L05 | Switch with a form draft | Text preserved; file limitation explained before loss |
| L06 | Refresh/back/forward after switching | No redirect loop, stale font, or wrong direction |
| L07 | Arabic H1 and long descriptions | Natural shaping; no clipped diacritics or forced spacing |
| L08 | `LOD 400`, `LV / MV`, `RFI-024`, `Phase 1B` | Tokens and punctuation remain in intended order |
| L09 | Arabic/English names and companies | Accepted, editable, correctly aligned and retained |
| L10 | Phone/email/URL in Arabic form | LTR values with correct plus sign; Arabic labels/errors |
| L11 | Arabic-Indic numeric input | Normalizes correctly for validation; original names unaffected |
| L12 | Logo, drawing and diagram in Arabic | Unmirrored, original geometry intact |
| L13 | Breadcrumbs and forward/back controls | Direction matches reading flow, accessible labels correct |
| L14 | Header/menu at 320–1024px | No collisions, clipped language control, or tiny type |
| L15 | Keyboard tabs and arrow-key widgets | Focus order and visual progression agree |
| L16 | Result counts 0, 1, 2, 3, 11, 100 | Grammatically valid localized messages |
| L17 | Error/empty/loading/success states | Fully translated; no raw dictionary keys |
| L18 | Article/table/gallery captions | RTL narrative with isolated technical tokens |
| L19 | Metadata and sharing | Localized titles/descriptions; reciprocal hreflang |
| L20 | No JavaScript / failed enhancement | Core copy, links, and process information remain usable |

### 17.3 Functional and factual tests

- Route links resolve; no `href="#"` placeholders, missing pages, fake social destinations, or hidden unsupported downloads.
- Services preselect the correct form ID in both languages and remain editable.
- Quote/career invalid, valid, duplicate, offline, timeout, provider-failure, and rate-limit cases behave honestly.
- Attachment count/type/size limits are enforced server-side; rejected files never become publicly accessible.
- A successful configured integration test proves receipt and reference handling; a preview adapter never claims a real send.
- Empty projects/blog states remain polished; hidden content does not leave awkward blank sections.
- Public projection excludes all withheld names, assets, private notes, metric candidates, and original source files from every output channel.
- Company chronology, founder attribution, project scopes, and owner/direct-client distinctions match sources.
- Automated source-content checks detect bracket placeholders such as `[Email]`, `[Phone]`, `[XX]`, dummy contacts, and unapproved metric assertions in public output. Avoid naive checks that flag valid code brackets or documented test fixtures.
- Project/image associations are reviewed; no arbitrary reuse of an attractive rendering on an unrelated case study.
- The profile download is reviewed separately; a polished PDF is not automatically publishable.

### 17.4 Motion and visual tests

Test every signature scene in normal motion, reduced motion, mobile, fast scroll, reverse scroll, resize, route change, and locale change. There must be no invisible content, cumulative transforms, duplicated triggers, stuck scroll lock, focus loss, or content jumping when fonts load.

Inspect screenshot pairs rather than merely generating them. Check desktop/mobile EN/AR for balanced whitespace, correct logo, natural headings, consistent gutters, legible caption contrast, source image quality, button spacing, and line wraps. Give Arabic its own optical adjustments instead of shrinking it to fit English boxes.

Suggested screenshot naming: `home-ar-390-motion-reduced.png`, `service-en-1440.png`, `quote-ar-390-errors.png`, `menu-ar-360-open.png`, `project-en-1440-approved-fixture.png`. Use synthetic/non-sensitive fixtures in QA evidence; never publish real submission details in screenshots.

### 17.5 Verification commands to provide

Define and document scripts equivalent to `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `check:content`, and `check:locales`. Names can follow the existing repository. Run the actual commands; do not list them as passed without output. Test the production build as well as development mode.

Prioritize meaningful tests: public-content projection, locale route resolution, field validation, submission idempotency, upload rejection, keyboard/dialog behavior, and core visitor journeys. Do not fill the repository with tests that merely assert an implementation constant equals itself.

## 18. Release gates and unresolved decisions

### Gate A — Local implementation complete

All page templates, both locales, responsive layouts, signature motion/fallbacks, forms/test adapter, data models, and QA are complete. Any integration not configured is visibly labelled and documented. This gate can be reached using the five supplied files.

### Gate B — Public content ready

Business copy reviewed; founder/company attribution correct; contacts verified; project disclosures and assets allowed; actual specialist-service delivery confirmed or those claims omitted; English/Arabic parity checked; public profile reviewed; articles and policy approved if included.

### Gate C — Operational release ready

Production origin and host configured; real forms and private uploads tested if enabled; privacy/retention/access processes set; preview access protected; public-output leak checks passed; performance/accessibility findings resolved; rollback documented. Public deployment is performed only after it is requested.

### Owner decision register

| Priority | Decision | Default until resolved |
| --- | --- | --- |
| Launch-critical | Domain and confirmed company contact channels | Configuration placeholders internally; no fake public links |
| Launch-critical for data collection | Policy, data handling, enquiry recipient and provider | Test-only forms or honest unavailable state |
| Launch-critical for named portfolio | Which project fields/images can be disclosed, and exact attribution | Withheld publicly; complete private review templates |
| Content | Confirm core current service scope and specialist partners | Core source-based draft; optional specialist module withheld |
| Content | Legal English name and any required business disclosures | Short brand name; preserve source spelling internally |
| Content | Founder portrait and real office/team images | Designed typographic/illustrative alternatives |
| Content | Quote response SLA and NDA process | No numerical SLA or automatic NDA promise |
| Content | Public profile PDF and Arabic equivalent | Download omitted until the particular file is ready |
| Editorial | Approved articles, author names, dates | Draft templates and concise public empty state |
| Optional | Analytics provider and consent requirements | No third-party analytics by default |

Do not turn these decisions into repeated interruptions while independent work can continue. Collect them in one clear list with exact affected modules and sensible fallbacks.

## 19. Final quality bar

The site succeeds when it looks unmistakably like Zentrac, explains the engineering offer quickly, feels fluent in both languages, and uses motion to reveal how coordinated work becomes deliverable work. A visitor must be able to understand, navigate, read, enquire, and recover from errors without depending on animation or English.

Reject the implementation if it has a beautiful English homepage but incomplete Arabic pages; reversed logos or drawings; brittle fixed-height Arabic copy; generic SaaS imagery; fake statistics or clients; nonfunctional forms; hidden unapproved project data; dead CTAs; or animation that dominates usability.

## 20. Reference register

### Supplied project sources

F1–F5 are listed in §2. Business facts and asset references in this brief derive from those files. F1/F3 restrictions are source-specific facts, not assumptions about every engineering portfolio. The proposed design, technical architecture, dimensions, timings, field limits, and fallback copy are implementation recommendations.

### Design references inspected

- [Imtyaze](https://www.imtyaze.com/)
- [ByteForce](https://www.byteforceinc.com/)
- [B Systems](https://www.bsystemseg.com/)
- [Mindoo](https://mindooco.com/en)
- [Elshrouk](https://elshroukvet.com/ar)

### Primary technical references

- [Antigravity skills](https://antigravity.google/docs/skills/)
- [Antigravity rules](https://antigravity.google/docs/rules/)
- [Next.js internationalization](https://nextjs.org/docs/app/guides/internationalization)
- [Next.js image optimization](https://nextjs.org/docs/app/getting-started/images)
- [GSAP and React](https://gsap.com/resources/React/)
- [W3C structural direction in HTML](https://www.w3.org/International/questions/qa-html-dir)
- [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [MDN reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
- [Web Vitals](https://web.dev/articles/vitals)
- [OWASP file upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [IBM Plex Sans Arabic](https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic)

Recheck version-sensitive APIs and skill discovery behavior at implementation time. Do not claim that this specification itself is an implemented website, an accessibility certification, a legal approval, or a measured performance report.
