'use client';

import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import type { Locale } from '@/i18n/config';
import { getAdminMessages } from '@/i18n/admin';
import { setNotifyEmailAction } from '@/server/actions/admin';
import { notify, run } from '../runtime';
import { IconAlert, IconCheck, IconLock } from '../icons';

async function post(path: string, body: unknown) {
  const res = await fetch(`/api/auth${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { totpURI?: string; backupCodes?: string[]; code?: string };
  return { res, data };
}

interface Props {
  locale: Locale;
  userId: string;
  twoFactorEnabled: boolean;
  mfaRequiredByPolicy: boolean;
  notifyEmail: boolean;
}

export function AccountSecurity({ locale, userId, twoFactorEnabled, mfaRequiredByPolicy, notifyEmail }: Props) {
  const t = getAdminMessages(locale);
  const router = useRouter();
  const uid = useId();
  const [phase, setPhase] = useState<'idle' | 'scan' | 'codes'>('idle');
  const [password, setPassword] = useState('');
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [emailPref, setEmailPref] = useState(notifyEmail);

  async function start(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { res, data } = await post('/two-factor/enable', { password });
    setBusy(false);
    if (!res.ok || !data.totpURI) return setError(res.status === 400 || res.status === 401 ? t.account.wrongPassword : t.errors.unavailable);
    setPassword('');
    const QR = (await import('qrcode')).default;
    setQr(await QR.toDataURL(data.totpURI, { margin: 1, width: 200, errorCorrectionLevel: 'M' }));
    setSecret(new URL(data.totpURI).searchParams.get('secret') ?? '');
    setCodes(data.backupCodes ?? []);
    setPhase('scan');
  }

  async function confirmCode(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { res } = await post('/two-factor/verify-totp', { code: code.trim() });
    setBusy(false);
    if (!res.ok) return setError(t.auth.invalidCode);
    setCode('');
    setPhase('codes');
  }

  async function disable(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { res } = await post('/two-factor/disable', { password });
    setBusy(false);
    if (!res.ok) return setError(t.account.wrongPassword);
    setPassword('');
    router.refresh();
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (pw.next.length < 12 || pw.next.length > 128) return setPwMsg({ ok: false, text: t.errors.fields.password });
    if (pw.next !== pw.confirm) return setPwMsg({ ok: false, text: t.invite.mismatch });
    setBusy(true);
    const { res } = await post('/change-password', { currentPassword: pw.current, newPassword: pw.next, revokeOtherSessions: true });
    setBusy(false);
    if (!res.ok) return setPwMsg({ ok: false, text: res.status === 400 || res.status === 401 ? t.account.wrongPassword : t.errors.unavailable });
    setPw({ current: '', next: '', confirm: '' });
    setPwMsg({ ok: true, text: t.account.passwordChanged });
  }

  async function signOutOthers() {
    const { res } = await post('/revoke-other-sessions', {});
    notify(res.ok ? t.account.signedOutOthers : t.errors.unavailable, res.ok ? 'ok' : 'error');
  }

  async function toggleEmail(v: boolean) {
    setEmailPref(v);
    const r = await run(() => setNotifyEmailAction(userId, v));
    if (!r.ok) {
      setEmailPref(!v);
      notify(t.errors.unavailable, 'error');
    } else notify(t.common.saved);
  }

  return (
    <div className="adm-stack">
      <section className="adm-card" aria-labelledby={`${uid}-mfa`}>
        <div className="adm-card__head">
          <h2 id={`${uid}-mfa`} className="adm-h2">
            {t.account.mfaTitle}
          </h2>
          <span className="adm-badge" data-tone={twoFactorEnabled ? 'ok' : 'warn'} data-testid="mfa-state">
            {twoFactorEnabled ? t.account.mfaOn : t.account.mfaOff}
          </span>
        </div>
        <div className="adm-card__body adm-stack">
          {error ? (
            <p className="adm-alert adm-alert--error" role="alert">
              <IconAlert size={16} />
              <span>{error}</span>
            </p>
          ) : null}
          {phase === 'codes' ? (
            <div className="adm-stack--sm" data-testid="backup-codes">
              <h3 className="adm-h3">{t.account.backupTitle}</h3>
              <p className="adm-help">{t.account.backupLead}</p>
              <ul className="adm-codes" style={{ listStyle: 'none', margin: 0 }}>
                {codes.map((cd) => (
                  <li key={cd}>{cd}</li>
                ))}
              </ul>
              <div>
                <button
                  type="button"
                  className="adm-btn adm-btn--primary"
                  onClick={() => {
                    setCodes([]);
                    setPhase('idle');
                    router.refresh();
                  }}
                >
                  <IconCheck size={16} />
                  {t.account.backupSaved}
                </button>
              </div>
            </div>
          ) : phase === 'scan' ? (
            <form className="adm-stack--sm" onSubmit={confirmCode}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt={t.account.qrAlt} width={200} height={200} className="adm-qr" />
              <p className="adm-help">{t.account.manualKey}</p>
              <p className="adm-secret" data-testid="totp-secret">
                {secret}
              </p>
              <div className="adm-field">
                <label htmlFor={`${uid}-code`} className="adm-label">
                  {t.account.enterCode}
                </label>
                <input id={`${uid}-code`} className="adm-input adm-ltr" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} data-testid="totp-confirm-input" />
              </div>
              <div>
                <button type="submit" className="adm-btn adm-btn--primary" aria-disabled={busy || code.trim().length < 6 || undefined} data-testid="totp-confirm">
                  {t.account.confirmMfa}
                </button>
              </div>
            </form>
          ) : twoFactorEnabled ? (
            mfaRequiredByPolicy ? (
              <p className="adm-help">{t.account.mfaDisabledByPolicy}</p>
            ) : (
              <form className="adm-stack--sm" onSubmit={disable}>
                <p className="adm-help">{t.account.mfaDisableLead}</p>
                <div className="adm-field">
                  <label htmlFor={`${uid}-dpw`} className="adm-label">
                    {t.account.password}
                  </label>
                  <input id={`${uid}-dpw`} className="adm-input adm-ltr" dir="ltr" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div>
                  <button type="submit" className="adm-btn adm-btn--danger" aria-disabled={busy || !password || undefined}>
                    {t.account.mfaDisable}
                  </button>
                </div>
              </form>
            )
          ) : (
            <form className="adm-stack--sm" onSubmit={start}>
              <p className="adm-help">{t.account.mfaStartLead}</p>
              <div className="adm-field">
                <label htmlFor={`${uid}-pw`} className="adm-label">
                  {t.account.password}
                </label>
                <input id={`${uid}-pw`} className="adm-input adm-ltr" dir="ltr" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="mfa-password" />
              </div>
              <div>
                <button type="submit" className="adm-btn adm-btn--primary" aria-disabled={busy || !password || undefined} data-testid="mfa-start">
                  <IconLock size={16} />
                  {t.account.mfaStart}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <section className="adm-card" aria-labelledby={`${uid}-pwh`}>
        <div className="adm-card__head">
          <h2 id={`${uid}-pwh`} className="adm-h2">
            {t.account.passwordTitle}
          </h2>
        </div>
        <form className="adm-card__body adm-stack--sm" onSubmit={changePassword}>
          {pwMsg ? (
            <p className={`adm-alert ${pwMsg.ok ? 'adm-alert--ok' : 'adm-alert--error'}`} role={pwMsg.ok ? 'status' : 'alert'}>
              <span>{pwMsg.text}</span>
            </p>
          ) : null}
          <div className="adm-form-grid">
            <div className="adm-field">
              <label htmlFor={`${uid}-cur`} className="adm-label">
                {t.account.password}
              </label>
              <input id={`${uid}-cur`} className="adm-input adm-ltr" dir="ltr" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            </div>
            <div className="adm-field">
              <label htmlFor={`${uid}-new`} className="adm-label">
                {t.account.newPassword}
              </label>
              <input id={`${uid}-new`} className="adm-input adm-ltr" dir="ltr" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            </div>
            <div className="adm-field">
              <label htmlFor={`${uid}-conf`} className="adm-label">
                {t.account.confirmPassword}
              </label>
              <input id={`${uid}-conf`} className="adm-input adm-ltr" dir="ltr" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            </div>
          </div>
          <p className="adm-help">{t.invite.passwordHelp}</p>
          <div>
            <button type="submit" className="adm-btn" aria-disabled={busy || !pw.current || !pw.next || undefined}>
              {t.account.changePassword}
            </button>
          </div>
        </form>
      </section>

      <section className="adm-card" aria-labelledby={`${uid}-dev`}>
        <div className="adm-card__head">
          <h2 id={`${uid}-dev`} className="adm-h2">
            {t.account.sessionsTitle}
          </h2>
        </div>
        <div className="adm-card__body adm-stack--sm">
          <div>
            <button type="button" className="adm-btn" onClick={signOutOthers}>
              {t.account.signOutOthers}
            </button>
          </div>
          <label className="adm-check">
            <input type="checkbox" checked={emailPref} onChange={(e) => toggleEmail(e.target.checked)} />
            <span>
              {t.account.emailPref}
              <span className="adm-help" style={{ display: 'block' }}>
                {t.account.emailPrefNote}
              </span>
            </span>
          </label>
        </div>
      </section>
    </div>
  );
}
