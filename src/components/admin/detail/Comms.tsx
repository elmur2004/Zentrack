'use client';

import { useId, useState } from 'react';
import { fmt } from '@/i18n/format';
import { CURRENCIES } from '@/lib/admin/codes';
import { formatDateTime } from '@/lib/admin/format';
import { toLocalInputValue } from '@/server/admin/time';
import { createDraftAction, markMessageFailedAction, recordOfflineSendAction, sendMessageAction, updateDraftAction, updateProposalAction } from '@/server/actions/admin';
import { Dialog } from '../Dialog';
import { errorText, notify, useDraft } from '../runtime';
import { IconAlert, IconInfo, IconSend } from '../icons';
import type { Ctx } from './types';

type Msg = Ctx['d']['messages'][number];

function isEmailLike(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

function DraftEditor({ c, m }: { c: Ctx; m: Msg }) {
  const { t, d } = c;
  const uid = useId();
  const recipients = [d.request.email, ...d.clarifications.filter((x) => x.field === 'email' && isEmailLike(x.value.trim())).map((x) => x.value.trim())];
  const proposalFiles = d.files.filter((f) => f.kind === 'proposal' && f.downloadable);
  const [to, setTo] = useState(m.toEmail);
  const [subject, setSubject, clearSubject] = useDraft(`msg:${m.id}:subject`, m.subject);
  const [body, setBody, clearBody] = useDraft(`msg:${m.id}:body`, m.body);
  const [files, setFiles] = useState<string[]>(m.attachmentIds);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const dirty = to !== m.toEmail || subject !== m.subject || body !== m.body || files.join() !== m.attachmentIds.join();

  async function save(): Promise<number | null> {
    if (!dirty) return m.version;
    setBusy(true);
    const res = await c.act(() => updateDraftAction(m.id, { toEmail: to, subject, body, attachmentIds: files, expectedVersion: m.version }), t.common.saved);
    setBusy(false);
    if (!res.ok) return null;
    clearSubject();
    clearBody();
    return res.data.version;
  }

  async function send() {
    const version = await save();
    if (version === null) return;
    setBusy(true);
    const res = await c.act(() => sendMessageAction(m.id, version));
    setBusy(false);
    setConfirm(false);
    if (res.ok) notify(t.messageStatus[res.data.status], res.data.status === 'failed' ? 'error' : 'ok');
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      notify(t.common.copied);
    } catch {
      notify(t.errors.unavailable, 'error');
    }
  }

  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.slice(0, 1800))}`;
  const attached = proposalFiles.filter((f) => files.includes(f.id));

  return (
    <div className="adm-stack--sm" data-testid="draft-editor">
      <div className="adm-form-grid">
        <div className="adm-field">
          <label htmlFor={`${uid}-to`} className="adm-label">
            {t.detail.comms.to}
          </label>
          <select id={`${uid}-to`} className="adm-select adm-ltr" dir="ltr" value={to} onChange={(e) => setTo(e.target.value)}>
            {[...new Set(recipients)].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="adm-field">
          <label htmlFor={`${uid}-s`} className="adm-label">
            {t.detail.comms.subject}
          </label>
          <input id={`${uid}-s`} className="adm-input" dir="auto" lang={m.language} maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
      </div>
      <div className="adm-field">
        <label htmlFor={`${uid}-b`} className="adm-label">
          {t.detail.comms.body}
        </label>
        <textarea id={`${uid}-b`} className="adm-textarea adm-textarea--tall" dir="auto" lang={m.language} maxLength={8000} value={body} onChange={(e) => setBody(e.target.value)} data-testid="draft-body" />
      </div>
      <fieldset className="adm-fieldset">
        <legend>{t.detail.comms.attachments}</legend>
        {proposalFiles.length ? (
          proposalFiles.map((f) => (
            <label key={f.id} className="adm-check">
              <input type="checkbox" checked={files.includes(f.id)} onChange={(e) => setFiles((list) => (e.target.checked ? [...list, f.id] : list.filter((x) => x !== f.id)))} />
              <bdi dir="auto">{f.originalName}</bdi>
            </label>
          ))
        ) : (
          <p className="adm-help">{t.detail.comms.noProposalFiles}</p>
        )}
      </fieldset>
      {m.status === 'failed' && m.lastError ? (
        <p className="adm-alert adm-alert--error">
          <IconAlert size={16} />
          <span>{fmt(t.detail.comms.lastError, { error: m.lastError })}</span>
        </p>
      ) : null}
      <div className="adm-row">
        <button type="button" className="adm-btn" onClick={() => void save()} aria-disabled={!dirty || busy || undefined} data-testid="draft-save">
          {t.detail.comms.saveDraft}
        </button>
        {dirty ? <span className="adm-small adm-muted">{t.detail.comms.unsaved}</span> : null}
        <button type="button" className="adm-btn adm-btn--ghost" onClick={copy}>
          {t.detail.comms.copy}
        </button>
        <a className="adm-btn adm-btn--ghost" href={mailto} title={t.detail.comms.openMailAppNote}>
          {t.detail.comms.openMailApp}
        </a>
        {d.permissions.send && c.transport !== 'none' ? (
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => setConfirm(true)} aria-disabled={!subject.trim() || !body.trim() || busy || undefined} data-testid="draft-send">
            <IconSend size={16} />
            {m.status === 'failed' ? t.detail.comms.retry : t.detail.comms.send}
          </button>
        ) : null}
      </div>
      <p className="adm-help">{t.detail.comms.openMailAppNote}</p>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t.detail.comms.sendTitle}
        closeLabel={t.common.close}
        testId="send-dialog"
        footer={
          <>
            <button type="button" className="adm-btn" onClick={() => setConfirm(false)}>
              {t.common.cancel}
            </button>
            <button type="button" className="adm-btn adm-btn--primary" onClick={send} aria-disabled={busy || undefined} data-testid="send-confirm">
              {busy ? <span className="adm-spinner" /> : <IconSend size={16} />}
              {t.detail.comms.sendConfirm}
            </button>
          </>
        }
      >
        <p>{t.detail.comms.sendReview}</p>
        <dl className="adm-dl">
          <dt>{t.detail.comms.sendTo}</dt>
          <dd className="adm-ltr">{to}</dd>
          <dt>{t.detail.comms.sendSubject}</dt>
          <dd>
            <bdi>{subject}</bdi>
          </dd>
          <dt>{t.detail.comms.sendFiles}</dt>
          <dd>{attached.length ? attached.map((f) => <bdi key={f.id} style={{ display: 'block' }}>{f.originalName}</bdi>) : t.detail.comms.sendNoFiles}</dd>
        </dl>
        {c.transport === 'outbox' ? (
          <p className="adm-alert adm-alert--warn">
            <IconInfo size={16} />
            <span>{t.detail.comms.transportOutbox}</span>
          </p>
        ) : null}
      </Dialog>
    </div>
  );
}

function MessageCard({ c, m }: { c: Ctx; m: Msg }) {
  const { t, locale } = c;
  const editable = (m.status === 'draft' || m.status === 'failed') && c.d.permissions.draft;
  const tone = m.status === 'failed' ? 'danger' : m.status === 'sent' ? 'ok' : m.status === 'test_delivered' || m.status === 'sent_offline' ? 'info' : 'muted';
  const stuck = m.status === 'sending' && c.now.getTime() - new Date(m.updatedAt).getTime() > 5 * 60 * 1000;
  return (
    <li className="adm-message adm-stack--sm" data-testid="message">
      <div className="adm-message__meta">
        <span className="adm-kind-label adm-kind-label--client">
          <IconSend size={14} />
          {t.detail.comms.title}
        </span>
        <span className="adm-badge" data-tone={tone} data-testid="message-status">
          {t.messageStatus[m.status]}
        </span>
        <span>{t.languages[m.language]}</span>
        <span>{fmt(t.detail.comms.createdBy, { name: m.authorName ?? t.common.formerMember, date: formatDateTime(locale, m.createdAt, c.timezone) })}</span>
        {m.sentAt ? <span>{fmt(t.detail.comms.sentAt, { date: formatDateTime(locale, m.sentAt, c.timezone) })}</span> : null}
      </div>
      {editable ? (
        <DraftEditor c={c} m={m} />
      ) : (
        <>
          <p>
            <strong>{t.detail.comms.to}:</strong> <span className="adm-ltr">{m.toEmail}</span>
          </p>
          <p>
            <bdi>
              <strong>{m.subject}</strong>
            </bdi>
          </p>
          <p className="adm-pre" dir="auto" lang={m.language}>
            {m.body}
          </p>
          {m.isProposal ? <p className="adm-help">{t.detail.comms.proposalSendHint}</p> : null}
          {stuck && c.d.permissions.send ? (
            <button type="button" className="adm-btn adm-btn--sm" onClick={() => c.act(() => markMessageFailedAction(m.id), t.common.saved)}>
              {t.detail.comms.markFailed}
            </button>
          ) : null}
        </>
      )}
    </li>
  );
}

function ProposalItem({ c, p }: { c: Ctx; p: Ctx['d']['proposals'][number] }) {
  const { t, locale } = c;
  const uid = useId();
  const [issue, setIssue] = useState(p.issueDate);
  const [expiry, setExpiry] = useState(p.expiryDate ?? '');
  const [amount, setAmount] = useState(p.amount ?? '');
  const [currency, setCurrency] = useState(p.currency ?? '');
  const file = c.d.files.find((f) => f.id === p.attachmentId);
  const editable = p.status === 'draft' && c.d.permissions.proposal;
  return (
    <li className="adm-file" style={{ gridTemplateColumns: '1fr' }}>
      <div className="adm-row">
        <strong>{fmt(t.detail.proposals.version, { version: p.version })}</strong>
        <span className="adm-badge" data-tone={p.status === 'sent' ? 'ok' : 'muted'}>
          {p.status === 'sent' && p.sentAt ? fmt(t.detail.proposals.sent, { date: formatDateTime(locale, p.sentAt, c.timezone) }) : t.detail.proposals.draft}
        </span>
        {file ? <bdi dir="auto" className="adm-muted">{file.originalName}</bdi> : null}
      </div>
      {editable ? (
        <div className="adm-form-grid">
          <div className="adm-field">
            <label htmlFor={`${uid}-i`} className="adm-label">
              {t.detail.proposals.issueDate}
            </label>
            <input id={`${uid}-i`} type="date" className="adm-input" value={issue} onChange={(e) => setIssue(e.target.value)} />
          </div>
          <div className="adm-field">
            <label htmlFor={`${uid}-e`} className="adm-label">
              {t.detail.proposals.expiryDate}
            </label>
            <input id={`${uid}-e`} type="date" className="adm-input" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </div>
          <div className="adm-field">
            <label htmlFor={`${uid}-a`} className="adm-label">
              {t.detail.proposals.amount}
            </label>
            <input id={`${uid}-a`} className="adm-input adm-ltr" dir="ltr" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="adm-field">
            <label htmlFor={`${uid}-c`} className="adm-label">
              {t.detail.proposals.currency}
            </label>
            <select id={`${uid}-c`} className="adm-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="">{t.detail.proposals.noCurrency}</option>
              {CURRENCIES.map((cur) => (
                <option key={cur} value={cur}>
                  {cur}
                </option>
              ))}
            </select>
          </div>
          <div style={{ alignSelf: 'end' }}>
            <button type="button" className="adm-btn" onClick={() => c.act(() => updateProposalAction(p.id, { issueDate: issue, expiryDate: expiry, amount, currency }), t.common.saved)}>
              {t.detail.proposals.saveChanges}
            </button>
          </div>
        </div>
      ) : (
        <p className="adm-small adm-muted">
          {t.detail.proposals.issueDate}: <span className="adm-ltr">{p.issueDate}</span>
          {p.expiryDate ? (
            <>
              {' · '}
              {t.detail.proposals.expiryDate}: <span className="adm-ltr">{p.expiryDate}</span>
            </>
          ) : null}
          {p.amount ? (
            <>
              {' · '}
              <span className="adm-ltr">
                {p.amount} {p.currency}
              </span>
            </>
          ) : null}
          {p.status === 'sent' ? <span style={{ display: 'block' }}>{t.detail.proposals.immutable}</span> : null}
        </p>
      )}
    </li>
  );
}

function ProposalUpload({ c }: { c: Ctx }) {
  const { t, d } = c;
  const uid = useId();
  const today = toLocalInputValue(c.now, c.timezone).slice(0, 10);
  const [file, setFile] = useState<File | null>(null);
  const [issue, setIssue] = useState(today);
  const [expiry, setExpiry] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [inputKey, setInputKey] = useState(0);

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError('');
    const form = new FormData();
    form.set('requestId', d.request.id);
    form.set('file', file);
    form.set('issueDate', issue);
    form.set('expiryDate', expiry);
    form.set('amount', amount);
    form.set('currency', currency);
    try {
      const res = await fetch('/api/admin/proposals', { method: 'POST', body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(errorText(t, body.code ?? 'unavailable', body.details));
        return;
      }
      setFile(null);
      setInputKey((k) => k + 1);
      setAmount('');
      setCurrency('');
      setExpiry('');
      await c.act(async () => ({ ok: true as const, data: null }), t.common.saved);
    } catch {
      setError(t.errors.unavailable);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-stack--sm" data-testid="proposal-upload">
      <h4 className="adm-h3">{t.detail.proposals.upload}</h4>
      <div className="adm-form-grid">
        <div className="adm-field">
          <span className="adm-label" id={`${uid}-fl`}>
            {t.detail.proposals.file}
          </span>
          <span className="adm-file-picker">
            <input
              key={inputKey}
              id={`${uid}-f`}
              type="file"
              accept="application/pdf,.pdf"
              aria-labelledby={`${uid}-fl ${uid}-fb`}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              data-testid="proposal-file"
            />
            <label htmlFor={`${uid}-f`} id={`${uid}-fb`} className="adm-btn adm-btn--sm">
              {t.detail.proposals.choose}
            </label>
            <bdi className="adm-file-picker__name" dir="auto">
              {file ? file.name : t.detail.proposals.noFile}
            </bdi>
          </span>
        </div>
        <div className="adm-field">
          <label htmlFor={`${uid}-i`} className="adm-label">
            {t.detail.proposals.issueDate}
          </label>
          <input id={`${uid}-i`} type="date" className="adm-input" value={issue} onChange={(e) => setIssue(e.target.value)} />
        </div>
        <div className="adm-field">
          <label htmlFor={`${uid}-e`} className="adm-label">
            {t.detail.proposals.expiryDate}
          </label>
          <input id={`${uid}-e`} type="date" className="adm-input" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </div>
        <div className="adm-field">
          <label htmlFor={`${uid}-a`} className="adm-label">
            {t.detail.proposals.amount}
          </label>
          <input id={`${uid}-a`} className="adm-input adm-ltr" dir="ltr" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="adm-field">
          <label htmlFor={`${uid}-c`} className="adm-label">
            {t.detail.proposals.currency}
          </label>
          <select id={`${uid}-c`} className="adm-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="">{t.detail.proposals.noCurrency}</option>
            {CURRENCIES.map((cur) => (
              <option key={cur} value={cur}>
                {cur}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error ? (
        <p className="adm-error-text" role="alert">
          <IconAlert size={16} />
          {error}
        </p>
      ) : null}
      <div>
        <button type="button" className="adm-btn" onClick={upload} aria-disabled={!file || busy || undefined} data-testid="proposal-add">
          {busy ? <span className="adm-spinner" /> : null}
          {t.detail.proposals.add}
        </button>
      </div>
    </div>
  );
}

function OfflineSend({ c }: { c: Ctx }) {
  const { t, d } = c;
  const uid = useId();
  const today = toLocalInputValue(c.now, c.timezone).slice(0, 10);
  const [date, setDate] = useState(today);
  const [note, setNote, clearNote] = useDraft(`offline:${d.request.id}`);
  const [proposalId, setProposalId] = useState('');
  async function save() {
    const res = await c.act(() => recordOfflineSendAction(d.request.id, { sentOn: date, note, proposalId: proposalId || null }), t.common.saved);
    if (res.ok) {
      clearNote();
      setProposalId('');
    }
  }
  return (
    <details className="adm-card">
      <summary className="adm-card__head" style={{ cursor: 'pointer' }}>
        <span className="adm-h3">{t.detail.comms.offlineTitle}</span>
      </summary>
      <div className="adm-card__body adm-stack--sm">
        <p className="adm-help">{t.detail.comms.offlineLead}</p>
        <div className="adm-form-grid">
          <div className="adm-field">
            <label htmlFor={`${uid}-d`} className="adm-label">
              {t.detail.comms.offlineDate}
            </label>
            <input id={`${uid}-d`} type="date" className="adm-input" max={today} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="adm-field">
            <label htmlFor={`${uid}-p`} className="adm-label">
              {t.detail.comms.offlineProposal}
            </label>
            <select id={`${uid}-p`} className="adm-select" value={proposalId} onChange={(e) => setProposalId(e.target.value)}>
              <option value="">{t.common.none}</option>
              {d.proposals.map((p) => (
                <option key={p.id} value={p.id}>
                  {fmt(t.detail.proposals.version, { version: p.version })}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="adm-field">
          <label htmlFor={`${uid}-n`} className="adm-label">
            {t.detail.comms.offlineNote}
          </label>
          <textarea id={`${uid}-n`} className="adm-textarea" dir="auto" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div>
          <button type="button" className="adm-btn" onClick={save} aria-disabled={!note.trim() || undefined} data-testid="offline-save">
            {t.detail.comms.offlineSave}
          </button>
        </div>
      </div>
    </details>
  );
}

export function CommsTab({ c }: { c: Ctx }) {
  const { t, d } = c;
  const uid = useId();
  const [template, setTemplate] = useState<string>('acknowledgement');
  const [busy, setBusy] = useState(false);
  const transportText = c.transport === 'none' ? t.detail.comms.transportNone : c.transport === 'outbox' ? t.detail.comms.transportOutbox : t.detail.comms.transportSmtp;

  async function create() {
    setBusy(true);
    const attach = template === 'proposal_cover' ? d.files.filter((f) => f.kind === 'proposal' && f.downloadable).slice(-1).map((f) => f.id) : [];
    const res = await c.act(() => createDraftAction(d.request.id, template === 'blank' ? null : template, attach));
    setBusy(false);
    if (!res.ok) notify(errorText(t, res.code, res.details), 'error');
  }

  return (
    <div className="adm-stack">
      <p className={`adm-alert ${c.transport === 'smtp' ? 'adm-alert--info' : 'adm-alert--warn'}`} data-testid="transport-note">
        <IconInfo size={16} />
        <span>{transportText}</span>
      </p>
      <p className="adm-help">{t.detail.comms.notice}</p>
      {d.permissions.draft && d.request.disposition === 'active' ? (
        <div className="adm-card">
          <div className="adm-card__body adm-stack--sm">
            <h4 className="adm-h3">{t.detail.comms.newDraft}</h4>
            <p className="adm-help">{fmt(t.detail.comms.draftLanguage, { lang: t.languages[d.request.submissionLocale] })}</p>
            <div className="adm-row" style={{ alignItems: 'flex-end' }}>
              <div className="adm-field">
                <label htmlFor={`${uid}-tpl`} className="adm-label">
                  {t.detail.comms.template}
                </label>
                <select id={`${uid}-tpl`} className="adm-select" value={template} onChange={(e) => setTemplate(e.target.value)} data-testid="template-select">
                  {Object.entries(t.detail.comms.templates).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" className="adm-btn" onClick={create} aria-disabled={busy || undefined} data-testid="draft-create">
                {t.detail.comms.createDraft}
              </button>
            </div>
          </div>
        </div>
      ) : !d.permissions.draft ? (
        <p className="adm-help">{t.detail.comms.readOnly}</p>
      ) : null}
      {d.messages.length ? (
        <ul className="adm-stack" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {d.messages.map((m) => (
            <MessageCard key={m.id} c={c} m={m} />
          ))}
        </ul>
      ) : (
        <p className="adm-muted">{t.detail.comms.empty}</p>
      )}
      {d.permissions.send ? <OfflineSend c={c} /> : null}
      <section className="adm-card" aria-labelledby={`${uid}-prop`}>
        <div className="adm-card__head">
          <h3 id={`${uid}-prop`} className="adm-h2">
            {t.detail.proposals.title}
          </h3>
        </div>
        <div className="adm-card__body adm-stack">
          <p className="adm-help">{t.detail.proposals.lead}</p>
          {d.proposals.length ? (
            <ul className="adm-files" data-testid="proposals">
              {d.proposals.map((p) => (
                <ProposalItem key={p.id} c={c} p={p} />
              ))}
            </ul>
          ) : (
            <p className="adm-muted">{t.detail.proposals.empty}</p>
          )}
          {d.permissions.proposal && d.request.disposition === 'active' ? <ProposalUpload c={c} /> : null}
        </div>
      </section>
    </div>
  );
}
