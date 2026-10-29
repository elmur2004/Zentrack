# Animation enhancements (03 §7)

Pass date: 28 October 2026. Production build (`next build` + `next start`, port 3005), Chromium 1248 (Playwright 1.64.1) unless stated. The motion system was kept as built (CSS keyframes/transitions; GSAP 3.15 loaded on demand for the Track and hero pointer response) and refined in place. No library was added.

## Evidence

Timing evidence comes from deterministic filmstrips (`scripts/motion-filmstrip.mjs`): every CSS animation is paused with the Web Animations API and seeked to an exact time, so frames from the two builds are comparable. Screen recordings show real-time playback.

| What | Before | After |
| --- | --- | --- |
| Hero, `/en` at 1440 px, 0–2000 ms | `docs/qa/before/filmstrips/hero-en-1440.png` | `docs/qa/after/filmstrips/hero-en-1440.png` |
| Hero, `/ar` at 390 px | `docs/qa/before/filmstrips/hero-ar-390.png` | `docs/qa/after/filmstrips/hero-ar-390.png` |
| Hero final frame (2000 ms) | `docs/qa/before/filmstrips/hero-en-1440-2000.png` | `docs/qa/after/filmstrips/hero-en-1440-2000.png` |
| Explorer: first selection, switching, re-selection | `docs/qa/before/filmstrips/explorer-en-1440.png` | `docs/qa/after/filmstrips/explorer-en-1440.png` |
| Arabic explorer labels + reduced-motion hero | — | `docs/qa/after/filmstrips/explorer-ar-and-reduced.png` |
| Track, all six stages, EN and AR | `docs/qa/before/filmstrips/track-{en,ar}-1440.png` | `docs/qa/after/filmstrips/track-{en,ar}-1440.png` |
| Recordings (WebM): hero EN/AR, explorer, Track AR | `docs/qa/before/videos/` | `docs/qa/after/videos/` |

Regenerate: `node scripts/motion-filmstrip.mjs http://localhost:3005 docs/qa/after/filmstrips` and `node scripts/record-motion.mjs http://localhost:3005 docs/qa/after/videos` against a production build.

## Inventory and original problems

| Area | Problem found (before) | Severity |
| --- | --- | --- |
| Hero: coordination route | An orange fragment was already visible at 0 ms, before anything else had appeared (frame `hero-en-1440-0000.png`). Cause: the route used `pathLength` dashes while a global rule gave every SVG stroke `vector-effect: non-scaling-stroke`, which makes dash lengths screen-based, so the "hidden" dash did not cover the path. | P2 |
| Hero: coordination route | In the final frame most of the route was invisible: the same dash bug, plus the route ran under the opaque street surface. The signature "highlighted coordination path" barely read. | P2 |
| Hero: sequence | Projection lines appeared before the drawing sheet they lead to; the drawing plane arrived with no "handover" beat, so the last third of the sequence had no clear meaning. | P3 |
| Explorer | The selected trace re-drew from zero on every click (queued work on rapid switching, no added meaning on the second view); the diagram had no on-diagram label, so the link between the button list and the drawing was colour-only. | P2 |
| Explorer | Thin 1.x px trace at desktop sizes; no hover/focus preview; detail text swapped abruptly. | P3 |
| Track | Inactive stage titles had nearly the same weight as the active one; slides always entered from the same direction, so scrolling back looked like scrolling forward; the caption showed the stage number without the total. | P3 |
| Track | The highlighted station only updated on the next scroll event: entering mid-Track (anchor link, restored scroll, slow script) showed stage 01 until the visitor scrolled. | P2 (found by the new journey test J5) |
| Track | ScrollTrigger measures by scrolling to the top and back right after a trigger is created; when GSAP finished loading while the visitor was scrolling toward the Track, their scroll was cut short (reproduced in J5 under load). | P2 |
| Track (phones) | GSAP + ScrollTrigger (~40 KB gz) downloaded and executed on phones as the Track approached, although the scroll-driven Track only exists at ≥ 64 rem. | P3 (performance) |
| Reveals | Every `[data-reveal]` element was measured with `getBoundingClientRect()` while state attributes were written in between: one forced style/layout per element on load (~25 ms on a 4× slowed CPU). Elements partly visible at the bottom edge were hidden after first paint and re-revealed. | P2 (performance) / P3 |
| Microinteractions | Buttons had no pressed state; form messages and results appeared without transition. | P3 |

## Implemented refinements

### A. Hero (`HeroScene.tsx`, `scenes.css`)

Sequence (desktop; phones run the same storyboard at 0.8× with links, projections, contours and tree shadows removed):

| Time | Beat |
| --- | --- |
| 0–900 ms | Surface plane settles (base/reference plane) |
| 150–900 ms | Utility layer slides into alignment beneath the road corridor |
| 550–900 ms | Risers link the utility layer to the surface |
| 600–1200 ms | The coordination route draws, led by a brighter head; start node at 600 ms, the mid node pops at 880 ms |
| 1050–1650 ms | Conceptual issue ring pops at the crossing and fades; the route shows through the street as a dashed hidden line from 1150 ms |
| 1350 ms | The issue resolves to a tick |
| 1000–1470 ms | Projection lines grow up from the model, staggered 40 ms, as the drawing sheet arrives (1050–1650 ms) |
| 1350–1800 ms | Handover: the same route is drawn onto the sheet |
| after 1.8 s | Still. No loop, no metric, caption "Illustrative coordination model" |

- Fixed the dash bug at its cause: the animated paths opt out of `non-scaling-stroke` (`vector-effect: none`), so `pathLength="1"` dashes are exact; nothing is visible at 0 ms (`hero-en-1440-0000.png` after).
- Added the hidden-line view of the route through the street (drawing convention), so the full coordinated route reads in the final frame.
- Projection lines now grow with the sheet; the sheet's accent route is the handover beat that ties model to drawing.
- Copy is never delayed: the hero text is opaque from the first paint (transform-only rise, ≤ 240 ms stagger).
- Pointer response unchanged (±3°, mouse pointers ≥ 1024 px, off for touch and reduced motion).

### B. Infrastructure explorer (`ExplorerControls.tsx`, `NetworkExplorer.tsx`, `components.css`)

- An on-diagram label (number + name, e.g. "06 LV / MV Power", Arabic in Arabic) points at the selected layer. Anchors are in the diagram's own coordinates, so the label lands on the same geometry in both languages; the diagram is never mirrored. The label duplicates the announced description, so it is `aria-hidden`.
- Selected state uses shape and text as well as colour: heavier 2.6 px trace, an inline-start bar on the pressed button, the label and the heading.
- The trace draws (600 ms) only the first time a layer is selected; later selections fade in (180 ms). Rapid switching never queues animations; the label restarts its 220 ms entrance only for the new selection.
- Hover (mouse) or keyboard focus previews a layer; selection remains the real state and works identically by touch and keyboard (native buttons, `aria-pressed`).
- The description crossfades (240 ms) while assistive technology gets the new text immediately (`aria-live="polite"`).

### C. Zentrac Track (`TrackController.tsx`, `ZentracTrack.tsx`, `components.css`)

- Inactive stage titles are muted, the active stage is navy; stations behind the reader fill in.
- Slides enter from the direction of travel: upcoming slides wait 16 px below, passed slides 16 px above (`data-passed`), so scrolling back looks like going back (380 ms opacity, 480 ms transform).
- Caption shows "03 / 06" (Arabic order preserved with isolation).
- The active stage is synced when the trigger is created and on every refresh, so anchor entry and restored scroll show the right stage immediately.
- The trigger is created only after scrolling pauses (160 ms), and font re-measurement uses ScrollTrigger's scroll-safe refresh, only when fonts were still loading, so initialisation never interrupts a visitor's scroll.
- GSAP loads only when the enhanced layout applies (≥ 64 rem and motion allowed); on phones it is never downloaded (verified: no GSAP request after scrolling the whole home page at 390 px), and it loads later if the window grows into the desktop layout.
- Native scrolling only: no pinning, no scroll hijack. Phones and reduced motion get the static vertical timeline.

### D. Supporting microinteractions

- Buttons: 120 ms transform transition and a 1 px pressed state.
- Section reveals: a row of cards arriving together is staggered 70 ms per item (max 4) and the delay is cleared after the transition, so later hovers are immediate.
- Forms: field messages and notices fade in (180 ms); the result panel rises in (480 ms); errors clear as soon as a field becomes valid (and blur validation waits for a press to end — see BUG-02 in `docs/post-build-audit.md`).
- Kept: 160–220 ms for small UI feedback, 560 ms reveals, hover effects limited to colour, rail and 3–4 px arrow nudges; no hit-area changes.

### E. Robustness and lifecycle

| Check | Result / evidence |
| --- | --- |
| Final static state if animation or scripts fail | Every scene's default CSS state is its final frame; no-JS journey J10 shows the complete hero illustration, all six Track stages and all 11 infrastructure descriptions (`tests/e2e/journeys.spec.ts`, `interactions.spec.ts` L20) |
| Reduced motion at load | Hero shows its final frame immediately (`explorer-ar-and-reduced.png`); Track static/vertical; no armed reveals (`interactions.spec.ts`) |
| Reduced motion switched on mid-session | All armed reveals become visible and the hero's CSS animations are removed (`responsive.spec.ts`, "turning reduced motion on mid-session") |
| Rapid repeated selection | J4: five selections without waits → one pressed button, one selected layer, one label |
| Listener cleanup | `RevealController`, `TrackController`, `ExplorerControls`, form press tracking: every listener/observer is removed in the effect cleanup; GSAP contexts are reverted by `gsap.matchMedia()` on unmount or when the media condition stops matching |
| Duplicate triggers after re-navigation | One `ScrollTrigger` per mounted Track; re-mount creates a new context after the old one is reverted |
| Offscreen work | No perpetual loops; hero pointer listeners attach only while the hero intersects; GSAP is not loaded unless needed |
| Forced layout | Reveal classification now uses the observer's first report: no per-element `getBoundingClientRect()` on load |
| Measured cost | Hero sequence on a 4× slowed CPU: ~40 ms of blocking time (mostly paint); kept, because it is the brand's signature scene. See `docs/performance-before-after.md` |
| Arabic | Never animated per glyph; no letter-spacing on Arabic; diagrams and the hero geometry are not mirrored; Track progress grows from the inline start (right in Arabic) (`track-ar-1440.png`) |

## Judgements recorded

- **Mobile hero kept animated** (simplified, 0.8×) rather than made static: the measured cost is small and the scene completes before most visitors scroll to it.
- **No `content-visibility` on long pages:** it would cut paint work, but it changes layout measurement for the scroll-driven Track and anchor jumps; the measured gain (≈ 40 ms blocking time on a 4× CPU) did not justify the risk.
- **No route transitions** were added (M12 stays immediate).
