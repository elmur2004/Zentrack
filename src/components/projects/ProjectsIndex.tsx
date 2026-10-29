import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { countryName } from '@/i18n/format';
import { pageHref } from '@/i18n/routes';
import { services } from '@/content/public/services';
import { FILTER_THRESHOLD } from '@/content/public';
import type { PublicProject } from '@/lib/content/types';
import { crumbs } from '@/lib/page';
import { PageHero } from '@/components/layout/PageHero';
import { ContactBand } from '@/components/sections/ContactBand';
import { PackageIncludes } from '@/components/sections/PackageIncludes';
import { ButtonLink } from '@/components/ui/Button';
import { ProjectsBrowser } from './ProjectsBrowser';

/** Experience index. With zero cleared records it renders a capability-led fallback. */
export function ProjectsIndex({
  locale,
  projects,
  basePath = 'projects',
  banner,
}: {
  locale: Locale;
  projects: PublicProject[];
  basePath?: string;
  banner?: string;
}) {
  const t = getMessages(locale);
  const p = t.projectsPage;
  const countries = [...new Set(projects.map((x) => x.countryCode).filter(Boolean))] as string[];
  const sectors = [...new Set(projects.map((x) => x.sector).filter(Boolean))] as Array<keyof typeof p.sectors>;
  const serviceIds = new Set(projects.flatMap((x) => x.serviceIds));

  return (
    <>
      <PageHero
        eyebrow={p.hero.eyebrow}
        title={p.hero.title}
        lead={p.hero.lead}
        crumbs={crumbs(locale, ['projects', t.nav.projects])}
        crumbLabel={t.common.breadcrumb}
      >
        {banner ? (
          <p className="record-banner" role="note">
            {banner}
          </p>
        ) : null}
        <p className="attribution-note">{p.attribution}</p>
      </PageHero>

      {projects.length ? (
        <section className="section section--paper" aria-label={p.hero.title}>
          <div className="container">
            <ProjectsBrowser
              locale={locale}
              projects={projects}
              basePath={basePath}
              showFilters={projects.length >= FILTER_THRESHOLD}
              options={{
                country: countries.map((c) => ({ id: c, label: countryName(locale, c) })),
                service: services.filter((s) => serviceIds.has(s.id)).map((s) => ({ id: s.id, label: s.name[locale] })),
                sector: sectors.map((s) => ({ id: s, label: p.sectors[s] })),
              }}
              labels={{
                title: p.filters.title,
                country: p.filters.country,
                service: p.filters.service,
                sector: p.filters.sector,
                all: p.filters.all,
                clear: p.filters.clear,
                noResultsText: p.noResultsText,
              }}
              results={p.results}
              cardLabels={p.card}
            />
          </div>
        </section>
      ) : (
        <>
          <section className="section section--white" aria-labelledby="empty-title">
            <div className="container">
              <div className="empty-panel" data-reveal>
                <span className="empty-panel__mark" aria-hidden="true" />
                <h2 id="empty-title" className="h2">
                  {p.empty.title}
                </h2>
                <p className="lead muted">{p.empty.text}</p>
                <ButtonLink href={pageHref(locale, 'quote')} variant="primary" arrow>
                  {p.empty.cta}
                </ButtonLink>
              </div>
            </div>
          </section>
          <PackageIncludes locale={locale} showCta={false} />
        </>
      )}

      <ContactBand locale={locale} />
    </>
  );
}
