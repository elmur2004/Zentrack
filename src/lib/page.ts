import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { pageHref, type StaticPageId } from '@/i18n/routes';
import type { Crumb } from '@/components/layout/Breadcrumbs';

export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

/** Home → … breadcrumb trail. */
export function crumbs(locale: Locale, ...rest: Array<[StaticPageId, string] | Crumb>): Crumb[] {
  const t = getMessages(locale);
  const out: Crumb[] = [{ name: t.common.home, href: pageHref(locale, 'home') }];
  for (const item of rest) {
    if (Array.isArray(item)) out.push({ name: item[1], href: pageHref(locale, item[0]) });
    else out.push(item);
  }
  return out;
}
