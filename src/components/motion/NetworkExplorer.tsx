import type { NetworkId } from '@/content/public/networks';
import { NetworkSchematic } from './NetworkSchematic';
import { ExplorerControls } from './ExplorerControls';

export interface ExplorerItem {
  id: NetworkId;
  number: string;
  name: string;
  description: string;
}

interface Props {
  items: ExplorerItem[];
  labels: {
    groupLabel: string;
    showAll: string;
    overviewTitle: string;
    overviewText: string;
    caption: string;
  };
  idPrefix?: string;
}

/**
 * H05 / M07 Infrastructure explorer. The schematic is server-rendered (no hydration cost);
 * the client controls (native buttons with aria-pressed + a live description) mark the selected
 * layer on it, label it on the diagram and preview layers on hover/focus. Path draw is CSS,
 * first selection only, instant under reduced motion.
 */
export function NetworkExplorer({ items, labels, idPrefix = 'explorer' }: Props) {
  return (
    <div className="explorer" id={idPrefix}>
      <div className="explorer__diagram">
        <div className="explorer__frame">
          <div className="explorer__canvas">
            <NetworkSchematic selected="all" />
            {/* On-diagram label for the selected network, filled by the controls. It duplicates the
                announced description, so it is hidden from assistive technology. */}
            <p className="explorer__tag" data-explorer-tag aria-hidden="true" hidden>
              <span className="explorer__tag-dot" />
              <span className="explorer__tag-text" />
            </p>
          </div>
          <span className="corner-marks" aria-hidden="true" />
        </div>
        <p className="explorer__caption">{labels.caption}</p>
      </div>
      <ExplorerControls rootId={idPrefix} items={items} labels={labels} />
    </div>
  );
}
