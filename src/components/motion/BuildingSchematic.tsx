import type { BuildingSystemId } from '@/content/public/building-systems';
import { memoMarkup } from './static-svg';

/**
 * Vertical section through a building, used by the Buildings explorer.
 * Conceptual only: not to scale, no sizes, clearances or member design implied. Never mirrored.
 * Each discipline is a <g data-net> (same contract as the infrastructure schematic), so the shared
 * ExplorerControls mark, label and preview layers on it; `.net__trace` paths are the highlights.
 * Injected as static markup (see static-svg.ts): same DOM, no hydration cost.
 */

/** Slab tops (roof, then the floors of levels 3, 2, 1 and ground); every slab is 7 units thick. */
const SLABS = [90, 150, 210, 270, 330];
/** Slabs with a ceiling void below them (they serve the storey underneath). */
const CEILINGS = [90, 150, 210, 270];
/** Floor surfaces carrying fixtures. */
const FLOORS = [150, 210, 270, 330];
const COLUMNS = [150, 236, 316, 402];

function Trace({ d }: { d: string }) {
  return <path d={d} className="net__trace" pathLength={1} />;
}

export function BuildingSchematic({ selected }: { selected: BuildingSystemId | 'all' }) {
  return (
    <svg
      viewBox="0 0 560 420"
      className="schematic schematic--building"
      data-selected={selected}
      aria-hidden="true"
      focusable="false"
      role="presentation"
      dangerouslySetInnerHTML={artMarkup(selected)}
    />
  );
}

const artMarkup = memoMarkup((selected: BuildingSystemId | 'all') => <BuildingSchematicArt selected={selected} />);

/** The artwork inside the <svg>. */
export function BuildingSchematicArt({ selected }: { selected: BuildingSystemId | 'all' }) {
  const cls = (id: BuildingSystemId) => `net bld--${id} ${selected === id ? 'is-selected' : ''}`;
  return (
    <>
      <defs>
        <pattern id="bld-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="#fff" strokeOpacity="0.04" />
        </pattern>
        <pattern id="bld-earth" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 4H8" stroke="currentColor" strokeOpacity="0.22" />
        </pattern>
        <pattern id="bld-paving" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M6 0H0V6" fill="none" stroke="currentColor" strokeOpacity="0.55" />
        </pattern>
      </defs>
      <rect width="560" height="420" fill="url(#bld-grid)" />

      {/* context: ground, earth and ceiling lines (not a discipline) */}
      <g className="bld-context">
        <path d="M0 330H150V398H410V330L560 340V420H0Z" className="bld__earth" />
        <path d="M0 330H150M410 330L560 340" className="bld__ground" />
        {CEILINGS.map((s) => (
          <path key={s} d={`M158 ${s + 38}H402`} className="bld__ceiling" />
        ))}
        <path d="M150 292V330" className="bld__entrance" />
      </g>

      {/* 08 Landscape and external works */}
      <g className={cls('landscape')} data-net="landscape">
        <rect x="60" y="330" width="90" height="6" className="bld__paving" />
        <path d="M410 330L560 340" className="bld__lawn" />
        <path d="M418 338.5L548 347" className="bld__irrigation" />
        {[440, 470, 500, 530].map((x) => (
          <circle key={x} cx={x} cy={339 + (x - 418) * 0.065} r="1.6" className="bld__drip" />
        ))}
        {[
          [30, 300, 16, 330],
          [448, 300, 16, 332.5],
          [512, 296, 20, 336.8],
        ].map(([x, y, r, ground]) => (
          <g key={x}>
            <path d={`M${x} ${y + r}V${ground}`} className="bld__trunk" />
            <circle cx={x} cy={y} r={r} className="bld__tree" />
          </g>
        ))}
        <circle cx="478" cy="328" r="6" className="bld__tree" />
        <circle cx="544" cy="333" r="6" className="bld__tree" />
        <rect x="224" y="80" width="40" height="10" className="bld__planter" />
        {[232, 244, 256].map((x) => (
          <circle key={x} cx={x} cy="76" r="4.5" className="bld__tree" />
        ))}
        <Trace d="M0 330H150M410 330L560 340M224 85H264" />
      </g>

      {/* 01 Structural frame */}
      <g className={cls('structure')} data-net="structure">
        <rect x="142" y="384" width="276" height="14" className="bld__concrete" />
        {COLUMNS.map((x) => (
          <rect key={x} x={x} y="90" width="8" height="294" className="bld__concrete" />
        ))}
        {SLABS.map((s) => (
          <rect key={s} x="150" y={s} width="260" height="7" className="bld__concrete" />
        ))}
        {CEILINGS.map((s) => (
          <rect key={s} x="244" y={s + 7} width="72" height="9" className="bld__concrete" />
        ))}
        <rect x="150" y="80" width="4" height="10" className="bld__concrete" />
        <rect x="406" y="80" width="4" height="10" className="bld__concrete" />
        <Trace d="M150 93.5H410M150 153.5H410M150 213.5H410M150 273.5H410M150 333.5H410M154 90V384M406 90V384M142 391H418" />
      </g>

      {/* 02 Reinforcement detailing */}
      <g className={cls('reinforcement')} data-net="reinforcement">
        {SLABS.map((s) => (
          <path key={s} d={`M152 ${s + 2}H408M152 ${s + 5}H408`} className="bld__mesh" />
        ))}
        {CEILINGS.map((s) => (
          <g key={s}>
            <path d={`M246 ${s + 9}H314M246 ${s + 14}H314`} className="bld__bar" />
            <path d={[250, 258, 266, 274, 282, 290, 298, 306].map((x) => `M${x} ${s + 8}V${s + 15}`).join('')} className="bld__stirrup" />
          </g>
        ))}
        {[236, 316].map((c) => (
          <g key={c}>
            <path d={`M${c + 2} 90V384M${c + 6} 90V384`} className="bld__bar" />
            <path d={Array.from({ length: 20 }, (_, i) => `M${c + 1} ${104 + i * 14}H${c + 7}`).join('')} className="bld__stirrup" />
          </g>
        ))}
        <path d="M144 387H416M144 395H416" className="bld__bar" />
        {/* section detail of a beam: stirrup and corner bars */}
        <path d="M114 128L244 219" className="bld__leader" />
        <circle cx="72" cy="112" r="46" className="bld__bubble" />
        <rect x="52" y="86" width="40" height="52" className="bld__section" />
        <rect x="57" y="91" width="30" height="42" rx="3" className="bld__stirrup" />
        {[
          [62, 96],
          [82, 96],
          [62, 128],
          [72, 128],
          [82, 128],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="3" className="bld__bardot" />
        ))}
        <Trace d="M246 219H314M246 224H314M318 90V384M322 90V384M118 112a46 46 0 1 1 -92 0a46 46 0 1 1 92 0" />
      </g>

      {/* 03 HVAC */}
      <g className={cls('hvac')} data-net="hvac">
        <rect x="166" y="62" width="48" height="28" className="bld__equip" />
        <circle cx="184" cy="76" r="7" className="bld__fan" />
        <path d="M196 68h12M196 74h12M196 80h12" className="bld__stub" />
        <rect x="214" y="66" width="70" height="8" className="bld__duct" />
        <rect x="276" y="74" width="8" height="256" className="bld__duct" />
        {CEILINGS.map((s) => (
          <g key={s}>
            <rect x="160" y={s + 18} width="238" height="7" className="bld__duct" />
            <path d={[190, 226, 350, 386].map((x) => `M${x} ${s + 25}v3M${x - 4} ${s + 28}h8`).join('')} className="bld__stub" />
          </g>
        ))}
        <Trace d="M214 70H280V330M160 111.5H398M160 171.5H398M160 231.5H398M160 291.5H398" />
      </g>

      {/* 04 Plumbing and drainage */}
      <g className={cls('plumbing')} data-net="plumbing">
        <rect x="330" y="58" width="50" height="32" className="bld__equip" />
        <path d="M334 70H376" className="bld__stub" />
        <path d="M338 90V360" className="bld__pipe" />
        <rect x="328" y="360" width="20" height="18" className="bld__equip" />
        <circle cx="338" cy="369" r="5" className="bld__fan" />
        {FLOORS.map((f) => (
          <g key={f}>
            <path d={`M338 ${f - 14}H370`} className="bld__pipe bld__pipe--thin" />
            <rect x="370" y={f - 20} width="12" height="10" className="bld__fixture" />
            <path d={`M382 ${f - 12}L396 ${f - 8}`} className="bld__pipe bld__pipe--drain bld__pipe--thin" />
          </g>
        ))}
        <path d="M396 72V372L470 382" className="bld__pipe bld__pipe--drain" />
        <path d="M391 72h10" className="bld__stub" />
        <path d="M470 334.5V376" className="bld__stub" />
        <circle cx="470" cy="382" r="6" className="bld__manhole" />
        <Trace d="M338 90V360M396 72V372L470 382" />
      </g>

      {/* 05 Fire protection */}
      <g className={cls('fire-protection')} data-net="fire-protection">
        <rect x="166" y="356" width="38" height="22" className="bld__equip" />
        <circle cx="180" cy="367" r="5" className="bld__fan" />
        <path d="M172 356V96" className="bld__pipe" />
        {CEILINGS.map((s) => (
          <g key={s}>
            <path d={`M172 ${s + 29}H396`} className="bld__pipe bld__pipe--thin" />
            {[196, 232, 268, 304, 340, 376].map((x) => (
              <circle key={x} cx={x} cy={s + 33} r="2.2" className="bld__head" />
            ))}
          </g>
        ))}
        {FLOORS.map((f) => (
          <rect key={f} x="160" y={f - 22} width="8" height="12" className="bld__equip" />
        ))}
        <path d="M172 318H134" className="bld__pipe bld__pipe--thin" />
        <rect x="126" y="312" width="8" height="12" className="bld__equip" />
        <Trace d="M172 356V96M172 119H396M172 179H396M172 239H396M172 299H396" />
      </g>

      {/* 06 Power and lighting */}
      <g className={cls('power')} data-net="power">
        <rect x="214" y="348" width="44" height="32" className="bld__equip" />
        <path d="M239 354l-6 11h6l-4 10" className="bld__bolt" />
        <path d="M262 348V96" className="bld__pipe" />
        {CEILINGS.map((s) => (
          <g key={s}>
            <path d={`M160 ${s + 11}H236M324 ${s + 11}H398`} className="bld__tray" />
            {[178, 214, 344, 380].map((x) => (
              <rect key={x} x={x - 4} y={s + 38} width="8" height="2.5" className="bld__light" />
            ))}
          </g>
        ))}
        <path d="M258 376H418L520 340" className="bld__cable" />
        <path d="M520 337V292" className="bld__pipe bld__pipe--thin" />
        <circle cx="520" cy="290" r="9" className="bld__halo" />
        <circle cx="520" cy="290" r="3" className="bld__light" />
        <Trace d="M262 348V96M160 101H236M324 101H398M160 161H236M324 161H398M160 221H236M324 221H398M160 281H236M324 281H398M520 337V292" />
      </g>

      {/* 07 Low current systems */}
      <g className={cls('elv')} data-net="elv">
        <rect x="286" y="352" width="18" height="14" className="bld__equip" />
        <path d="M295 352V96" className="bld__elv" />
        {CEILINGS.map((s) => (
          <g key={s}>
            <path d={`M160 ${s + 14}H236M324 ${s + 14}H398`} className="bld__elv" />
            {[196, 360].map((x) => (
              <circle key={x} cx={x} cy={s + 40.5} r="2" className="bld__device" />
            ))}
          </g>
        ))}
        <path d="M136 288H150" className="bld__elv" />
        <path d="M136 288l-14 -5v10z" className="bld__device" />
        <rect x="160" y="300" width="6" height="9" className="bld__device" />
        <Trace d="M295 352V96M160 104H236M324 104H398M160 164H236M324 164H398M160 224H236M324 224H398M160 284H236M324 284H398M150 288H122" />
      </g>
    </>
  );
}
