import type { Locale } from '@/i18n/config';
import { getAdminMessages } from '@/i18n/admin';
import type { RequestStatus } from '@/lib/admin/codes';
import { StatusGlyph } from './icons';

/** Status = shape + label + colour (colour is never the only signal). */
export function StatusBadge({ status, locale }: { status: RequestStatus; locale: Locale }) {
  const t = getAdminMessages(locale);
  return (
    <span className="adm-badge" data-status={status}>
      <StatusGlyph status={status} />
      <span>{t.status[status]}</span>
    </span>
  );
}
