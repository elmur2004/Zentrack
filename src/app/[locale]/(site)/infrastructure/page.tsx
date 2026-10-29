import type { Metadata } from 'next';
import { getMessages } from '@/i18n/messages';
import { isLocale } from '@/i18n/config';
import { pageMetadata } from '@/lib/seo';
import { crumbs, resolveLocale } from '@/lib/page';
import { networks } from '@/content/public/networks';
import { publicProjects } from '@/content/public';
import { PageHero } from '@/components/layout/PageHero';
import { ContactBand } from '@/components/sections/ContactBand';
import { ProjectCard } from '@/components/sections/ProjectCard';
import { Eyebrow } from '@/components/ui/Button';
import { NetworkExplorer } from '@/components/motion/NetworkExplorer';

export async function generateMetadata({ params }: PageProps<'/[locale]/infrastructure'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale).infrastructurePage.meta;
  return pageMetadata({ locale, path: 'infrastructure', title: t.title, description: t.description });
}

export default async function InfrastructurePage({ params }: PageProps<'/[locale]/infrastructure'>) {
  const locale = await resolveLocale(params);
  const t = getMessages(locale);
  const p = t.infrastructurePage;
  const related = publicProjects.filter((pr) => pr.networkIds.length > 0).slice(0, 3);

  return (
    <>
      <PageHero
        eyebrow={p.hero.eyebrow}
        title={p.hero.title}
        lead={p.hero.lead}
        crumbs={crumbs(locale, ['infrastructure', t.nav.infrastructure])}
        crumbLabel={t.common.breadcrumb}
      />

      <section className="section section--dark-2 on-dark explorer-section" aria-labelledby="explorer-title">
        <div className="container">
          <h2 id="explorer-title" className="h2 section-head">
            {t.home.explorer.title}
          </h2>
          <NetworkExplorer
            idPrefix="infra-explorer"
            items={networks.map((n) => ({
              id: n.id,
              number: n.number,
              name: n.name[locale],
              description: n.description[locale],
            }))}
            labels={t.explorer}
          />
        </div>
      </section>

      <section className="section section--white" aria-labelledby="categories-title">
        <div className="container">
          <div className="section-head" data-reveal>
            <h2 id="categories-title" className="h2">
              {p.categoriesTitle}
            </h2>
            <p className="lead muted">{p.categoriesIntro}</p>
          </div>
          <ol className="category-grid">
            {networks.map((n) => (
              <li key={n.id} id={n.id} className="category-card" data-reveal>
                <span className="category-card__num" aria-hidden="true">
                  {n.number}
                </span>
                <span className={`category-card__line explorer__swatch--${n.id}`} aria-hidden="true" />
                <h3 className="h3">{n.name[locale]}</h3>
                <p className="muted">{n.description[locale]}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--paper" aria-labelledby="interfaces-title">
        <div className="container split">
          <div data-reveal>
            <Eyebrow>{p.interfaces.eyebrow}</Eyebrow>
            <h2 id="interfaces-title" className="h2 split__title">
              {p.interfaces.title}
            </h2>
          </div>
          <div data-reveal>
            <ol className="numbered-list">
              {p.interfaces.items.map((item, i) => (
                <li key={item}>
                  <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  {item}
                </li>
              ))}
            </ol>
            <h3 className="h3 interfaces__deliverables-title">{p.interfaces.deliverablesTitle}</h3>
            <ul className="chip-list">
              {p.interfaces.deliverables.map((d) => (
                <li key={d} className="chip">
                  {d}
                </li>
              ))}
            </ul>
            <p className="scope-note scope-note--inline">{p.scopeNote}</p>
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="section section--white" aria-labelledby="infra-projects-title">
          <div className="container">
            <h2 id="infra-projects-title" className="h2 section-head">
              {t.projectsPage.hero.title}
            </h2>
            <div className="project-grid">
              {related.map((pr) => (
                <ProjectCard key={pr.id} project={pr} locale={locale} labels={t.projectsPage.card} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ContactBand locale={locale} />
    </>
  );
}
