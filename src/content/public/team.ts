import type { Localized } from '@/i18n/config';

/**
 * Founding team on the About page (owner request, 10 Nov 2026: the founder Mark Mofreh and three
 * co-founders). Sources: the existing founder facts (F1, C01/C03/C20) and the owner-supplied CVs and
 * portraits of 10 Nov 2026 (docs/content-decisions.md C26). Published: name, discipline, experience
 * as stated in each CV summary, specialisms and regions. Not published: contact details, dates of
 * birth, employers, and client or project names (consistent with C20 and OD-07).
 */
export interface TeamPhoto {
  /**
   * Cut-out portrait in /public/team: transparent background, upscaled 2x and tone-matched from
   * the owner's photo (no retouching of the face), metadata stripped. It stands on the brand panel.
   */
  src: string;
  width: number;
  height: number;
  /** CSS object-position used when the frame crops the cut-out. */
  focus: string;
}

/** Technical drawing shown in place of a portrait until one is supplied. Never mirrored. */
export type TeamMotif = 'hydraulics' | 'architecture';

export interface TeamMember {
  id: string;
  name: Localized<string>;
  /** "Founder" / "Co-founder" (gendered in Arabic, so it lives with the person). */
  label: Localized<string>;
  discipline: Localized<string>;
  bio: Localized<string[]>;
  focus: Localized<string[]>;
  photo?: TeamPhoto;
  motif?: TeamMotif;
}

export const founder: TeamMember = {
  id: 'mark-mofreh',
  name: { en: 'Mark Mofreh', ar: 'مارك مفرح' },
  label: { en: 'Founder', ar: 'المؤسس' },
  discipline: { en: 'Civil Engineer', ar: 'مهندس مدني' },
  bio: {
    en: [
      'Mark Mofreh is the founder of Zentrac and a civil engineer who began his professional career in roads and infrastructure in 2018.',
      'His experience includes shop drawings, quantity take-offs, bills of quantities and utility review, alongside BIM modelling and coordination for roads, utilities and landscape.',
      'Before establishing Zentrac, he operated BIM Experts as his individual practice and contributed to defined outsourced packages within larger projects in Saudi Arabia, Egypt and Rwanda.',
    ],
    ar: [
      'مارك مفرح هو مؤسس زينتراك، ومهندس مدني بدأت مسيرته المهنية في الطرق والبنية التحتية عام 2018.',
      'تشمل خبرته المخططات التنفيذية، وحصر الكميات، وجداول الكميات، ومراجعة شبكات المرافق، إلى جانب نمذجة معلومات البناء والتنسيق بين التخصصات لأعمال الطرق والمرافق وتنسيق المواقع.',
      'قبل تأسيس زينتراك، عمل من خلال مكتبه الفردي BIM Experts، وأسهم في حزم أعمال محددة من الباطن ضمن مشروعات أكبر في السعودية ومصر ورواندا.',
    ],
  },
  focus: {
    en: ['Roads and utilities', 'Shop drawings', 'Quantity take-off', 'BIM coordination'],
    ar: ['الطرق والمرافق', 'المخططات التنفيذية', 'حصر الكميات', 'التنسيق بين التخصصات'],
  },
  photo: { src: '/team/mark-mofreh.webp', width: 1176, height: 1429, focus: '50% 100%' },
};

export const coFounders: TeamMember[] = [
  {
    id: 'mario-mofreh',
    name: { en: 'Mario Mofreh', ar: 'ماريو مفرح' },
    label: { en: 'Co-founder', ar: 'شريك مؤسس' },
    discipline: { en: 'BIM Coordinator and Architect', ar: 'منسق نمذجة معلومات البناء ومهندس معماري' },
    bio: {
      en: [
        'Mario is an architect and BIM coordinator with more than four years of experience in multidisciplinary coordination, architectural modelling and technical documentation for infrastructure, pump station, landscape and interior projects in Egypt and the Gulf. His work runs from concept models through coordinated shop drawings and clash detection to as-built handover with asset data.',
      ],
      ar: [
        'ماريو مهندس معماري ومنسق لنمذجة معلومات البناء، لديه أكثر من أربع سنوات من الخبرة في التنسيق بين التخصصات والنمذجة المعمارية والتوثيق الفني لمشروعات البنية التحتية ومحطات الضخ وتنسيق المواقع والتصميم الداخلي في مصر ودول الخليج. يمتد عمله من نماذج التصميم المبدئي إلى المخططات التنفيذية المنسقة وكشف التعارضات، ثم تسليم نماذج الحالة المنفذة مع بيانات الأصول.',
      ],
    },
    focus: {
      en: ['Clash detection', 'Federated model review', 'Architectural modelling', 'As-built handover'],
      ar: ['كشف التعارضات', 'مراجعة النماذج الموحدة', 'النمذجة المعمارية', 'تسليم نماذج الحالة المنفذة'],
    },
    photo: { src: '/team/mario-mofreh.webp', width: 930, height: 1268, focus: '50% 0%' },
  },
  {
    id: 'wessam-anber',
    name: { en: 'Wessam Anber', ar: 'وسام عنبر' },
    label: { en: 'Co-founder', ar: 'شريك مؤسس' },
    discipline: { en: 'Hydraulic and Infrastructure Engineer', ar: 'مهندس هيدروليكا وبنية تحتية' },
    bio: {
      en: [
        'Wessam is a hydraulic engineer with more than 15 years of experience in the analysis, design, shop drawings and BIM modelling of wet-utility networks: water, irrigation, sewerage, stormwater and firefighting. He has prepared concept, detailed and tender design packages with calculation sheets, bills of quantities and technical reports, and has designed plumbing and firefighting systems for buildings.',
      ],
      ar: [
        'وسام مهندس هيدروليكا لديه أكثر من 15 عامًا من الخبرة في تحليل شبكات المرافق الرطبة وتصميمها وإعداد مخططاتها التنفيذية ونمذجتها: مياه الشرب والري والصرف الصحي وتصريف مياه الأمطار ومكافحة الحريق. أعدّ حزم التصميم المبدئي والتفصيلي ومستندات الطرح، بما فيها مذكرات الحسابات وجداول الكميات والتقارير الفنية، وصمّم أنظمة التغذية بالمياه والصرف ومكافحة الحريق للمباني.',
      ],
    },
    focus: {
      en: ['Water and irrigation networks', 'Sewerage and stormwater', 'Firefighting networks', 'Bills of quantities'],
      ar: ['شبكات المياه والري', 'الصرف الصحي وتصريف الأمطار', 'شبكات مكافحة الحريق', 'جداول الكميات'],
    },
    motif: 'hydraulics',
  },
  {
    id: 'amal-khalil',
    name: { en: 'Amal Khalil', ar: 'أمل خليل' },
    label: { en: 'Co-founder', ar: 'شريكة مؤسسة' },
    discipline: { en: 'Architect and Design Coordinator', ar: 'مهندسة معمارية ومنسقة تصميم' },
    bio: {
      en: [
        'Amal is an architect with more than 16 years of experience in architectural design, multidisciplinary coordination and detailed construction drawings for large projects in Egypt, the UAE and Saudi Arabia. She has led architectural teams and design sections, planning workloads so that technical packages are delivered on schedule, and has taken projects from design to tender documents using BIM.',
      ],
      ar: [
        'أمل مهندسة معمارية لديها أكثر من 16 عامًا من الخبرة في التصميم المعماري والتنسيق بين التخصصات وإعداد المخططات التنفيذية التفصيلية لمشروعات كبيرة في مصر والإمارات والسعودية. قادت فرقًا وأقسامًا معمارية، وخططت لتوزيع أحمال العمل بحيث تُسلَّم الحزم الفنية في مواعيدها، ونقلت مشروعات من مرحلة التصميم إلى مستندات الطرح باستخدام نمذجة معلومات البناء.',
      ],
    },
    focus: {
      en: ['Architectural design', 'Construction drawings', 'Team leadership', 'Multidisciplinary coordination'],
      ar: ['التصميم المعماري', 'المخططات التنفيذية', 'قيادة الفرق', 'التنسيق بين التخصصات'],
    },
    motif: 'architecture',
  },
];
