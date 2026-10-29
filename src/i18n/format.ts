import { intlLocale, type Locale } from './config';

/** Replaces {name} placeholders in a complete stored message. Values are inserted as text. */
export function fmt(message: string, values: Record<string, string | number> = {}): string {
  return message.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in values ? String(values[key]) : `{${key}}`,
  );
}

export type PluralForms = {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
};

/**
 * Locale-aware plural selection. Arabic uses zero/one/two/few/many/other.
 * An explicit `zero` form is used for 0 in both locales when present.
 */
export function plural(locale: Locale, count: number, forms: PluralForms): string {
  let template: string | undefined;
  if (count === 0 && forms.zero) template = forms.zero;
  if (!template) {
    const category = new Intl.PluralRules(intlLocale[locale]).select(count) as keyof PluralForms;
    template = forms[category] ?? forms.other;
  }
  return fmt(template, { count: formatNumber(locale, count) });
}

export function formatNumber(locale: Locale, value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(intlLocale[locale], options).format(value);
}

/** Unambiguous localized Gregorian date from ISO data, e.g. "2 March 2026" / "2 مارس 2026". */
export function formatDate(locale: Locale, iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(intlLocale[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    calendar: 'gregory',
    timeZone: 'UTC',
  }).format(d);
}

export function formatFileSize(locale: Locale, bytes: number): string {
  const units = locale === 'ar' ? ['بايت', 'كيلوبايت', 'ميغابايت'] : ['B', 'KB', 'MB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const n = formatNumber(locale, value, { maximumFractionDigits: unit === 0 ? 0 : 1 });
  return `${n} ${units[unit]}`;
}

/** Localized country name from a stable ISO 3166-1 alpha-2 code. */
export function countryName(locale: Locale, code: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
