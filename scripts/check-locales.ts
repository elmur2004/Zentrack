/**
 * npm run check:locales
 * Fails if the Arabic dictionary or any bilingual content record is missing a key, has a
 * different array length or placeholder set, is empty, looks untranslated, or contains hidden
 * bidi control characters.
 */
import { en, ar } from '../src/i18n/messages';
import { adminEn, adminAr } from '../src/i18n/admin';
import { services } from '../src/content/public/services';
import { networks } from '../src/content/public/networks';
import { stages, engagements } from '../src/content/public/track';
import { audiences, partnerTypes, principles, projectTypes, values } from '../src/content/public/editorial';
import { company } from '../src/content/public/company';
import { checkLocalizedRecords, compareDictionaries } from '../src/lib/checks';

const issues = [
  ...compareDictionaries(en, ar, 'messages'),
  ...compareDictionaries(adminEn, adminAr, 'admin'),
  ...checkLocalizedRecords({ services, networks, stages, engagements, audiences, partnerTypes, principles, values, projectTypes, company }, 'content'),
];

const keyCount = (o: unknown): number =>
  typeof o === 'string' ? 1 : Array.isArray(o) ? o.reduce((n, x) => n + keyCount(x), 0) : o && typeof o === 'object' ? Object.values(o).reduce((n: number, x) => n + keyCount(x), 0) : 0;

if (issues.length) {
  for (const i of issues) console.error(`✗ ${i.path}: ${i.message}`);
  console.error(`\n${issues.length} locale issue(s).`);
  process.exit(1);
}
console.log(
  `✓ Locale parity OK — ${keyCount(en)} public and ${keyCount(adminEn)} admin dictionary strings and all bilingual content records match in English and Arabic.`,
);
