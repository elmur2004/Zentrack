import type { Localized } from '@/i18n/config';

/**
 * Building disciplines shown on the Buildings page (owner request, 7 Nov 2026: buildings with
 * electrical, MEP, structural reinforcement and landscape). Used as a service taxonomy for
 * modelling and coordination, not as a claim that every project includes all eight.
 */
export const buildingSystemIds = [
  'structure',
  'reinforcement',
  'hvac',
  'plumbing',
  'fire-protection',
  'power',
  'elv',
  'landscape',
] as const;
export type BuildingSystemId = (typeof buildingSystemIds)[number];

export interface BuildingSystem {
  id: BuildingSystemId;
  number: string;
  name: Localized<string>;
  description: Localized<string>;
}

export const buildingSystems: BuildingSystem[] = [
  {
    id: 'structure',
    number: '01',
    name: { en: 'Structural frame', ar: 'الهيكل الإنشائي' },
    description: {
      en: 'Foundations, retaining walls, columns, beams and slabs, modelled as the reference that every service has to fit around.',
      ar: 'الأساسات وحوائط السند والأعمدة والكمرات والبلاطات، منمذجة لتكون المرجع الذي تتوافق معه كل الخدمات.',
    },
  },
  {
    id: 'reinforcement',
    number: '02',
    name: { en: 'Reinforcement detailing', ar: 'تفاصيل حديد التسليح' },
    description: {
      en: 'Rebar modelled and detailed within the agreed scope, including congested zones where sleeves, embedded conduits and openings pass through beams and slabs.',
      ar: 'نمذجة حديد التسليح وتفصيله ضمن النطاق المتفق عليه، بما في ذلك المناطق المزدحمة التي تمر فيها الجلب والمواسير المدفونة والفتحات خلال الكمرات والبلاطات.',
    },
  },
  {
    id: 'hvac',
    number: '03',
    name: { en: 'HVAC', ar: 'التكييف والتهوية' },
    description: {
      en: 'Air-handling units, duct risers and ductwork coordinated in ceiling voids, shafts and plant areas.',
      ar: 'وحدات مناولة الهواء وصواعد مجاري الهواء وشبكاتها، منسقة داخل فراغات الأسقف والشفتات ومناطق المعدات.',
    },
  },
  {
    id: 'plumbing',
    number: '04',
    name: { en: 'Plumbing and drainage', ar: 'التغذية بالمياه والصرف' },
    description: {
      en: 'Water tanks, booster pumps and supply risers, drainage stacks and their falls to the external network.',
      ar: 'خزانات المياه ومضخات رفع الضغط وصواعد التغذية، ومواسير الصرف الرأسية وميولها حتى الشبكة الخارجية.',
    },
  },
  {
    id: 'fire-protection',
    number: '05',
    name: { en: 'Fire protection', ar: 'مكافحة الحريق' },
    description: {
      en: 'Fire pump rooms, risers, hose cabinets, sprinkler mains and heads, coordinated with ceilings and the other services.',
      ar: 'غرف مضخات الحريق والصواعد وصناديق الحريق ومواسير الرشاشات ورؤوسها، منسقة مع الأسقف وباقي الخدمات.',
    },
  },
  {
    id: 'power',
    number: '06',
    name: { en: 'Power and lighting', ar: 'القوى والإنارة' },
    description: {
      en: 'Main and sub-distribution boards, electrical risers, cable trays and lighting layouts, inside the building and around it.',
      ar: 'لوحات التوزيع الرئيسية والفرعية وصواعد الكهرباء ومسارات الكابلات وتوزيع الإنارة، داخل المبنى وحوله.',
    },
  },
  {
    id: 'elv',
    number: '07',
    name: { en: 'Low current systems', ar: 'أنظمة التيار الخفيف' },
    description: {
      en: 'Fire alarm, data, CCTV and access control: rooms, risers, routes and devices.',
      ar: 'إنذار الحريق والبيانات وكاميرات المراقبة والتحكم في الدخول: الغرف والصواعد والمسارات والأجهزة.',
    },
  },
  {
    id: 'landscape',
    number: '08',
    name: { en: 'Landscape and external works', ar: 'تنسيق المواقع والأعمال الخارجية' },
    description: {
      en: 'Hardscape, planting, irrigation and finished levels around the building, including entrances, drainage falls and planters on slabs.',
      ar: 'الأعمال الصلبة والزراعة والري والمناسيب النهائية حول المبنى، بما في ذلك المداخل وميول التصريف والأحواض المزروعة فوق البلاطات.',
    },
  },
];
