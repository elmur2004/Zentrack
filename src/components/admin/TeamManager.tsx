'use client';

import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import type { Locale } from '@/i18n/config';
import { getAdminMessages } from '@/i18n/admin';
import { fmt } from '@/i18n/format';
import { ROLES, type Role } from '@/lib/admin/codes';
import { formatDateTime } from '@/lib/admin/format';
import { changeRoleAction, createInvitationAction, revokeInvitationAction, setMemberAccessAction } from '@/server/actions/admin';
import { Dialog } from './Dialog';
import { errorText, notify, run } from './runtime';
import { IconAlert } from './icons';

interface Member {
  userId: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'revoked';
  twoFactorEnabled: boolean | null;
  lastActiveAt: Date | null;
}
interface Invitation {
  id: string;
  email: string;
  name: string;
  role: Role;
  expiresAt: Date;
}

export function TeamManager({ locale, me, members, invitations, timezone }: { locale: Locale; me: string; members: Member[]; invitations: Invitation[]; timezone: string }) {
  const t = getAdminMessages(locale);
  const router = useRouter();
  const uid = useId();
  const [revoke, setRevoke] = useState<Member | null>(null);
  const [invite, setInvite] = useState({ name: '', email: '', role: 'reviewer' });
  const [created, setCreated] = useState<{ email: string; link: string; expiresAt: string } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function act<T>(fn: () => Promise<unknown>, ok = t.common.saved) {
    const r = (await run(fn as () => Promise<{ ok: true; data: T }>)) as Awaited<ReturnType<typeof run<T>>>;
    if (r.ok) {
      notify(ok);
      router.refresh();
    } else notify(errorText(t, r.code, r.details), 'error');
    return r;
  }

  async function createInvite(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const r = await run(() => createInvitationAction(invite));
    setBusy(false);
    if (!r.ok) return setError(r.code === 'already_exists' ? t.invite.exists : errorText(t, r.code, r.details));
    setCreated({ email: invite.email, link: `${window.location.origin}/${locale}/admin/invite/${r.data.token}`, expiresAt: new Date(r.data.expiresAt).toISOString() });
    setInvite({ name: '', email: '', role: 'reviewer' });
    router.refresh();
  }

  return (
    <div className="adm-stack">
      <section className="adm-card" aria-labelledby={`${uid}-m`}>
        <div className="adm-card__head">
          <h2 id={`${uid}-m`} className="adm-h2">
            {t.team.members}
          </h2>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table adm-table--cards" data-testid="team-table">
            <thead>
              <tr>
                <th scope="col">{t.team.name}</th>
                <th scope="col">{t.team.email}</th>
                <th scope="col">{t.team.role}</th>
                <th scope="col">{t.team.mfa}</th>
                <th scope="col">{t.team.access}</th>
                <th scope="col">{t.team.lastActive}</th>
                <th scope="col">{t.team.actions}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.userId}>
                  <td className="adm-table__ref">
                    <bdi>{m.name}</bdi> {m.userId === me ? <span className="adm-muted">({t.common.you})</span> : null}
                  </td>
                  <td data-label={t.team.email} className="adm-ltr">
                    {m.email}
                  </td>
                  <td data-label={t.team.role}>
                    <label htmlFor={`${uid}-r-${m.userId}`} className="adm-sr-live">
                      {fmt(t.team.changeRole, { name: m.name })}
                    </label>
                    <select id={`${uid}-r-${m.userId}`} className="adm-select" value={m.role} onChange={(e) => act(() => changeRoleAction(m.userId, e.target.value))} style={{ inlineSize: 'auto' }}>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {t.roles[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td data-label={t.team.mfa}>
                    <span className="adm-badge" data-tone={m.twoFactorEnabled ? 'ok' : 'warn'}>
                      {m.twoFactorEnabled ? t.team.mfaOn : t.team.mfaOff}
                    </span>
                  </td>
                  <td data-label={t.team.access}>
                    <span className="adm-badge" data-tone={m.status === 'active' ? 'ok' : 'muted'}>
                      {m.status === 'active' ? t.team.active : t.team.revoked}
                    </span>
                  </td>
                  <td data-label={t.team.lastActive} className="adm-table__nowrap">
                    {m.lastActiveAt ? formatDateTime(locale, m.lastActiveAt, timezone) : t.team.never}
                  </td>
                  <td data-label={t.team.actions}>
                    {m.userId === me ? (
                      <span className="adm-help">{t.team.selfNote}</span>
                    ) : m.status === 'active' ? (
                      <button type="button" className="adm-btn adm-btn--sm adm-btn--danger" onClick={() => setRevoke(m)}>
                        {t.team.revoke}
                      </button>
                    ) : (
                      <button type="button" className="adm-btn adm-btn--sm" onClick={() => act(() => setMemberAccessAction(m.userId, 'active'))}>
                        {t.team.restore}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="adm-card" aria-labelledby={`${uid}-i`}>
        <div className="adm-card__head">
          <h2 id={`${uid}-i`} className="adm-h2">
            {t.team.invite}
          </h2>
        </div>
        <form className="adm-card__body adm-stack--sm" onSubmit={createInvite} data-testid="invite-form">
          <p className="adm-help">{t.team.inviteLead}</p>
          {error ? (
            <p className="adm-alert adm-alert--error" role="alert">
              <IconAlert size={16} />
              <span>{error}</span>
            </p>
          ) : null}
          <div className="adm-form-grid">
            <div className="adm-field">
              <label htmlFor={`${uid}-in`} className="adm-label">
                {t.team.inviteName}
              </label>
              <input id={`${uid}-in`} className="adm-input" dir="auto" maxLength={100} value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} />
            </div>
            <div className="adm-field">
              <label htmlFor={`${uid}-ie`} className="adm-label">
                {t.team.inviteEmail}
              </label>
              <input id={`${uid}-ie`} className="adm-input adm-ltr" dir="ltr" type="email" maxLength={254} value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
            </div>
            <div className="adm-field">
              <label htmlFor={`${uid}-ir`} className="adm-label">
                {t.team.inviteRole}
              </label>
              <select id={`${uid}-ir`} className="adm-select" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })} aria-describedby={`${uid}-irh`}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t.roles[r]}
                  </option>
                ))}
              </select>
              <p id={`${uid}-irh`} className="adm-help">
                {t.roleHelp[invite.role as Role]}
              </p>
            </div>
          </div>
          <div>
            <button type="submit" className="adm-btn adm-btn--primary" aria-disabled={busy || !invite.email || !invite.name || undefined}>
              {t.team.createInvite}
            </button>
          </div>
          {created ? (
            <div className="adm-alert adm-alert--ok" role="status" data-testid="invite-created">
              <div className="adm-alert__body">
                <span>{fmt(t.team.inviteCreated, { email: created.email, date: formatDateTime(locale, created.expiresAt, timezone) })}</span>
                <code className="adm-secret" data-testid="invite-link">
                  {created.link}
                </code>
                <span>
                  <button
                    type="button"
                    className="adm-btn adm-btn--sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(created.link);
                        notify(t.common.copied);
                      } catch {
                        notify(t.errors.unavailable, 'error');
                      }
                    }}
                  >
                    {t.common.copy}
                  </button>
                </span>
              </div>
            </div>
          ) : null}
        </form>
      </section>

      <section className="adm-card" aria-labelledby={`${uid}-p`}>
        <div className="adm-card__head">
          <h2 id={`${uid}-p`} className="adm-h2">
            {t.team.pending}
          </h2>
        </div>
        <div className="adm-card__body">
          {invitations.length ? (
            <ul className="adm-list">
              {invitations.map((i) => (
                <li key={i.id}>
                  <span>
                    <bdi>{i.name}</bdi> · <span className="adm-ltr">{i.email}</span> · {t.roles[i.role]}
                    <span className="adm-small adm-muted" style={{ display: 'block' }}>
                      {fmt(t.team.expires, { date: formatDateTime(locale, i.expiresAt, timezone) })}
                    </span>
                  </span>
                  <button type="button" className="adm-btn adm-btn--sm" onClick={() => act(() => revokeInvitationAction(i.id))}>
                    {t.team.revokeInvite}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="adm-muted">{t.team.pendingEmpty}</p>
          )}
        </div>
      </section>

      <Dialog
        open={!!revoke}
        onClose={() => setRevoke(null)}
        title={revoke ? fmt(t.team.revokeTitle, { name: revoke.name }) : ''}
        closeLabel={t.common.close}
        footer={
          <>
            <button type="button" className="adm-btn" onClick={() => setRevoke(null)}>
              {t.common.cancel}
            </button>
            <button
              type="button"
              className="adm-btn adm-btn--danger-solid"
              onClick={async () => {
                if (!revoke) return;
                const r = await act(() => setMemberAccessAction(revoke.userId, 'revoked'));
                if (r.ok) setRevoke(null);
              }}
              data-testid="revoke-confirm"
            >
              {t.team.revoke}
            </button>
          </>
        }
      >
        <p>{t.team.revokeText}</p>
      </Dialog>
    </div>
  );
}
