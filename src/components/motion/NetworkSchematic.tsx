import type { NetworkId } from '@/content/public/networks';
import { memoMarkup } from './static-svg';

/**
 * Plan-view site schematic used by the infrastructure explorer (M07).
 * Conceptual only: not to scale, no clearances or depths implied. Never mirrored.
 * Each category is a <g data-net>; `.net__trace` paths are the highlight overlays.
 * The artwork is injected as static markup (see static-svg.ts): same DOM, no hydration cost;
 * ExplorerControls marks layers on it directly.
 */

const poles = [35, 105, 175, 245, 415, 485, 545];
const hydrants = [60, 180, 300, 430, 520];
const manholes = [80, 200, 300, 440, 530];
const inlets = [120, 260, 400, 500];

function Trace({ d }: { d: string }) {
  return <path d={d} className="net__trace" pathLength={1} />;
}

export function NetworkSchematic({ selected }: { selected: NetworkId | 'all' }) {
  return (
    <svg
      viewBox="0 0 560 420"
      className="schematic"
      data-selected={selected}
      aria-hidden="true"
      focusable="false"
      role="presentation"
      dangerouslySetInnerHTML={artMarkup(selected)}
    />
  );
}

const artMarkup = memoMarkup((selected: NetworkId | 'all') => <NetworkSchematicArt selected={selected} />);

/** The artwork inside the <svg>. */
export function NetworkSchematicArt({ selected }: { selected: NetworkId | 'all' }) {
  const cls = (id: NetworkId) => `net net--${id} ${selected === id ? 'is-selected' : ''}`;
  return (
    <>
      <defs>
        <pattern id="sch-water" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <path d="M0 5H10" stroke="currentColor" strokeOpacity="0.35" />
        </pattern>
        <pattern id="sch-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="#fff" strokeOpacity="0.04" />
        </pattern>
      </defs>
      <rect width="560" height="420" fill="url(#sch-grid)" />

      {/* context plots (not a category) */}
      <g className="sch-plots">
        <rect x="30" y="28" width="270" height="112" />
        <rect x="400" y="28" width="130" height="112" />
        <rect x="30" y="274" width="270" height="80" />
      </g>

      {/* 10 Landscape and grading */}
      <g className={cls('landscape-grading')} data-net="landscape-grading">
        <rect x="400" y="268" width="140" height="88" className="net__area" />
        <path d="M410 350c20-26 52-30 74-52s40-26 52-24" className="net__contour" />
        <path d="M410 330c18-18 40-22 58-36s34-20 66-18" className="net__contour" />
        <path d="M414 304c14-10 32-14 46-22s26-8 70-4" className="net__contour" />
        {[
          [420, 284],
          [452, 340],
          [500, 320],
          [524, 286],
          [470, 296],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="6" className="net__tree" />
        ))}
        <Trace d="M400 268H540V356H400Z" />
      </g>

      {/* 09 Roads */}
      <g className={cls('roads')} data-net="roads">
        <path d="M0 178H560V232H0Z M330 0H376V178H330Z" className="net__area net__area--road" />
        <path d="M0 178H330M376 178H560M0 232H560M330 0V178M376 0V178" className="net__kerb" />
        <path d="M0 205H560M353 0V178" className="net__lane" />
        <Trace d="M0 205H560M353 205V0" />
      </g>

      {/* 11 Canals */}
      <g className={cls('canals')} data-net="canals">
        <path d="M0 374H560V402H0Z" className="net__canal" />
        <path d="M0 374H560M0 402H560" className="net__bank" />
        <Trace d="M0 388H560" />
      </g>

      {/* 01 Water */}
      <g className={cls('water')} data-net="water">
        <path d="M0 188H560M342 188V36M150 188V142M450 188V142" className="net__line" />
        {[150, 342, 450].map((x) => (
          <rect key={x} x={x - 4} y="184" width="8" height="8" className="net__valve" />
        ))}
        <Trace d="M0 188H560M342 188V36" />
      </g>

      {/* 04 Stormwater */}
      <g className={cls('stormwater')} data-net="stormwater">
        <path d="M0 212H560M470 212V268" className="net__line" />
        {inlets.map((x) => (
          <g key={x}>
            <rect x={x - 4} y="226" width="8" height="5" className="net__inlet" />
            <path d={`M${x} 226V212`} className="net__stub" />
          </g>
        ))}
        <Trace d="M0 212H560M470 212V268" />
      </g>

      {/* 02 Sewerage */}
      <g className={cls('sewerage')} data-net="sewerage">
        <path d="M0 222H560M150 222V274" className="net__line" />
        {manholes.map((x) => (
          <circle key={x} cx={x} cy="222" r="5" className="net__manhole" />
        ))}
        <Trace d="M0 222H560M150 222V274" />
      </g>

      {/* 06 LV / MV */}
      <g className={cls('lv-mv')} data-net="lv-mv">
        <path d="M0 162H560M424 162V140" className="net__line" />
        <path d="M0 167H560" className="net__line net__line--second" />
        <rect x="300" y="138" width="22" height="16" className="net__substation" />
        <Trace d="M0 164H560M424 164V140" />
      </g>

      {/* 08 CCTV and telecom */}
      <g className={cls('cctv-telecom')} data-net="cctv-telecom">
        <path d="M0 154H330M376 154H560M330 154V120" className="net__line" />
        {[
          [330, 120],
          [384, 150],
          [548, 150],
        ].map(([x, y]) => (
          <path key={`${x}${y}`} d={`M${x} ${y}l10 -6v12z`} className="net__camera" />
        ))}
        <Trace d="M0 154H330M376 154H560M330 154V120" />
      </g>

      {/* 07 Street lighting */}
      <g className={cls('street-lighting')} data-net="street-lighting">
        <path d="M0 173H560M0 238H560" className="net__cable" />
        {poles.map((x) => (
          <g key={x}>
            <circle cx={x} cy="173" r="9" className="net__halo" />
            <circle cx={x} cy="173" r="3.5" className="net__pole" />
            <circle cx={x + 30} cy="238" r="9" className="net__halo" />
            <circle cx={x + 30} cy="238" r="3.5" className="net__pole" />
          </g>
        ))}
        <Trace d="M0 173H560M0 238H560" />
      </g>

      {/* 05 Firefighting */}
      <g className={cls('firefighting')} data-net="firefighting">
        <path d="M0 248H560" className="net__line" />
        {hydrants.map((x) => (
          <g key={x}>
            <circle cx={x} cy="248" r="6" className="net__hydrant" />
            <path d={`M${x - 4} 248h8M${x} 244v8`} className="net__hydrant-cross" />
          </g>
        ))}
        <Trace d="M0 248H560" />
      </g>

      {/* 03 Irrigation */}
      <g className={cls('irrigation')} data-net="irrigation">
        <path d="M0 258H400M400 272H540M420 272V350M450 272V350M480 272V350M510 272V350M30 146H300" className="net__line" />
        <Trace d="M0 258H400V272H540M420 272V350M480 272V350" />
      </g>
    </>
  );
}
