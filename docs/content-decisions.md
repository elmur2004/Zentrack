# Content decisions and conflict register

How conflicting statements in the sources were resolved. Authority order (spec §2): **F1/F3** control facts, attribution, metrics and publication status → **F4** controls structure and base English copy → **F2** controls the visual brand → **F5** is structural reference only.

## Conflicts and the wording used

| # | Item | Source conflict | Decision on the site |
| --- | --- | --- | --- |
| C01 | “8 years” | F4 Home and F2 p4 (“8 Years on major projects”) read as company age; F1 p1 / F3 Q row 8: company founded 2026 | No experience counter. About page states “established in 2026” and “founder experience since 2018” separately; chronology note says pre-2026 dates are the founder’s career |
| C02 | “13 projects” | F4 brackets `[13]`; F3 formula `=COUNTA(A8:A20)` counts register groups, not achievements (F1 p1) | Not published anywhere |
| C03 | “3 countries” | Historical founder/practice assignments (F1 cards) | Used only as founder experience: “defined outsourced packages … in Saudi Arabia, Egypt and Rwanda” (About, Projects empty state) |
| C04 | “11 networks” | Includes roads, landscape/grading and canals (F2 p8) | “Eleven infrastructure categories” taxonomy; never “11 utility networks on every job” |
| C05 | Our Clients | F4 lists owners/developers as clients; F1 p4/p6–13: they are project parties, not direct clients | Page renamed “Who We Work With”, describes client types; no logos; case-study template separates “Project owner / developer” from “Direct appointing party” |
| C06 | Specialist services | F4/F2 “with specialist partners”; F1 p3 / F3 D07: arrangement unconfirmed | Module built (`servicesPage.specialist`) behind `specialistServicesConfirmed = false`; shown only in the private review build |
| C07 | NDA | F4: “All files are covered by an NDA” (Home band, About values) | Replaced by neutral wording: “Share a non-confidential overview first; detailed drawings can follow once scope and confidentiality are agreed.” Confidentiality value: “Project information is shared only as agreed with the client.” |
| C08 | Qiddiya imagery | F3 Assets H17: may belong to Park Ride/Welcome Center (R03) | P03 internal note; no 4B/4C/4D attribution; R03 kept separate |
| C09 | Company profile download | F4 footer link; F2 still contains unresolved metrics/placeholders | Download component built; hidden until a reviewed public PDF is listed in `publicDownloads` |
| C10 | Quote turnaround | F4 `[XX] working days` | No numeric promise anywhere |
| C11 | Contacts | F4 `[Email]`, `[Phone]`, LinkedIn; F1 p2: none confirmed (a phone in S08 belongs to another role) | Address only until the owner enters verified channels in the dashboard (Settings → Public contact details, OD-02, 28 Oct 2026); unset channels are omitted, never replaced by placeholders |
| C12 | “ready for consultant approval” | F4 Shop Drawings | “prepared for consultant review” + scope note: “Prepared for review does not mean approved.” |
| C13 | “follow up on every clash until it is resolved” | F4 Coordination | “track each issue until it is resolved by the responsible party” |
| C14 | “so that conflicts are solved before construction starts” | F4 Infrastructure | “so that conflicts can be resolved before construction starts” |
| C15 | Partners “We work with … in Egypt and Saudi Arabia” | F4 asserts existing partnerships | “We welcome conversations with …”; no partner names/logos |
| C16 | Value “Every drawing is checked before it is issued” | Reasonable working principle | Kept as “Drawings are checked before they are issued.” (no certification claim) |
| C17 | “reduce resubmissions” (Contractors) | Outcome claim | “Coordinated shop drawings prepared from the model, to help reduce resubmissions.” |
| C18 | Track stage names | F2 p9 (“Capture and Review”, “Extract”, “Plan and Quantify”, “Support”) vs F4/spec (Review, Model, Coordinate, Drawings, Quantities, Site Support) | Spec §9.4 names used; F2 wording informed the explanations |
| C19 | Legal English name | F1 p1 “Zentrac for integreted Engineering Consultancies and Services” | Kept only in internal records with original spelling; site uses “Zentrac” / “زينتراك” |
| C20 | Founder chronology employers | F1 p2 names HYDRO, Capital Constructions, AMM (from an old CV) | Public chronology uses role descriptions only (2018, 2020, 2021, “Before 2026”, 2026); employer names and “PRESENT” not published (OD-10) |
| C21 | BIM Experts dates | Not supplied | Shown as “Before 2026” — no invented year |
| C22 | Hero brand line in Arabic | No verified Arabic slogan | Transcreation “هندسة قابلة للتنفيذ.” approved 28 Oct 2026 (OD-11): idiomatic, maps to قابلية التنفيذ (constructability), promises no more than “Engineered to Be Built” |
| C23 | “Why teams hand us the hard part.” | F2 p6 marketing line | Used as the H04 heading (brand voice); the four principles carry no certification or guarantee |
| C24 | Blog articles | F4 lists six topics; no articles exist | Six private draft records (one full bilingual draft to exercise the template); public index shows an empty state; homepage H09 hidden |

## Editorial conventions

- **Arabic numerals:** Western digits (0–9) in both locales for years, IDs, quantities and counts; Arabic UI formats numbers with `ar-EG-u-nu-latn`. A design decision, not a claim about Arabic usage.
- **Arabic plurals:** zero/one/two/few/many/other forms via `Intl.PluralRules` (e.g. 0 لا توجد مشروعات مطابقة, 1 مشروع واحد, 2 مشروعان, 3 مشروعات, 11 مشروعًا, 100 مشروع).
- **Latin tokens in Arabic** (`BIM`, `BEP`, `LOD 400`, `RFI-024`, `BIM Experts`, `+20`, `https://`) are isolated with `<bdi dir="ltr">` where neutral punctuation could reorder them; no bidi control characters are stored in content (`npm run check:locales` fails if one appears).
- **Glossary:** spec §6.6 terms are used throughout (e.g. نمذجة معلومات البناء، التنسيق بين التخصصات، المخططات التنفيذية، طلب استيضاح فني (RFI)).
- **BEP in Arabic:** «خطة تنفيذ نمذجة معلومات البناء (BEP)» at the first mention on a page, then «خطة التنفيذ (BEP)»; never «خطة التنفيذ» alone (it reads as the contractor's construction execution plan).
- **One Arabic term per concept:** clash report «تقرير كشف التعارضات»; federated «موحد»; full agreed scope «النطاق الكامل المتفق عليه»; site support «الدعم الفني للموقع»; stormwater «تصريف مياه الأمطار»; inlets «مداخل مياه الأمطار»; landscaped areas «مناطق تنسيق المواقع».
- **Spelling:** British English (modelling, programme, organisation), matching F2/F4.
- **Open Graph locales:** `en_GB` and `ar_AR`.

## Copy that was proposed (not from the sources) — now approved

Hero eyebrow/lead (from F4), problem section intro, package section, issue-register example rows (labelled “Illustrative example — not project data”), audience needs lists, service inputs/included lists (spec §9.2 recommendations), infrastructure category descriptions, the privacy policy and all Arabic copy. On 28 Oct 2026 the owner delegated the final review and approval (OD-12, OD-13); see below.

## Content approval (28 October 2026)

Scope: every public string in both dictionaries, the error strings and the bilingual content files (services, networks, Track, editorial, company), plus the new privacy policy and form messages. Two independent review passes were run against `AGENTS.md`, this register (C01–C24), the spec glossary and the sources; the findings tables are in `docs/qa/content-review/` (internal; `docs/` is never deployed).

| Review | Findings | Result |
| --- | --- | --- |
| English (claims, accuracy, consistency, British spelling) | 42: 3 high, 14 medium, 25 low | High: “Every scope starts with a review” → “Modelling scopes start…”; IFC is not a “native” format; the careers CV message (moot: private CV upload is now enabled). Medium: founder vs company experience (“built on founder experience since 2018”, “See selected experience”, “scope assigned”), “Many site problems… within the agreed scope”, “Resolve or raise remaining clashes”, LOD wording, partner-form wording (“Collaboration details”), audience link text, “Request a Quote”. Most low items applied (acronym expansion, labels, chronology verbs, decorative arrows hidden from screen readers, distinct button names on Who We Work With) |
| Arabic (grammar, meaning parity, glossary, engineering terminology) | 65: 6 high, 20 medium, 39 low | High: case error in «كيف ندعم {audience}» (→ «{audience}: كيف ندعمكم»), «جميع التخصصات» over-promise, «الثغرات في المعلومات», sector «الصرف الصحي», BEP glossary term (6 places), «الدعم الفني للموقع» (5 places). All medium and most low items applied (hydrants, inlets, landscaped areas, receipt disclaimer, “ready” → «تمهيدًا لمراجعة الاستشاري», resource “capacity”, careers wording, form messages) |

Not changed on purpose: the unused `company.arabicName` keeps the source spelling until the registered legal name is confirmed (OD-14); stylistic options the reviewers marked optional (title-block term, «الأمانة»).

Approval covers the site copy. It does not cover publishing the withheld project case studies, which need the parties' permission (OD-07/08, `docs/open-decisions.md`).
