# Zentrac website master plan for Antigravity

Version 1.0 · 27 October 2026 · English and Arabic · Implementation handoff

## 1. Start here

Build a complete, modern, bilingual website for Zentrac, an engineering and BIM consultancy. The design must extend the supplied Zentrac brand: deep navy, orange, Saira typography, architectural spacing, diagonal accents, and clear technical illustrations. The experience should feel precise, confident, and contemporary. Arabic must receive the same design and engineering attention as English.

This document explains **how to execute the work**. The companion `02_ZENTRAC_WEBSITE_BUILD_SPEC.md` defines **what to build**, including page content, design tokens, motion choreography, RTL/LTR behavior, forms, data models, publication controls, and acceptance tests. Read both completely before implementation. The five supplied source files will be in the IDE workspace; discover their actual paths instead of assuming a particular operating system.

The deliverable for the IDE is a functioning local website and a tested handoff. Do not stop after generating a wireframe, homepage, implementation plan, or attractive screenshot. Complete the route system, both locales, responsive behavior, usable interactions, and verification. Missing business information should be recorded and handled with the specified fallback; it should not prevent independent design or development work.

### Copy this into the Antigravity agent

```text
Read 01_ZENTRAC_WEBSITE_MASTER_PLAN.md and
02_ZENTRAC_WEBSITE_BUILD_SPEC.md in full, then inspect all five source
files named in the specification, including their page images and Excel
worksheets. Discover their real paths in this workspace.

Execute this plan to build the complete Zentrac website in English and
Arabic. Preserve the brand, implement genuine RTL/LTR behavior, and build
the signature infrastructure hero, network explorer, and Zentrac Track
with the specified accessible motion fallbacks.

First inspect any existing application, package manager, repository rules,
and available skills. Reuse sound existing foundations. Create a concise
task checklist, source inventory, conflict register, and content model.
Then implement and verify the site phase by phase. Produce a polished
English-and-Arabic homepage vertical slice early, and continue through
the complete scope without waiting for approval of routine choices.

Separate internal source records from public content. Follow the supplied
media brief and register when they qualify marketing claims. Build all
project templates and internal previews; publish only permitted records
and assets. Do not invent contacts, metrics, approvals, testimonials,
partners, office/team photos, legal terms, or submission success.

Use the project skill blueprints in the master plan as execution guides;
create workspace skills only where supported by this IDE installation.
If a skill or tool is unavailable, perform its procedure directly and
record the limitation. Do not claim to have installed or used a capability
that does not exist.

Run the actual app, inspect both locales in a browser, test navigation and
forms, test reduced motion and keyboard operation, and fix defects.
Deliver the working local site, source code, commands, screenshots,
test evidence, editing instructions, and a precise launch-blocker list.
Do not deploy publicly or connect paid services during this local build.
```

## 2. Decisions already made

| Topic | Decision |
| --- | --- |
| Languages | Complete English and Modern Standard Arabic, including metadata, errors, forms, empty states, and accessibility labels |
| Locale routes | `/en/...` and `/ar/...`; shared stable content IDs; default `/` redirects to `/en` |
| Direction | English LTR; Arabic RTL; logical CSS properties and explicit isolation for mixed-direction content |
| Visual identity | Use the Zentrac profile as the brand anchor, not the colors or logos of the inspiration sites |
| Primary conversion | Request a Quote; secondary conversions are service exploration and project enquiry |
| Scope | All supplied page families, five service detail pages, project/article templates, forms, legal template, localized errors |
| Motion | Purposeful engineering sequences with a native-scroll baseline; no mandatory WebGL or scroll hijacking |
| Content | Source-backed, typed, bilingual local content; no CMS required for version one |
| Default stack for an empty workspace | Next.js App Router, TypeScript, Tailwind CSS, GSAP with `@gsap/react`, local content, Zod, Playwright, axe |
| Existing app | Keep a suitable existing stack and implement equivalent requirements; document changes instead of migrating unnecessarily |
| Project evidence | Founder/BIM Experts experience, with package boundaries; not automatically Zentrac corporate achievements |
| Unknowns | Track in `docs/open-decisions.md`; implement defined fallbacks |
| Public release | A separate step after the local build, content review, operational configuration, and owner instruction |

Versions are intentionally not hardcoded here. Inspect the existing lockfile; for a new project choose mutually compatible stable releases from official documentation, then pin and record the installed versions. Do not use prerelease dependencies merely to appear modern.

## 3. Workspace setup

1. Identify the repository root, existing app, Node/package-manager version, lockfile, scripts, and any project instructions. Do not overwrite unrelated work.
2. Locate the five originals by filename and file type. Support Unicode filenames, spaces, and the mockup file's doubled `.pdf.pdf` extension.
3. Keep originals outside the site's public/static directory. Do not rename or modify them in place.
4. Extract text and images into a private working directory. Record page numbers, worksheet names, cell references, and asset identifiers.
5. Render the PDFs. The mockups are primarily raster layouts: text extraction alone is insufficient. Inspect all 14 mockup pages and the company profile's visual system.
6. Read all five Excel sheets: `Projects`, `Questionnaire`, `Assets`, `Metrics`, `Decisions`. Preserve cell meanings, blank confirmation fields, formulas, and publication status. A blank confirmation field is not a “yes.”
7. Create the public content model separately from the full source inventory. Source originals, internal notes, and unapproved imagery must never be copied wholesale into a public bundle.
8. Use a Git branch/checkpoint if the repository already uses Git. Make small, reviewable changes. Do not reset existing changes.

### Working files the IDE should produce

| Path | Purpose |
| --- | --- |
| `docs/source-inventory.md` | File inventory, page/sheet references, extraction results, actual/missing assets |
| `docs/content-decisions.md` | Conflicts between sources and the chosen accurate wording |
| `docs/open-decisions.md` | Owner inputs needed, affected feature, fallback, launch impact |
| `docs/design-system.md` | Measured brand tokens, bilingual typography, component behavior |
| `docs/motion-storyboard.md` | Scene states, timing, scroll triggers, RTL behavior, static variants |
| `docs/route-matrix.md` | Every EN/AR route, translation state, publication state, screenshot/test coverage |
| `docs/asset-manifest.json` | Source, dimensions, rights status, usage, derivatives, alt text |
| `docs/qa-report.md` | Commands, environment, results, real measurements, remaining defects |
| `docs/content-editing.md` | How to edit both locales, add assets, publish a case study, and validate |
| `docs/deployment.md` | Host requirements, environment variables, build, rollout, rollback |
| `README.md` | Setup, development, verification, content model, local preview instructions |
| `.env.example` | Names and descriptions only; no credentials |

Paths in this table are planned outputs, not files claimed to exist in this handoff.

## 4. Skills and capabilities

The following are **project-specific skill blueprints**, not names of preinstalled products or a claim that marketplace skills exist. Use an equivalent installed skill when it fits; otherwise create a focused local skill from the blueprint or follow it directly. These procedures can be executed by one agent. Multiple agents are optional and are not a prerequisite.

Antigravity's documentation checked for this handoff lists workspace skills at `.agents/skills/<skill-folder>/SKILL.md` and workspace rules in `AGENTS.md` or `GEMINI.md`. Confirm the installed IDE's supported paths and Customizations list before relying on automatic discovery. Do not write duplicate competing rule systems. [Official skills documentation](https://antigravity.google/docs/skills/) · [Official rules documentation](https://antigravity.google/docs/rules/).

### Skill blueprint 1 — zentrac-source-audit

**Trigger:** Before writing business copy, assigning project imagery, introducing statistics, or changing publication status.

**Inputs:** Five supplied originals, build specification, current content records.

**Procedure:** Inventory actual files; extract DOCX text/tables; inspect PDF page images; read workbook records by their stable IDs; distinguish a source reference from a file actually present. Compare copy/profile against the media brief and register. Record conflicts with exact page/cell references. Build a fact table separating company facts, founder history, project scope, and unresolved claims. Link extracted images to an asset record without treating appearance in a PDF as permission.

**Outputs:** Source inventory, conflict log, typed project records, asset manifest, unresolved inputs.

**Done when:** Every public factual claim has a source or is explicitly proposed copy; every project and image has a publication state; no unverified number has been promoted into an achievement.

**Failure response:** Use the safe factual fallback in the specification. Report inaccessible or missing source assets precisely; do not invent them.

### Skill blueprint 2 — zentrac-brand-and-interface

**Trigger:** Creating layouts, tokens, icons, image framing, or reusable UI.

**Inputs:** Profile, mockups, inspected references, verified logo, source-audit output.

**Procedure:** Extract the profile palette and Saira typography; establish contrast-safe semantic colors; design the hero, a service row, the network explorer, and a project card as one visual family. Build English and Arabic side by side. Use the original logo at correct proportions. Verify the first desktop and mobile screens before extending the rest of the site. Treat mockups as content architecture, not a ceiling on visual quality.

**Outputs:** Tokens, component inventory, two-locale homepage slice, design-system notes.

**Done when:** The result is recognizably Zentrac, has a distinctive technical visual language, and reads well at 360px and 1440px in both languages.

### Skill blueprint 3 — zentrac-bilingual-rtl

**Trigger:** Any route, component, copy, form, motion, or metadata change.

**Inputs:** Dictionaries, glossary, route map, bidi fixtures, build specification §6.

**Procedure:** Establish `lang` and `dir` before first paint; use locale-neutral content IDs; preserve equivalent-page switching; implement logical CSS; isolate Latin tokens; adapt icons selectively; check Arabic shaping and line height; translate all states; test language switching during filters and an unfinished form. Compare semantic DOM order with visual order and tab order.

**Outputs:** Locale dictionaries, glossary, route resolver, direction utilities, automated and visual regression coverage.

**Done when:** Every routable page and state exists in both languages; there are no raw keys, broken Arabic connections, double-mirrored layouts, or reversed identifiers.

### Skill blueprint 4 — zentrac-motion-engineering

**Trigger:** Implementing any animation or scroll-linked scene.

**Inputs:** Motion storyboard, static UI, layout dimensions, reduced-motion preference.

**Procedure:** Define final static state first. Implement the hero assembly, network interaction, and track with scoped timelines. Keep content readable while animation loads. Separate transform owners. Clean up on unmount, direction changes, and breakpoint changes. Test normal motion, reduced motion, rapid scrolling, back/forward navigation, resizing, and keyboard use. Profile on a throttled mobile browser.

**Outputs:** Motion tokens, reusable reveal/scene primitives, three signature sequences, static alternatives.

**Done when:** Motion supports the story, does not delay reading or interaction, survives locale changes, and adds no persistent scrolling or focus defect.

### Skill blueprint 5 — zentrac-content-and-search

**Trigger:** Adding services, projects, articles, SEO data, or publishing records.

**Procedure:** Validate EN/AR field parity; use accurate engineering language; keep scope and attribution visible; derive public pages from allowed fields only. Generate localized titles, descriptions, canonical URLs, hreflang, sitemap, and schema from the same route registry. Exclude draft content and unavailable downloads. Review technical articles against primary sources before publication.

**Outputs:** Publishable content projection, metadata, sitemap, article templates, editing guide.

**Done when:** Direct URLs, listings, metadata, previews, and public data all agree on what is published.

### Skill blueprint 6 — zentrac-forms-and-delivery

**Trigger:** Quote, partnership, contact, career, or upload implementation.

**Procedure:** Build client/server validation from one schema; implement localized field and transport errors; establish explicit pending/uploading/submitting/received/failed states. Provide a real provider adapter or an unmistakable local test adapter. Keep files private; validate signatures and quotas; use idempotent submission; record durable receipt before reporting success. Test offline, double click, oversized files, rejected files, and provider failure.

**Outputs:** Forms, endpoint contracts, provider adapter, test fixtures, environment configuration.

**Done when:** A successful test proves receipt at the configured destination; failure preserves entered text; absent configuration cannot pretend to send.

### Skill blueprint 7 — zentrac-quality-assurance

**Trigger:** End of each implementation phase and before handoff.

**Procedure:** Run build/type/lint checks, route and localization tests, content publication checks, browser journeys, accessibility scans, and visual inspection. Exercise both locales on desktop and mobile. Test keyboard-only use, 200% zoom, 320px reflow, reduced motion, missing assets, empty collections, and slow network. Record actual evidence and fix critical defects before cosmetic polish.

**Outputs:** Reproducible QA report and named screenshots linked to route/locale/viewport/state.

**Done when:** All release gates in the specification pass or a narrowly stated external blocker remains; never substitute “looks fine” for execution evidence.

### Skill blueprint 8 — zentrac-release-and-handoff

**Trigger:** Local build complete; preparing delivery or an explicitly requested release.

**Procedure:** Audit the built output for drafts and source files; confirm production variables and real endpoints; document content editing; list unresolved inputs by severity; prepare rollback and preview protections. Package the local project without credentials, `node_modules`, or private uploads. Deploy only when separately instructed.

**Outputs:** README, editing guide, deployment guide, version record, release checklist.

**Done when:** Another developer can run, maintain, translate, and deploy the project without guessing.

### Example skill manifest shape

This is a blueprint to adapt in Antigravity, not an installed skill in this deliverable:

```md
---
name: zentrac-bilingual-rtl
description: Apply when creating or changing any Zentrac route, component, form, animation, or metadata in English or Arabic.
---

# Zentrac bilingual interface procedure

Read the bilingual requirements in 02_ZENTRAC_WEBSITE_BUILD_SPEC.md.
Identify the component's locale-neutral content ID and both translations.
Implement document direction, logical layout, mixed-text isolation, and
selective icon direction. Verify both locales at desktop and mobile sizes.
Run locale-key and route-parity tests. Record screenshots and defects in
docs/qa-report.md. Do not mark complete while a locale or error state is missing.
```

Keep a root rules file short: instruct the agent to read the two handoff files, preserve bilingual parity and source fidelity, maintain accessible motion, and run checks. Keep lengthy procedures in focused skills and documentation instead of injecting the entire specification into every rule.

### Tools needed

| Capability | Suitable tools | Required fallback |
| --- | --- | --- |
| Read originals | PDF renderer/extractor, DOCX reader, XLSX reader | Local libraries such as PyMuPDF, python-docx, openpyxl; inspect visuals too |
| Implement app | Terminal, package manager, TypeScript, editor | Preserve compatible installed tooling |
| Inspect references | Browser screenshots and interactions | Record unavailable references; never fabricate observed animations |
| Verify current APIs | Official framework/library documentation | Use a trusted docs MCP if installed; ordinary official docs also work |
| Browser QA | Playwright and browser devtools | Manual equivalent with documented limitations |
| Accessibility | axe plus keyboard/screen-reader inspection | Automated scans alone are insufficient |
| Performance | Lighthouse/devtools and later field data | Report test conditions; do not invent scores |
| Asset processing | Image optimizer and SVG tooling | Keep source fidelity; do not AI-redraw the logo or actual engineering evidence |

Do not install a long list of MCP servers without a concrete need. Filesystem, terminal, browser, and official documentation are sufficient for the core build. Email delivery, storage, analytics, and deployment require explicitly configured providers; their absence must not block static design work.

## 5. Execution phases and completion gates

| Phase | Work | Depends on | Completion evidence |
| --- | --- | --- | --- |
| P0 — Inspect | Repository and tool audit; inventory originals; read every source; capture reference observations | None | Source inventory and confirmed constraints |
| P1 — Reconcile | Claims, asset status, contact gaps, service distinctions, translation glossary | P0 | Content decisions and public/private data model |
| P2 — Foundations | Routes, locale dictionaries, root direction, tokens, fonts, header/footer, button/input primitives | P1 | EN/AR shell works on reload and navigation |
| P3 — Vertical slice | Homepage hero, one service preview, network explorer skeleton, contact CTA; mobile versions | P2 | Four key screenshots: EN/AR × desktop/mobile |
| P4 — Full content | All page families, service details, project/article templates, filters, fallbacks, legal template | P3 | Route matrix with both locales complete |
| P5 — Signature motion | Hero assembly, network explorer, Zentrac Track, restrained secondary motion | Stable layouts | Normal/reduced-motion browser recordings or observations |
| P6 — Forms | Quote, partner enquiry, careers; upload pipeline and delivery adapter | P2/P4 | Success and failure journeys; honest local test mode |
| P7 — Search and polish | Metadata, schema, sitemap, images/fonts, complete Arabic editorial pass | P4–P6 | SEO and content validation reports |
| P8 — QA | Bidi, keyboard, responsive, browser, motion, performance, public-output audit | P7 | Passing checks and real defect resolutions |
| P9 — Handoff | Documentation, source package, screenshots, launch checklist, owner decisions | P8 | Reproducible local build and precise remaining blockers |

Build the static content before animating it. Build the Arabic foundation before completing all English pages. Complete a distinctive homepage before multiplying its components. Do not defer translation or RTL quality to a final cosmetic pass.

### Phase checkpoints

After every phase, update the task list with `done`, `in progress`, `blocked`, or `not started`. Record files changed, evidence, and next dependency. If a test fails, fix the cause; do not lower the acceptance threshold. If context is lost, resume from these files instead of re-planning the project from scratch.

At P3, critique whether the result looks like Zentrac or a generic template. Check the logo, orange/navy balance, technical geometry, whitespace, typography, and meaningful animation concept. Revise before expanding.

## 6. Critical launch inputs and safe progress

| Missing input | Implement now | Gate for live release |
| --- | --- | --- |
| Current email, phone, WhatsApp, LinkedIn | Configurable fields; omit unknown links | Verified destinations before exposing those channels |
| Production domain | Environment-driven URL builder; local URLs | Correct origin before sitemap/canonical release |
| Current service capacity and specialist partners | Five core service templates; conditional partner-services module | Confirm service claims; omit unconfirmed specialist claims |
| Project names, roles, images and permissions | Private review records and complete templates | Per-record disclosure and attribution review |
| Founder portrait | Designed typographic founder panel | Confirmed identity and permitted image before portrait publication |
| Public company profile | Download component with availability state | Public-approved PDF; existing profile contains unresolved items |
| NDA wording and procedure | Contact-first flow; no blanket NDA promise | Approved wording and process before contractual assurances |
| Quote turnaround | No numerical promise | Confirmed operational SLA before adding one |
| Privacy/retention policy | Styled bilingual legal template | Approved policy and provider/retention details before collecting real submissions |
| Email/storage backend | Adapter interface and explicit test implementation | Real receipt, access control, and file handling verified |
| Articles | Six proposed topics and full article template | Reviewed content, author/byline decision, and real dates |

Most gaps do not block a polished local build. They may block a particular public module, real collection of personal information, or release. Keep this distinction visible in the handoff; never claim the site is fully launch-ready while these dependencies remain unresolved.

## 7. Definition of done

- All specified page families and five service pages are implemented in English and Arabic.
- Both locales work when entered directly, reloaded, linked, and switched from a nested page.
- The logo and measured brand colors are respected; Arabic typography is designed and legible.
- The three signature interactions work with static/reduced-motion/mobile alternatives.
- No unapproved project information or original source documents leak into public output.
- Forms validate and have honest delivery states; test mode is unmistakable.
- Navigation, filters, downloads, dialogs, error pages, focus, and keyboard interactions work.
- The production build, type checks, linter, critical tests, and publication checks pass.
- Responsive, accessibility, and performance findings include actual evidence.
- Documentation explains setup, editing, translations, assets, testing, deployment, and rollback.
- Remaining external decisions are specific, assigned, and separated from implementation defects.

## 8. Suggested final response from the IDE

Report the working local URL, implementation scope, how to run it, actual checks performed, location of screenshots and docs, and any unresolved launch inputs. Explicitly distinguish functional local preview, configured production functionality, and content withheld from public output. Do not report tests that were not run or a deployment that was not performed.

## 9. Sources and reading order

1. This master plan.
2. `02_ZENTRAC_WEBSITE_BUILD_SPEC.md`.
3. The five source files, with precedence explained in the specification.
4. Official technical documentation linked in the specification, checked against the installed versions.

The design and engineering procedures above are proposed specifically for this project. They are not quoted marketplace skill descriptions, and they do not imply that any tools or plugins have already been installed.
