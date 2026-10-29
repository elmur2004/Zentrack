'use client';

import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import type { Locale } from '@/i18n/config';
import { getAdminMessages } from '@/i18n/admin';
import { fmt } from '@/i18n/format';
import { TEMPLATE_KEYS, type TemplateKey } from '@/lib/admin/codes';
import { CONTACT_FIELDS, type ContactField } from '@/lib/contacts';
import { formatDateTime } from '@/lib/admin/format';
import { retryJobAction, runJobsAction, updateSettingsAction } from '@/server/actions/admin';
import type { AdminSettings } from '@/server/admin/settings';
import type { TemplateText } from '@/server/admin/templates';
import { errorText, notify, run } from './runtime';

const ZONES = ['Africa/Cairo', 'Asia/Riyadh', 'Asia/Dubai', 'Asia/Qatar', 'Asia/Kuwait', 'Asia/Amman', 'Europe/London', 'Europe/Berlin', 'UTC'];

interface Props {
  locale: Locale;
  settings: AdminSettings;
  defaults: Record<TemplateKey, Record<'en' | 'ar', TemplateText>>;
  transport: 'none' | 'outbox' | 'smtp';
  jobs: { counts: Record<string, number>; recentFailures: Array<{ id: string; kind: string; status: string; attempts: number; lastError: string | null; updatedAt: Date; reference: string | null }> };
  timezone: string;
}

export function SettingsForm({ locale, settings, defaults, transport, jobs, timezone }: Props) {
  const t = getAdminMessages(locale);
  const router = useRouter();
  const uid = useId();
  const [s, setS] = useState<AdminSettings>(settings);
  const [busy, setBusy] = useState(false);
  const [contactError, setContactError] = useState<ContactField | null>(null);
  const zones = ZONES.includes(s.timezone) ? ZONES : [s.timezone, ...ZONES];

  function tpl(key: TemplateKey, lang: 'en' | 'ar'): TemplateText {
    return s.templates[key]?.[lang] ?? defaults[key][lang];
  }
  function setTpl(key: TemplateKey, lang: 'en' | 'ar', patch: Partial<TemplateText>) {
    setS((cur) => ({ ...cur, templates: { ...cur.templates, [key]: { ...cur.templates[key], [lang]: { ...tpl(key, lang), ...patch } } } }));
  }
  function resetTpl(key: TemplateKey, lang: 'en' | 'ar') {
    setS((cur) => {
      const next = { ...cur.templates, [key]: { ...cur.templates[key] } };
      delete next[key]![lang];
      return { ...cur, templates: next };
    });
  }

  async function save() {
    setBusy(true);
    setContactError(null);
    const r = await run(() => updateSettingsAction(s));
    setBusy(false);
    if (r.ok) {
      setS(r.data as AdminSettings);
      notify(t.common.saved);
      router.refresh();
    } else {
      const field = String(r.details?.field ?? '');
      if (field.startsWith('contact_')) {
        const f = field.slice('contact_'.length) as ContactField;
        setContactError(f);
        document.getElementById(`${uid}-c-${f}`)?.focus();
      }
      notify(errorText(t, r.code, r.details), 'error');
    }
  }

  const c = jobs.counts;
  return (
    <div className="adm-stack">
      <section className="adm-card" aria-labelledby={`${uid}-w`}>
        <div className="adm-card__head">
          <h2 id={`${uid}-w`} className="adm-h2">
            {t.settings.workflow}
          </h2>
        </div>
        <div className="adm-card__body adm-stack--sm">
          <div className="adm-field" style={{ maxInlineSize: '24rem' }}>
            <label htmlFor={`${uid}-tz`} className="adm-label">
              {t.settings.timezone}
            </label>
            <select id={`${uid}-tz`} className="adm-select adm-ltr" dir="ltr" value={s.timezone} onChange={(e) => setS({ ...s, timezone: e.target.value })}>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
            <p className="adm-help">{t.settings.timezoneHelp}</p>
          </div>
          <label className="adm-check">
            <input type="checkbox" checked={s.requireAssigneeForQuote} onChange={(e) => setS({ ...s, requireAssigneeForQuote: e.target.checked })} />
            <span>{t.settings.requireAssignee}</span>
          </label>
        </div>
      </section>

      <section className="adm-card" aria-labelledby={`${uid}-c`} data-testid="contacts-settings">
        <div className="adm-card__head">
          <h2 id={`${uid}-c`} className="adm-h2">
            {t.settings.contacts}
          </h2>
        </div>
        <div className="adm-card__body adm-stack--sm">
          <p className="adm-help">{t.settings.contactsLead}</p>
          <div className="adm-grid-2">
            {CONTACT_FIELDS.map((f) => (
              <div key={f} className="adm-field">
                <label htmlFor={`${uid}-c-${f}`} className="adm-label">
                  {t.settings.contactFields[f]} <span className="adm-muted adm-small">({t.common.optional})</span>
                </label>
                <input
                  id={`${uid}-c-${f}`}
                  className="adm-input adm-ltr"
                  dir="ltr"
                  type={f === 'email' ? 'email' : f === 'linkedin' ? 'url' : 'tel'}
                  inputMode={f === 'email' ? 'email' : f === 'linkedin' ? 'url' : 'tel'}
                  autoComplete="off"
                  maxLength={f === 'linkedin' ? 300 : 254}
                  value={s.publicContacts[f]}
                  onChange={(e) => {
                    setS({ ...s, publicContacts: { ...s.publicContacts, [f]: e.target.value } });
                    if (contactError === f) setContactError(null);
                  }}
                  aria-invalid={contactError === f || undefined}
                  aria-describedby={`${uid}-c-${f}-help${contactError === f ? ` ${uid}-c-${f}-err` : ''}`}
                  data-testid={`contact-${f}`}
                />
                <p id={`${uid}-c-${f}-help`} className="adm-help">
                  {t.settings.contactHelp[f]}
                </p>
                {contactError === f ? (
                  <p id={`${uid}-c-${f}-err`} className="adm-error-text" role="alert">
                    {(t.errors.fields as Record<string, string>)[`contact_${f}`]}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="adm-card" aria-labelledby={`${uid}-f`} id="website-forms">
        <div className="adm-card__head">
          <h2 id={`${uid}-f`} className="adm-h2">
            {t.settings.forms}
          </h2>
        </div>
        <div className="adm-card__body adm-stack--sm">
          <p className="adm-help">{t.settings.formsLead}</p>
          <label className="adm-check">
            <input type="checkbox" checked={s.partnerIntakeOpen} onChange={(e) => setS({ ...s, partnerIntakeOpen: e.target.checked })} data-testid="partner-intake" />
            <span>{t.settings.partnerIntakeOpen}</span>
          </label>
          <label className="adm-check">
            <input type="checkbox" checked={s.careerIntakeOpen} onChange={(e) => setS({ ...s, careerIntakeOpen: e.target.checked })} data-testid="career-intake" />
            <span>{t.settings.careerIntakeOpen}</span>
          </label>
        </div>
      </section>

      <section className="adm-card" aria-labelledby={`${uid}-n`}>
        <div className="adm-card__head">
          <h2 id={`${uid}-n`} className="adm-h2">
            {t.settings.notificationsTitle}
          </h2>
        </div>
        <div className="adm-card__body adm-stack--sm">
          <label className="adm-check">
            <input type="checkbox" checked={s.notifyOnNewRequest} onChange={(e) => setS({ ...s, notifyOnNewRequest: e.target.checked })} />
            <span>{t.settings.notifyOnNew}</span>
          </label>
          <label className="adm-check">
            <input type="checkbox" checked={s.emailNotifications} onChange={(e) => setS({ ...s, emailNotifications: e.target.checked })} />
            <span>
              {t.settings.emailNotifications}
              {transport === 'none' ? (
                <span className="adm-help" style={{ display: 'block' }}>
                  {t.settings.emailUnavailable}
                </span>
              ) : null}
            </span>
          </label>
        </div>
      </section>

      <section className="adm-card" aria-labelledby={`${uid}-s`}>
        <div className="adm-card__head">
          <h2 id={`${uid}-s`} className="adm-h2">
            {t.settings.security}
          </h2>
        </div>
        <div className="adm-card__body">
          <label className="adm-check">
            <input type="checkbox" checked={s.requireMfaForPrivileged} onChange={(e) => setS({ ...s, requireMfaForPrivileged: e.target.checked })} data-testid="require-mfa" />
            <span>
              {t.settings.requireMfa}
              <span className="adm-help" style={{ display: 'block' }}>
                {t.settings.requireMfaHelp}
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="adm-card" aria-labelledby={`${uid}-t`}>
        <div className="adm-card__head">
          <h2 id={`${uid}-t`} className="adm-h2">
            {t.settings.templates}
          </h2>
        </div>
        <div className="adm-card__body adm-stack">
          <p className="adm-help">{t.settings.templatesLead}</p>
          {TEMPLATE_KEYS.map((key) => (
            <details key={key} className="adm-card">
              <summary className="adm-card__head" style={{ cursor: 'pointer' }}>
                <span className="adm-h3">{t.detail.comms.templates[key]}</span>
              </summary>
              <div className="adm-card__body adm-grid-2">
                {(['en', 'ar'] as const).map((lang) => (
                  <div key={lang} className="adm-stack--sm" lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    <h4 className="adm-h3">{t.languages[lang]}</h4>
                    <div className="adm-field">
                      <label htmlFor={`${uid}-${key}-${lang}-s`} className="adm-label">
                        {t.settings.templateSubject}
                      </label>
                      <input id={`${uid}-${key}-${lang}-s`} className="adm-input" maxLength={200} value={tpl(key, lang).subject} onChange={(e) => setTpl(key, lang, { subject: e.target.value })} />
                    </div>
                    <div className="adm-field">
                      <label htmlFor={`${uid}-${key}-${lang}-b`} className="adm-label">
                        {t.settings.templateBody}
                      </label>
                      <textarea id={`${uid}-${key}-${lang}-b`} className="adm-textarea adm-textarea--tall" maxLength={8000} value={tpl(key, lang).body} onChange={(e) => setTpl(key, lang, { body: e.target.value })} />
                    </div>
                    {s.templates[key]?.[lang] ? (
                      <div>
                        <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost" onClick={() => resetTpl(key, lang)}>
                          {t.settings.resetTemplate}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <div className="adm-row">
        <button type="button" className="adm-btn adm-btn--primary" onClick={save} aria-disabled={busy || undefined} data-testid="settings-save">
          {busy ? <span className="adm-spinner" /> : null}
          {t.settings.save}
        </button>
      </div>

      <section className="adm-card" aria-labelledby={`${uid}-j`}>
        <div className="adm-card__head">
          <h2 id={`${uid}-j`} className="adm-h2">
            {t.settings.labels.jobs}
          </h2>
          <button
            type="button"
            className="adm-btn adm-btn--sm"
            onClick={async () => {
              const r = await run(() => runJobsAction());
              if (r.ok) {
                notify(fmt(t.settings.jobsResult, { sent: r.data.sent, failed: r.data.failed, skipped: r.data.skipped }));
                router.refresh();
              } else notify(errorText(t, r.code, r.details), 'error');
            }}
          >
            {t.settings.runJobs}
          </button>
        </div>
        <div className="adm-card__body adm-stack--sm">
          <p className="adm-mono" data-testid="job-counts">
            {fmt(t.settings.jobCounts, { queued: c.queued ?? 0, sent: c.sent ?? 0, test: c.test_delivered ?? 0, failed: c.failed ?? 0, skipped: c.skipped ?? 0 })}
          </p>
          <h3 className="adm-h3">{t.settings.recentFailures}</h3>
          {jobs.recentFailures.length ? (
            <ul className="adm-list">
              {jobs.recentFailures.map((j) => (
                <li key={j.id}>
                  <span>
                    <span className="adm-ltr">{j.reference ?? t.common.dash}</span> · {j.kind} · {fmt(t.settings.attempts, { count: j.attempts })}
                    <span className="adm-small adm-muted" style={{ display: 'block' }}>
                      {formatDateTime(locale, j.updatedAt, timezone)} — <span className="adm-ltr">{j.lastError ?? ''}</span>
                    </span>
                  </span>
                  <button
                    type="button"
                    className="adm-btn adm-btn--sm"
                    onClick={async () => {
                      const r = await run(() => retryJobAction(j.id));
                      if (r.ok) router.refresh();
                      else notify(errorText(t, r.code, r.details), 'error');
                    }}
                  >
                    {t.settings.retryJob}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="adm-muted">{t.settings.noFailures}</p>
          )}
        </div>
      </section>
    </div>
  );
}
