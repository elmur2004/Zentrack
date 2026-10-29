/**
 * Form delivery configuration (server-side only — read from the environment at request time).
 * preview: visibly test-only, nothing is sent or stored.
 * live:    quote requests, partner enquiries and career applications are stored in the dashboard
 *          database (DATABASE_URL, or the local embedded database with DATABASE_DRIVER=pglite).
 *          Without a database every form fails closed ("unavailable").
 * unset:   online submission unavailable.
 * The owner can additionally pause the partner and careers forms in the dashboard (Settings).
 */
import type { FormType } from './schema';

export type FormMode = 'preview' | 'live' | 'unavailable';

export function intakeConfigured(): boolean {
  return !!process.env.DATABASE_URL?.trim() || process.env.DATABASE_DRIVER?.trim() === 'pglite';
}

export function getFormMode(type: FormType = 'quote'): FormMode {
  void type;
  const mode = process.env.FORM_MODE?.trim();
  if (mode === 'preview') return 'preview';
  if (mode === 'live') return intakeConfigured() ? 'live' : 'unavailable';
  return 'unavailable';
}

/**
 * Attachments: preview validates and discards them. In live mode, quote attachments and CVs go
 * to private storage bound to the visitor's upload session, quarantined until staff release
 * them (no automatic scanner is configured: OD-06).
 */
export function uploadsEnabled(kind: 'attachment' | 'cv' = 'attachment'): boolean {
  const mode = getFormMode(kind === 'cv' ? 'career' : 'quote');
  return mode === 'preview' || mode === 'live';
}
