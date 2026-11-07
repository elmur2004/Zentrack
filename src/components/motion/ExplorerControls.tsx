'use client';

import { useEffect, useState } from 'react';
import type { ExplorerAnchors, ExplorerItem } from './NetworkExplorer';

/**
 * Explorer selection UI. Selecting a category marks its layer on the server-rendered schematic
 * (data-selected on the SVG + .is-selected on the layer group), labels it on the diagram and
 * updates the description. The orange trace draws only the first time a layer is selected;
 * later selections highlight instantly, so rapid switching never queues animations.
 * Hovering or focusing a button previews its layer (non-essential; selection is the real state).
 */
export function ExplorerControls({
  rootId,
  items,
  labels,
  anchors,
  size,
}: {
  rootId: string;
  items: ExplorerItem[];
  labels: { groupLabel: string; showAll: string; overviewTitle: string; overviewText: string };
  /** Where each layer's on-diagram label points, in viewBox units of a diagram of `size`. */
  anchors: ExplorerAnchors;
  size: [number, number];
}) {
  const [selected, setSelected] = useState<string>('all');
  const detailId = `${rootId}-detail`;
  const current = items.find((i) => i.id === selected);

  useEffect(() => {
    const root = document.getElementById(rootId);
    const svg = root?.querySelector<SVGElement>('.schematic');
    if (!root || !svg) return;
    svg.dataset.selected = selected;
    svg.querySelectorAll<SVGGElement>('g[data-net]').forEach((g) => {
      const on = g.dataset.net === selected;
      // A layer being deselected has had its trace drawn: later selections are instant.
      if (!on && g.classList.contains('is-selected')) g.dataset.seen = 'true';
      g.classList.toggle('is-selected', on);
    });

    const tag = root.querySelector<HTMLElement>('[data-explorer-tag]');
    if (!tag) return;
    const item = items.find((i) => i.id === selected);
    if (!item) {
      tag.hidden = true;
      return;
    }
    const [x, y] = anchors[item.id] ?? [size[0] / 2, size[1] / 2];
    tag.style.left = `${(x / size[0]) * 100}%`;
    tag.style.top = `${(y / size[1]) * 100}%`;
    const text = tag.querySelector<HTMLElement>('.explorer__tag-text');
    if (text) text.textContent = `${item.number} ${item.name}`;
    tag.hidden = false;
    // restart the short entrance for each new label (no queued animations)
    tag.classList.remove('is-in');
    void tag.offsetWidth;
    tag.classList.add('is-in');
  }, [rootId, selected, items, anchors, size]);

  /** Non-essential preview: emphasise a layer while its button is hovered (mouse) or focused. */
  function preview(id: string | null) {
    const svg = document.getElementById(rootId)?.querySelector<SVGElement>('.schematic');
    if (!svg) return;
    if (id) svg.dataset.preview = id;
    else delete svg.dataset.preview;
    svg.querySelectorAll<SVGGElement>('g[data-net]').forEach((g) => g.classList.toggle('is-preview', g.dataset.net === id));
  }

  return (
    <div className="explorer__controls">
      <div role="group" aria-label={labels.groupLabel} className="explorer__buttons">
        <button
          type="button"
          className="explorer__btn explorer__btn--all"
          aria-pressed={selected === 'all'}
          aria-controls={detailId}
          onClick={() => setSelected('all')}
        >
          {labels.showAll}
        </button>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="explorer__btn"
            aria-pressed={selected === item.id}
            aria-controls={detailId}
            data-net-btn={item.id}
            onClick={() => setSelected(item.id)}
            onPointerEnter={(e) => {
              if (e.pointerType === 'mouse') preview(item.id);
            }}
            onPointerLeave={() => preview(null)}
            onFocus={() => preview(item.id)}
            onBlur={() => preview(null)}
          >
            <span className="explorer__num" aria-hidden="true">
              {item.number}
            </span>
            <span className="explorer__name">{item.name}</span>
            <span className={`explorer__swatch explorer__swatch--${item.id}`} aria-hidden="true" />
          </button>
        ))}
      </div>
      <div id={detailId} className="explorer__detail" aria-live="polite">
        {/* keyed: the new description fades in (CSS); content swaps immediately for assistive tech */}
        <div key={selected} className="explorer__detail-body">
          <h3 className="h3 explorer__detail-title">
            {current ? (
              <>
                <span className="explorer__detail-num" aria-hidden="true">
                  {current.number}
                </span>{' '}
                {current.name}
              </>
            ) : (
              labels.overviewTitle
            )}
          </h3>
          <p>{current ? current.description : labels.overviewText}</p>
        </div>
      </div>
    </div>
  );
}
