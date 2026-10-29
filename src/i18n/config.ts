export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export type Localized<T> = Record<Locale, T>;

export const localeDir: Record<Locale, 'ltr' | 'rtl'> = { en: 'ltr', ar: 'rtl' };

/** Open Graph locale mapping (chosen convention: British English copy, pan-Arab Arabic). */
export const ogLocale: Record<Locale, string> = { en: 'en_GB', ar: 'ar_AR' };

/** Label shown on the language switch, in the target language. */
export const localeSwitchLabel: Record<Locale, string> = { en: 'English', ar: 'العربية' };

/**
 * Intl locale tags. Arabic UI uses the Latin numbering system for engineering quantities,
 * dates, IDs and counts (a documented design decision, see docs/content-decisions.md).
 */
export const intlLocale: Record<Locale, string> = { en: 'en-GB', ar: 'ar-EG-u-nu-latn' };

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'en' || value === 'ar';
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'ar' : 'en';
}
