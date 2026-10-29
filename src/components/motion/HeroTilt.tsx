'use client';

import { useEffect } from 'react';

/**
 * M03 hero pointer response — behaviour-only controller (renders nothing).
 * The scene itself is server-rendered markup, so it costs no hydration.
 * Fine pointers only (mouse), max ±3° tilt and ≤8px shift, eased reset. Off for touch, small
 * screens and reduced motion. GSAP loads on the first mouse movement over the hero, listeners
 * are attached only while the hero is on screen, and everything is reverted on unmount.
 */
export function HeroTilt({ targetId }: { targetId: string }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    const zone = el?.closest('.hero') as HTMLElement | null;
    if (!el || !zone) return;
    const mq = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference) and (min-width: 64rem)');

    let disposed = false;
    let loading = false;
    let revert: (() => void) | null = null;
    let move: ((e: PointerEvent) => void) | null = null;
    let leave: (() => void) | null = null;
    let visible = true;
    let attached = false;

    const attach = (on: boolean) => {
      if (!move || !leave || on === attached) return;
      attached = on;
      if (on) {
        zone.addEventListener('pointermove', move);
        zone.addEventListener('pointerleave', leave);
      } else {
        zone.removeEventListener('pointermove', move);
        zone.removeEventListener('pointerleave', leave);
        leave();
      }
    };

    const setup = async (first: PointerEvent) => {
      if (loading || revert) return;
      loading = true;
      const { gsap } = await import('gsap');
      if (disposed) return;
      const ctx = gsap.context(() => {
        gsap.set(el, { transformPerspective: 1200 });
        const rx = gsap.quickTo(el, 'rotationX', { duration: 0.8, ease: 'power3.out' });
        const ry = gsap.quickTo(el, 'rotationY', { duration: 0.8, ease: 'power3.out' });
        const tx = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' });
        const ty = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' });
        move = (e: PointerEvent) => {
          if (e.pointerType !== 'mouse' || !mq.matches) return;
          const r = zone.getBoundingClientRect();
          const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
          const ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
          ry(nx * 3);
          rx(-ny * 3);
          tx(nx * 8);
          ty(ny * 6);
        };
        leave = () => {
          rx(0);
          ry(0);
          tx(0);
          ty(0);
        };
      });
      revert = () => {
        ctx.revert();
        gsap.set(el, { clearProps: 'transform' });
      };
      attach(visible);
      move?.(first);
    };

    const onFirst = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && mq.matches) void setup(e);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      attach(visible && mq.matches);
    });
    io.observe(zone);
    zone.addEventListener('pointermove', onFirst, { passive: true });
    const onMq = () => attach(mq.matches && visible);
    mq.addEventListener('change', onMq);

    return () => {
      disposed = true;
      io.disconnect();
      zone.removeEventListener('pointermove', onFirst);
      mq.removeEventListener('change', onMq);
      attach(false);
      revert?.();
    };
  }, [targetId]);

  return null;
}
