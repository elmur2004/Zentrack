# Task checklist (phase status)

Status as of 28 October 2026. Resume from this file and `docs/open-decisions.md` if context is lost.

| Phase | Status | Evidence | Next dependency |
| --- | --- | --- | --- |
| P0 Inspect | done | `docs/source-inventory.md`; all 15 + 17 + 14 PDF pages rendered and viewed; 5 sheets dumped with cell refs; DOCX extracted | — |
| P1 Reconcile | done | `docs/content-decisions.md` (24 conflicts), `docs/open-decisions.md` (20 items), public/private content model (`src/lib/content/*`, `private-source/content/*`) | Owner answers (OD list) |
| P2 Foundations | done | Locale routes, server-side `lang`/`dir`, dictionaries with type-enforced parity, tokens, self-hosted fonts, header/footer, buttons/inputs | — |
| P3 Vertical slice | done | Homepage EN/AR × desktop/mobile screenshots (`docs/screenshots/home-*`); critique: logo, navy/orange balance, technical geometry and motion concept verified before expanding | — |
| P4 Full content | done | 17 page families × 2 locales, 5 service pages, project/article templates, filters, fallbacks, privacy template, localized 404/error (`docs/route-matrix.md`) | Approved records/articles (OD-07, OD-18) |
| P5 Signature motion | done | Hero assembly, explorer, Track + secondary motion; reduced-motion/no-JS/mobile variants tested (`docs/motion-storyboard.md`) | — |
| P6 Forms | done (local) | Quote, partner, careers; shared Zod schema; enquiry/upload endpoints; preview adapter; idempotency; signature checks; all states | Provider + storage + policy (OD-04/05/06) |
| P7 Search and polish | done | Localized metadata, canonical + hreflang, sitemap, robots, JSON-LD (Organization, BreadcrumbList, Service), OG images EN/AR, icons | Production origin (OD-01) |
| P8 QA | done | `docs/qa-report.md`: 45 unit + 117 e2e (Chromium, Firefox, WebKit, iPhone 13 emulation) passing, axe 28 pages, Lighthouse medians, throttled vitals, output audit | — |
| P9 Handoff | done | README, docs set, screenshots, scripts, AGENTS.md rules | Owner review; release when instructed |
| D1 Dashboard: data + auth | done | PostgreSQL schema + migration (26 tables), Better Auth (TOTP, DB sessions, rate limits), policy module, owner bootstrap | Verified owner, database, secret (OD-21–23) |
| D2 Dashboard: intake | done | Quote form → durable record (idempotent, upload-session binding, private quarantined files, notification jobs) | — |
| D3 Dashboard: workspace | done | Overview, inbox, detail tabs, queue, archive/spam, team, settings, audit, account; EN/AR RTL | — |
| D4 Dashboard: QA + docs | done | `docs/admin-qa-report.md`: 82 unit/integration, 24 dashboard browser journeys (3 browsers; Chromium set also on PostgreSQL 17.9), 146 public e2e; `docs/admin-*.md`, `docs/quote-workflow.md`, screenshots | SMTP, scanner, retention (OD-24–27) |
| A1 Post-build audit (03) | done | Issue register `docs/post-build-audit.md` (fixed: 2 P1, 11 P2, 5 P3 — server-rendered 404s, lost Send click, CSP, canonical casing, forced-colours focus, scrollable register, focus timing, motion and performance fixes; PERF-01 partly; DEP-01 accepted); reports: SEO, animation, performance, bilingual/accessibility, release checklist; evidence `docs/qa/before` vs `docs/qa/after`; 93 unit, 196 public e2e, 25 dashboard e2e, 4 review e2e | Mobile Lighthouse medians below 90 on some pages (documented); owner inputs OD-01–OD-29 |
| O1 Owner decisions (28 Oct) | done | Privacy policy approved (v2026-10-28) with enforced retention; partner/career forms → dashboard (Partners & careers, private CVs); contact details edited in the dashboard (ISR refresh); no 2FA requirement; delegated decisions OD-06/09/10/15–20/22/25/27/29 implemented; English (42) and Arabic (65) review findings applied and copy approved; migration 0001; 114 unit/integration, 199 public e2e, 30 dashboard e2e, 4 review e2e | Domain, PostgreSQL, auth secret/HTTPS, verified owner, SMTP; project permissions (OD-07/08) |

Remaining work is external input, not implementation: see `docs/open-decisions.md`. Known implementation gap: homepage Lighthouse mobile performance 76–84 (aim ≥ 90) — see `docs/qa-report.md` § Performance.
