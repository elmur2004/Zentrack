'use client';

import { useEffect } from 'react';

/** Behaviour-only controller for the service preview (M06). Renders nothing. */
export function ServicePreviewController({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    const activate = (target: EventTarget | null) => {
      const row = (target as HTMLElement | null)?.closest?.('.service-row') as HTMLElement | null;
      if (!row || !root.contains(row)) return;
      const index = row.dataset.index;
      root.querySelectorAll<HTMLElement>('[data-index]').forEach((el) => {
        if (el.dataset.index === index) el.dataset.active = 'true';
        else delete el.dataset.active;
      });
    };
    const onOver = (e: Event) => activate(e.target);
    root.addEventListener('mouseover', onOver);
    root.addEventListener('focusin', onOver);
    return () => {
      root.removeEventListener('mouseover', onOver);
      root.removeEventListener('focusin', onOver);
    };
  }, [rootId]);
  return null;
}
