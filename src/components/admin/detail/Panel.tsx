'use client';

import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { fmt, plural } from '@/i18n/format';
import type { RequestStatus } from '@/lib/admin/codes';
import { formatDateTime } from '@/lib/admin/format';
import { dueState, toLocalInputValue } from '@/server/admin/time';
import { ASSIGNEE_REQUIRED_FOR, reasonRequired } from '@/server/admin/workflow';
import { addFollowUpAction, assignAction, changeStatusAction, closeFollowUpAction, deleteRequestAction, setDispositionAction } from '@/server/actions/admin';
import { Dialog } from '../Dialog';
import { StatusBadge } from '../StatusBadge';
import { errorText, notify, run, useDraft } from '../runtime';
import { IconAlert, IconInfo } from '../icons';
import type { Ctx } from './types';

export function StatusCard({ c }: { c: Ctx }) {
  const { t, d, locale } = c;
  const uid = useId();
  const r = d.request;
  const [to, setTo] = useState<RequestStatus | ''>('');
  const [reason, setReason, clearReason] = useDraft(`reason:${r.id}`);
  const [evidence, setEvidence] = useState('');
  const [busy, setBusy] = useState(false);
  const needReason = to ? reasonRequired(r.status, to) : false;
  const evidenceOptions = d.messages.filter((m) => m.isProposal && ['sent', 'test_delivered', 'sent_offline'].includes(m.status));
  const assigneeMissing = c.requireAssignee && !!to && ASSIGNEE_REQUIRED_FOR.includes(to) && !r.assigneeId;

  async function submit() {
    if (!to) return;
    setBusy(true);
    const res = await c.act(() => changeStatusAction(r.id, { to, reason, evidenceMessageId: evidence || undefined, expectedVersion: r.version }), t.common.saved);
    setBusy(false);
    if (res.ok) {
      setTo('');
      setEvidence('');
      clearReason();
    }
  }

  return (
    <section className="adm-card" aria-labelledby={`${uid}-h`}>
      <div className="adm-card__head">
        <h2 id={`${uid}-h`} className="adm-h2">
          {t.detail.panel.status}
        </h2>
        <StatusBadge status={r.status} locale={locale} />
      </div>
      <div className="adm-card__body adm-stack--sm">
        <p className="adm-small adm-muted">{fmt(t.detail.panel.since, { date: formatDateTime(locale, r.statusChangedAt, c.timezone) })}</p>
        <p className="adm-small">{t.statusHelp[r.status]}</p>
        {r.outcomeReason ? <p className="adm-small adm-pre">{fmt(t.detail.panel.outcomeReason, { reason: r.outcomeReason })}</p> : null}
        {d.permissions.status && d.transitions.length ? (
          <div className="adm-stack--sm" data-testid="status-form">
            <div className="adm-field">
              <label htmlFor={`${uid}-to`} className="adm-label">
                {t.detail.panel.newStatus}
              </label>
              <select id={`${uid}-to`} className="adm-select" value={to} onChange={(e) => setTo(e.target.value as RequestStatus)}>
                <option value="">{t.detail.panel.changeStatus}</option>
                {d.transitions.map((s) => (
                  <option key={s} value={s}>
                    {t.status[s]}
                  </option>
                ))}
              </select>
            </div>
            {to ? (
              <div className="adm-field">
                <label htmlFor={`${uid}-reason`} className="adm-label">
                  {t.detail.panel.reason} {needReason ? <span className="adm-muted">({t.common.required})</span> : <span className="adm-muted">({t.common.optional})</span>}
                </label>
                <textarea id={`${uid}-reason`} className="adm-textarea" dir="auto" rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} aria-describedby={needReason ? `${uid}-rhelp` : undefined} />
                {needReason ? (
                  <p id={`${uid}-rhelp`} className="adm-help">
                    {t.detail.panel.reasonRequired}
                  </p>
                ) : null}
              </div>
            ) : null}
            {to === 'quote_sent' ? (
              <div className="adm-field">
                <label htmlFor={`${uid}-ev`} className="adm-label">
                  {t.detail.panel.evidence}
                </label>
                {evidenceOptions.length ? (
                  <select id={`${uid}-ev`} className="adm-select" value={evidence} onChange={(e) => setEvidence(e.target.value)}>
                    <option value="">{t.common.none}</option>
                    {evidenceOptions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {t.messageStatus[m.status]} — {formatDateTime(locale, m.sentAt ?? m.createdAt, c.timezone)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="adm-help">{t.detail.panel.evidenceNone}</p>
                )}
              </div>
            ) : null}
            {assigneeMissing ? (
              <p className="adm-alert adm-alert--warn">
                <IconInfo size={16} />
                <span>{t.detail.panel.assigneeRule}</span>
              </p>
            ) : null}
            <button type="button" className="adm-btn adm-btn--primary" onClick={submit} aria-disabled={!to || busy || (needReason && !reason.trim()) || undefined} data-testid="status-submit">
              {busy ? <span className="adm-spinner" /> : null}
              {t.detail.panel.update}
            </button>
          </div>
        ) : d.permissions.status ? null : (
          <p className="adm-help">{t.detail.panel.noTransitions}</p>
        )}
        {c.requireAssignee ? <p className="adm-help">{t.detail.panel.assigneeRule}</p> : null}
      </div>
    </section>
  );
}

export function AssignCard({ c }: { c: Ctx }) {
  const { t, d, locale } = c;
  const uid = useId();
  const r = d.request;
  const [value, setValue] = useState(r.assigneeId ?? '');
  const [busy, setBusy] = useState(false);
  const changed = value !== (r.assigneeId ?? '');

  async function save() {
    setBusy(true);
    await c.act(() => assignAction(r.id, value || null, r.version), t.common.saved);
    setBusy(false);
  }

  return (
    <section className="adm-card" aria-labelledby={`${uid}-h`}>
      <div className="adm-card__head">
        <h2 id={`${uid}-h`} className="adm-h2">
          {t.detail.panel.assignment}
        </h2>
      </div>
      <div className="adm-card__body adm-stack--sm">
        {d.permissions.assign ? (
          <>
            <div className="adm-field">
              <label htmlFor={`${uid}-a`} className="adm-label">
                {t.detail.panel.assignee}
              </label>
              <select id={`${uid}-a`} className="adm-select" value={value} onChange={(e) => setValue(e.target.value)} data-testid="assignee-select">
                <option value="">{t.common.unassigned}</option>
                {c.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({t.roles[m.role]})
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="adm-btn" onClick={save} aria-disabled={!changed || busy || undefined} data-testid="assign-save">
              {busy ? <span className="adm-spinner" /> : null}
              {t.detail.panel.assign}
            </button>
          </>
        ) : (
          <p>{r.assigneeName ?? <span className="adm-muted">{t.common.unassigned}</span>}</p>
        )}
        {r.assignedAt && r.assigneeId ? <p className="adm-small adm-muted">{fmt(t.detail.panel.assignedSince, { date: formatDateTime(locale, r.assignedAt, c.timezone) })}</p> : null}
      </div>
    </section>
  );
}

export function FollowUpsCard({ c }: { c: Ctx }) {
  const { t, d, locale } = c;
  const uid = useId();
  const r = d.request;
  const open = d.followUps.filter((f) => !f.completedAt && !f.cancelledAt);
  const closed = d.followUps.length - open.length;
  const [action, setAction, clearAction] = useDraft(`fu:${r.id}`);
  const tomorrow = new Date(c.now.getTime() + 24 * 3600 * 1000);
  const defaultDue = toLocalInputValue(tomorrow, c.timezone).slice(0, 11) + '10:00';
  const [due, setDue] = useState(defaultDue);
  const [owner, setOwner] = useState('');
  const [busy, setBusy] = useState(false);
  const owners = c.members.filter((m) => m.role === 'owner' || m.role === 'manager' || m.id === r.assigneeId).filter((m) => m.id !== c.me.id);

  async function add() {
    setBusy(true);
    const res = await c.act(() => addFollowUpAction(r.id, { action, dueLocal: due, assigneeId: owner || null }), t.common.saved);
    setBusy(false);
    if (res.ok) {
      clearAction();
      setDue(defaultDue);
    }
  }

  return (
    <section className="adm-card" aria-labelledby={`${uid}-h`}>
      <div className="adm-card__head">
        <h2 id={`${uid}-h`} className="adm-h2">
          {t.detail.panel.followUps}
        </h2>
      </div>
      <div className="adm-card__body adm-stack--sm">
        {open.length ? (
          <ul className="adm-list" data-testid="followups">
            {open.map((f) => {
              const state = dueState(new Date(f.dueAt), c.now, c.timezone);
              return (
                <li key={f.id}>
                  <span className="adm-stack--sm" style={{ gap: 2 }}>
                    <bdi className="adm-pre">{f.action}</bdi>
                    <span className="adm-small adm-muted">
                      {formatDateTime(locale, f.dueAt, c.timezone)} · {f.assigneeName ?? t.common.formerMember}
                    </span>
                    {state !== 'upcoming' ? (
                      <span className="adm-badge" data-tone={state === 'overdue' ? 'danger' : 'warn'} style={{ justifySelf: 'start' }}>
                        {t.inbox.due[state]}
                      </span>
                    ) : null}
                  </span>
                  {d.permissions.followUp ? (
                    <span className="adm-row">
                      <button type="button" className="adm-btn adm-btn--sm" onClick={() => c.act(() => closeFollowUpAction(f.id, 'completed'), t.common.saved)}>
                        {t.detail.panel.complete}
                      </button>
                      <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost" onClick={() => c.act(() => closeFollowUpAction(f.id, 'cancelled'), t.common.saved)}>
                        {t.detail.panel.cancelFollowUp}
                      </button>
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="adm-muted">{t.detail.panel.followUpsEmpty}</p>
        )}
        {closed ? <p className="adm-small adm-muted">{plural(locale, closed, t.detail.panel.closedFollowUps)}</p> : null}
        {d.permissions.followUp && r.disposition === 'active' ? (
          <div className="adm-stack--sm" data-testid="followup-form">
            <div className="adm-field">
              <label htmlFor={`${uid}-act`} className="adm-label">
                {t.detail.panel.followUpAction}
              </label>
              <input id={`${uid}-act`} className="adm-input" dir="auto" maxLength={200} value={action} onChange={(e) => setAction(e.target.value)} />
            </div>
            <div className="adm-field">
              <label htmlFor={`${uid}-due`} className="adm-label">
                {fmt(t.detail.panel.followUpDue, { tz: c.timezone })}
              </label>
              <input id={`${uid}-due`} className="adm-input" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
            <div className="adm-field">
              <label htmlFor={`${uid}-own`} className="adm-label">
                {t.detail.panel.followUpOwner}
              </label>
              <select id={`${uid}-own`} className="adm-select" value={owner} onChange={(e) => setOwner(e.target.value)}>
                <option value="">{t.common.me}</option>
                {owners.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="adm-btn" onClick={add} aria-disabled={!action.trim() || !due || busy || undefined} data-testid="followup-add">
              {t.detail.panel.addFollowUp}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function RecordCard({ c }: { c: Ctx }) {
  const { t, d } = c;
  const uid = useId();
  const router = useRouter();
  const r = d.request;
  const [confirm, setConfirm] = useState<null | 'archived' | 'spam' | 'active'>(null);
  const [reason, setReason] = useState('');
  const [del, setDel] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [delError, setDelError] = useState('');
  const canRestore = r.disposition === 'archived' ? d.permissions.archive : r.disposition === 'spam' ? d.permissions.spam : false;
  if (!d.permissions.archive && !d.permissions.spam && !d.permissions.delete) return null;

  async function apply() {
    if (!confirm) return;
    setBusy(true);
    const res = await c.act(() => setDispositionAction([r.id], confirm, reason), t.common.saved);
    setBusy(false);
    if (res.ok) {
      setConfirm(null);
      setReason('');
    }
  }

  async function remove() {
    setBusy(true);
    setDelError('');
    const res = await run(() => deleteRequestAction(r.id, typed));
    setBusy(false);
    if (!res.ok) return setDelError(errorText(t, res.code, res.details));
    notify(res.data.storageUnverified ? fmt(t.detail.panel.deleteStorageWarning, { count: res.data.storageUnverified }) : fmt(t.detail.panel.deleteDone, { ref: res.data.reference }), res.data.storageUnverified ? 'error' : 'ok');
    setDel(false);
    router.push(`/${c.locale}/admin/archive${r.disposition === 'spam' ? '?view=spam' : ''}`);
  }

  const titles = { archived: t.detail.panel.archive, spam: t.detail.panel.spam, active: t.detail.panel.restore };
  const texts = { archived: t.inbox.confirm.archiveText, spam: t.inbox.confirm.spamText, active: t.inbox.confirm.restoreText };

  return (
    <section className="adm-card" aria-labelledby={`${uid}-h`}>
      <div className="adm-card__head">
        <h2 id={`${uid}-h`} className="adm-h2">
          {t.detail.panel.record}
        </h2>
        <span className="adm-badge" data-tone={r.disposition === 'active' ? 'ok' : 'muted'}>
          {t.disposition[r.disposition]}
        </span>
      </div>
      <div className="adm-card__body adm-row">
        {r.disposition === 'active' && d.permissions.archive ? (
          <button type="button" className="adm-btn adm-btn--sm" onClick={() => setConfirm('archived')} data-testid="archive-button">
            {t.detail.panel.archive}
          </button>
        ) : null}
        {r.disposition === 'active' && d.permissions.spam ? (
          <button type="button" className="adm-btn adm-btn--sm" onClick={() => setConfirm('spam')}>
            {t.detail.panel.spam}
          </button>
        ) : null}
        {canRestore ? (
          <button type="button" className="adm-btn adm-btn--sm" onClick={() => setConfirm('active')} data-testid="restore-button">
            {t.detail.panel.restore}
          </button>
        ) : null}
        {d.permissions.delete ? (
          <button type="button" className="adm-btn adm-btn--sm adm-btn--danger" onClick={() => setDel(true)}>
            {t.detail.panel.delete}
          </button>
        ) : null}
      </div>
      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm ? `${titles[confirm]} — ${r.reference}` : ''}
        closeLabel={t.common.close}
        footer={
          <>
            <button type="button" className="adm-btn" onClick={() => setConfirm(null)}>
              {t.common.cancel}
            </button>
            <button type="button" className="adm-btn adm-btn--primary" onClick={apply} aria-disabled={busy || undefined} data-testid="disposition-confirm">
              {t.common.confirm}
            </button>
          </>
        }
      >
        <p>{confirm ? texts[confirm] : ''}</p>
        {confirm && confirm !== 'active' ? (
          <div className="adm-field">
            <label htmlFor={`${uid}-dr`} className="adm-label">
              {t.inbox.confirm.reason}
            </label>
            <input id={`${uid}-dr`} className="adm-input" dir="auto" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        ) : null}
      </Dialog>
      <Dialog
        open={del}
        onClose={() => setDel(false)}
        title={fmt(t.detail.panel.deleteTitle, { ref: r.reference })}
        closeLabel={t.common.close}
        footer={
          <>
            <button type="button" className="adm-btn" onClick={() => setDel(false)}>
              {t.common.cancel}
            </button>
            <button type="button" className="adm-btn adm-btn--danger-solid" onClick={remove} aria-disabled={typed.trim().toUpperCase() !== r.reference || busy || undefined}>
              {t.detail.panel.delete}
            </button>
          </>
        }
      >
        <p className="adm-alert adm-alert--error">
          <IconAlert size={16} />
          <span>{t.detail.panel.deleteText}</span>
        </p>
        <div className="adm-field">
          <label htmlFor={`${uid}-del`} className="adm-label">
            {fmt(t.detail.panel.deleteConfirmLabel, { ref: r.reference })}
          </label>
          <input id={`${uid}-del`} className="adm-input adm-ltr" dir="ltr" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
        </div>
        {delError ? (
          <p className="adm-error-text" role="alert">
            {delError}
          </p>
        ) : null}
      </Dialog>
    </section>
  );
}
