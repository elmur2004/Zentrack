import { box, iso, isoEllipse, line, poly, rect, type IsoFrame } from './iso';
import { memoMarkup } from './static-svg';

/**
 * Signature hero illustration (M02): an original, explicitly illustrative exploded
 * axonometric — utility layer, surface layer and a drawing plane — that assembles once.
 * Decorative (aria-hidden). Its final frame is the static/no-JS/reduced-motion state.
 * Geometry is never mirrored for Arabic. The artwork is injected as static markup
 * (see static-svg.ts): same DOM for the CSS storyboard, no hydration cost.
 */

const U: IsoFrame = { cx: 300, cy: 338, unit: 25 }; // utilities layer
const S: IsoFrame = { cx: 300, cy: 226, unit: 25 }; // surface layer
const D: IsoFrame = { cx: 300, cy: 96, unit: 25 }; // drawing plane

const W = 10;
const H = 8;
const ROAD: [number, number] = [3.4, 4.6];
const BRANCH: [number, number] = [6.2, 7.2];

const buildings: Array<[number, number, number, number, number]> = [
  [0.7, 0.6, 2.9, 2.6, 50],
  [3.5, 0.9, 5.4, 2.5, 30],
  [1.0, 5.4, 3.3, 7.4, 38],
  [4.1, 5.7, 5.5, 7.1, 20],
];

const trees: Array<[number, number]> = [
  [7.0, 5.7],
  [8.0, 5.5],
  [9.1, 5.9],
  [7.5, 6.6],
  [8.6, 6.8],
  [9.4, 7.3],
  [7.1, 7.5],
];

const manholes: number[] = [1.6, 4.6, 8.6];

// Utility runs along the road (y positions) — style class per network
const runs: Array<{ id: string; y: number; cls: string; from?: number; to?: number }> = [
  { id: 'power', y: 3.15, cls: 'u-power' },
  { id: 'water', y: 3.6, cls: 'u-water' },
  { id: 'storm', y: 4.0, cls: 'u-storm' },
  { id: 'sewer', y: 4.4, cls: 'u-sewer' },
  { id: 'telecom', y: 4.85, cls: 'u-telecom' },
];

const coordinationPath = line(U, [
  [1.8, 2.6, 2],
  [1.8, 3.6, 2],
  [6.7, 3.6, 2],
  [6.7, 4.0, 2],
  [8.6, 4.0, 2],
  [8.6, 4.4, 2],
  [8.6, 6.2, 2],
]);

export function HeroScene({ caption }: { caption: string }) {
  return (
    <figure className="hero-scene">
      <svg
        className="hero-scene__svg"
        viewBox="100 90 450 500"
        role="presentation"
        aria-hidden="true"
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        dangerouslySetInnerHTML={artMarkup(0)}
      />
      <figcaption className="hero-scene__caption">
        <span className="hero-scene__tick" aria-hidden="true" />
        {caption}
      </figcaption>
    </figure>
  );
}

const artMarkup = memoMarkup(() => <HeroSceneArt />);

/** The artwork inside the <svg>; its final frame is the static state. */
export function HeroSceneArt() {
  const clash = isoEllipse(U, 8.6, 4.4, 2, 0.42);
  const clashOk = isoEllipse(U, 8.6, 4.4, 2, 0.32);
  const start = iso(U, 1.8, 2.6, 2);
  const mid = iso(U, 6.7, 3.6, 2);

  return (
    <>
      <defs>
        <linearGradient id="hs-plane" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1d3049" />
          <stop offset="1" stopColor="#142337" />
        </linearGradient>
        <linearGradient id="hs-sheet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8f9fa" stopOpacity="0.16" />
          <stop offset="1" stopColor="#f8f9fa" stopOpacity="0.05" />
        </linearGradient>
        <pattern id="hs-grid" width="25" height="25" patternUnits="userSpaceOnUse">
          <path d="M25 0H0V25" fill="none" stroke="#ffffff" strokeOpacity="0.05" />
        </pattern>
      </defs>

      {/* ---------------- Utilities layer ---------------- */}
      <g className="hs-layer hs-utilities">
        <path d={rect(U, 0, 0, W, H)} className="hs-ghost-plane" />
        {runs.map((run) => (
          <path key={run.id} d={line(U, [[run.from ?? 0, run.y], [run.to ?? W, run.y]])} className={`hs-run ${run.cls}`} />
        ))}
        {/* branch services under the side road */}
        <path d={line(U, [[6.5, 0.4], [6.5, 3.6]])} className="hs-run u-water" />
        <path d={line(U, [[6.9, 0.4], [6.9, 3.15]])} className="hs-run u-power" />
        {/* storm lateral from landscape crossing sewer and telecom */}
        <path d={line(U, [[8.6, 4.0], [8.6, 6.4]])} className="hs-run u-storm" />
        {/* service connection to building A */}
        <path d={line(U, [[1.8, 2.6], [1.8, 3.6]])} className="hs-run u-water" />
        {manholes.map((x) => {
          const e = isoEllipse(U, x, 4.4, 0, 0.22);
          return <ellipse key={x} {...e} className="hs-manhole" />;
        })}
      </g>

      {/* coordination path traced through selected interfaces (a bright head leads the trace) */}
      <g className="hs-layer hs-path">
        <path d={coordinationPath} className="hs-coord" pathLength={1} />
        <path d={coordinationPath} className="hs-coord-head" pathLength={1} />
        <circle className="hs-node hs-node--start" cx={start[0]} cy={start[1]} r="3.5" />
        <circle className="hs-node hs-node--mid" cx={mid[0]} cy={mid[1]} r="3" />
      </g>

      {/* conceptual issue marker resolving (no metric implied) */}
      <g className="hs-layer hs-marker">
        <g className="hs-issue">
          <ellipse {...clash} className="hs-issue__ring" />
          <path
            d={`M${clash.cx - 5} ${clash.cy - 5}l10 10M${clash.cx + 5} ${clash.cy - 5}l-10 10`}
            className="hs-issue__x"
          />
        </g>
        <g className="hs-resolved">
          <ellipse {...clashOk} className="hs-resolved__ring" />
          <path d={`M${clashOk.cx - 5} ${clashOk.cy}l3.5 3.5 6.5-7`} className="hs-resolved__tick" />
        </g>
      </g>

      {/* risers between the utilities and the surface (manholes) */}
      <g className="hs-layer hs-links">
        {manholes.map((x) => (
          <path key={x} d={line(U, [[x, 4.4, 0], [x, 4.4, 112]])} className="hs-link" />
        ))}
      </g>
      {/* projection lines from the model up to the drawing sheet: they grow as the sheet arrives */}
      <g className="hs-layer hs-proj">
        <path d={line(S, [[1.2, 1.0, 0], [1.2, 1.0, 130]])} className="hs-link hs-link--proj" />
        <path d={line(S, [[9.2, 1.0, 0], [9.2, 1.0, 130]])} className="hs-link hs-link--proj" />
        <path d={line(S, [[9.2, 7.0, 0], [9.2, 7.0, 130]])} className="hs-link hs-link--proj" />
        <path d={line(S, [[1.2, 7.0, 0], [1.2, 7.0, 130]])} className="hs-link hs-link--proj" />
      </g>

      {/* ---------------- Surface layer ---------------- */}
      <g className="hs-layer hs-surface">
        {/* slab edges */}
        <path
          d={poly(S, [
            [0, H, 0],
            [W, H, 0],
            [W, H, -8],
            [0, H, -8],
          ])}
          className="hs-slab-left"
        />
        <path
          d={poly(S, [
            [W, 0, 0],
            [W, H, 0],
            [W, H, -8],
            [W, 0, -8],
          ])}
          className="hs-slab-right"
        />
        <path d={rect(S, 0, 0, W, H)} fill="url(#hs-plane)" className="hs-plane" />
        <path d={rect(S, 0, 0, W, H)} fill="url(#hs-grid)" />
        {/* landscape zone with contours */}
        <path d={rect(S, 6.4, 5.1, 9.8, 7.8)} className="hs-landscape" />
        {[0.35, 0.75, 1.15].map((k) => (
          <path
            key={k}
            d={line(S, [
              [6.6 + k, 7.7],
              [6.9 + k, 6.6 - k * 0.3],
              [8.0 + k * 0.6, 5.6 + k * 0.2],
              [9.7, 5.4 + k * 0.5],
            ])}
            className="hs-contour"
          />
        ))}
        {/* roads */}
        <path d={rect(S, 0, ROAD[0], W, ROAD[1])} className="hs-road" />
        <path d={rect(S, BRANCH[0], 0, BRANCH[1], ROAD[0])} className="hs-road" />
        <path d={line(S, [[0, ROAD[0]], [BRANCH[0], ROAD[0]]])} className="hs-kerb" />
        <path d={line(S, [[BRANCH[1], ROAD[0]], [W, ROAD[0]]])} className="hs-kerb" />
        <path d={line(S, [[0, ROAD[1]], [W, ROAD[1]]])} className="hs-kerb" />
        <path d={line(S, [[BRANCH[0], 0], [BRANCH[0], ROAD[0]]])} className="hs-kerb" />
        <path d={line(S, [[BRANCH[1], 0], [BRANCH[1], ROAD[0]]])} className="hs-kerb" />
        <path d={line(S, [[0, 4.0], [W, 4.0]])} className="hs-lane" />
        {/* the coordinated route seen through the street (hidden-line convention) */}
        <path d={coordinationPath} className="hs-xray" />
        {manholes.map((x) => {
          const e = isoEllipse(S, x, 4.4, 0.5, 0.16);
          return <ellipse key={x} {...e} className="hs-cover" />;
        })}
        {/* trees */}
        {trees.map(([x, y]) => {
          const e = isoEllipse(S, x, y, 9, 0.28);
          const s = isoEllipse(S, x, y, 0, 0.18);
          return (
            <g key={`${x}-${y}`} className="hs-tree">
              <ellipse {...s} className="hs-tree__shadow" />
              <path d={`M${s.cx} ${s.cy}V${e.cy}`} className="hs-tree__trunk" />
              <ellipse {...e} className="hs-tree__crown" />
            </g>
          );
        })}
        {/* neutral building masses */}
        {buildings.map(([x0, y0, x1, y1, h]) => {
          const b = box(S, x0, y0, x1, y1, h);
          return (
            <g key={`${x0}-${y0}`} className="hs-mass">
              <path d={b.left} className="hs-mass__left" />
              <path d={b.right} className="hs-mass__right" />
              <path d={b.top} className="hs-mass__top" />
            </g>
          );
        })}
      </g>

      {/* ---------------- Drawing plane ---------------- */}
      <g className="hs-layer hs-sheet">
        <path d={rect(D, 1.2, 1.0, 9.2, 7.0)} fill="url(#hs-sheet)" className="hs-sheet__paper" />
        <path d={rect(D, 1.45, 1.25, 8.95, 6.75)} className="hs-sheet__border" />
        {/* title block (drawing convention; not mirrored) */}
        <path d={rect(D, 7.3, 5.55, 8.95, 6.75)} className="hs-sheet__title" />
        <path d={line(D, [[7.3, 6.0], [8.95, 6.0]])} className="hs-sheet__fine" />
        <path d={line(D, [[7.3, 6.4], [8.95, 6.4]])} className="hs-sheet__fine" />
        <path d={line(D, [[8.2, 5.55], [8.2, 6.75]])} className="hs-sheet__fine" />
        {/* plan linework extracted from the model */}
        <path d={line(D, [[1.45, ROAD[0]], [BRANCH[0], ROAD[0]]])} className="hs-sheet__line" />
        <path d={line(D, [[BRANCH[1], ROAD[0]], [8.95, ROAD[0]]])} className="hs-sheet__line" />
        <path d={line(D, [[1.45, ROAD[1]], [8.95, ROAD[1]]])} className="hs-sheet__line" />
        <path d={line(D, [[BRANCH[0], 1.25], [BRANCH[0], ROAD[0]]])} className="hs-sheet__line" />
        <path d={line(D, [[BRANCH[1], 1.25], [BRANCH[1], ROAD[0]]])} className="hs-sheet__line" />
        <path d={rect(D, 1.45, 1.25, 2.9, 2.6)} className="hs-sheet__fine" />
        <path d={rect(D, 3.5, 1.25, 5.4, 2.5)} className="hs-sheet__fine" />
        <path d={rect(D, 1.45, 5.4, 3.3, 6.75)} className="hs-sheet__fine" />
        <path d={line(D, [[1.45, 3.6], [8.95, 3.6]])} className="hs-sheet__dash" />
        <path d={line(D, [[1.45, 4.4], [8.95, 4.4]])} className="hs-sheet__dash" />
        <path
          d={line(D, [
            [1.8, 2.6],
            [1.8, 3.6],
            [6.7, 3.6],
            [6.7, 4.0],
            [8.6, 4.0],
            [8.6, 5.4],
          ])}
          className="hs-sheet__accent"
          pathLength={1}
        />
        {/* dimension line */}
        <path d={line(D, [[1.45, 0.7], [8.95, 0.7]])} className="hs-sheet__dim" />
        <path d={line(D, [[1.45, 0.55], [1.45, 0.85]])} className="hs-sheet__dim" />
        <path d={line(D, [[8.95, 0.55], [8.95, 0.85]])} className="hs-sheet__dim" />
      </g>
    </>
  );
}
