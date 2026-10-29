/** Localized labels for stable codes (services, engagement scope, countries). Server-side use. */
import type { Locale } from '@/i18n/config';
import { intlLocale } from '@/i18n/config';
import { countryName } from '@/i18n/format';
import { getMessages } from '@/i18n/messages';
import { services } from '@/content/public/services';
import { engagements } from '@/content/public/track';
import { countryCodes } from '@/content/public/countries';

export { formatDateTime, formatDay, isoLocal } from './format';

export function serviceLabel(locale: Locale, id: string): string {
  if (id === 'not-sure') return getMessages(locale).forms.fields.services.notSure;
  return services.find((s) => s.id === id)?.name[locale] ?? id;
}

export function scopeLabel(locale: Locale, id: string | null | undefined): string {
  if (!id) return '';
  return engagements.find((e) => e.id === id)?.title[locale] ?? id;
}

export function countryLabel(locale: Locale, code: string): string {
  return countryName(locale, code);
}

export function serviceOptions(locale: Locale) {
  return [...services.map((s) => ({ id: s.id as string, label: s.name[locale] })), { id: 'not-sure', label: serviceLabel(locale, 'not-sure') }];
}

export function scopeOptions(locale: Locale) {
  return engagements.map((e) => ({ id: e.id as string, label: e.title[locale] }));
}

export function countryOptions(locale: Locale) {
  const collator = new Intl.Collator(intlLocale[locale]);
  return countryCodes.map((code) => ({ id: code as string, label: countryName(locale, code) })).sort((a, b) => collator.compare(a.label, b.label));
}

/** Labels bundle passed to client components (avoids shipping content modules to the browser). */
export function labelMaps(locale: Locale) {
  return {
    services: Object.fromEntries(serviceOptions(locale).map((o) => [o.id, o.label])) as Record<string, string>,
    scopes: Object.fromEntries(scopeOptions(locale).map((o) => [o.id, o.label])) as Record<string, string>,
    countries: Object.fromEntries(countryOptions(locale).map((o) => [o.id, o.label])) as Record<string, string>,
  };
}
export type LabelMaps = ReturnType<typeof labelMaps>;
