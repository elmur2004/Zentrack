# Design system

Sources: measured tokens from F2 (spec §5.1), proposed supporting tokens (spec §5.1), layout rules (spec §5.4). Implemented in `src/styles/` (Tailwind v4 `@theme` + semantic CSS).

## Colour tokens

| Token | Value | Use | Contrast notes (computed) |
| --- | --- | --- | --- |
| `--color-navy` | `#0B1624` | Hero, dark sections, primary ink | — |
| `--color-orange` | `#FA5211` | CTA fill, accents, active states | Navy on orange ≈ 5.4:1 → buttons use **navy text** |
| `--color-paper` | `#F8F9FA` | Light sections | — |
| `--color-line` | `#E5E7EB` | Dividers | — |
| `--color-navy-2` | `#142337` | Secondary dark surface | — |
| `--color-paper-2` | `#EEF1F4` | Alternate light surface | — |
| `--color-muted` | `#526171` | Secondary text on light | ≈ 6.0:1 on paper |
| `--color-on-dark` | `#E8EEF4` | Text on navy | — |
| `--color-muted-on-dark` | `#B4C0CE` | Secondary text on navy | ≈ 9.8:1 on navy |
| `--color-orange-text` | `#C23A08` | Orange text/links on light | ≈ 5.4:1 on white |
| `#FF7A45` | (inline) | Orange text on navy | ≥ 4.5:1 on navy |

axe (WCAG 2.2 AA tags) reports no serious/critical issues on 28 audited page/locale combinations; Lighthouse accessibility = 100 on every audited page.

## Typography

| Role | English (Saira, variable) | Arabic (IBM Plex Sans Arabic 400/600 + Saira for Latin) |
| --- | --- | --- |
| Hero H1 | `clamp(2.5rem, 1.4rem + 4.8vw, 5.5rem)`, lh 1.04, 600 | `clamp(2.25rem, 1.35rem + 3.9vw, 4.5rem)`, lh 1.3, 700→600 face |
| H1 (inner) | `clamp(2.375rem … 5.25rem)`, lh 1.07 | `clamp(2.125rem … 4.375rem)`, lh 1.32 |
| H2 | `clamp(1.875rem … 3.375rem)` | `clamp(1.75rem … 3rem)`, lh 1.35 |
| Body | 17→18 px, lh 1.65 | 18→19 px, lh 1.85 |
| Small | 14 px | 15 px |
| Eyebrow | 13 px, 0.14em tracking, uppercase | 15 px, no tracking, no case transform |

Rules enforced in CSS: Arabic never gets letter-spacing, uppercase, justification or per-glyph animation (`:lang(ar)` reset). English display headings use −0.018em tracking. Arabic sizes are tuned separately, not shrunk to fit English boxes.

Fonts are self-hosted (`public/fonts`, OFL licences included). Saira covers Latin in both locales; Plex Arabic loads only for Arabic glyphs (`unicode-range`), so English pages download Saira plus one Arabic face for the “العربية” switch label.

## Layout

- Content max 1280 px (+ gutters); wide scenes 1440 px; reading width 46 rem.
- Gutters: 16 px (<360), 20 px, 32 px (≥768), 48 px (≥1024), 64 px (≥1280).
- Section padding `clamp(3rem, 1.6rem + 5.6vw, 8rem)` (48→128 px).
- Breakpoints 640/768/1024/1280/1536; navigation collapses below 1200 px for both locales (Arabic labels fit at 1200+).
- Radii: 6 px controls, 8 px panels, 14 px frames. No pill-shaped controls.
- Logical properties only (`margin-inline`, `inset-inline-start`, `border-inline-start`, `text-align: start`). No `row-reverse` for RTL.

## Brand geometry

- Diagonal cut from the logo reused sparingly: eyebrow tick, orange slash in hero/page heroes, contact-band diagonal, founder panel, CTA corner notch (decorative pseudo-element; the control keeps its full rectangle and focus outline).
- Technical motifs: 48 px grid with radial fade on dark sections, corner crop marks (from the profile’s page corners), numbered rows (01–05), status dots.
- Illustrations are original line/isometric drawings (`TechIllustration`, `HeroScene`, `NetworkSchematic`), labelled illustrative where confusion with a real project is possible.

## Components (selection)

| Component | File | States implemented |
| --- | --- | --- |
| Button / ButtonLink | `components/ui/Button.tsx`, `components.css` | primary, navy, ghost (dark/light/navy), text; hover, focus-visible, active, disabled, pending (forms) |
| Header | `layout/SiteHeader.tsx` | transparent → solid on scroll, desktop nav with active route, services disclosure (keyboard + Escape), mobile modal drawer |
| Language switch | `layout/LanguageSwitch.tsx` | equivalent route, stable-ID query + anchor carry-over, file-loss warning |
| Breadcrumbs | `layout/Breadcrumbs.tsx` | RTL-mirrored separators, JSON-LD |
| Service row | `sections/ServicePreview.tsx` | default, hover/focus-linked illustration, keyboard |
| Explorer | `motion/NetworkExplorer.tsx` | all, one selected, keyboard, reduced motion, no-JS text list (infrastructure page) |
| Track | `motion/ZentracTrack.tsx` | scroll-driven stage, deep link, mobile vertical, reduced motion, print |
| Project card | `sections/ProjectCard.tsx` | image/no image, long names, attribution, focus |
| Gallery dialog | `projects/Gallery.tsx` | open/close, first/last, keyboard (direction-aware), caption, scroll lock, focus restore |
| Form field / upload / submission | `forms/EnquiryForm.tsx` | see `docs/qa-report.md` (all spec §13.3 states) |
| Status pages | `[locale]/not-found.tsx`, `error.tsx`, `global-not-found.tsx` | localized 404, error with retry |

## Logo usage

- `public/brand/zentrac-logo-horizontal-on-dark.png` (header/footer on navy), `…-on-light.png`, `…-stacked-on-dark.png`, `zentrac-symbol-app-icon.png`.
- Header width 120–160 px (fluid). Never mirrored, recoloured by CSS or redrawn. Replace with the vector master when supplied (OD-03).
