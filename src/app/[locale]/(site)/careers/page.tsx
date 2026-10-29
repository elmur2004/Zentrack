import type { Metadata } from 'next';
import Link from 'next/link';
import { getMessages } from '@/i18n/messages';
import { isLocale } from '@/i18n/config';
import { pageHref } from '@/i18n/routes';
import { pageMetadata } from '@/lib/seo';
import { crumbs, resolveLocale } from '@/lib/page';
import { PageHero } from '@/components/layout/PageHero';
import { ClosingNote } from '@/components/sections/ContactBand';
import { FormMount } from '@/components/forms/FormMount';

// The form's delivery mode is read from the server environment on each request.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/[locale]/careers'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale).careersPage.meta;
  return pageMetadata({ locale, path: 'careers', title: t.title, description: t.description });
}

export default async function CareersPage({ params }: PageProps<'/[locale]/careers'>) {
  const locale = await resolveLocale(params);
  const t = getMessages(locale);
  const c = t.careersPage;

  return (
    <>
      <PageHero
        eyebrow={c.hero.eyebrow}
        title={c.hero.title}
        lead={c.hero.lead}
        crumbs={crumbs(locale, ['careers', t.nav.careers])}
        crumbLabel={t.common.breadcrumb}
      />
      <section className="section section--paper form-section" aria-labelledby="careers-form-title">
        <div className="container form-layout">
          <div className="form-card">
            <h2 id="careers-form-title" className="h3 form-card__title">
              {c.formTitle}
            </h2>
            <FormMount type="career" locale={locale} submitLabel={t.forms.states.submitApplication} />
          </div>
          <aside className="form-aside">
            <div className="office-card">
              <h2 className="office-card__title">{c.looking.title}</h2>
              <ul className="dash-list">
                {c.looking.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <p className="form-aside__note">{c.note}</p>
          </aside>
        </div>
      </section>
      <ClosingNote>
        <p className="muted">{t.about.hero.lead}</p>
        <Link href={pageHref(locale, 'about')} className="text-link">
          {t.nav.about}
        </Link>
      </ClosingNote>
    </>
  );
}
