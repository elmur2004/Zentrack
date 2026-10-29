import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { countryName } from '@/i18n/format';
import { localePath } from '@/i18n/routes';
import { getService } from '@/content/public/services';
import type { PublicProject } from '@/lib/content/types';
import { ArrowIcon } from '@/components/ui/icons';

export interface ProjectCardLabels {
  view: string;
  noImage: string;
}

/**
 * Project card: cover or designed text treatment, name, country, package, services,
 * visible attribution and a detail link. Never infers dates or a “completed” status.
 * Labels are passed in so the card can render inside client components without
 * bundling the dictionaries.
 */
export function ProjectCard({
  project,
  locale,
  labels,
  variant = 'default',
  basePath = 'projects',
}: {
  project: PublicProject;
  locale: Locale;
  labels: ProjectCardLabels;
  variant?: 'default' | 'wide';
  basePath?: string;
}) {
  const cover = project.images[0];
  const href = localePath(locale, `${basePath}/${project.slug}`);
  return (
    <article className={`project-card project-card--${variant}`}>
      <div className="project-card__media">
        <div className="project-card__media-inner">
          {cover ? (
            <Image
              src={cover.src}
              alt={cover.alt[locale]}
              width={cover.width}
              height={cover.height}
              sizes={variant === 'wide' ? '(min-width: 64rem) 60vw, 100vw' : '(min-width: 64rem) 30vw, 100vw'}
              unoptimized={cover.unoptimized}
            />
          ) : (
            <div className="project-card__placeholder">
              <span className="project-card__initial" aria-hidden="true">
                {project.id}
              </span>
              <span className="small">{labels.noImage}</span>
            </div>
          )}
        </div>
      </div>
      <div className="project-card__body">
        <p className="project-card__meta">
          {project.countryCode ? <span>{countryName(locale, project.countryCode)}</span> : null}
          {project.packageLabel ? <span>{project.packageLabel[locale]}</span> : null}
        </p>
        <h3 className="h3 project-card__title">
          <Link href={href} className="project-card__link">
            {project.title[locale]}
          </Link>
        </h3>
        {project.summary ? <p className="muted project-card__summary">{project.summary[locale]}</p> : null}
        {project.serviceIds.length ? (
          <ul className="chip-list">
            {project.serviceIds.map((id) => {
              const s = getService(id);
              return s ? (
                <li key={id} className="chip">
                  {s.name[locale]}
                </li>
              ) : null;
            })}
          </ul>
        ) : null}
        <p className="project-card__attribution">{project.attributionLabel[locale]}</p>
        <span className="project-card__cta" aria-hidden="true">
          {labels.view}
          <ArrowIcon size={16} />
        </span>
      </div>
    </article>
  );
}
