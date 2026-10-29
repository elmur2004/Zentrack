/**
 * Small isometric projection helpers for the original illustrative scenes.
 * Geometry lives in its own coordinate space and is never mirrored for RTL.
 */
export interface IsoFrame {
  cx: number;
  cy: number;
  unit: number;
}

const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;

export function iso(f: IsoFrame, x: number, y: number, z = 0): [number, number] {
  return [f.cx + (x - y) * COS * f.unit, f.cy + (x + y) * SIN * f.unit - z];
}

const r = (n: number) => Math.round(n * 10) / 10;

export function pt(f: IsoFrame, x: number, y: number, z = 0): string {
  const [a, b] = iso(f, x, y, z);
  return `${r(a)} ${r(b)}`;
}

export function poly(f: IsoFrame, pts: Array<[number, number, number?]>, close = true): string {
  return pts.map(([x, y, z], i) => `${i ? 'L' : 'M'}${pt(f, x, y, z ?? 0)}`).join(' ') + (close ? ' Z' : '');
}

export function line(f: IsoFrame, pts: Array<[number, number, number?]>): string {
  return poly(f, pts, false);
}

/** Rectangle on the ground plane (x0..x1, y0..y1) at height z. */
export function rect(f: IsoFrame, x0: number, y0: number, x1: number, y1: number, z = 0): string {
  return poly(f, [
    [x0, y0, z],
    [x1, y0, z],
    [x1, y1, z],
    [x0, y1, z],
  ]);
}

/** Box faces: top, left (+y side, facing viewer-left) and right (+x side, facing viewer-right). */
export function box(f: IsoFrame, x0: number, y0: number, x1: number, y1: number, h: number, z = 0) {
  return {
    top: rect(f, x0, y0, x1, y1, z + h),
    left: poly(f, [
      [x0, y1, z],
      [x1, y1, z],
      [x1, y1, z + h],
      [x0, y1, z + h],
    ]),
    right: poly(f, [
      [x1, y0, z],
      [x1, y1, z],
      [x1, y1, z + h],
      [x1, y0, z + h],
    ]),
  };
}

/** Ellipse approximating a horizontal circle of radius rr (in units) at (x, y, z). */
export function isoEllipse(f: IsoFrame, x: number, y: number, z: number, rr: number) {
  const [cx, cy] = iso(f, x, y, z);
  return { cx: r(cx), cy: r(cy), rx: r(rr * f.unit * 1.2247), ry: r(rr * f.unit * 0.7071) };
}
