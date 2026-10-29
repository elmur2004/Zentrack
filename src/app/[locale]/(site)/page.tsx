import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { fmt, formatDate } from '@/i18n/format';
import { articleHref, pageHref, serviceHref } from '@/i18n/routes';
import { pageMetadata } from '@/lib/seo';
import { services } from '@/content/public/services';
import { networks } from '@/content/public/networks';
import { stages } from '@/content/public/track';
import { audiences, principles, projectTypes } from '@/content/public/editorial';
import { publicArticles, publicProjects } from '@/content/public';
import { ButtonLink, Eyebrow } from '@/components/ui/Button';
import { ArrowIcon } from '@/components/ui/icons';
import { HeroScene } from '@/components/motion/HeroScene';
import { HeroTilt } from '@/components/motion/HeroTilt';
import { NetworkExplorer } from '@/components/motion/NetworkExplorer';
import { ZentracTrack } from '@/components/motion/ZentracTrack';
import { ServicePreview } from '@/components/sections/ServicePreview';
import { ContactBand } from '@/components/sections/ContactBand';
import { PackageIncludes } from '@/components/sections/PackageIncludes';
import { IssueRegister } from '@/components/sections/IssueRegister';
import { ProjectCard } from '@/components/sections/ProjectCard';
import { TechIllustration, TRACK_VISUALS } from '@/components/motion/TechIllustration';

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return pageMetadata({ locale, path: '', title: t.home.meta.title, description: t.home.meta.description, absoluteTitle: true });
}

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getMessages(locale);
  const h = t.home;
  const featured = publicProjects.filter((p) => p.featured).slice(0, 3);
  const latest = publicArticles.slice(0, 3);

  return (
    <>
      {/* H01 — Signature hero */}
      <section className="hero on-dark" aria-labelledby="hero-title">
        <div className="hero__grid-bg" aria-hidden="true" />
        <div className="hero__slash" aria-hidden="true" />
        <div className="container hero__inner">
          <div className="hero__copy">
            <p className="eyebrow eyebrow--on-dark hero__eyebrow">{h.hero.eyebrow}</p>
            <h1 id="hero-title" className="hero__title">
              {h.hero.title}
            </h1>
            <p className="lead hero__lead">{h.hero.lead}</p>
            <div className="hero__ctas">
              <ButtonLink href={pageHref(locale, 'quote')} variant="primary" arrow>
                {t.common.requestQuote}
              </ButtonLink>
              <ButtonLink href={pageHref(locale, 'services')} variant="ghost-dark">
                {t.common.exploreServices}
              </ButtonLink>
            </div>
            <ul className="hero__types" aria-label={h.hero.descriptors}>
              {projectTypes[locale].map((type) => (
                <li key={type}>{type}</li>
              ))}
            </ul>
          </div>
          <div className="hero__visual">
            <div className="hero__tilt" id="hero-tilt">
              <HeroScene caption={h.hero.caption} />
            </div>
            <HeroTilt targetId="hero-tilt" />
          </div>
        </div>
        <span className="corner-marks" aria-hidden="true" />
      </section>

      {/* H02 — The design-to-site problem */}
      <section className="section section--white problem" aria-labelledby="problem-title">
        <div className="container problem__grid">
          <div className="problem__statement" data-reveal>
            <Eyebrow>{h.problem.eyebrow}</Eyebrow>
            <h2 id="problem-title" className="h2">
              {h.problem.title}
            </h2>
            <span className="rule-draw" aria-hidden="true" />
            <p className="lead muted">{h.problem.intro}</p>
          </div>
          <ol className="problem__list">
            {h.problem.items.map((item, i) => (
              <li key={item.title} className="problem__item" data-reveal>
                <span className="problem__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="h3">{item.title}</h3>
                  <p className="muted">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* H03 — Service preview */}
      <section className="section section--paper" aria-labelledby="services-title">
        <div className="container">
          <div className="section-head section-head--split" data-reveal>
            <div>
              <Eyebrow>{h.services.eyebrow}</Eyebrow>
              <h2 id="services-title" className="h2">
                {h.services.title}
              </h2>
            </div>
            <div className="section-head__aside">
              <p className="lead muted">{h.services.intro}</p>
              <ButtonLink href={pageHref(locale, 'services')} variant="text" arrow>
                {h.services.allServices}
              </ButtonLink>
            </div>
          </div>
          <ServicePreview
            id="home-services"
            deliverablesCue={h.services.deliverablesCue}
            caption={h.services.visualCaption}
            visuals={services.map((s) => (
              <TechIllustration key={s.id} kind={s.visual} />
            ))}
            rows={services.map((s) => ({
              id: s.id,
              number: s.number,
              name: s.name[locale],
              short: s.short[locale],
              deliverables: s.deliverables[locale].join(' · '),
              href: serviceHref(locale, s.id),
            }))}
          />
        </div>
      </section>

      {/* H04 — Why Zentrac */}
      <section className="section section--white why" aria-labelledby="why-title">
        <div className="container">
          <div className="section-head" data-reveal>
            <Eyebrow>{h.why.eyebrow}</Eyebrow>
            <h2 id="why-title" className="h2 why__title">
              {h.why.title}
            </h2>
          </div>
          <div className="why__grid">
            <ol className="principles">
              {principles.map((p, i) => (
                <li key={p.id} className="principle" data-reveal>
                  <span className="principle__mark" aria-hidden="true">
                    <span className="principle__num">{String(i + 1).padStart(2, '0')}</span>
                  </span>
                  <h3 className="h3">{p.title[locale]}</h3>
                  <p className="muted">{p.text[locale]}</p>
                </li>
              ))}
            </ol>
            <IssueRegister locale={locale} />
          </div>
        </div>
      </section>

      {/* H05 — Infrastructure explorer */}
      <section className="section section--dark on-dark explorer-section" aria-labelledby="explorer-title">
        <div className="section-grid-bg" aria-hidden="true" />
        <div className="container">
          <div className="section-head section-head--split" data-reveal>
            <div>
              <p className="eyebrow eyebrow--on-dark">{h.explorer.eyebrow}</p>
              <h2 id="explorer-title" className="h2">
                {h.explorer.title}
              </h2>
            </div>
            <div className="section-head__aside">
              <p className="lead muted-on-dark">{h.explorer.intro}</p>
              <ButtonLink href={pageHref(locale, 'infrastructure')} variant="ghost-dark" arrow>
                {h.explorer.cta}
              </ButtonLink>
            </div>
          </div>
          <NetworkExplorer
            idPrefix="home-explorer"
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

      {/* H06 — Selected experience (approved records) or capability fallback */}
      {featured.length >= 3 ? (
        <section className="section section--paper" aria-labelledby="experience-title">
          <div className="container">
            <div className="section-head" data-reveal>
              <Eyebrow>{t.projectsPage.hero.eyebrow}</Eyebrow>
              <h2 id="experience-title" className="h2">
                {t.projectsPage.hero.title}
              </h2>
              <p className="muted">{t.projectsPage.attribution}</p>
            </div>
            <div className="project-feature-grid">
              {featured.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  locale={locale}
                  labels={t.projectsPage.card}
                  variant={i === 0 ? 'wide' : 'default'}
                />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <PackageIncludes locale={locale} />
      )}

      {/* H07 — The Zentrac Track */}
      <section className="section section--white track-section" aria-labelledby="track-title">
        <div className="container">
          <div className="section-head section-head--split" data-reveal>
            <div>
              <Eyebrow>{h.track.eyebrow}</Eyebrow>
              <h2 id="track-title" className="h2">
                {h.track.title}
              </h2>
            </div>
            <div className="section-head__aside">
              <p className="lead muted">{h.track.intro}</p>
            </div>
          </div>
          <ZentracTrack
            idPrefix="track"
            visuals={TRACK_VISUALS.map((kind) => (
              <TechIllustration key={kind} kind={kind} />
            ))}
            stages={stages.map((s) => ({
              id: s.id,
              number: s.number,
              title: s.title[locale],
              text: s.text[locale],
              input: s.input[locale],
              output: s.output[locale],
            }))}
            labels={{ stagesNav: h.track.stagesNav, input: h.track.input, output: h.track.output }}
          />
          <div className="join-band" data-reveal>
            <div>
              <h3 className="h3">{h.track.joinTitle}</h3>
              <p className="muted">{h.track.joinText}</p>
            </div>
            <ButtonLink href={pageHref(locale, 'howWeWork')} variant="ghost-light" arrow>
              {h.track.cta}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* H08 — Who we work with */}
      <section className="section section--paper" aria-labelledby="audiences-title">
        <div className="container">
          <div className="section-head section-head--split" data-reveal>
            <div>
              <Eyebrow>{h.audiences.eyebrow}</Eyebrow>
              <h2 id="audiences-title" className="h2">
                {h.audiences.title}
              </h2>
            </div>
            <div className="section-head__aside">
              <p className="lead muted">{h.audiences.intro}</p>
            </div>
          </div>
          <ul className="audience-grid">
            {audiences.map((a, i) => (
              <li key={a.id} className="audience-card" data-reveal>
                <span className="audience-card__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="h3">{a.title[locale]}</h3>
                <p className="muted">{a.short[locale]}</p>
                <p className="audience-card__label">{h.audiences.typicalDeliverables}</p>
                <ul className="chip-list">
                  {a.deliverables[locale].slice(0, 3).map((d) => (
                    <li key={d} className="chip">
                      {d}
                    </li>
                  ))}
                </ul>
                <Link href={pageHref(locale, 'clients', a.id)} className="text-link audience-card__link">
                  {fmt(h.audiences.cta, { audience: a.title[locale] })}
                  <ArrowIcon size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* H09 — Insights: only when real articles are published */}
      {latest.length ? (
        <section className="section section--white" aria-labelledby="insights-title">
          <div className="container">
            <div className="section-head section-head--split">
              <div>
                <Eyebrow>{h.insights.eyebrow}</Eyebrow>
                <h2 id="insights-title" className="h2">
                  {h.insights.title}
                </h2>
              </div>
              <ButtonLink href={pageHref(locale, 'blog')} variant="text" arrow>
                {h.insights.cta}
              </ButtonLink>
            </div>
            <ul className="article-grid">
              {latest.map((a) => (
                <li key={a.id} className="article-card">
                  <time dateTime={a.publishedAt}>{formatDate(locale, a.publishedAt)}</time>
                  <h3 className="h3">
                    <Link href={articleHref(locale, a.slug)}>{a.title[locale]}</Link>
                  </h3>
                  <p className="muted">{a.excerpt[locale]}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <ContactBand locale={locale as Locale} />
    </>
  );
}
