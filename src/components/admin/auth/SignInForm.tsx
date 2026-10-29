'use client';
/**
 * Sign-in through Better Auth's endpoints (password hashing, sessions, rate limiting and TOTP
 * verification are all handled there). Cookies are HttpOnly; nothing is stored in the browser.
 */
import { useId, useRef, useState, type FormEvent } from 'react';
import type { Locale } from '@/i18n/config';
import { getAdminMessages } from '@/i18n/admin';
import { IconAlert, IconInfo } from '../icons';

type Step = 'password' | 'totp' | 'backup';

async function post(path: string, body: unknown) {
  const res = await fetch(`/api/auth${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { code?: string; twoFactorRedirect?: boolean };
  return { res, data };
}

export function SignInForm({ locale, next, notice }: { locale: Locale; next: string; notice: '' | 'expired' | 'signed-out' }) {
  const t = getAdminMessages(locale);
  const uid = useId();
  const [step, setStep] = useState<Step>('password');
  // Uncontrolled inputs: anything typed before the page finishes loading is kept (no hydration reset).
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  function fail(message: string) {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  }

  function done() {
    window.location.assign(next || `/${locale}/admin`);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');
    const code = String(form.get('code') ?? '');
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return fail(t.auth.offline);
    setBusy(true);
    setError('');
    try {
      if (step === 'password') {
        const { res, data } = await post('/sign-in/email', { email: email.trim(), password });
        if (res.ok && data.twoFactorRedirect) {
          setStep('totp');
          requestAnimationFrame(() => codeRef.current?.focus());
          return;
        }
        if (res.ok) return done();
        if (res.status === 429) return fail(t.auth.rateLimited);
        if (data.code === 'NO_ACTIVE_MEMBERSHIP') return fail(t.auth.noAccess);
        if (res.status === 401 || res.status === 400) return fail(t.auth.invalid);
        return fail(t.auth.failed);
      }
      const path = step === 'totp' ? '/two-factor/verify-totp' : '/two-factor/verify-backup-code';
      const { res, data } = await post(path, { code: code.trim(), trustDevice: false });
      if (res.ok) return done();
      if (res.status === 429 || data.code === 'TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE') return fail(t.auth.rateLimited);
      if (data.code === 'NO_ACTIVE_MEMBERSHIP') return fail(t.auth.noAccess);
      if (data.code === 'INVALID_TWO_FACTOR_COOKIE') {
        // The two-factor challenge expired: start again with the password.
        setStep('password');
        return fail(t.auth.sessionExpired);
      }
      return fail(t.auth.invalidCode);
    } catch {
      fail(navigator.onLine === false ? t.auth.offline : t.auth.failed);
    } finally {
      setBusy(false);
    }
  }

  // method="post": a submission before scripts load never puts credentials in the URL.
  return (
    <form className="adm-stack" method="post" onSubmit={submit} noValidate data-testid="sign-in-form">
      {notice ? (
        <p className="adm-alert adm-alert--info" role="status">
          <IconInfo size={16} />
          <span>{notice === 'expired' ? t.auth.sessionExpired : t.auth.signedOut}</span>
        </p>
      ) : null}
      {error ? (
        <p className="adm-alert adm-alert--error" role="alert" tabIndex={-1} ref={errorRef} data-testid="sign-in-error">
          <IconAlert size={16} />
          <span>{error}</span>
        </p>
      ) : null}
      {step === 'password' ? (
        <>
          <div className="adm-field">
            <label htmlFor={`${uid}-email`} className="adm-label">
              {t.auth.email}
            </label>
            <input id={`${uid}-email`} name="email" className="adm-input adm-ltr" dir="ltr" type="email" autoComplete="username" required />
          </div>
          <div className="adm-field">
            <label htmlFor={`${uid}-pw`} className="adm-label">
              {t.auth.password}
            </label>
            <input id={`${uid}-pw`} name="password" className="adm-input adm-ltr" dir="ltr" type="password" autoComplete="current-password" required />
          </div>
        </>
      ) : (
        <>
          <div>
            <h2 className="adm-h2">{t.auth.totpTitle}</h2>
            <p className="adm-muted">{step === 'totp' ? t.auth.totpLead : t.auth.backupCodeLabel}</p>
          </div>
          <div className="adm-field">
            <label htmlFor={`${uid}-code`} className="adm-label">
              {step === 'totp' ? t.auth.totpCode : t.auth.backupCodeLabel}
            </label>
            <input
              // key: switching between authenticator and backup code starts with an empty field
              key={step}
              ref={codeRef}
              id={`${uid}-code`}
              name="code"
              className="adm-input adm-ltr"
              dir="ltr"
              inputMode={step === 'totp' ? 'numeric' : 'text'}
              autoComplete="one-time-code"
              pattern={step === 'totp' ? '[0-9]*' : undefined}
              maxLength={step === 'totp' ? 6 : 20}
              data-testid="totp-input"
            />
          </div>
          <button
            type="button"
            className="adm-btn adm-btn--ghost adm-btn--sm"
            onClick={() => {
              setStep(step === 'totp' ? 'backup' : 'totp');
              setError('');
            }}
          >
            {step === 'totp' ? t.auth.useBackup : t.auth.useTotp}
          </button>
        </>
      )}
      <button type="submit" className="adm-btn adm-btn--primary" aria-disabled={busy || undefined} data-testid="sign-in-submit">
        {busy ? <span className="adm-spinner" /> : null}
        {busy ? t.auth.submitting : step === 'password' ? t.auth.submit : t.auth.verify}
      </button>
    </form>
  );
}
