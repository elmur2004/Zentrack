"""Prepare a founding-team portrait for the About page (C26): enhance, cut out, save as transparent WebP.

Steps, in order:
  1. Upscale 2x: Real-ESRGAN general-x4v3 (x4, then Lanczos down to x2), with 15% plain Lanczos blended
     back to keep natural skin texture. No face retouching or generative face restoration.
  2. Gentle tone matching: exposure (gamma), contrast, saturation.
  3. Cut-out: rembg ISNet (isnet-general-use) on the enhanced image; detached specks dropped, the
     photo's bottom edge kept to the body's width, the outline choked by ~1px.
  4. Edge colour: pymatting foreground estimation, then bright upscaling specks on the outline are
     clamped to the colour just inside it (no halo from the old background).
  5. Crop to the person (bottom edge kept), optional transparent headroom, save RGBA WebP without
     metadata, plus a preview on the site's navy panel.

Setup (outside the repo; nothing here is part of the site build):
  python -m venv <dir> && <dir>/Scripts/python -m pip install "rembg[cpu]" opencv-python-headless
  Upscaler (BSD-3, ~5 MB):
  https://huggingface.co/tamnvcc/Real-ESRGAN-General-x4v3_float/resolve/main/onnx/model.onnx
  rembg downloads isnet-general-use (~170 MB) on first use into ~/.rembg.

Example (the values used for the first two portraits):
  python -I scripts/portraits/prepare-portrait.py mark.jpg public/team/mark-mofreh.webp --model x4v3.onnx --gamma 1.06 --contrast 1.06 --sat 1.04 --headroom 0.3
  python -I scripts/portraits/prepare-portrait.py mario.jpg public/team/mario-mofreh.webp --model x4v3.onnx --gamma 0.94 --contrast 1.08 --sat 0.98

Then set `photo` in src/content/public/team.ts with the printed width and height. A cut-out with clear
space at both sides suits `focus: '50% 100%'`; one whose shoulders reach the photo's edges should fill
the frame from the top (`focus: '50% 0%'`).
"""
import argparse
import math
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image
from pymatting import estimate_foreground_ml
from rembg import new_session, remove
from scipy import ndimage

NAVY = np.array([20, 35, 55], np.float32) / 255  # --color-navy-2


def upscale4(rgb: np.ndarray, sess: ort.InferenceSession, pad: int = 16) -> np.ndarray:
    """Tile the image through a fixed-size x4 model; each tile keeps only its centre."""
    inp = sess.get_inputs()[0]
    tile = inp.shape[2]
    stride = tile - 2 * pad
    h, w, _ = rgb.shape
    ny, nx = math.ceil(h / stride), math.ceil(w / stride)
    img = np.pad(rgb, ((pad, pad + ny * stride - h), (pad, pad + nx * stride - w), (0, 0)), mode='reflect')
    out = np.zeros((ny * stride * 4, nx * stride * 4, 3), np.float32)
    for iy in range(ny):
        for ix in range(nx):
            y, x = iy * stride, ix * stride
            t = img[y:y + tile, x:x + tile].transpose(2, 0, 1)[None].astype(np.float32)
            o = sess.run(None, {inp.name: t})[0][0].transpose(1, 2, 0)
            out[y * 4:(y + stride) * 4, x * 4:(x + stride) * 4] = o[pad * 4:(pad + stride) * 4, pad * 4:(pad + stride) * 4]
    return np.clip(out[:h * 4, :w * 4], 0, 1)


def tone(rgb: np.ndarray, gamma: float, contrast: float, sat: float) -> np.ndarray:
    out = np.clip(rgb, 0, 1) ** gamma
    out = 0.5 + (out - 0.5) * contrast
    lum = (out @ np.array([0.2126, 0.7152, 0.0722], np.float32))[..., None]
    return np.clip(lum + (out - lum) * sat, 0, 1)


def clean_alpha(a: np.ndarray) -> np.ndarray:
    a = np.clip((a - 0.03) / 0.94, 0, 1)
    labels, n = ndimage.label(a > 0.5)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(a), labels, range(1, n + 1))
        keep = labels == (1 + int(np.argmax(sizes)))
        a = np.where(ndimage.binary_dilation(keep, iterations=12), a, 0)
    # Nothing at the photo's bottom edge may stick out sideways beyond the body just above it.
    h = a.shape[0]
    above = ndimage.maximum_filter1d(a[h - 48:h - 28].max(axis=0), size=17)
    a[h - 28:] = np.minimum(a[h - 28:], above[None, :])
    a = ndimage.grey_erosion(a, size=(3, 3))
    return np.clip(ndimage.gaussian_filter(a, 0.6), 0, 1)


def clamp_edge_overshoot(fg: np.ndarray, alpha: np.ndarray, band_px: int = 6, lift: float = 0.06) -> np.ndarray:
    """Within a few pixels of the outline, a pixel may be no brighter than the body just inside it."""
    dist = ndimage.distance_transform_edt(alpha >= 0.5)
    band = (dist < band_px) & (alpha > 0)
    w = ((alpha >= 0.98) & (dist >= band_px)).astype(np.float32)
    out = fg.copy()
    for sigma in (12.0, 5.0):
        den = ndimage.gaussian_filter(w, sigma)
        num = np.dstack([ndimage.gaussian_filter(fg[..., c] * w, sigma) for c in range(3)])
        ref = num / np.maximum(den, 1e-6)[..., None]
        out = np.where((band & (den > 1e-3))[..., None], np.minimum(fg, ref + lift), out)
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('src', type=Path)
    ap.add_argument('out', type=Path, help='output .webp')
    ap.add_argument('--model', type=Path, required=True, help='Real-ESRGAN general-x4v3 ONNX file')
    ap.add_argument('--gamma', type=float, default=1.0)
    ap.add_argument('--contrast', type=float, default=1.05)
    ap.add_argument('--sat', type=float, default=1.0)
    ap.add_argument('--headroom', type=float, default=0.0, help='transparent space above the head, as a fraction of the cut-out height')
    args = ap.parse_args()

    src = Image.open(args.src).convert('RGB')
    w, h = src.size
    rgb = np.asarray(src, np.float32) / 255
    sr = ort.InferenceSession(str(args.model), providers=['CPUExecutionProvider'])
    up = Image.fromarray((upscale4(rgb, sr) * 255 + 0.5).astype(np.uint8)).resize((w * 2, h * 2), Image.LANCZOS)
    lan = src.resize((w * 2, h * 2), Image.LANCZOS)
    enh = tone(0.85 * np.asarray(up, np.float32) / 255 + 0.15 * np.asarray(lan, np.float32) / 255, args.gamma, args.contrast, args.sat)

    mask = remove(Image.fromarray((enh * 255 + 0.5).astype(np.uint8)), session=new_session('isnet-general-use'), only_mask=True, post_process_mask=False)
    alpha = clean_alpha(np.asarray(mask, np.float32) / 255)
    fg = clamp_edge_overshoot(estimate_foreground_ml(enh.astype(np.float64), alpha.astype(np.float64)).astype(np.float32), alpha)

    ys, xs = np.nonzero(alpha > 0.02)
    H, W = alpha.shape
    m = int(0.04 * W)
    rgba = np.dstack([fg, alpha])[max(0, ys.min() - m):H, max(0, xs.min() - m):min(W, xs.max() + 1 + m)]
    pad = int(round(args.headroom * rgba.shape[0]))
    if pad:
        rgba = np.concatenate([np.zeros((pad, rgba.shape[1], 4), rgba.dtype), rgba])

    img = Image.fromarray((np.clip(rgba, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA')
    args.out.parent.mkdir(parents=True, exist_ok=True)
    img.save(args.out, 'WEBP', quality=90, alpha_quality=100, method=6)
    a = rgba[..., 3:]
    preview = args.out.with_name(args.out.stem + '-preview-navy.png')
    Image.fromarray(((rgba[..., :3] * a + NAVY * (1 - a)) * 255 + 0.5).astype(np.uint8)).save(preview)
    print(f'{args.out}  width={img.width} height={img.height}  (preview: {preview}; do not commit it)')


if __name__ == '__main__':
    main()
