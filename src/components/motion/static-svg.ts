import 'server-only';
import { Fragment, isValidElement, type ReactNode } from 'react';

/**
 * Serializes static, decorative SVG artwork (built with JSX for readability) to markup once on the
 * server. Callers inject it with `dangerouslySetInnerHTML` on the outer <svg>, so the DOM is
 * unchanged but React neither ships hundreds of SVG nodes in the RSC payload nor hydrates them.
 *
 * Supports only what the illustrations use: host elements, fragments, arrays, pure function
 * components and string/number attributes. Anything else throws, so a new prop type fails the build
 * instead of rendering differently. `tests/unit/static-svg.test.tsx` checks the output is identical
 * to React's own `renderToStaticMarkup` for every illustration.
 */

/** React prop names that render under a different SVG/HTML attribute name (subset React maps). */
const ATTRIBUTE_ALIASES: Record<string, string> = {
  className: 'class',
  clipPath: 'clip-path',
  clipRule: 'clip-rule',
  fillOpacity: 'fill-opacity',
  fillRule: 'fill-rule',
  markerEnd: 'marker-end',
  markerMid: 'marker-mid',
  markerStart: 'marker-start',
  stopColor: 'stop-color',
  stopOpacity: 'stop-opacity',
  strokeDasharray: 'stroke-dasharray',
  strokeDashoffset: 'stroke-dashoffset',
  strokeLinecap: 'stroke-linecap',
  strokeLinejoin: 'stroke-linejoin',
  strokeOpacity: 'stroke-opacity',
  strokeWidth: 'stroke-width',
  vectorEffect: 'vector-effect',
};

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
const escape = (value: string) => value.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);

export function toStaticMarkup(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return escape(String(node));
  if (Array.isArray(node)) return node.map(toStaticMarkup).join('');
  if (!isValidElement(node)) throw new Error('static-svg: unsupported node');

  const props = node.props as Record<string, unknown>;
  if (node.type === Fragment) return toStaticMarkup(props.children as ReactNode);
  if (typeof node.type === 'function') {
    return toStaticMarkup((node.type as (p: Record<string, unknown>) => ReactNode)(props));
  }
  if (typeof node.type !== 'string') throw new Error('static-svg: unsupported element type');

  let attributes = '';
  for (const [name, value] of Object.entries(props)) {
    if (name === 'children' || value == null) continue;
    const isAriaOrData = name.startsWith('aria-') || name.startsWith('data-');
    if (typeof value === 'boolean' && !isAriaOrData) throw new Error(`static-svg: boolean prop ${name}`);
    if (typeof value === 'object' || typeof value === 'function') throw new Error(`static-svg: unsupported prop ${name}`);
    attributes += ` ${ATTRIBUTE_ALIASES[name] ?? name}="${escape(String(value))}"`;
  }
  return `<${node.type}${attributes}>${toStaticMarkup(props.children as ReactNode)}</${node.type}>`;
}

/** Memoizes markup per variant key: the artwork is identical for every request and locale. */
export function memoMarkup<K>(render: (key: K) => ReactNode): (key: K) => { __html: string } {
  const cache = new Map<K, { __html: string }>();
  return (key) => {
    let html = cache.get(key);
    if (!html) {
      html = { __html: toStaticMarkup(render(key)) };
      cache.set(key, html);
    }
    return html;
  };
}
