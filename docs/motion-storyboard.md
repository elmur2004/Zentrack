# Motion storyboard

Principle: build the final static state first; motion only reveals how coordinated work becomes deliverable work. Every scene’s **default (un-animated) state is its final frame**, so reduced motion, no-JS, failed scripts and print all show complete content.

## Engineering choices

| Concern | Implementation |
| --- | --- |
| Simple states (buttons, menus, reveals, explorer path draw, hero assembly) | CSS transitions/keyframes |
| Scroll-linked Track and hero pointer response | GSAP 3.15 (`gsap`, `gsap/ScrollTrigger`) loaded **on demand** (`import()`): when the Track is within 600 px of the viewport **and** the scroll-driven layout applies (≥ 64 rem, motion allowed — never on phones), or on the first mouse movement over the hero. The trigger is created after scrolling pauses, so ScrollTrigger's measurement never interrupts a visitor's scroll |
| Scoping and teardown | `gsap.matchMedia()` / `gsap.context()` per component; reverted on unmount and when the breakpoint or motion preference stops matching (this is the same mechanism `useGSAP` wraps — the hook was dropped so GSAP is not in the initial bundle) |
| Hydration | Scenes are server-rendered markup; client “controllers” (`HeroTilt`, `ServicePreviewController`, `TrackController`, `ExplorerControls`) only attach behaviour. Static SVG artwork (hero, schematic, technical illustrations) is injected as pre-serialized markup (`static-svg.ts`): same DOM, no RSC payload or hydration for it |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables all keyframes/transitions; JS paths check `matchMedia` and listen for changes |
| Offscreen | Pointer listeners attach only while the hero is intersecting; no perpetual loops anywhere |

Tokens: fast 160 ms, UI 220 ms, reveal 560 ms, scene 1.6–1.75 s; ease `cubic-bezier(0.22, 1, 0.36, 1)`.

## M01–M14

| ID | What happens | Timing | RTL / mobile | Reduced motion |
| --- | --- | --- | --- | --- |
| M01 Hero copy | Eyebrow, H1, lead, CTAs, descriptors rise 16 px into place, staggered 60 ms (≤240 ms total). **Transform only — fully opaque from first paint** | 560 ms | Whole blocks, never glyphs; 10 px on mobile | Static |
| M02 Hero assembly | See “Hero storyboard” below: base plane → aligned utility layer → coordination route with a bright head → issue resolves → projection lines + drawing sheet → route drawn onto the sheet (handover) | 1.8 s one-shot (0.8× on phones) | Scene moves to the end column (left in Arabic); geometry identical; risers, projections, contours and tree shadows hidden < 640 px | Final frame only |
| M03 Pointer response | ±3° tilt, ≤8 px shift, eased reset on leave | 0.8 s quickTo | Mouse pointers ≥ 1024 px only; off on touch | Off |
| M04 Header | Transparent → navy after 12 px scroll | 220 ms | Same both locales; height constant (tested) | Instant |
| M05 Section reveal | Elements that start fully below the fold rise 20 px (12 px mobile) on first entry; items arriving together stagger 70 ms (max 4); anything visible on load, even partly, is never hidden. Positions come from the observer's first report (no forced layout) | 560 ms | Same | No transform/opacity entrance; switching reduced motion on reveals everything |
| M06 Service preview | Hover/focus on a row moves the orange rail and crossfades the illustration | 180 / 300 ms | Rail on inline-start | Instant |
| M07 Explorer | Selected layer turns orange and heavier (2.6 px), others dim; an on-diagram label (number + name) points at it; the trace draws only on a layer's first selection, later selections fade in; hover/focus previews a layer; the description crossfades | 600 ms draw / 180 ms fade / 220 ms label / 240 ms text | Label anchored in diagram coordinates (same geometry in Arabic, Arabic text); buttons stack on mobile | Instant highlight |
| M08 Track | Orange line scrubs with page scroll (scrub 0.5 s); the current station and illustration activate, passed stations fill in; slides enter from the direction of travel (16 px below forward, above backward); caption “03 / 06”; active stage synced on entry and refresh | scroll-linked; slides 380/480 ms | Line grows from inline-start (right in Arabic); mobile = vertical timeline, markers on inline-start, GSAP not loaded | All stages static, sticky visual removed |
| M09 Project card | Image scales to 1.025; arrow nudges 4 px in reading direction | 300 ms | Arrow mirrored | No scale |
| M10 Filters | Instant list update; result count announced politely | — | Counts use Arabic plural rules | — |
| M11 Menu | Drawer slides 24 px from inline-end; disclosure chevron rotates | 260 ms | Slides from the left in Arabic | Instant |
| M12 Route change | None (navigation stays immediate) | — | — | — |
| M13 CTA | Arrow nudges 3 px in reading direction | 160 ms | Mirrored | Colour/border only |
| M14 Form feedback | Spinner + “Sending your request…” in a polite live region; field messages fade in (180 ms); result rises in (480 ms) and receives focus; errors clear as soon as a field is valid; blur validation waits for a press to end (nothing moves under the pointer) | 180 / 480 ms | Localized | Static text (spinner stops) |

## Hero storyboard (spec §11.3; refined in the 03 pass)

1. 0–900 ms — base plane and reference grid settle (surface layer).
2. 150–900 ms — utility runs (dashed/dotted per network) slide into alignment beneath the road corridor; risers fade in (550–900 ms).
3. 600–1200 ms — the orange coordination route draws from a building service connection along the corridor to a crossing, led by a brighter head; the mid node pops at 880 ms.
4. 1050–1650 ms — a conceptual issue ring pops at the crossing and fades; the route shows through the street as a dashed hidden line (1150 ms); the issue resolves to a neutral tick (1350 ms).
5. 1000–1650 ms — projection lines grow up from the model (staggered 40 ms) as the drawing sheet arrives; 1350–1800 ms the same route is drawn onto the sheet (handover).
6. After — still. No replay loop, no metric implied. Caption: “Illustrative coordination model”.

Animated strokes use `pathLength="1"` dashes with `vector-effect: none` (the global non-scaling-stroke rule made dash lengths screen-based). Before/after filmstrips: `docs/animation-enhancements.md`.

## Verified behaviour (Playwright, production build)

- Reduced motion: hero H1 opacity 1 at load, hero sheet `animation-name: none`, no armed reveals after scrolling, Track visual hidden, all six stages visible.
- No JavaScript: How We Work stages and all 11 infrastructure descriptions visible; hero CTA navigates.
- Track: station 06 active after scrolling to the last stage; progress bar scale > 0.85; station click updates the URL hash.
- Header height unchanged when it turns solid.
- Journeys J4/J5 (EN, AR): rapid explorer selection leaves one pressed button, one selected layer and one label; the Track highlights the right stage when entered by anchor; reduced motion switched on mid-session reveals everything (`tests/e2e/journeys.spec.ts`, `responsive.spec.ts`).
