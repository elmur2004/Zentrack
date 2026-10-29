'use client';

import { useId, useState } from 'react';
import { fmt } from '@/i18n/format';
import { CLARIFY_FIELDS } from '@/lib/admin/codes';
import { formatBytes, formatDateTime } from '@/lib/admin/format';
import { addClarificationAction, addNoteAction, editNoteAction, fileLinkAction, releaseFileAction } from '@/server/actions/admin';
import { Dialog } from '../Dialog';
import { errorText, notify, run, useDraft } from '../runtime';
import { IconDownload, IconEye, IconFile, IconLock, IconNote } from '../icons';
import type { Ctx } from './types';

// ------------------------------------------------------------------ overview
export function OverviewTab({ c }: { c: Ctx }) {
  const { t, d, locale } = c;
  const r = d.request;
  const uid = useId();
  const [field, setField] = useState<string>('company');
  const [value, setValue, clearValue] = useDraft(`clarify:${r.id}`);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function addClarification() {
    setBusy(true);
    const res = await c.act(() => addClarificationAction(r.id, { field, value, note }), t.common.saved);
    setBusy(false);
    if (res.ok) {
      clearValue();
      setNote('');
    }
  }

  return (
    <div className="adm-stack">
      <section className="adm-card" aria-labelledby={`${uid}-contact`}>
        <div className="adm-card__head">
          <h3 id={`${uid}-contact`} className="adm-h2">
            {t.detail.contact}
          </h3>
        </div>
        <div className="adm-card__body">
          <dl className="adm-dl">
            <dt>{t.detail.name}</dt>
            <dd>
              <bdi>{r.contactName}</bdi>
            </dd>
            <dt>{t.detail.company}</dt>
            <dd>
              <bdi>{r.company}</bdi>
            </dd>
            <dt>{t.detail.email}</dt>
            <dd>
              <a className="adm-link adm-ltr" dir="ltr" href={`mailto:${r.email}`}>
                {r.email}
              </a>
            </dd>
            <dt>{t.detail.phone}</dt>
            <dd>
              {r.phone ? (
                <a className="adm-link adm-ltr" dir="ltr" href={`tel:${r.phone}`}>
                  {r.phone}
                </a>
              ) : (
                <span className="adm-muted">{t.common.dash}</span>
              )}
            </dd>
            <dt>{t.detail.country}</dt>
            <dd>
              {c.labels.countries[r.countryCode] ?? r.countryCode} <span className="adm-muted adm-ltr">({r.countryCode})</span>
            </dd>
          </dl>
        </div>
      </section>

      <section className="adm-card" aria-labelledby={`${uid}-enq`}>
        <div className="adm-card__head">
          <h3 id={`${uid}-enq`} className="adm-h2">
            {t.detail.enquiry}
          </h3>
        </div>
        <div className="adm-card__body adm-stack">
          <dl className="adm-dl">
            <dt>{t.detail.services}</dt>
            <dd>
              <span className="adm-table__services">
                {d.services.map((s) => (
                  <span key={s} className="adm-chip">
                    {c.labels.services[s] ?? s}
                  </span>
                ))}
              </span>
            </dd>
            <dt>{t.detail.scope}</dt>
            <dd>{r.engagementScope ? (c.labels.scopes[r.engagementScope] ?? r.engagementScope) : <span className="adm-muted">{t.detail.noScope}</span>}</dd>
          </dl>
          <div className="adm-stack--sm">
            <h4 className="adm-h3">{t.detail.description}</h4>
            <p className="adm-help">{t.detail.descriptionNote}</p>
            {/* Original customer text, rendered as text with its own direction; never translated or edited. */}
            <div className="adm-description" dir="auto" lang={r.submissionLocale} data-testid="description">
              {r.description}
            </div>
          </div>
        </div>
      </section>

      <section className="adm-card" aria-labelledby={`${uid}-clar`}>
        <div className="adm-card__head">
          <h3 id={`${uid}-clar`} className="adm-h2">
            {t.detail.clarifications}
          </h3>
        </div>
        <div className="adm-card__body adm-stack">
          {d.clarifications.length ? (
            <ul className="adm-list">
              {d.clarifications.map((x) => (
                <li key={x.id}>
                  <span className="adm-stack--sm" style={{ gap: 2 }}>
                    <strong>{(t.detail.clarifyFields as Record<string, string>)[x.field] ?? x.field}</strong>
                    <bdi className="adm-pre">{x.value}</bdi>
                    {x.note ? <bdi className="adm-small adm-muted adm-pre">{x.note}</bdi> : null}
                  </span>
                  <span className="adm-small adm-muted">{fmt(t.detail.clarifiedBy, { name: x.authorName ?? t.common.formerMember, date: formatDateTime(locale, x.createdAt, c.timezone) })}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="adm-muted">{t.detail.clarificationsEmpty}</p>
          )}
          {d.permissions.clarify ? (
            <div className="adm-stack--sm" data-testid="clarify-form">
              <h4 className="adm-h3">{t.detail.addClarification}</h4>
              <div className="adm-form-grid">
                <div className="adm-field">
                  <label htmlFor={`${uid}-cf`} className="adm-label">
                    {t.detail.clarifyField}
                  </label>
                  <select id={`${uid}-cf`} className="adm-select" value={field} onChange={(e) => setField(e.target.value)}>
                    {CLARIFY_FIELDS.map((f) => (
                      <option key={f} value={f}>
                        {t.detail.clarifyFields[f]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="adm-field">
                  <label htmlFor={`${uid}-cv`} className="adm-label">
                    {t.detail.clarifyValue}
                  </label>
                  <input id={`${uid}-cv`} className="adm-input" dir="auto" maxLength={2000} value={value} onChange={(e) => setValue(e.target.value)} />
                </div>
                <div className="adm-field">
                  <label htmlFor={`${uid}-cn`} className="adm-label">
                    {t.detail.clarifyNote}
                  </label>
                  <input id={`${uid}-cn`} className="adm-input" dir="auto" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
              </div>
              <div>
                <button type="button" className="adm-btn" onClick={addClarification} aria-disabled={!value.trim() || busy || undefined}>
                  {t.detail.clarifySave}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="adm-card" aria-labelledby={`${uid}-origin`}>
        <div className="adm-card__head">
          <h3 id={`${uid}-origin`} className="adm-h2">
            {t.detail.origin}
          </h3>
        </div>
        <div className="adm-card__body adm-stack--sm">
          <dl className="adm-dl">
            <dt>{t.detail.sourcePage}</dt>
            <dd className="adm-ltr">{r.sourcePage ?? t.common.dash}</dd>
            <dt>{t.detail.sourceService}</dt>
            <dd>{r.sourceService ? (c.labels.services[r.sourceService] ?? r.sourceService) : t.common.dash}</dd>
          </dl>
          {r.privacyAcknowledgedAt ? (
            <p className="adm-small adm-muted">
              {fmt(t.detail.privacy, { date: formatDateTime(locale, r.privacyAcknowledgedAt, c.timezone), version: r.privacyPolicyVersion ?? t.common.dash })}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

// --------------------------------------------------------------------- files
export function FilesTab({ c }: { c: Ctx }) {
  const { t, d, locale } = c;
  const [release, setRelease] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function open(id: string, mode: 'download' | 'preview') {
    // Open the preview window within the click (popup blockers), then point it at the short-lived link.
    const w = mode === 'preview' ? window.open('', '_blank') : null;
    if (w) w.opener = null;
    setBusy(id);
    const res = await run(() => fileLinkAction(id, mode));
    setBusy(null);
    if (!res.ok) {
      w?.close();
      notify(errorText(t, res.code, res.details), 'error');
      return;
    }
    if (w) w.location.href = res.data.url;
    else window.location.assign(res.data.url);
  }

  async function doRelease() {
    if (!release) return;
    const id = release;
    const res = await c.act(() => releaseFileAction(id), t.common.saved);
    if (res.ok) setRelease(null);
  }

  return (
    <div className="adm-stack">
      <p className="adm-alert adm-alert--info">
        <IconLock size={16} />
        <span>{t.detail.files.private}</span>
      </p>
      {d.files.length === 0 ? (
        <div className="adm-empty">
          <IconFile size={36} />
          <p>{t.detail.files.empty}</p>
        </div>
      ) : (
        <ul className="adm-files" aria-label={t.detail.files.title} data-testid="files">
          {d.files.map((f) => {
            const tone = f.scanState === 'infected' ? 'danger' : f.scanState === 'clean' || f.scanState === 'released' ? 'ok' : 'warn';
            return (
              <li key={f.id} className="adm-file">
                <IconFile size={22} />
                <span className="adm-stack--sm" style={{ gap: 2, minInlineSize: 0 }}>
                  <bdi className="adm-file__name" dir="auto">
                    {f.originalName}
                  </bdi>
                  <span className="adm-file__meta">
                    <span>{t.detail.files.kinds[f.kind]}</span>
                    <span>{formatBytes(locale, f.sizeBytes)}</span>
                    <span>{formatDateTime(locale, f.createdAt, c.timezone)}</span>
                    <span>{f.kind === 'proposal' ? fmt(t.detail.files.fromStaff, { name: f.uploadedByName ?? t.common.formerMember }) : t.detail.files.fromClient}</span>
                  </span>
                  <span className="adm-badge" data-tone={tone} style={{ justifySelf: 'start' }} data-testid="scan-state">
                    {t.scan[f.scanState]}
                  </span>
                </span>
                <span className="adm-file__actions">
                  {f.downloadable && d.permissions.download ? (
                    <>
                      {f.mimeType.startsWith('image/') ? (
                        <button type="button" className="adm-btn adm-btn--sm" onClick={() => open(f.id, 'preview')} aria-disabled={busy === f.id || undefined}>
                          <IconEye size={16} />
                          {t.common.preview}
                        </button>
                      ) : null}
                      <button type="button" className="adm-btn adm-btn--sm" onClick={() => open(f.id, 'download')} aria-disabled={busy === f.id || undefined} data-testid="file-download">
                        <IconDownload size={16} />
                        {busy === f.id ? t.detail.files.opening : t.common.download}
                      </button>
                    </>
                  ) : (
                    <span className="adm-small adm-muted">{t.detail.files.unavailable}</span>
                  )}
                  {f.scanState === 'unscanned' && d.permissions.release ? (
                    <button type="button" className="adm-btn adm-btn--sm" onClick={() => setRelease(f.id)} data-testid="file-release">
                      {t.detail.files.release}
                    </button>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <Dialog
        open={!!release}
        onClose={() => setRelease(null)}
        title={t.detail.files.releaseTitle}
        closeLabel={t.common.close}
        footer={
          <>
            <button type="button" className="adm-btn" onClick={() => setRelease(null)}>
              {t.common.cancel}
            </button>
            <button type="button" className="adm-btn adm-btn--primary" onClick={doRelease} data-testid="release-confirm">
              {t.detail.files.release}
            </button>
          </>
        }
      >
        <p>{t.detail.files.releaseText}</p>
      </Dialog>
    </div>
  );
}

// --------------------------------------------------------------------- notes
function NoteItem({ c, n }: { c: Ctx; n: Ctx['d']['notes'][number] }) {
  const { t, locale } = c;
  const uid = useId();
  const [editing, setEditing] = useState(false);
  const [text, setText, clearText] = useDraft(`note-edit:${n.id}`, n.body);
  async function save() {
    const res = await c.act(() => editNoteAction(n.id, text, n.revision), t.common.saved);
    if (res.ok) {
      clearText();
      setEditing(false);
    }
  }
  return (
    <li className="adm-note">
      <div className="adm-note__meta">
        <span className="adm-kind-label adm-kind-label--note">
          <IconNote size={14} />
          {t.detail.notes.title}
        </span>
        <span>{fmt(t.detail.notes.by, { name: n.authorName ?? t.common.formerMember, date: formatDateTime(locale, n.createdAt, c.timezone) })}</span>
        {n.editedAt ? <span>· {t.detail.notes.edited}</span> : null}
      </div>
      {editing ? (
        <div className="adm-stack--sm">
          <label htmlFor={`${uid}-e`} className="adm-sr-live">
            {t.common.edit}
          </label>
          <textarea id={`${uid}-e`} className="adm-textarea" dir="auto" value={text} maxLength={5000} onChange={(e) => setText(e.target.value)} />
          <div className="adm-row">
            <button type="button" className="adm-btn adm-btn--sm adm-btn--primary" onClick={save} aria-disabled={!text.trim() || undefined}>
              {t.detail.notes.save}
            </button>
            <button
              type="button"
              className="adm-btn adm-btn--sm"
              onClick={() => {
                clearText();
                setEditing(false);
              }}
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="adm-pre" dir="auto">
            {n.body}
          </p>
          {n.mine && c.d.permissions.note ? (
            <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost" onClick={() => setEditing(true)}>
              {t.common.edit}
            </button>
          ) : null}
        </>
      )}
    </li>
  );
}

export function NotesTab({ c }: { c: Ctx }) {
  const { t, d } = c;
  const uid = useId();
  const [body, setBody, clearBody] = useDraft(`note:${d.request.id}`);
  const [busy, setBusy] = useState(false);
  async function add() {
    setBusy(true);
    const res = await c.act(() => addNoteAction(d.request.id, body), t.common.saved);
    setBusy(false);
    if (res.ok) clearBody();
  }
  return (
    <div className="adm-stack">
      <p className="adm-alert adm-alert--warn">
        <IconLock size={16} />
        <span>{t.detail.notes.notice}</span>
      </p>
      {d.notes.length ? (
        <ul className="adm-stack--sm" style={{ listStyle: 'none', margin: 0, padding: 0 }} data-testid="notes">
          {d.notes.map((n) => (
            <NoteItem key={n.id} c={c} n={n} />
          ))}
        </ul>
      ) : (
        <p className="adm-muted">{t.detail.notes.empty}</p>
      )}
      {d.permissions.note ? (
        <div className="adm-note-composer adm-stack--sm">
          <label htmlFor={`${uid}-n`} className="adm-label">
            <span className="adm-kind-label adm-kind-label--note">
              <IconNote size={14} />
              {t.detail.notes.composer}
            </span>
          </label>
          <textarea id={`${uid}-n`} className="adm-textarea" dir="auto" value={body} maxLength={5000} onChange={(e) => setBody(e.target.value)} data-testid="note-input" />
          <div>
            <button type="button" className="adm-btn" onClick={add} aria-disabled={!body.trim() || busy || undefined} data-testid="note-add">
              {busy ? <span className="adm-spinner" /> : null}
              {t.detail.notes.add}
            </button>
          </div>
        </div>
      ) : (
        <p className="adm-help">{t.detail.notes.noPermission}</p>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ activity
export function ActivityTab({ c }: { c: Ctx }) {
  const { t, d, locale } = c;
  const actions = t.detail.activity.actions as Record<string, string>;
  const items = [
    ...d.statusEvents.map((e) => ({
      id: e.id,
      at: new Date(e.createdAt),
      title: e.fromStatus ? fmt(t.detail.activity.statusChange, { from: t.status[e.fromStatus as keyof typeof t.status], to: t.status[e.toStatus as keyof typeof t.status] }) : t.detail.activity.initial,
      actor: e.fromStatus ? (e.actorName ?? t.common.formerMember) : t.common.system,
      extra: [e.reason ? fmt(t.detail.activity.reason, { reason: e.reason }) : '', e.evidenceMessageId ? t.detail.activity.evidence : ''].filter(Boolean),
    })),
    ...d.activity
      .filter((a) => a.action !== 'request.received')
      .map((a) => ({ id: a.id, at: new Date(a.createdAt), title: actions[a.action] ?? a.action, actor: a.actorName ?? t.common.system, extra: [] as string[] })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());
  if (!items.length) return <p className="adm-muted">{t.detail.activity.empty}</p>;
  return (
    <ol className="adm-timeline" data-testid="timeline">
      {items.map((i) => (
        <li key={i.id}>
          <span className="adm-timeline__time">
            {formatDateTime(locale, i.at, c.timezone)} · {i.actor}
          </span>
          <span>{i.title}</span>
          {i.extra.map((x) => (
            <span key={x} className="adm-small adm-muted adm-pre" style={{ display: 'block' }}>
              {x}
            </span>
          ))}
        </li>
      ))}
    </ol>
  );
}
