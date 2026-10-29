import type { Metadata } from 'next';
import Link from 'next/link';
import { getMessages } from '@/i18n/messages';
import { isLocale } from '@/i18n/config';
import { fmt } from '@/i18n/format';
import { pageHref, serviceHref } from '@/i18n/routes';
import { pageMetadata } from '@/lib/seo';
import { crumbs, resolveLocale } from '@/lib/page';
import { services } from '@/content/public/services';
import { specialistServicesConfirmed } from '@/content/public/editorial';
import { PageHero } from '@/components/layout/PageHero';
import { ContactBand } from '@/components/sections/ContactBand';
import { ButtonLink, Eyebrow } from '@/components/ui/Button';
import { ArrowIcon } from '@/components/ui/icons';
import { TechIllustration } from '@/components/motion/TechIllustration';

export async function generateMetadata({ params }: PageProps<'/[locale]/services'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale).servicesPage.meta;
  return pageMetadata({ locale, path: 'services', title: t.title, description: t.description });
}

export default async function ServicesPage({ params }: PageProps<'/[locale]/services'>) {
  const locale = await resolveLocale(params);
  const t = getMessages(locale);
  const s = t.servicesPage;

  return (
    <>
      <PageHero
        eyebrow={s.hero.eyebrow}
        title={s.hero.title}
        lead={s.hero.lead}
        crumbs={crumbs(locale, ['services', t.nav.services])}
        crumbLabel={t.common.breadcrumb}
      />

      <section className="section section--white" aria-labelledby="services-list-title">
        <div className="container">
          <h2 id="services-list-title" className="sr-only">
            {s.listTitle}
          </h2>
          <ol className="service-list">
            {services.map((svc) => (
              <li key={svc.id} className="service-item" id={svc.id} data-reveal>
                <div className="service-item__num" aria-hidden="true">
                  {svc.number}
                </div>
                <div className="service-item__body">
                  <h3 className="h2 service-item__title">
                    <Link href={serviceHref(locale, svc.id)}>{svc.name[locale]}</Link>
                  </h3>
                  <p className="lead muted">{svc.summary[locale]}</p>
                  <p className="service-item__label">{t.common.deliverables}</p>
                  <ul className="chip-list">
                    {svc.deliverables[locale].map((d) => (
                      <li key={d} className="chip">
                        {d}
                      </li>
                    ))}
                  </ul>
                  <Link href={serviceHref(locale, svc.id)} className="text-link service-item__link">
                    {fmt(t.common.viewServiceNamed, { name: svc.name[locale] })}
                    <ArrowIcon size={16} />
                  </Link>
                </div>
                <div className="service-item__visual" aria-hidden="true">
                  <TechIllustration kind={svc.visual} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--dark on-dark flex-band" aria-labelledby="flexible-title">
        <div className="section-grid-bg" aria-hidden="true" />
        <div className="container flex-band__inner" data-reveal>
          <div>
            <p className="eyebrow eyebrow--on-dark">{s.flexible.eyebrow}</p>
            <h2 id="flexible-title" className="h2">
              {s.flexible.title}
            </h2>
          </div>
          <div className="flex-band__aside">
            <p className="lead muted-on-dark">{s.flexible.text}</p>
            <ButtonLink href={pageHref(locale, 'howWeWork', 'engagement')} variant="ghost-dark" arrow>
              {s.flexible.cta}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Conditional specialist-services module: off until delivery arrangements are confirmed (F1 p3, F3 D07). */}
      {specialistServicesConfirmed ? (
        <section className="section section--paper" aria-labelledby="specialist-title">
          <div className="container reading">
            <Eyebrow>{s.specialist.eyebrow}</Eyebrow>
            <h2 id="specialist-title" className="h2">
              {s.specialist.title}
            </h2>
            <p className="lead muted">{s.specialist.text}</p>
          </div>
        </section>
      ) : null}

      <ContactBand locale={locale} />
    </>
  );
}
