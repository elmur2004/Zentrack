import type { Metadata } from 'next';
import { getMessages } from '@/i18n/messages';
import { isLocale } from '@/i18n/config';
import { pageHref } from '@/i18n/routes';
import { pageMetadata } from '@/lib/seo';
import { crumbs, resolveLocale } from '@/lib/page';
import { audiences } from '@/content/public/editorial';
import { PageHero } from '@/components/layout/PageHero';
import { ContactBand } from '@/components/sections/ContactBand';
import { ButtonLink } from '@/components/ui/Button';
import { CheckIcon } from '@/components/ui/icons';
import { TechIllustration, type IllustrationKind } from '@/components/motion/TechIllustration';

const VISUAL: Record<string, IllustrationKind> = { developers: 'review', contractors: 'drawing', consultants: 'coordination' };

export async function generateMetadata({ params }: PageProps<'/[locale]/clients'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale).clientsPage.meta;
  return pageMetadata({ locale, path: 'clients', title: t.title, description: t.description });
}

export default async function ClientsPage({ params }: PageProps<'/[locale]/clients'>) {
  const locale = await resolveLocale(params);
  const t = getMessages(locale);
  const p = t.clientsPage;

  return (
    <>
      <PageHero
        eyebrow={p.hero.eyebrow}
        title={p.hero.title}
        lead={p.hero.lead}
        crumbs={crumbs(locale, ['clients', t.nav.clients])}
        crumbLabel={t.common.breadcrumb}
      />

      {audiences.map((a, i) => (
        <section
          key={a.id}
          id={a.id}
          className={`section ${i % 2 ? 'section--paper' : 'section--white'} audience-section`}
          aria-labelledby={`${a.id}-title`}
        >
          <div className="container audience-section__grid">
            <div className="audience-section__intro" data-reveal>
              <span className="audience-section__num" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h2 id={`${a.id}-title`} className="h2">
                {a.title[locale]}
              </h2>
              <p className="lead muted">{a.intro[locale]}</p>
              <ButtonLink href={`${pageHref(locale, 'quote')}?service=${a.service}`} variant="primary" arrow>
                {p.cta}
                <span className="sr-only"> — {a.title[locale]}</span>
              </ButtonLink>
            </div>
            <div className="audience-section__lists" data-reveal>
              <div className="audience-section__visual" aria-hidden="true">
                <TechIllustration kind={VISUAL[a.id] ?? 'model'} />
              </div>
              <div className="audience-section__cols">
                <div>
                  <h3 className="h3 detail-block__title">{p.needs}</h3>
                  <ul className="dash-list">
                    {a.needs[locale].map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="h3 detail-block__title">{p.deliverables}</h3>
                  <ul className="check-list">
                    {a.deliverables[locale].map((d) => (
                      <li key={d}>
                        <CheckIcon />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      <ContactBand locale={locale} />
    </>
  );
}
