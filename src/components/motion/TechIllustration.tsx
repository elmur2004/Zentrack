import { box, iso, isoEllipse, line, rect, type IsoFrame } from './iso';
import { memoMarkup } from './static-svg';

export type IllustrationKind = 'review' | 'model' | 'coordination' | 'drawing' | 'quantities' | 'site' | 'register';

/** One illustration per Zentrac Track stage, in stage order. */
export const TRACK_VISUALS: IllustrationKind[] = ['review', 'model', 'coordination', 'drawing', 'quantities', 'site'];

const F: IsoFrame = { cx: 150, cy: 70, unit: 22 };

/**
 * Original generic line illustrations (decorative, aria-hidden). They depict kinds of
 * deliverables, not any specific project. Colours come from CSS custom properties so the
 * same artwork works on light and dark surfaces. Never mirrored for RTL.
 * The artwork is injected as static markup (see static-svg.ts): same DOM, no hydration cost.
 */
export function TechIllustration({ kind, className = '' }: { kind: IllustrationKind; className?: string }) {
  return (
    <svg
      viewBox="0 0 320 240"
      className={`tech-illus tech-illus--${kind} ${className}`}
      aria-hidden="true"
      focusable="false"
      role="presentation"
      dangerouslySetInnerHTML={artMarkup(kind)}
    />
  );
}

const artMarkup = memoMarkup((kind: IllustrationKind) => <TechIllustrationArt kind={kind} />);

/** The artwork inside the <svg>. Background grid is drawn by CSS on the frame. */
export function TechIllustrationArt({ kind }: { kind: IllustrationKind }) {
  return (
    <>
      {kind === 'model' && <Model />}
      {kind === 'coordination' && <Coordination />}
      {kind === 'drawing' && <Drawing />}
      {kind === 'review' && <Review />}
      {kind === 'quantities' && <Quantities />}
      {kind === 'site' && <Site />}
      {kind === 'register' && <Register />}
    </>
  );
}

function Model() {
  const g = rect(F, 0, 0, 6, 5);
  const a = box(F, 0.6, 0.6, 3.4, 3.0, 54);
  const b = box(F, 3.8, 1.0, 5.4, 2.6, 30);
  return (
    <g>
      <path d={g} className="ti-plane" />
      {[1, 2, 3, 4, 5].map((x) => (
        <path key={x} d={line(F, [[x, 0], [x, 5]])} className="ti-fine" />
      ))}
      {[1, 2, 3, 4].map((y) => (
        <path key={y} d={line(F, [[0, y], [6, y]])} className="ti-fine" />
      ))}
      <g className="ti-solid">
        <path d={a.left} className="ti-face-l" />
        <path d={a.right} className="ti-face-r" />
        <path d={a.top} className="ti-face-t ti-accent-fill" />
        <path d={b.left} className="ti-face-l" />
        <path d={b.right} className="ti-face-r" />
        <path d={b.top} className="ti-face-t" />
      </g>
      <path d={line(F, [[0.6, 3.0, 54], [0.6, 3.0, 0]])} className="ti-accent-line" />
      <path d={line(F, [[0, 5.6], [6, 5.6]])} className="ti-dim" />
      <path d={line(F, [[0, 5.45], [0, 5.75]])} className="ti-dim" />
      <path d={line(F, [[6, 5.45], [6, 5.75]])} className="ti-dim" />
    </g>
  );
}

function Coordination() {
  const P: IsoFrame = { cx: 150, cy: 60, unit: 24 };
  const crossing = isoEllipse(P, 3, 2.5, 18, 0.55);
  return (
    <g>
      <path d={rect(P, 0, 0, 6, 5)} className="ti-plane" />
      <path d={line(P, [[0, 2.5, 18], [6, 2.5, 18]])} className="ti-pipe" />
      <path d={line(P, [[0, 2.5, 18], [6, 2.5, 18]])} className="ti-pipe-core" />
      <path d={line(P, [[3, 0, 14], [3, 5, 22]])} className="ti-pipe ti-pipe--b" />
      <path d={line(P, [[3, 0, 14], [3, 5, 22]])} className="ti-pipe-core ti-pipe-core--b" />
      <path d={line(P, [[1, 4.2, 0], [5.4, 4.2, 0]])} className="ti-dash" />
      <ellipse {...crossing} className="ti-clash" />
      <path d={`M${crossing.cx + 26} ${crossing.cy - 36}h40`} className="ti-leader" />
      <path d={`M${crossing.cx + 8} ${crossing.cy - 12}L${crossing.cx + 26} ${crossing.cy - 36}`} className="ti-leader" />
      <rect x={crossing.cx + 66} y={crossing.cy - 44} width="16" height="16" className="ti-tag" />
    </g>
  );
}

function Drawing() {
  return (
    <g>
      <rect x="40" y="26" width="240" height="176" className="ti-sheet" />
      <rect x="50" y="36" width="220" height="156" className="ti-fine-rect" />
      <rect x="206" y="152" width="64" height="40" className="ti-fine-rect" />
      <path d="M206 165h64M206 178h64M238 152v40" className="ti-fine" />
      <path d="M58 92h138M58 120h138" className="ti-line" />
      <path d="M150 44v48M178 44v48" className="ti-line" />
      <path d="M58 104h138" className="ti-dash" />
      <path d="M58 112h138" className="ti-dash ti-dash--b" />
      <path d="M66 104v-30h40" className="ti-accent-line" />
      <circle cx="120" cy="112" r="5" className="ti-node" />
      <circle cx="164" cy="104" r="5" className="ti-node" />
      <rect x="62" y="48" width="44" height="30" className="ti-fine-rect" />
      <rect x="62" y="134" width="56" height="40" className="ti-fine-rect" />
      <path d="M58 186h138M58 182v8M196 182v8" className="ti-dim" />
    </g>
  );
}

function Review() {
  return (
    <g>
      <rect x="70" y="40" width="150" height="176" className="ti-sheet ti-sheet--back" />
      <rect x="54" y="28" width="150" height="176" className="ti-sheet" />
      {[58, 76, 94, 112, 130, 148, 166].map((y, i) => (
        <path key={y} d={`M72 ${y}h${i % 3 === 0 ? 96 : 114}`} className="ti-line ti-line--text" />
      ))}
      <rect x="66" y="104" width="124" height="16" className="ti-highlight" />
      <circle cx="210" cy="128" r="34" className="ti-lens" />
      <path d="M234 152l30 30" className="ti-lens-handle" />
      <path d="M196 128h28M210 114v28" className="ti-accent-line" />
    </g>
  );
}

function Quantities() {
  const P: IsoFrame = { cx: 96, cy: 120, unit: 20 };
  const seg = box(P, 0, 0, 4, 0.8, 16);
  return (
    <g>
      <rect x="150" y="34" width="140" height="172" className="ti-sheet" />
      {[60, 84, 108, 132, 156, 180].map((y) => (
        <path key={y} d={`M150 ${y}h140`} className="ti-fine" />
      ))}
      <path d="M196 34v172M246 34v172" className="ti-fine" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect
          key={i}
          x="252"
          y={66 + i * 24}
          width={[30, 18, 26, 12, 22, 16][i]}
          height="12"
          className={i === 2 ? 'ti-bar ti-bar--accent' : 'ti-bar'}
        />
      ))}
      <g className="ti-solid">
        <path d={seg.left} className="ti-face-l" />
        <path d={seg.right} className="ti-face-r" />
        <path d={seg.top} className="ti-face-t" />
      </g>
      <path d={line(P, [[0, -0.6], [4, -0.6]])} className="ti-dim" />
      <path d={`M${iso(P, 4, 0.4, 16)[0] + 8} ${iso(P, 4, 0.4, 16)[1]}H150`} className="ti-leader" />
    </g>
  );
}

function Site() {
  const P: IsoFrame = { cx: 150, cy: 80, unit: 22 };
  const b = box(P, 1.0, 1.0, 3.2, 3.0, 40);
  const ok = isoEllipse(P, 4.6, 3.6, 0, 0.6);
  return (
    <g>
      <path d={rect(P, 0, 0, 6, 5)} className="ti-plane" />
      <path d={line(P, [[0, 4.2], [6, 4.2]])} className="ti-dash" />
      <g className="ti-solid">
        <path d={b.left} className="ti-face-l" />
        <path d={b.right} className="ti-face-r" />
        <path d={b.top} className="ti-face-t" />
      </g>
      <path d={line(P, [[4.6, 3.6, 0], [4.6, 3.6, 56]])} className="ti-accent-line" />
      <path
        d={`M${iso(P, 4.6, 3.6, 56)[0]} ${iso(P, 4.6, 3.6, 56)[1]}l26 7-26 7z`}
        className="ti-flag"
      />
      <ellipse {...ok} className="ti-ok" />
    </g>
  );
}

function Register() {
  const rows = [0, 1, 2, 3, 4];
  return (
    <g>
      <rect x="34" y="34" width="252" height="172" className="ti-sheet" />
      <rect x="34" y="34" width="252" height="26" className="ti-head" />
      {rows.map((i) => (
        <g key={i}>
          <path d={`M34 ${86 + i * 24}h252`} className="ti-fine" />
          <rect x="46" y={68 + i * 24} width="34" height="8" className="ti-cell" />
          <rect x="94" y={68 + i * 24} width={[110, 84, 120, 96, 70][i]} height="8" className="ti-cell ti-cell--muted" />
          <circle cx="266" cy={72 + i * 24} r="5" className={i === 1 ? 'ti-status ti-status--open' : 'ti-status'} />
        </g>
      ))}
    </g>
  );
}
