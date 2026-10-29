<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Zentrac project rules

1. Read `01_ZENTRAC_WEBSITE_MASTER_PLAN.md` and `02_ZENTRAC_WEBSITE_BUILD_SPEC.md` before structural work; current status is in `docs/task-checklist.md`, owner inputs in `docs/open-decisions.md`.
2. **Bilingual parity:** every user-visible string exists in `src/i18n/messages/en.ts` and `ar.ts` (or as `{ en, ar }` in content). Never ship English inside an Arabic page. Use logical CSS properties; never `row-reverse` for RTL; never mirror the logo, drawings or diagrams; isolate Latin tokens with `<bdi dir="ltr">`; no bidi control characters in content.
3. **Source fidelity:** facts come from F1/F3 (see `docs/content-decisions.md`). Do not invent contacts, metrics, clients, partners, approvals, testimonials, dates or legal terms. Project data lives in `private-source/content/` and reaches the site only through `npm run content:project` (allowlist projection) after a recorded approval. Never import `private-source` or `src/lib/review/*` from public code.
4. **Accessible motion:** content is complete without animation; respect `prefers-reduced-motion`; no scroll hijacking, loops or hover-only content; load GSAP on demand.
5. **Forms are honest:** preview mode never claims a real send; live mode fails closed without a configured provider.
6. Before finishing a change run: `npm run check:locales && npm run check:content && npm run lint && npm run typecheck && npm test`, then `npm run build && npm run check:output` and the relevant `npm run test:e2e` suites. Do not deploy unless the owner asks.
