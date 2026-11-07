import type { ReactNode } from 'react';
import type { NetworkId } from '@/content/public/networks';
import type { BuildingSystemId } from '@/content/public/building-systems';
import { NetworkSchematic } from './NetworkSchematic';
import { BuildingSchematic } from './BuildingSchematic';
import { ExplorerControls } from './ExplorerControls';

export interface ExplorerItem {
  id: string;
  number: string;
  name: string;
  description: string;
}

export interface ExplorerLabels {
  groupLabel: string;
  showAll: string;
  overviewTitle: string;
  overviewText: string;
  caption: string;
}

/** Diagram size (viewBox units) and where each layer's on-diagram label points. */
export type ExplorerAnchors = Record<string, [number, number]>;

interface Props {
  items: ExplorerItem[];
  labels: ExplorerLabels;
  idPrefix: string;
  schematic: ReactNode;
  anchors: ExplorerAnchors;
  size: [number, number];
}

/**
 * Category explorer (H05 / M07 infrastructure, Buildings page). The schematic is server-rendered
 * (no hydration cost); the client controls (native buttons with aria-pressed + a live description)
 * mark the selected layer on it, label it on the diagram and preview layers on hover/focus. Path
 * draw is CSS, first selection only, instant under reduced motion.
 */
export function SchematicExplorer({ items, labels, idPrefix, schematic, anchors, size }: Props) {
  return (
    <div className="explorer" id={idPrefix}>
      <div className="explorer__diagram">
        <div className="explorer__frame">
          <div className="explorer__canvas">
            {schematic}
            {/* On-diagram label for the selected layer, filled by the controls. It duplicates the
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
      <ExplorerControls rootId={idPrefix} items={items} labels={labels} anchors={anchors} size={size} />
    </div>
  );
}

/** Label anchors on the plan-view site schematic (560 × 420; never mirrored). */
const NETWORK_ANCHORS: Record<NetworkId, [number, number]> = {
  water: [342, 96],
  sewerage: [150, 262],
  irrigation: [450, 300],
  stormwater: [470, 252],
  firefighting: [300, 248],
  'lv-mv': [311, 140],
  'street-lighting': [175, 173],
  'cctv-telecom': [330, 118],
  roads: [353, 92],
  'landscape-grading': [470, 312],
  canals: [280, 384],
};

/** Label anchors on the building section (560 × 420; never mirrored). */
const BUILDING_ANCHORS: Record<BuildingSystemId, [number, number]> = {
  structure: [280, 90],
  reinforcement: [280, 217],
  hvac: [190, 62],
  plumbing: [355, 58],
  'fire-protection': [185, 356],
  power: [236, 348],
  elv: [140, 284],
  landscape: [460, 280],
};

export function NetworkExplorer({ items, labels, idPrefix = 'explorer' }: { items: ExplorerItem[]; labels: ExplorerLabels; idPrefix?: string }) {
  return <SchematicExplorer items={items} labels={labels} idPrefix={idPrefix} schematic={<NetworkSchematic selected="all" />} anchors={NETWORK_ANCHORS} size={[560, 420]} />;
}

export function BuildingExplorer({ items, labels, idPrefix = 'building-explorer' }: { items: ExplorerItem[]; labels: ExplorerLabels; idPrefix?: string }) {
  return <SchematicExplorer items={items} labels={labels} idPrefix={idPrefix} schematic={<BuildingSchematic selected="all" />} anchors={BUILDING_ANCHORS} size={[560, 420]} />;
}
