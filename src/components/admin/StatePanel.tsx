import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/config';
import { getAdminMessages } from '@/i18n/admin';
import { IconAlert, IconLock } from './icons';

/** Localized safe recovery states. They never reveal whether a record exists. */
export function StatePanel({ locale, kind }: { locale: Locale; kind: 'forbidden' | 'not-found' | 'unavailable' }) {
  const t = getAdminMessages(locale);
  const title = kind === 'forbidden' ? t.states.forbiddenTitle : kind === 'not-found' ? t.states.notFoundTitle : t.auth.unavailableTitle;
  const text = kind === 'forbidden' ? t.states.forbiddenText : kind === 'not-found' ? t.states.notFoundText : t.auth.unavailableText;
  return (
    <div className="adm-card" data-testid={`state-${kind}`}>
      <div className="adm-empty">
        {kind === 'forbidden' ? <IconLock size={40} /> : <IconAlert size={40} />}
        <h1 className="adm-h1" style={{ color: 'var(--adm-text)' }}>
          {title}
        </h1>
        <p>{text}</p>
        {kind !== 'unavailable' ? (
          <Link className="adm-btn" href={`/${locale}/admin`}>
            {t.states.toOverview}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function PageHead({ title, lead, children }: { title: string; lead?: string; children?: ReactNode }) {
  return (
    <div className="adm-page-head">
      <div className="adm-page-head__text">
        <h1 className="adm-h1">{title}</h1>
        {lead ? <p className="adm-lead">{lead}</p> : null}
      </div>
      {children}
    </div>
  );
}
