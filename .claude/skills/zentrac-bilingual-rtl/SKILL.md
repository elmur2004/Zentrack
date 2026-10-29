---
name: zentrac-bilingual-rtl
description: Apply when creating or changing any Zentrac route, component, form, animation, or metadata in English or Arabic.
---

# Zentrac bilingual interface procedure

1. Identify the locale-neutral ID (route in `src/i18n/routes.ts`, content ID, or dictionary key) and write complete messages in both `src/i18n/messages/en.ts` and `ar.ts` (or `{ en, ar }` content). Use `{placeholders}` + `fmt()`/`<Rich>`; never concatenate fragments. Arabic terms follow the glossary in `02_ZENTRAC_WEBSITE_BUILD_SPEC.md` §6.6.
2. Layout with logical properties only (`margin-inline`, `inset-inline-start`, `text-align: start`). Do not add `row-reverse` for RTL. Mirror only semantic direction icons (`ArrowIcon`, `CrumbIcon` carry `icon-dir`); never the logo, drawings, diagrams or technical symbols.
3. Isolate Latin tokens that touch punctuation (`+20`, `https://`, `RFI-024`) with `<bdi dir="ltr">`. Inputs: email/phone/URL `dir="ltr"`, free text `dir="auto"`.
4. Arabic typography: no letter-spacing, uppercase or per-glyph animation; give Arabic its own sizes/line-heights (`:root[dir='rtl']` overrides in `src/styles/base.css`).
5. Verify: `npm run check:locales`, `npm run typecheck`, then both locales at 390 px and 1440 px (`node scripts/screenshots.mjs`), and `npx playwright test tests/e2e/routes.spec.ts tests/e2e/locale.spec.ts`.
6. Do not mark complete while a locale, error state or metadata string is missing.
