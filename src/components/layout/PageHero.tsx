import type { ReactNode } from 'react';
import { Breadcrumbs, type Crumb } from './Breadcrumbs';

interface PageHeroProps {
  eyebrow: string;
  title: string;
  lead?: string;
  crumbs: Crumb[];
  crumbLabel: string;
  children?: ReactNode;
  aside?: ReactNode;
  variant?: 'default' | 'compact';
}

/** Inner-page hero: dark technical canvas, breadcrumb, H1, short lead. */
export function PageHero({ eyebrow, title, lead, crumbs, crumbLabel, children, aside, variant = 'default' }: PageHeroProps) {
  return (
    <section className={`page-hero on-dark page-hero--${variant}`}>
      <div className="page-hero__grid" aria-hidden="true" />
      <div className="container page-hero__inner">
        <div className="page-hero__copy">
          <Breadcrumbs items={crumbs} label={crumbLabel} />
          <p className="eyebrow eyebrow--on-dark">{eyebrow}</p>
          <h1 className="h1 page-hero__title">{title}</h1>
          {lead ? <p className="lead page-hero__lead">{lead}</p> : null}
          {children}
        </div>
        {aside ? <div className="page-hero__aside">{aside}</div> : null}
      </div>
      <span className="corner-marks" aria-hidden="true" />
    </section>
  );
}
