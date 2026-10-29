import 'server-only';
/**
 * Owner-managed public settings (contact channels, partner/careers form availability) for the
 * public website. Read from the dashboard database at request/revalidation time.
 *
 * - During `next build` nothing is read (build machines may have no database access, and the
 *   embedded local database must not be opened by parallel build workers). Prerendered pages
 *   are refreshed at runtime by ISR (site layout `revalidate`) and immediately on every save in
 *   the dashboard (revalidatePath).
 * - Without a configured database, or if the read fails, the safe fallback applies: no contact
 *   channels are shown and both forms count as open (their delivery mode decides availability).
 * - A short in-process cache keeps per-request pages (forms) from querying on every view; a
 *   dashboard save clears it in the same process.
 */
import { EMPTY_CONTACTS, type ContactChannels } from '@/lib/contacts';
import { databaseConfigured, getDb } from '../db/client';
import { getPublicSettings } from '../admin/settings';

export interface PublicSiteSettings {
  contacts: ContactChannels;
  partnerIntakeOpen: boolean;
  careerIntakeOpen: boolean;
}

const FALLBACK: PublicSiteSettings = { contacts: { ...EMPTY_CONTACTS }, partnerIntakeOpen: true, careerIntakeOpen: true };
const TTL_MS = 30_000;

const g = globalThis as unknown as { __zntPublicSettings?: { at: number; value: PublicSiteSettings } };

export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  if (isBuildPhase() || !databaseConfigured()) return FALLBACK;
  const hit = g.__zntPublicSettings;
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  try {
    const s = await getPublicSettings(await getDb());
    const value = { contacts: s.publicContacts, partnerIntakeOpen: s.partnerIntakeOpen, careerIntakeOpen: s.careerIntakeOpen };
    g.__zntPublicSettings = { at: Date.now(), value };
    return value;
  } catch (e) {
    console.error('[public] settings unavailable', e instanceof Error ? e.name : typeof e);
    return FALLBACK;
  }
}

export async function getPublicContacts(): Promise<ContactChannels> {
  return (await getPublicSiteSettings()).contacts;
}

export function clearPublicSiteSettingsCache() {
  g.__zntPublicSettings = undefined;
}
