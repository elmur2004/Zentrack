import type { Metadata } from 'next';
import Link from 'next/link';
import { getMessages } from '@/i18n/messages';
import { isLocale } from '@/i18n/config';
import { pageHref } from '@/i18n/routes';
import { pageMetadata } from '@/lib/seo';
import { crumbs, resolveLocale } from '@/lib/page';
import { company } from '@/content/public/company';
import { telHref } from '@/lib/contacts';
import { getPublicContacts } from '@/server/public/site-settings';
import { PageHero } from '@/components/layout/PageHero';
import { ClosingNote } from '@/components/sections/ContactBand';
import { FormMount } from '@/components/forms/FormMount';
import { PinIcon } from '@/components/ui/icons';

// The form's delivery mode is read from the server environment on each request.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/[locale]/request-a-quote'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale).quotePage.meta;
  return pageMetadata({ locale, path: 'request-a-quote', title: t.title, description: t.description });
}

export default async function QuotePage({ params }: PageProps<'/[locale]/request-a-quote'>) {
  const locale = await resolveLocale(params);
  const t = getMessages(locale);
  const q = t.quotePage;
  const contacts = await getPublicContacts();

  return (
    <>
      <PageHero
        variant="compact"
        eyebrow={q.hero.eyebrow}
        title={q.hero.title}
        lead={q.hero.lead}
        crumbs={crumbs(locale, ['quote', t.nav.quote])}
        crumbLabel={t.common.breadcrumb}
      />
      <section className="section section--paper form-section" aria-label={q.hero.title}>
        <div className="container form-layout">
          <div className="form-card">
            <FormMount type="quote" locale={locale} submitLabel={t.forms.states.submit} />
          </div>
          <aside className="form-aside">
            <div className="office-card">
              <h2 className="office-card__title">{q.officeTitle}</h2>
              <p className="office-card__address">
                <PinIcon />
                <span>
                  {company.address[locale].map((line) => (
                    <span key={line} className="office-card__line">
                      {line}
                    </span>
                  ))}
                </span>
              </p>
              {contacts.email || contacts.phone ? (
                <>
                  <h3 className="office-card__subtitle">{q.contactTitle}</h3>
                  <ul className="office-card__contacts">
                    {contacts.email ? (
                      <li>
                        <a href={`mailto:${contacts.email}`} dir="ltr">
                          {contacts.email}
                        </a>
                      </li>
                    ) : null}
                    {contacts.phone ? (
                      <li>
                        <a href={telHref(contacts.phone)} dir="ltr">
                          {contacts.phone}
                        </a>
                      </li>
                    ) : null}
                  </ul>
                </>
              ) : null}
            </div>
            <p className="form-aside__note">{q.confidentiality}</p>
          </aside>
        </div>
      </section>
      <ClosingNote>
        <p className="muted">{q.closing}</p>
        <div className="closing-note__links">
          <Link href={pageHref(locale, 'howWeWork')} className="text-link">
            {t.nav.howWeWork}
          </Link>
          <Link href={pageHref(locale, 'services')} className="text-link">
            {t.nav.services}
          </Link>
        </div>
      </ClosingNote>
    </>
  );
}
