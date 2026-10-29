import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { pageHref } from '@/i18n/routes';
import { ArrowIcon } from '@/components/ui/icons';

/** Localized "page not found" content with recovery links (used by the 404 route and not-found boundary). */
export function NotFoundView({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  const links = [
    { href: pageHref(locale, 'home'), label: t.common.home },
    { href: pageHref(locale, 'services'), label: t.nav.services },
    { href: pageHref(locale, 'projects'), label: t.nav.projects },
    { href: pageHref(locale, 'quote'), label: t.nav.quote },
  ];
  return (
    <section className="status-page on-dark">
      <div className="page-hero__grid" aria-hidden="true" />
      <div className="container status-page__inner">
        <p className="eyebrow eyebrow--on-dark">{t.notFound.eyebrow}</p>
        <h1 className="h1">{t.notFound.title}</h1>
        <p className="lead status-page__text">{t.notFound.text}</p>
        <h2 className="status-page__links-title">{t.notFound.links}</h2>
        <ul className="status-page__links">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="status-page__link">
                <span>{l.label}</span>
                <ArrowIcon size={16} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
