import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { pageHref, serviceHref } from '@/i18n/routes';
import { services } from '@/content/public/services';
import { SiteHeader } from './SiteHeader';

export function Header({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  return (
    <SiteHeader
      locale={locale}
      homeHref={pageHref(locale, 'home')}
      quoteHref={pageHref(locale, 'quote')}
      servicesHref={pageHref(locale, 'services')}
      servicesIndex={1}
      items={[
        { id: 'about', href: pageHref(locale, 'about'), label: t.nav.about },
        { id: 'infrastructure', href: pageHref(locale, 'infrastructure'), label: t.nav.infrastructure },
        { id: 'buildings', href: pageHref(locale, 'buildings'), label: t.nav.buildings },
        { id: 'how-we-work', href: pageHref(locale, 'howWeWork'), label: t.nav.howWeWork },
        { id: 'projects', href: pageHref(locale, 'projects'), label: t.nav.projects },
        { id: 'insights', href: pageHref(locale, 'blog'), label: t.nav.insights },
      ]}
      services={services.map((s) => ({ id: s.id, href: serviceHref(locale, s.id), label: s.name[locale] }))}
      secondary={[
        { id: 'clients', href: pageHref(locale, 'clients'), label: t.nav.clients },
        { id: 'partners', href: pageHref(locale, 'partners'), label: t.nav.partners },
        { id: 'careers', href: pageHref(locale, 'careers'), label: t.nav.careers },
        { id: 'privacy', href: pageHref(locale, 'privacy'), label: t.nav.privacy },
      ]}
      labels={{
        primary: t.nav.primary,
        services: t.nav.services,
        allServices: t.nav.allServices,
        servicesMenu: t.nav.servicesMenu,
        homeLink: t.header.homeLink,
        menuOpen: t.header.menuOpen,
        menuClose: t.header.menuClose,
        menuTitle: t.header.menuTitle,
        switchLanguage: t.header.switchLanguage,
        fileLossWarning: t.header.fileLossWarning,
        quote: t.nav.quote,
      }}
    />
  );
}
