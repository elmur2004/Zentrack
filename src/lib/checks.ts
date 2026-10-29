/**
 * Shared validation used by `npm run check:locales`, `npm run check:content` and unit tests.
 * Pure functions: no file system access.
 */
import { hasForbiddenText } from './content/projection';

export interface Issue {
  path: string;
  message: string;
}

const ARABIC = /[؀-ۿ]/;
/** Values that are legitimately identical in both languages (identifiers, years, codes). */
const LANGUAGE_NEUTRAL = /^(?:[A-Z]{2,4}-\d{2,4}|\d{4}|[\d\s·×/–-]+|https?:\/\/\S+|[A-Z0-9]{1,4}(?: [A-Z0-9]{1,4})?)$/;

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

/** Deep structural comparison of two dictionaries (keys, array lengths, placeholders, emptiness). */
export function compareDictionaries(en: unknown, ar: unknown, path = ''): Issue[] {
  const issues: Issue[] = [];
  // Stable identifiers (anchors, record IDs) must be identical in both languages, not translated.
  if (/\.id$/.test(path) && typeof en === 'string') {
    return en === ar ? [] : [{ path, message: `stable id differs between languages ("${en}" vs "${String(ar)}")` }];
  }
  if (typeof en === 'string') {
    if (typeof ar !== 'string') return [{ path, message: 'missing Arabic string' }];
    if (!ar.trim()) issues.push({ path, message: 'empty Arabic string' });
    if (!en.trim()) issues.push({ path, message: 'empty English string' });
    if (placeholders(en) !== placeholders(ar)) issues.push({ path, message: `placeholder mismatch {${placeholders(en)}} vs {${placeholders(ar)}}` });
    if (ar === en && !ARABIC.test(ar) && ar.length > 3 && !LANGUAGE_NEUTRAL.test(ar.trim()))
      issues.push({ path, message: `looks untranslated: "${ar}"` });
    if (/[‎‏‪-‮⁦-⁩]/.test(en + ar)) issues.push({ path, message: 'hidden bidi control character in stored text' });
    return issues;
  }
  if (Array.isArray(en)) {
    if (!Array.isArray(ar)) return [{ path, message: 'Arabic value is not an array' }];
    if (en.length !== ar.length) issues.push({ path, message: `array length ${en.length} vs ${ar.length}` });
    en.forEach((item, i) => issues.push(...compareDictionaries(item, ar[i], `${path}[${i}]`)));
    return issues;
  }
  if (en && typeof en === 'object') {
    if (!ar || typeof ar !== 'object') return [{ path, message: 'missing Arabic object' }];
    const ek = Object.keys(en as object).sort();
    const ak = Object.keys(ar as object).sort();
    for (const k of ek) if (!ak.includes(k)) issues.push({ path: `${path}.${k}`, message: 'key missing in Arabic' });
    for (const k of ak) if (!ek.includes(k)) issues.push({ path: `${path}.${k}`, message: 'extra key in Arabic' });
    for (const k of ek)
      if (ak.includes(k)) issues.push(...compareDictionaries((en as Record<string, unknown>)[k], (ar as Record<string, unknown>)[k], `${path}.${k}`));
  }
  return issues;
}

/** Finds every {en, ar} pair inside content records and checks bilingual parity. */
export function checkLocalizedRecords(value: unknown, path = ''): Issue[] {
  const issues: Issue[] = [];
  if (Array.isArray(value)) {
    value.forEach((v, i) => issues.push(...checkLocalizedRecords(v, `${path}[${i}]`)));
    return issues;
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.includes('en') && keys.includes('ar') && keys.length === 2) return compareDictionaries(obj.en, obj.ar, path);
    if (keys.includes('en') !== keys.includes('ar')) issues.push({ path, message: 'localized value missing one language' });
    for (const k of keys) issues.push(...checkLocalizedRecords(obj[k], `${path}.${k}`));
  }
  return issues;
}

/** Collects every string in a value (for placeholder / forbidden-claim scans). */
export function collectStrings(value: unknown, path = '', out: Array<[string, string]> = []): Array<[string, string]> {
  if (typeof value === 'string') out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => collectStrings(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) collectStrings(v, `${path}.${k}`, out);
  return out;
}

export function scanForbidden(value: unknown, root: string): Issue[] {
  return collectStrings(value, root)
    .map(([p, s]) => {
      const re = hasForbiddenText(s);
      return re ? { path: p, message: `forbidden/placeholder text (${re}): "${s.slice(0, 80)}"` } : null;
    })
    .filter((x): x is Issue => !!x);
}

/** Keys that must never appear in a public projection. */
export const PRIVATE_KEYS = ['approvalEvidence', 'internalNotes', 'sources', 'publication', 'projectParties', 'registeredPath', 'actualFile'];

export function findPrivateKeys(value: unknown, path = ''): Issue[] {
  const issues: Issue[] = [];
  if (Array.isArray(value)) value.forEach((v, i) => issues.push(...findPrivateKeys(v, `${path}[${i}]`)));
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (PRIVATE_KEYS.includes(k)) issues.push({ path: `${path}.${k}`, message: 'private field in public projection' });
      issues.push(...findPrivateKeys(v, `${path}.${k}`));
    }
  return issues;
}
