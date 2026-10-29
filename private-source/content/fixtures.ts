/**
 * PRIVATE — SYNTHETIC fixture record for QA of the case-study template and gallery dialog.
 * Not a real project. Rendered only in the private review build, with the record banner.
 */
import type { InternalAsset, InternalProject } from '@/lib/content/types';

export const fixtureProject: InternalProject = {
  id: 'FX1',
  slug: 'synthetic-fixture-utilities-package',
  title: { en: 'Synthetic Fixture — Utilities Coordination Package', ar: 'سجل تجريبي — حزمة تنسيق مرافق' },
  summary: {
    en: 'Synthetic test record used to check the case-study template, facts panel and gallery dialog. It does not describe a real project.',
    ar: 'سجل اختباري تجريبي للتحقق من قالب دراسة الحالة ولوحة البيانات وعارض الصور. لا يصف مشروعًا حقيقيًا.',
  },
  scope: {
    en: ['Synthetic scope line one', 'Synthetic scope line two with LOD 400 and RFI-024 tokens'],
    ar: ['سطر نطاق تجريبي أول', 'سطر نطاق تجريبي ثانٍ يتضمن LOD 400 و RFI-024'],
  },
  packageLabel: { en: 'Fixture package', ar: 'حزمة تجريبية' },
  countryCode: 'EG',
  sector: 'urban',
  serviceIds: ['coordination', 'shop-drawings'],
  networkIds: ['water', 'stormwater'],
  attribution: 'founder-bim-experts',
  projectParties: [{ name: 'Fixture Developer Ltd', role: { en: 'Developer (synthetic)', ar: 'المطور (تجريبي)' } }],
  directAppointingParty: 'Fixture Contractor Co',
  assetIds: ['FXA1', 'FXA2', 'FXA3'],
  publication: { state: 'draft', approvedFields: [] },
  sources: [],
  internalNotes: ['Synthetic QA fixture (spec §17.4: use synthetic, non-sensitive fixtures in QA evidence).'],
};

const asset = (n: number, w: number, h: number): InternalAsset => ({
  id: `FXA${n}`,
  projectId: 'FX1',
  registeredPath: `private-source/fixtures/fixture-${n}.png`,
  actualFile: `private-source/fixtures/fixture-${n}.png`,
  actualSize: { width: w, height: h },
  source: [],
  description: { en: `Synthetic image ${n}`, ar: `صورة تجريبية ${n}` },
  alt: { en: `Synthetic test drawing ${n} of 3`, ar: `رسم اختباري تجريبي ${n} من 3` },
  caption: { en: `Synthetic fixture image ${n} — not project data`, ar: `صورة تجريبية ${n} — ليست بيانات مشروع` },
  publication: { state: 'draft' },
  internalNotes: [],
});

export const fixtureAssets: InternalAsset[] = [asset(1, 1600, 1000), asset(2, 1200, 1200), asset(3, 2000, 800)];
