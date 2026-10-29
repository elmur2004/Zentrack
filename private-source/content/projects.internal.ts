/**
 * PRIVATE — internal project records. Never imported by public routes.
 * Sources: F1 (Zentrac_Media_Brief_AR.pdf) pp.4–14, F3 (Zentrac_Media_Register.xlsx) sheet Projects rows 8–20,
 * F2 (Zentrac Company Profile.pdf) pp.11–16 for marketing context only.
 *
 * Publication state: F1 p1 / F3 Projects D4 — "no written approval; internal preparation material only".
 * Every record is therefore `withheld` (selected eight) or `draft` (other register groups).
 * A blank confirmation field in F3 (columns F, H, N) is NOT a "yes".
 */
import type { InternalProject } from '@/lib/content/types';

const FOUNDER = 'founder-bim-experts' as const;
const WITHHELD = { state: 'withheld' as const, approvedFields: [] };
const DRAFT = { state: 'draft' as const, approvedFields: [] };

export const internalProjects: InternalProject[] = [
  {
    id: 'P01',
    slug: 'amaala-staff-village-zone-4',
    title: { en: 'AMAALA Staff Village — Zone 4', ar: 'قرية موظفي AMAALA — المنطقة الرابعة' },
    summary: {
      en: 'Infrastructure modelling and coordination for sewerage, irrigation, firefighting, potable-water and low-voltage networks, with surface grading and as-built model production within the assigned package.',
      ar: 'نمذجة وتنسيق شبكات الصرف والري والحريق والمياه والجهد المنخفض، وتسوية مناسيب السطح، وإعداد نماذج الحالة المنفذة ضمن نطاق محدد.',
    },
    scope: {
      en: [
        'Modelling and coordination of sewerage, irrigation, firefighting, water and LV networks for Zone 4',
        'Surface grading within the assigned package',
        'As-built models within the assigned package',
      ],
      ar: [
        'نمذجة وتنسيق شبكات الصرف والري والحريق والمياه والجهد المنخفض للمنطقة الرابعة',
        'تسوية مناسيب السطح ضمن الحزمة المسندة',
        'نماذج الحالة المنفذة ضمن الحزمة المسندة',
      ],
    },
    packageLabel: { en: 'Zone 4 package', ar: 'حزمة المنطقة الرابعة' },
    countryCode: 'SA',
    sector: 'residential',
    serviceIds: ['bim-modelling', 'coordination', 'quantities-as-built'],
    networkIds: ['sewerage', 'irrigation', 'firefighting', 'water', 'lv-mv', 'landscape-grading'],
    attribution: FOUNDER,
    projectParties: [
      { name: 'Red Sea Global', role: { en: 'Developer (named in sources)', ar: 'المطور (مذكور في المصادر)' } },
      { name: 'CGC Arabia / Giza Arabia', role: { en: 'Contractor (named in sources)', ar: 'المقاول (مذكور في المصادر)' } },
    ],
    assetIds: ['A07', 'A08', 'A09'],
    featured: true,
    publication: WITHHELD,
    sources: [
      { fileId: 'F1', locator: 'page 6' },
      { fileId: 'F3', locator: 'Projects!A8:O8' },
      { fileId: 'F2', locator: 'page 11 (marketing context)' },
    ],
    internalNotes: [
      'Not the entire community. The 1.44 million m² figure is the community area, not the founder scope (F1 p6).',
      'A08 shows a total of 211 in a "Resolved" column across 10 tests: a screenshot entry, not a verified count of independent clashes (F3 Metrics row 12).',
      'Direct appointing party, package dates, network lengths, delivery status and name/image approval are open (F1 p6).',
    ],
  },
  {
    id: 'P02',
    slug: 'sedra',
    title: { en: 'SEDRA — Selected Landscape and Utilities Packages', ar: 'SEDRA — حزم مختارة لتنسيق المواقع والمرافق' },
    summary: {
      en: 'Landscape modelling and shop drawings for Phases 1B and 2, and utility modelling and coordination for Phases 3 and 4, including water, sewerage, irrigation, stormwater, electrical, lighting and communications networks.',
      ar: 'نمذجة ومخططات تنفيذية لتنسيق المواقع في المرحلتين 1B و2، ونمذجة وتنسيق مرافق للمرحلتين 3 و4 تشمل شبكات المياه والصرف والري والأمطار والكهرباء والإنارة والاتصالات.',
    },
    scope: {
      en: ['Landscape modelling and shop drawings — Phases 1B and 2', 'Utility modelling and coordination — Phases 3 and 4'],
      ar: ['نمذجة تنسيق المواقع ومخططاتها التنفيذية — المرحلتان 1B و2', 'نمذجة المرافق وتنسيقها — المرحلتان 3 و4'],
    },
    packageLabel: { en: 'Phases 1B, 2, 3 and 4 packages', ar: 'حزم المراحل 1B و2 و3 و4' },
    countryCode: 'SA',
    sector: 'residential',
    serviceIds: ['bim-modelling', 'shop-drawings', 'coordination'],
    networkIds: ['landscape-grading', 'water', 'sewerage', 'irrigation', 'stormwater', 'lv-mv', 'street-lighting', 'cctv-telecom'],
    attribution: FOUNDER,
    projectParties: [{ name: 'ROSHN', role: { en: 'Developer (named in sources)', ar: 'المطور (مذكور في المصادر)' } }],
    assetIds: ['A01', 'A02', 'A03', 'A04', 'A05', 'A06'],
    featured: true,
    publication: WITHHELD,
    sources: [
      { fileId: 'F1', locator: 'page 7' },
      { fileId: 'F3', locator: 'Projects!A9:O9' },
    ],
    internalNotes: [
      'ROSHN is a named developer; no evidence it was the direct client of the practice (F3 E9).',
      'The 20M+ m² figure in the old deck is undocumented package context; excluded from achievement numbers (F1 p7).',
      'Associate each image with its actual phase. PPT021/PPT022 (A04/A05) match the SEDRA Phase 2 archive (S07).',
    ],
  },
  {
    id: 'P03',
    slug: 'resort-core-bulk-utilities',
    title: { en: 'Resort Core Bulk Utilities, Qiddiya — Selected Packages', ar: 'Resort Core Bulk Utilities في القدية — حزم مختارة' },
    summary: {
      en: 'Modelling, coordination and shop-drawing production for assigned road, landscape and infrastructure utility packages within Resort Core Bulk Utilities. Package boundaries and delivery dates are to be confirmed against the project records.',
      ar: 'نمذجة وتنسيق وإعداد مخططات تنفيذية لحزم الطرق وتنسيق المواقع وشبكات البنية التحتية المسندة ضمن Resort Core Bulk Utilities. تُطابق حدود الحزم ومواعيد التسليم مع سجلات المشروع.',
    },
    scope: {
      en: ['Road, landscape and utility modelling within the assigned packages', 'Coordination and shop-drawing production'],
      ar: ['نمذجة الطرق وتنسيق المواقع والمرافق ضمن الحزم المسندة', 'التنسيق وإعداد المخططات التنفيذية'],
    },
    packageLabel: { en: 'Assigned road and utility packages', ar: 'حزم طرق ومرافق مسندة' },
    countryCode: 'SA',
    sector: 'urban',
    serviceIds: ['bim-modelling', 'coordination', 'shop-drawings'],
    networkIds: ['roads', 'landscape-grading', 'water', 'sewerage', 'stormwater', 'street-lighting'],
    attribution: FOUNDER,
    projectParties: [
      { name: 'Qiddiya Investment Company', role: { en: 'Owner / developer (named in sources)', ar: 'المالك / المطور (مذكور في المصادر)' } },
    ],
    assetIds: ['A10', 'A11', 'A12', 'A13', 'A14'],
    featured: true,
    publication: WITHHELD,
    sources: [
      { fileId: 'F1', locator: 'page 8' },
      { fileId: 'F3', locator: 'Projects!A17:O17; Assets!H17:H21' },
    ],
    internalNotes: [
      'Imagery may belong to Park Ride / Welcome Center (R03). No automatic 4B/4C/4D attribution (F3 Assets H17). Do not merge R03 into P03.',
      'Old deck mentions Road 02/03 and packages 4B-N, 4B-S, 4C, 4D; to be matched against deliverables.',
      'Do not use 30M+ m² as work area; correct the ROSHN line copied into the old Qiddiya text; exclude the stadium image (F1 p8, p15).',
    ],
  },
  {
    id: 'P04',
    slug: 'king-fahd-sports-city-stormwater',
    title: { en: 'King Fahd Sports City — Stormwater Package', ar: 'مدينة الملك فهد الرياضية — حزمة شبكة الأمطار' },
    summary: {
      en: 'Stormwater utility modelling and coordination within the assigned infrastructure package at King Fahd Sports City.',
      ar: 'نمذجة وتنسيق شبكة تصريف مياه الأمطار ضمن حزمة البنية التحتية المسندة في مدينة الملك فهد الرياضية.',
    },
    scope: {
      en: ['Stormwater network modelling and coordination within the venue infrastructure package'],
      ar: ['نمذجة شبكة تصريف مياه الأمطار وتنسيقها ضمن حزمة مرافق المنشأة'],
    },
    packageLabel: { en: 'Stormwater network package', ar: 'حزمة شبكة الأمطار' },
    countryCode: 'SA',
    sector: 'sports',
    serviceIds: ['bim-modelling', 'coordination'],
    networkIds: ['stormwater'],
    attribution: FOUNDER,
    projectParties: [
      { name: 'Ministry of Sport / King Fahd Sports City', role: { en: 'Project party (named in sources)', ar: 'طرف في المشروع (مذكور في المصادر)' } },
      { name: 'Mace', role: { en: 'Project party (named in sources)', ar: 'طرف في المشروع (مذكور في المصادر)' } },
    ],
    assetIds: ['A15'],
    publication: WITHHELD,
    sources: [
      { fileId: 'F1', locator: 'page 9' },
      { fileId: 'F3', locator: 'Projects!A13:O13' },
    ],
    internalNotes: [
      'Not stadium-wide design or development responsibility. Stadium capacity and expansion dates are old context, not founder work size (F1 p9).',
      'Image–package association to confirm.',
    ],
  },
  {
    id: 'P05',
    slug: 'king-salman-park-arabian-gardens',
    title: { en: 'King Salman Park — Arabian Gardens Landscape BIM', ar: 'حديقة الملك سلمان — نمذجة تنسيق المواقع في Arabian Gardens' },
    summary: {
      en: 'Landscape BIM modelling and shop-drawing production for Arabian Gardens. The March 2026 progress report records submissions for setting-out and grading, water features and water-feature details; client acceptance is not established by the report.',
      ar: 'نمذجة معلومات البناء لتنسيق المواقع وإعداد المخططات التنفيذية لـ Arabian Gardens. يسجل تقرير التقدم الصادر في مارس 2026 تقديم حزم Setting-out and Grading وWater Features وتفاصيلها، ولا يثبت التقرير قبول العميل.',
    },
    scope: {
      en: ['Landscape BIM modelling', 'Shop drawings for setting-out and grading, water features and water-feature details (submitted, not approved)'],
      ar: ['نمذجة معلومات البناء لتنسيق المواقع', 'مخططات تنفيذية لأعمال التوقيع وتسوية المناسيب وعناصر المياه وتفاصيلها (مقدَّمة، غير معتمدة)'],
    },
    packageLabel: { en: 'Landscape packages', ar: 'حزم تنسيق المواقع' },
    countryCode: 'SA',
    sector: 'parks',
    serviceIds: ['bim-modelling', 'shop-drawings'],
    networkIds: ['landscape-grading'],
    attribution: FOUNDER,
    projectParties: [
      { name: 'King Salman Park Foundation', role: { en: 'Owner (named in sources)', ar: 'الجهة المالكة (مذكورة في المصادر)' } },
      { name: 'Freyssinet Saudi Arabia', role: { en: 'Contractor (per reference drawing)', ar: 'المقاول (بحسب لوحة مرجعية)' } },
    ],
    assetIds: ['A16', 'A17'],
    featured: false,
    publication: WITHHELD,
    sources: [
      { fileId: 'F1', locator: 'page 10' },
      { fileId: 'F3', locator: 'Projects!A12:O12; Metrics row 11' },
    ],
    internalNotes: [
      'Reference drawing dated 18 Sep 2025 and report dated 2 Mar 2026 are not the founder assignment dates.',
      'Submitted is not approved. Irrigation is outside the landscape scope per the report — do not add it (F1 p10).',
    ],
  },
  {
    id: 'P06',
    slug: 'dabaa-canals',
    title: { en: 'Dabaa — Canal Modelling and Shop Drawings', ar: 'الضبعة — نمذجة القنوات ومخططاتها التنفيذية' },
    summary: {
      en: 'Canal modelling and shop-drawing production for separately recorded packages in Dabaa, Egypt. The scope is limited to the assigned packages and is not responsibility for the entire development.',
      ar: 'نمذجة وإعداد مخططات تنفيذية لقنوات ضمن حزم مسجلة بصورة منفصلة في الضبعة بمصر. يقتصر النطاق على الحزم المسندة، ولا يُعد مسؤولية عن المشروع بأكمله.',
    },
    scope: {
      en: ['Canal modelling for separately recorded packages', 'Canal shop drawings'],
      ar: ['نمذجة القنوات لحزم مسجلة بصورة منفصلة', 'المخططات التنفيذية للقنوات'],
    },
    countryCode: 'EG',
    sector: 'canals',
    serviceIds: ['bim-modelling', 'shop-drawings'],
    networkIds: ['canals'],
    attribution: FOUNDER,
    projectParties: [
      { name: 'ASGC', role: { en: 'Contracting party linked to a package', ar: 'طرف مقاولات مرتبط بحزمة' } },
      { name: 'Orascom', role: { en: 'Contracting party linked to a package', ar: 'طرف مقاولات مرتبط بحزمة' } },
      { name: 'Concrete Plus', role: { en: 'Contracting party linked to a package', ar: 'طرف مقاولات مرتبط بحزمة' } },
    ],
    assetIds: [],
    publication: WITHHELD,
    sources: [
      { fileId: 'F1', locator: 'page 11' },
      { fileId: 'F3', locator: 'Projects!A18:O18; Metrics rows 8–10' },
    ],
    internalNotes: [
      'Candidate lengths ~25 km, ~6 km and ~1 km are separate package rows; never total them into a 32 km claim (F3 Metrics G4).',
      'The CV mentions 15 km canals and 30 km roads in an older context; separate each assignment.',
      'No image with a clear source and package link was selected.',
    ],
  },
  {
    id: 'P07',
    slug: 'kigali-centralized-sewerage',
    title: { en: 'Kigali Centralized Sewerage System', ar: 'نظام الصرف الصحي المركزي في كيجالي' },
    summary: {
      en: 'Sewerage-network design and modelling support for the assigned Kigali package, as recorded in the project register. The founder’s precise design responsibility and review authority require confirmation.',
      ar: 'دعم تصميم ونمذجة شبكة الصرف الصحي للحزمة المسندة في كيجالي، كما ورد في سجل المشروعات. تحتاج مسؤولية المؤسس التصميمية الدقيقة وصلاحية المراجعة إلى تأكيد.',
    },
    scope: {
      en: ['Sewerage-network design and modelling support for the assigned package'],
      ar: ['دعم تصميم ونمذجة شبكة الصرف الصحي للحزمة المسندة'],
    },
    countryCode: 'RW',
    sector: 'wastewater',
    serviceIds: ['bim-modelling'],
    networkIds: ['sewerage'],
    attribution: FOUNDER,
    projectParties: [
      { name: 'WASAC Development Ltd.', role: { en: 'Project party (named in sources)', ar: 'طرف في المشروع (مذكور في المصادر)' } },
      { name: 'China Railway Construction Engineering Group', role: { en: 'Project party (named in sources)', ar: 'طرف في المشروع (مذكور في المصادر)' } },
    ],
    assetIds: [],
    publication: WITHHELD,
    sources: [
      { fileId: 'F1', locator: 'page 12' },
      { fileId: 'F3', locator: 'Projects!A19:O19' },
    ],
    internalNotes: ['Do not use the "first network in Rwanda" description from the source sheet without verification (F1 p12).'],
  },
  {
    id: 'P08',
    slug: 'ghorayzat-wwtp-sohag',
    title: { en: 'Ghorayzat WWTP, Sohag', ar: 'محطة معالجة غريزات، سوهاج' },
    summary: {
      en: 'Design and modelling support for Ghorayzat WWTP in Sohag, covering the recorded architectural, structural, mechanical, electrical and treatment-pond workstreams. Discipline responsibilities and approval roles require confirmation.',
      ar: 'دعم التصميم والنمذجة لمحطة معالجة غريزات في سوهاج، ويشمل مسارات العمل المسجلة للعمارة والإنشاء والميكانيكا والكهرباء والأحواض. تحتاج مسؤوليات التخصصات وأدوار الاعتماد إلى تأكيد.',
    },
    scope: {
      en: ['Design and modelling support across the recorded workstreams'],
      ar: ['دعم التصميم والنمذجة عبر مسارات العمل المسجلة'],
    },
    countryCode: 'EG',
    sector: 'wastewater',
    serviceIds: ['bim-modelling'],
    networkIds: [],
    attribution: FOUNDER,
    projectParties: [
      { name: 'Elreda for General Constructions', role: { en: 'Contracting party (named in sources)', ar: 'طرف مقاولات (مذكور في المصادر)' } },
    ],
    assetIds: [],
    publication: WITHHELD,
    sources: [
      { fileId: 'F1', locator: 'page 13' },
      { fileId: 'F3', locator: 'Projects!A20:O20' },
    ],
    internalNotes: ['Do not publish plant capacity, area or discipline totals as current company capability (F1 p13).'],
  },

  // ---- Other register groups: preserved, not selected for cards, no country assumed (spec §10.1) ----
  {
    id: 'R03',
    slug: 'park-ride-and-welcome-center',
    title: { en: 'Park Ride and Welcome Center', ar: 'Park Ride and Welcome Center' },
    summary: { en: 'Roads modelling and shop drawings (register entry).', ar: 'نمذجة الطرق ومخططاتها التنفيذية (قيد في السجل).' },
    scope: { en: ['Roads modelling and shop drawings'], ar: ['نمذجة الطرق ومخططاتها التنفيذية'] },
    serviceIds: ['bim-modelling', 'shop-drawings'],
    networkIds: ['roads'],
    attribution: FOUNDER,
    projectParties: [],
    assetIds: [],
    publication: DRAFT,
    sources: [{ fileId: 'F3', locator: 'Projects!A10:O10' }],
    internalNotes: ['Country not stated in the register. Possible link to P03 imagery; do not merge automatically.'],
  },
  {
    id: 'R04',
    slug: 'mansoura-1',
    title: { en: 'Mansoura 1', ar: 'المنصورة 1' },
    summary: {
      en: 'Shop drawings for force main, sewer and sub-surface drainage networks; as-built for water, firefighting, sewer and irrigation (register entry).',
      ar: 'مخططات تنفيذية لخط الطرد وشبكات الصرف والصرف تحت السطحي؛ وحالة منفذة للمياه والحريق والصرف والري (قيد في السجل).',
    },
    scope: {
      en: ['Shop drawings — force main, sewer and sub-surface drainage', 'As-built — water, firefighting, sewer and irrigation'],
      ar: ['مخططات تنفيذية — خط الطرد والصرف والصرف تحت السطحي', 'حالة منفذة — المياه والحريق والصرف والري'],
    },
    countryCode: 'EG',
    serviceIds: ['shop-drawings', 'quantities-as-built'],
    networkIds: ['sewerage', 'water', 'firefighting', 'irrigation'],
    attribution: FOUNDER,
    projectParties: [{ name: 'Hassan Allam', role: { en: 'Project party (named in register)', ar: 'طرف في المشروع (مذكور في السجل)' } }],
    assetIds: [],
    publication: DRAFT,
    sources: [{ fileId: 'F3', locator: 'Projects!A11:O11' }],
    internalNotes: ['Register location cell: "NEW CAPITAL ADMINISTRATION - EGYPT".'],
  },
  {
    id: 'R07',
    slug: 'ibrahim-al-khaleel-road',
    title: { en: 'Ibrahim Al Khaleel Road', ar: 'طريق إبراهيم الخليل' },
    summary: {
      en: 'Design and modelling for wet utilities (water, sewer, irrigation, storm) and dry utilities (LV, MV, street lighting) (register entry).',
      ar: 'تصميم ونمذجة للمرافق الرطبة (المياه والصرف والري والأمطار) والمرافق الجافة (الجهد المنخفض والمتوسط وإنارة الطرق) (قيد في السجل).',
    },
    scope: { en: ['Wet and dry utilities design and modelling'], ar: ['تصميم ونمذجة المرافق الرطبة والجافة'] },
    serviceIds: ['bim-modelling'],
    networkIds: ['water', 'sewerage', 'irrigation', 'stormwater', 'lv-mv', 'street-lighting'],
    attribution: FOUNDER,
    projectParties: [],
    assetIds: [],
    publication: DRAFT,
    sources: [{ fileId: 'F3', locator: 'Projects!A14:O14' }],
    internalNotes: ['Country not stated in the register.'],
  },
  {
    id: 'R08',
    slug: 'breiman',
    title: { en: 'Breiman', ar: 'بريمان' },
    summary: {
      en: 'Infrastructure utilities modelling and coordination for water, firefighting, sewer, irrigation, storm, LV, MV, street lighting, CCTV and telecommunication networks (register entry).',
      ar: 'نمذجة وتنسيق مرافق البنية التحتية لشبكات المياه والحريق والصرف والري والأمطار والجهد المنخفض والمتوسط وإنارة الطرق والمراقبة والاتصالات (قيد في السجل).',
    },
    scope: { en: ['Utilities modelling and coordination'], ar: ['نمذجة المرافق وتنسيقها'] },
    serviceIds: ['bim-modelling', 'coordination'],
    networkIds: ['water', 'firefighting', 'sewerage', 'irrigation', 'stormwater', 'lv-mv', 'street-lighting', 'cctv-telecom'],
    attribution: FOUNDER,
    projectParties: [],
    assetIds: [],
    publication: DRAFT,
    sources: [{ fileId: 'F3', locator: 'Projects!A15:O15' }],
    internalNotes: ['Country not stated in the register.'],
  },
  {
    id: 'R09',
    slug: 'al-bairaq',
    title: { en: 'Al Bairaq', ar: 'البيرق' },
    summary: {
      en: 'Design and modelling for irrigation and landscape lighting networks (register entry).',
      ar: 'تصميم ونمذجة لشبكات الري وإنارة تنسيق المواقع (قيد في السجل).',
    },
    scope: { en: ['Irrigation and landscape lighting design and modelling'], ar: ['تصميم ونمذجة الري وإنارة تنسيق المواقع'] },
    serviceIds: ['bim-modelling'],
    networkIds: ['irrigation', 'street-lighting'],
    attribution: FOUNDER,
    projectParties: [
      { name: 'Qassim Region Municipality / Fahd Eltawigry for Constructions', role: { en: 'Project parties (named in register)', ar: 'أطراف المشروع (مذكورة في السجل)' } },
    ],
    assetIds: [],
    publication: DRAFT,
    sources: [{ fileId: 'F3', locator: 'Projects!A16:O16' }],
    internalNotes: ['Register country cell is "not stated"; F2 p16 says Qassim, Saudi Arabia — keep unconfirmed.'],
  },
];
