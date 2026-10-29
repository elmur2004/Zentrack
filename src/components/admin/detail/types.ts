import type { Locale } from '@/i18n/config';
import type { AdminMessages } from '@/i18n/admin';
import type { Role } from '@/lib/admin/codes';
import type { RequestDetail } from '@/server/admin/requests';
import type { Result } from '../runtime';

export type Detail = RequestDetail;
export type TabId = 'overview' | 'files' | 'notes' | 'communication' | 'activity';
export const TABS: TabId[] = ['overview', 'files', 'notes', 'communication', 'activity'];

export interface Member {
  id: string;
  name: string;
  role: Role;
}

export interface Labels {
  services: Record<string, string>;
  scopes: Record<string, string>;
  countries: Record<string, string>;
}

/** Shared context handed to every part of the workspace. */
export interface Ctx {
  locale: Locale;
  t: AdminMessages;
  d: Detail;
  me: { id: string; role: Role };
  members: Member[];
  labels: Labels;
  timezone: string;
  transport: 'none' | 'outbox' | 'smtp';
  requireAssignee: boolean;
  now: Date;
  /** Runs an action, shows feedback, refreshes server data on success, flags conflicts. */
  act: <T>(fn: () => Promise<Result<T> | { ok: true; data: T } | { ok: false; code: never; details?: Record<string, string | number | boolean> }>, okText?: string) => Promise<Result<T>>;
}
