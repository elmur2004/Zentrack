'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import type { Locale } from '@/i18n/config';
import { getAdminMessages } from '@/i18n/admin';
import { fmt, plural } from '@/i18n/format';
import type { ApplicationKind, ApplicationStatus, Disposition } from '@/lib/admin/codes';
import { formatBytes, formatDateTime } from '@/lib/admin/format';
import {
  addApplicationNoteAction,
  changeApplicationStatusAction,
  deleteApplicationAction,
  fileLinkAction,
  releaseFileAction,
  setApplicationDispositionAction,
} from '@/server/actions/admin';
import { Rich } from '@/components/ui/Rich';
import { Dialog } from './Dialog';
import { errorText, listMemory, notify, run, useDraft, type Result } from './runtime';
import { IconAlert, IconArrowBack, IconCopy, IconDownload, IconExternal, IconFile, IconLock, IconMail, IconNote, StatusGlyph } from './icons';

export interface ApplicationDetailData {
  application: {
    id: string;
    reference: string;
    kind: ApplicationKind;
    createdAt: string | Date;
    updatedAt: string | Date;
    version: number;
    contactName: string;
    company: string | null;
    email: string;
    phone: string | null;
    countryCode: string | null;
    partnerType: string | null;
    discipline: string | null;
    experienceYears: number | null;
    portfolioUrl: string | null;
    description: string | null;
    submissionLocale: 'en' | 'ar';
    sourcePage: string | null;
    privacyAcknowledgedAt: string | Date | null;
    privacyPolicyVersion: string | null;
    status: ApplicationStatus;
    statusChangedAt: string | Date;
    outcomeReason: string | null;
    disposition: Disposition;
    dispositionAt: string | Date | null;
    dispositionReason: string | null;
  };
  files: Array<{ id: string; originalName: string; sizeBytes: number; mimeType: string; scanState: string; createdAt: string | Date; downloadable: boolean }>;
  notes: Array<{ id: string; body: string; createdAt: string | Date; authorName: string | null }>;
  activity: Array<{ id: string; action: string; metadata: unknown; createdAt: string | Date; actorName: string | null }>;
  permissions: { status: boolean; note: boolean; release: boolean; archive: boolean; spam: boolean; delete: boolean };
  transitions: ApplicationStatus[];
}

interface Props {
  locale: Locale;
  detail: ApplicationDetailData;
  labels: { partnerTypes: Record<string, string>; disciplines: Record<string, string>; countries: Record<string, string> };
  timezone: string;
}

/** Only http(s) links are rendered as links (the schema already rejects anything else). */
function safeHttpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}

export function ApplicationWorkspace({ locale, detail: d, labels, timezone }: Props) {
  const t = getAdminMessages(locale);
  const a = t.applications;
  const x = a.detail;
  const router = useRouter();
  const uid = useId();
  const r = d.application;
  const [backHref, setBackHref] = useState(`/${locale}/admin/applications`);
  const [conflict, setConflict] = useState(false);
  const [to, setTo] = useState<ApplicationStatus | ''>('');
  const [reason, setReason] = useState('');
  const [note, setNote, clearNote] = useDraft(`app-note:${r.id}`);
  const [busy, setBusy] = useState<string | null>(null);
  const [release, setRelease] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | Disposition>(null);
  const [del, setDel] = useState(false);
  const [typed, setTyped] = useState('');
  const [delError, setDelError] = useState('');

  useEffect(() => {
    const remembered = listMemory.lastListHref;
    if (remembered && /^\/(en|ar)\/admin\/applications/.test(remembered)) setBackHref(remembered.replace(/^\/(en|ar)\//, `/${locale}/`)); // eslint-disable-line react-hooks/set-state-in-effect -- read client memory after mount
  }, [locale]);
  useEffect(() => setConflict(false), [r.version]); // eslint-disable-line react-hooks/set-state-in-effect -- reset on fresh data

  async function act<T>(fn: () => Promise<unknown>, okText?: string): Promise<Result<T>> {
    const res = (await run(fn as () => Promise<Result<T>>)) as Result<T>;
    if (res.ok) {
      if (okText) notify(okText);
      router.refresh();
    } else {
      if (res.code === 'conflict') setConflict(true);
      notify(errorText(t, res.code, res.details), 'error');
    }
    return res;
  }

  const kind = a.kinds[r.kind];
  const country = r.countryCode ? `${labels.countries[r.countryCode] ?? r.countryCode}` : null;
  const portfolio = safeHttpUrl(r.portfolioUrl);
  const needsReason = r.status === 'closed';

  async function updateStatus() {
    if (!to) return;
    setBusy('status');
    const res = await act(() => changeApplicationStatusAction(r.id, { to, reason, expectedVersion: r.version }), t.common.saved);
    setBusy(null);
    if (res.ok) {
      setTo('');
      setReason('');
    }
  }

  async function addNote() {
    setBusy('note');
    const res = await act(() => addApplicationNoteAction(r.id, note), t.common.saved);
    setBusy(null);
    if (res.ok) clearNote();
  }

  async function download(id: string) {
    setBusy(id);
    const res = await run(() => fileLinkAction(id, 'download'));
    setBusy(null);
    if (!res.ok) return notify(errorText(t, res.code, res.details), 'error');
    window.location.assign(res.data.url);
  }

  async function doRelease() {
    if (!release) return;
    const id = release;
    const res = await act(() => releaseFileAction(id), t.common.saved);
    if (res.ok) setRelease(null);
  }

  async function applyDisposition() {
    if (!confirm) return;
    setBusy('disposition');
    const res = await act(() => setApplicationDispositionAction([r.id], confirm), t.common.saved);
    setBusy(null);
    if (res.ok) setConfirm(null);
  }

  async function remove() {
    setBusy('delete');
    setDelError('');
    const res = await run(() => deleteApplicationAction(r.id, typed));
    setBusy(null);
    if (!res.ok) return setDelError(errorText(t, res.code, res.details));
    notify(fmt(x.deleteDone, { ref: res.data.reference }));
    setDel(false);
    router.push(`/${locale}/admin/applications${r.disposition === 'spam' ? '?view=spam' : r.disposition === 'archived' ? '?view=archived' : ''}`);
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(r.email);
      notify(t.common.copied);
    } catch {
      notify(t.errors.unavailable, 'error');
    }
  }

  const status = (code: unknown) => (typeof code === 'string' && code in a.status ? a.status[code as ApplicationStatus] : String(code ?? ''));
  const activityText = (e: ApplicationDetailData['activity'][number]) => {
    const m = (e.metadata ?? {}) as Record<string, unknown>;
    const label = (x.actions as Record<string, string>)[e.action] ?? e.action;
    return e.action === 'application.status_changed' ? fmt(label, { from: status(m.from), to: status(m.to) }) : label;
  };
  const dispositionTitles = { archived: x.archive, spam: x.spam, active: x.restore };
  const dispositionTexts = { archived: t.inbox.confirm.archiveText, spam: t.inbox.confirm.spamText, active: t.inbox.confirm.restoreText };
  const canRestore = r.disposition !== 'active' && (r.disposition === 'archived' ? d.permissions.archive : d.permissions.spam);

  return (
    <div className="adm-stack" data-testid="application">
      <div>
        <Link href={backHref} className="adm-back">
          <IconArrowBack size={16} className="adm-flip" />
          {x.back}
        </Link>
        <div className="adm-detail__head">
          <h1 className="adm-h1" data-testid="application-title">
            <Rich text={x.title} values={{ kind, ref: <bdi dir="ltr">{r.reference}</bdi> }} />
          </h1>
          <span className="adm-badge" data-status={r.status} data-testid="application-status">
            <StatusGlyph status={r.status} />
            <span>{a.status[r.status]}</span>
          </span>
          {r.disposition !== 'active' ? (
            <span className="adm-badge" data-tone="muted">
              {t.disposition[r.disposition]}
            </span>
          ) : null}
        </div>
        <p className="adm-muted adm-small">
          {fmt(x.received, { date: formatDateTime(locale, r.createdAt, timezone, { withZone: true }) })} · {fmt(x.submissionLanguage, { lang: t.languages[r.submissionLocale] })}
        </p>
      </div>

      {r.disposition !== 'active' ? (
        <p className="adm-alert adm-alert--warn">
          <IconAlert size={16} />
          <span>{r.disposition === 'spam' ? x.spamBanner : x.archivedBanner}</span>
        </p>
      ) : null}
      {conflict ? (
        <div className="adm-alert adm-alert--error" role="alert" data-testid="conflict">
          <IconAlert size={16} />
          <div className="adm-alert__body">
            <span>{x.conflict}</span>
            <span>
              <button type="button" className="adm-btn adm-btn--sm" onClick={() => router.refresh()}>
                {t.common.refresh}
              </button>
            </span>
          </div>
        </div>
      ) : null}

      <div className="adm-detail">
        <div className="adm-stack">
          <section className="adm-card" aria-labelledby={`${uid}-sender`}>
            <div className="adm-card__head">
              <h2 id={`${uid}-sender`} className="adm-h2">
                {x.sender}
              </h2>
            </div>
            <div className="adm-card__body">
              <dl className="adm-dl" data-testid="application-fields">
                <dt>{x.name}</dt>
                <dd>
                  <bdi>{r.contactName}</bdi>
                </dd>
                {r.company ? (
                  <>
                    <dt>{x.company}</dt>
                    <dd>
                      <bdi>{r.company}</bdi>
                    </dd>
                  </>
                ) : null}
                <dt>{x.email}</dt>
                <dd>
                  <a className="adm-link adm-ltr" dir="ltr" href={`mailto:${r.email}`}>
                    {r.email}
                  </a>
                </dd>
                {r.kind === 'partner' ? (
                  <>
                    <dt>{x.phone}</dt>
                    <dd>
                      {r.phone ? (
                        <a className="adm-link adm-ltr" dir="ltr" href={`tel:${r.phone}`}>
                          {r.phone}
                        </a>
                      ) : (
                        <span className="adm-muted">{t.common.dash}</span>
                      )}
                    </dd>
                    <dt>{x.country}</dt>
                    <dd>
                      {country} <span className="adm-muted adm-ltr">({r.countryCode})</span>
                    </dd>
                    <dt>{x.partnerType}</dt>
                    <dd>{r.partnerType ? (labels.partnerTypes[r.partnerType] ?? r.partnerType) : t.common.dash}</dd>
                  </>
                ) : (
                  <>
                    <dt>{x.discipline}</dt>
                    <dd>{r.discipline ? (labels.disciplines[r.discipline] ?? r.discipline) : t.common.dash}</dd>
                    <dt>{x.experience}</dt>
                    <dd>{r.experienceYears === null ? <span className="adm-muted">{x.experienceNone}</span> : plural(locale, r.experienceYears, a.experienceYears)}</dd>
                    <dt>{x.portfolio}</dt>
                    <dd>
                      {portfolio ? (
                        <>
                          <a className="adm-link adm-ltr" dir="ltr" href={portfolio} target="_blank" rel="noopener noreferrer nofollow" style={{ overflowWrap: 'anywhere' }} data-testid="portfolio-link">
                            {portfolio}
                            <IconExternal size={14} />
                          </a>
                          <span className="adm-help" style={{ display: 'block' }}>
                            {x.portfolioNote}
                          </span>
                        </>
                      ) : (
                        <span className="adm-muted">{x.portfolioNone}</span>
                      )}
                    </dd>
                  </>
                )}
              </dl>
            </div>
          </section>

          {r.kind === 'partner' && r.description ? (
            <section className="adm-card" aria-labelledby={`${uid}-desc`}>
              <div className="adm-card__head">
                <h2 id={`${uid}-desc`} className="adm-h2">
                  {x.description}
                </h2>
              </div>
              <div className="adm-card__body adm-stack--sm">
                <p className="adm-help">{x.descriptionNote}</p>
                <div className="adm-description" dir="auto" lang={r.submissionLocale} data-testid="application-description">
                  {r.description}
                </div>
              </div>
            </section>
          ) : null}

          {r.kind === 'career' ? (
            <section className="adm-card" aria-labelledby={`${uid}-cv`}>
              <div className="adm-card__head">
                <h2 id={`${uid}-cv`} className="adm-h2">
                  {x.cv}
                </h2>
              </div>
              <div className="adm-card__body adm-stack">
                <p className="adm-alert adm-alert--info">
                  <IconLock size={16} />
                  <span>{x.cvPrivate}</span>
                </p>
                {d.files.length ? (
                  <ul className="adm-files" aria-label={x.cv} data-testid="files">
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
                              <span>{formatBytes(locale, f.sizeBytes)}</span>
                              <span>{formatDateTime(locale, f.createdAt, timezone)}</span>
                            </span>
                            <span className="adm-badge" data-tone={tone} style={{ justifySelf: 'start' }} data-testid="scan-state">
                              {t.scan[f.scanState as keyof typeof t.scan] ?? f.scanState}
                            </span>
                          </span>
                          <span className="adm-file__actions">
                            {f.downloadable ? (
                              <button type="button" className="adm-btn adm-btn--sm" onClick={() => download(f.id)} aria-disabled={busy === f.id || undefined} data-testid="file-download">
                                <IconDownload size={16} />
                                {busy === f.id ? t.detail.files.opening : t.common.download}
                              </button>
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
                ) : (
                  <p className="adm-muted">{x.cvEmpty}</p>
                )}
              </div>
            </section>
          ) : null}

          <section className="adm-card" aria-labelledby={`${uid}-notes`}>
            <div className="adm-card__head">
              <h2 id={`${uid}-notes`} className="adm-h2">
                {x.notes}
              </h2>
            </div>
            <div className="adm-card__body adm-stack">
              <p className="adm-help">{x.notesNotice}</p>
              {d.notes.length ? (
                <ul className="adm-stack--sm" data-testid="notes" style={{ listStyle: 'none', padding: 0 }}>
                  {d.notes.map((n) => (
                    <li key={n.id} className="adm-note">
                      <div className="adm-note__meta">
                        <span className="adm-kind-label adm-kind-label--note">
                          <IconNote size={14} />
                          {x.notes}
                        </span>
                        <span>{fmt(x.noteBy, { name: n.authorName ?? t.common.formerMember, date: formatDateTime(locale, n.createdAt, timezone) })}</span>
                      </div>
                      <div className="adm-description" dir="auto">
                        {n.body}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="adm-muted">{x.notesEmpty}</p>
              )}
              {d.permissions.note ? (
                <div className="adm-field">
                  <label htmlFor={`${uid}-note`} className="adm-label">
                    {x.composer}
                  </label>
                  <textarea id={`${uid}-note`} className="adm-textarea" dir="auto" maxLength={5000} value={note} onChange={(e) => setNote(e.target.value)} data-testid="app-note-input" />
                  <div>
                    <button type="button" className="adm-btn adm-btn--primary adm-btn--sm" onClick={addNote} aria-disabled={busy === 'note' || !note.trim() || undefined} data-testid="app-note-add">
                      {x.addNote}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="adm-card" aria-labelledby={`${uid}-act`}>
            <div className="adm-card__head">
              <h2 id={`${uid}-act`} className="adm-h2">
                {x.activity}
              </h2>
            </div>
            <div className="adm-card__body adm-stack">
              {d.activity.length ? (
                <ol className="adm-timeline" data-testid="activity">
                  {d.activity.map((e) => (
                    <li key={e.id}>
                      <span className="adm-timeline__time">
                        {formatDateTime(locale, e.createdAt, timezone)} · {e.actorName ?? t.common.system}
                      </span>
                      {activityText(e)}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="adm-muted">{x.activityEmpty}</p>
              )}
              <dl className="adm-dl adm-small">
                <dt>{x.sourcePage}</dt>
                <dd className="adm-ltr">{r.sourcePage ?? t.common.dash}</dd>
              </dl>
              {r.privacyAcknowledgedAt ? (
                <p className="adm-small adm-muted">
                  <Rich text={x.privacy} values={{ date: formatDateTime(locale, r.privacyAcknowledgedAt, timezone), version: <bdi dir="ltr">{r.privacyPolicyVersion ?? t.common.dash}</bdi> }} />
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="adm-detail__panel" aria-label={x.statusTitle}>
          <section className="adm-card" aria-labelledby={`${uid}-st`}>
            <div className="adm-card__head">
              <h2 id={`${uid}-st`} className="adm-h2">
                {x.statusTitle}
              </h2>
            </div>
            <div className="adm-card__body adm-stack--sm">
              <p>
                <span className="adm-badge" data-status={r.status}>
                  <StatusGlyph status={r.status} />
                  <span>{a.status[r.status]}</span>
                </span>{' '}
                <span className="adm-small adm-muted">{fmt(x.since, { date: formatDateTime(locale, r.statusChangedAt, timezone) })}</span>
              </p>
              <p className="adm-help">{a.statusHelp[r.status]}</p>
              {r.status === 'closed' && r.outcomeReason ? <p className="adm-small">{fmt(x.outcome, { reason: r.outcomeReason })}</p> : null}
              {d.permissions.status && d.transitions.length ? (
                <>
                  <div className="adm-field">
                    <label htmlFor={`${uid}-to`} className="adm-label">
                      {x.newStatus}
                    </label>
                    <select id={`${uid}-to`} className="adm-select" value={to} onChange={(e) => setTo(e.target.value as ApplicationStatus)} data-testid="app-status-select">
                      <option value="">{t.common.none}</option>
                      {d.transitions.map((s) => (
                        <option key={s} value={s}>
                          {a.status[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="adm-field">
                    <label htmlFor={`${uid}-reason`} className="adm-label">
                      {needsReason ? x.reasonRequired : x.reasonOptional}
                    </label>
                    <textarea id={`${uid}-reason`} className="adm-textarea" dir="auto" maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} data-testid="app-status-reason" />
                  </div>
                  <div>
                    <button
                      type="button"
                      className="adm-btn adm-btn--primary adm-btn--sm"
                      onClick={updateStatus}
                      aria-disabled={busy === 'status' || !to || (needsReason && !reason.trim()) || undefined}
                      data-testid="app-status-update"
                    >
                      {x.update}
                    </button>
                  </div>
                </>
              ) : r.disposition === 'active' ? (
                <p className="adm-small adm-muted">{x.noTransitions}</p>
              ) : null}
            </div>
          </section>

          <section className="adm-card" aria-labelledby={`${uid}-reply`}>
            <div className="adm-card__head">
              <h2 id={`${uid}-reply`} className="adm-h2">
                {x.reply}
              </h2>
            </div>
            <div className="adm-card__body adm-stack--sm">
              <p className="adm-help">{x.replyLead}</p>
              <div className="adm-row">
                <a className="adm-btn adm-btn--sm" href={`mailto:${r.email}?subject=${encodeURIComponent(r.reference)}`} data-testid="app-mailto">
                  <IconMail size={16} />
                  {x.openMailApp}
                </a>
                <button type="button" className="adm-btn adm-btn--sm" onClick={copyEmail}>
                  <IconCopy size={16} />
                  {x.copyEmail}
                </button>
              </div>
            </div>
          </section>

          {d.permissions.archive || d.permissions.spam || d.permissions.delete ? (
            <section className="adm-card" aria-labelledby={`${uid}-rec`}>
              <div className="adm-card__head">
                <h2 id={`${uid}-rec`} className="adm-h2">
                  {x.record}
                </h2>
                <span className="adm-badge" data-tone={r.disposition === 'active' ? 'ok' : 'muted'}>
                  {t.disposition[r.disposition]}
                </span>
              </div>
              <div className="adm-card__body adm-row">
                {r.disposition === 'active' && d.permissions.archive ? (
                  <button type="button" className="adm-btn adm-btn--sm" onClick={() => setConfirm('archived')} data-testid="app-archive">
                    {x.archive}
                  </button>
                ) : null}
                {r.disposition === 'active' && d.permissions.spam ? (
                  <button type="button" className="adm-btn adm-btn--sm" onClick={() => setConfirm('spam')} data-testid="app-spam">
                    {x.spam}
                  </button>
                ) : null}
                {canRestore ? (
                  <button type="button" className="adm-btn adm-btn--sm" onClick={() => setConfirm('active')} data-testid="app-restore">
                    {x.restore}
                  </button>
                ) : null}
                {d.permissions.delete ? (
                  <button type="button" className="adm-btn adm-btn--sm adm-btn--danger" onClick={() => setDel(true)} data-testid="app-delete">
                    {x.delete}
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}
        </aside>
      </div>

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

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm ? `${dispositionTitles[confirm]} — ${r.reference}` : ''}
        closeLabel={t.common.close}
        footer={
          <>
            <button type="button" className="adm-btn" onClick={() => setConfirm(null)}>
              {t.common.cancel}
            </button>
            <button type="button" className="adm-btn adm-btn--primary" onClick={applyDisposition} aria-disabled={busy === 'disposition' || undefined} data-testid="app-disposition-confirm">
              {t.common.confirm}
            </button>
          </>
        }
      >
        <p>{confirm ? dispositionTexts[confirm] : ''}</p>
      </Dialog>

      <Dialog
        open={del}
        onClose={() => setDel(false)}
        title={fmt(x.deleteTitle, { ref: r.reference })}
        closeLabel={t.common.close}
        footer={
          <>
            <button type="button" className="adm-btn" onClick={() => setDel(false)}>
              {t.common.cancel}
            </button>
            <button
              type="button"
              className="adm-btn adm-btn--danger"
              onClick={remove}
              aria-disabled={busy === 'delete' || typed.trim().toUpperCase() !== r.reference || undefined}
              data-testid="app-delete-confirm"
            >
              {x.delete}
            </button>
          </>
        }
      >
        <div className="adm-stack--sm">
          <p>{x.deleteText}</p>
          <div className="adm-field">
            <label htmlFor={`${uid}-del`} className="adm-label">
              {fmt(x.deleteConfirmLabel, { ref: r.reference })}
            </label>
            <input id={`${uid}-del`} className="adm-input adm-ltr" dir="ltr" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" data-testid="app-delete-input" />
          </div>
          {delError ? (
            <p className="adm-alert adm-alert--error" role="alert">
              <IconAlert size={16} />
              <span>{delError}</span>
            </p>
          ) : null}
        </div>
      </Dialog>
    </div>
  );
}
