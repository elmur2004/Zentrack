import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMessages } from '@/i18n/messages';
import { isLocale, locales } from '@/i18n/config';
import { fmt } from '@/i18n/format';
import { pageHref, serviceHref, serviceSlugs } from '@/i18n/routes';
import { pageMetadata, serviceJsonLd } from '@/lib/seo';
import { crumbs, resolveLocale } from '@/lib/page';
import { getService, services } from '@/content/public/services';
import { publicProjects } from '@/content/public';
import { PageHero } from '@/components/layout/PageHero';
import { ContactBand } from '@/components/sections/ContactBand';
import { ProjectCard } from '@/components/sections/ProjectCard';
import { ButtonLink, Eyebrow } from '@/components/ui/Button';
import { ArrowIcon, CheckIcon } from '@/components/ui/icons';
import { JsonLd } from '@/components/ui/JsonLd';
import { TechIllustration } from '@/components/motion/TechIllustration';

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => serviceSlugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: PageProps<'/[locale]/services/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params;
  const svc = getService(slug);
  if (!isLocale(locale) || !svc) return {};
  return pageMetadata({
    locale,
    path: `services/${slug}`,
    title: svc.name[locale],
    description: svc.summary[locale],
  });
}

export default async function ServiceDetailPage({ params }: PageProps<'/[locale]/services/[slug]'>) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const svc = getService(slug);
  if (!svc) notFound();
  const t = getMessages(locale);
  const d = t.serviceDetail;
  const name = svc.name[locale];
  const quoteHref = `${pageHref(locale, 'quote')}?service=${svc.id}`;
  // Related record renders only if it is publicly approved with an image (spec §9.2).
  const related = publicProjects.find((p) => p.id === svc.relatedProjectId && p.images.length > 0);
  const others = services.filter((s) => s.id !== svc.id);

  return (
    <>
      <PageHero
        eyebrow={`${svc.number} · ${t.nav.services}`}
        title={name}
        lead={svc.summary[locale]}
        crumbs={crumbs(locale, ['services', t.nav.services], { name, href: serviceHref(locale, svc.id) })}
        crumbLabel={t.common.breadcrumb}
        aside={
          <div className="hero-illus on-dark" aria-hidden="true">
            <TechIllustration kind={svc.visual} />
          </div>
        }
      >
        <div className="page-hero__ctas">
          <ButtonLink href={quoteHref} variant="primary" arrow>
            {d.ctaButton}
          </ButtonLink>
          <Link href={pageHref(locale, 'services')} className="back-link">
            <ArrowIcon size={16} className="back-link__icon" />
            {t.common.backToServices}
          </Link>
        </div>
      </PageHero>

      <section className="section section--white" aria-labelledby="included-title">
        <div className="container detail-grid">
          <div className="detail-block" data-reveal>
            <h2 id="included-title" className="h3 detail-block__title">
              {d.included}
            </h2>
            <ul className="check-list">
              {svc.included[locale].map((item) => (
                <li key={item}>
                  <CheckIcon />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="detail-block" data-reveal>
            <h2 className="h3 detail-block__title">{d.inputs}</h2>
            <ul className="dash-list">
              {svc.inputs[locale].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="detail-block detail-block--deliverables" data-reveal>
            <h2 className="h3 detail-block__title">{d.deliverables}</h2>
            <ul className="deliverable-list">
              {svc.deliverables[locale].map((item, i) => (
                <li key={item}>
                  <span className="deliverable-list__num" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {svc.scopeNote ? (
          <div className="container">
            <aside className="scope-note" aria-label={d.scopeNoteLabel}>
              <p>{svc.scopeNote[locale]}</p>
            </aside>
          </div>
        ) : null}
      </section>

      <section className="section section--paper" aria-labelledby="process-title">
        <div className="container">
          <div className="section-head" data-reveal>
            <Eyebrow>{d.process}</Eyebrow>
            <h2 id="process-title" className="h2">
              {/* Arrows are decorative: screen readers hear a plain list of the four steps. */}
              {d.processTitle.split(/\s*([→←])\s*/).map((part, i) =>
                i % 2 ? (
                  <span key={i}>
                    <span className="sr-only">, </span>
                    <span aria-hidden="true"> {part} </span>
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
            </h2>
            <p className="muted">{d.processNote}</p>
          </div>
          <ol className="mini-process">
            {d.processSteps.map((step, i) => (
              <li key={step} className="mini-process__step" data-reveal>
                <span className="mini-process__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="h3">{step}</h3>
                <p className="muted">{svc.process[locale][i]}</p>
                {i < d.processSteps.length - 1 ? <ArrowIcon className="mini-process__arrow" /> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {related ? (
        <section className="section section--white" aria-labelledby="related-title">
          <div className="container">
            <h2 id="related-title" className="h2 section-head">
              {d.relatedTitle}
            </h2>
            <ProjectCard project={related} locale={locale} labels={t.projectsPage.card} variant="wide" />
          </div>
        </section>
      ) : null}

      <section className="section section--white section--tight" aria-labelledby="other-title">
        <div className="container">
          <h2 id="other-title" className="h3 other-services__title">
            {d.otherServices}
          </h2>
          <ul className="other-services">
            {others.map((o) => (
              <li key={o.id}>
                <Link href={serviceHref(locale, o.id)} className="other-services__link">
                  <span className="other-services__num" aria-hidden="true">
                    {o.number}
                  </span>
                  <span>{o.name[locale]}</span>
                  <ArrowIcon size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ContactBand
        locale={locale}
        quoteQuery={`service=${svc.id}`}
        title={fmt(d.ctaTitle, { service: name })}
        text={d.ctaText}
        buttonLabel={d.ctaButton}
      />
      <JsonLd data={serviceJsonLd(locale, name, svc.summary[locale], serviceHref(locale, svc.id))} />
    </>
  );
}
