import { locale as rootLocale } from 'next/root-params';
import { isLocale } from '@/i18n/config';
import { getAdminMessages } from '@/i18n/admin';
import { StatePanel } from '@/components/admin/StatePanel';

/** 404 inside the dashboard shell. Unknown and not-permitted records render identically. */
export default async function AdminNotFound() {
  const raw = await rootLocale();
  const locale = isLocale(raw) ? raw : 'en';
  const t = getAdminMessages(locale);
  return (
    <>
      <title>{`${t.states.notFoundTitle} · ${t.meta.title}`}</title>
      <StatePanel locale={locale} kind="not-found" />
    </>
  );
}
