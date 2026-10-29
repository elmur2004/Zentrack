'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * M05 section reveal. Progressive enhancement only:
 * - Content is fully visible in the HTML. Only elements that start entirely below the viewport
 *   are "armed" (hidden) and revealed once on first entry; anything visible, even partly, is left
 *   alone, so nothing that has been painted disappears.
 * - Positions come from the observer's first report (no forced layout per element on load).
 * - Reduced motion, missing IntersectionObserver or printing → nothing is hidden.
 * - Re-scans after client navigation (pathname change) without duplicating observers.
 */
export function RevealController() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches || !('IntersectionObserver' in window)) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal-state])'));
    if (!nodes.length) return;
    const armed = new Set<HTMLElement>();
    const classified = new WeakSet<Element>();

    const clearDelay = (e: TransitionEvent) => {
      const el = e.currentTarget as HTMLElement;
      el.style.removeProperty('transition-delay');
      el.removeEventListener('transitionend', clearDelay);
    };
    const io = new IntersectionObserver(
      (entries) => {
        // Elements arriving together (e.g. one grid row) get a short stagger; a lone element never waits.
        let n = 0;
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (!classified.has(el)) {
            classified.add(el);
            if (entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight) {
              el.dataset.revealState = 'done';
              io.unobserve(el);
            } else {
              el.dataset.revealState = 'armed';
              armed.add(el);
            }
            continue;
          }
          if (!entry.isIntersecting) continue;
          if (n > 0) {
            el.style.transitionDelay = `${Math.min(n, 4) * 70}ms`;
            el.addEventListener('transitionend', clearDelay);
          }
          n += 1;
          el.dataset.revealState = 'in';
          armed.delete(el);
          io.unobserve(el);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
    );
    nodes.forEach((el) => io.observe(el));

    const revealAll = () => armed.forEach((el) => (el.dataset.revealState = 'in'));
    const onReduce = () => reduce.matches && revealAll();
    window.addEventListener('beforeprint', revealAll);
    reduce.addEventListener('change', onReduce);
    // Deep links and in-page anchors: reveal anything already scrolled past
    const onHash = () => {
      for (const el of armed) if (el.getBoundingClientRect().top < window.innerHeight) el.dataset.revealState = 'in';
    };
    window.addEventListener('hashchange', onHash);

    return () => {
      io.disconnect();
      window.removeEventListener('beforeprint', revealAll);
      window.removeEventListener('hashchange', onHash);
      reduce.removeEventListener('change', onReduce);
      // leave content visible if the controller unmounts mid-way
      revealAll();
    };
  }, [pathname]);

  return null;
}
