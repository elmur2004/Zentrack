'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { localeSwitchLabel, otherLocale, type Locale } from '@/i18n/config';
import { getAdminMessages } from '@/i18n/admin';
import { plural } from '@/i18n/format';
import { Rich } from '@/components/ui/Rich';
import type { Role } from '@/lib/admin/codes';
import { listNotificationsAction, markNotificationsReadAction, unreadCountAction } from '@/server/actions/admin';
import { hasUnsavedDrafts, run, useToasts } from './runtime';
import {
  IconArchive,
  IconAudit,
  IconBriefcase,
  IconBell,
  IconChevron,
  IconExternal,
  IconInbox,
  IconMenu,
  IconOverview,
  IconQueue,
  IconSettings,
  IconSignOut,
  IconTeam,
  IconUser,
} from './icons';

interface ShellProps {
  locale: Locale;
  user: { name: string; role: Role };
  can: { team: boolean; settings: boolean; audit: boolean; applications: boolean };
  counts: { notifications: number; due: number; applications: number };
  testEnvironment: boolean;
  children: ReactNode;
}

const COLLAPSE_KEY = 'znt-adm-collapsed';

function AdminLangSwitch({ locale }: { locale: Locale }) {
  const t = getAdminMessages(locale);
  const pathname = usePathname() ?? `/${locale}/admin`;
  const search = useSearchParams();
  const router = useRouter();
  const target = otherLocale(locale);
  const rest = pathname.replace(/^\/(en|ar)(?=\/|$)/, '');
  const qs = search?.toString() ?? '';
  const href = `/${target}${rest}${qs ? `?${qs}` : ''}`;
  return (
    <Link
      href={href}
      prefetch={false}
      className="adm-lang"
      hrefLang={target}
      lang={target}
      title={t.shell.languageLabel}
      data-testid="admin-language-switch"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        // Soft navigation keeps in-memory drafts; carry the section anchor too.
        if (window.location.hash) {
          e.preventDefault();
          router.push(href + window.location.hash);
        }
      }}
    >
      {localeSwitchLabel[target]}
    </Link>
  );
}

function Notifications({ locale, initial }: { locale: Locale; initial: number }) {
  const t = getAdminMessages(locale);
  const [open, setOpen] = useState(false);
  // Server value until the poller or "mark all read" provides a newer one; reset on fresh server data.
  const [polled, setPolled] = useState<number | null>(null);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setPolled(null);
  }
  const count = polled ?? initial;
  const [items, setItems] = useState<Array<{ id: string; kind: string; createdAt: Date; readAt: Date | null; requestId: string | null; applicationId: string | null; reference: string }> | null>(null);
  const [error, setError] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    setError(false);
    const r = await run(() => listNotificationsAction());
    if (r.ok) setItems(r.data);
    else setError(true);
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) void load();
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  async function markAll() {
    const r = await run(() => markNotificationsReadAction('all'));
    if (r.ok) {
      setPolled(0);
      setItems((list) => list?.map((i) => ({ ...i, readAt: i.readAt ?? new Date() })) ?? null);
    }
  }

  const kinds = t.notifications.kinds as Record<string, string>;
  return (
    <div className="adm-relative" ref={wrap}>
      <button
        ref={button}
        type="button"
        className="adm-btn adm-btn--ghost adm-btn--icon adm-relative"
        aria-expanded={open}
        aria-controls="adm-notifications"
        aria-label={plural(locale, count, t.notifications.open)}
        onClick={toggle}
        data-testid="notifications-button"
      >
        <IconBell />
        {count > 0 ? (
          <span className="adm-btn__badge" aria-hidden="true">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="adm-popover" id="adm-notifications" role="region" aria-label={t.notifications.title}>
          <div className="adm-popover__head">
            <h2 className="adm-h3">{t.notifications.title}</h2>
            {count > 0 ? (
              <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost" onClick={markAll}>
                {t.notifications.markAllRead}
              </button>
            ) : null}
          </div>
          {error ? (
            <p className="adm-card__body adm-muted">{t.notifications.loadError}</p>
          ) : !items ? (
            <p className="adm-card__body adm-muted">{t.common.loading}</p>
          ) : items.length === 0 ? (
            <p className="adm-card__body adm-muted">{t.notifications.empty}</p>
          ) : (
            <ul className="adm-popover__list">
              {items.map((n) => (
                <li key={n.id} className="adm-popover__item" data-unread={!n.readAt}>
                  <Link href={n.applicationId ? `/${locale}/admin/applications/${n.applicationId}` : `/${locale}/admin/requests/${n.requestId}`} onClick={() => setOpen(false)}>
                    <span>
                      {!n.readAt ? <span className="adm-sr-live">{t.notifications.unread}: </span> : null}
                      <Rich text={kinds[n.kind] ?? kinds.new_request} values={{ ref: <bdi dir="ltr">{n.reference}</bdi> }} />
                    </span>
                    <span className="adm-small adm-muted">{new Date(n.createdAt).toLocaleString(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
      <CountPoller onCounts={setPolled} />
    </div>
  );
}

/** Refreshes the unread count every 60 s, only while the tab is visible. */
function CountPoller({ onCounts }: { onCounts: (n: number) => void }) {
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const tick = async () => {
      if (document.visibilityState !== 'visible') return;
      const r = await run(() => unreadCountAction(), 10000);
      if (r.ok) onCounts(r.data.notifications);
    };
    const start = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(tick, 60000);
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') void tick();
    };
    start();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [onCounts]);
  return null;
}

function Toasts() {
  const toasts = useToasts();
  return (
    <div className="adm-toasts" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <p key={t.id} className={`adm-toast adm-toast--${t.tone}`}>
          {t.text}
        </p>
      ))}
    </div>
  );
}

export function AdminShell({ locale, user, can, counts, testEnvironment, children }: ShellProps) {
  const t = getAdminMessages(locale);
  const pathname = usePathname() ?? '';
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      // Per-viewer preference read after mount (server render is always expanded, so no hydration mismatch).
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser storage is an external system
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      /* storage unavailable: default expanded */
    }
  }, []);

  // Close the mobile drawer when the route changes.
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Warn before a hard reload/close would discard unsaved text kept in memory.
  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      if (hasUnsavedDrafts()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBefore);
    return () => window.removeEventListener('beforeunload', onBefore);
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      } catch {
        /* ignore */
      }
      return !c;
    });
  }

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch('/api/auth/sign-out', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    } finally {
      // A full page load (not a client navigation) discards every cached private page in this tab.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional hard navigation
      window.location.assign(`/${locale}/admin/sign-in?reason=signed-out`);
    }
  }

  const base = `/${locale}/admin`;
  const nav = [
    { href: base, label: t.shell.nav.overview, icon: IconOverview, match: (p: string) => p === base },
    { href: `${base}/requests`, label: t.shell.nav.requests, icon: IconInbox, match: (p: string) => p.startsWith(`${base}/requests`) },
    { href: `${base}/queue`, label: t.shell.nav.queue, icon: IconQueue, match: (p: string) => p.startsWith(`${base}/queue`), count: counts.due },
    { href: `${base}/archive`, label: t.shell.nav.archive, icon: IconArchive, match: (p: string) => p.startsWith(`${base}/archive`) },
    ...(can.applications
      ? [
          {
            href: `${base}/applications`,
            label: t.shell.nav.applications,
            icon: IconBriefcase,
            match: (p: string) => p.startsWith(`${base}/applications`),
            count: counts.applications,
            countLabel: plural(locale, counts.applications, t.shell.applicationsNew),
          },
        ]
      : []),
  ];
  const adminNav = [
    can.team ? { href: `${base}/team`, label: t.shell.nav.team, icon: IconTeam, match: (p: string) => p.startsWith(`${base}/team`) } : null,
    can.settings ? { href: `${base}/settings`, label: t.shell.nav.settings, icon: IconSettings, match: (p: string) => p.startsWith(`${base}/settings`) } : null,
    can.audit ? { href: `${base}/audit`, label: t.shell.nav.audit, icon: IconAudit, match: (p: string) => p.startsWith(`${base}/audit`) } : null,
    { href: `${base}/account`, label: t.shell.nav.account, icon: IconUser, match: (p: string) => p.startsWith(`${base}/account`) },
  ].filter(Boolean) as NavItem[];

  type NavItem = { href: string; label: string; icon: typeof IconOverview; match: (p: string) => boolean; count?: number; countLabel?: string };
  const link = (item: NavItem, i: number) => {
    const Icon = item.icon;
    const current = item.match(pathname);
    return (
      <Link
        key={item.href}
        href={item.href}
        ref={i === 0 ? firstLink : undefined}
        className="adm-nav__link"
        aria-current={current ? 'page' : undefined}
        title={collapsed ? item.label : undefined}
      >
        <Icon size={20} />
        <span className="adm-nav__label">{item.label}</span>
        {item.count ? (
          <span className="adm-nav__count" aria-label={item.countLabel ?? plural(locale, item.count, t.shell.queueDue)}>
            {item.count}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <div className="adm-app" data-collapsed={collapsed} data-menu-open={menuOpen}>
      <a className="adm-skip" href="#adm-main">
        {t.shell.skip}
      </a>
      <aside className="adm-side" id="adm-sidebar" aria-label={t.shell.navLabel}>
        <div className="adm-side__inner">
        <Link href={base} className="adm-side__brand">
          {/* Authentic logo, never mirrored or stretched. */}
          {collapsed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/brand/zentrac-symbol-app-icon.png" alt="Zentrac" width={30} height={30} className="adm-side__logo" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/brand/zentrac-logo-horizontal-on-dark.png" alt="Zentrac" width={141} height={26} className="adm-side__logo" />
          )}
          <span className="adm-side__product">{t.shell.product}</span>
        </Link>
        <nav className="adm-nav" aria-label={t.shell.navLabel}>
          {nav.map(link)}
          <div className="adm-nav__sep" role="presentation" />
          {adminNav.map((item, i) => link(item, i + nav.length))}
        </nav>
        <div className="adm-side__foot">
          <a className="adm-side__toggle" href={`/${locale}`} target="_blank" rel="noreferrer">
            <IconExternal size={18} />
            <span className="adm-side__foot-label">{t.shell.viewSite}</span>
          </a>
          <button type="button" className="adm-side__toggle adm-side__toggle--collapse" onClick={toggleCollapsed} aria-expanded={!collapsed} aria-controls="adm-sidebar">
            <IconChevron size={18} />
            <span className="adm-side__foot-label">{collapsed ? t.shell.expand : t.shell.collapse}</span>
            {collapsed ? <span className="adm-sr-live">{t.shell.expand}</span> : null}
          </button>
        </div>
        </div>
      </aside>
      {menuOpen ? <button type="button" className="adm-scrim" aria-label={t.shell.closeMenu} onClick={() => setMenuOpen(false)} /> : null}
      <div className="adm-main">
        <header className="adm-top">
          <button
            ref={menuButton}
            type="button"
            className="adm-btn adm-btn--ghost adm-btn--icon adm-top__menu"
            aria-label={menuOpen ? t.shell.closeMenu : t.shell.openMenu}
            aria-expanded={menuOpen}
            aria-controls="adm-sidebar"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <IconMenu />
          </button>
          {testEnvironment ? (
            <span className="adm-top__env" title={t.shell.testEnvironment}>
              {t.shell.testEnvironment}
            </span>
          ) : null}
          <span className="adm-top__spacer" />
          <Suspense fallback={null}>
            <AdminLangSwitch locale={locale} />
          </Suspense>
          <Notifications locale={locale} initial={counts.notifications} />
          <div className="adm-user">
            <span className="adm-user__meta">
              <span className="adm-user__name">{user.name}</span>
              <span className="adm-user__role">{t.roles[user.role]}</span>
            </span>
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={signOut} aria-disabled={signingOut || undefined} data-testid="sign-out">
              <IconSignOut size={16} className="adm-flip" />
              <span>{signingOut ? t.shell.signingOut : t.shell.signOut}</span>
            </button>
          </div>
        </header>
        <main className="adm-content" id="adm-main" tabIndex={-1}>
          {children}
        </main>
      </div>
      <Toasts />
    </div>
  );
}
