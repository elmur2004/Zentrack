'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { isLocale, type Locale } from '@/i18n/config';
import { getAdminMessages } from '@/i18n/admin';
import { IconAlert } from '@/components/admin/icons';

/** Error boundary inside the shell: no stack traces, SQL or identifiers are shown. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ locale: string }>();
  const locale: Locale = isLocale(params?.locale) ? params.locale : 'en';
  const t = getAdminMessages(locale);
  useEffect(() => {
    console.error('[admin] render error', error.digest ?? error.name);
  }, [error]);
  return (
    <div className="adm-card" role="alert" data-testid="state-error">
      <div className="adm-empty">
        <IconAlert size={40} />
        <h1 className="adm-h1" style={{ color: 'var(--adm-text)' }}>
          {t.states.errorTitle}
        </h1>
        <p>{t.states.errorText}</p>
        <div className="adm-row">
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => reset()}>
            {t.common.retry}
          </button>
          <Link className="adm-btn" href={`/${locale}/admin`}>
            {t.states.toOverview}
          </Link>
        </div>
      </div>
    </div>
  );
}
