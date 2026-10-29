import type { Localized } from '@/i18n/config';

/** Why Zentrac — four principles (F4 Home “Why Zentrac”, F2 p6), without certification claims. */
export const principles: Array<{ id: string; title: Localized<string>; text: Localized<string> }> = [
  {
    id: 'review',
    title: { en: 'Review before modelling', ar: 'المراجعة قبل النمذجة' },
    text: {
      en: 'Modelling scopes start with a review of the supplied design. Gaps and conflicts go back to you as RFIs before modelling begins.',
      ar: 'تبدأ نطاقات النمذجة بمراجعة التصميم المسلَّم إلينا، وتعود الثغرات والتعارضات إليك في صورة طلبات استيضاح فني قبل بدء النمذجة.',
    },
  },
  {
    id: 'coordinate',
    title: { en: 'Coordinate before issuing', ar: 'التنسيق قبل الإصدار' },
    text: {
      en: 'Models are checked for clashes in a federated model, and issues are logged and followed up before drawings are issued.',
      ar: 'تُفحص النماذج لكشف التعارضات في نموذج موحد، وتُسجل المشكلات وتُتابَع قبل إصدار المخططات.',
    },
  },
  {
    id: 'infrastructure',
    title: { en: 'Infrastructure focus', ar: 'التركيز على البنية التحتية' },
    text: {
      en: 'Utilities, roads, landscape and grading are our home ground: eleven infrastructure categories, one coordinated approach.',
      ar: 'المرافق والطرق وتنسيق المواقع وتسوية المناسيب هي مجال خبرتنا الأساسي: أحد عشر مجالًا للبنية التحتية، ونهج واحد لتنسيقها.',
    },
  },
  {
    id: 'standards',
    title: { en: 'Your BEP and templates', ar: 'خطة التنفيذ (BEP) والقوالب الخاصة بك' },
    text: {
      en: 'We work to your BIM Execution Plan (BEP), standards, title blocks and naming conventions.',
      ar: 'نعمل وفق خطة تنفيذ نمذجة معلومات البناء (BEP) والمعايير وإطارات العنوان وقواعد التسمية الخاصة بك.',
    },
  },
];

/** Values (F4 About), phrased without legal promises (no blanket NDA claim). */
export const values: Array<{ id: string; title: Localized<string>; text: Localized<string> }> = [
  {
    id: 'quality',
    title: { en: 'Quality', ar: 'الجودة' },
    text: { en: 'Drawings are checked before they are issued.', ar: 'تُراجع المخططات قبل إصدارها.' },
  },
  {
    id: 'clarity',
    title: { en: 'Clarity', ar: 'الوضوح' },
    text: {
      en: 'Scope, deliverables and schedule are agreed in writing.',
      ar: 'يُتفق كتابيًا على النطاق والمخرجات والجدول الزمني.',
    },
  },
  {
    id: 'confidentiality',
    title: { en: 'Confidentiality', ar: 'السرية' },
    text: {
      en: 'Project information is shared only as agreed with the client.',
      ar: 'لا تُشارك معلومات المشروع إلا وفق ما يُتفق عليه مع العميل.',
    },
  },
  {
    id: 'honesty',
    title: { en: 'Honesty', ar: 'الأمانة' },
    text: {
      en: 'We state our exact role on every project we present.',
      ar: 'نوضح دورنا الدقيق في كل مشروع نعرضه.',
    },
  },
];

export const projectTypes: Localized<string[]> = {
  en: ['Infrastructure', 'Landscape', 'Buildings'],
  ar: ['البنية التحتية', 'تنسيق المواقع', 'المباني'],
};

export type AudienceId = 'developers' | 'contractors' | 'consultants';

export const audiences: Array<{
  id: AudienceId;
  title: Localized<string>;
  short: Localized<string>;
  intro: Localized<string>;
  needs: Localized<string[]>;
  deliverables: Localized<string[]>;
  service: string;
}> = [
  {
    id: 'developers',
    service: 'design-review',
    title: { en: 'Developers and owners', ar: 'المطورون والملاك' },
    short: {
      en: 'Design review and coordinated models before construction.',
      ar: 'مراجعة التصميم ونماذج منسقة قبل بدء التنفيذ.',
    },
    intro: {
      en: 'Understand and resolve design coordination issues before construction begins.',
      ar: 'تعرّف على مشكلات التنسيق في التصميم وعالجها قبل بدء التنفيذ.',
    },
    needs: {
      en: [
        'Confidence that the design package is complete and coordinated',
        'Visibility of open issues and who is responsible for them',
        'Models that can support handover',
      ],
      ar: [
        'الاطمئنان إلى اكتمال الحزمة التصميمية وتنسيقها',
        'رؤية واضحة للمشكلات المفتوحة والمسؤول عن كل منها',
        'نماذج يمكن أن تدعم مرحلة التسليم',
      ],
    },
    deliverables: {
      en: ['Design review report', 'Coordinated model', 'RFI register', 'As-built models, where agreed'],
      ar: ['تقرير مراجعة التصميم', 'نموذج منسق', 'سجل طلبات الاستيضاح الفني', 'نماذج الحالة المنفذة عند الاتفاق عليها'],
    },
  },
  {
    id: 'contractors',
    service: 'shop-drawings',
    title: { en: 'Contractors', ar: 'المقاولون' },
    short: {
      en: 'Coordinated shop drawings prepared from the model, to help reduce resubmissions.',
      ar: 'مخططات تنفيذية منسقة مستخرجة من النموذج، تساعد على تقليل إعادة التقديم.',
    },
    intro: {
      en: 'Coordinated shop drawings and quantities produced from the model.',
      ar: 'مخططات تنفيذية منسقة وكميات مستخرجة من النموذج.',
    },
    needs: {
      en: [
        'Shop drawings prepared for consultant review',
        'Early visibility of clashes before excavation and installation',
        'Model-based quantities for planning',
      ],
      ar: [
        'مخططات تنفيذية مُعدّة لمراجعة الاستشاري',
        'رصد مبكر للتعارضات قبل الحفر والتركيب',
        'كميات مستخرجة من النموذج لأغراض التخطيط',
      ],
    },
    deliverables: {
      en: ['Shop drawings', 'Combined services drawings', 'Clash report', 'Quantity take-off'],
      ar: ['المخططات التنفيذية', 'مخططات تنسيق الخدمات', 'تقرير كشف التعارضات', 'حصر الكميات'],
    },
  },
  {
    id: 'consultants',
    service: 'coordination',
    title: { en: 'Engineering consultants', ar: 'المكاتب الاستشارية الهندسية' },
    short: {
      en: 'Additional modelling and coordination support for your team.',
      ar: 'دعم إضافي في النمذجة والتنسيق لفريقك.',
    },
    intro: {
      en: 'Additional modelling and coordination capacity for your team, working to your standards.',
      ar: 'موارد إضافية في النمذجة والتنسيق تدعم فريقك وتعمل وفق معاييرك.',
    },
    needs: {
      en: ['Capacity for peak workloads', 'Work to your BEP, templates and naming conventions', 'Clear scope boundaries for each package'],
      ar: ['موارد إضافية في فترات ذروة العمل', 'العمل وفق خطة تنفيذ نمذجة معلومات البناء (BEP) والقوالب وقواعد التسمية الخاصة بك', 'حدود نطاق واضحة لكل حزمة'],
    },
    deliverables: {
      en: ['Discipline models', 'Clash report', 'RFI register'],
      ar: ['نماذج التخصصات', 'تقرير كشف التعارضات', 'سجل طلبات الاستيضاح الفني'],
    },
  },
];

export const partnerTypes: Array<{ id: string; title: Localized<string>; text: Localized<string> }> = [
  {
    id: 'consultant',
    title: { en: 'Engineering consultants', ar: 'المكاتب الاستشارية الهندسية' },
    text: {
      en: 'Modelling and coordination capacity alongside your design team.',
      ar: 'موارد في النمذجة والتنسيق تعمل إلى جانب فريق التصميم لديك.',
    },
  },
  {
    id: 'contractor',
    title: { en: 'Contractors', ar: 'المقاولون' },
    text: {
      en: 'Shop drawings, coordination and quantities for your packages.',
      ar: 'مخططات تنفيذية وتنسيق وكميات لحزم أعمالك.',
    },
  },
  {
    id: 'survey',
    title: { en: 'Survey firms', ar: 'شركات المساحة' },
    text: {
      en: 'Connecting survey data with models and as-built updates.',
      ar: 'ربط بيانات الرفع المساحي بالنماذج وتحديثات الحالة المنفذة.',
    },
  },
  {
    id: 'engineering',
    title: { en: 'Engineering companies', ar: 'الشركات الهندسية' },
    text: {
      en: 'Collaboration on defined infrastructure packages.',
      ar: 'التعاون في حزم محددة لأعمال البنية التحتية.',
    },
  },
];

/**
 * Feature switch for the specialist-services module (Survey, Scan to BIM, AR).
 * F1 p3 / F3 D07: the operational arrangement is unconfirmed, so it stays off publicly.
 */
export const specialistServicesConfirmed = false;
