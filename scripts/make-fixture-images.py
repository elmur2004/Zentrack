"""
Generates three SYNTHETIC technical-looking images for the private review fixture record
(used to exercise the case-study gallery dialog). No project data; clearly labelled.
Usage: python scripts/make-fixture-images.py .
"""
import sys, pathlib, random
from PIL import Image, ImageDraw

root = pathlib.Path(sys.argv[1])
out = root / "private-source" / "fixtures"
out.mkdir(parents=True, exist_ok=True)
random.seed(7)
sizes = [(1600, 1000), (1200, 1200), (2000, 800)]
for n, (w, h) in enumerate(sizes, start=1):
    im = Image.new("RGB", (w, h), (11, 22, 36))
    d = ImageDraw.Draw(im)
    for x in range(0, w, 40):
        d.line([(x, 0), (x, h)], fill=(24, 38, 56))
    for y in range(0, h, 40):
        d.line([(0, y), (w, y)], fill=(24, 38, 56))
    colours = [(127, 176, 222), (168, 163, 154), (111, 181, 191), (216, 194, 127)]
    for i, c in enumerate(colours):
        y = int(h * (0.3 + 0.12 * i))
        d.line([(60, y), (w - 60, y + random.randint(-40, 40))], fill=c, width=6)
    d.line([(int(w * 0.2), 60), (int(w * 0.25), h - 60)], fill=(250, 82, 17), width=8)
    d.rectangle([40, 40, 560, 120], fill=(250, 82, 17))
    d.text((60, 60), f"SYNTHETIC FIXTURE {n}/3 - NOT PROJECT DATA", fill=(11, 22, 36))
    im.save(out / f"fixture-{n}.png", optimize=True)
    print(f"wrote private-source/fixtures/fixture-{n}.png {w}x{h}")
