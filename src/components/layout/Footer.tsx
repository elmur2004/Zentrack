import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { fmt, formatFileSize } from '@/i18n/format';
import { pageHref } from '@/i18n/routes';
import { company } from '@/content/public/company';
import { hasAnyContact, telHref, whatsappHref, type ContactChannels } from '@/lib/contacts';
import { publicDownloads } from '@/content/public';
import { DownloadIcon } from '@/components/ui/icons';

/** `contacts` come from the dashboard (owner-managed); unset channels are simply not shown. */
export function Footer({ locale, contacts }: { locale: Locale; contacts: ContactChannels }) {
  const t = getMessages(locale);
  const profile = publicDownloads.find((d) => d.id === 'company-profile');
  const year = new Date().getFullYear();

  const companyLinks = [
    { href: pageHref(locale, 'about'), label: t.nav.about },
    { href: pageHref(locale, 'projects'), label: t.nav.projects },
    { href: pageHref(locale, 'partners'), label: t.nav.partners },
    { href: pageHref(locale, 'careers'), label: t.nav.careers },
  ];
  const serviceLinks = [
    { href: pageHref(locale, 'services'), label: t.nav.allServices },
    { href: pageHref(locale, 'infrastructure'), label: t.nav.infrastructure },
    { href: pageHref(locale, 'buildings'), label: t.nav.buildings },
    { href: pageHref(locale, 'howWeWork'), label: t.nav.howWeWork },
    { href: pageHref(locale, 'clients'), label: t.nav.clients },
  ];

  return (
    <footer className="site-footer on-dark">
      <div className="container">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <Link href={pageHref(locale, 'home')} aria-label={t.header.homeLink} className="site-footer__logo">
              <Image src="/brand/zentrac-logo-horizontal-on-dark.png" alt="" width={503} height={93} sizes="180px" />
            </Link>
            <p className="site-footer__descriptor">{t.footer.descriptor}</p>
            {profile ? (
              <a className="site-footer__download" href={profile.href} download>
                <DownloadIcon />
                <span>{t.common.downloadProfile}</span>
                <span className="site-footer__download-meta">
                  {fmt(profile.language === 'en' ? t.common.profileEnglishPdf : t.common.profileArabicPdf, {
                    size: formatFileSize(locale, profile.bytes),
                  })}
                </span>
              </a>
            ) : null}
          </div>

          <nav aria-label={t.footer.footerNav} className="site-footer__nav">
            <div>
              <h2 className="site-footer__heading">{t.footer.company}</h2>
              <ul>
                {companyLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="site-footer__heading">{t.footer.services}</h2>
              <ul>
                {serviceLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="site-footer__office">
            <h2 className="site-footer__heading">{t.footer.office}</h2>
            <address>
              {company.address[locale].map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
            {hasAnyContact(contacts) ? (
              <ul className="site-footer__contacts" data-testid="footer-contacts">
                {contacts.email ? (
                  <li>
                    <span className="site-footer__label">{t.footer.email}</span>
                    <a href={`mailto:${contacts.email}`} dir="ltr">
                      {contacts.email}
                    </a>
                  </li>
                ) : null}
                {contacts.phone ? (
                  <li>
                    <span className="site-footer__label">{t.footer.phone}</span>
                    <a href={telHref(contacts.phone)} dir="ltr">
                      {contacts.phone}
                    </a>
                  </li>
                ) : null}
                {contacts.whatsapp ? (
                  <li>
                    <a href={whatsappHref(contacts.whatsapp)} rel="noopener noreferrer" target="_blank">
                      {t.footer.whatsapp} <span className="sr-only">{t.common.opensInNewTab}</span>
                    </a>
                  </li>
                ) : null}
                {contacts.linkedin ? (
                  <li>
                    <a href={contacts.linkedin} rel="noopener noreferrer" target="_blank">
                      {t.footer.linkedin} <span className="sr-only">{t.common.opensInNewTab}</span>
                    </a>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>{fmt(t.footer.copyright, { year })}</p>
          <p className="site-footer__line" lang={locale}>
            {t.common.brandLine}
          </p>
          <Link href={pageHref(locale, 'privacy')}>{t.nav.privacy}</Link>
        </div>
      </div>
    </footer>
  );
}
