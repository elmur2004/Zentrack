'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { Locale } from '@/i18n/config';
import { ArrowIcon, ChevronIcon, CloseIcon, MenuIcon } from '@/components/ui/icons';
import { LanguageSwitch } from './LanguageSwitch';

export interface HeaderNavItem {
  id: string;
  href: string;
  label: string;
}

export interface HeaderProps {
  locale: Locale;
  homeHref: string;
  quoteHref: string;
  servicesHref: string;
  items: HeaderNavItem[]; // primary items excluding services
  servicesIndex: number; // position of the services disclosure among items
  services: HeaderNavItem[];
  secondary: HeaderNavItem[]; // footer-level links shown in the mobile drawer
  labels: {
    primary: string;
    services: string;
    allServices: string;
    servicesMenu: string;
    homeLink: string;
    menuOpen: string;
    menuClose: string;
    menuTitle: string;
    switchLanguage: string;
    fileLossWarning: string;
    quote: string;
  };
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ServicesDisclosure({
  label,
  allLabel,
  menuLabel,
  servicesHref,
  services,
  pathname,
}: {
  label: string;
  allLabel: string;
  menuLabel: string;
  servicesHref: string;
  services: HeaderNavItem[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const panelId = useId();
  const wrapRef = useRef<HTMLLIElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Close after navigation (state adjusted during render, not in an effect).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const active = isActive(pathname, servicesHref);

  return (
    <li
      ref={wrapRef}
      className="site-nav__item site-nav__item--disclosure"
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={btnRef}
        type="button"
        className={`site-nav__link ${active ? 'is-active' : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <ChevronIcon className="site-nav__chevron" />
      </button>
      <div id={panelId} className="services-panel" hidden={!open}>
        <p className="sr-only">{menuLabel}</p>
        <ul>
          {services.map((s, i) => (
            <li key={s.id}>
              <Link
                href={s.href}
                className="services-panel__link"
                aria-current={pathname === s.href ? 'page' : undefined}
              >
                <span className="services-panel__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{s.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href={servicesHref} className="services-panel__all" aria-current={pathname === servicesHref ? 'page' : undefined}>
          {allLabel}
          <ArrowIcon size={16} />
        </Link>
      </div>
    </li>
  );
}

export function SiteHeader(props: HeaderProps) {
  const { locale, homeHref, quoteHref, servicesHref, items, servicesIndex, services, secondary, labels } = props;
  const pathname = usePathname() ?? homeHref;
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setSolid(window.scrollY > 12);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const closeMenu = useCallback(() => {
    const d = dialogRef.current;
    if (d?.open) d.close();
  }, []);

  const openMenu = () => {
    const d = dialogRef.current;
    if (!d || d.open) return;
    d.showModal();
    document.documentElement.classList.add('menu-open');
    setMenuOpen(true);
  };

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onClose = () => {
      document.documentElement.classList.remove('menu-open');
      setMenuOpen(false);
      toggleRef.current?.focus();
    };
    d.addEventListener('close', onClose);
    return () => d.removeEventListener('close', onClose);
  }, []);

  // Close the drawer after an internal route change.
  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  // Close the drawer if the viewport grows to the desktop layout.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 75rem)');
    const onChange = () => mq.matches && closeMenu();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [closeMenu]);

  const navItems = items.map((item) => (
    <li key={item.id} className="site-nav__item">
      <Link
        href={item.href}
        className={`site-nav__link ${isActive(pathname, item.href) ? 'is-active' : ''}`}
        aria-current={pathname === item.href ? 'page' : undefined}
      >
        {item.label}
      </Link>
    </li>
  ));
  navItems.splice(
    servicesIndex,
    0,
    <ServicesDisclosure
      key="services"
      label={labels.services}
      allLabel={labels.allServices}
      menuLabel={labels.servicesMenu}
      servicesHref={servicesHref}
      services={services}
      pathname={pathname}
    />,
  );

  return (
    <header className="site-header on-dark" data-solid={solid || undefined} data-menu-open={menuOpen || undefined}>
      <div className="container site-header__inner">
        <Link href={homeHref} className="site-header__brand" aria-label={labels.homeLink}>
          <Image
            src="/brand/zentrac-logo-horizontal-on-dark.png"
            alt=""
            width={503}
            height={93}
            priority
            // 16 KB transparent PNG served as-is (no optimizer round trip for the brand mark)
            unoptimized
          />
        </Link>

        <nav aria-label={labels.primary} className="site-nav">
          <ul className="site-nav__list">{navItems}</ul>
        </nav>

        <div className="site-header__actions">
          <LanguageSwitch
            locale={locale}
            ariaLabel={labels.switchLanguage}
            fileWarning={labels.fileLossWarning}
            className="site-header__lang"
          />
          <Link href={quoteHref} className="btn btn--primary btn--sm site-header__cta">
            <span className="btn__label">{labels.quote}</span>
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={labels.menuOpen}
            onClick={openMenu}
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      <dialog
        id="mobile-menu"
        ref={dialogRef}
        className="mobile-menu on-dark"
        aria-labelledby={titleId}
        onClick={(e) => {
          // click on the backdrop area closes the drawer
          if (e.target === dialogRef.current) closeMenu();
        }}
      >
        <div className="mobile-menu__panel">
          <div className="mobile-menu__top">
            <h2 id={titleId} className="mobile-menu__title">
              {labels.menuTitle}
            </h2>
            <button type="button" className="mobile-menu__close" aria-label={labels.menuClose} onClick={closeMenu}>
              <CloseIcon />
            </button>
          </div>
          <div className="mobile-menu__actions">
            <Link href={quoteHref} className="btn btn--primary" onClick={closeMenu}>
              <span className="btn__label">{labels.quote}</span>
              <span className="btn__arrow">
                <ArrowIcon />
              </span>
            </Link>
            <LanguageSwitch
              locale={locale}
              ariaLabel={labels.switchLanguage}
              fileWarning={labels.fileLossWarning}
              className="mobile-menu__lang"
              onNavigate={closeMenu}
            />
          </div>
          <nav aria-label={labels.primary}>
            <ul className="mobile-menu__list">
              {items.slice(0, servicesIndex).map((item) => (
                <li key={item.id}>
                  <Link href={item.href} onClick={closeMenu} aria-current={pathname === item.href ? 'page' : undefined}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={servicesHref} onClick={closeMenu} aria-current={pathname === servicesHref ? 'page' : undefined}>
                  {labels.services}
                </Link>
                <ul className="mobile-menu__sub">
                  {services.map((s) => (
                    <li key={s.id}>
                      <Link href={s.href} onClick={closeMenu} aria-current={pathname === s.href ? 'page' : undefined}>
                        {s.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              {items.slice(servicesIndex).map((item) => (
                <li key={item.id}>
                  <Link href={item.href} onClick={closeMenu} aria-current={pathname === item.href ? 'page' : undefined}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mobile-menu__secondary">
              {secondary.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} onClick={closeMenu} aria-current={pathname === item.href ? 'page' : undefined}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </dialog>
    </header>
  );
}
