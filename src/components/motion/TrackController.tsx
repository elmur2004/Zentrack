'use client';

import { useEffect } from 'react';

/** The only condition in which the Track is scroll-driven (desktop layout, motion allowed). */
const ENHANCED = '(min-width: 64rem) and (prefers-reduced-motion: no-preference)';

/** Resolves once the window has not scrolled for a short quiet moment. */
function scrollIdle(quietMs = 160): Promise<void> {
  return new Promise((resolve) => {
    let timer = window.setTimeout(done, quietMs);
    function onScroll() {
      window.clearTimeout(timer);
      timer = window.setTimeout(done, quietMs);
    }
    function done() {
      window.removeEventListener('scroll', onScroll);
      resolve();
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  });
}

/**
 * Behaviour-only controller for the Zentrac Track (M08). Renders nothing.
 * GSAP + ScrollTrigger load only when the Track approaches the viewport AND the enhanced layout
 * applies (never on phones or with reduced motion; later if the window grows into it), inside a
 * scoped gsap.matchMedia() context that is reverted on unmount and whenever the breakpoint or
 * motion preference stops matching. Scroll-driven changes are never announced.
 */
export function TrackController({ rootId, count }: { rootId: string; count: number }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    const bar = root?.querySelector<HTMLElement>('.track__progress');
    const list = root?.querySelector<HTMLElement>('.track__stages');
    if (!root || !bar || !list) return;
    let disposed = false;
    let revert: (() => void) | null = null;
    let current = 0;

    const setActive = (idx: number) => {
      if (idx === current) return;
      current = idx;
      root.querySelectorAll<HTMLElement>('[data-index]').forEach((el) => {
        const i = Number(el.dataset.index);
        if (i === idx) el.dataset.active = 'true';
        else delete el.dataset.active;
        // Stations fill in behind the progress line; slides that are behind the reader rest above,
        // upcoming ones below, so each change enters from the direction of travel (forward or back).
        if (el.classList.contains('track__station') || el.classList.contains('track__slide')) {
          if (i < idx) el.dataset.passed = 'true';
          else delete el.dataset.passed;
        }
      });
    };

    const enhanced = window.matchMedia(ENHANCED);
    let loading = false;
    const enhance = async () => {
      if (loading || disposed) return;
      loading = true;
      enhanced.removeEventListener('change', onEnhancedChange);
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
      // ScrollTrigger measures by scrolling to the top and back right after a trigger is created;
      // doing that mid-scroll would cut the visitor's scroll short, so wait for a pause.
      await scrollIdle();
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      const mm = gsap.matchMedia(root);
      mm.add(ENHANCED, () => {
        const sync = (self: { progress: number }) => setActive(Math.min(count - 1, Math.floor(self.progress * count + 0.0001)));
        const st = ScrollTrigger.create({
          trigger: list,
          start: 'top 62%',
          end: 'bottom 62%',
          scrub: 0.5,
          animation: gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: 'none' }),
          onUpdate: sync,
          // also after measurements change (fonts, resize): the page may already be scrolled
          onRefresh: sync,
        });
        // Entered mid-Track (anchor link, restored scroll, late script): show the right stage now,
        // not only after the next scroll event.
        sync(st);
        // Re-measure once web fonts settle (Arabic line heights change layout), only if they had not
        // yet; the scroll-safe refresh waits for scrolling to stop.
        if (document.fonts && document.fonts.status !== 'loaded') {
          void document.fonts.ready.then(() => !disposed && ScrollTrigger.refresh(true));
        }
        return () => {
          st.kill();
          gsap.set(bar, { clearProps: 'transform' });
        };
      });
      revert = () => mm.revert();
    };
    // Near the viewport but in the static layout: wait until the enhanced layout applies (if ever).
    function onEnhancedChange() {
      if (enhanced.matches) void enhance();
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          io.disconnect();
          if (enhanced.matches) void enhance();
          else enhanced.addEventListener('change', onEnhancedChange);
        }
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(root);
    return () => {
      disposed = true;
      io.disconnect();
      enhanced.removeEventListener('change', onEnhancedChange);
      revert?.();
    };
  }, [rootId, count]);

  return null;
}
