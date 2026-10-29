"""Builds the tiny font used for the Arabic language-switch label on English pages.

English pages show one Arabic word ("العربية") in the header. Rendering it with the full Arabic
font made every English page view download ~43 KB; this subset holds only that word's glyphs
(with the joining/shaping features they need) and is a few KB.

Source: IBM Plex Sans Arabic 400 from @fontsource (SIL OFL 1.1). The subset is a Modified
Version under the OFL, so it is renamed (IBM's upstream licence reserves the name "Plex"), keeps
the copyright notice, and remains under the OFL (public/fonts/LICENSE-IBM-Plex-Sans-Arabic-OFL.txt).

Usage (needs fonttools): python scripts/subset-label-font.py
"""
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "node_modules/@fontsource/ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-400-normal.woff"
OUTPUT = ROOT / "public/fonts/zentrac-language-label-ar.woff"
TEXT = "العربية"
FAMILY = "Zentrac Language Label"

font = TTFont(SOURCE)
options = subset.Options()
options.flavor = "woff"  # zlib WOFF: no brotli dependency; the file is tiny either way
options.layout_features = ["*"]  # keep all shaping features for the retained glyphs
options.name_IDs = ["*"]
options.name_languages = ["*"]
options.notdef_outline = True
subsetter = subset.Subsetter(options)
subsetter.populate(text=TEXT)
subsetter.subset(font)

# Rename (OFL Reserved Font Name). Keep copyright (0) and licence (13/14) records.
names = {1: FAMILY, 3: f"{FAMILY} subset", 4: FAMILY, 6: FAMILY.replace(" ", ""), 16: FAMILY, 17: "Regular"}
for record in font["name"].names:
    if record.nameID in names:
        record.string = names[record.nameID]
    elif record.nameID in (5,):
        record.string = f"{record.toUnicode()}; subset for the language-switch label"

font.flavor = "woff"
font.save(OUTPUT)
size = OUTPUT.stat().st_size
codepoints = sorted(font.getBestCmap())
print(f"wrote {OUTPUT.relative_to(ROOT)} ({size} bytes), code points: {' '.join(f'U+{c:04X}' for c in codepoints)}")
