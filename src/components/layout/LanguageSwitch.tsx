'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, type MouseEvent } from 'react';
import { localeSwitchLabel, otherLocale, type Locale } from '@/i18n/config';
import { switchLocaleHref } from '@/i18n/routes';
import { hasSelectedFiles } from '@/lib/forms/draftStore';

interface Props {
  locale: Locale;
  ariaLabel: string;
  fileWarning: string;
  className?: string;
  onNavigate?: () => void;
}

function SwitchLink({ locale, ariaLabel, fileWarning, className = '', onNavigate, search }: Props & { search: string }) {
  const pathname = usePathname() ?? `/${locale}`;
  const router = useRouter();
  const target = otherLocale(locale);
  const href = switchLocaleHref(pathname, target, search);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (hasSelectedFiles() && !window.confirm(fileWarning)) {
      e.preventDefault();
      return;
    }
    const withHash = switchLocaleHref(pathname, target, search, window.location.hash);
    if (withHash !== href) {
      e.preventDefault();
      router.push(withHash);
    }
    onNavigate?.();
  }

  return (
    <Link
      href={href}
      // No prefetch: prefetching the other locale would also pull its font preloads.
      prefetch={false}
      hrefLang={target}
      lang={target}
      className={`lang-switch ${className}`}
      title={ariaLabel}
      onClick={handleClick}
      data-testid="language-switch"
    >
      {localeSwitchLabel[target]}
    </Link>
  );
}

function WithSearch(props: Props) {
  const search = useSearchParams();
  return <SwitchLink {...props} search={search?.toString() ?? ''} />;
}

export function LanguageSwitch(props: Props) {
  return (
    <Suspense fallback={<SwitchLink {...props} search="" />}>
      <WithSearch {...props} />
    </Suspense>
  );
}
