"""
Extracts the Zentrac logo lockups from the company profile (F2) cover images.

The profile contains the logo only as part of two composite JPEG images
(front cover: stacked white/orange lockup on navy; back cover: horizontal
navy/orange lockup on white). There is no standalone vector master in the
supplied files. This script keys the plain background out of each crop so the
original pixel geometry is preserved (no redrawing, no tracing). Colours are
snapped to the measured brand tokens. The vector master should replace these
derivatives when supplied (see docs/open-decisions.md, OD-03).

Usage: python scripts/extract-logo.py <repo-root>
Requires: private-source/extracted/F2/images/p01_x4.jpeg and p17_x84.jpeg
(created by the source extraction step).
"""
import sys, pathlib, json
from PIL import Image

root = pathlib.Path(sys.argv[1])
src = root / "private-source" / "extracted" / "F2" / "images"
brand = root / "public" / "brand"
app = root / "src" / "app"
brand.mkdir(parents=True, exist_ok=True)

NAVY = (0x0B, 0x16, 0x24)
ORANGE = (0xFA, 0x52, 0x11)
WHITE = (255, 255, 255)


def solve_alpha(c, bg, fg):
    num = 0.0
    den = 0.0
    for i in range(3):
        d = bg[i] - fg[i]
        num += (bg[i] - c[i]) * d
        den += d * d
    a = num / den if den else 0.0
    a = max(0.0, min(1.0, a))
    resid = sum((bg[i] + a * (fg[i] - bg[i]) - c[i]) ** 2 for i in range(3))
    return a, resid


def key(img, bg, fgs, recolor=None):
    """Return RGBA image: each pixel assigned to the best-fitting foreground colour."""
    w, h = img.size
    px = img.load()
    out = Image.new("RGBA", (w, h))
    po = out.load()
    for y in range(h):
        for x in range(w):
            c = px[x, y]
            best = None
            for name, fg in fgs.items():
                a, r = solve_alpha(c, bg, fg)
                if best is None or r < best[2]:
                    best = (name, a, r)
            name, a, _ = best
            # suppress JPEG noise in the background
            if a < 0.06:
                a = 0.0
            col = fgs[name]
            if recolor and name in recolor:
                col = recolor[name]
            po[x, y] = (col[0], col[1], col[2], int(round(a * 255)))
    return out


def despeckle(im, min_area=60, thresh=40):
    """Remove isolated JPEG-noise blobs (connected components smaller than min_area)."""
    w, h = im.size
    a = im.split()[3].load()
    seen = [[False] * w for _ in range(h)]
    px = im.load()
    for y in range(h):
        for x in range(w):
            if seen[y][x] or a[x, y] <= thresh:
                continue
            stack = [(x, y)]
            comp = []
            seen[y][x] = True
            while stack:
                cx, cy = stack.pop()
                comp.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and a[nx, ny] > thresh:
                        seen[ny][nx] = True
                        stack.append((nx, ny))
            # only faint blobs are noise; real strokes (even thin tagline letters) have solid cores
            if len(comp) < min_area and max(a[cx, cy] for cx, cy in comp) < 200:
                for cx, cy in comp:
                    # clear the blob and its soft fringe
                    for dx in (-1, 0, 1):
                        for dy in (-1, 0, 1):
                            nx, ny = cx + dx, cy + dy
                            if 0 <= nx < w and 0 <= ny < h:
                                r, g, b, _ = px[nx, ny]
                                px[nx, ny] = (r, g, b, 0)
    return im


def bbox_alpha(im, thresh=40):
    a = im.split()[3].point(lambda v: 255 if v > thresh else 0)
    return a.getbbox()


def pad(im, px):
    w, h = im.size
    out = Image.new("RGBA", (w + 2 * px, h + 2 * px), (0, 0, 0, 0))
    out.paste(im, (px, px))
    return out


report = {}

# --- Back cover: horizontal lockup on white ------------------------------------------
back = Image.open(src / "p17_x84.jpeg").convert("RGB")
crop = back.crop((80, 80, 660, 230))
bg = crop.getpixel((3, 3))
light = despeckle(key(crop, bg, {"navy": NAVY, "orange": ORANGE}))
bb = bbox_alpha(light)
light = light.crop(bb)
light_full = pad(light, 4)
light_full.save(brand / "zentrac-logo-horizontal-on-light.png", optimize=True)
# same geometry; navy elements rendered white, as in the profile's own dark-background lockup (front cover)
dark = despeckle(key(crop, bg, {"navy": NAVY, "orange": ORANGE}, recolor={"navy": WHITE})).crop(bb)
pad(dark, 4).save(brand / "zentrac-logo-horizontal-on-dark.png", optimize=True)
report["horizontal"] = {"size": light_full.size, "source": "F2 page 17 (back cover) image xref 84, crop (80,80,660,230)", "bg_sample": bg}

# --- Front cover: stacked lockup on navy ------------------------------------------------
cov = Image.open(src / "p01_x4.jpeg").convert("RGB")
crop2 = cov.crop((100, 60, 560, 300))
bg2 = crop2.getpixel((3, 3))
stacked = despeckle(key(crop2, bg2, {"white": WHITE, "orange": ORANGE}))
bb2 = bbox_alpha(stacked)
stacked = pad(stacked.crop(bb2), 4)
stacked.save(brand / "zentrac-logo-stacked-on-dark.png", optimize=True)
report["stacked"] = {"size": stacked.size, "source": "F2 page 1 (front cover) image xref 4, crop (100,60,560,300)", "bg_sample": bg2}

# --- Symbol only (from the front cover lockup: top part above the wordmark) ------------
# find the vertical gap between symbol and wordmark using alpha row sums
st = stacked
a = st.split()[3]
w, h = st.size
rows = [sum(1 for x in range(w) if a.getpixel((x, y)) > 60) for y in range(h)]
# symbol occupies the first block of non-empty rows
y0 = next(i for i, r in enumerate(rows) if r > 0)
y1 = y0
while y1 < h and rows[y1] > 0:
    y1 += 1
symbol = st.crop((0, y0, w, y1))
sb = bbox_alpha(symbol)
symbol = symbol.crop(sb)
report["symbol"] = {"size": symbol.size}

# App icons: original symbol on brand navy square
def icon(size, scale=0.62):
    canvas = Image.new("RGBA", (size, size), NAVY + (255,))
    sw, sh = symbol.size
    s = min(size * scale / sw, size * scale / sh)
    sym = symbol.resize((max(1, int(sw * s)), max(1, int(sh * s))), Image.LANCZOS)
    canvas.alpha_composite(sym, ((size - sym.size[0]) // 2, (size - sym.size[1]) // 2))
    return canvas

icon(512).save(app / "icon.png", optimize=True)
icon(180).convert("RGB").save(app / "apple-icon.png", optimize=True)
ico = icon(256, 0.7)
ico.save(app / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
icon(512).save(brand / "zentrac-symbol-app-icon.png", optimize=True)

(root / "docs").mkdir(exist_ok=True)
print(json.dumps(report, indent=1, default=str))
