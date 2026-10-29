# Source inventory

Inspected 27–28 October 2026. Originals sit in the repository root and are never copied into `public/`. Extraction output (page renders, embedded images, workbook dumps) is in `private-source/extracted/` (git-ignored; regenerate with the steps at the end).

## Supplied files

| ID | File (actual name) | Size | What it contains | How it was inspected |
| --- | --- | --- | --- | --- |
| F1 | `Zentrac_Media_Brief_AR.pdf` | 598 KB, 15 pages (A4, Word export) | Arabic media brief: company facts, founder history, eight project cards (P01–P08), numbers to verify, corrections, source index (U01, S01–S08) | Text extracted per page (PyMuPDF); all 15 pages rendered and viewed; 5 embedded images extracted |
| F2 | `Zentrac Company Profile.pdf` | 2.7 MB, 17 pages (1440×810, Chromium export) | Visual brand (navy/orange, Saira), marketing narrative, services, Track, project slides, logo (raster only) | Text + fonts (Saira Light/Regular/Medium/SemiBold embedded subsets) extracted; all pages rendered and viewed; 10 unique images extracted |
| F3 | `Zentrac_Media_Register.xlsx` | 28 KB, 5 sheets | `Projects` (13 groups, A8:O20), `Questionnaire` (rows 8–22), `Assets` (A01–A18), `Metrics` (5 candidate numbers), `Decisions` (D01–D08 + source list) | Every non-empty cell dumped with coordinates (openpyxl); formulas kept (`E6 =COUNTA(A8:A20)` → 13, `G6 =COUNTIFS(K8:K20,"نعم")` → 8) |
| F4 | `Zentrac Website — Simple Copy v2 (formal).docx` | 12 KB | Site structure and English base copy; bracketed items awaiting the client | Paragraphs and styles extracted (python-docx); 139 lines |
| F5 | `Zentrac Website Page Mockups (1).pdf.pdf` | 3.3 MB, 14 pages (Canva) | Fourteen raster page mockups (Home, About, Services, Shop Drawings, Infrastructure, How We Work, Clients, Projects, AMAALA page, Blog, Quote, Partners, Careers, Privacy) | No text layer; every page rendered and viewed |

The two handoff documents (`01_…MASTER_PLAN.md`, `02_…BUILD_SPEC.md`) were read in full.

## Files referenced but NOT supplied

These appear in F1/F3 as sources; they are references, not available material:

- `03_Project_Images/…` (the 18 registered assets as standalone files), `02_Project_Data` CSV, `04_Publication_Review`, `COPY_AR_EN.md`
- S01 `PROJECTS - Copy.xlsx`, S02 `ZENTRAC_Professional_Portfolio_2026 (2).pptx`, S03 `Mark Mofreh - Resume.pdf`, S04/S06 KSP progress reports, S05 KSP drawing, S07 SEDRA screenshots, S08 company data summary
- Any standalone logo file (vector or raster master)

## Assets actually available (extracted from the PDFs)

| Register ID | Extracted file | Actual size | Registered size | Notes |
| --- | --- | --- | --- | --- |
| A05 (P02 SEDRA) | `F2/images/p10_x46.jpeg` | 1578×788 | 1578×788 | JPEG re-encode inside the profile; also smaller copy in F1 p7 (820×409) |
| A07 (P01 AMAALA) | `F2/images/p10_x45.jpeg` | 1538×649 | 1538×649 | Also F1 p6 (971×409) |
| A14 (P03 Qiddiya review group) | `F2/images/p10_x47.jpeg` | 1816×706 | 1816×706 | Also F1 p8 (1054×409) |
| A15 (P04 King Fahd) | `F2/images/p10_x48.jpeg` | 1869×1248 | 1869×1248 | Also F1 p9 (613×409) |
| A17 (P05 KSP) | `F2/images/p14_x74.jpeg` | 2400×1696 | 4723×3338 | Downsampled copy — not the high-resolution original |
| — (profile cover) | `F2/images/p01_x4.jpeg` | 1672×941 | — | Contains the stacked logo (white/orange on navy) + stock photography |
| — (profile back cover) | `F2/images/p17_x84.jpeg` | 1672×941 | — | Contains the horizontal logo (navy/orange on white) + stock photography of people |
| — | `F2/images/p02, p04, p08` | various | — | Generic stock photography (buildings, people). **Not** Zentrac office/team photos; not used |

All 13 other registered assets (A01–A04, A06, A08–A13, A16, A18) are missing. Every asset is `withheld` (F3 Assets column I: “under publication review; no written approval”).

## Brand measurements

- Colours (spec §5.1, confirmed against the profile render): navy `#0B1624`, orange `#FA5211`, paper `#F8F9FA`, line `#E5E7EB`.
- Typeface: Saira (F2 embeds Saira Light/Regular/Medium/SemiBold subsets). Web fonts were taken from the official Fontsource builds of Google Fonts, not extracted from the PDF.
- Logo: raster only. Extracted by keying out the plain background of the two cover lockups (no redrawing, no tracing); see `scripts/extract-logo.py` and decision OD-03.

## Regenerating the extraction

```bash
python scripts/extract-logo.py .        # needs private-source/extracted/F2/images (below)
```

The page/image/workbook extraction used PyMuPDF, python-docx and openpyxl. A minimal equivalent:

```python
import fitz  # PyMuPDF
doc = fitz.open("Zentrac Company Profile.pdf")
for i, page in enumerate(doc):
    page.get_pixmap(dpi=110).save(f"private-source/extracted/F2/pages/p{i+1:02d}.png")
    for img in page.get_images(full=True):
        info = doc.extract_image(img[0])
        open(f"private-source/extracted/F2/images/p{i+1:02d}_x{img[0]}.{info['ext']}", "wb").write(info["image"])
```
