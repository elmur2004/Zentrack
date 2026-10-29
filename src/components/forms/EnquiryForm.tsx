'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import type { Locale } from '@/i18n/config';
import type { Messages } from '@/i18n/messages';
import { fmt, formatFileSize } from '@/i18n/format';
import { checkFileMeta, LIMITS, validate, type FieldError, type FormType } from '@/lib/forms/schema';
import type { FormMode } from '@/lib/forms/config';
import { clearDraft, loadDraft, saveDraft, setFilesSelected } from '@/lib/forms/draftStore';
import { AlertIcon, CheckIcon, CloseIcon } from '@/components/ui/icons';
import { Rich } from '@/components/ui/Rich';

export interface Option {
  id: string;
  label: string;
}

interface Props {
  type: FormType;
  locale: Locale;
  /** 'closed' = the owner has paused this form in the dashboard (partner/careers only). */
  mode: FormMode | 'closed';
  uploads: boolean;
  privacyHref: string;
  t: Messages['forms'];
  countries: { common: Option[]; all: Option[] };
  services: Option[];
  scopes: Option[];
  partnerTypes: Option[];
  disciplines: Option[];
  submitLabel: string;
}

type Status = 'idle' | 'submitting' | 'received' | 'test' | 'failed' | 'rate-limited' | 'unavailable' | 'closed' | 'offline';

interface Values {
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  services: string[];
  scope: string;
  details: string;
  privacy: boolean;
  partnerType: string;
  discipline: string;
  experience: string;
  portfolio: string;
}

interface UploadItem {
  key: string;
  name: string;
  size: number;
  status: 'uploading' | 'uploaded' | 'test' | 'rejected' | 'failed';
  id?: string;
  code?: string;
}

const EMPTY: Values = {
  name: '',
  company: '',
  email: '',
  phone: '',
  country: '',
  services: [],
  scope: '',
  details: '',
  privacy: false,
  partnerType: '',
  discipline: '',
  experience: '',
  portfolio: '',
};

function newKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

const LTR = (s: string) => <bdi dir="ltr">{s}</bdi>;

export function EnquiryForm(props: Props) {
  const { type, locale, mode, uploads, privacyHref, t, countries, services, scopes, partnerTypes, disciplines, submitLabel } = props;
  const uid = useId().replace(/:/g, '');
  const fid = (name: string) => `${type}-${name}`;
  const [values, setValues] = useState<Values>(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<FieldError[]>([]);
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [reference, setReference] = useState('');
  const [formError, setFormError] = useState('');
  const idemKey = useRef(newKey());
  // Origin context sent with the enquiry: the page path and a preselected service slug only.
  const origin = useRef<{ page: string; service: string | null }>({ page: '', service: null });
  const summaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const restored = useRef(false);
  const pressing = useRef(false);
  const deferredBlur = useRef<Array<() => void>>([]);
  const pendingFocus = useRef<'summary' | 'result' | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Marks the form as interactive once React has hydrated it (used by the browser tests to avoid
  // typing into the server-rendered HTML before the controlled inputs are attached).
  useEffect(() => {
    formRef.current?.setAttribute('data-hydrated', '');
  }, []);

  // Move focus to the error summary or the result once React has rendered it (a frame callback
  // could run before the commit and silently skip the focus).
  useEffect(() => {
    const target = pendingFocus.current;
    const el = target === 'summary' ? summaryRef.current : target === 'result' ? resultRef.current : null;
    if (!el) return;
    pendingFocus.current = null;
    el.focus();
  });

  // Track pointer presses (mouse, pen, touch) so blur validation never moves a control mid-click.
  useEffect(() => {
    const down = () => {
      pressing.current = true;
    };
    const up = () => {
      pressing.current = false;
      const pending = deferredBlur.current.splice(0);
      // after the click (and any submit) for this press has been dispatched
      if (pending.length) setTimeout(() => pending.forEach((apply) => apply()), 0);
    };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('pointerup', up, true);
    document.addEventListener('pointercancel', up, true);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('pointerup', up, true);
      document.removeEventListener('pointercancel', up, true);
    };
  }, []);

  // Restore an in-memory draft (e.g. after a language switch) or apply a visible URL preselection.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const q = new URLSearchParams(window.location.search);
    const service = q.get('service');
    origin.current = { page: window.location.pathname, service: service && services.some((s) => s.id === service) ? service : null };
    const draft = loadDraft<{ values: Values }>(type);
    if (draft?.values) {
      setValues(draft.values); // eslint-disable-line react-hooks/set-state-in-effect -- one-time restore after mount
      return;
    }
    const scope = q.get('scope');
    setValues((v) => ({
      ...v,
      services: service && services.some((s) => s.id === service) ? [service] : v.services,
      scope: scope && scopes.some((s) => s.id === scope) ? scope : v.scope,
    }));
  }, [type, services, scopes]);

  useEffect(() => {
    saveDraft(type, { values });
  }, [type, values]);

  useEffect(() => {
    setFilesSelected(type, files.some((f) => f.status !== 'rejected' && f.status !== 'failed'));
    return () => setFilesSelected(type, false);
  }, [type, files]);

  const uploadedIds = files.filter((f) => (f.status === 'uploaded' || f.status === 'test') && f.id).map((f) => f.id as string);

  function payload(v: Values = values) {
    if (type === 'quote')
      return {
        name: v.name,
        company: v.company,
        email: v.email,
        phone: v.phone,
        country: v.country,
        services: v.services,
        scope: v.scope,
        details: v.details,
        attachments: uploadedIds,
        privacy: v.privacy,
      };
    if (type === 'partner')
      return {
        name: v.name,
        company: v.company,
        email: v.email,
        phone: v.phone,
        country: v.country,
        partnerType: v.partnerType,
        details: v.details,
        privacy: v.privacy,
      };
    return {
      name: v.name,
      email: v.email,
      discipline: v.discipline,
      experience: v.experience,
      portfolio: v.portfolio,
      cv: uploadedIds[0] ?? '',
      privacy: v.privacy,
    };
  }

  function currentErrors(v: Values = values): Record<string, string> {
    const r = validate(type, payload(v));
    if (r.ok) return {};
    return Object.fromEntries(r.errors.map((e) => [e.field, e.code]));
  }

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    // Errors appear on blur or submit, but clear as soon as the field becomes valid.
    const field = key as string;
    if (errors[field] && !currentErrors({ ...values, [key]: value })[field]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[field];
        return next;
      });
    }
    if (status === 'failed' || status === 'offline' || status === 'rate-limited') setStatus('idle');
  }

  // Validate after blur, not on every keystroke. Pressing another control (such as Send) blurs the
  // field first; showing or hiding a message at that moment would move the control before the press
  // is released and lose the click (BUG-02). So during a press the result is applied after it ends.
  function blur(field: string) {
    const errs = currentErrors();
    const apply = () => {
      setTouched((tt) => ({ ...tt, [field]: true }));
      setErrors((e) => {
        const next = { ...e };
        if (errs[field]) next[field] = errs[field];
        else delete next[field];
        return next;
      });
    };
    if (pressing.current) deferredBlur.current.push(apply);
    else apply();
  }

  function errorText(code: string): ReactNode {
    const map = t.errors as Record<string, string>;
    const msg = (type === 'partner' && code === 'detailsShort' ? t.errors.detailsShortPartner : map[code]) ?? t.states.failure;
    return (
      <Rich
        text={msg}
        values={{
          count: String(LIMITS.attachments.maxFiles),
          total: formatFileSize(locale, LIMITS.attachments.maxTotalBytes),
          https: LTR('https://'),
          http: LTR('http://'),
        }}
      />
    );
  }

  async function uploadOne(item: UploadItem, file: File, kind: 'attachment' | 'cv') {
    const body = new FormData();
    body.append('kind', kind);
    body.append('file', file);
    try {
      const res = await fetch('/api/uploads', { method: 'POST', body });
      const data = (await res.json().catch(() => ({}))) as { status?: string; id?: string; code?: string };
      setFiles((list) =>
        list.map((f) =>
          f.key !== item.key
            ? f
            : res.ok && data.id
              ? { ...f, id: data.id, status: data.status === 'test-validated' ? 'test' : 'uploaded' }
              : res.status === 422
                ? { ...f, status: 'rejected', code: data.code }
                : { ...f, status: 'failed', code: data.code },
        ),
      );
    } catch {
      setFiles((list) => list.map((f) => (f.key === item.key ? { ...f, status: 'failed' } : f)));
    }
  }

  function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const kind = type === 'career' ? 'cv' : 'attachment';
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    const active = files.filter((f) => f.status !== 'rejected' && f.status !== 'failed');
    const max = kind === 'cv' ? 1 : LIMITS.attachments.maxFiles;
    let total = active.reduce((n, f) => n + f.size, 0);
    const next: Array<[UploadItem, File | null]> = [];
    let count = active.length;
    for (const file of picked) {
      const item: UploadItem = { key: newKey(), name: file.name, size: file.size, status: 'uploading' };
      const metaErr = checkFileMeta(kind, file.name, file.type, file.size);
      if (metaErr) next.push([{ ...item, status: 'rejected', code: metaErr }, null]);
      else if (count >= max) next.push([{ ...item, status: 'rejected', code: 'fileCount' }, null]);
      else if (total + file.size > LIMITS.attachments.maxTotalBytes) next.push([{ ...item, status: 'rejected', code: 'totalTooLarge' }, null]);
      else {
        count += 1;
        total += file.size;
        next.push([item, file]);
      }
    }
    setFiles((list) => [...(kind === 'cv' ? [] : list), ...next.map(([i]) => i)]);
    for (const [item, file] of next) if (file) void uploadOne(item, file, kind);
  }

  function removeFile(key: string) {
    setFiles((list) => list.filter((f) => f.key !== key));
    fileInput.current?.focus();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === 'submitting') return;
    setFormError('');
    if (files.some((f) => f.status === 'uploading')) {
      setFormError(t.errors.uploadPending);
      return;
    }
    const errs = currentErrors();
    if (Object.keys(errs).length) {
      setErrors(errs);
      setTouched(Object.fromEntries(Object.keys(errs).map((k) => [k, true])));
      setSummary(Object.entries(errs).map(([field, code]) => ({ field, code })));
      pendingFocus.current = 'summary';
      return;
    }
    setSummary([]);
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setStatus('offline');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type, locale, idempotencyKey: idemKey.current, values: payload(), context: origin.current }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        status?: string;
        reference?: string;
        errors?: FieldError[];
      };
      if (res.ok && (data.status === 'test' || data.status === 'received') && data.reference) {
        setReference(data.reference);
        setStatus(data.status === 'test' ? 'test' : 'received');
        clearDraft(type);
        pendingFocus.current = 'result';
        return;
      }
      if (res.status === 422 && data.errors?.length) {
        const map = Object.fromEntries(data.errors.map((er) => [er.field, er.code]));
        setErrors(map);
        setSummary(data.errors);
        setStatus('idle');
        pendingFocus.current = 'summary';
        return;
      }
      // A changed payload under an already-used key is a new submission: rotate the key.
      if (res.status === 409) idemKey.current = newKey();
      if (res.status === 503 && data.status === 'closed') {
        setStatus('closed');
        return;
      }
      setStatus(res.status === 429 ? 'rate-limited' : data.status === 'failed' ? 'failed' : res.status === 503 ? 'unavailable' : 'failed');
    } catch {
      setStatus('failed');
    }
  }

  function reset() {
    setValues(EMPTY);
    setFiles([]);
    setErrors({});
    setTouched({});
    setSummary([]);
    setReference('');
    idemKey.current = newKey();
    setStatus('idle');
  }

  const fieldLabel = (field: string): string => {
    const f = t.fields as Record<string, { label?: string }>;
    if (field === 'attachments') return t.fields.attachments.label;
    if (field === 'cv') return t.fields.cv.label;
    if (field === 'privacy') return t.fields.privacy.policy;
    if (field === 'details' && type === 'partner') return t.fields.partnerDetails.label;
    return f[field]?.label ?? field;
  };

  const describedBy = (field: string, help = false) =>
    [help ? `${fid(field)}-help` : '', errors[field] && touched[field] ? `${fid(field)}-error` : ''].filter(Boolean).join(' ') ||
    undefined;

  const invalid = (field: string) => !!(errors[field] && touched[field]);

  const fieldError = (field: string) =>
    invalid(field) ? (
      <p id={`${fid(field)}-error`} className="field__error">
        <AlertIcon size={16} />
        <span>{errorText(errors[field])}</span>
      </p>
    ) : null;

  const req = <span className="field__req">{t.required}</span>;
  const opt = <span className="field__opt">{t.optional}</span>;

  if (mode === 'unavailable') {
    return (
      <div className="form-notice form-notice--warn" role="status">
        <AlertIcon />
        <div>
          <p className="form-notice__title">{t.states.unavailable}</p>
          <p>{t.states.unavailableContact}</p>
        </div>
      </div>
    );
  }

  if (mode === 'closed' || status === 'closed') {
    return (
      <div className="form-notice form-notice--warn" role="status" data-testid="form-closed">
        <AlertIcon />
        <div>
          <p className="form-notice__title">{type === 'career' ? t.states.closedCareer : t.states.closedPartner}</p>
        </div>
      </div>
    );
  }

  if (status === 'received' || status === 'test') {
    const msg =
      status === 'test'
        ? t.states.testComplete
        : type === 'career'
          ? t.states.receivedApplication
          : t.states.received;
    return (
      <div className={`form-result ${status === 'test' ? 'form-result--test' : ''}`} ref={resultRef} tabIndex={-1} role="status">
        <CheckIcon size={22} />
        <p className="form-result__text">
          <Rich text={msg} values={{ id: LTR(reference) }} />
        </p>
        <button type="button" className="btn btn--ghost-light" onClick={reset}>
          <span className="btn__label">{t.states.sendAnother}</span>
        </button>
      </div>
    );
  }

  const submitting = status === 'submitting';
  const submittingText = type === 'career' ? t.states.submittingApplication : type === 'partner' ? t.states.submittingPartner : t.states.submitting;
  const detailsCopy = type === 'partner' ? t.fields.partnerDetails : t.fields.details;
  const kind = type === 'career' ? 'cv' : 'attachment';

  return (
    <form ref={formRef} className="form" noValidate onSubmit={onSubmit} aria-describedby={mode === 'preview' ? `${uid}-mode` : undefined}>
      {mode === 'preview' ? (
        <p className="form-mode" id={`${uid}-mode`} role="note">
          <AlertIcon size={18} />
          <span>{t.states.testMode}</span>
        </p>
      ) : null}

      {summary.length ? (
        <div className="error-summary" ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby={`${uid}-summary`}>
          <h2 id={`${uid}-summary`} className="error-summary__title">
            {t.errorSummaryTitle}
          </h2>
          <ul>
            {summary.map((s) => (
              <li key={s.field}>
                <a
                  href={`#${fid(s.field === 'services' ? 'services-0' : s.field)}`}
                  onClick={(ev) => {
                    ev.preventDefault();
                    const el = document.getElementById(fid(s.field === 'services' ? 'services-0' : s.field));
                    el?.focus();
                    el?.scrollIntoView({ block: 'center' });
                  }}
                >
                  {fieldLabel(s.field)}: {errorText(s.code)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="form__grid">
        <div className="field">
          <label htmlFor={fid('name')} className="field__label">
            {t.fields.name.label} {req}
          </label>
          <input
            id={fid('name')}
            className="field__control"
            type="text"
            autoComplete="name"
            dir="auto"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            onBlur={() => blur('name')}
            aria-invalid={invalid('name') || undefined}
            aria-describedby={describedBy('name')}
            required
            maxLength={LIMITS.name[1] + 20}
          />
          {fieldError('name')}
        </div>

        {type !== 'career' ? (
          <div className="field">
            <label htmlFor={fid('company')} className="field__label">
              {t.fields.company.label} {req}
            </label>
            <input
              id={fid('company')}
              className="field__control"
              type="text"
              autoComplete="organization"
              dir="auto"
              value={values.company}
              onChange={(e) => set('company', e.target.value)}
              onBlur={() => blur('company')}
              aria-invalid={invalid('company') || undefined}
              aria-describedby={describedBy('company')}
              required
            />
            {fieldError('company')}
          </div>
        ) : null}

        <div className="field">
          <label htmlFor={fid('email')} className="field__label">
            {t.fields.email.label} {req}
          </label>
          <input
            id={fid('email')}
            className="field__control field__control--ltr"
            type="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            onBlur={() => blur('email')}
            aria-invalid={invalid('email') || undefined}
            aria-describedby={describedBy('email')}
            required
            maxLength={LIMITS.email}
          />
          {fieldError('email')}
        </div>

        {type !== 'career' ? (
          <div className="field">
            <label htmlFor={fid('phone')} className="field__label">
              {t.fields.phone.label} {opt}
            </label>
            <input
              id={fid('phone')}
              className="field__control field__control--ltr"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              value={values.phone}
              onChange={(e) => set('phone', e.target.value)}
              onBlur={() => blur('phone')}
              aria-invalid={invalid('phone') || undefined}
              aria-describedby={describedBy('phone', true)}
            />
            <p id={`${fid('phone')}-help`} className="field__help">
              <Rich text={t.fields.phone.help} values={{ example: LTR('+20') }} />
            </p>
            {fieldError('phone')}
          </div>
        ) : null}

        {type !== 'career' ? (
          <div className="field">
            <label htmlFor={fid('country')} className="field__label">
              {t.fields.country.label} {req}
            </label>
            <select
              id={fid('country')}
              className="field__control"
              autoComplete="country"
              value={values.country}
              onChange={(e) => set('country', e.target.value)}
              onBlur={() => blur('country')}
              aria-invalid={invalid('country') || undefined}
              aria-describedby={describedBy('country')}
              required
            >
              <option value="">{t.fields.country.placeholder}</option>
              <optgroup label={t.fields.country.common}>
                {countries.common.map((c) => (
                  <option key={`c-${c.id}`} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label={t.fields.country.all}>
                {countries.all.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
            </select>
            {fieldError('country')}
          </div>
        ) : null}

        {type === 'partner' ? (
          <div className="field">
            <label htmlFor={fid('partnerType')} className="field__label">
              {t.fields.partnerType.label} {req}
            </label>
            <select
              id={fid('partnerType')}
              className="field__control"
              value={values.partnerType}
              onChange={(e) => set('partnerType', e.target.value)}
              onBlur={() => blur('partnerType')}
              aria-invalid={invalid('partnerType') || undefined}
              aria-describedby={describedBy('partnerType')}
              required
            >
              <option value="">{t.fields.partnerType.placeholder}</option>
              {partnerTypes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            {fieldError('partnerType')}
          </div>
        ) : null}

        {type === 'career' ? (
          <>
            <div className="field">
              <label htmlFor={fid('discipline')} className="field__label">
                {t.fields.discipline.label} {req}
              </label>
              <select
                id={fid('discipline')}
                className="field__control"
                value={values.discipline}
                onChange={(e) => set('discipline', e.target.value)}
                onBlur={() => blur('discipline')}
                aria-invalid={invalid('discipline') || undefined}
                aria-describedby={describedBy('discipline')}
                required
              >
                <option value="">{t.fields.discipline.placeholder}</option>
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
              {fieldError('discipline')}
            </div>
            <div className="field">
              <label htmlFor={fid('experience')} className="field__label">
                {t.fields.experience.label} {opt}
              </label>
              <input
                id={fid('experience')}
                className="field__control field__control--ltr field__control--short"
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={values.experience}
                onChange={(e) => set('experience', e.target.value)}
                onBlur={() => blur('experience')}
                aria-invalid={invalid('experience') || undefined}
                aria-describedby={describedBy('experience', true)}
                maxLength={3}
              />
              <p id={`${fid('experience')}-help`} className="field__help">
                {t.fields.experience.help}
              </p>
              {fieldError('experience')}
            </div>
            <div className="field field--full">
              <label htmlFor={fid('portfolio')} className="field__label">
                {t.fields.portfolio.label} {opt}
              </label>
              <input
                id={fid('portfolio')}
                className="field__control field__control--ltr"
                type="url"
                inputMode="url"
                autoComplete="url"
                dir="ltr"
                value={values.portfolio}
                onChange={(e) => set('portfolio', e.target.value)}
                onBlur={() => blur('portfolio')}
                aria-invalid={invalid('portfolio') || undefined}
                aria-describedby={describedBy('portfolio', true)}
              />
              <p id={`${fid('portfolio')}-help`} className="field__help">
                <Rich text={t.fields.portfolio.help} values={{ scheme: LTR('https://') }} />
              </p>
              {fieldError('portfolio')}
            </div>
          </>
        ) : null}
      </div>

      {type === 'quote' ? (
        <>
          <fieldset className="field field--fieldset" aria-describedby={describedBy('services', true)}>
            <legend className="field__label">
              {t.fields.services.label} {req}
            </legend>
            <p id={`${fid('services')}-help`} className="field__help">
              {t.fields.services.help}
            </p>
            <div className="choice-grid">
              {[...services, { id: 'not-sure', label: t.fields.services.notSure }].map((s, i) => (
                <label key={s.id} className="choice">
                  <input
                    id={fid(`services-${i}`)}
                    type="checkbox"
                    value={s.id}
                    checked={values.services.includes(s.id)}
                    onChange={(e) =>
                      set(
                        'services',
                        e.target.checked ? [...values.services, s.id] : values.services.filter((x) => x !== s.id),
                      )
                    }
                    onBlur={() => blur('services')}
                    aria-invalid={invalid('services') || undefined}
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
            {fieldError('services')}
          </fieldset>

          <fieldset className="field field--fieldset">
            <legend className="field__label">
              {t.fields.scope.label} {opt}
            </legend>
            <div className="choice-grid">
              {[...scopes, { id: '', label: t.fields.scope.none }].map((s) => (
                <label key={s.id || 'none'} className="choice choice--radio">
                  <input
                    type="radio"
                    name={fid('scope')}
                    value={s.id}
                    checked={values.scope === s.id}
                    onChange={() => set('scope', s.id)}
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </>
      ) : null}

      {type !== 'career' ? (
        <div className="field field--full">
          <label htmlFor={fid('details')} className="field__label">
            {detailsCopy.label} {req}
          </label>
          <p id={`${fid('details')}-help`} className="field__help">
            {detailsCopy.help}
          </p>
          <textarea
            id={fid('details')}
            className="field__control field__control--area"
            dir="auto"
            rows={7}
            value={values.details}
            onChange={(e) => set('details', e.target.value)}
            onBlur={() => blur('details')}
            aria-invalid={invalid('details') || undefined}
            aria-describedby={describedBy('details', true)}
            required
            maxLength={LIMITS.details[1] + 200}
          />
          <p className="field__counter" aria-hidden="true">
            {fmt(t.fields.details.counter, { count: [...values.details].length, max: LIMITS.details[1] })}
          </p>
          {fieldError('details')}
        </div>
      ) : null}

      {/* Attachments / CV */}
      <div className="field field--full">
        <p className="field__label" id={`${uid}-files-label`}>
          {type === 'career' ? t.fields.cv.label : t.fields.attachments.label} {opt}
        </p>
        {uploads ? (
          <>
            <p id={fid(kind === 'cv' ? 'cv' : 'attachments')} className="field__help" tabIndex={-1}>
              {type === 'career'
                ? fmt(t.fields.cv.help, { size: formatFileSize(locale, LIMITS.cv.maxFileBytes) })
                : fmt(t.fields.attachments.help, {
                    count: LIMITS.attachments.maxFiles,
                    size: formatFileSize(locale, LIMITS.attachments.maxFileBytes),
                    total: formatFileSize(locale, LIMITS.attachments.maxTotalBytes),
                  })}
            </p>
            {type === 'quote' ? <p className="field__help">{t.fields.attachments.cadNote}</p> : null}
            <div className="file-picker">
              <input
                ref={fileInput}
                id={`${uid}-file`}
                type="file"
                className="file-picker__input"
                accept={kind === 'cv' ? 'application/pdf,.pdf' : 'application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png'}
                multiple={kind !== 'cv'}
                onChange={onFiles}
                aria-describedby={fid(kind === 'cv' ? 'cv' : 'attachments')}
              />
              <label htmlFor={`${uid}-file`} className="btn btn--ghost-light file-picker__button">
                <span className="btn__label">{kind === 'cv' ? t.fields.attachments.chooseOne : t.fields.attachments.choose}</span>
              </label>
            </div>
            {files.length ? (
              <ul className="file-list" aria-live="polite">
                {files.map((f) => (
                  <li key={f.key} className={`file-list__item file-list__item--${f.status}`}>
                    <span className="file-list__name">
                      <bdi>{f.name}</bdi>
                    </span>
                    <span className="file-list__size">{formatFileSize(locale, f.size)}</span>
                    <span className="file-list__status">
                      {t.fields.attachments.status[f.status]}
                      {f.code ? <span className="file-list__reason"> — {errorText(f.code)}</span> : null}
                    </span>
                    <button
                      type="button"
                      className="file-list__remove"
                      onClick={() => removeFile(f.key)}
                      aria-label={fmt(t.fields.attachments.remove, { name: f.name })}
                    >
                      <CloseIcon size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <p className="field__help field__help--notice">{t.fields.attachments.unavailable}</p>
        )}
        {fieldError(kind === 'cv' ? 'cv' : 'attachments')}
      </div>

      <div className="field field--full">
        <label className="choice choice--consent">
          <input
            id={fid('privacy')}
            type="checkbox"
            checked={values.privacy}
            onChange={(e) => set('privacy', e.target.checked)}
            onBlur={() => blur('privacy')}
            aria-invalid={invalid('privacy') || undefined}
            aria-describedby={describedBy('privacy')}
            required
          />
          <span>
            <Rich
              text={t.fields.privacy.label}
              values={{
                policy: (
                  <Link href={privacyHref} className="inline-link">
                    {t.fields.privacy.policy}
                  </Link>
                ),
              }}
            />{' '}
            <span className="field__req">{t.required}</span>
          </span>
        </label>
        {fieldError('privacy')}
      </div>

      {formError ? (
        <p className="field__error" role="alert">
          <AlertIcon size={16} />
          <span>{formError}</span>
        </p>
      ) : null}

      <div className="form__footer">
        <button type="submit" className="btn btn--primary" aria-disabled={submitting || undefined} data-pending={submitting || undefined}>
          {submitting ? <span className="spinner" aria-hidden="true" /> : null}
          <span className="btn__label">{submitting ? submittingText : submitLabel}</span>
        </button>
        <div className="form__status" role="status" aria-live="polite">
          {status === 'submitting' ? <p>{submittingText}</p> : null}
          {status === 'failed' ? (
            <p className="form-notice form-notice--error">
              <AlertIcon size={18} />
              <span>{t.states.failure}</span>
            </p>
          ) : null}
          {status === 'offline' ? (
            <p className="form-notice form-notice--error">
              <AlertIcon size={18} />
              <span>{t.states.offline}</span>
            </p>
          ) : null}
          {status === 'rate-limited' ? (
            <p className="form-notice form-notice--warn">
              <AlertIcon size={18} />
              <span>{t.states.rateLimited}</span>
            </p>
          ) : null}
          {status === 'unavailable' ? (
            <p className="form-notice form-notice--warn">
              <AlertIcon size={18} />
              <span>
                {t.states.unavailable} {t.states.unavailableContact}
              </span>
            </p>
          ) : null}
        </div>
      </div>
      <noscript>
        <p className="form-notice form-notice--warn">{t.states.noscript}</p>
      </noscript>
    </form>
  );
}
