import type { Locale } from '../config';
import en, { type AdminMessages } from './en';
import ar from './ar';

const dictionaries: Record<Locale, AdminMessages> = { en, ar };

export function getAdminMessages(locale: Locale): AdminMessages {
  return dictionaries[locale];
}

export { en as adminEn, ar as adminAr, type AdminMessages };
