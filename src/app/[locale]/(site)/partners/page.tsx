import type { Metadata } from 'next';
import { getMessages } from '@/i18n/messages';
import { isLocale } from '@/i18n/config';
import { pageMetadata } from '@/lib/seo';
import { crumbs, resolveLocale } from '@/lib/page';
import { partnerTypes } from '@/content/public/editorial';
import { PageHero } from '@/components/layout/PageHero';
import { FormMount } from '@/components/forms/FormMount';

// The form's delivery mode is read from the server environment on each request.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/[locale]/partners'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale).partnersPage.meta;
  return pageMetadata({ locale, path: 'partners', title: t.title, description: t.description });
}

export default async function PartnersPage({ params }: PageProps<'/[locale]/partners'>) {
  const locale = await resolveLocale(params);
  const t = getMessages(locale);
  const p = t.partnersPage;

  return (
    <>
      <PageHero
        eyebrow={p.hero.eyebrow}
        title={p.hero.title}
        lead={p.hero.lead}
        crumbs={crumbs(locale, ['partners', t.nav.partners])}
        crumbLabel={t.common.breadcrumb}
      />
      <section className="section section--white" aria-labelledby="partner-types-title">
        <div className="container">
          <h2 id="partner-types-title" className="h2 section-head">
            {p.typesTitle}
          </h2>
          <ul className="value-grid">
            {partnerTypes.map((pt, i) => (
              <li key={pt.id} className="value-card" data-reveal>
                <span className="value-card__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="h3">{pt.title[locale]}</h3>
                <p className="muted">{pt.text[locale]}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section section--paper form-section" aria-labelledby="partner-form-title">
        <div className="container form-layout form-layout--single">
          <div className="form-intro">
            <h2 id="partner-form-title" className="h2">
              {p.formTitle}
            </h2>
            <p className="lead muted">{p.formIntro}</p>
          </div>
          <div className="form-card">
            <FormMount type="partner" locale={locale} submitLabel={t.forms.states.submitPartner} />
          </div>
        </div>
      </section>
    </>
  );
}
