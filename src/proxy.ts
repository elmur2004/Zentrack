import { NextResponse, type NextRequest } from 'next/server';
import { publicRoutePaths } from '@/lib/public-routes';

const LOCALES = ['en', 'ar'];

/** Published public paths (locale-neutral), from the same registry as the sitemap. */
const PUBLIC_PATHS = new Set(publicRoutePaths());
const REVIEW_BUILD = process.env.ZENTRAC_REVIEW === '1';

/** Whether a locale-neutral path is a real public page (the private review area only in review builds). */
function isPublicPage(rest: string): boolean {
  return PUBLIC_PATHS.has(rest) || (REVIEW_BUILD && (rest === 'review' || rest.startsWith('review/')));
}

/** Lowercases ASCII letters but leaves percent-escapes alone (their hex case is not significant). */
const lowerPath = (path: string) => path.replace(/(%[0-9a-fA-F]{2})|[A-Z]/g, (m, escape?: string) => escape ?? m.toLowerCase());

/** sha256 of the root layout's inline `js`-class script (src/app/[locale]/layout.tsx). Update both together. */
const JS_CLASS_SCRIPT_HASH = "'sha256-Du+OJKJSbdUgz5nrHeWWINvez6XKDDU/tyj/5c2uvwo='";

/**
 * Content-Security-Policy (docs/post-build-audit.md, SEC-01).
 * - Dashboard pages render per request, so they get a strict policy: a fresh nonce that Next.js
 *   applies to its own scripts (it reads the nonce from the request's CSP header), 'strict-dynamic'
 *   for the chunks those scripts load, and the hash of the one inline `js`-class script.
 * - Public pages are prerendered and Next.js inlines their RSC payload, so a per-request nonce is
 *   impossible; they allow inline scripts but still block every other script origin, eval, plugins,
 *   framing, <base> and form-target hijacking.
 * Styles allow inline attributes (React style props); no third-party origins are allowed anywhere.
 */
function contentSecurityPolicy(nonce: string | null): string {
  const dev = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''; // React dev tooling only
  const scripts = nonce ? `'self' 'nonce-${nonce}' 'strict-dynamic' ${JS_CLASS_SCRIPT_HASH}` : "'self' 'unsafe-inline'";
  const https = (process.env.SITE_URL ?? '').startsWith('https://');
  return [
    "default-src 'self'",
    `script-src ${scripts}${dev}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(https ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

function newNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Locale entry and canonical URL policy (docs/seo-audit.md):
 * - "/" redirects to "/en" (explicit default; no Accept-Language or geo redirects).
 * - An unprefixed page path (e.g. "/about") redirects once to "/en/about"; if that page
 *   does not exist, the localized 404 renders with a real 404 status.
 * - Explicit locale URLs always win and are never redirected to another language.
 * - Public page URLs are lowercase: "/EN/Services" gets one permanent redirect to "/en/services"
 *   (query kept). Admin URLs only have their locale/"admin" segments normalized, because
 *   invitation tokens and record IDs after them are case-sensitive.
 * - Trailing and duplicate slashes are normalized by Next.js (308) before this runs.
 * - Any other public path (unknown page, unknown or withheld slug) is rewritten to the localized,
 *   server-rendered 404 page with a real 404 status (BUG-01: a page-level notFound() would reach
 *   visitors as an empty client-rendered shell).
 * Admin pages additionally receive the requested path (for a safe return after sign-in).
 * Authorization itself happens in the admin layout, pages, actions and route handlers.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split('/');
  const locale = (segments[1] ?? '').toLowerCase();
  const isAdmin = (segments[LOCALES.includes(locale) ? 2 : 1] ?? '').toLowerCase() === 'admin';

  if (LOCALES.includes(locale)) {
    const canonical = isAdmin ? ['', locale, 'admin', ...segments.slice(3)].join('/') : lowerPath(pathname);
    if (canonical !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = canonical;
      return NextResponse.redirect(url, 308);
    }
    const headers = new Headers(request.headers);
    headers.delete('x-znt-path');
    headers.delete('content-security-policy'); // never trust a client-supplied policy/nonce
    const csp = contentSecurityPolicy(isAdmin ? newNonce() : null);
    if (isAdmin) {
      headers.set('x-znt-path', pathname);
      headers.set('content-security-policy', csp); // Next.js takes the script nonce from here
    }
    let response: NextResponse;
    if (!isAdmin && !isPublicPage(segments.slice(2).join('/'))) {
      const notFoundUrl = request.nextUrl.clone();
      notFoundUrl.pathname = `/${locale}/page-not-found`;
      response = NextResponse.rewrite(notFoundUrl, { status: 404, request: { headers } });
    } else {
      response = NextResponse.next({ request: { headers } });
    }
    response.headers.set('Content-Security-Policy', csp);
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? '/en' : `/en${isAdmin ? pathname : lowerPath(pathname)}`;
  // never carry arbitrary query parameters through this redirect
  url.search = '';
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: [
    // Skip Next internals, API routes, metadata files and any path with a file extension.
    '/((?!api|_next/static|_next/image|favicon\\.ico|icon\\.png|apple-icon\\.png|robots\\.txt|sitemap\\.xml|.*\\.[a-zA-Z0-9]+$).*)',
  ],
};
