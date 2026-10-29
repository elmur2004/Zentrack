/** Small stroke icons for the dashboard. Decorative unless a label is supplied by the caller. */
import type { ReactNode } from 'react';

type P = { size?: number; className?: string };

function Svg({ size = 18, className, children }: P & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className}>
      {children}
    </svg>
  );
}

export const IconOverview = (p: P) => (<Svg {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></Svg>);
export const IconInbox = (p: P) => (<Svg {...p}><path d="M3 13l2.5-7.5A2 2 0 0 1 7.4 4h9.2a2 2 0 0 1 1.9 1.5L21 13" /><path d="M3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5h-5.5a3.5 3.5 0 0 1-7 0H3z" /></Svg>);
export const IconQueue = (p: P) => (<Svg {...p}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.2-3.4 3.9-5 7-5s5.8 1.6 7 5" /></Svg>);
export const IconArchive = (p: P) => (<Svg {...p}><rect x="3" y="4" width="18" height="4.5" rx="1" /><path d="M5 8.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5" /><path d="M10 12.5h4" /></Svg>);
export const IconTeam = (p: P) => (<Svg {...p}><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c.9-3 3-4.5 5.5-4.5s4.6 1.5 5.5 4.5" /><circle cx="17" cy="9.5" r="2.4" /><path d="M16 14.6c2 .1 3.7 1.4 4.5 3.9" /></Svg>);
export const IconSettings = (p: P) => (<Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Svg>);
export const IconAudit = (p: P) => (<Svg {...p}><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></Svg>);
export const IconUser = (p: P) => (<Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></Svg>);
export const IconBell = (p: P) => (<Svg {...p}><path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" /><path d="M10 20a2.2 2.2 0 0 0 4 0" /></Svg>);
export const IconMenu = (p: P) => (<Svg {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Svg>);
export const IconClose = (p: P) => (<Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>);
export const IconChevron = (p: P) => (<Svg {...p}><path d="M15 6l-6 6 6 6" /></Svg>);
export const IconArrowBack = (p: P) => (<Svg {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>);
export const IconSearch = (p: P) => (<Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></Svg>);
export const IconFilter = (p: P) => (<Svg {...p}><path d="M4 5h16l-6 7.5V19l-4 1.5v-8z" /></Svg>);
export const IconFile = (p: P) => (<Svg {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" /><path d="M14 3v5h5" /></Svg>);
export const IconPaperclip = (p: P) => (<Svg {...p}><path d="M20 11.5l-8.2 8.2a5 5 0 0 1-7.1-7.1l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9" /></Svg>);
export const IconDownload = (p: P) => (<Svg {...p}><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" /></Svg>);
export const IconEye = (p: P) => (<Svg {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></Svg>);
export const IconCheck = (p: P) => (<Svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>);
export const IconAlert = (p: P) => (<Svg {...p}><path d="M12 3.5l9.5 16.5h-19L12 3.5z" /><path d="M12 10v4.5M12 17.5v.01" /></Svg>);
export const IconInfo = (p: P) => (<Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5v.01" /></Svg>);
export const IconLock = (p: P) => (<Svg {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></Svg>);
export const IconSend = (p: P) => (<Svg {...p}><path d="M21 3L10 14" /><path d="M21 3l-6.5 18-4.5-7-7-4.5L21 3z" /></Svg>);
export const IconNote = (p: P) => (<Svg {...p}><path d="M5 4h10l4 4v12H5z" /><path d="M9 11h6M9 15h4" /></Svg>);
export const IconPlus = (p: P) => (<Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>);
export const IconExternal = (p: P) => (<Svg {...p}><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></Svg>);
export const IconSignOut = (p: P) => (<Svg {...p}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 16l-4-4 4-4M6 12h10" /></Svg>);
export const IconClock = (p: P) => (<Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>);
export const IconEmpty = (p: P) => (<Svg {...p}><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="M3.5 13h4.5l1.5 2h5l1.5-2h4.5" /></Svg>);
export const IconBriefcase = (p: P) => (<Svg {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" /><path d="M3 12.5h18" /></Svg>);
export const IconMail = (p: P) => (<Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6.5L12 13l8.5-6.5" /></Svg>);
export const IconCopy = (p: P) => (<Svg {...p}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></Svg>);

/** Status glyphs: each status has a distinct shape, so colour is never the only signal. */
export function StatusGlyph({ status, size = 14 }: { status: string; size?: number }) {
  switch (status) {
    case 'new':
      return (<Svg size={size}><circle cx="12" cy="12" r="5" fill="currentColor" /></Svg>);
    case 'in_review':
      return (<Svg size={size}><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.6-4.6" /></Svg>);
    case 'awaiting_information':
      return (<Svg size={size}><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></Svg>);
    case 'preparing_quote':
      return (<Svg size={size}><path d="M4 20l4-1 10.5-10.5a2.1 2.1 0 0 0-3-3L5 16l-1 4z" /></Svg>);
    case 'quote_sent':
      return (<Svg size={size}><path d="M21 3L10 14" /><path d="M21 3l-6.5 18-4.5-7-7-4.5L21 3z" /></Svg>);
    case 'won':
      return (<Svg size={size}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>);
    case 'lost':
      return (<Svg size={size}><circle cx="12" cy="12" r="8" /><path d="M8 16L16 8" /></Svg>);
    case 'contacted':
      return (<Svg size={size}><path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16h-8l-4.5 3.5V16H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 5z" /></Svg>);
    case 'closed':
      return (<Svg size={size}><rect x="4.5" y="4.5" width="15" height="15" rx="3" /><path d="M8.5 12h7" /></Svg>);
    default:
      return null;
  }
}
