import type { Metadata } from 'next';
import { getMessages } from '@/i18n/messages';
import { isLocale } from '@/i18n/config';
import { pageMetadata } from '@/lib/seo';
import { crumbs, resolveLocale } from '@/lib/page';
import { buildingSystems } from '@/content/public/building-systems';
import { PageHero } from '@/components/layout/PageHero';
import { ContactBand } from '@/components/sections/ContactBand';
import { Eyebrow } from '@/components/ui/Button';
import { BuildingExplorer } from '@/components/motion/NetworkExplorer';

export async function generateMetadata({ params }: PageProps<'/[locale]/buildings'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale).buildingsPage.meta;
  return pageMetadata({ locale, path: 'buildings', title: t.title, description: t.description });
}

/** Buildings: structure, reinforcement, building services and landscape (owner request, Nov 2026). */
export default async function BuildingsPage({ params }: PageProps<'/[locale]/buildings'>) {
  const locale = await resolveLocale(params);
  const t = getMessages(locale);
  const p = t.buildingsPage;

  return (
    <>
      <PageHero
        eyebrow={p.hero.eyebrow}
        title={p.hero.title}
        lead={p.hero.lead}
        crumbs={crumbs(locale, ['buildings', t.nav.buildings])}
        crumbLabel={t.common.breadcrumb}
      />

      <section className="section section--dark-2 on-dark explorer-section" aria-labelledby="explorer-title">
        <div className="container">
          <h2 id="explorer-title" className="h2 section-head">
            {p.explorerTitle}
          </h2>
          <BuildingExplorer
            idPrefix="building-explorer"
            items={buildingSystems.map((b) => ({
              id: b.id,
              number: b.number,
              name: b.name[locale],
              description: b.description[locale],
            }))}
            labels={t.buildingExplorer}
          />
        </div>
      </section>

      <section className="section section--white" aria-labelledby="disciplines-title">
        <div className="container">
          <div className="section-head" data-reveal>
            <h2 id="disciplines-title" className="h2">
              {p.categoriesTitle}
            </h2>
            <p className="lead muted">{p.categoriesIntro}</p>
          </div>
          <ol className="category-grid">
            {buildingSystems.map((b) => (
              <li key={b.id} id={b.id} className="category-card" data-reveal>
                <span className="category-card__num" aria-hidden="true">
                  {b.number}
                </span>
                <span className={`category-card__line explorer__swatch--${b.id}`} aria-hidden="true" />
                <h3 className="h3">{b.name[locale]}</h3>
                <p className="muted">{b.description[locale]}</p>
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

      <ContactBand locale={locale} />
    </>
  );
}
