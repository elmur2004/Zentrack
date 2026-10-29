---
name: zentrac-content-publishing
description: Apply before writing Zentrac business copy, adding statistics, assigning project imagery, or publishing a project, article, download or conditional module.
---

# Zentrac source audit and publishing procedure

1. Check the claim against the sources: F1 `Zentrac_Media_Brief_AR.pdf`, F3 `Zentrac_Media_Register.xlsx` (authority for facts, attribution, metrics, publication state), then F4 copy. Read `docs/content-decisions.md` (C01–C24) and `docs/open-decisions.md`. A blank confirmation cell is not a “yes”.
2. Never publish: company-age counters (“8 years”), project counts, totals of separate package lengths, unverified clash numbers, client logos, testimonials, NDA guarantees, response-time promises, certifications, “zero rework/clash-free/digital twin”. `hasForbiddenText` in `src/lib/content/projection.ts` enforces the common ones.
3. Project/article records live in `private-source/content/`. Publish only after a recorded written approval, field by field (`publication.approvedFields`), images separately (`assets.internal.ts` → optimized file in `public/media`). Owner/developer ≠ direct appointing party.
4. Run `npm run content:project` → `npm run check:content` → `npm run build` → `npm run check:output`. Withheld slugs must stay real 404s (tests in `tests/e2e/routes.spec.ts`).
5. Update `docs/open-decisions.md` (decision, date, scope) and `docs/route-matrix.md`.
