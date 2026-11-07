import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { toStaticMarkup } from '@/components/motion/static-svg';
import { TechIllustrationArt, type IllustrationKind } from '@/components/motion/TechIllustration';
import { NetworkSchematicArt } from '@/components/motion/NetworkSchematic';
import { HeroSceneArt } from '@/components/motion/HeroScene';
import { BuildingSchematicArt } from '@/components/motion/BuildingSchematic';
import { networkIds } from '@/content/public/networks';
import { buildingSystemIds } from '@/content/public/building-systems';

/**
 * The decorative SVG artwork is injected as pre-serialized markup (performance: no RSC payload or
 * hydration for hundreds of static nodes). These tests pin the serializer to React's own output so
 * the rendered DOM is byte-for-byte what React would have produced.
 */
const KINDS: IllustrationKind[] = ['review', 'model', 'coordination', 'drawing', 'quantities', 'site', 'register'];

describe('static SVG markup', () => {
  it.each(KINDS)('technical illustration "%s" matches React', (kind) => {
    const element = createElement(TechIllustrationArt, { kind });
    const markup = toStaticMarkup(element);
    expect(markup.length).toBeGreaterThan(200);
    expect(markup).toBe(renderToStaticMarkup(element));
  });

  it('network schematic matches React for the overview and every selected layer', () => {
    for (const selected of ['all' as const, ...networkIds]) {
      const element = createElement(NetworkSchematicArt, { selected });
      expect(toStaticMarkup(element)).toBe(renderToStaticMarkup(element));
    }
  });

  it('building section matches React for the overview and every selected discipline', () => {
    for (const selected of ['all' as const, ...buildingSystemIds]) {
      const element = createElement(BuildingSchematicArt, { selected });
      const markup = toStaticMarkup(element);
      expect(markup).toBe(renderToStaticMarkup(element));
      // every discipline is a selectable layer with its highlight trace
      for (const id of buildingSystemIds) expect(markup).toContain(`data-net="${id}"`);
    }
  });

  it('hero scene matches React and keeps the classes the CSS storyboard targets', () => {
    const element = createElement(HeroSceneArt);
    const markup = toStaticMarkup(element);
    expect(markup).toBe(renderToStaticMarkup(element));
    for (const cls of ['hs-utilities', 'hs-coord', 'hs-coord-head', 'hs-xray', 'hs-sheet__accent', 'hs-issue', 'hs-resolved']) {
      expect(markup).toContain(cls);
    }
    expect(markup).toContain('pathLength="1"');
    expect(markup).toContain('stop-color="#1d3049"');
  });

  it('escapes text and attribute values like React', () => {
    const element = createElement('g', { 'data-label': `a"b'<c>&` }, 'x < y & "z"');
    expect(toStaticMarkup(element)).toBe(renderToStaticMarkup(element));
  });

  it('refuses props it cannot serialize identically instead of guessing', () => {
    expect(() => toStaticMarkup(createElement('path', { style: { fill: 'red' } }))).toThrow(/unsupported prop style/);
    expect(() => toStaticMarkup(createElement('path', { onClick: () => undefined }))).toThrow(/unsupported prop onClick/);
    expect(() => toStaticMarkup(createElement('svg', { focusable: false }))).toThrow(/boolean prop focusable/);
  });
});
