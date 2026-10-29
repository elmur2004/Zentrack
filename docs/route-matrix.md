# Route matrix

Every route exists in English (`/en`, LTR) and Arabic (`/ar`, RTL) from one shared implementation. Every public response carries the Content-Security-Policy from `src/proxy.ts` (dashboard: per-request nonce). Translation state is enforced by `npm run check:locales` (502 dictionary strings + all bilingual records). Tests: `tests/e2e/routes.spec.ts` (status, `lang`/`dir` in server HTML, one H1, localized title, canonical + hreflang, no raw keys/placeholders, 320 px reflow), `a11y.spec.ts` (axe), plus the feature suites listed.

| Route | Family | EN | AR | Public state | Rendering | Extra coverage | Screenshots (`docs/screenshots`) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/{l}` | Home | ✓ | ✓ | Published | Static | interactions, reduced motion, no-JS, axe | home-en-1440(-full), home-ar-1440(-full), home-en-390, home-ar-390, home-ar-390-motion-reduced, home-ar-320, home-en-1920 |
| `/{l}/about` | About | ✓ | ✓ | Published | Static | axe | about-ar-1440, about-en-390 |
| `/{l}/services` | Services index | ✓ | ✓ | Published | Static | axe | services-ar-1440 |
| `/{l}/services/bim-modelling` | Service detail | ✓ | ✓ | Published | Static | routes | — |
| `/{l}/services/coordination` | Service detail | ✓ | ✓ | Published | Static | locale switch, axe, RTL icons | service-en-1440 |
| `/{l}/services/shop-drawings` | Service detail | ✓ | ✓ | Published | Static | routes | service-ar-390 |
| `/{l}/services/design-review` | Service detail | ✓ | ✓ | Published | Static | cross-browser switch | — |
| `/{l}/services/quantities-as-built` | Service detail | ✓ | ✓ | Published | Static | routes | — |
| `/{l}/infrastructure` | Infrastructure | ✓ | ✓ | Published | Static | explorer, no-JS list, axe | infrastructure-en-1440-water-selected, infrastructure-ar-390 |
| `/{l}/how-we-work` | Zentrac Track | ✓ | ✓ | Published | Static | Track scroll, anchors, no-JS, axe | how-we-work-ar-1440-track |
| `/{l}/clients` | Who We Work With | ✓ | ✓ | Published | Static | axe | clients-en-1440 |
| `/{l}/projects` | Experience index | ✓ | ✓ | Published (capability fallback; 0 approved records); `noindex, follow` and not in the sitemap until the first record is published (OD-29) | Static (ISR) | axe | projects-en-1440-empty-state |
| `/{l}/projects/{slug}` | Case study | template | template | **No public records** → real 404 (tested for `amaala-staff-village-zone-4`, `sedra`) | Static params from public projection only | review build renders all 8 | (review build only, kept out of docs) |
| `/{l}/blog` | Insights index | ✓ | ✓ | Published (empty state; 0 articles); `noindex, follow` and not in the sitemap until the first article (OD-29) | Static (ISR) | axe | blog-ar-1440-empty-state |
| `/{l}/blog/{slug}` | Article | template | template | **No published articles** → 404 (tested `what-is-an-rfi`) | Static params from public projection only | review build renders 6 drafts | — |
| `/{l}/request-a-quote` | Quote form | ✓ | ✓ | Published (form mode from the server environment) | Per request + `/api/enquiries`, `/api/uploads` | forms suite, locale draft, axe | quote-ar-390-errors, quote-en-1440-test-complete, quote-en-1440-upload-states |
| `/{l}/partners` | Partner enquiry | ✓ | ✓ | Published; live submissions go to the dashboard (Partners & careers); the owner can pause the form | Per request + API | forms, axe, admin P1/P4 | partners-ar-1440 |
| `/{l}/careers` | Careers | ✓ | ✓ | Published; live applications and CVs go to the dashboard (private, quarantined); can be paused | Per request + API | forms, axe, admin P2/P4 | careers-en-390 |
| `/{l}/privacy` | Privacy policy | ✓ | ✓ | **Approved** policy, version 2026-10-28 (OD-04) | Static (ISR) | axe, owner-decisions, admin P5 | privacy-ar-1440 |
| `/{l}/<unknown>` (and unknown/withheld slugs) | 404 | ✓ | ✓ | Real 404 status, localized, **server-rendered** (site navigation, recovery links, no canonical) | Proxy rewrites any path not in the route registry (`src/lib/public-routes.ts`, same source as the sitemap) to `/{l}/page-not-found` with status 404; the `not-found` boundary is a backstop | routes (server HTML), journeys J7/J10 | notfound-ar-390 |
| `/` | Entry | → `/en` (307) | | No language sniffing | Proxy | routes | — |
| `/about` etc. (unprefixed) | — | → `/en/about` (307) | | Then 404 if unknown | Proxy | smoke | — |
| `/EN/Services`, `/en/services/`, `/en//services` | Canonical variants | → `/en/services` (308, one hop) | | Lowercase, no trailing or duplicate slash; query kept; dashboard tokens/IDs keep their case | Proxy / Next.js | routes (canonical policy) | — |
| `/sitemap.xml`, `/robots.txt` | SEO | ✓ | | Published routes only, with en/ar/x-default alternates | Static | routes | — |
| `/api/enquiries`, `/api/uploads` | API | — | | POST only | Dynamic (Node) | unit (idempotency, rejection, fail-closed, rate limit) | — |

## Private review build only (`npm run dev:review`, port 3100)

Compiled only when `ZENTRAC_REVIEW=1` (page extension `.review.tsx`); absent from the public build (`npm run check:output` verifies).

| Route | Purpose |
| --- | --- |
| `/{l}/review` | Index: homepage H06 preview with 3 featured cards, draft articles, register-only groups (R03–R09), asset register vs. supplied files, specialist module, profile-download status |
| `/{l}/review/projects` | All 8 withheld records through the real index template, with country/service/sector filters |
| `/{l}/review/projects/{slug}` | Case-study template with facts, scope, gallery dialog, record banner |
| `/{l}/review/blog/{slug}` | Article template for the six drafts |
| `/{l}/review/media/{assetId}` | Serves the 5 extracted images to the review build only (allow-listed IDs) |

## Quote dashboard (private)

Never linked from the public site, not in the sitemap, `noindex` (meta + `X-Robots-Tag`), `Cache-Control: private, no-store`. Every route requires an active member's session (except sign-in and invitation) and enforces the permission policy on the server. Tests: `tests/admin/*.spec.ts` (Chromium, Firefox, WebKit), `tests/unit/admin/*`. Screenshots: `docs/screenshots/admin`.

| Route | Screen | Access |
| --- | --- | --- |
| `/{l}/admin/sign-in` | Sign in (+ two-factor step) | Public page, invitation-only accounts |
| `/{l}/admin/invite/{token}` | Accept invitation | Valid single-use token |
| `/{l}/admin` | Overview (metrics, attention, follow-ups, activity) | Any member (scoped) |
| `/{l}/admin/requests` | Quote requests inbox | Any member (scoped) |
| `/{l}/admin/requests/{id}?tab=…` | Request workspace (overview, files, notes, communication, activity) | Viewers of that request; others 404 |
| `/{l}/admin/queue` | My queue | Any member |
| `/{l}/admin/archive[?view=spam]` | Archived / spam | Any member (scoped) |
| `/{l}/admin/applications[?view=&kind=&status=&page=]` | Partners & careers: partner enquiries and career applications (search text in memory only) | Owner, manager |
| `/{l}/admin/applications/{id}` | Partner/career record: details, CV, status, notes, activity, archive/spam, delete | Owner, manager (delete: owner); others 404 |
| `/{l}/admin/team` | Team & permissions | Owner |
| `/{l}/admin/settings` | Settings: workflow, public contact details, website forms, notifications, templates, retention, integrations status | Owner |
| `/{l}/admin/audit` | Audit activity | Owner (all), manager (operational) |
| `/{l}/admin/account` | Your account (2FA, password, devices) | Any member |
| `/{l}/admin/<unknown>` | Dashboard 404 (after sign-in) | — |

| API | Purpose |
| --- | --- |
| `/api/auth/*` | Better Auth (sign-in, two-factor, sign-out, password change); fails closed without a secret |
| `POST /api/admin/requests` | Inbox query (search text in the body, never the URL) |
| `GET /api/admin/files/{id}?token=…` | Private file delivery (60 s token bound to user + session, re-checked) |
| `POST /api/admin/export` | CSV export (preview count or download) |
| `POST /api/admin/proposals` | Proposal PDF upload |
| `POST /api/jobs/run` | Scheduler entry (Bearer `JOBS_RUNNER_TOKEN`; 404 when unset) |

Public pages are prerendered and regenerated at most every 5 minutes (ISR), and immediately after the owner saves public settings in the dashboard (contact details, form switches). The partner and career submissions use the same endpoints as quote requests (`POST /api/enquiries`, `POST /api/uploads` for CVs).
