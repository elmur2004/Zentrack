'use client';

import Link from 'next/link';
import { useId, useState, type FormEvent } from 'react';
import type { Locale } from '@/i18n/config';
import { getAdminMessages } from '@/i18n/admin';
import { acceptInvitationAction } from '@/server/actions/admin';
import { run } from '../runtime';
import { IconAlert, IconCheck } from '../icons';

export function InviteForm({ locale, token }: { locale: Locale; token: string }) {
  const t = getAdminMessages(locale);
  const uid = useId();
  // Uncontrolled inputs (typing before the page finishes loading is kept).
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const password = String(form.get('password') ?? '');
    const confirm = String(form.get('confirm') ?? '');
    if (password.length < 12) return setError(t.invite.tooShort);
    if (password !== confirm) return setError(t.invite.mismatch);
    setBusy(true);
    setError('');
    const r = await run(() => acceptInvitationAction(token, password));
    setBusy(false);
    if (r.ok) {
      formEl.reset();
      return setDone(true);
    }
    setError(r.code === 'already_exists' ? t.invite.exists : r.code === 'invite_invalid' ? t.invite.invalidText : r.code === 'validation' ? t.errors.fields.password : t.errors.unavailable);
  }

  if (done) {
    return (
      <div className="adm-stack">
        <p className="adm-alert adm-alert--ok" role="status">
          <IconCheck size={16} />
          <span>{t.invite.done}</span>
        </p>
        <Link href={`/${locale}/admin/sign-in`} className="adm-btn adm-btn--primary">
          {t.invite.signIn}
        </Link>
      </div>
    );
  }

  return (
    <form className="adm-stack" method="post" onSubmit={submit} noValidate>
      {error ? (
        <p className="adm-alert adm-alert--error" role="alert">
          <IconAlert size={16} />
          <span>{error}</span>
        </p>
      ) : null}
      <div className="adm-field">
        <label htmlFor={`${uid}-pw`} className="adm-label">
          {t.invite.password}
        </label>
        <input id={`${uid}-pw`} className="adm-input adm-ltr" dir="ltr" type="password" name="password" autoComplete="new-password" minLength={12} maxLength={128} aria-describedby={`${uid}-help`} />
        <p id={`${uid}-help`} className="adm-help">
          {t.invite.passwordHelp}
        </p>
      </div>
      <div className="adm-field">
        <label htmlFor={`${uid}-c`} className="adm-label">
          {t.invite.confirm}
        </label>
        <input id={`${uid}-c`} className="adm-input adm-ltr" dir="ltr" type="password" name="confirm" autoComplete="new-password" maxLength={128} />
      </div>
      <button type="submit" className="adm-btn adm-btn--primary" aria-disabled={busy || undefined}>
        {busy ? <span className="adm-spinner" /> : null}
        {busy ? t.invite.submitting : t.invite.submit}
      </button>
    </form>
  );
}
