/**
 * English UI dictionary and page copy.
 * Base copy: F4 (Simple Copy v2), qualified by F1/F3 (see docs/content-decisions.md).
 * Arabic must mirror every key (enforced by the type in ar.ts and by `npm run check:locales`).
 */
import { errorStrings } from './errors';

const en = {
  meta: {
    siteName: 'Zentrac',
    defaultTitle: 'Zentrac — Engineering and BIM Consultancy',
    titleTemplate: '%s · Zentrac',
    defaultDescription:
      'Zentrac provides BIM modelling, coordination and shop drawings for infrastructure, landscape and building projects. Based in Cairo, Egypt.',
    ogImageAlt: 'Zentrac logo with the line “Engineered to Be Built.”',
  },
  common: {
    brandName: 'Zentrac',
    brandLine: 'Engineered to Be Built.',
    descriptor: 'Engineering and BIM Consultancy',
    requestQuote: 'Request a Quote',
    exploreServices: 'Explore Our Services',
    viewServiceNamed: 'View {name}',
    viewService: 'View service',
    learnMore: 'Learn more',
    illustrative: 'Illustrative',
    skipToContent: 'Skip to main content',
    breadcrumb: 'Breadcrumb',
    home: 'Home',
    backToServices: 'Back to Services',
    deliverables: 'Deliverables',
    opensInNewTab: '(opens in a new tab)',
    externalLink: 'External link',
    loading: 'Loading…',
    downloadProfile: 'Download Company Profile',
    profileEnglishPdf: 'Company profile — English PDF, {size}',
    profileArabicPdf: 'Company profile — Arabic PDF, {size}',
  },
  nav: {
    primary: 'Primary',
    about: 'About',
    services: 'Services',
    allServices: 'All Services',
    servicesMenu: 'Services menu',
    infrastructure: 'Infrastructure',
    howWeWork: 'How We Work',
    projects: 'Projects',
    insights: 'Insights',
    clients: 'Who We Work With',
    partners: 'Partners',
    careers: 'Careers',
    privacy: 'Privacy Policy',
    quote: 'Request a Quote',
  },
  header: {
    homeLink: 'Zentrac home',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    menuTitle: 'Menu',
    switchLanguage: 'Switch to Arabic',
    fileLossWarning:
      'Selected files cannot be carried over to the Arabic page. Your typed details will be kept, but you will need to select the files again. Continue?',
  },
  footer: {
    descriptor: 'Engineering and BIM consultancy for infrastructure, landscape and building projects.',
    company: 'Company',
    services: 'Services',
    office: 'Office',
    contact: 'Contact',
    email: 'Email',
    phone: 'Phone',
    whatsapp: 'WhatsApp',
    linkedin: 'LinkedIn',
    copyright: '© {year} Zentrac. All rights reserved.',
    footerNav: 'Footer',
  },
  home: {
    meta: {
      title: 'Zentrac — Engineering and BIM Consultancy',
      description:
        'BIM modelling, coordination and shop drawings for infrastructure, landscape and building projects. Founded in Cairo in 2026, building on founder experience since 2018.',
    },
    hero: {
      eyebrow: 'Engineering and BIM Consultancy',
      title: 'Engineered to Be Built.',
      lead: 'We provide BIM modelling, coordination and shop drawings for infrastructure, landscape and building projects.',
      descriptors: 'Project types',
      caption: 'Illustrative coordination model',
    },
    problem: {
      eyebrow: 'The gap',
      title: 'Resolve coordination issues before they reach site.',
      intro:
        'Many site problems begin as gaps on paper. We review, model and coordinate within the agreed scope so issues are raised and tracked before drawings are issued.',
      items: [
        {
          title: 'Conflicting information',
          text: 'Drawings contradict each other or the specification, and open questions pile up as Requests for Information (RFIs).',
        },
        {
          title: 'Coordination issues',
          text: 'When disciplines are not coordinated in one model, networks meet at excavation and services clash at installation.',
        },
        {
          title: 'Drawings returned with comments',
          text: 'Shop drawings come back for revision while the programme waits.',
        },
      ],
    },
    services: {
      eyebrow: 'Services',
      title: 'What we deliver.',
      intro: 'Hire us for one service or for the full agreed scope.',
      allServices: 'All Services',
      deliverablesCue: 'Deliverables:',
      visualCaption: 'Illustrative view of the selected service',
      selectHint: 'Select a service to preview it',
      previewService: 'Preview {name}',
    },
    why: {
      eyebrow: 'Why Zentrac',
      title: 'Why teams hand us the hard part.',
      registerTitle: 'Issue register',
      registerNote: 'Illustrative example — not project data',
      columns: { ref: 'Ref.', interface: 'Interface', issue: 'Issue', status: 'Status' },
      rows: [
        { ref: 'RFI-024', interface: 'Stormwater / Water', issue: 'Crossing level to be confirmed', status: 'Raised' },
        { ref: 'CL-07', interface: 'LV / MV / Irrigation', issue: 'Clearance in shared corridor', status: 'In review' },
        { ref: 'RFI-031', interface: 'Roads / Grading', issue: 'Spot levels missing at junction', status: 'Answered' },
        { ref: 'CL-12', interface: 'Sewerage / Telecom', issue: 'Manhole conflicts with duct route', status: 'Closed' },
      ],
    },
    explorer: {
      eyebrow: 'Infrastructure',
      title: 'Eleven infrastructure categories. One coordinated approach.',
      intro:
        'We model and coordinate utility networks, roads, landscape and canals so conflicts can be identified and resolved before construction starts.',
      cta: 'Explore infrastructure',
    },
    package: {
      eyebrow: 'Deliverables',
      title: 'What a coordinated package includes.',
      intro:
        'A typical package combines a model, the drawings extracted from it and a record of the issues raised along the way. Contents are agreed for each scope.',
      note: 'Generic illustrations. They do not represent a specific project.',
      items: [
        {
          title: 'Discipline model',
          text: 'Models built to the agreed BIM Execution Plan (BEP) and Level of Development (LOD), with clear scope boundaries.',
        },
        {
          title: 'Drawings',
          text: 'Shop drawings and combined services drawings extracted from the coordinated model.',
        },
        {
          title: 'Issue register',
          text: 'Clash reports and a Request for Information (RFI) register that record each issue and its follow-up.',
        },
      ],
      cta: 'See selected experience',
    },
    track: {
      eyebrow: 'How we work',
      title: 'The Zentrac Track.',
      intro:
        'Six stages, from review to site support. What we receive is checked; what we hand over is prepared for the next party.',
      joinTitle: 'Join at the stage you need.',
      joinText: 'Engage us for one stage, one network or the full agreed scope.',
      cta: 'See how we work',
      stagesNav: 'Track stages',
      input: 'Input',
      output: 'Output',
      visualLabel: 'Stage {number} of 6: {title}',
    },
    audiences: {
      eyebrow: 'Who we work with',
      title: 'Support shaped around the teams that deliver projects.',
      intro: 'We work with developers, contractors and engineering consultants.',
      typicalDeliverables: 'Typical deliverables',
      cta: '{audience}: how we support you',
    },
    insights: {
      eyebrow: 'Insights',
      title: 'Latest articles',
      cta: 'All articles',
    },
    contact: {
      title: 'Have a project?',
      text: 'Tell us about your scope and the support you need.',
      note: 'Share a non-confidential overview first; detailed drawings can follow once scope and confidentiality are agreed.',
      whatsapp: 'Message us on WhatsApp',
    },
  },
  about: {
    meta: {
      title: 'About Us',
      description:
        'Zentrac is an engineering and BIM consultancy in Cairo, founded in 2026 by civil engineer Mark Mofreh, whose roads and infrastructure experience began in 2018.',
    },
    hero: {
      eyebrow: 'About us',
      title: 'About Zentrac',
      lead: 'Zentrac is an engineering and BIM consultancy based in Cairo, Egypt. We provide BIM modelling, coordination and shop drawings for developers, contractors and consultants.',
    },
    company: {
      eyebrow: 'The company',
      title: 'A new company built on founder experience since 2018.',
      paragraphs: [
        'Zentrac was established in 2026. Its work draws on the experience of its founder, a civil engineer working in roads and infrastructure since 2018, and on packages delivered through his former individual practice, BIM Experts.',
        'Our service focus combines BIM modelling, coordination and shop-drawing production within clearly defined scopes. For every assignment we agree the disciplines, responsibilities and deliverables in writing.',
      ],
      facts: {
        founded: 'Founded',
        foundedValue: '2026',
        experience: 'Founder experience since',
        experienceValue: '2018',
        office: 'Office',
        officeValue: 'Heliopolis, Cairo',
      },
    },
    founder: {
      eyebrow: 'Our founder',
      name: 'Mark Mofreh',
      role: 'Founder · Civil Engineer',
      bio: [
        'Mark Mofreh is the founder of Zentrac and a civil engineer who began his professional career in roads and infrastructure in 2018.',
        'His experience includes shop drawings, quantity take-offs, bills of quantities and utility review, alongside BIM modelling and coordination for roads, utilities and landscape.',
        'Before establishing Zentrac, he operated BIM Experts as his individual practice and contributed to defined outsourced packages within larger projects in Saudi Arabia, Egypt and Rwanda.',
      ],
      panelLabel: 'Founder name panel',
    },
    chronology: {
      eyebrow: 'Chronology',
      title: 'From project experience to a consultancy.',
      note: 'Dates before 2026 refer to the founder’s career, not to Zentrac’s operating history.',
      items: [
        { year: '2018', text: 'Begins a civil engineering career in roads and infrastructure.' },
        { year: '2020', text: 'Works in a technical office on shop drawings and quantities.' },
        { year: '2021', text: 'Works in a technical office on roads and utilities.' },
        {
          year: 'Before 2026',
          text: 'Operates BIM Experts as an individual practice, delivering defined modelling, coordination and drawing packages as outsourced work.',
        },
        { year: '2026', text: 'Founds Zentrac in Cairo.' },
      ],
    },
    values: {
      eyebrow: 'Working principles',
      title: 'How we work with you.',
    },
  },
  servicesPage: {
    meta: {
      title: 'Services',
      description:
        'Five Zentrac services: BIM modelling, coordination, shop drawings, design review, and quantities and as-built models. Hire us for one service or the full agreed scope.',
    },
    hero: {
      eyebrow: 'Services',
      title: 'Our Services',
      lead: 'BIM modelling, coordination and drawing production for infrastructure, landscape and building projects. Hire us for one service or for the full agreed scope.',
    },
    listTitle: 'Five services',
    flexible: {
      eyebrow: 'Flexible scope',
      title: 'Start with one package.',
      text: 'Engage us for a single package, one network, coordination only or the full agreed scope. Every engagement starts with an agreed scope and deliverables list.',
      cta: 'See engagement options',
    },
    specialist: {
      eyebrow: 'Specialist services',
      title: 'Survey, Scan to BIM and AR',
      text: 'Survey, Scan to BIM and augmented reality (AR) services can be arranged with specialist partners. Contact us to discuss your requirements.',
    },
  },
  serviceDetail: {
    summary: 'Summary',
    included: 'What is included',
    inputs: 'Inputs we need',
    deliverables: 'Deliverables',
    process: 'How the work runs',
    processNote: 'A simplified sequence. Each scope includes only the services agreed for it.',
    processSteps: ['Review', 'Model', 'Coordinate', 'Deliver'],
    processTitle: 'Review → Model → Coordinate → Deliver',
    relatedTitle: 'Related experience',
    ctaTitle: 'Discuss {service}',
    ctaText: 'Tell us about the scope, the inputs available and the deliverables you need.',
    ctaButton: 'Request a quote for this service',
    otherServices: 'Other services',
    scopeNoteLabel: 'Scope note',
  },
  infrastructurePage: {
    meta: {
      title: 'Infrastructure BIM',
      description:
        'Modelling and coordination across eleven infrastructure categories, from water, sewerage and stormwater to power, street lighting, roads, landscape and canals.',
    },
    hero: {
      eyebrow: 'Infrastructure',
      title: 'Infrastructure BIM',
      lead: 'We model and coordinate infrastructure networks so that conflicts can be resolved before construction starts.',
    },
    categoriesTitle: 'The eleven categories',
    categoriesIntro:
      'Each project defines which categories are in scope and whether our role is modelling, coordination or drawing production.',
    interfaces: {
      eyebrow: 'Where networks meet',
      title: 'Coordination interfaces we track',
      items: [
        'Crossings and clearances between wet and dry utilities',
        'Manholes, chambers and inlets set to road and landscape levels',
        'Shared corridors for power, lighting and telecom routes',
        'Finished levels and grading that drive gravity networks and surface drainage',
      ],
      deliverablesTitle: 'Typical deliverables',
      deliverables: ['Federated network models', 'Clash reports', 'Combined services drawings', 'RFI register'],
    },
    scopeNote:
      'These categories describe the modelling and coordination support we provide. Design responsibility is defined separately for each project.',
  },
  explorer: {
    groupLabel: 'Infrastructure categories',
    showAll: 'Show all',
    overviewTitle: 'All eleven categories',
    overviewText:
      'Select a category to highlight it in the site schematic. Each project defines which categories, roles and deliverables are in scope.',
    caption: 'Illustrative schematic — not to scale and not construction guidance.',
    selected: 'Selected category: {name}',
    diagramLabel: 'Illustrative site schematic. The selected category is highlighted; all descriptions are listed in text.',
  },
  howWeWorkPage: {
    meta: {
      title: 'How We Work — The Zentrac Track',
      description:
        'The Zentrac Track: review, model, coordinate, drawings, quantities and site support. Start at the stage you need, for one package, one network or the full agreed scope.',
    },
    hero: {
      eyebrow: 'How we work',
      title: 'How We Work',
      lead: 'The Zentrac Track runs from review to site support. You can start at any stage of the project.',
    },
    engagement: {
      eyebrow: 'Ways to work with us',
      title: 'Choose an engagement.',
      intro: 'Schedules and turnaround are agreed for each scope.',
      cta: 'Request a quote for this option',
    },
  },
  clientsPage: {
    meta: {
      title: 'Who We Work With',
      description:
        'How Zentrac supports developers and owners, contractors and engineering consultants with BIM modelling, coordination, shop drawings and design review.',
    },
    hero: {
      eyebrow: 'Who we work with',
      title: 'Who We Work With',
      lead: 'We work with developers, contractors and engineering consultants. Here is how our services fit each of them.',
    },
    needs: 'What you need',
    deliverables: 'What we deliver',
    cta: 'Request a Quote',
  },
  projectsPage: {
    meta: {
      title: 'Selected Experience',
      description:
        'Selected experience of Zentrac’s founder and his former practice, BIM Experts, with the exact scope of each package.',
    },
    hero: {
      eyebrow: 'Projects',
      title: 'Selected Experience',
      lead: 'Selected experience of our founder and his former practice, BIM Experts. Each project states the exact scope assigned.',
    },
    attribution:
      'Experience shown is that of our founder and BIM Experts: defined packages within larger projects, not complete project delivery by Zentrac.',
    empty: {
      title: 'Project details are being prepared for publication.',
      text: 'The founder’s experience covers infrastructure utilities, roads, landscape and canals in Saudi Arabia, Egypt and Rwanda. Project names, images and scopes are published only after the relevant approvals. Until then, we are glad to discuss relevant experience directly.',
      cta: 'Discuss your project',
    },
    filters: {
      title: 'Filter projects',
      country: 'Country',
      service: 'Service',
      sector: 'Sector',
      all: 'All',
      clear: 'Clear Filters',
      apply: 'Apply filters',
    },
    results: {
      zero: 'No matching projects',
      one: 'One project',
      two: 'Two projects',
      few: '{count} projects',
      many: '{count} projects',
      other: '{count} projects',
    },
    noResultsText: 'Try another combination or clear the filters.',
    sectors: {
      residential: 'Residential community',
      urban: 'Urban infrastructure',
      sports: 'Sports venue',
      parks: 'Parks and landscape',
      canals: 'Canals and civil works',
      wastewater: 'Wastewater',
      roads: 'Roads',
    },
    card: {
      view: 'View Project',
      viewNamed: 'View project: {name}',
      attribution: 'Founder / BIM Experts experience',
      noImage: 'Image not yet cleared for publication',
    },
  },
  projectDetail: {
    attributionTitle: 'Attribution',
    facts: 'Project facts',
    country: 'Country',
    sector: 'Sector',
    package: 'Package',
    owner: 'Project owner / developer',
    appointingParty: 'Direct appointing party',
    services: 'Services',
    scopeTitle: 'Scope and deliverables',
    assignedScope: 'Assigned scope',
    gallery: 'Technical gallery',
    relatedServices: 'Related services',
    enquireTitle: 'Planning a similar package?',
    enquireText: 'Tell us about your scope and the support you need.',
    backToProjects: 'Back to Projects',
    openImage: 'Enlarge image {n} of {total}: {caption}',
    dialogLabel: 'Image viewer',
    close: 'Close',
    previous: 'Previous image',
    next: 'Next image',
    position: 'Image {n} of {total}',
  },
  blogPage: {
    meta: {
      title: 'Insights',
      description: 'Articles on BIM modelling, coordination and infrastructure from Zentrac.',
    },
    hero: {
      eyebrow: 'Insights',
      title: 'Insights',
      lead: 'Articles on BIM modelling, coordination and infrastructure.',
    },
    empty: {
      title: 'Our first articles are being written and reviewed.',
      text: 'Each article is technically reviewed before publication. In the meantime, explore our services or send us your question.',
      ctaServices: 'Explore Our Services',
      ctaContact: 'Ask a Question',
    },
    read: 'Read article',
    readNamed: 'Read article: {title}',
  },
  article: {
    published: 'Published',
    updated: 'Updated',
    by: 'By {author}',
    readingTime: {
      one: '1 min read',
      two: '2 min read',
      few: '{count} min read',
      many: '{count} min read',
      other: '{count} min read',
    },
    references: 'References',
    relatedServices: 'Related services',
    back: 'Back to Insights',
    ctaTitle: 'Questions about your project?',
    ctaText: 'Tell us about your scope and the support you need.',
  },
  quotePage: {
    meta: {
      title: 'Request a Quote',
      description:
        'Send Zentrac your project details for BIM modelling, coordination, shop drawings, design review or quantities and as-built support.',
    },
    hero: {
      eyebrow: 'Request a Quote',
      title: 'Request a Quote',
      lead: 'Send us your project details and we will reply with a proposal.',
    },
    officeTitle: 'Office',
    contactTitle: 'Contact',
    confidentiality:
      'Share a non-confidential overview first. Detailed drawings and models can be exchanged once scope and confidentiality are agreed.',
    closing: 'Prefer to explore first? Read about how we work or browse our services.',
  },
  partnersPage: {
    meta: {
      title: 'Partners',
      description:
        'Zentrac welcomes collaboration with consultants, contractors, survey firms and engineering companies on defined infrastructure and BIM packages.',
    },
    hero: {
      eyebrow: 'Partnerships',
      title: 'Partners',
      lead: 'We welcome conversations with consultants, contractors, survey firms and engineering companies about project collaboration. Terms are agreed in writing for each collaboration.',
    },
    typesTitle: 'Who we would like to hear from',
    formTitle: 'Start a conversation',
    formIntro: 'Tell us about your organisation and the collaboration you have in mind.',
  },
  careersPage: {
    meta: {
      title: 'Careers',
      description: 'Zentrac works with BIM engineers and modellers on a project basis. Share your CV or portfolio.',
    },
    hero: {
      eyebrow: 'Careers',
      title: 'Careers',
      lead: 'We work with BIM engineers and modellers on a project basis. Send us your CV or portfolio.',
    },
    note: 'There are no specific vacancies listed at the moment. Share your details and we will contact you if a suitable project-based opportunity arises.',
    formTitle: 'Share your details',
    looking: {
      title: 'Roles we work with',
      items: [
        'BIM modellers for infrastructure utilities, roads and landscape',
        'BIM coordinators experienced in federation and clash detection',
        'Civil and infrastructure engineers with shop-drawing experience',
      ],
    },
  },
  privacyPage: {
    meta: {
      title: 'Privacy Policy',
      description: 'How Zentrac handles the information you send through this website: what is collected, why, who can see it, how long it is kept and how to ask about it.',
    },
    hero: {
      eyebrow: 'Legal',
      title: 'Privacy Policy',
      lead: 'How information sent through this website is handled.',
    },
    updatedLabel: 'Last updated',
    versionLabel: 'Version',
    units: {
      months: { zero: '{count} months', one: 'one month', two: 'two months', few: '{count} months', many: '{count} months', other: '{count} months' },
      days: { zero: '{count} days', one: 'one day', two: 'two days', few: '{count} days', many: '{count} days', other: '{count} days' },
      hours: { zero: '{count} hours', one: 'one hour', two: 'two hours', few: '{count} hours', many: '{count} hours', other: '{count} hours' },
    },
    sections: [
      {
        id: 'who-we-are',
        title: 'Who we are',
        body: [
          'This website is operated by Zentrac, an engineering and BIM consultancy with its office at 6th Floor, 1 Roxy Square, Heliopolis, Cairo, Egypt. Zentrac is responsible for the personal information you send through this website.',
        ],
      },
      {
        id: 'information',
        title: 'Information you send us',
        body: [
          'Quote request form: your name, company, email address, optional phone number, country, the services you are interested in, the engagement scope, a description of your project and any files you choose to attach.',
          'Partner form: your name, company, email address, optional phone number, country, the type of partner you are and a description of what you offer.',
          'Careers form: your name, email address, discipline, optional years of experience, a portfolio link and, if you choose, a CV in PDF format.',
          'With each submission we also record the date and time, the language of the page, the page you sent it from and the version of this policy you confirmed.',
          'Please do not include confidential drawings or sensitive personal information in a first enquiry.',
        ],
      },
      {
        id: 'use',
        title: 'How the information is used',
        body: [
          'We use the details you send only to reply to you, to assess your enquiry and prepare a proposal, to consider a partnership, or to consider your application for project-based work.',
          'We do not sell your information, use it for advertising or add you to a mailing list.',
        ],
      },
      {
        id: 'access',
        title: 'Who can see it',
        body: [
          'Submissions are stored in Zentrac’s private, access-controlled dashboard. Only Zentrac team members with a dashboard account can see quote requests, and each person sees only what their role allows. Partner enquiries, career applications and CVs are visible only to the owner and managers.',
          'Sign-in is required, and viewing files, changing records and deleting them are recorded in an internal activity log.',
        ],
      },
      {
        id: 'files',
        title: 'Files',
        body: [
          'Files you attach are stored privately and are never published. They are held back and cannot be opened by the team until a team member has reviewed them and released them.',
          'Project files can be PDF, JPG or PNG (up to 3 files, 10 MB each). A CV can be a PDF of up to 5 MB. Detailed models and drawings are exchanged after scope and confidentiality are agreed.',
        ],
      },
      {
        id: 'providers',
        title: 'Service providers',
        body: [
          'This website, its database and its file storage run on a hosting provider, and the emails we exchange with you go through our email provider. These providers act on our instructions and may use your information only to provide their service to us.',
          'We do not use advertising, analytics or social-media tracking services.',
        ],
      },
      {
        id: 'retention',
        title: 'How long information is kept',
        body: [
          'Quote requests and partner enquiries are deleted {quoteMonths} after the last activity on them. If an enquiry leads to an engagement, we keep it for as long as that engagement and our legal or accounting obligations require.',
          'Career applications, including any CV, are deleted {careerMonths} after the last activity on them.',
          'Submissions identified as spam are deleted after {spamDays}, and files attached to a form that was never sent are deleted within {uploadHours}.',
          'To protect the forms from repeated automated submissions, we keep a coded (non-readable) form of the network address that sent a form for up to {rateLimitHours}.',
          'You can ask us to delete your information sooner (see “Your choices”).',
        ],
      },
      {
        id: 'rights',
        title: 'Your choices',
        body: [
          'You can ask us what information we hold about you, and ask us to correct it or delete it. We may need to confirm your identity before we act, and we reply within one month.',
        ],
      },
      {
        id: 'cookies',
        title: 'Cookies and browser storage',
        body: [
          'This website does not use advertising or analytics cookies and does not track you across websites.',
          'When you attach a file to a form, a strictly necessary cookie links the upload to your submission; it expires after {uploadCookieHours}. The text you type in a form stays only in the open page (so it survives a language switch) and is not saved in your browser.',
        ],
      },
      {
        id: 'changes',
        title: 'Changes to this policy',
        body: [
          'If we change how we handle information, we will update this page and its date. Each submission records the version of the policy that was shown when it was sent.',
        ],
      },
    ],
    rightsContactEmail: 'To make a request, email {email} or write to our office address above, quoting your reference number if you have one.',
    rightsContactPost: 'To make a request, write to our office address above, quoting your reference number if you have one.',
  },
  forms: {
    required: 'Required',
    optional: 'Optional',
    errorSummaryTitle: 'Please correct the following:',
    fields: {
      name: { label: 'Name' },
      company: { label: 'Company' },
      email: { label: 'Email' },
      phone: { label: 'Phone', help: 'Include the country code, for example {example}.' },
      country: { label: 'Country', placeholder: 'Select a country', common: 'Common', all: 'All countries' },
      services: {
        label: 'Services',
        help: 'Select one or more services, or choose “Not sure”.',
        notSure: 'Not sure',
      },
      scope: {
        label: 'Engagement scope',
        none: 'Not decided yet',
      },
      details: {
        label: 'Project details',
        help: 'A short, non-confidential overview: location, networks or disciplines, project stage and the deliverables you need.',
        counter: '{count} / {max} characters',
      },
      partnerDetails: {
        label: 'Collaboration details',
        help: 'A short, non-confidential overview of your organisation and the collaboration you have in mind.',
      },
      partnerType: {
        label: 'Organisation type',
        placeholder: 'Select a type',
      },
      discipline: { label: 'Discipline', placeholder: 'Select a discipline' },
      experience: { label: 'Years of experience', help: 'Whole number only.' },
      portfolio: { label: 'Portfolio link', help: 'A link to your online portfolio or profile, starting with {scheme}.' },
      cv: { label: 'CV', help: 'One PDF, up to {size}.' },
      attachments: {
        label: 'Attachments',
        help: 'Up to {count} files: PDF, JPEG or PNG; up to {size} each and {total} in total.',
        choose: 'Choose files',
        chooseOne: 'Choose file',
        remove: 'Remove {name}',
        cadNote:
          'CAD/BIM files (such as RVT, DWG or IFC) and archives are not accepted here. Model exchange can be arranged after scope and confidentiality are discussed.',
        unavailable:
          'Attachments are not accepted through this form yet. After we discuss scope and confidentiality, we will arrange a secure way to share drawings.',
        status: {
          uploading: 'Uploading…',
          uploaded: 'Ready',
          rejected: 'Rejected',
          failed: 'Upload failed',
          test: 'Checked (test only, not stored)',
        },
      },
      privacy: {
        label: 'I have read the {policy} and agree that Zentrac may use these details to respond.',
        policy: 'Privacy Policy',
      },
    },
    partnerTypes: {
      consultant: 'Engineering consultant',
      contractor: 'Contractor',
      survey: 'Survey firm',
      engineering: 'Engineering company',
      other: 'Other',
    },
    disciplines: {
      'bim-modeller': 'BIM modeller',
      'bim-coordinator': 'BIM coordinator',
      'civil-infrastructure': 'Civil / infrastructure engineer',
      utilities: 'Utilities or MEP engineer',
      landscape: 'Landscape specialist',
      other: 'Other',
    },
    errors: {
      nameRequired: 'Please enter your name.',
      nameLength: 'Your name should be between 2 and 100 characters.',
      companyRequired: 'Please enter your company name.',
      companyLength: 'The company name should be between 2 and 160 characters.',
      emailInvalid: 'Enter a valid email address.',
      phoneInvalid: 'Enter a valid phone number, including the country code.',
      countryRequired: 'Please select a country.',
      serviceRequired: 'Select a service or choose “Not sure”.',
      scopeInvalid: 'Select a valid engagement scope.',
      detailsShort: 'Please add a little more detail about your project.',
      detailsShortPartner: 'Please add a little more detail about the collaboration.',
      detailsLong: 'Please shorten the description to 4,000 characters or fewer.',
      privacyRequired: 'Please confirm that you have read the Privacy Policy.',
      partnerTypeRequired: 'Please select your organisation type.',
      disciplineRequired: 'Please select your discipline.',
      experienceInvalid: 'Enter a whole number of years, or leave this empty.',
      portfolioInvalid: 'Enter a full web address starting with {https} or {http}.',
      cvOrPortfolio: 'Please add a CV or a portfolio link.',
      fileTooLarge: 'This file exceeds the allowed size.',
      fileType: 'This file type is not accepted. Use PDF, JPEG or PNG.',
      cvType: 'Please upload your CV as a PDF.',
      fileCount: 'You can attach up to {count} files.',
      totalTooLarge: 'The selected files exceed the combined limit of {total}.',
      fileSignature: 'This file’s contents do not match its type.',
      uploadPending: 'Please wait until the files finish uploading.',
      fileRejected: 'This file could not be accepted. Remove it and try another file.',
      fileExpired: 'An attached file is no longer available. Remove it and attach it again.',
    },
    states: {
      submit: 'Send Request',
      submitApplication: 'Send Application',
      submitPartner: 'Send Enquiry',
      submitting: 'Sending your request…',
      submittingApplication: 'Sending your application…',
      submittingPartner: 'Sending your enquiry…',
      received: 'Your request has been received. Reference: {id}',
      receivedApplication:
        'Your application has been received. Reference: {id}. This confirms receipt only; it is not an offer or an interview invitation.',
      failure: 'We could not send your request. Your details are still here. Please try again.',
      tryAgain: 'Try Again',
      rateLimited: 'Too many attempts in a short time. Please wait a few minutes and try again.',
      unavailable: 'Online submission is temporarily unavailable.',
      unavailableContact: 'Please contact our office using the details in the footer.',
      closedPartner: 'We are not taking new partner enquiries at the moment. Please check this page again later.',
      closedCareer: 'We are not accepting applications at the moment. Please check this page again later.',
      testMode: 'Preview only. This test will not send a real enquiry.',
      testComplete: 'Test completed; no request was sent. Test reference: {id}',
      sendAnother: 'Send another request',
      noscript: 'This form needs JavaScript to send your details. Please enable JavaScript or contact our office using the details in the footer.',
      offline: 'You appear to be offline. Your details are still here; try again when you are connected.',
    },
  },
  notFound: {
    meta: { title: 'Page not found' },
    eyebrow: 'Error 404',
    title: 'Page not found',
    text: 'The page you are looking for does not exist or is not available.',
    links: 'Try one of these pages',
  },
  error: { ...errorStrings.en },
  review: {
    banner: 'Private review build — withheld and draft content. Not for publication.',
    recordBanner: 'Withheld record. Visible only in the private review build. Publication requires written approval.',
  },
};

export default en;
