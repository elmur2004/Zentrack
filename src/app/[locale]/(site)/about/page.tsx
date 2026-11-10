import type { Metadata } from 'next';
import { getMessages } from '@/i18n/messages';
import { isLocale } from '@/i18n/config';
import { pageMetadata } from '@/lib/seo';
import { crumbs, resolveLocale } from '@/lib/page';
import { values } from '@/content/public/editorial';
import { coFounders, founder } from '@/content/public/team';
import { PageHero } from '@/components/layout/PageHero';
import { ContactBand } from '@/components/sections/ContactBand';
import { Eyebrow } from '@/components/ui/Button';
import { FoundingTeam } from '@/components/sections/FoundingTeam';

export async function generateMetadata({ params }: PageProps<'/[locale]/about'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale).about.meta;
  return pageMetadata({ locale, path: 'about', title: t.title, description: t.description });
}

export default async function AboutPage({ params }: PageProps<'/[locale]/about'>) {
  const locale = await resolveLocale(params);
  const t = getMessages(locale);
  const a = t.about;
  const facts = a.company.facts;

  return (
    <>
      <PageHero
        eyebrow={a.hero.eyebrow}
        title={a.hero.title}
        lead={a.hero.lead}
        crumbs={crumbs(locale, ['about', t.nav.about])}
        crumbLabel={t.common.breadcrumb}
        aside={
          <dl className="fact-card">
            <div>
              <dt>{facts.founded}</dt>
              <dd>{facts.foundedValue}</dd>
            </div>
            <div>
              <dt>{facts.experience}</dt>
              <dd>{facts.experienceValue}</dd>
            </div>
            <div>
              <dt>{facts.office}</dt>
              <dd>{facts.officeValue}</dd>
            </div>
          </dl>
        }
      />

      <section className="section section--white" aria-labelledby="company-title">
        <div className="container split">
          <div data-reveal>
            <Eyebrow>{a.company.eyebrow}</Eyebrow>
            <h2 id="company-title" className="h2 split__title">
              {a.company.title}
            </h2>
          </div>
          <div className="prose" data-reveal>
            {a.company.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--paper" aria-labelledby="team-title">
        <div className="container">
          <div className="section-head" data-reveal>
            <Eyebrow>{a.team.eyebrow}</Eyebrow>
            <h2 id="team-title" className="h2">
              {a.team.title}
            </h2>
            <p className="lead muted">{a.team.intro}</p>
          </div>
          <FoundingTeam founder={founder} coFounders={coFounders} locale={locale} labels={{ coFounders: a.team.coFounders, portraitAlt: a.team.portraitAlt }} />
        </div>
      </section>

      <section className="section section--white" aria-labelledby="chronology-title">
        <div className="container">
          <div className="section-head" data-reveal>
            <Eyebrow>{a.chronology.eyebrow}</Eyebrow>
            <h2 id="chronology-title" className="h2">
              {a.chronology.title}
            </h2>
          </div>
          <ol className="timeline">
            {a.chronology.items.map((item, i) => (
              <li key={item.year} className="timeline__item" data-current={i === a.chronology.items.length - 1 || undefined} data-reveal>
                <span className="timeline__node" aria-hidden="true" />
                <p className="timeline__year">{item.year}</p>
                <p className="timeline__text">{item.text}</p>
              </li>
            ))}
          </ol>
          <p className="small muted timeline__note">{a.chronology.note}</p>
        </div>
      </section>

      <section className="section section--paper-2" aria-labelledby="values-title">
        <div className="container">
          <div className="section-head" data-reveal>
            <Eyebrow>{a.values.eyebrow}</Eyebrow>
            <h2 id="values-title" className="h2">
              {a.values.title}
            </h2>
          </div>
          <ul className="value-grid">
            {values.map((v, i) => (
              <li key={v.id} className="value-card" data-reveal>
                <span className="value-card__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="h3">{v.title[locale]}</h3>
                <p className="muted">{v.text[locale]}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ContactBand locale={locale} />
    </>
  );
}
