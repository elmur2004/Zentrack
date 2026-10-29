import type { Localized } from '@/i18n/config';

/** The Zentrac Track (F4 §6, F2 p9; spec §9.4). */
export interface Stage {
  id: 'review' | 'model' | 'coordinate' | 'drawings' | 'quantities' | 'site-support';
  number: string;
  title: Localized<string>;
  text: Localized<string>;
  input: Localized<string>;
  output: Localized<string>;
}

export const stages: Stage[] = [
  {
    id: 'review',
    number: '01',
    title: { en: 'Review', ar: 'المراجعة' },
    text: {
      en: 'We review the supplied drawings and site information and record gaps before modelling starts.',
      ar: 'نراجع المخططات ومعلومات الموقع المسلَّمة إلينا، ونسجل الثغرات قبل بدء النمذجة.',
    },
    input: { en: 'Design drawings, specifications, site information', ar: 'المخططات التصميمية والمواصفات ومعلومات الموقع' },
    output: { en: 'Review notes and RFIs', ar: 'ملاحظات المراجعة وطلبات الاستيضاح الفني' },
  },
  {
    id: 'model',
    number: '02',
    title: { en: 'Model', ar: 'النمذجة' },
    text: {
      en: 'We build discipline models to the agreed BEP and scope.',
      ar: 'نبني نماذج التخصصات وفق خطة التنفيذ (BEP) والنطاق المتفق عليهما.',
    },
    input: { en: 'Reviewed design, BEP, coordinates', ar: 'التصميم بعد مراجعته، وخطة التنفيذ (BEP)، والإحداثيات' },
    output: { en: 'Discipline models', ar: 'نماذج التخصصات' },
  },
  {
    id: 'coordinate',
    number: '03',
    title: { en: 'Coordinate', ar: 'التنسيق' },
    text: {
      en: 'We run clash checks in a federated model and track coordination issues.',
      ar: 'نجري فحوص التعارضات في نموذج موحد ونتابع مشكلات التنسيق.',
    },
    input: { en: 'Discipline models, coordination rules', ar: 'نماذج التخصصات وقواعد التنسيق' },
    output: { en: 'Clash reports and issue register', ar: 'تقارير كشف التعارضات وسجل المشكلات' },
  },
  {
    id: 'drawings',
    number: '04',
    title: { en: 'Drawings', ar: 'المخططات' },
    text: {
      en: 'We extract the agreed shop drawings from the coordinated model.',
      ar: 'نستخرج المخططات التنفيذية المتفق عليها من النموذج المنسق.',
    },
    input: { en: 'Coordinated model, title blocks, drawing list', ar: 'النموذج المنسق وإطارات العنوان وقائمة المخططات' },
    output: { en: 'Shop and combined services drawings', ar: 'المخططات التنفيذية ومخططات تنسيق الخدمات' },
  },
  {
    id: 'quantities',
    number: '05',
    title: { en: 'Quantities', ar: 'الكميات' },
    text: {
      en: 'We prepare the agreed model-based quantities and schedules.',
      ar: 'نعد الكميات والجداول المتفق عليها اعتمادًا على النموذج.',
    },
    input: { en: 'Measurement rules, agreed model scope', ar: 'قواعد القياس ونطاق النموذج المتفق عليه' },
    output: { en: 'Quantity take-offs and schedules', ar: 'حصر الكميات وجداولها' },
  },
  {
    id: 'site-support',
    number: '06',
    title: { en: 'Site Support', ar: 'الدعم الفني للموقع' },
    text: {
      en: 'We support site queries and model updates through to as-built handover.',
      ar: 'نقدم الدعم في استفسارات الموقع وتحديثات النموذج حتى تسليم نماذج الحالة المنفذة.',
    },
    input: { en: 'Site queries, verified site changes', ar: 'استفسارات الموقع وتعديلاته الموثقة' },
    output: { en: 'Updated and as-built models', ar: 'نماذج محدثة ونماذج الحالة المنفذة' },
  },
];

export const engagementIds = ['package', 'network', 'coordination', 'full'] as const;
export type EngagementId = (typeof engagementIds)[number];

export const engagements: Array<{ id: EngagementId; title: Localized<string>; text: Localized<string> }> = [
  {
    id: 'package',
    title: { en: 'One package', ar: 'حزمة محددة' },
    text: {
      en: 'A single defined package, such as one zone or one drawing set.',
      ar: 'حزمة واحدة محددة، مثل منطقة واحدة أو مجموعة مخططات واحدة.',
    },
  },
  {
    id: 'network',
    title: { en: 'One network', ar: 'شبكة محددة' },
    text: {
      en: 'One infrastructure category, modelled and coordinated across a project.',
      ar: 'مجال واحد من البنية التحتية، يُنمذج ويُنسق على مستوى المشروع.',
    },
  },
  {
    id: 'coordination',
    title: { en: 'Coordination only', ar: 'التنسيق فقط' },
    text: {
      en: 'Federation, clash detection and issue tracking for models produced by others.',
      ar: 'تجميع النماذج وكشف التعارضات وتتبع المشكلات لنماذج أعدها آخرون.',
    },
  },
  {
    id: 'full',
    title: { en: 'Full agreed scope', ar: 'النطاق الكامل المتفق عليه' },
    text: {
      en: 'From review through to site support, as agreed for the project.',
      ar: 'من المراجعة حتى الدعم الفني للموقع، وفق ما يُتفق عليه للمشروع.',
    },
  },
];
