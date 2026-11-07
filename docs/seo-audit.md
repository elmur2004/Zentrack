# Technical SEO audit (03 §4–§5)

Route-by-route technical audit of the production build (`next start`, port 3005, `SITE_URL` unset → local origin). Crawl: `node scripts/audit-crawl.mjs http://localhost:3005 docs/qa/after/crawl.json` (real Chromium; follows every public link from `/en` and `/ar`; never visits the dashboard, which no public page links to). No URL was submitted to an external validator or search service: the site is not public and no Search Console access exists (OD-01, OD-28). Nothing here promises indexing, rankings or rich results.

## Results at a glance

| Check | Result |
| --- | --- |
| Reachable public pages | 34 (17 per locale), all **200**, 1 H1 each, no skipped heading levels |
| Console errors / failed requests | 0 / 0 (router-cancelled prefetches of per-request form pages are excluded — NOTE-01) |
| Titles / descriptions | All present, localized, unique; no placeholders or raw keys (table below) |
| Canonical | Self-referencing on every page, path without query; production origin from `SITE_URL` only |
| hreflang | `en`, `ar` and `x-default` (= English, consistent with `/` → `/en`) on every page, reciprocal |
| robots | Public pages indexable, except the empty Projects and Insights index pages (`noindex, follow` until the first publication, OD-29, 28 Oct 2026); dashboard/auth/jobs send `X-Robots-Tag: noindex, nofollow, noarchive` |
| Structured data | Valid JSON on every page: Organization (all), BreadcrumbList (inner pages), Service (5 service pages); Article only for published articles (none) |
| Open Graph / Twitter | Complete on every page: localized title/description, per-locale 1200 × 630 image, `og:locale` en_GB / ar_AR + alternate |
| Images | 0 missing `alt`, 0 broken images; decorative SVGs `aria-hidden` |
| 404 behaviour | Unknown pages, unknown service slugs, withheld projects and draft articles return **404** with a server-rendered localized page (fixed — BUG-01) |

## Rendering and HTTP behaviour

- Marketing pages are prerendered (SSG); quote, partners and careers render per request (their form mode is read at runtime). All meaningful copy, headings, navigation links and metadata are in the initial HTML; no copy depends on scrolling, hover or an animation finishing (the hero copy is opaque from the first paint; reveal effects never hide content that is visible on load and are disabled with reduced motion or without JavaScript).
- Navigation uses real `<a href>` links (footer navigation works without JavaScript — journey J10).
- No redirect chains: every variant reaches its canonical URL in one hop.
- **Canonical URL policy** (implemented in `src/proxy.ts`, tested in `tests/e2e/routes.spec.ts`):

| Request | Response |
| --- | --- |
| `/` | 307 → `/en` (explicit default; no Accept-Language/geo/cookie redirect) |
| `/about` (no locale) | 307 → `/en/about` (query dropped) |
| `/EN`, `/en/Services`, `/AR/Services/Coordination?ref=x` | 308 → lowercase URL (query kept) — was a redirect to a 404 / a 404 before (SEO-01) |
| `/en/services/`, `/en//services`, `//en/services` | 308 → `/en/services` (Next.js) |
| `/en/services?utm_source=x` | 200, canonical `/en/services` (tracking parameters never create indexable duplicates) |
| `/en/projects?type=…` (filters) | 200, canonical `/en/projects`; filters stay in the URL for sharing but are not separately indexable |
| unknown page or slug | 404, localized, server-rendered, no canonical/hreflang |
| `/en/admin/...` | sign-in redirect for visitors; `noindex` headers; case-sensitive tokens/IDs untouched |
| Host and protocol (http → https, apex vs `www`) | To be configured at the host/CDN (deployment step); the app cannot see the public host before launch |

- **Production origin:** canonical, hreflang, sitemap and OG URLs come only from `SITE_URL`. It is unset locally, so they use `http://localhost:3000`; `npm run check:release` fails on that by design (OD-01). No invented Zentrac domain appears anywhere.

## Titles, descriptions and page intent

| Path | Status | Title | Description (chars) | JSON-LD |
| --- | --- | --- | --- | --- |
| `/en` | 200 | Zentrac — Engineering and BIM Consultancy | BIM modelling, coordination and shop drawings for infrastructure, landscape and building projects. Founded in Cairo in 2026, building on founder experience since 2018. (167) | Organization |
| `/ar` | 200 | زينتراك — استشارات هندسية ونمذجة معلومات البناء | نمذجة معلومات البناء والتنسيق وإعداد المخططات التنفيذية لمشروعات البنية التحتية وتنسيق المواقع والمباني. تأسست في القاهرة عام 2026 استنادًا إلى خبرة مؤسسها منذ 2018. (165) | Organization |
| `/en/about` | 200 | About Us · Zentrac | Zentrac is an engineering and BIM consultancy in Cairo, founded in 2026 by civil engineer Mark Mofreh, whose roads and infrastructure experience began in 2018. (159) | BreadcrumbList, Organization |
| `/en/services/bim-modelling` | 200 | BIM Modelling · Zentrac | We build 3D models for infrastructure, landscape and building projects according to your BIM Execution Plan (BEP) and the agreed level of development (LOD), up to LOD 400 where the scope requires it. (199) | BreadcrumbList, Service, Organization |
| `/en/services/coordination` | 200 | Coordination · Zentrac | We combine discipline models into one federated model, run clash detection and track each issue until it is resolved by the responsible party. (142) | BreadcrumbList, Service, Organization |
| `/en/services/shop-drawings` | 200 | Shop Drawings · Zentrac | We produce shop drawings and combined services drawings from the coordinated model, prepared for consultant review. (115) | BreadcrumbList, Service, Organization |
| `/en/services/design-review` | 200 | Design Review · Zentrac | We review design drawings before modelling starts and send any missing or conflicting information back as RFIs. (111) | BreadcrumbList, Service, Organization |
| `/en/services/quantities-as-built` | 200 | Quantities and As-built · Zentrac | We prepare quantity take-offs from the model, support the site during construction and update models to as-built status within the agreed scope. (144) | BreadcrumbList, Service, Organization |
| `/en/services` | 200 | Services · Zentrac | Five Zentrac services: BIM modelling, coordination, shop drawings, design review, and quantities and as-built models. Hire us for one service or the full agreed scope. (167) | BreadcrumbList, Organization |
| `/en/infrastructure` | 200 | Infrastructure BIM · Zentrac | Modelling and coordination across eleven infrastructure categories, from water, sewerage and stormwater to power, street lighting, roads, landscape and canals. (159) | BreadcrumbList, Organization |
| `/en/how-we-work` | 200 | How We Work — The Zentrac Track · Zentrac | The Zentrac Track: review, model, coordinate, drawings, quantities and site support. Start at the stage you need, for one package, one network or the full agreed scope. (168) | BreadcrumbList, Organization |
| `/en/projects` | 200 | Selected Experience · Zentrac | Selected experience of Zentrac’s founder and his former practice, BIM Experts, with the exact scope of each package. (116) | BreadcrumbList, Organization |
| `/en/blog` | 200 | Insights · Zentrac | Articles on BIM modelling, coordination and infrastructure from Zentrac. (72) | BreadcrumbList, Organization |
| `/en/request-a-quote` | 200 | Request a Quote · Zentrac | Send Zentrac your project details for BIM modelling, coordination, shop drawings, design review or quantities and as-built support. (131) | BreadcrumbList, Organization |
| `/en/clients` | 200 | Who We Work With · Zentrac | How Zentrac supports developers and owners, contractors and engineering consultants with BIM modelling, coordination, shop drawings and design review. (150) | BreadcrumbList, Organization |
| `/en/partners` | 200 | Partners · Zentrac | Zentrac welcomes collaboration with consultants, contractors, survey firms and engineering companies on defined infrastructure and BIM packages. (144) | BreadcrumbList, Organization |
| `/en/careers` | 200 | Careers · Zentrac | Zentrac works with BIM engineers and modellers on a project basis. Share your CV or portfolio. (94) | BreadcrumbList, Organization |
| `/en/privacy` | 200 | Privacy Policy · Zentrac | How Zentrac handles information sent through this website. (58) | BreadcrumbList, Organization |
| `/ar/about` | 200 | من نحن · زينتراك | زينتراك شركة استشارات هندسية ونمذجة معلومات البناء في القاهرة، أسسها عام 2026 المهندس المدني مارك مفرح الذي بدأت خبرته في الطرق والبنية التحتية عام 2018. (153) | BreadcrumbList, Organization |
| `/ar/services/bim-modelling` | 200 | نمذجة معلومات البناء · زينتراك | نبني نماذج ثلاثية الأبعاد لمشروعات البنية التحتية وتنسيق المواقع والمباني وفق خطة تنفيذ نمذجة معلومات البناء (BEP) ومستوى التطوير (LOD) المتفق عليه، حتى LOD 400 عندما يتطلب النطاق ذلك. (184) | BreadcrumbList, Service, Organization |
| `/ar/services/coordination` | 200 | التنسيق بين التخصصات · زينتراك | نجمع نماذج التخصصات في نموذج موحد، ونجري كشف التعارضات، ونتابع كل مشكلة حتى يعالجها الطرف المسؤول. (98) | BreadcrumbList, Service, Organization |
| `/ar/services/shop-drawings` | 200 | المخططات التنفيذية · زينتراك | نعد المخططات التنفيذية ومخططات تنسيق الخدمات من النموذج المنسق، جاهزة لمراجعة الاستشاري. (88) | BreadcrumbList, Service, Organization |
| `/ar/services/design-review` | 200 | مراجعة التصميم · زينتراك | نراجع المخططات التصميمية قبل بدء النمذجة، ونعيد أي معلومات ناقصة أو متعارضة في صورة طلبات استيضاح فني. (102) | BreadcrumbList, Service, Organization |
| `/ar/services/quantities-as-built` | 200 | حصر الكميات ونماذج الحالة المنفذة · زينتراك | نعد حصر الكميات من النموذج، وندعم الموقع أثناء التنفيذ، ونحدّث النماذج إلى الحالة المنفذة ضمن النطاق المتفق عليه. (113) | BreadcrumbList, Service, Organization |
| `/ar/services` | 200 | خدماتنا · زينتراك | خمس خدمات من زينتراك: نمذجة معلومات البناء، والتنسيق بين التخصصات، والمخططات التنفيذية، ومراجعة التصميم، وحصر الكميات ونماذج الحالة المنفذة. تعاقد على خدمة واحدة أو على النطاق الكامل. (183) | BreadcrumbList, Organization |
| `/ar/infrastructure` | 200 | نمذجة البنية التحتية · زينتراك | نمذجة وتنسيق عبر أحد عشر مجالًا للبنية التحتية، من المياه والصرف الصحي وتصريف الأمطار إلى الكهرباء وإنارة الطرق والطرق وتنسيق المواقع والقنوات. (143) | BreadcrumbList, Organization |
| `/ar/how-we-work` | 200 | كيف نعمل — مسار زينتراك · زينتراك | مسار زينتراك: المراجعة والنمذجة والتنسيق والمخططات والكميات ودعم الموقع. ابدأ من المرحلة التي تحتاج إليها لحزمة واحدة أو شبكة واحدة أو النطاق الكامل المتفق عليه. (161) | BreadcrumbList, Organization |
| `/ar/projects` | 200 | خبرات مختارة · زينتراك | خبرات مختارة لمؤسس زينتراك ومكتبه السابق BIM Experts، مع النطاق الدقيق لكل حزمة. (80) | BreadcrumbList, Organization |
| `/ar/blog` | 200 | المعرفة · زينتراك | مقالات من زينتراك حول نمذجة معلومات البناء والتنسيق والبنية التحتية. (68) | BreadcrumbList, Organization |
| `/ar/request-a-quote` | 200 | اطلب عرض سعر · زينتراك | أرسل إلى زينتراك تفاصيل مشروعك لخدمات النمذجة أو التنسيق أو المخططات التنفيذية أو مراجعة التصميم أو حصر الكميات ونماذج الحالة المنفذة. (134) | BreadcrumbList, Organization |
| `/ar/clients` | 200 | الجهات التي نخدمها · زينتراك | كيف تدعم زينتراك المطورين والملاك والمقاولين والمكاتب الاستشارية الهندسية بخدمات النمذجة والتنسيق والمخططات التنفيذية ومراجعة التصميم. (134) | BreadcrumbList, Organization |
| `/ar/partners` | 200 | الشراكات · زينتراك | ترحب زينتراك بالتعاون مع المكاتب الاستشارية والمقاولين وشركات المساحة والشركات الهندسية في حزم محددة للبنية التحتية ونمذجة معلومات البناء. (138) | BreadcrumbList, Organization |
| `/ar/careers` | 200 | فرص العمل · زينتراك | تعمل زينتراك مع مهندسي ومنمذجي معلومات البناء على أساس كل مشروع. شاركنا سيرتك الذاتية أو أعمالك. (96) | BreadcrumbList, Organization |
| `/ar/privacy` | 200 | سياسة الخصوصية · زينتراك | كيف تتعامل زينتراك مع المعلومات المرسلة عبر هذا الموقع. (55) | BreadcrumbList, Organization |

Notes:
- English titles follow "Page · Zentrac"; Arabic "الصفحة · زينتراك". The About title no longer repeats the brand (SEO-02).
- Each service page targets a distinct visitor need (modelling, coordination, shop drawings, design review, quantities/as-built) with its own inputs, deliverables and related links; descriptions are written from the service copy, not keyword lists.
- Arabic metadata uses natural Arabic search language (for example "نمذجة معلومات البناء", "التنسيق بين التخصصات", "المخططات التنفيذية", "حصر الكميات") rather than transliterated English; Latin tokens such as BEP/LOD 400 stay in Latin where engineers use them.
- No fabricated search volumes, rankings, competitor data, testimonials or statistics were added.

## Canonicals, robots and sitemap

- `robots.txt`: `Allow: /`, `Disallow: /api/`, `Sitemap: <origin>/sitemap.xml`. The dashboard is deliberately **not** listed in `robots.txt` (that would advertise it and stop crawlers seeing its `noindex`); it is protected by sign-in and `X-Robots-Tag: noindex`.
- `sitemap.xml`: generated from the same registry the proxy uses for 404 decisions (`src/lib/public-routes.ts`): 16 indexable pages × 2 locales (Buildings added 7 Nov 2026) with `en`/`ar`/`x-default` alternates (the empty Projects and Insights index pages are excluded until their first publication, OD-29). Excludes redirects, errors, the dashboard, the private review area, withheld projects and draft articles (tested). **No `lastmod`**: the site has no meaningful per-page change dates yet, and stamping the build date on every page would be inaccurate. When articles are published, their `updatedAt`/`publishedAt` should feed `lastmod` for those URLs only.
- Private review build: `robots.txt` disallows everything and every response carries `noindex`; it must also be access-protected if ever hosted.
- Projects and Insights index pages have no public records yet. Decision OD-29 (28 Oct 2026): they stay in the navigation (they explain the scope and route visitors to services and the quote form) but carry `noindex, follow` and are left out of the sitemap until the first project or article is published; both switch back automatically (`src/lib/public-routes.ts`).

## Structured data

| Type | Where | Agrees with visible content |
| --- | --- | --- |
| Organization | Every public page | Name Zentrac / زينتراك, Cairo office address and founding year 2026 as shown in the footer, About and Privacy pages; logo from `public/brand`. No ratings, certifications, client relationships, authors or offices beyond the source |
| BreadcrumbList | Inner pages | Matches the visible breadcrumb in the page's language |
| Service | 5 service pages | Name, description and URL from the page; provider references the Organization |
| Article | Published articles only | Headline, excerpt, language, dates and author only when set; none published, so none emitted |

All JSON-LD is serialized data with `<` escaped. Validated locally (parse + type check in the crawl); not submitted to Google's Rich Results Test because the URLs are not public. No FAQ or other schema was added to chase rich results.

## Images, sharing and icons

- OG images: `public/og/og-en.png`, `og-ar.png` (1200 × 630, generated from the logo and brand fonts; Arabic image uses the Arabic line). Absolute URLs via `metadataBase` once `SITE_URL` is set.
- Favicon, app icon and Apple touch icon load on every page (0 failed requests).
- Company profile download remains hidden until an approved file exists (OD-16).

## English / Arabic international SEO

- `lang`/`dir` are in the server HTML for every page and every 404 (tested).
- Self-canonicals per locale; reciprocal hreflang only between equivalent published pages; withheld or missing pages have no alternates.
- The language switch keeps the same route, content ID, valid query parameters and anchors (`locale.spec.ts`, journey J2).
- Arabic pages contain no English body fallbacks; proper names (Zentrac, BIM Experts) and technical tokens are intentional and direction-isolated.

## Search service follow-through (post-launch)

The domain is not live and no Search Console access exists, so none of this has been done:

1. Set `SITE_URL=https://<domain>`, rebuild, run `npm run check:release`.
2. Verify the domain (DNS TXT) in Google Search Console and Bing Webmaster Tools.
3. Submit `https://<domain>/sitemap.xml`; inspect `/en`, `/ar` and one service page per locale; confirm the dashboard reports "Excluded by noindex".
4. Watch Page indexing for unexpected 404s/soft 404s, and the Core Web Vitals report once field data exists.
5. When the first project or article is published, confirm it and its index page appear in the sitemap in both languages and that the index page lost its `noindex`.
