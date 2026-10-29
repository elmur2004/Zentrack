# Editing content

All copy is local, typed TypeScript. There is no CMS. After any edit run `npm run check:locales && npm run check:content`, then `npm run build`.

## Where things live

| What | File |
| --- | --- |
| UI strings and page copy (English) | `src/i18n/messages/en.ts` |
| UI strings and page copy (Arabic) | `src/i18n/messages/ar.ts` (typed against English: a missing key fails `npm run typecheck`) |
| Error-boundary strings | `src/i18n/messages/errors.ts` |
| Services (5) | `src/content/public/services.ts` |
| Infrastructure categories (11) | `src/content/public/networks.ts` |
| Track stages (6) and engagement options (4) | `src/content/public/track.ts` |
| Principles, values, audiences, partner types, specialist-module switch | `src/content/public/editorial.ts` |
| Company facts (name, address) | `src/content/public/company.ts` |
| Public contact channels (email, phone, WhatsApp, LinkedIn) | **Dashboard → Settings → Public contact details** (owner); validation in `src/lib/contacts.ts` |
| Privacy policy text | `privacyPage` in both dictionaries; version, date and retention periods in `src/lib/legal.ts` |
| Public projection (generated — do not hand-edit) | `src/content/public/projects.generated.json`, `articles.generated.json` |
| Public downloads (company profile) | `publicDownloads` in `src/content/public/index.ts` |
| Private project records, assets, draft articles | `private-source/content/*.ts` (never imported by public routes) |
| Route registry (pages, service slugs) | `src/i18n/routes.ts` — **a new public page must be added here**: the sitemap and the proxy read it through `src/lib/public-routes.ts`, and any path missing from it is served as the localized 404 |

Arabic terminology (from the 28 Oct 2026 review): BEP is «خطة تنفيذ نمذجة معلومات البناء (BEP)» at its first mention on a page and «خطة التنفيذ (BEP)» after that — never «خطة التنفيذ» without the token; clash report «تقرير كشف التعارضات»; federated «موحد»; full agreed scope «النطاق الكامل المتفق عليه»; site support «الدعم الفني للموقع»; stormwater «تصريف مياه الأمطار»; inlets «مداخل مياه الأمطار»; landscaped areas «مناطق تنسيق المواقع».

Every bilingual value is `{ en: …, ar: … }`. Write complete sentences in both languages — never build a sentence from fragments. Use `{placeholder}` for values (`fmt()` / `<Rich>`), and keep the same placeholders in both languages. Do not paste invisible direction marks; wrap Latin tokens that start or end with punctuation (`+20`, `https://`) in a placeholder rendered with `<bdi dir="ltr">`. In article text, wrap identifiers in backticks (`` `LOD 400` ``) to keep them LTR.

## Contact channels

The owner edits them in the dashboard (**Settings → Public contact details**): email, phone and WhatsApp in international format (`+…`), and the full `https://www.linkedin.com/…` address. Empty fields are not shown; invalid values are refused with a field message. A save refreshes every public page (footer, contact band, quote page, privacy policy, Organization structured data) within a minute — no rebuild. Without a database (preview builds) no channels are shown.

## Changing the privacy policy

Edit `privacyPage` in `en.ts` and `ar.ts` together, then change `PRIVACY_POLICY.version` and `.updated` in `src/lib/legal.ts` (every submission records the version). Retention periods are interpolated from `RETENTION` in the same file, which the retention job also enforces — change them only together with the policy text and record the decision in `docs/open-decisions.md`.

## Publishing a case study

1. Record the owner’s written approval and its scope in `docs/open-decisions.md` (which fields, which images, which party names).
2. In `private-source/content/projects.internal.ts`, set the record’s `publication` to `{ state: 'approved', approvedFields: [...], approvalEvidence: '<where the approval is filed>' }`. Approve only the fields that were cleared, e.g. `['title', 'summary', 'scope', 'country', 'sector', 'services', 'networks', 'images']`. Owner names need `'owner'`; the direct appointing party needs `'appointingParty'` **and** a confirmed `directAppointingParty` value.
3. For each cleared image: put an optimized derivative (WebP/AVIF/JPEG, sized for its use) in `public/media/`, set the asset’s `publicFile` (e.g. `/media/p01-coordination.webp`), `actualSize`, bilingual `alt`/`caption`, and `publication: { state: 'approved' }` in `assets.internal.ts`. Never copy files from `private-source/extracted` unreviewed.
4. Run `npm run content:project` (writes the public JSON through the allowlist) → `npm run check:content` → `npm run build` → `npm run check:output`. `check:output` restricts the names of every record that is still withheld or draft; an approved record’s title (and its parties, only if `'owner'` was approved) is automatically allowed.
5. Filters appear automatically once 4 or more records are public; homepage H06 switches from the capability fallback to three featured cards once 3 featured records are public.

## Publishing an article

1. Finish and technically review the draft in `private-source/content/articles.drafts.ts` (both languages, references with primary sources).
2. Set `publication: { state: 'approved', technicalReview: '<reviewer, date>' }`, a real `publishedAt` (ISO date) and, if decided, `author`.
3. `npm run content:project` → checks → build. The homepage “Latest articles” section and the sitemap pick it up automatically. Reading time is computed from the text.

## Enabling the specialist-services module

Only after the delivery arrangement is confirmed (OD-09): set `specialistServicesConfirmed = true` in `editorial.ts` and review the copy in `servicesPage.specialist` (both dictionaries).

## Adding a company profile download

Put the reviewed PDF in `public/downloads/` and add `{ id: 'company-profile', href: '/downloads/<file>.pdf', language: 'en', bytes: <size> }` to `publicDownloads`. The footer then shows “Download Company Profile — English PDF, <size>”. `check:content` rejects any other PDF in `public/`.

## Private review build

`npm run dev:review` → http://localhost:3100/en/review shows withheld records, drafts and conditional modules with review banners. It uses a separate build directory (`.next-review`). Never deploy it.

## Fonts and logo assets

- Fonts: `npm run fonts` copies the exact WOFF2 files from the Fontsource packages into `public/fonts` (with licences).
- Logo derivatives: `python scripts/extract-logo.py .` (requires `private-source/extracted/F2/images`). Replace with the vector master when supplied.
- OG images: `node scripts/generate-og.mjs`.
