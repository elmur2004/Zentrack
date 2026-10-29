'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import type { Locale } from '@/i18n/config';
import { plural, type PluralForms } from '@/i18n/format';
import type { PublicProject } from '@/lib/content/types';
import { ProjectCard, type ProjectCardLabels } from '@/components/sections/ProjectCard';

type FilterKey = 'country' | 'service' | 'sector';
export interface FilterOption {
  id: string;
  label: string;
}

interface Props {
  locale: Locale;
  projects: PublicProject[];
  showFilters: boolean;
  basePath?: string;
  options: Record<FilterKey, FilterOption[]>;
  labels: {
    title: string;
    country: string;
    service: string;
    sector: string;
    all: string;
    clear: string;
    noResultsText: string;
  };
  results: PluralForms;
  cardLabels: ProjectCardLabels;
}

function matches(p: PublicProject, key: FilterKey, value: string | null) {
  if (!value) return true;
  if (key === 'country') return p.countryCode === value;
  if (key === 'service') return p.serviceIds.includes(value);
  return p.sector === value;
}

function Browser({ locale, projects, showFilters, basePath, options, labels, results, cardLabels }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Only stable IDs that exist in the option lists are honoured.
  const active: Record<FilterKey, string | null> = {
    country: options.country.some((o) => o.id === params.get('country')) ? params.get('country') : null,
    service: options.service.some((o) => o.id === params.get('service')) ? params.get('service') : null,
    sector: options.sector.some((o) => o.id === params.get('sector')) ? params.get('sector') : null,
  };

  const filtered = useMemo(
    () =>
      showFilters
        ? projects.filter(
            (p) =>
              matches(p, 'country', active.country) &&
              matches(p, 'service', active.service) &&
              matches(p, 'sector', active.sector),
          )
        : projects,
    [projects, showFilters, active.country, active.service, active.sector],
  );

  function update(key: FilterKey, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    // push keeps browser Back working through filter states
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const anyActive = !!(active.country || active.service || active.sector);

  return (
    <div className="projects-browser">
      {showFilters ? (
        <form className="filters" role="search" aria-label={labels.title} onSubmit={(e) => e.preventDefault()}>
          {(['country', 'service', 'sector'] as FilterKey[]).map((key) => (
            <div key={key} className="field field--compact">
              <label htmlFor={`filter-${key}`} className="field__label">
                {labels[key]}
              </label>
              <select
                id={`filter-${key}`}
                className="field__control"
                value={active[key] ?? ''}
                onChange={(e) => update(key, e.target.value)}
              >
                <option value="">{labels.all}</option>
                {options[key].map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <button
            type="button"
            className="btn btn--ghost-light filters__clear"
            onClick={() => router.push(pathname, { scroll: false })}
            disabled={!anyActive}
          >
            <span className="btn__label">{labels.clear}</span>
          </button>
        </form>
      ) : null}

      <p className="projects-browser__count" role="status" aria-live="polite">
        {plural(locale, filtered.length, results)}
      </p>

      {filtered.length ? (
        <div className="project-grid">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} locale={locale} basePath={basePath} labels={cardLabels} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="h3">{plural(locale, 0, results)}</p>
          <p className="muted">{labels.noResultsText}</p>
          <button type="button" className="btn btn--primary" onClick={() => router.push(pathname, { scroll: false })}>
            <span className="btn__label">{labels.clear}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function ProjectsBrowser(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="project-grid">
          {props.projects.map((p) => (
            <ProjectCard key={p.id} project={p} locale={props.locale} basePath={props.basePath} labels={props.cardLabels} />
          ))}
        </div>
      }
    >
      <Browser {...props} />
    </Suspense>
  );
}
