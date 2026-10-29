import type { Metadata } from 'next';
import Link from 'next/link';
import { getMessages } from '@/i18n/messages';
import { isLocale } from '@/i18n/config';
import { pageHref } from '@/i18n/routes';
import { fmt, formatDate, plural } from '@/i18n/format';
import { PRIVACY_POLICY, RETENTION } from '@/lib/legal';
import { pageMetadata } from '@/lib/seo';
import { crumbs, resolveLocale } from '@/lib/page';
import { getPublicContacts } from '@/server/public/site-settings';
import { PageHero } from '@/components/layout/PageHero';
import { ClosingNote } from '@/components/sections/ContactBand';
import { Rich } from '@/components/ui/Rich';

export async function generateMetadata({ params }: PageProps<'/[locale]/privacy'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale).privacyPage.meta;
  return pageMetadata({ locale, path: 'privacy', title: t.title, description: t.description });
}

/**
 * Approved privacy policy (owner approval of 28 Oct 2026, OD-04). Retention periods and the
 * policy version come from src/lib/legal.ts, the same values the retention job enforces; the
 * contact channel for requests comes from the dashboard (Settings → Public contact details).
 */
export default async function PrivacyPage({ params }: PageProps<'/[locale]/privacy'>) {
  const locale = await resolveLocale(params);
  const t = getMessages(locale);
  const p = t.privacyPage;
  const contacts = await getPublicContacts();
  const values = {
    quoteMonths: plural(locale, RETENTION.quoteMonths, p.units.months),
    careerMonths: plural(locale, RETENTION.careerMonths, p.units.months),
    spamDays: plural(locale, RETENTION.spamDays, p.units.days),
    uploadHours: plural(locale, RETENTION.abandonedUploadHours, p.units.hours),
    rateLimitHours: plural(locale, RETENTION.rateLimitHours, p.units.hours),
    uploadCookieHours: plural(locale, RETENTION.uploadCookieHours, p.units.hours),
  };

  return (
    <>
      <PageHero
        variant="compact"
        eyebrow={p.hero.eyebrow}
        title={p.hero.title}
        lead={p.hero.lead}
        crumbs={crumbs(locale, ['privacy', t.nav.privacy])}
        crumbLabel={t.common.breadcrumb}
      />
      <section className="section section--white">
        <div className="container legal">
          <nav className="legal__toc" aria-label={p.hero.title}>
            <ol>
              {p.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.title}</a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="legal__body">
            <p className="legal__meta" data-testid="privacy-version">
              <span>
                {p.updatedLabel}: <time dateTime={PRIVACY_POLICY.updated}>{formatDate(locale, `${PRIVACY_POLICY.updated}T00:00:00Z`)}</time>
              </span>
              <span>
                {p.versionLabel}: <bdi dir="ltr">{PRIVACY_POLICY.version}</bdi>
              </span>
            </p>
            {p.sections.map((s) => (
              <section key={s.id} id={s.id} className="legal__section" aria-labelledby={`${s.id}-title`}>
                <h2 id={`${s.id}-title`} className="h3">
                  {s.title}
                </h2>
                {s.body.map((para) => (
                  <p key={para}>{fmt(para, values)}</p>
                ))}
                {s.id === 'rights' ? (
                  <p data-testid="privacy-contact">
                    {contacts.email ? (
                      <Rich
                        text={p.rightsContactEmail}
                        values={{
                          email: (
                            <a href={`mailto:${contacts.email}`} dir="ltr">
                              {contacts.email}
                            </a>
                          ),
                        }}
                      />
                    ) : (
                      p.rightsContactPost
                    )}
                  </p>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </section>
      <ClosingNote>
        <p className="muted">{t.home.contact.text}</p>
        <Link href={pageHref(locale, 'quote')} className="text-link">
          {t.common.requestQuote}
        </Link>
      </ClosingNote>
    </>
  );
}
