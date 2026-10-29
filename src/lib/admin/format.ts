/** Dependency-free Intl formatting for the dashboard (safe for browser bundles). */
import { intlLocale, type Locale } from '@/i18n/config';

/** Date and time in the configured zone, Gregorian calendar, Latin digits (project convention). */
export function formatDateTime(locale: Locale, value: Date | string, tz: string, opts: { withTime?: boolean; withZone?: boolean } = {}): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(intlLocale[locale], {
    timeZone: tz,
    calendar: 'gregory',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(opts.withTime === false ? {} : { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' as const }),
    ...(opts.withZone ? { timeZoneName: 'short' as const } : {}),
  }).format(d);
}

/** Date and time as separate strings (compact two-line table cells). */
export function formatDateParts(locale: Locale, value: Date | string, tz: string): { date: string; time: string } {
  const d = typeof value === 'string' ? new Date(value) : value;
  return {
    date: new Intl.DateTimeFormat(intlLocale[locale], { timeZone: tz, calendar: 'gregory', day: 'numeric', month: 'short', year: 'numeric' }).format(d),
    time: new Intl.DateTimeFormat(intlLocale[locale], { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d),
  };
}

export function formatDay(locale: Locale, dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Intl.DateTimeFormat(intlLocale[locale], { timeZone: 'UTC', calendar: 'gregory', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** "YYYY-MM-DD HH:mm" in the zone (exports: unambiguous and sortable). */
export function isoLocal(value: Date, tz: string): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      .formatToParts(value)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

export function formatCount(locale: Locale, n: number): string {
  return new Intl.NumberFormat(intlLocale[locale]).format(n);
}

export function formatBytes(locale: Locale, bytes: number): string {
  const units = locale === 'ar' ? ['بايت', 'ك.ب', 'م.ب'] : ['B', 'KB', 'MB'];
  let v = bytes;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u += 1;
  }
  return `${new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: u === 0 ? 0 : 1 }).format(v)} ${units[u]}`;
}
