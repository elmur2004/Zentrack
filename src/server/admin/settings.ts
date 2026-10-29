import { inArray } from 'drizzle-orm';
import { z } from 'zod';
import { EMPTY_CONTACTS, normalizeContacts, storedContacts, type ContactChannels } from '@/lib/contacts';
import type { DbOrTx } from '../db/client';
import { setting } from '../db/schema';
import { audit } from './audit';
import { DomainError } from './errors';
import { assertCan, type Actor } from './policy';
import { DEFAULT_TIMEZONE, isValidTimeZone } from './time';
import { TEMPLATE_KEYS, type TemplateOverrides } from './templates';

export interface AdminSettings {
  timezone: string;
  /** An assignee is required before preparing or sending a quote. */
  requireAssigneeForQuote: boolean;
  /** In-app notification to owners/managers when a request arrives. */
  notifyOnNewRequest: boolean;
  /** Staff emails (only effective when an email transport is configured). */
  emailNotifications: boolean;
  /**
   * Owners/managers must enrol two-factor authentication before using the dashboard.
   * Owner decision 28 Oct 2026 (OD-26): not required; two-factor stays optional per account.
   */
  requireMfaForPrivileged: boolean;
  /** Editable client-message templates (fallback to built-ins). */
  templates: TemplateOverrides;
  /** Public contact channels shown on the website (OD-02). Empty = not shown. */
  publicContacts: ContactChannels;
  /** The public partner and careers forms accept submissions (owner can pause either). */
  partnerIntakeOpen: boolean;
  careerIntakeOpen: boolean;
}

export const DEFAULT_SETTINGS: AdminSettings = {
  timezone: DEFAULT_TIMEZONE,
  requireAssigneeForQuote: true,
  notifyOnNewRequest: true,
  emailNotifications: false,
  requireMfaForPrivileged: false,
  templates: {},
  publicContacts: { ...EMPTY_CONTACTS },
  partnerIntakeOpen: true,
  careerIntakeOpen: true,
};

/** Settings the public website reads (contact details and form availability). */
export const PUBLIC_SETTING_KEYS = ['publicContacts', 'partnerIntakeOpen', 'careerIntakeOpen'] as const;

const templateSchema = z.object({ subject: z.string().trim().min(1).max(200), body: z.string().trim().min(1).max(8000) });
const schema = z.object({
  timezone: z.string().refine(isValidTimeZone),
  requireAssigneeForQuote: z.boolean(),
  notifyOnNewRequest: z.boolean(),
  emailNotifications: z.boolean(),
  requireMfaForPrivileged: z.boolean(),
  // partialRecord: customising only some templates is valid (z.record with an enum key is exhaustive in Zod 4).
  templates: z.partialRecord(z.enum(TEMPLATE_KEYS), z.object({ en: templateSchema.optional(), ar: templateSchema.optional() })),
  publicContacts: z.object({ email: z.string(), phone: z.string(), whatsapp: z.string(), linkedin: z.string() }),
  partnerIntakeOpen: z.boolean(),
  careerIntakeOpen: z.boolean(),
});

export async function getSettings(db: DbOrTx): Promise<AdminSettings> {
  const rows = await db.select().from(setting);
  const out: AdminSettings = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    if (r.key in out) (out as unknown as Record<string, unknown>)[r.key] = r.value;
  }
  if (!isValidTimeZone(out.timezone)) out.timezone = DEFAULT_TIMEZONE;
  out.publicContacts = storedContacts(out.publicContacts);
  if (typeof out.partnerIntakeOpen !== 'boolean') out.partnerIntakeOpen = true;
  if (typeof out.careerIntakeOpen !== 'boolean') out.careerIntakeOpen = true;
  return out;
}

/** Only the public keys (used by public pages and the enquiry endpoint). */
export async function getPublicSettings(db: DbOrTx): Promise<Pick<AdminSettings, (typeof PUBLIC_SETTING_KEYS)[number]>> {
  const rows = await db.select().from(setting).where(inArray(setting.key, [...PUBLIC_SETTING_KEYS]));
  const value = (k: string) => rows.find((r) => r.key === k)?.value;
  return {
    publicContacts: storedContacts(value('publicContacts')),
    partnerIntakeOpen: typeof value('partnerIntakeOpen') === 'boolean' ? (value('partnerIntakeOpen') as boolean) : true,
    careerIntakeOpen: typeof value('careerIntakeOpen') === 'boolean' ? (value('careerIntakeOpen') as boolean) : true,
  };
}

export async function updateSettings(db: DbOrTx, actor: Actor, patch: Partial<AdminSettings>) {
  assertCan(actor, 'settings.manage');
  const current = await getSettings(db);
  if (patch.publicContacts !== undefined) {
    const contacts = normalizeContacts((patch.publicContacts ?? {}) as unknown as Record<string, unknown>);
    if (!contacts.ok) throw new DomainError('validation', { field: `contact_${contacts.field}` });
    patch = { ...patch, publicContacts: contacts.value };
  }
  const next = { ...current, ...patch };
  const parsed = schema.safeParse(next);
  if (!parsed.success) throw new DomainError('validation', { field: String(parsed.error.issues[0]?.path[0] ?? 'settings') });
  const changed: string[] = [];
  for (const key of Object.keys(patch) as Array<keyof AdminSettings>) {
    if (JSON.stringify(current[key]) === JSON.stringify(parsed.data[key])) continue;
    changed.push(key);
    await db
      .insert(setting)
      .values({ key, value: parsed.data[key] as unknown as object, updatedBy: actor.userId, updatedAt: new Date() })
      .onConflictDoUpdate({ target: setting.key, set: { value: parsed.data[key] as unknown as object, updatedBy: actor.userId, updatedAt: new Date() } });
  }
  if (changed.length) await audit(db, { actorId: actor.userId, action: 'settings.updated', category: 'settings', metadata: { keys: changed } });
  return parsed.data;
}
