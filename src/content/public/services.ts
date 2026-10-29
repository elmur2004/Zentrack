import type { Localized } from '@/i18n/config';
import type { ServiceSlug } from '@/i18n/routes';

/**
 * Five core services. Source: F4 (service pages), F2 p7, qualified per spec §9.2.
 * Input/deliverable lists are editorial recommendations; contractual scope is project-specific.
 */
export interface Service {
  id: ServiceSlug;
  number: string;
  name: Localized<string>;
  short: Localized<string>;
  summary: Localized<string>;
  included: Localized<string[]>;
  inputs: Localized<string[]>;
  deliverables: Localized<string[]>;
  /** Emphasis for Review → Model → Coordinate → Deliver, one line per step */
  process: Localized<[string, string, string, string]>;
  scopeNote?: Localized<string>;
  /** Related record (internal project ID). Rendered only when the record and an asset are approved. */
  relatedProjectId?: string;
  visual: 'model' | 'coordination' | 'drawing' | 'review' | 'quantities';
}

export const services: Service[] = [
  {
    id: 'bim-modelling',
    number: '01',
    visual: 'model',
    name: { en: 'BIM Modelling', ar: 'نمذجة معلومات البناء' },
    short: {
      en: '3D models for infrastructure, landscape and buildings, to your BEP and agreed LOD.',
      ar: 'نماذج ثلاثية الأبعاد للبنية التحتية وتنسيق المواقع والمباني، وفق خطة تنفيذ نمذجة معلومات البناء (BEP) الخاصة بك ومستوى التطوير (LOD) المتفق عليه.',
    },
    summary: {
      en: 'We build 3D models for infrastructure, landscape and building projects according to your BIM Execution Plan (BEP) and the agreed Level of Development (LOD), up to LOD 400 where the scope requires it.',
      ar: 'نبني نماذج ثلاثية الأبعاد لمشروعات البنية التحتية وتنسيق المواقع والمباني وفق خطة تنفيذ نمذجة معلومات البناء (BEP) الخاصة بك ومستوى التطوير (LOD) المتفق عليه، بما يصل إلى LOD 400 عندما يتطلب النطاق ذلك.',
    },
    included: {
      en: [
        'Discipline models for utilities, roads, landscape and buildings within the agreed scope',
        'Modelling to your BEP, templates, naming conventions and coordinate system',
        'Level of Development (LOD) agreed for each element and its intended use',
        'RFIs raised for missing or conflicting design information',
      ],
      ar: [
        'نماذج التخصصات للمرافق والطرق وتنسيق المواقع والمباني ضمن النطاق المتفق عليه',
        'النمذجة وفق خطة التنفيذ (BEP) والقوالب وقواعد التسمية ونظام الإحداثيات الخاصة بك',
        'مستوى تطوير يُتفق عليه لكل عنصر وفق الاستخدام المقصود منه',
        'طلبات استيضاح فني للمعلومات التصميمية الناقصة أو المتعارضة',
      ],
    },
    inputs: {
      en: [
        'Design drawings and specifications',
        'BIM Execution Plan (BEP) and model requirements',
        'Coordinates and survey reference information',
        'Scope boundaries and responsibility matrix',
      ],
      ar: [
        'المخططات التصميمية والمواصفات',
        'خطة تنفيذ نمذجة معلومات البناء (BEP) ومتطلبات النموذج',
        'الإحداثيات والمعلومات المرجعية للرفع المساحي',
        'حدود النطاق ومصفوفة المسؤوليات',
      ],
    },
    deliverables: {
      en: ['Agreed discipline models', 'RFI register'],
      ar: ['نماذج التخصصات المتفق عليها', 'سجل طلبات الاستيضاح الفني'],
    },
    process: {
      en: [
        'Check the design inputs and record gaps',
        'Build models to the BEP and agreed LOD',
        'Run internal checks between disciplines',
        'Issue models with the RFI register',
      ],
      ar: [
        'فحص المدخلات التصميمية وتسجيل الثغرات',
        'بناء النماذج وفق خطة التنفيذ (BEP) ومستوى التطوير (LOD) المتفق عليه',
        'إجراء فحوص داخلية بين التخصصات',
        'تسليم النماذج مع سجل طلبات الاستيضاح الفني',
      ],
    },
    scopeNote: {
      en: 'LOD describes the agreed level of development for each element and its intended use. It is defined per scope and is not a blanket statement about every element or about fabrication accuracy.',
      ar: 'يصف مستوى التطوير (LOD) درجة التطوير المتفق عليها لكل عنصر وفق استخدامه المقصود، ويُحدد لكل نطاق، ولا يُعد وصفًا شاملًا لجميع العناصر ولا مؤشرًا على دقة التصنيع.',
    },
    relatedProjectId: 'P05',
  },
  {
    id: 'coordination',
    number: '02',
    visual: 'coordination',
    name: { en: 'Coordination', ar: 'التنسيق بين التخصصات' },
    short: {
      en: 'Federated models, clash detection and tracked issue follow-up between disciplines.',
      ar: 'تجميع النماذج وكشف التعارضات وتتبع المشكلات ومتابعتها بين التخصصات.',
    },
    summary: {
      en: 'We combine discipline models into one federated model, run clash detection and track each issue until it is resolved by the responsible party.',
      ar: 'نجمع نماذج التخصصات في نموذج موحد، ونجري كشف التعارضات، ونتابع كل مشكلة حتى يعالجها الطرف المسؤول.',
    },
    included: {
      en: [
        'Federation of discipline models',
        'Clash detection to agreed rules and tolerances',
        'Clash reports grouped by priority and responsibility',
        'Issue tracking and follow-up with the responsible parties',
        'RFIs for design questions',
      ],
      ar: [
        'تجميع نماذج التخصصات في نموذج موحد',
        'كشف التعارضات وفق القواعد والسماحات المتفق عليها',
        'تقارير كشف التعارضات مصنفة حسب الأولوية والمسؤولية',
        'تتبع المشكلات ومتابعتها مع الأطراف المسؤولة',
        'طلبات استيضاح فني للأسئلة التصميمية',
      ],
    },
    inputs: {
      en: ['Discipline models', 'Coordination rules and tolerances', 'Issue priorities', 'Responsibility matrix'],
      ar: ['نماذج التخصصات', 'قواعد التنسيق والسماحات', 'أولويات المشكلات', 'مصفوفة المسؤوليات'],
    },
    deliverables: {
      en: ['Coordinated (federated) model', 'Clash report', 'RFI register'],
      ar: ['نموذج منسق (موحد)', 'تقرير كشف التعارضات', 'سجل طلبات الاستيضاح الفني'],
    },
    process: {
      en: [
        'Agree rules, tolerances and responsibilities',
        'Federate the discipline models',
        'Detect, group and assign clashes',
        'Issue reports and track each issue to closure',
      ],
      ar: [
        'الاتفاق على القواعد والسماحات والمسؤوليات',
        'تجميع نماذج التخصصات',
        'كشف التعارضات وتصنيفها وإسنادها إلى الأطراف المسؤولة',
        'إصدار التقارير ومتابعة كل مشكلة حتى إغلاقها',
      ],
    },
    relatedProjectId: 'P01',
  },
  {
    id: 'shop-drawings',
    number: '03',
    visual: 'drawing',
    name: { en: 'Shop Drawings', ar: 'المخططات التنفيذية' },
    short: {
      en: 'Shop drawings and combined services drawings produced from the coordinated model.',
      ar: 'مخططات تنفيذية ومخططات تنسيق الخدمات مستخرجة من النموذج المنسق.',
    },
    summary: {
      en: 'We produce shop drawings and combined services drawings from the coordinated model, prepared for consultant review.',
      ar: 'نعد المخططات التنفيذية ومخططات تنسيق الخدمات من النموذج المنسق تمهيدًا لمراجعة الاستشاري.',
    },
    included: {
      en: [
        'Shop drawings extracted from the coordinated model',
        'Combined services drawings showing the interfaces between networks',
        'Sheets to your title blocks, drawing standards and drawing list',
        'Revisions in response to review comments within the agreed scope',
      ],
      ar: [
        'مخططات تنفيذية مستخرجة من النموذج المنسق',
        'مخططات تنسيق الخدمات التي توضح نقاط التداخل بين الشبكات',
        'لوحات وفق إطارات العنوان ومعايير الرسم وقائمة المخططات الخاصة بك',
        'تعديلات استجابةً لملاحظات المراجعة ضمن النطاق المتفق عليه',
      ],
    },
    inputs: {
      en: ['Coordinated model', 'Title blocks and drawing standards', 'Drawing list', 'Review and submission requirements'],
      ar: ['النموذج المنسق', 'إطارات العنوان ومعايير الرسم', 'قائمة المخططات', 'متطلبات المراجعة والتقديم'],
    },
    deliverables: {
      en: ['Shop drawings', 'Combined services drawings', 'Relevant clash report'],
      ar: ['المخططات التنفيذية', 'مخططات تنسيق الخدمات', 'تقرير كشف التعارضات ذو الصلة'],
    },
    process: {
      en: [
        'Confirm the drawing list and standards',
        'Check the model is ready for extraction',
        'Resolve or raise remaining clashes affecting the sheets',
        'Issue sheets for consultant review',
      ],
      ar: [
        'تأكيد قائمة المخططات ومعاييرها',
        'التحقق من جاهزية النموذج لاستخراج المخططات',
        'معالجة التعارضات المتبقية التي تؤثر في اللوحات أو إحالتها',
        'إصدار اللوحات لمراجعة الاستشاري',
      ],
    },
    scopeNote: {
      en: 'Prepared for review does not mean approved. Approval remains with the reviewing consultant.',
      ar: 'الجاهزية للمراجعة لا تعني الاعتماد؛ فالاعتماد يبقى من صلاحية الاستشاري المراجِع.',
    },
    relatedProjectId: 'P02',
  },
  {
    id: 'design-review',
    number: '04',
    visual: 'review',
    name: { en: 'Design Review', ar: 'مراجعة التصميم' },
    short: {
      en: 'Review of design drawings before modelling starts, with gaps raised as RFIs.',
      ar: 'مراجعة المخططات التصميمية قبل بدء النمذجة، وإحالة الثغرات في صورة طلبات استيضاح فني.',
    },
    summary: {
      en: 'We review design drawings before modelling starts and send any missing or conflicting information back as RFIs.',
      ar: 'نراجع المخططات التصميمية قبل بدء النمذجة، ونُحيل أي نقص أو تعارض في المعلومات في صورة طلبات استيضاح فني.',
    },
    included: {
      en: [
        'Review of the design package against the specification and reference information',
        'Identification of missing, unclear or conflicting information',
        'Requests for Information (RFIs) raised and logged',
        'A review report summarising the findings',
      ],
      ar: [
        'مراجعة الحزمة التصميمية في ضوء المواصفات والمعلومات المرجعية',
        'تحديد المعلومات الناقصة أو غير الواضحة أو المتعارضة',
        'رفع طلبات الاستيضاح الفني (RFI) وتسجيلها',
        'تقرير مراجعة يلخص النتائج',
      ],
    },
    inputs: {
      en: ['Design drawings', 'Specifications', 'Reference and site information'],
      ar: ['المخططات التصميمية', 'المواصفات', 'المعلومات المرجعية ومعلومات الموقع'],
    },
    deliverables: {
      en: ['Design review report', 'RFI register'],
      ar: ['تقرير مراجعة التصميم', 'سجل طلبات الاستيضاح الفني'],
    },
    process: {
      en: [
        'Read the package against the specification',
        'Test whether the design can be modelled as drawn',
        'Check interfaces between disciplines',
        'Issue the review report and RFIs',
      ],
      ar: [
        'قراءة الحزمة في ضوء المواصفات',
        'اختبار إمكانية نمذجة التصميم كما هو مرسوم',
        'فحص نقاط التداخل بين التخصصات',
        'إصدار تقرير المراجعة وطلبات الاستيضاح الفني',
      ],
    },
    scopeNote: {
      en: 'A design review identifies information gaps for modelling and coordination. It does not replace the design consultant’s responsibility.',
      ar: 'تحدد مراجعة التصميم الثغرات في المعلومات اللازمة للنمذجة والتنسيق، ولا تحل محل مسؤولية الاستشاري المصمم.',
    },
  },
  {
    id: 'quantities-as-built',
    number: '05',
    visual: 'quantities',
    name: { en: 'Quantities and As-built', ar: 'حصر الكميات ونماذج الحالة المنفذة' },
    short: {
      en: 'Model-based quantity take-offs, site support and as-built models.',
      ar: 'حصر الكميات من النموذج، والدعم الفني للموقع، ونماذج الحالة المنفذة.',
    },
    summary: {
      en: 'We prepare quantity take-offs from the model, support the site during construction and update models to as-built status within the agreed scope.',
      ar: 'نعد حصر الكميات من النموذج، وندعم الموقع أثناء التنفيذ، ونحدّث النماذج لتعكس الحالة المنفذة ضمن النطاق المتفق عليه.',
    },
    included: {
      en: [
        'Quantity take-offs and schedules from the agreed model scope',
        'Measurement to the agreed rules',
        'Support for site queries and model updates',
        'As-built models based on verified site information supplied to us',
      ],
      ar: [
        'حصر الكميات وجداولها من نطاق النموذج المتفق عليه',
        'القياس وفق القواعد المتفق عليها',
        'دعم استفسارات الموقع وتحديثات النموذج',
        'نماذج الحالة المنفذة بناءً على معلومات موقع موثقة تُسلَّم إلينا',
      ],
    },
    inputs: {
      en: ['Measurement rules', 'Agreed model scope', 'Verified site changes and survey information'],
      ar: ['قواعد القياس', 'نطاق النموذج المتفق عليه', 'تعديلات الموقع الموثقة ومعلومات الرفع المساحي'],
    },
    deliverables: {
      en: ['Quantity take-off', 'Updated and as-built models within the agreed scope'],
      ar: ['حصر الكميات', 'نماذج محدثة ونماذج الحالة المنفذة ضمن النطاق المتفق عليه'],
    },
    process: {
      en: [
        'Agree the measurement rules and model scope',
        'Prepare the model for take-off',
        'Check quantities against the coordinated model',
        'Issue schedules and as-built updates',
      ],
      ar: [
        'الاتفاق على قواعد القياس ونطاق النموذج',
        'تجهيز النموذج لحصر الكميات',
        'مطابقة الكميات مع النموذج المنسق',
        'إصدار الجداول وتحديثات الحالة المنفذة',
      ],
    },
    scopeNote: {
      en: 'As-built models reflect the site information supplied and verified for the scope. Updating a model does not mean that we carried out a survey.',
      ar: 'تعكس نماذج الحالة المنفذة معلومات الموقع المسلَّمة والموثقة للنطاق، ولا يعني تحديث النموذج أننا أجرينا رفعًا مساحيًا.',
    },
    relatedProjectId: 'P01',
  },
];

export function getService(id: string): Service | undefined {
  return services.find((s) => s.id === id);
}

/** Stable form value for “Not sure”. */
export const NOT_SURE = 'not-sure';
