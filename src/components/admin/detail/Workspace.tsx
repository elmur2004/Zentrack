'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { Locale } from '@/i18n/config';
import { getAdminMessages } from '@/i18n/admin';
import { fmt } from '@/i18n/format';
import type { Role } from '@/lib/admin/codes';
import { formatDateTime } from '@/lib/admin/format';
import { Rich } from '@/components/ui/Rich';
import { StatusBadge } from '../StatusBadge';
import { errorText, listMemory, notify, run, type Result } from '../runtime';
import { IconAlert, IconArrowBack } from '../icons';
import { CommsTab } from './Comms';
import { AssignCard, FollowUpsCard, RecordCard, StatusCard } from './Panel';
import { ActivityTab, FilesTab, NotesTab, OverviewTab } from './Tabs';
import { TABS, type Ctx, type Detail, type Labels, type Member, type TabId } from './types';

interface Props {
  locale: Locale;
  detail: Detail;
  me: { id: string; role: Role };
  members: Member[];
  labels: Labels;
  timezone: string;
  transport: 'none' | 'outbox' | 'smtp';
  requireAssignee: boolean;
  initialTab: TabId;
  nowIso: string;
}

export function RequestWorkspace(props: Props) {
  const { locale, detail: d } = props;
  const t = getAdminMessages(locale);
  const router = useRouter();
  const uid = useId();
  const [tab, setTab] = useState<TabId>(props.initialTab);
  const [conflict, setConflict] = useState(false);
  const [backHref, setBackHref] = useState(`/${locale}/admin/requests`);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const now = useMemo(() => new Date(props.nowIso), [props.nowIso]);

  useEffect(() => {
    const remembered = listMemory.lastListHref;
    if (remembered && /^\/(en|ar)\/admin\//.test(remembered)) setBackHref(remembered.replace(/^\/(en|ar)\//, `/${locale}/`)); // eslint-disable-line react-hooks/set-state-in-effect -- read client memory after mount
  }, [locale]);

  // A new version from the server clears a stale conflict banner.
  useEffect(() => setConflict(false), [d.request.version]); // eslint-disable-line react-hooks/set-state-in-effect -- reset on fresh data

  const act = useCallback(
    async <T,>(fn: () => Promise<unknown>, okText?: string): Promise<Result<T>> => {
      const r = (await run(fn as () => Promise<Result<T>>)) as Result<T>;
      if (r.ok) {
        if (okText) notify(okText);
        router.refresh();
      } else {
        if (r.code === 'conflict') setConflict(true);
        notify(errorText(t, r.code, r.details), 'error');
      }
      return r;
    },
    [router, t],
  );

  const c: Ctx = {
    locale,
    t,
    d,
    me: props.me,
    members: props.members,
    labels: props.labels,
    timezone: props.timezone,
    transport: props.transport,
    requireAssignee: props.requireAssignee,
    now,
    act: act as Ctx['act'],
  };

  function select(next: TabId, focus = false) {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === 'overview') url.searchParams.delete('tab');
    else url.searchParams.set('tab', next);
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
    if (focus) tabRefs.current[next]?.focus();
  }

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>) {
    const i = TABS.indexOf(tab);
    const rtl = locale === 'ar';
    let next = -1;
    if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) next = (i + 1) % TABS.length;
    else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next >= 0) {
      e.preventDefault();
      select(TABS[next], true);
    }
  }

  const counts: Partial<Record<TabId, number>> = { files: d.files.length, notes: d.notes.length, communication: d.messages.length };
  const r = d.request;

  return (
    <div className="adm-stack">
      <div>
        <Link href={backHref} className="adm-back">
          <IconArrowBack size={16} className="adm-flip" />
          {t.detail.back}
        </Link>
        <div className="adm-detail__head">
          <h1 className="adm-h1" data-testid="request-title">
            {/* Reference stays left-to-right inside Arabic text. */}
            <Rich text={t.detail.title} values={{ ref: <bdi dir="ltr">{r.reference}</bdi> }} />
          </h1>
          <StatusBadge status={r.status} locale={locale} />
          {r.disposition !== 'active' ? (
            <span className="adm-badge" data-tone="muted">
              {t.disposition[r.disposition]}
            </span>
          ) : null}
        </div>
        <p className="adm-muted adm-small">
          {fmt(t.detail.received, { date: formatDateTime(locale, r.createdAt, props.timezone, { withZone: true }) })} · {fmt(t.detail.submissionLanguage, { lang: t.languages[r.submissionLocale] })}
        </p>
      </div>

      {r.disposition !== 'active' ? (
        <p className="adm-alert adm-alert--warn">
          <IconAlert size={16} />
          <span>{r.disposition === 'spam' ? t.detail.spamBanner : t.detail.archivedBanner}</span>
        </p>
      ) : null}
      {conflict ? (
        <div className="adm-alert adm-alert--error" role="alert" data-testid="conflict">
          <IconAlert size={16} />
          <div className="adm-alert__body">
            <span>{t.detail.conflict}</span>
            <span>
              <button type="button" className="adm-btn adm-btn--sm" onClick={() => router.refresh()}>
                {t.common.refresh}
              </button>
            </span>
          </div>
        </div>
      ) : null}

      <div className="adm-detail">
        <div className="adm-card">
          <div className="adm-tabs" role="tablist" aria-label={t.detail.tabsLabel}>
            {TABS.map((id) => (
              <button
                key={id}
                ref={(el) => {
                  tabRefs.current[id] = el;
                }}
                type="button"
                role="tab"
                id={`${uid}-tab-${id}`}
                aria-selected={tab === id}
                aria-controls={`${uid}-panel-${id}`}
                tabIndex={tab === id ? 0 : -1}
                className="adm-tab"
                onClick={() => select(id)}
                onKeyDown={onTabKey}
                data-testid={`tab-${id}`}
              >
                {t.detail.tabs[id]}
                {counts[id] ? <span className="adm-tab__count">{counts[id]}</span> : null}
              </button>
            ))}
          </div>
          {TABS.map((id) => (
            <div key={id} role="tabpanel" id={`${uid}-panel-${id}`} aria-labelledby={`${uid}-tab-${id}`} hidden={tab !== id} tabIndex={0} className="adm-tabpanel adm-card__body">
              {tab === id ? (
                id === 'overview' ? (
                  <OverviewTab c={c} />
                ) : id === 'files' ? (
                  <FilesTab c={c} />
                ) : id === 'notes' ? (
                  <NotesTab c={c} />
                ) : id === 'communication' ? (
                  <CommsTab c={c} />
                ) : (
                  <ActivityTab c={c} />
                )
              ) : null}
            </div>
          ))}
        </div>
        <aside className="adm-detail__panel" aria-label={t.detail.panel.status}>
          <StatusCard c={c} />
          <AssignCard c={c} />
          <FollowUpsCard c={c} />
          <RecordCard c={c} />
        </aside>
      </div>
    </div>
  );
}
