import type { Localized } from '@/i18n/config';

/**
 * Company facts. Sources: F1 p1–2, F3 Questionnaire rows 8–9, Decisions D01–D02.
 * The long legal name is kept only in private records until its spelling is verified.
 */
export const company = {
  name: { en: 'Zentrac', ar: 'زينتراك' } satisfies Localized<string>,
  arabicName: 'زينتراك للاستشارات و الخدمات الهندسية المتكاملة',
  foundingYear: 2026,
  founderExperienceSince: 2018,
  address: {
    en: ['6th Floor, 1 Roxy Square', 'Heliopolis, Cairo', 'Egypt'],
    ar: ['الدور السادس، 1 ميدان روكسي', 'مصر الجديدة، القاهرة', 'مصر'],
  } satisfies Localized<string[]>,
  addressSchema: {
    streetAddress: '6th Floor, 1 Roxy Square',
    addressLocality: 'Heliopolis, Cairo',
    addressCountry: 'EG',
  },
};

// Public contact channels are edited by the owner in the dashboard (Settings → Public contact
// details) and read through src/server/public/site-settings.ts; see src/lib/contacts.ts.
