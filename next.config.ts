import type { NextConfig } from 'next';

/**
 * ZENTRAC_REVIEW=1 enables the private local review build (see docs/content-editing.md).
 * Review-only routes use the `*.review.tsx` / `*.review.ts` extension, so they are not
 * compiled at all in a normal (public) build and cannot leak into its output.
 */
const review = process.env.ZENTRAC_REVIEW === '1';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
];

/** Admin and auth responses: never indexed, never shared by caches, no referrer leakage. */
const privateHeaders = [
  { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
  { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
];

const nextConfig: NextConfig = {
  pageExtensions: review ? ['review.tsx', 'review.ts', 'tsx', 'ts'] : ['tsx', 'ts'],
  // ZENTRAC_DIST_DIR: isolated copy of the build for the dashboard test server, so runtime page
  // regeneration (ISR) with synthetic test data never writes into the real .next output.
  distDir: review ? '.next-review' : process.env.ZENTRAC_DIST_DIR?.trim() || '.next',
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  // Database drivers load native/WASM assets at runtime and must not be bundled.
  serverExternalPackages: ['@electric-sql/pglite', 'pg'],
  experimental: {
    globalNotFound: true,
    // `inlineCss` was measured and rejected (docs/performance-before-after.md): Next.js embeds the CSS
    // in both the HTML and the RSC payload, which raised blocking time more than it saved.
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Never trace the supplied source documents, local data or private records into a deployment bundle.
  outputFileTracingExcludes: {
    '*': ['private-source/**', '*.pdf', '*.docx', '*.xlsx', 'docs/**', 'tests/**', '.data/**', '.checkpoints/**'],
  },
  async headers() {
    const headers = [
      { source: '/:path*', headers: securityHeaders },
      { source: '/:locale(en|ar)/admin', headers: privateHeaders },
      { source: '/:locale(en|ar)/admin/:path*', headers: privateHeaders },
      { source: '/api/admin/:path*', headers: privateHeaders },
      { source: '/api/auth/:path*', headers: privateHeaders },
      { source: '/api/jobs/:path*', headers: privateHeaders },
    ];
    if (review) {
      headers.push({ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] });
    }
    return headers;
  },
};

export default nextConfig;
