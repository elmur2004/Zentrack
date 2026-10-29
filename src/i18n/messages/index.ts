import type { Locale } from '../config';
import en from './en';
import ar from './ar';

export type Messages = typeof en;

const dictionaries: Record<Locale, Messages> = { en, ar };

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}

export { en, ar };
