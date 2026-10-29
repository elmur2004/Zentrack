'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { Locale } from '@/i18n/config';
import { getAdminMessages } from '@/i18n/admin';
import { fmt, plural } from '@/i18n/format';
import { APPLICATION_KINDS, APPLICATION_STATUSES, APPLICATION_VIEWS, type ApplicationKind, type ApplicationStatus, type ApplicationView } from '@/lib/admin/codes';
import { formatDateTime } from '@/lib/admin/format';
import { listApplicationsAction } from '@/server/actions/admin';
import { listMemory, rememberSearch, run } from './runtime';
import { IconAlert, IconEmpty, IconPaperclip, IconSearch, StatusGlyph } from './icons';

export interface ApplicationRow {
  id: string;
  reference: string;
  kind: ApplicationKind;
  contactName: string;
  company: string | null;
  countryCode: string | null;
  partnerType: string | null;
  discipline: string | null;
  createdAt: string | Date;
  status: ApplicationStatus;
  submissionLocale: 'en' | 'ar';
  files: number;
}

export interface ApplicationListData {
  rows: ApplicationRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface ApplicationQueryState {
  view: ApplicationView;
  kind: '' | ApplicationKind;
  status: ApplicationStatus[];
  q: string;
  page: number;
  pageSize: number;
}

interface Props {
  locale: Locale;
  initialQuery: ApplicationQueryState;
  initialData: ApplicationListData;
  labels: { partnerTypes: Record<string, string>; disciplines: Record<string, string>; countries: Record<string, string> };
  timezone: string;
}

const MEMORY_KEY = 'applications';

function toSearch(q: ApplicationQueryState): string {
  const p = new URLSearchParams();
  if (q.view !== 'active') p.set('view', q.view);
  if (q.kind) p.set('kind', q.kind);
  if (q.status.length) p.set('status', q.status.join(','));
  if (q.page !== 1) p.set('page', String(q.page));
  return p.toString();
}

export function ApplicationsList({ locale, initialQuery, initialData, labels, timezone }: Props) {
  const t = getAdminMessages(locale);
  const a = t.applications;
  const uid = useId();
  const pathname = usePathname() ?? '';
  const [query, setQuery] = useState<ApplicationQueryState>(() => ({ ...initialQuery, q: listMemory.search[MEMORY_KEY] ?? '' }));
  const [data, setData] = useState<ApplicationListData>(initialData);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const seq = useRef(0);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const first = useRef(true);

  const load = useCallback(
    async (q: ApplicationQueryState) => {
      const my = ++seq.current;
      setState('loading');
      const r = await run(() => listApplicationsAction({ ...q }));
      if (my !== seq.current) return;
      if (r.ok) {
        setData(r.data as unknown as ApplicationListData);
        setState('idle');
      } else setState('error');
    },
    [],
  );

  // Codes only in the URL; search text stays in memory for this tab.
  useEffect(() => {
    const qs = toSearch(query);
    const href = `${pathname}${qs ? `?${qs}` : ''}`;
    window.history.replaceState(null, '', href);
    listMemory.lastListHref = href;
  }, [query, pathname]);

  // A remembered search (after returning from a record) is applied once on mount.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time fetch for a search remembered in memory (external system)
      if (query.q) void load(query);
    }
  }, [load, query]);

  function update(patch: Partial<ApplicationQueryState>, opts: { debounced?: boolean } = {}) {
    const next = { ...query, ...patch, page: patch.page ?? 1 };
    setQuery(next);
    if (patch.q !== undefined) rememberSearch(MEMORY_KEY, patch.q);
    if (debounce.current) clearTimeout(debounce.current);
    if (opts.debounced) debounce.current = setTimeout(() => void load(next), 300);
    else void load(next);
  }

  const kindLabel = (k: ApplicationKind) => a.kinds[k];
  const details = (r: ApplicationRow) =>
    r.kind === 'partner'
      ? [r.partnerType ? labels.partnerTypes[r.partnerType] ?? r.partnerType : '', r.countryCode ? labels.countries[r.countryCode] ?? r.countryCode : ''].filter(Boolean).join(' · ')
      : r.discipline
        ? labels.disciplines[r.discipline] ?? r.discipline
        : '';
  const filtered = !!(query.q || query.kind || query.status.length);
  const emptyText = filtered ? a.empty.noMatch : a.empty[query.view];

  return (
    <div className="adm-stack" data-testid="applications">
      <div className="adm-card">
        <div className="adm-card__body adm-stack--sm">
          <nav className="adm-row" aria-label={a.filters.view}>
            {APPLICATION_VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                className={`adm-btn adm-btn--sm${query.view === v ? ' adm-btn--primary' : ''}`}
                aria-pressed={query.view === v}
                onClick={() => update({ view: v })}
                data-testid={`apps-view-${v}`}
              >
                {a.views[v]}
              </button>
            ))}
          </nav>
          <div className="adm-row" style={{ alignItems: 'flex-end' }}>
            <div className="adm-field adm-searchbox">
              <label htmlFor={`${uid}-q`} className="adm-label">
                {a.search}
              </label>
              <span className="adm-relative">
                <IconSearch size={16} />
                <input
                  id={`${uid}-q`}
                  className="adm-input"
                  type="search"
                  dir="auto"
                  autoComplete="off"
                  maxLength={100}
                  value={query.q}
                  placeholder={a.searchPlaceholder}
                  onChange={(e) => update({ q: e.target.value }, { debounced: true })}
                  aria-describedby={`${uid}-qn`}
                  data-testid="apps-search"
                />
              </span>
              <p id={`${uid}-qn`} className="adm-help">
                {a.searchNote}
              </p>
            </div>
            <div className="adm-field">
              <label htmlFor={`${uid}-kind`} className="adm-label">
                {a.filters.kind}
              </label>
              <select id={`${uid}-kind`} className="adm-select" value={query.kind} onChange={(e) => update({ kind: e.target.value as '' | ApplicationKind })} data-testid="apps-kind">
                <option value="">{a.filters.allKinds}</option>
                {APPLICATION_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {kindLabel(k)}
                  </option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label htmlFor={`${uid}-status`} className="adm-label">
                {a.filters.status}
              </label>
              <select
                id={`${uid}-status`}
                className="adm-select"
                value={query.status[0] ?? ''}
                onChange={(e) => update({ status: e.target.value ? [e.target.value as ApplicationStatus] : [] })}
                data-testid="apps-status"
              >
                <option value="">{a.filters.anyStatus}</option>
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {a.status[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="adm-card" aria-busy={state === 'loading' || undefined}>
        <div className="adm-card__head">
          <p className="adm-small adm-muted" role="status" aria-live="polite" data-testid="apps-count">
            {state === 'loading' ? a.loading : plural(locale, data.total, a.resultCount)}
          </p>
        </div>
        {state === 'error' ? (
          <p className="adm-alert adm-alert--error" role="alert">
            <IconAlert size={16} />
            <span>{a.error}</span>
          </p>
        ) : data.rows.length ? (
          <div className="adm-table-wrap">
            <table className="adm-table adm-table--cards" data-testid="apps-table">
              <thead>
                <tr>
                  <th scope="col">{a.columns.reference}</th>
                  <th scope="col">{a.columns.type}</th>
                  <th scope="col">{a.columns.sender}</th>
                  <th scope="col">{a.columns.details}</th>
                  <th scope="col">{a.columns.received}</th>
                  <th scope="col">{a.columns.status}</th>
                  <th scope="col">{a.columns.files}</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.id}>
                    <td className="adm-table__nowrap">
                      <Link className="adm-link adm-ltr" href={`/${locale}/admin/applications/${r.id}`}>
                        {r.reference}
                      </Link>
                    </td>
                    <td data-label={a.columns.type}>{kindLabel(r.kind)}</td>
                    <td data-label={a.columns.sender}>
                      <bdi>{r.contactName}</bdi>
                      {r.company ? (
                        <span className="adm-table__sub">
                          <bdi>{r.company}</bdi>
                        </span>
                      ) : null}
                    </td>
                    <td data-label={a.columns.details}>{details(r)}</td>
                    <td data-label={a.columns.received} className="adm-table__nowrap">
                      {formatDateTime(locale, r.createdAt, timezone)}
                    </td>
                    <td data-label={a.columns.status}>
                      <span className="adm-badge" data-status={r.status}>
                        <StatusGlyph status={r.status} />
                        <span>{a.status[r.status]}</span>
                      </span>
                    </td>
                    <td data-label={a.columns.files}>
                      {r.files ? (
                        <span className="adm-row" style={{ gap: 4 }}>
                          <IconPaperclip size={16} />
                          <span>{a.hasCv}</span>
                        </span>
                      ) : r.kind === 'career' ? (
                        <span className="adm-muted">{a.noCv}</span>
                      ) : (
                        <span className="adm-muted">{t.common.dash}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="adm-empty" data-testid="apps-empty">
            <IconEmpty size={36} />
            <p>{emptyText}</p>
          </div>
        )}
        {data.pageCount > 1 ? (
          <nav className="adm-pagination" aria-label={a.pagination}>
            <button type="button" className="adm-btn adm-btn--sm" disabled={data.page <= 1} onClick={() => update({ page: data.page - 1 })}>
              {a.previous}
            </button>
            <span className="adm-small">{fmt(a.page, { page: data.page, pages: data.pageCount })}</span>
            <button type="button" className="adm-btn adm-btn--sm" disabled={data.page >= data.pageCount} onClick={() => update({ page: data.page + 1 })}>
              {a.next}
            </button>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
