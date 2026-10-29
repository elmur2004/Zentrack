import type { Localized } from '@/i18n/config';

/**
 * Eleven infrastructure categories (F4 §5, F2 p8). Used as a service taxonomy, not as a claim
 * that every project includes eleven utility networks (spec §2 conflict register).
 */
export const networkIds = [
  'water',
  'sewerage',
  'irrigation',
  'stormwater',
  'firefighting',
  'lv-mv',
  'street-lighting',
  'cctv-telecom',
  'roads',
  'landscape-grading',
  'canals',
] as const;
export type NetworkId = (typeof networkIds)[number];

export interface Network {
  id: NetworkId;
  number: string;
  name: Localized<string>;
  description: Localized<string>;
  /** Line style used in the schematic so categories are distinguishable without colour */
  pattern: 'solid' | 'dash' | 'dot' | 'dashdot' | 'double' | 'fill';
}

export const networks: Network[] = [
  {
    id: 'water',
    number: '01',
    pattern: 'solid',
    name: { en: 'Water', ar: 'المياه' },
    description: {
      en: 'Potable water distribution: mains, valves, chambers and service connections, modelled and coordinated with the other networks.',
      ar: 'شبكات توزيع مياه الشرب: الخطوط الرئيسية والمحابس وغرفها ووصلات الخدمة، منمذجة ومنسقة مع بقية الشبكات.',
    },
  },
  {
    id: 'sewerage',
    number: '02',
    pattern: 'dash',
    name: { en: 'Sewerage', ar: 'الصرف الصحي' },
    description: {
      en: 'Gravity sewers, force mains and manholes, with invert levels coordinated against crossings and road levels.',
      ar: 'خطوط الصرف بالانحدار وخطوط الطرد وغرف التفتيش، مع تنسيق مناسيب القاع عند التقاطعات ومع مناسيب الطرق.',
    },
  },
  {
    id: 'irrigation',
    number: '03',
    pattern: 'dot',
    name: { en: 'Irrigation', ar: 'الري' },
    description: {
      en: 'Irrigation mains and laterals serving landscape areas, coordinated with planting and hardscape.',
      ar: 'خطوط الري الرئيسية والفرعية التي تخدم مناطق تنسيق المواقع، منسقة مع الزراعة والأعمال الصلبة.',
    },
  },
  {
    id: 'stormwater',
    number: '04',
    pattern: 'dashdot',
    name: { en: 'Stormwater', ar: 'تصريف مياه الأمطار' },
    description: {
      en: 'Stormwater pipes, inlets and manholes, coordinated with road profiles and grading.',
      ar: 'خطوط تصريف مياه الأمطار ومداخلها وغرف التفتيش، منسقة مع القطاعات الطولية للطرق وتسوية المناسيب.',
    },
  },
  {
    id: 'firefighting',
    number: '05',
    pattern: 'solid',
    name: { en: 'Firefighting', ar: 'مكافحة الحريق' },
    description: {
      en: 'Firefighting mains and hydrants, coordinated within shared utility corridors.',
      ar: 'خطوط مكافحة الحريق وحنفيات الحريق، منسقة داخل ممرات المرافق المشتركة.',
    },
  },
  {
    id: 'lv-mv',
    number: '06',
    pattern: 'double',
    name: { en: 'LV / MV Power', ar: 'كهرباء الجهد المنخفض والمتوسط' },
    description: {
      en: 'Low- and medium-voltage cable routes, ducts and substations, coordinated with other services and their clearances.',
      ar: 'مسارات كابلات الجهد المنخفض والمتوسط ومجاريها والمحطات الفرعية، منسقة مع الخدمات الأخرى والمسافات الفاصلة بينها.',
    },
  },
  {
    id: 'street-lighting',
    number: '07',
    pattern: 'dot',
    name: { en: 'Street Lighting', ar: 'إنارة الطرق' },
    description: {
      en: 'Lighting poles, cable routes and feeder pillars along roads and landscaped areas.',
      ar: 'أعمدة الإنارة ومسارات كابلاتها ولوحات التغذية على امتداد الطرق ومناطق تنسيق المواقع.',
    },
  },
  {
    id: 'cctv-telecom',
    number: '08',
    pattern: 'dash',
    name: { en: 'CCTV and Telecom', ar: 'كاميرات المراقبة والاتصالات' },
    description: {
      en: 'Ducts, chambers and camera positions for CCTV and telecommunication networks.',
      ar: 'مجاري الكابلات والغرف ومواقع الكاميرات لشبكات المراقبة والاتصالات.',
    },
  },
  {
    id: 'roads',
    number: '09',
    pattern: 'fill',
    name: { en: 'Roads', ar: 'الطرق' },
    description: {
      en: 'Road corridors, kerbs and pavements that set the reference levels for the networks below.',
      ar: 'ممرات الطرق والأرصفة وحوافها، التي تحدد المناسيب المرجعية للشبكات أسفلها.',
    },
  },
  {
    id: 'landscape-grading',
    number: '10',
    pattern: 'fill',
    name: { en: 'Landscape and Grading', ar: 'تنسيق المواقع وتسوية المناسيب' },
    description: {
      en: 'Hardscape, softscape and finished levels, with grading that drives surface drainage.',
      ar: 'الأعمال الصلبة والزراعية والمناسيب النهائية، مع تسوية مناسيب تتحكم في التصريف السطحي.',
    },
  },
  {
    id: 'canals',
    number: '11',
    pattern: 'double',
    name: { en: 'Canals', ar: 'القنوات' },
    description: {
      en: 'Canal alignments and sections, modelled with their crossings and interfaces.',
      ar: 'محاور القنوات وقطاعاتها، منمذجة مع تقاطعاتها ونقاط تداخلها.',
    },
  },
];
