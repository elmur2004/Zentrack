# Zentrac post-build audit, fixes, SEO and animation enhancement prompt

Use this prompt after the initial website has been implemented. Read the entire document and execute it against the actual repository and running site. This is an implementation and verification assignment, not a request for advice or an audit report alone.

## 1. Your assignment

Act as a senior frontend engineer, technical SEO specialist, bilingual Arabic/English interface reviewer, accessibility tester, performance engineer, and motion designer.

Audit the complete Zentrac website, find defects and missed requirements, implement the necessary fixes, and raise the visual and animation quality substantially while preserving the brand and accurate source content. Finish with a tested, polished local or protected-preview build and an evidence-based report.

**Enhance the animations deliberately.** Do not limit yourself to fixing broken effects or adding the same fade-up to every section. Improve choreography, scene composition, transitions, interactive feedback, and the relationship between motion and Zentrac's engineering story. Make the experience more distinctive and refined while keeping it readable, responsive, accessible, and fast.

Read these project files before changing anything:

1. `01_ZENTRAC_WEBSITE_MASTER_PLAN.md`
2. `02_ZENTRAC_WEBSITE_BUILD_SPEC.md`
3. The five original Zentrac source files identified in those documents.
4. Existing repository instructions, content decisions, open decisions, asset manifest, route matrix, motion storyboard, and QA report, when present.
5. `04_ZENTRAC_QUOTE_ADMIN_DASHBOARD_PROMPT.md` and its implementation, if the quote-management dashboard has been built.

Inspect the actual implementation. Do not assume that a previous agent's “completed” statement proves a feature exists or works. Preserve any later explicit owner decisions recorded in the project. Resolve genuine conflicts using the source hierarchy in the build specification.

Use available relevant skills and tools for frontend design, Arabic/RTL, SEO, accessibility, browser testing, performance, and animation. Verify their availability instead of inventing tool names. If a tool is unavailable, use a practical equivalent and document the coverage gap.

Proceed autonomously with reversible development, repairs, and local tests. Do not pause for routine design choices. Record missing business inputs and continue all independent work. This assignment does not authorize public deployment, changes to production DNS or accounts, paid services, real enquiries to customers/staff, or unrestricted public exposure of draft material.

## 2. Establish a reproducible baseline

Before editing:

- Inspect the app structure, framework version, dependencies, scripts, lockfile, environment setup, rendering strategy, and current Git changes.
- Preserve unrelated work. Create a focused branch or checkpoint if Git is available; do not reset or overwrite changes.
- Identify the actual entry point, development URL, production build command, and preview configuration. Use the existing stack and package manager.
- Run the site. Audit the production build as well as development mode; some errors only appear after building.
- Build a route inventory containing URL, locale, page family, publication status, expected HTTP status, canonical target, and relevant interactions.
- Crawl all reachable internal links, including the footer and detail pages. Compare the result with the intended route matrix to identify missing and orphaned pages.
- Capture representative baseline screenshots of English and Arabic on desktop and mobile. Capture motion recordings when tooling allows.
- Record baseline console errors, failed network requests, build/type/lint results, accessibility findings, and representative performance measurements.
- Use synthetic, clearly labelled test data. Do not put real confidential project details or applicant data in test screenshots, logs, recordings, or external testing services.

Create `docs/post-build-audit.md` with an issue register: ID, severity, affected route/locale/device, reproduction steps, observed result, expected result, probable cause, planned fix, verification, and status.

Classify issues:

| Priority | Meaning | Handling |
| --- | --- | --- |
| P0 | Sensitive-data exposure, destructive behavior, site-wide failure | Fix immediately; isolate the affected feature |
| P1 | Broken primary journey, major Arabic failure, material accessibility problem, release-wide indexing error | Resolve before describing the site as ready |
| P2 | Significant quality, performance, metadata, motion, or responsive defect | Fix during this pass |
| P3 | Minor polish or low-impact consistency issue | Complete practical improvements after higher priorities |

Use the loop **reproduce → identify cause → fix → verify → check affected regressions**. Never mark an issue fixed simply because code changed.

## 3. Complete-site functional audit

Inspect every page family in both locales: Home, About, Services, all five service details, Infrastructure, How We Work, Clients, Projects, approved project details, Blog, published article details, Quote, Partners, Careers, Privacy, and error/not-found pages. Exercise withheld content only in the protected local review mode.

If the quote-management dashboard exists, include its overview, inbox, request detail, assignment/status workflow, private files, internal notes, communication, exports, user permissions and session behavior in this audit. Use isolated test accounts for each role. Verify the public quote form creates exactly one persistent authorized admin record, and confirm admin routes/data remain excluded from public indexing and metadata. Never crawl private pages as public SEO content or expose account credentials in audit evidence. Use the quieter admin motion requirements rather than adding marketing hero effects to data screens.

Check and repair:

- Broken internal links, dead buttons, `href="#"` placeholders, fake social links, missing images, broken downloads, and incorrect external destinations.
- Missing page templates, content sections omitted from the specification, and routes that only work after navigating from Home.
- Direct URL entry, reload, browser Back/Forward, new-tab opening, anchors, service preselection, filters, and URL state restoration.
- Header and mobile-menu behavior, active-route indicators, submenu access, Escape behavior, focus return, and body-scroll restoration.
- Modal/gallery opening and closing, first/last item handling, keyboard controls, image fit, and captions.
- Form field and submission states, accidental double submissions, stalled loading states, and buttons that remain disabled after failure.
- Filters with zero results, combinations, reset, unknown query parameters, long labels, and locale switching.
- Sticky headers hiding anchor targets, focused fields, or section headings.
- Unexpected navigation scroll jumps, stale layout measurements, and previous-route UI remaining visible after a route change.
- Loading, empty, offline, unavailable, error, success, and no-JavaScript fallback states.
- Accessibility or UI labels referring to an action different from the actual destination.

Use clear recovery actions. A failed feature should communicate what happened and what the visitor can do next; it should not leave an indefinite spinner or blank panel.

## 4. Technical SEO and crawlability

Treat this as a route-by-route technical audit, not a request to add more keywords.

### Rendering and HTTP behavior

- Compare initial HTML, rendered DOM, and the expected content for representative page families.
- Ensure meaningful service copy, headings, navigation links, and metadata are available without requiring a visitor to scroll, hover, or complete an animation.
- Do not hide essential copy in canvas, image-based text, or inaccessible animation layers.
- Use real anchor links for navigation. Check error and redirect status codes, redirect loops/chains, soft 404s, and missing assets.
- Verify unknown and withheld public URLs return appropriate not-found behavior rather than silently serving Home.
- Resolve duplicate slash, casing, host, and protocol variants according to a documented canonical URL policy. Avoid breaking existing legitimate URLs.
- Verify production origin configuration. No localhost, temporary preview domain, or invented Zentrac domain may appear in production metadata.

### Titles, descriptions and page intent

- Give each indexable page a descriptive localized title and useful meta description matching its actual content.
- Remove empty titles, duplicate template titles, raw translation keys, placeholders, and misleading service/location claims.
- Review title and description display length without blindly truncating at a universal character count. Preserve important meaning in both scripts.
- Keep a clear page H1 and logical heading hierarchy. Fix duplicated headings introduced by animated clones.
- Map each service page to a distinct visitor need. Reduce repeated thin paragraphs and improve useful explanations, inputs, deliverables, and internal links.
- Use natural Arabic search language instead of literal English keyword strings.
- Do not fabricate search volumes, rankings, competitors' data, testimonials, qualifications, or outcome statistics.

### Canonicals, robots and sitemaps

- Validate each indexable page's canonical target, preferred origin, locale and publication state.
- Review filters/tracking parameters so they do not create unlimited indexable duplicates. Preserve filter UX; choose and document the appropriate indexing treatment.
- Generate a sitemap from actual published canonical routes. Exclude redirects, errors, drafts, private previews, withheld projects, and unapproved downloads.
- Use accurate `lastmod` values only when the system has meaningful change dates; do not stamp every page with today's date on every build.
- Check `robots.txt`, meta robots and HTTP `X-Robots-Tag` together. Avoid accidental production-wide `noindex` or crawl blocking.
- Keep staging/private review restrictions intact. Do not remove preview protection to improve an SEO score.
- Do not rely on `robots.txt` as access control. If a `noindex` strategy is used for a public URL, ensure contradictory crawl blocking does not prevent a crawler seeing the directive.

### Images, structured data and sharing

- Use descriptive image alternatives and captions; decorative art has empty alt or appropriate hiding. Avoid keyword-stuffed alt text.
- Validate Organization, Service, BreadcrumbList and Article structured data only where applicable and truthful.
- Make structured data agree with visible copy, locale, URLs, dates and publication state. Do not add invented ratings, client relationships, offices, certifications or authors.
- Check structured-data syntax locally. Only submit publicly permitted URLs/content to third-party validators.
- Check Open Graph and social card metadata, absolute permitted image URLs, image dimensions, localized text and correct page links.
- Verify favicon and app icons are faithful to the brand and actually load.
- Review download links for real file type, size, language, accessible link text, and public approval status.
- Do not add FAQ or other schema solely to chase a rich result that may not be available to this site.

### Search service follow-through

Prepare a post-launch checklist for domain verification, sitemap submission, indexing checks and field monitoring. If the domain is not live or Search Console access is unavailable, say so. Do not claim that pages have been indexed, that structured data guarantees a rich result, or that fixes guarantee rankings.

## 5. English, Arabic and international SEO

Equal language quality is a release requirement.

- Verify `/en/...` and `/ar/...` for every public content record and page family.
- Ensure document `lang`, `dir`, font and dictionaries are correct from the initial server response.
- Check self-canonicals and reciprocal `hreflang` for actual equivalent published pages. Do not canonicalize the entire Arabic site to English.
- Verify `en`/`ar` language values and the selected default-entry strategy. If using `x-default`, keep it consistent with the site's intended fallback.
- Do not link alternates to missing, draft, withheld, redirected-to-unrelated, or untranslated pages.
- Ensure language switching retains the equivalent route/content ID and valid filters/anchors, not just the homepage.
- Confirm explicit language URLs are not overridden by geography, browser preference, or a stale cookie.
- Translate metadata, captions, breadcrumbs, aria labels, dialogs, validation errors, loading states, confirmations, empty states and 404 pages.
- Check Arabic plural forms and parameterized messages; do not construct sentences from English-order fragments.
- Review Arabic typography, spelling, punctuation, engineering terminology, reading rhythm, line breaks and content completeness.
- Remove English body-copy fallbacks from Arabic pages unless the content is an intentional proper name or technical token.

## 6. Deep RTL/LTR and mixed-direction testing

Inspect the DOM, keyboard order and screenshots. A right-aligned page is not sufficient RTL support.

- Use logical CSS properties and semantic DOM order. Find hardcoded left/right spacing, absolute offsets, gradients or transforms that misbehave in Arabic.
- Detect double reversals caused by combining RTL with indiscriminate `row-reverse` or array reversal.
- Check header brand/actions, hero columns, cards, breadcrumbs, lists, pagination, filter bars, drawers, close buttons, timelines, icons and form labels.
- Mirror semantic forward/back arrows when appropriate. Never mirror the logo, photographs, engineering drawings, coordinate axes, or technical model geometry.
- Keep phone numbers, emails, URLs, reference IDs and filenames readable through explicit direction/isolation.
- Test `BIM`, `LOD 400`, `LV / MV`, `RFI-024`, `Phase 1B`, parentheses, slashes, plus signs, decimal quantities and units inside Arabic sentences.
- Accept Arabic/Latin names and company names. Test Arabic-Indic digits in phone/numeric inputs without altering narrative content.
- Test long Arabic validation messages and filenames for wrapping and clipping.
- Verify language switching during a partially completed form preserves text or gives a clear warning before any unavoidable loss of selected files.
- Check horizontal tab/step keyboard movement in both directions; test RTL scroll behavior across browsers.
- Never split Arabic text into individual animated characters or apply letter-spacing that damages shaping.
- Keep Arabic focus rings, selection, copy/paste, autofill and mobile keyboard behavior usable.

Use fictional fixtures only, for example: `شركة الاختبار — BIM Experts`, `test@example.invalid`, `ZNT-2026-0042`, and `مخطط-التنسيق-01.pdf`. Do not publish these as real company details.

## 7. Required animation enhancement pass

First inventory the current animations and identify where they feel generic, disconnected, repetitive, abrupt, slow, excessive or broken. Then implement a coherent upgrade across the main experience.

Preserve Zentrac's measured identity: navy `#0B1624`, orange `#FA5211`, light surface `#F8F9FA`, Saira for English and the agreed Arabic companion font. Develop the themes of coordination, alignment, infrastructure paths, model layers and drawing handover.

### A. Hero — strengthen the signature sequence

- Improve the illustrative infrastructure scene's composition, depth, line hierarchy and relationship to the headline.
- Refine the sequence from base/reference plane, to aligned infrastructure layers, to highlighted coordination path, to drawing/hand-over state.
- Use controlled overlap and stagger, not a queue that makes the visitor wait through every layer.
- Keep headline and CTA readable immediately. Avoid text that remains invisible until an entrance finishes.
- Target a concise finite sequence around 1.4–1.8 seconds, adjusted after inspection; allow a stable final state.
- Add very restrained fine-pointer depth response only if it visibly improves the result. Disable it for touch and reduced motion.
- Use a compact static or simplified mobile treatment; mobile must look intentionally designed rather than like a broken desktop animation.
- If the hero currently uses generic blobs or unrelated stock graphics, replace them with original brand-appropriate illustrative geometry.

### B. Infrastructure explorer — make interaction clearer and richer

- Improve path highlighting, active labels, transitions between network categories and relationships between the controls and diagram.
- Make the selected state immediately clear using text/shape as well as color.
- Refine draw-on or trace motion only where it helps explain connection; avoid drawing every line on every click.
- Handle rapid repeated selection cleanly without queued animation buildup or stale labels.
- Provide equivalent keyboard and touch behavior. No essential hover-only information.
- Preserve original diagram geometry in Arabic while translating and repositioning the surrounding interface.

### C. Zentrac Track — improve scroll storytelling

- Improve stage-to-stage progression, active-stage indication and the relationship between explanatory text and the sticky visual.
- Make the transition through Review, Model, Coordinate, Drawings, Quantities and Site Support feel intentional.
- Keep native scrolling and normal-flow readable stage content. Avoid scroll trapping or long forced pinned sequences.
- Verify reverse scrolling, anchor entry, short-height screens, resizing, mobile vertical flow, and RTL progression.
- All stages must remain understandable in a static, reduced-motion and no-JavaScript presentation.

### D. Supporting microinteractions

- Refine service selection, project-card emphasis, directional arrows, menu transitions, accordions, filter updates and form feedback.
- Use approximately 160–250ms for small UI feedback, and 450–650ms for larger reveals as starting points.
- Reserve stronger motion for important moments. Do not give every paragraph an entrance effect.
- Coordinate spacing and easing so sections feel related without becoming repetitive.
- Keep hover effects small: restrained image scale, subtle directional arrow movement and controlled color/line changes.
- Include focus equivalents and touch states. Never move a button away from the pointer or alter hit areas during hover.
- Make route transitions optional and brief; preserve browser history, scroll restoration, keyboard focus and instant access to content.

### E. Implementation robustness

- Reuse the existing animation system where appropriate. Do not stack competing libraries to achieve a small effect.
- Scope timelines, selectors and listeners; clean up on unmount, route change, locale change and relevant breakpoint changes.
- Prevent duplicate ScrollTriggers/listeners after development-mode remounts or repeated navigation.
- Recalculate measurements after fonts, images and layout changes without layout-thrashing loops.
- Avoid competing CSS and JavaScript control of the same transform; use separate wrappers where necessary.
- Ensure the correct static final state remains if animation initialization fails.
- Honor changes to `prefers-reduced-motion` during the session, not only at initial load.
- Stop offscreen or hidden-tab work; avoid unnecessary persistent animation loops.
- Prefer transforms/opacity and restrained SVG techniques. Avoid large animated blurs, costly filters and perpetual full-screen effects.
- Do not add WebGL, video backgrounds, a custom cursor, scroll hijacking, fake loading screens or infinite marquees merely to appear modern.

Record what changed and why it improves comprehension or polish. Provide before/after screenshots plus recordings when possible; screenshots alone cannot demonstrate timing or smoothness. If an existing animation is already strong, preserve it and document the judgment rather than forcing a regression.

## 8. Performance and Core Web Vitals

Measure representative Home, service, portfolio and form pages in both languages using the same conditions before and after changes.

- Target field LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 at the 75th percentile once sufficient real-user data exists.
- Use local lab results to diagnose problems; do not present Lighthouse, TBT or a short interaction trace as proven field INP.
- Record browser/device, throttling, route, build mode and tool version. For key before/after comparisons, use three comparable lab runs and report the median rather than cherry-picking.
- Aim for mobile Lighthouse performance of at least 90 while preserving the site's intended functionality; do not remove useful content or accessibility to inflate scores.
- Inspect initial JavaScript size, route bundles, unused dependencies, excessive client rendering and hydration work.
- Optimize the actual LCP element. Do not lazy-load the hero's primary visual, preload all images, or ship desktop-sized assets to narrow mobile screens.
- Set image dimensions; review responsive sources, `sizes`, formats, lazy loading and broken-image fallback.
- Review font files, weights, subsets, preloads, fallback metrics and layout shift when Arabic fonts load.
- Profile scroll and interaction during the enhanced animations on a throttled/mobile-equivalent device.
- Check long tasks, dropped frames, unnecessary re-renders, accumulating event listeners and memory growth over repeated route changes.
- Ensure immutable assets and public pages have appropriate caching, while form responses and private data do not leak through shared caching.
- Inspect layout changes from banners, images, fonts, sticky headers and validation messages.
- Do not introduce a service worker or offline cache solely for this audit; if one already exists, check stale deployments and private-data caching.

If an enhancement costs performance, simplify its implementation or offer a lighter responsive variant. Report unresolved tradeoffs honestly.

## 9. Accessibility and inclusive interaction

Target WCAG 2.2 AA, using automated checks and manual verification. An automated score is not a certification.

- Verify landmarks, heading hierarchy, skip link, meaningful source order and accessible names.
- Use native links/buttons/inputs where appropriate. Remove clickable non-semantic containers and accidental nested interactive elements.
- Check keyboard-only access to every important journey and control.
- Verify focus visibility, focus trapping/restoration in dialogs and menus, Escape behavior and sticky elements covering focused content.
- Check text, UI and focus contrast on light, navy and orange surfaces. Source orange on white is unsuitable for much normal-size text; preserve the contrast-safe combinations in the specification.
- Test at 200% zoom, 320 CSS-pixel reflow, increased text spacing and mobile landscape.
- Verify labels, helper text, errors, required-state descriptions and status announcements.
- Check decorative versus informative images/SVGs, duplicate text from animated clones, and screen-reader reading order in Arabic.
- Ensure touch targets are comfortably usable; use the project's 44px target for small controls where possible.
- Test reduced motion in the initial page load and after changing the preference.
- Check forced-colors/high-contrast mode for essential boundaries, selection and focus where available.
- Review screen-reader paths with available desktop/mobile tools and name untested combinations.
- Avoid continuously announced scroll stages, decorative animation descriptions and repeated toast announcements.

## 10. Responsive and visual refinement

Test 320, 360, 390, 430, 768, 1024, 1280, 1440 and 1920px widths across representative templates. Inspect short desktop heights and mobile portrait/landscape. Do not only trust responsive device presets.

Correct:

- Horizontal page overflow, clipped content, awkward gutters, excessive empty space and elements outside the viewport.
- Arabic headings forced into English-height boxes, mismatched type weights, broken line wrapping and clipped glyphs.
- Navigation that crowds or shrinks excessively before collapsing.
- Sticky/fixed sections that collide with the mobile keyboard, browser chrome or device safe areas.
- Inconsistent buttons, borders, radii, icon strokes, section spacing and image treatments.
- Drawings cropped to hide essential information, pixelated technical imagery or excessive image enlargement.
- Blank blocks caused by withheld projects, missing portraits or absent articles.
- Intrusive floating controls that overlap the primary CTA or cover content.
- Loading placeholders and skeletons that never resolve or shift the page unexpectedly.

Review actual long content, not only short demo strings. At least one Arabic form-error state and one long project title must be part of the visual review. Improve visual hierarchy and rhythm without changing the logo, replacing the brand palette or rewriting approved business meaning.

## 11. Forms, uploads and delivery reliability

Audit quote, partnership and career submissions end to end in a safe test environment.

- Verify client and server validation, Unicode names, email/phone behavior, selected service IDs and country values.
- Test empty fields, whitespace-only input, long values, Arabic text, pasted text, malformed URLs and invalid file types.
- Check file count, individual size, aggregate size and file-signature rules on the server, not just in the browser.
- Verify private storage, authorized retrieval, quarantine/scanning workflow when configured, safe storage keys and abandoned-file cleanup.
- Test duplicate clicks, refresh during submission, offline mode, slow response, timeout, provider rejection, server field errors and rate limiting.
- Preserve entered text on failure. Remove stale success messages when a new request begins.
- Ensure idempotency/retry behavior prevents duplicate enquiries and attachments.
- Ensure real success means actual receipt at the configured backend; a simulated front-end success is not acceptable.
- Keep test/preview mode unmistakable. If credentials or providers are absent, implement a truthful unavailable/test state and identify the exact dependency.
- Verify the privacy link and required acknowledgement. Do not add an automatic NDA guarantee without a real approved process.
- Do not send live external test emails or submissions without explicit authorization. Use a test inbox/provider adapter and document its limits.
- Validate a career application as receipt only; do not suggest a job offer or promise a response time that is not confirmed.

## 12. Security, privacy and publication controls

Focus on the actual app and its data flows; avoid adding unrelated enterprise infrastructure.

- Inspect client bundles, public environment variables, source maps and logs for credentials or private data. If exposure is found, remove it and report the need for credential rotation without exposing the value.
- Check public build output, HTML, JSON, API responses, RSC payloads, metadata, OG assets, search indexes, sitemaps and downloads for withheld project content.
- Verify direct public URLs cannot access private review records or unapproved originals.
- Keep the original DOCX, XLSX, internal media brief, approval evidence and draft project materials out of public static folders.
- Do not publish invented contacts, metrics, partners, testimonials, certifications, roles, team photos or project-wide responsibility claims.
- Verify founder/BIM Experts history remains distinct from Zentrac's corporate history and direct-client relationships.
- Check output escaping, untrusted rich text, unsafe URLs, open redirects, file paths and form email-header injection risks.
- Review origin/CSRF protections, request limits, rate limiting and server-only secrets appropriate to the framework.
- Review dependency advisories and apply compatible fixes; do not blindly force major upgrades that break the app.
- Configure relevant security headers without breaking required assets or scripts; test a content-security policy before enforcing it broadly.
- Avoid logging full enquiry bodies, CV contents, private document URLs or personal data in error monitoring.
- Check existing analytics/cookie behavior and the approved consent design. Do not silently add a third-party tracker or invent legal compliance claims.

## 13. Code quality and maintainability

- Fix build failures, TypeScript errors, lint errors, hydration mismatches, invalid DOM nesting, unstable keys and unhandled promise rejections.
- Investigate application console errors and failed requests. Classify third-party or environment issues explicitly instead of hiding them.
- Avoid blanket `any`, disabled rules, swallowed exceptions, removed assertions or increased timeouts used to conceal real defects.
- Consolidate duplicated logic for routes, translations, metadata and publication filtering where duplication is causing inconsistency.
- Keep interactive client code scoped; do not convert the entire site into a client component to solve a small issue.
- Remove unused dependencies, dead code and stale placeholder content when the removal is safe.
- Preserve a clear shared design-token and component system.
- Add meaningful regression tests for repaired behavior, especially locale resolution, public-data filtering, form failures and animation lifecycle defects.
- Verify environment documentation and scripts can reproduce the tested result.

Do not perform a framework migration or broad rewrite unless a demonstrated blocking problem makes it necessary. Prefer targeted improvements with clear evidence.

## 14. Essential end-to-end journeys

Run each applicable journey in both English and Arabic:

1. Home → Services → service detail → quote with correct service preselection → invalid submit → corrected test submission → verified test receipt.
2. Direct-open a nested page → change language → reload → Back/Forward → confirm route, language, direction and content remain correct.
3. Open mobile menu → keyboard/touch navigation → close → confirm focus and body scrolling recover.
4. Select infrastructure categories rapidly → use keyboard controls → resize → change locale → verify state and diagram.
5. Scroll the process forward and backward → enter by anchor → enable reduced motion → verify all content remains readable.
6. Filter projects → zero results → clear filters → change locale → open an approved record → open/close gallery.
7. Open an unknown or withheld public URL → confirm correct 404 behavior and usable localized recovery.
8. Begin a form → change locale → verify text preservation and honest file-reselection warning if necessary.
9. Simulate a failed request/offline state → retry → verify no duplicate receipt and no lost description.
10. Visit the site with animation JavaScript unavailable → verify meaningful reading/navigation remains possible.

Where no records are publicly approved, run portfolio journeys using isolated synthetic test fixtures/private preview and explicitly record that the public portfolio remains withheld. Never fabricate approval to make a test pass.

## 15. Verification coverage and evidence

Automate route-level smoke checks for every public EN/AR route. Manually inspect every distinct page family and every repaired critical interaction. Use Chromium, Firefox and WebKit/Safari when available; clearly distinguish emulation from real-device testing.

Keep coverage efficient: run the full defined baseline, verify each repair, and rerun affected/regression checks. Do not endlessly repeat passing tests without a change or unresolved concern.

Produce:

| File | Required contents |
| --- | --- |
| `docs/post-build-audit.md` | Issues, reproduction, fixes, severity and evidence |
| `docs/seo-audit.md` | Route metadata, status, canonical/hreflang, indexing and sitemap findings |
| `docs/animation-enhancements.md` | Original problems, implemented refinements, lifecycle checks, RTL/mobile/reduced-motion behavior |
| `docs/performance-before-after.md` | Actual comparable measurements, build/device conditions and tradeoffs |
| `docs/bilingual-accessibility-qa.md` | EN/AR, bidi, keyboard, screen-reader and responsive coverage |
| `docs/final-release-checklist.md` | Implementation readiness, external dependencies and post-launch checks |

Store screenshots/recordings in a clearly named QA directory and reference them from the reports. Use safe fixtures. Update existing route/content/editing documentation when the implementation changes.

For each reported pass, identify the actual command, browser check or evidence. A screenshot does not prove a form delivered; a green build does not prove RTL; Lighthouse does not prove complete accessibility; local metadata does not prove Google indexing.

## 16. Completion criteria

Finish when:

- All discovered P0 and P1 implementation defects are fixed, or a precisely documented external dependency prevents resolution and the affected feature is handled honestly.
- Important P2 defects and practical P3 polish are addressed without introducing regressions.
- The full site works in both languages, including nested routes, forms and error states.
- SEO metadata and publication/indexing rules are coherent across the actual public routes.
- The hero, infrastructure explorer and Zentrac Track show deliberate visual/motion refinement, with accessible mobile and reduced-motion behavior.
- Enhanced animations do not hide content, trap scrolling, leak event handlers or materially degrade measured performance.
- Forms and uploads have truthful states and verified configured test flows.
- Public output contains no private source material or withheld project data.
- The production build, relevant static checks and meaningful tests pass.
- Reports contain actual findings and evidence rather than unverified “all good” statements.

Do not claim “zero bugs,” guaranteed rankings, full compliance certification or production readiness beyond the evidence. Distinguish implementation complete, public content approved, integrations configured and deployment performed.

## 17. Final response I expect

Lead with what you changed and the most important outcome. Then provide:

1. Critical bugs fixed and the relevant verification.
2. SEO improvements implemented.
3. Specific animation upgrades, with before/after evidence.
4. Arabic/English and RTL/LTR fixes.
5. Performance measurements under comparable conditions.
6. Accessibility, responsive, form and browser testing completed.
7. Paths to the audit reports and local/authorized preview URL.
8. Remaining blockers or owner inputs, with the exact affected feature and safe fallback.

Do the work now. Start by inspecting the running site and repository, establish the baseline, then fix, enhance and verify until the stated scope is complete. Do not stop after writing the plan.

## Technical references to consult when needed

Check current official documentation against the installed versions; use the original project sources for business facts.

- [Google Search Central — localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google Search Central — JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Web Vitals](https://web.dev/articles/vitals)
- [W3C — document direction](https://www.w3.org/International/questions/qa-html-dir)
- [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [GSAP React](https://gsap.com/resources/React/)
- [OWASP file upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
