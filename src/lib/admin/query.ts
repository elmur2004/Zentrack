/**
 * Inbox query model shared by the server and the browser.
 * Only stable, non-sensitive codes are carried in the URL. Free-text search (which may contain
 * names or email addresses) is never serialized into the URL.
 */
import { countryCodes } from '@/content/public/countries';
import { serviceChoice } from '@/lib/forms/schema';
import {
  FOLLOW_UP_FILTERS,
  LIST_SORTS,
  PAGE_SIZES,
  STATUSES,
  type FollowUpFilter,
  type ListSort,
  type ListView,
  type RequestStatus,
} from './codes';

export interface ListQuery {
  view: ListView;
  /** Free-text search. In memory / request body only — never in the URL. */
  q: string;
  status: RequestStatus[];
  service: string[];
  country: string[];
  /** user id, 'unassigned' or 'me' */
  assignee: string;
  lang: '' | 'en' | 'ar';
  /** YYYY-MM-DD (configured timezone), inclusive */
  from: string;
  to: string;
  followUp: '' | FollowUpFilter;
  sort: ListSort;
  dir: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validDay(s: string): boolean {
  if (!DAY.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function defaultQuery(view: ListView): ListQuery {
  return {
    view,
    q: '',
    status: [],
    service: [],
    country: [],
    assignee: '',
    lang: '',
    from: '',
    to: '',
    followUp: '',
    sort: view === 'queue' ? 'follow_up' : 'received',
    dir: view === 'queue' ? 'asc' : 'desc',
    page: 1,
    pageSize: 25,
  };
}

type Input = Partial<Record<keyof ListQuery, unknown>>;

const list = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : typeof v === 'string' && v ? v.split(',') : []);

/** Drops anything that is not a known code; never throws. */
export function normalizeQuery(view: ListView, input: Input): ListQuery {
  const base = defaultQuery(view);
  const status = list(input.status).filter((s): s is RequestStatus => (STATUSES as readonly string[]).includes(s));
  const service = list(input.service).filter((s) => (serviceChoice as readonly string[]).includes(s));
  const country = list(input.country).filter((c) => (countryCodes as readonly string[]).includes(c));
  const assignee = typeof input.assignee === 'string' && (input.assignee === 'unassigned' || input.assignee === 'me' || ID.test(input.assignee)) ? input.assignee : '';
  const lang = input.lang === 'en' || input.lang === 'ar' ? input.lang : '';
  let from = typeof input.from === 'string' && validDay(input.from) ? input.from : '';
  let to = typeof input.to === 'string' && validDay(input.to) ? input.to : '';
  if (from && to && from > to) [from, to] = [to, from];
  const followUp = (FOLLOW_UP_FILTERS as readonly string[]).includes(String(input.followUp)) ? (input.followUp as FollowUpFilter) : '';
  const sort = (LIST_SORTS as readonly string[]).includes(String(input.sort)) ? (input.sort as ListSort) : base.sort;
  const dir = input.dir === 'asc' || input.dir === 'desc' ? input.dir : base.dir;
  const pageSize = (PAGE_SIZES as readonly number[]).includes(Number(input.pageSize)) ? Number(input.pageSize) : base.pageSize;
  const pageNum = Math.floor(Number(input.page));
  const page = Number.isFinite(pageNum) && pageNum >= 1 && pageNum <= 100000 ? pageNum : 1;
  const q = typeof input.q === 'string' ? input.q.slice(0, 100) : '';
  return { view, q, status: [...new Set(status)], service: [...new Set(service)], country: [...new Set(country)], assignee, lang, from, to, followUp, sort, dir, page, pageSize };
}

export function queryFromSearchParams(view: ListView, sp: URLSearchParams | Record<string, string | string[] | undefined>): ListQuery {
  const get = (k: string): string | undefined => {
    if (sp instanceof URLSearchParams) return sp.get(k) ?? undefined;
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return normalizeQuery(view, {
    status: get('status'),
    service: get('service'),
    country: get('country'),
    assignee: get('assignee'),
    lang: get('lang'),
    from: get('from'),
    to: get('to'),
    followUp: get('followUp'),
    sort: get('sort'),
    dir: get('dir'),
    page: get('page'),
    pageSize: get('pageSize'),
  });
}

/** URL state: stable codes only (no search text). Defaults are omitted. */
export function queryToSearchParams(q: ListQuery): URLSearchParams {
  const d = defaultQuery(q.view);
  const p = new URLSearchParams();
  if (q.status.length) p.set('status', q.status.join(','));
  if (q.service.length) p.set('service', q.service.join(','));
  if (q.country.length) p.set('country', q.country.join(','));
  if (q.assignee) p.set('assignee', q.assignee);
  if (q.lang) p.set('lang', q.lang);
  if (q.from) p.set('from', q.from);
  if (q.to) p.set('to', q.to);
  if (q.followUp) p.set('followUp', q.followUp);
  if (q.sort !== d.sort) p.set('sort', q.sort);
  if (q.dir !== d.dir) p.set('dir', q.dir);
  if (q.page !== 1) p.set('page', String(q.page));
  if (q.pageSize !== d.pageSize) p.set('pageSize', String(q.pageSize));
  return p;
}

export function hasActiveFilters(q: ListQuery): boolean {
  return !!(q.q || q.status.length || q.service.length || q.country.length || q.assignee || q.lang || q.from || q.to || q.followUp);
}
