import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowIcon } from '@/components/ui/icons';
import { ServicePreviewController } from './ServicePreviewController';

export interface ServiceRow {
  id: string;
  number: string;
  name: string;
  short: string;
  deliverables: string;
  href: string;
}

/**
 * H03 / M06: five numbered service rows (server-rendered). Each name is a real link to the
 * service page. A tiny client controller updates one decorative supporting illustration on
 * hover or keyboard focus (desktop). Nothing depends on hover: every row always shows its name,
 * scope, deliverables and link.
 */
export function ServicePreview({
  id,
  rows,
  visuals,
  deliverablesCue,
  caption,
}: {
  id: string;
  rows: ServiceRow[];
  visuals: ReactNode[];
  deliverablesCue: string;
  caption: string;
}) {
  return (
    <div className="service-preview" id={id}>
      <ol className="service-preview__list">
        {rows.map((row, i) => (
          <li key={row.id} className="service-row" data-index={i} data-active={i === 0 || undefined} data-reveal>
            <span className="service-row__num" aria-hidden="true">
              {row.number}
            </span>
            <div className="service-row__body">
              <h3 className="service-row__title">
                <Link href={row.href} className="service-row__link">
                  {row.name}
                </Link>
              </h3>
              <p className="service-row__scope">{row.short}</p>
              <p className="service-row__deliverables">
                <span className="service-row__cue">{deliverablesCue}</span> {row.deliverables}
              </p>
            </div>
            <span className="service-row__go" aria-hidden="true">
              <ArrowIcon />
            </span>
          </li>
        ))}
      </ol>
      <div className="service-preview__visual" aria-hidden="true">
        <div className="service-preview__frame">
          {rows.map((row, i) => (
            <div key={row.id} className="service-preview__slide" data-index={i} data-active={i === 0 || undefined}>
              {visuals[i]}
              <span className="service-preview__index">
                {row.number} <span className="service-preview__name">{row.name}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="service-preview__caption">{caption}</p>
      </div>
      <ServicePreviewController rootId={id} />
    </div>
  );
}
