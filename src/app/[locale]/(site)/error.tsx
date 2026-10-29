'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { isLocale, type Locale } from '@/i18n/config';
import { errorStrings } from '@/i18n/messages/errors';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ locale: string }>();
  const locale: Locale = isLocale(params?.locale) ? params.locale : 'en';
  const t = errorStrings[locale];

  useEffect(() => {
    // Logged for diagnostics only; never shown to visitors.
    console.error(error.digest ?? error.message);
  }, [error]);

  return (
    <section className="status-page on-dark">
      <div className="page-hero__grid" aria-hidden="true" />
      <div className="container status-page__inner">
        <p className="eyebrow eyebrow--on-dark">{t.eyebrow}</p>
        <h1 className="h1">{t.title}</h1>
        <p className="lead status-page__text">{t.text}</p>
        <div className="status-page__actions">
          <button type="button" className="btn btn--primary" onClick={() => reset()}>
            <span className="btn__label">{t.retry}</span>
          </button>
          <Link href={`/${locale}`} className="btn btn--ghost-dark">
            <span className="btn__label">{t.home}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
