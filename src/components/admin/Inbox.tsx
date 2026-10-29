'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Locale } from '@/i18n/config';
import { getAdminMessages } from '@/i18n/admin';
import { fmt, plural } from '@/i18n/format';
import { EXPORT_OPTIONAL_FIELDS, FOLLOW_UP_FILTERS, PAGE_SIZES, STATUSES, type ListView, type RequestStatus, type Role } from '@/lib/admin/codes';
import { formatDateParts, formatDateTime } from '@/lib/admin/format';
import { hasActiveFilters, queryToSearchParams, type ListQuery } from '@/lib/admin/query';
import { dueState } from '@/server/admin/time';
import { bulkAssignAction, setDispositionAction } from '@/server/actions/admin';
import { Dialog } from './Dialog';
import { errorText, listMemory, notify, run } from './runtime';
import { StatusBadge } from './StatusBadge';
import { IconAlert, IconChevron, IconEmpty, IconFilter, IconPaperclip, IconSearch } from './icons';

export interface InboxRow {
  id: string;
  reference: string;
  company: string;
  contactName: string;
  countryCode: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  status: RequestStatus;
  disposition: string;
  submissionLocale: 'en' | 'ar';
  assigneeId: string | null;
  assigneeName: string | null;
  services: string[];
  attachments: number;
  nextFollowUp: string | Date | null;
  unread: boolean;
}

export interface InboxData {
  rows: InboxRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

interface Props {
  locale: Locale;
  view: ListView;
  initialQuery: ListQuery;
  initialData: InboxData;
  members: Array<{ id: string; name: string; role: Role }>;
  can: { assign: boolean; archive: boolean; spam: boolean; export: boolean };
  labels: { services: Record<string, string>; countries: Record<string, string> };
  timezone: string;
  nowIso: string;
}

type LoadState = 'idle' | 'loading' | 'error' | 'offline' | 'timeout' | 'unauthenticated';
type Bulk = null | { kind: 'archive' | 'spam' | 'restore' } | { kind: 'assign'; assigneeId: string | null; name: string };

export function Inbox({ locale, view, initialQuery, initialData, members, can, labels, timezone, nowIso }: Props) {
  const t = getAdminMessages(locale);
  const pathname = usePathname() ?? '';
  const uid = useId();
  const [query, setQuery] = useState<ListQuery>(() => ({ ...initialQuery, q: listMemory.search[view] ?? '' }));
  const [data, setData] = useState<InboxData>(initialData);
  const [state, setState] = useState<LoadState>('idle');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allMatching, setAllMatching] = useState<string[] | null>(null);
  const [bulk, setBulk] = useState<Bulk>(null);
  const [bulkAssignee, setBulkAssignee] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [newArrivals, setNewArrivals] = useState(false);
  const seq = useRef(0);
  const ctrl = useRef<AbortController | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const resultsRef = useRef<HTMLDivElement>(null);
  const now = useMemo(() => new Date(nowIso), [nowIso]);

  const canBulk = can.assign || can.archive || can.spam || can.export;
  const isArchiveView = view === 'archived' || view === 'spam';

  const syncUrl = useCallback(
    (q: ListQuery) => {
      const params = queryToSearchParams(q);
      if (view === 'spam') params.set('view', 'spam');
      const qs = params.toString();
      const href = `${pathname}${qs ? `?${qs}` : ''}`;
      window.history.replaceState(null, '', href);
      listMemory.lastListHref = href;
    },
    [pathname, view],
  );

  const load = useCallback(
    async (q: ListQuery, opts: { announce?: boolean } = {}) => {
      ctrl.current?.abort();
      const c = new AbortController();
      ctrl.current = c;
      const my = ++seq.current;
      setState('loading');
      const timer = setTimeout(() => c.abort('timeout'), 20000);
      try {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('offline');
        const res = await fetch('/api/admin/requests', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ view, query: q }),
          signal: c.signal,
        });
        if (my !== seq.current) return;
        if (res.status === 401) return setState('unauthenticated');
        if (!res.ok) return setState('error');
        const next = (await res.json()) as InboxData;
        if (my !== seq.current) return;
        setData(next);
        setState('idle');
        setNewArrivals(false);
        if (next.page !== q.page) {
          const fixed = { ...q, page: next.page };
          setQuery(fixed);
          syncUrl(fixed);
        }
        if (opts.announce !== false) setAnnouncement(plural(locale, next.total, t.inbox.announce));
      } catch {
        if (my !== seq.current) return;
        setState(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : c.signal.reason === 'timeout' ? 'timeout' : 'error');
      } finally {
        clearTimeout(timer);
      }
    },
    [view, locale, t, syncUrl],
  );

  // A remembered search for this view (memory only) means the server-rendered page is stale.
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    listMemory.lastListHref = `${window.location.pathname}${window.location.search}`;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time fetch for a search remembered in memory (external system)
    if (query.q) void load(query, { announce: false });
  }, [load, query]);

  function update(patch: Partial<ListQuery>, opts: { keepPage?: boolean } = {}) {
    const next: ListQuery = { ...query, ...patch, page: opts.keepPage ? (patch.page ?? query.page) : 1 };
    setQuery(next);
    setSelected(new Set());
    setAllMatching(null);
    syncUrl(next);
    if ('q' in patch) {
      listMemory.search[view] = next.q;
      clearTimeout(debounce.current);
      debounce.current = setTimeout(() => void load(next), 300);
    } else {
      void load(next);
    }
  }

  function clearFilters() {
    update({ q: '', status: [], service: [], country: [], assignee: '', lang: '', from: '', to: '', followUp: '' });
  }

  // Polite check for newly arrived requests (visible tab only); never replaces the current list.
  useEffect(() => {
    if (view !== 'inbox') return;
    const timer = setInterval(async () => {
      if (document.visibilityState !== 'visible' || state !== 'idle') return;
      try {
        const res = await fetch('/api/admin/requests', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ view, query: { ...query, page: 1, pageSize: 10 } }),
        });
        if (!res.ok) return;
        const peek = (await res.json()) as InboxData;
        if (peek.total > data.total) setNewArrivals(true);
      } catch {
        /* offline: ignore */
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [view, query, data.total, state]);

  const pageIds = data.rows.map((r) => r.id);
  const pageAllSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const pageSomeSelected = pageIds.some((id) => selected.has(id));
  const selectedIds = allMatching ?? [...selected];
  const selectedCount = selectedIds.length;

  const headerCheck = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerCheck.current) headerCheck.current.indeterminate = pageSomeSelected && !pageAllSelected;
  }, [pageSomeSelected, pageAllSelected]);

  function toggle(id: string) {
    setAllMatching(null);
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function togglePage() {
    setAllMatching(null);
    setSelected((s) => {
      const n = new Set(s);
      if (pageAllSelected) pageIds.forEach((id) => n.delete(id));
      else pageIds.forEach((id) => n.add(id));
      return n;
    });
  }

  async function selectAllMatching() {
    const res = await fetch('/api/admin/requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ view, query, idsOnly: true }),
    }).catch(() => null);
    if (!res?.ok) return notify(t.inbox.error, 'error');
    const body = (await res.json()) as { ids: string[]; truncated: boolean };
    setAllMatching(body.ids);
  }

  async function applyBulk() {
    if (!bulk) return;
    setBusy(true);
    const r =
      bulk.kind === 'assign'
        ? await run(() => bulkAssignAction(selectedIds, bulk.assigneeId))
        : await run(() => setDispositionAction(selectedIds, bulk.kind === 'archive' ? 'archived' : bulk.kind === 'spam' ? 'spam' : 'active', bulkReason));
    setBusy(false);
    if (!r.ok) {
      notify(errorText(t, r.code, r.details), 'error');
      return;
    }
    setBulk(null);
    setBulkReason('');
    setSelected(new Set());
    setAllMatching(null);
    notify(fmt(t.inbox.confirm.result, { updated: r.data.updated, skipped: r.data.skipped }));
    await load(query);
  }

  const activeFilterCount = [query.status.length, query.service.length, query.country.length, query.assignee, query.lang, query.from, query.to, query.followUp].filter(Boolean).length;
  const sortValue = `${query.sort}.${query.dir}`;
  const busyRows = state === 'loading';
  const emptyText = hasActiveFilters(query) ? t.inbox.empty.noMatch : t.inbox.empty[view];
  const cols = t.inbox.columns;

  return (
    <div className="adm-stack">
      <div className="adm-card">
        <div className="adm-card__body adm-stack--sm">
          <div className="adm-toolbar">
            <div className="adm-field adm-searchbox">
              <label htmlFor={`${uid}-q`} className="adm-label">
                {t.inbox.search}
              </label>
              <span className="adm-relative">
                <IconSearch size={16} />
                <input
                  id={`${uid}-q`}
                  className="adm-input"
                  type="search"
                  dir="auto"
                  autoComplete="off"
                  placeholder={t.inbox.searchPlaceholder}
                  value={query.q}
                  maxLength={100}
                  onChange={(e) => update({ q: e.target.value })}
                  aria-describedby={`${uid}-qnote`}
                  data-testid="inbox-search"
                />
              </span>
            </div>
            <div className="adm-field">
              <label htmlFor={`${uid}-sort`} className="adm-label">
                {t.inbox.sort}
              </label>
              <select
                id={`${uid}-sort`}
                className="adm-select"
                value={sortValue}
                onChange={(e) => {
                  const [sort, dir] = e.target.value.split('.') as [ListQuery['sort'], ListQuery['dir']];
                  update({ sort, dir });
                }}
              >
                {Object.entries(t.inbox.sortOptions).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="adm-btn" aria-expanded={filtersOpen} aria-controls={`${uid}-filters`} onClick={() => setFiltersOpen((o) => !o)} data-testid="filters-toggle">
              <IconFilter size={16} />
              <span>{plural(locale, activeFilterCount, t.inbox.filtersCount)}</span>
            </button>
            {hasActiveFilters(query) ? (
              <button type="button" className="adm-btn adm-btn--ghost" onClick={clearFilters}>
                {t.inbox.clearFilters}
              </button>
            ) : null}
          </div>
          <p id={`${uid}-qnote`} className="adm-help">
            {t.inbox.searchNote}
          </p>
          <div id={`${uid}-filters`} hidden={!filtersOpen} className="adm-filters">
            <div className="adm-filters__grid">
              <fieldset className="adm-fieldset">
                <legend>{t.inbox.status}</legend>
                {STATUSES.map((s) => (
                  <label key={s} className="adm-check">
                    <input
                      type="checkbox"
                      checked={query.status.includes(s)}
                      onChange={(e) => update({ status: e.target.checked ? [...query.status, s] : query.status.filter((x) => x !== s) })}
                    />
                    <span>{t.status[s]}</span>
                  </label>
                ))}
              </fieldset>
              <fieldset className="adm-fieldset">
                <legend>{t.inbox.service}</legend>
                {Object.entries(labels.services).map(([id, label]) => (
                  <label key={id} className="adm-check">
                    <input
                      type="checkbox"
                      checked={query.service.includes(id)}
                      onChange={(e) => update({ service: e.target.checked ? [...query.service, id] : query.service.filter((x) => x !== id) })}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>
              <div className="adm-stack--sm">
                <div className="adm-field">
                  <label htmlFor={`${uid}-country`} className="adm-label">
                    {t.inbox.country}
                  </label>
                  <select id={`${uid}-country`} className="adm-select" value={query.country[0] ?? ''} onChange={(e) => update({ country: e.target.value ? [e.target.value] : [] })}>
                    <option value="">{t.common.any}</option>
                    {Object.entries(labels.countries).map(([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                {members.length ? (
                  <div className="adm-field">
                    <label htmlFor={`${uid}-assignee`} className="adm-label">
                      {t.inbox.assignee}
                    </label>
                    <select id={`${uid}-assignee`} className="adm-select" value={query.assignee} onChange={(e) => update({ assignee: e.target.value })}>
                      <option value="">{t.common.any}</option>
                      <option value="unassigned">{t.common.unassigned}</option>
                      <option value="me">{t.common.me}</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="adm-field">
                  <label htmlFor={`${uid}-lang`} className="adm-label">
                    {t.inbox.language}
                  </label>
                  <select id={`${uid}-lang`} className="adm-select" value={query.lang} onChange={(e) => update({ lang: e.target.value as ListQuery['lang'] })}>
                    <option value="">{t.common.any}</option>
                    <option value="en">{t.languages.en}</option>
                    <option value="ar">{t.languages.ar}</option>
                  </select>
                </div>
              </div>
              <div className="adm-stack--sm">
                <div className="adm-field">
                  <label htmlFor={`${uid}-from`} className="adm-label">
                    {t.inbox.from}
                  </label>
                  <input id={`${uid}-from`} className="adm-input" type="date" value={query.from} onChange={(e) => update({ from: e.target.value })} />
                </div>
                <div className="adm-field">
                  <label htmlFor={`${uid}-to`} className="adm-label">
                    {t.inbox.to}
                  </label>
                  <input id={`${uid}-to`} className="adm-input" type="date" value={query.to} onChange={(e) => update({ to: e.target.value })} />
                </div>
                <div className="adm-field">
                  <label htmlFor={`${uid}-fu`} className="adm-label">
                    {t.inbox.followUp}
                  </label>
                  <select id={`${uid}-fu`} className="adm-select" value={query.followUp} onChange={(e) => update({ followUp: e.target.value as ListQuery['followUp'] })}>
                    <option value="">{t.common.any}</option>
                    {FOLLOW_UP_FILTERS.map((f) => (
                      <option key={f} value={f}>
                        {t.inbox.followUpOptions[f]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <p className="adm-help">{fmt(t.overview.periodHelp, { tz: timezone })}</p>
          </div>
        </div>
      </div>

      {newArrivals ? (
        <div className="adm-alert adm-alert--info" role="status">
          <span className="adm-alert__body">{t.inbox.newRequestsArrived}</span>
          <button type="button" className="adm-btn adm-btn--sm" onClick={() => void load(query)}>
            {t.inbox.showNew}
          </button>
        </div>
      ) : null}

      {selectedCount > 0 ? (
        <div className="adm-selection-bar" role="region" aria-label={t.inbox.bulk.label} data-testid="selection-bar">
          <strong>{plural(locale, selectedCount, t.inbox.selected)}</strong>
          {allMatching ? (
            <span className="adm-small">{fmt(t.inbox.allMatchingSelected, { count: allMatching.length })}</span>
          ) : pageAllSelected && data.total > pageIds.length ? (
            <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost" onClick={selectAllMatching}>
              {fmt(t.inbox.selectAllMatching, { count: data.total })}
            </button>
          ) : null}
          <span className="adm-top__spacer" />
          {can.assign && !isArchiveView ? (
            <span className="adm-row">
              <label htmlFor={`${uid}-bulk-assignee`} className="adm-sr-live">
                {t.inbox.bulk.assign}
              </label>
              <select id={`${uid}-bulk-assignee`} className="adm-select" value={bulkAssignee} onChange={(e) => setBulkAssignee(e.target.value)} style={{ inlineSize: 'auto' }}>
                <option value="">{t.inbox.bulk.assign}</option>
                <option value="__none">{t.common.unassigned}</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="adm-btn adm-btn--sm"
                aria-disabled={!bulkAssignee || undefined}
                onClick={() => {
                  if (!bulkAssignee) return;
                  const m = members.find((x) => x.id === bulkAssignee);
                  setBulk({ kind: 'assign', assigneeId: bulkAssignee === '__none' ? null : bulkAssignee, name: m?.name ?? t.common.unassigned });
                }}
              >
                {t.common.apply}
              </button>
            </span>
          ) : null}
          {can.archive && !isArchiveView ? (
            <button type="button" className="adm-btn adm-btn--sm" onClick={() => setBulk({ kind: 'archive' })}>
              {t.inbox.bulk.archive}
            </button>
          ) : null}
          {can.spam && !isArchiveView ? (
            <button type="button" className="adm-btn adm-btn--sm" onClick={() => setBulk({ kind: 'spam' })}>
              {t.inbox.bulk.spam}
            </button>
          ) : null}
          {isArchiveView && (view === 'spam' ? can.spam : can.archive) ? (
            <button type="button" className="adm-btn adm-btn--sm" onClick={() => setBulk({ kind: 'restore' })}>
              {t.inbox.bulk.restore}
            </button>
          ) : null}
          {can.export ? (
            <button type="button" className="adm-btn adm-btn--sm" onClick={() => setExportOpen(true)}>
              {t.inbox.bulk.export}
            </button>
          ) : null}
          <button
            type="button"
            className="adm-btn adm-btn--sm adm-btn--ghost"
            onClick={() => {
              setSelected(new Set());
              setAllMatching(null);
            }}
          >
            {t.inbox.clearSelection}
          </button>
        </div>
      ) : can.export && data.total > 0 ? (
        <div className="adm-row adm-row--end">
          <button type="button" className="adm-btn adm-btn--sm" onClick={() => setExportOpen(true)} data-testid="export-open">
            {t.inbox.bulk.export}
          </button>
        </div>
      ) : null}

      <div className="adm-card" ref={resultsRef}>
        <div className="adm-card__head">
          <h2 className="adm-h2" id={`${uid}-results`}>
            {plural(locale, data.total, t.inbox.resultCount)}
          </h2>
          <span className="adm-row adm-small adm-muted" aria-hidden={state !== 'loading'}>
            {state === 'loading' ? (
              <>
                <span className="adm-spinner" />
                {t.inbox.loadingRows}
              </>
            ) : null}
          </span>
        </div>

        {state === 'error' || state === 'offline' || state === 'timeout' || state === 'unauthenticated' ? (
          <div className="adm-card__body">
            <div className="adm-alert adm-alert--error" role="alert">
              <IconAlert />
              <div className="adm-alert__body">
                <span>
                  {state === 'offline'
                    ? t.inbox.offline
                    : state === 'timeout'
                      ? t.inbox.timeout
                      : state === 'unauthenticated'
                        ? t.errors.unauthenticated
                        : t.inbox.error}
                </span>
                <span className="adm-row">
                  {state === 'unauthenticated' ? (
                    <a className="adm-btn adm-btn--sm" href={`/${locale}/admin/sign-in`} target="_blank" rel="noreferrer">
                      {t.auth.submit}
                    </a>
                  ) : null}
                  <button type="button" className="adm-btn adm-btn--sm" onClick={() => void load(query)}>
                    {t.common.retry}
                  </button>
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {data.rows.length === 0 && state !== 'loading' ? (
          <div className="adm-empty" data-testid="inbox-empty">
            <IconEmpty size={40} />
            <p>{emptyText}</p>
            {hasActiveFilters(query) ? (
              <button type="button" className="adm-btn adm-btn--sm" onClick={clearFilters}>
                {t.inbox.clearFilters}
              </button>
            ) : null}
          </div>
        ) : (
          <div className={`adm-table-wrap${busyRows ? ' adm-busy' : ''}`} aria-busy={busyRows}>
            <table className="adm-table adm-table--cards" aria-labelledby={`${uid}-results`} data-testid="inbox-table">
              <thead>
                <tr>
                  {canBulk ? (
                    <th scope="col" className="adm-table__check">
                      <input ref={headerCheck} type="checkbox" checked={pageAllSelected} onChange={togglePage} aria-label={t.inbox.selectPage} />
                    </th>
                  ) : null}
                  <th scope="col">{cols.reference}</th>
                  <th scope="col">{cols.company}</th>
                  <th scope="col" data-col="services">
                    {cols.services}
                  </th>
                  <th scope="col" data-col="country">
                    {cols.country}
                  </th>
                  <th scope="col">{cols.received}</th>
                  <th scope="col">{cols.status}</th>
                  <th scope="col">{cols.assignee}</th>
                  <th scope="col" data-col="followup">
                    {cols.followUp}
                  </th>
                  <th scope="col" data-col="files">
                    <span className="adm-sr-live">{cols.files}</span>
                    <IconPaperclip size={16} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => {
                  const due = r.nextFollowUp ? dueState(new Date(r.nextFollowUp), now, timezone) : null;
                  const isSel = allMatching ? allMatching.includes(r.id) : selected.has(r.id);
                  return (
                    <tr key={r.id} data-selected={isSel} data-unread={r.unread}>
                      {canBulk ? (
                        <td className="adm-table__check">
                          <input type="checkbox" checked={isSel} onChange={() => toggle(r.id)} aria-label={fmt(t.inbox.selectRow, { ref: r.reference })} />
                        </td>
                      ) : null}
                      <td className="adm-table__ref">
                        <span className="adm-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                          {r.unread ? (
                            <>
                              <span className="adm-dot" aria-hidden="true" />
                              <span className="adm-sr-live">{t.inbox.unread}</span>
                            </>
                          ) : null}
                          <Link href={`/${locale}/admin/requests/${r.id}`} className="adm-ltr" data-testid="request-link">
                            {r.reference}
                          </Link>
                        </span>
                        <span className="adm-table__sub">
                          {t.languages[r.submissionLocale]}
                          {r.attachments > 0 ? (
                            <span className="adm-cell-alt adm-cell-alt--files">
                              {' · '}
                              <IconPaperclip size={13} />
                              {plural(locale, r.attachments, t.inbox.filesCount)}
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td data-label={cols.company}>
                        <bdi>{r.company}</bdi>
                        <span className="adm-table__sub">
                          <bdi>{r.contactName}</bdi>
                          <span className="adm-cell-alt adm-cell-alt--country"> · {labels.countries[r.countryCode] ?? r.countryCode}</span>
                        </span>
                        <span className="adm-table__sub adm-cell-alt adm-cell-alt--services">{r.services.map((x) => labels.services[x] ?? x).join(locale === 'ar' ? '، ' : ', ')}</span>
                      </td>
                      <td data-label={cols.services} data-col="services">
                        <span className="adm-table__services">
                          {r.services.map((s) => (
                            <span key={s} className="adm-chip">
                              {labels.services[s] ?? s}
                            </span>
                          ))}
                        </span>
                      </td>
                      <td data-label={cols.country} data-col="country">
                        {labels.countries[r.countryCode] ?? r.countryCode}
                      </td>
                      <td data-label={cols.received}>
                        <DateCell locale={locale} value={r.createdAt} timezone={timezone} />
                      </td>
                      <td data-label={cols.status}>
                        <StatusBadge status={r.status} locale={locale} />
                        {r.nextFollowUp ? (
                          <span className="adm-cell-alt adm-cell-alt--followup adm-small">
                            <span className="adm-muted">{formatDateTime(locale, r.nextFollowUp, timezone)}</span>
                            {due && due !== 'upcoming' ? (
                              <span className="adm-badge" data-tone={due === 'overdue' ? 'danger' : 'warn'}>
                                {t.inbox.due[due]}
                              </span>
                            ) : null}
                          </span>
                        ) : null}
                      </td>
                      <td data-label={cols.assignee}>{r.assigneeName ?? <span className="adm-muted">{t.common.unassigned}</span>}</td>
                      <td data-label={cols.followUp} data-col="followup" data-hide-narrow={!r.nextFollowUp}>
                        {r.nextFollowUp ? (
                          <span className="adm-stack--sm" style={{ gap: 2 }}>
                            <DateCell locale={locale} value={r.nextFollowUp} timezone={timezone} />
                            {due && due !== 'upcoming' ? (
                              <span className="adm-badge" data-tone={due === 'overdue' ? 'danger' : 'warn'}>
                                {t.inbox.due[due]}
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <span className="adm-muted">{t.common.dash}</span>
                        )}
                      </td>
                      <td data-label={cols.files} data-col="files" data-hide-narrow={r.attachments === 0}>
                        {r.attachments > 0 ? (
                          <span className="adm-row" style={{ gap: 4 }} title={plural(locale, r.attachments, t.inbox.filesCount)}>
                            <IconPaperclip size={15} />
                            <span className="adm-sr-live">{plural(locale, r.attachments, t.inbox.filesCount)}</span>
                            <span aria-hidden="true">{r.attachments}</span>
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <nav className="adm-pagination" aria-label={t.inbox.pagination}>
          <span className="adm-muted adm-small">{fmt(t.inbox.page, { page: data.page, pages: data.pageCount })}</span>
          <span className="adm-pagination__nav">
            <label htmlFor={`${uid}-size`} className="adm-small adm-muted">
              {t.inbox.pageSize}
            </label>
            <select id={`${uid}-size`} className="adm-select" style={{ inlineSize: 'auto' }} value={query.pageSize} onChange={(e) => update({ pageSize: Number(e.target.value) })}>
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="adm-btn adm-btn--sm"
              aria-disabled={data.page <= 1 || undefined}
              onClick={() => data.page > 1 && update({ page: data.page - 1 }, { keepPage: true })}
              data-testid="page-prev"
            >
              <IconChevron size={16} className="adm-flip" />
              <span>{t.inbox.previous}</span>
            </button>
            <button
              type="button"
              className="adm-btn adm-btn--sm"
              aria-disabled={data.page >= data.pageCount || undefined}
              onClick={() => data.page < data.pageCount && update({ page: data.page + 1 }, { keepPage: true })}
              data-testid="page-next"
            >
              <span>{t.inbox.next}</span>
              <IconChevron size={16} className="adm-flip-next" />
            </button>
          </span>
        </nav>
      </div>

      <p className="adm-sr-live" role="status" aria-live="polite">
        {announcement}
      </p>

      <Dialog
        open={!!bulk}
        onClose={() => setBulk(null)}
        closeLabel={t.common.close}
        title={
          bulk?.kind === 'archive'
            ? plural(locale, selectedCount, t.inbox.confirm.archiveTitle)
            : bulk?.kind === 'spam'
              ? plural(locale, selectedCount, t.inbox.confirm.spamTitle)
              : bulk?.kind === 'restore'
                ? plural(locale, selectedCount, t.inbox.confirm.restoreTitle)
                : plural(locale, selectedCount, t.inbox.confirm.assignTitle)
        }
        footer={
          <>
            <button type="button" className="adm-btn" onClick={() => setBulk(null)}>
              {t.common.cancel}
            </button>
            <button type="button" className="adm-btn adm-btn--primary" onClick={applyBulk} aria-disabled={busy || undefined} data-testid="bulk-confirm">
              {busy ? <span className="adm-spinner" /> : null}
              {t.common.confirm}
            </button>
          </>
        }
      >
        <p>
          {bulk?.kind === 'archive'
            ? t.inbox.confirm.archiveText
            : bulk?.kind === 'spam'
              ? t.inbox.confirm.spamText
              : bulk?.kind === 'restore'
                ? t.inbox.confirm.restoreText
                : bulk?.kind === 'assign'
                  ? fmt(t.inbox.confirm.assignText, { name: bulk.name })
                  : ''}
        </p>
        {bulk && bulk.kind !== 'assign' && bulk.kind !== 'restore' ? (
          <div className="adm-field">
            <label htmlFor={`${uid}-reason`} className="adm-label">
              {t.inbox.confirm.reason}
            </label>
            <input id={`${uid}-reason`} className="adm-input" dir="auto" maxLength={500} value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} />
          </div>
        ) : null}
      </Dialog>

      {can.export ? (
        <ExportDialog
          locale={locale}
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          view={view}
          query={query}
          selectedIds={selectedIds}
        />
      ) : null}
    </div>
  );
}

/** Date on the first line, time below: keeps date columns narrow in both languages. */
function DateCell({ locale, value, timezone }: { locale: Locale; value: Date | string; timezone: string }) {
  const p = formatDateParts(locale, value, timezone);
  return (
    <span className="adm-table__nowrap">
      {p.date}
      <span className="adm-table__sub">{p.time}</span>
    </span>
  );
}

function ExportDialog({ locale, open, onClose, view, query, selectedIds }: { locale: Locale; open: boolean; onClose: () => void; view: ListView; query: ListQuery; selectedIds: string[] }) {
  const t = getAdminMessages(locale);
  const uid = useId();
  const [scope, setScope] = useState<'selected' | 'filtered'>(selectedIds.length ? 'selected' : 'filtered');
  const [include, setInclude] = useState<string[]>([]);
  const [language, setLanguage] = useState<'en' | 'ar'>(locale);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setScope(selectedIds.length ? 'selected' : 'filtered'); // eslint-disable-line react-hooks/set-state-in-effect -- reset scope when reopened
  }, [open, selectedIds.length]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setCount(null); // eslint-disable-line react-hooks/set-state-in-effect -- reflect a pending recount
    setError('');
    fetch('/api/admin/export', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ preview: true, scope, ids: selectedIds, view, query, include, language }),
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!alive) return;
        if (res.ok) setCount(body.count);
        else setError(body?.details?.code === 'too_many' ? t.export.tooMany : errorText(t, body.code ?? 'unavailable', body.details));
      })
      .catch(() => alive && setError(t.errors.unavailable));
    return () => {
      alive = false;
    };
  }, [open, scope, selectedIds, view, query, include, language, t]);

  async function download() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/export', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scope, ids: selectedIds, view, query, include, language }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.details?.code === 'too_many' ? t.export.tooMany : errorText(t, body.code ?? 'unavailable', body.details));
        return;
      }
      const blob = await res.blob();
      const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? 'export.csv';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      onClose();
    } catch {
      setError(t.errors.unavailable);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t.export.title}
      closeLabel={t.common.close}
      testId="export-dialog"
      footer={
        <>
          <button type="button" className="adm-btn" onClick={onClose}>
            {t.common.cancel}
          </button>
          <button type="button" className="adm-btn adm-btn--primary" onClick={download} aria-disabled={busy || !count || undefined} data-testid="export-download">
            {busy ? <span className="adm-spinner" /> : null}
            {t.export.download}
          </button>
        </>
      }
    >
      <p className="adm-muted">{t.export.lead}</p>
      <fieldset className="adm-fieldset">
        <legend>{t.export.title}</legend>
        {selectedIds.length ? (
          <label className="adm-check">
            <input type="radio" name={`${uid}-scope`} checked={scope === 'selected'} onChange={() => setScope('selected')} />
            <span>{plural(locale, selectedIds.length, t.export.scopeSelected)}</span>
          </label>
        ) : null}
        <label className="adm-check">
          <input type="radio" name={`${uid}-scope`} checked={scope === 'filtered'} onChange={() => setScope('filtered')} />
          <span>{t.export.scopeFiltered}</span>
        </label>
      </fieldset>
      <p className="adm-help">{t.export.included}</p>
      <fieldset className="adm-fieldset">
        <legend>{t.export.optional}</legend>
        {EXPORT_OPTIONAL_FIELDS.map((f) => (
          <label key={f} className="adm-check">
            <input type="checkbox" checked={include.includes(f)} onChange={(e) => setInclude((list) => (e.target.checked ? [...list, f] : list.filter((x) => x !== f)))} />
            <span>{t.export.fields[f]}</span>
          </label>
        ))}
        <p className="adm-help">{t.export.sensitiveNote}</p>
      </fieldset>
      <div className="adm-field">
        <label htmlFor={`${uid}-lang`} className="adm-label">
          {t.export.language}
        </label>
        <select id={`${uid}-lang`} className="adm-select" value={language} onChange={(e) => setLanguage(e.target.value === 'ar' ? 'ar' : 'en')}>
          <option value="en">{t.languages.en}</option>
          <option value="ar">{t.languages.ar}</option>
        </select>
      </div>
      <p role="status" aria-live="polite" className="adm-h3" data-testid="export-count">
        {error ? '' : count === null ? t.export.counting : plural(locale, count, t.export.count)}
      </p>
      {error ? (
        <p className="adm-error-text" role="alert">
          <IconAlert size={16} />
          {error}
        </p>
      ) : null}
    </Dialog>
  );
}
