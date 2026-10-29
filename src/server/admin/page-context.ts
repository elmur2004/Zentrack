/** Shared server-side context for admin pages (locale, dictionary, actor, database, settings). */
import { isLocale, type Locale } from '@/i18n/config';
import { getAdminMessages } from '@/i18n/admin';
import { getDb } from '../db/client';
import { requireActor } from '../auth/session';
import { getSettings } from './settings';

export async function adminPageContext(params: Promise<{ locale: string }>, opts: { allowMfaPending?: boolean } = {}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : 'en';
  const actor = await requireActor(locale, opts);
  const db = await getDb();
  const settings = await getSettings(db);
  return { locale, t: getAdminMessages(locale), actor, db, settings };
}

export async function adminLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  return isLocale(locale) ? locale : 'en';
}
