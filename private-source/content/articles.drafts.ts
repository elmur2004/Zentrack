/**
 * PRIVATE — draft article records for the six source-proposed topics (F4 §10).
 * Topics only exist in the sources; the text below is new draft copy written to exercise the
 * template. Nothing here is published: no confirmed byline, no publication date, no technical review.
 * Backticks mark identifiers that must stay LTR inside Arabic text.
 */
import type { InternalArticle } from '@/lib/content/types';

const DRAFT = { state: 'draft' as const };
const reviewNote = 'Draft text written during the website build. Requires technical review, references and an editorial decision on byline/date before publication.';

export const draftArticles: InternalArticle[] = [
  {
    id: 'ART-06',
    slug: 'what-is-an-rfi',
    topic: 'rfi',
    title: { en: 'What is an RFI?', ar: 'ما طلب الاستيضاح الفني (RFI)؟' },
    excerpt: {
      en: 'A Request for Information (RFI) is a formal question raised when drawings or specifications are missing, unclear or in conflict. A well-written RFI keeps modelling and construction moving.',
      ar: 'طلب الاستيضاح الفني (RFI) سؤال رسمي يُرفع عندما تكون المخططات أو المواصفات ناقصة أو غير واضحة أو متعارضة. والطلب الجيد الصياغة يحافظ على سير النمذجة والتنفيذ.',
    },
    body: {
      en: [
        { type: 'p', text: 'A Request for Information (RFI) is a written question sent to the party responsible for the design when the information needed to model, coordinate or build an element is missing, unclear or contradictory.' },
        { type: 'h2', text: 'When an RFI is needed' },
        {
          type: 'ul',
          items: [
            'Two drawings show different levels or positions for the same element.',
            'A drawing conflicts with the specification.',
            'Information needed for modelling, such as an invert level or a cable route, is not shown.',
            'Two networks cannot both be installed as drawn.',
          ],
        },
        { type: 'h2', text: 'What a useful RFI contains' },
        {
          type: 'table',
          caption: 'Typical RFI content',
          rows: [
            ['Item', 'Purpose'],
            ['Reference number, for example `RFI-024`', 'Tracks the question until it is closed'],
            ['Drawing and model references', 'Shows exactly where the issue is'],
            ['One clear question', 'Asks for one decision or one piece of information'],
            ['Proposed solution (optional)', 'Helps the designer respond quickly'],
            ['Required response date', 'Links the answer to the programme'],
          ],
        },
        { type: 'h2', text: 'RFIs and coordination' },
        { type: 'p', text: 'During design review and coordination, RFIs are logged in an RFI register so that every open question has an owner and a status. A clash that needs a design decision usually becomes an RFI; a clash that can be resolved within the agreed modelling rules usually does not.' },
        { type: 'note', text: reviewNote },
      ],
      ar: [
        { type: 'p', text: 'طلب الاستيضاح الفني (RFI) سؤال مكتوب يُرسل إلى الجهة المسؤولة عن التصميم عندما تكون المعلومات اللازمة لنمذجة عنصر أو تنسيقه أو تنفيذه ناقصة أو غير واضحة أو متناقضة.' },
        { type: 'h2', text: 'متى نحتاج إلى طلب استيضاح فني؟' },
        {
          type: 'ul',
          items: [
            'عندما يُظهر مخططان منسوبين أو موقعين مختلفين للعنصر نفسه.',
            'عندما يتعارض أحد المخططات مع المواصفات.',
            'عندما لا تظهر معلومات لازمة للنمذجة، مثل منسوب القاع أو مسار كابل.',
            'عندما يتعذر تركيب شبكتين معًا كما هما مرسومتان.',
          ],
        },
        { type: 'h2', text: 'محتوى طلب الاستيضاح المفيد' },
        {
          type: 'table',
          caption: 'المحتوى المعتاد لطلب الاستيضاح الفني',
          rows: [
            ['البند', 'الغرض'],
            ['رقم مرجعي، مثل `RFI-024`', 'تتبع السؤال حتى إغلاقه'],
            ['مراجع المخططات والنموذج', 'تحديد موضع المشكلة بدقة'],
            ['سؤال واحد واضح', 'طلب قرار واحد أو معلومة واحدة'],
            ['حل مقترح (اختياري)', 'مساعدة المصمم على الرد سريعًا'],
            ['تاريخ الرد المطلوب', 'ربط الإجابة بالبرنامج الزمني'],
          ],
        },
        { type: 'h2', text: 'طلبات الاستيضاح والتنسيق' },
        { type: 'p', text: 'أثناء مراجعة التصميم والتنسيق، تُسجل طلبات الاستيضاح في سجل خاص حتى يكون لكل سؤال مفتوح مسؤول وحالة. والتعارض الذي يحتاج إلى قرار تصميمي يتحول عادة إلى طلب استيضاح، أما التعارض الذي يمكن حله ضمن قواعد النمذجة المتفق عليها فلا يحتاج عادة إلى ذلك.' },
        { type: 'note', text: 'مسودة كُتبت أثناء بناء الموقع. تحتاج إلى مراجعة فنية ومراجع وقرار تحريري بشأن اسم الكاتب والتاريخ قبل النشر.' },
      ],
    },
    references: [],
    relatedServiceIds: ['design-review', 'coordination'],
    publication: DRAFT,
    internalNotes: [reviewNote],
  },
  outline('ART-01', 'why-utility-networks-clash', 'clashes',
    { en: 'Why utility networks clash on site', ar: 'لماذا تتعارض شبكات المرافق في الموقع؟' },
    { en: 'Networks designed by different disciplines meet in the same corridor. Here is where conflicts usually come from and how coordination finds them earlier.', ar: 'تلتقي شبكات صممتها تخصصات مختلفة في الممر نفسه. إليك مصادر التعارضات المعتادة وكيف يكشفها التنسيق مبكرًا.' },
    { en: ['Shared corridors, gravity networks with fixed falls and late design changes are common sources of conflict between utilities.', 'This outline will cover crossings, clearances agreed per project, and how a federated model and an issue register help resolve conflicts before excavation.'], ar: ['الممرات المشتركة، وشبكات الانحدار ذات الميول الثابتة، وتعديلات التصميم المتأخرة من المصادر المعتادة للتعارض بين المرافق.', 'ستتناول هذه المسودة التقاطعات، والمسافات الفاصلة المتفق عليها لكل مشروع، وكيف يساعد النموذج الموحد وسجل المشكلات على معالجة التعارضات قبل الحفر.'] },
    ['coordination']),
  outline('ART-02', 'what-is-a-design-review', 'design-review',
    { en: 'What is a design review?', ar: 'ما مراجعة التصميم؟' },
    { en: 'A design review checks whether a drawing package contains the information needed to model and build it.', ar: 'تتحقق مراجعة التصميم من احتواء حزمة المخططات على المعلومات اللازمة لنمذجتها وتنفيذها.' },
    { en: ['Before modelling starts, the supplied design is read against the specification and reference information to identify missing or conflicting information.', 'This outline will explain the review output — a review report and RFIs — and what a design review does not replace.'], ar: ['قبل بدء النمذجة، يُقرأ التصميم المسلَّم في ضوء المواصفات والمعلومات المرجعية لتحديد المعلومات الناقصة أو المتعارضة.', 'ستشرح هذه المسودة مخرجات المراجعة — تقرير المراجعة وطلبات الاستيضاح الفني — وما لا تحل محله مراجعة التصميم.'] },
    ['design-review']),
  outline('ART-03', 'what-does-lod-400-mean', 'lod',
    { en: 'What does LOD 400 mean?', ar: 'ماذا يعني مستوى التطوير LOD 400؟' },
    { en: 'Level of development (LOD) describes how far a model element has been developed and how it may be relied on.', ar: 'يصف مستوى التطوير (LOD) مدى تطور عنصر النموذج ومدى إمكانية الاعتماد عليه.' },
    { en: ['`LOD 400` is commonly used for elements modelled with enough detail for fabrication or installation, as defined in the project’s agreed specification.', 'This outline must be checked against the current published LOD specification during technical review, and will stress that LOD is agreed per element and intended use.'], ar: ['يُستخدم `LOD 400` عادة للعناصر المنمذجة بتفاصيل كافية للتصنيع أو التركيب، وفق ما تحدده المواصفات المتفق عليها للمشروع.', 'يجب مطابقة هذه المسودة مع أحدث إصدار منشور لمواصفات مستوى التطوير أثناء المراجعة الفنية، مع التأكيد على أن المستوى يُتفق عليه لكل عنصر ووفق استخدامه المقصود.'] },
    ['bim-modelling']),
  outline('ART-04', 'what-is-a-clash-report', 'clash-report',
    { en: 'What is a clash report?', ar: 'ما تقرير كشف التعارضات؟' },
    { en: 'A clash report lists conflicts found when discipline models are checked together, grouped so the right party can act on them.', ar: 'يسرد تقرير كشف التعارضات التعارضات التي تظهر عند فحص نماذج التخصصات معًا، مصنفة حتى يتصرف الطرف المناسب.' },
    { en: ['Raw clash counts are rarely meaningful: one design issue can produce many clashes. Grouping, priorities and responsibilities make a report useful.', 'This outline will show what a useful report contains and why its numbers should not be read as project performance metrics.'], ar: ['نادرًا ما يكون العدد الخام للتعارضات ذا معنى؛ فقد تُنتج مشكلة تصميمية واحدة تعارضات كثيرة. ويجعل التصنيف والأولويات والمسؤوليات التقرير مفيدًا.', 'ستوضح هذه المسودة محتوى التقرير المفيد، ولماذا لا تُقرأ أرقامه بوصفها مؤشرات أداء للمشروع.'] },
    ['coordination']),
  outline('ART-05', 'why-shop-drawings-get-rejected', 'shop-drawings',
    { en: 'Why shop drawings get rejected', ar: 'لماذا تُرفض المخططات التنفيذية؟' },
    { en: 'Common reasons shop drawings return with comments, and how coordination before issue reduces them.', ar: 'أسباب شائعة لعودة المخططات التنفيذية بملاحظات، وكيف يقللها التنسيق قبل الإصدار.' },
    { en: ['Shop drawings often return because of unresolved interfaces, missing information or non-compliance with the specification.', 'This outline will cover checks before issue and the difference between a drawing prepared for review and an approved drawing.'], ar: ['تعود المخططات التنفيذية غالبًا بسبب نقاط تداخل غير محلولة أو معلومات ناقصة أو عدم مطابقة المواصفات.', 'ستتناول هذه المسودة الفحوص قبل الإصدار، والفرق بين مخطط جاهز للمراجعة ومخطط معتمد.'] },
    ['shop-drawings']),
];

function outline(
  id: string,
  slug: string,
  topic: string,
  title: InternalArticle['title'],
  excerpt: InternalArticle['excerpt'],
  paras: { en: string[]; ar: string[] },
  related: string[],
): InternalArticle {
  return {
    id,
    slug,
    topic,
    title,
    excerpt,
    body: {
      en: [...paras.en.map((text) => ({ type: 'p' as const, text })), { type: 'note' as const, text: 'Draft outline — to be written in full and technically reviewed before publication.' }],
      ar: [...paras.ar.map((text) => ({ type: 'p' as const, text })), { type: 'note' as const, text: 'مسودة مخطط — تُكتب كاملة وتخضع لمراجعة فنية قبل النشر.' }],
    },
    references: [],
    relatedServiceIds: related,
    publication: DRAFT,
    internalNotes: [reviewNote],
  };
}
