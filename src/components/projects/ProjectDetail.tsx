import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { countryName } from '@/i18n/format';
import { localePath, pageHref, serviceHref } from '@/i18n/routes';
import { getService } from '@/content/public/services';
import { networks } from '@/content/public/networks';
import type { PublicProject } from '@/lib/content/types';
import { crumbs } from '@/lib/page';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ContactBand } from '@/components/sections/ContactBand';
import { ArrowIcon } from '@/components/ui/icons';
import { Gallery } from './Gallery';

/**
 * Case-study template (spec §9.7): breadcrumb → title and attribution → permitted hero media →
 * compact facts → assigned scope → services → permitted gallery → service links → enquiry.
 * Unknown values are omitted (never TBC/null/brackets). The owner/developer is never relabelled
 * as the direct appointing party.
 */
export function ProjectDetail({
  project,
  locale,
  basePath = 'projects',
  banner,
}: {
  project: PublicProject;
  locale: Locale;
  basePath?: string;
  banner?: string;
}) {
  const t = getMessages(locale);
  const d = t.projectDetail;
  const hero = project.images[0];
  const gallery = project.images.slice(1);
  const sectorLabel = project.sector ? t.projectsPage.sectors[project.sector] : undefined;
  const nets = networks.filter((n) => project.networkIds.includes(n.id));

  return (
    <>
      <section className="page-hero on-dark page-hero--project">
        <div className="page-hero__grid" aria-hidden="true" />
        <div className="container page-hero__inner">
          <div className="page-hero__copy">
            {banner ? (
              <p className="record-banner" role="note">
                {banner}
              </p>
            ) : null}
            <Breadcrumbs
              label={t.common.breadcrumb}
              items={crumbs(
                locale,
                { name: t.nav.projects, href: localePath(locale, basePath) },
                { name: project.title[locale], href: localePath(locale, `${basePath}/${project.slug}`) },
              )}
            />
            <p className="eyebrow eyebrow--on-dark">{project.attributionLabel[locale]}</p>
            <h1 className="h1 page-hero__title">{project.title[locale]}</h1>
            {project.summary ? <p className="lead page-hero__lead">{project.summary[locale]}</p> : null}
            <p className="attribution-note">{t.projectsPage.attribution}</p>
          </div>
        </div>
      </section>

      {hero ? (
        <section className="project-hero-media" aria-label={hero.alt[locale]}>
          <div className="container">
            <figure className="project-hero-media__frame">
              <Image
                src={hero.src}
                alt={hero.alt[locale]}
                width={hero.width}
                height={hero.height}
                sizes="(min-width: 80rem) 1280px, 100vw"
                priority
                unoptimized={hero.unoptimized}
              />
              {hero.caption ? <figcaption>{hero.caption[locale]}</figcaption> : null}
            </figure>
          </div>
        </section>
      ) : null}

      <section className="section section--white" aria-labelledby="scope-title">
        <div className="container project-layout">
          <aside className="facts" aria-labelledby="facts-title">
            <h2 id="facts-title" className="facts__title">
              {d.facts}
            </h2>
            <dl>
              {project.countryCode ? (
                <div>
                  <dt>{d.country}</dt>
                  <dd>{countryName(locale, project.countryCode)}</dd>
                </div>
              ) : null}
              {sectorLabel ? (
                <div>
                  <dt>{d.sector}</dt>
                  <dd>{sectorLabel}</dd>
                </div>
              ) : null}
              {project.packageLabel ? (
                <div>
                  <dt>{d.package}</dt>
                  <dd>{project.packageLabel[locale]}</dd>
                </div>
              ) : null}
              {project.owners.length ? (
                <div>
                  <dt>{d.owner}</dt>
                  <dd>
                    {project.owners.map((o) => (
                      <span key={o.name} className="facts__party">
                        <bdi>{o.name}</bdi> <span className="muted">· {o.role[locale]}</span>
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}
              {project.directAppointingParty ? (
                <div>
                  <dt>{d.appointingParty}</dt>
                  <dd>
                    <bdi>{project.directAppointingParty}</bdi>
                  </dd>
                </div>
              ) : null}
            </dl>
          </aside>

          <div className="project-layout__main">
            <h2 id="scope-title" className="h2">
              {d.scopeTitle}
            </h2>
            {project.scope ? (
              <>
                <h3 className="h3 detail-block__title">{d.assignedScope}</h3>
                <ul className="dash-list">
                  {project.scope[locale].map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {nets.length ? (
              <ul className="chip-list project-layout__chips">
                {nets.map((n) => (
                  <li key={n.id} className="chip">
                    {n.name[locale]}
                  </li>
                ))}
              </ul>
            ) : null}
            {project.serviceIds.length ? (
              <>
                <h3 className="h3 detail-block__title">{d.services}</h3>
                <ul className="service-links">
                  {project.serviceIds.map((id) => {
                    const s = getService(id);
                    return s ? (
                      <li key={id}>
                        <Link href={serviceHref(locale, s.id)} className="text-link">
                          {s.name[locale]}
                          <ArrowIcon size={16} />
                        </Link>
                      </li>
                    ) : null;
                  })}
                </ul>
              </>
            ) : null}
          </div>
        </div>
      </section>

      {gallery.length ? (
        <section className="section section--paper" aria-labelledby="gallery-title">
          <div className="container">
            <h2 id="gallery-title" className="h2 section-head">
              {d.gallery}
            </h2>
            <Gallery
              images={gallery}
              locale={locale}
              labels={{
                openImage: d.openImage,
                dialogLabel: d.dialogLabel,
                close: d.close,
                previous: d.previous,
                next: d.next,
                position: d.position,
              }}
            />
          </div>
        </section>
      ) : null}

      <section className="section section--white section--tight">
        <div className="container">
          <Link href={pageHref(locale, 'projects')} className="back-link back-link--light">
            <ArrowIcon size={16} className="back-link__icon" />
            {d.backToProjects}
          </Link>
        </div>
      </section>

      <ContactBand
        locale={locale}
        title={d.enquireTitle}
        text={d.enquireText}
        quoteQuery={project.serviceIds[0] ? `service=${project.serviceIds[0]}` : undefined}
      />
    </>
  );
}
