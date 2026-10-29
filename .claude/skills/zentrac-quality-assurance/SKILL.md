---
name: zentrac-quality-assurance
description: Apply at the end of any Zentrac implementation change and before handoff or release.
---

# Zentrac QA procedure

Run and record real output (never “looks fine”):

```bash
npm run check:locales && npm run check:content && npm run lint && npm run typecheck && npm test
FORM_MODE=preview npm run build && npm run check:output
npx playwright test --project=chromium                      # routes, locale, forms, axe, interactions
npx playwright test --project=firefox --project=webkit --project=mobile-webkit
npx playwright test --project=screenshots                   # refresh docs/screenshots
node scripts/lighthouse.mjs http://localhost:3005 /en /ar --runs=3   # with `next start -p 3005` running
node scripts/measure-vitals.mjs http://localhost:3005 /en /ar
```

Also check by hand when the change touches UI: keyboard-only path, 200 % zoom, 320 px reflow in Arabic, reduced motion, no-JS. Fix critical defects before cosmetic ones; never lower a threshold to pass. Update `docs/qa-report.md` with commands, environment, results and remaining defects.
