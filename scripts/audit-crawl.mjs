// Crawls every internal link reachable from /en and /ar with a real browser and records
// HTTP status, console errors, failed requests, titles, descriptions, canonicals, hreflang,
// Open Graph, JSON-LD, image alternatives, heading outline and outgoing links.
// Only public links are followed (the dashboard is never linked from public pages).
// Usage: node scripts/audit-crawl.mjs http://localhost:3000 docs/qa/crawl-before.json
import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [base = 'http://localhost:3000', out = 'docs/qa/crawl.json'] = process.argv.slice(2);
const start = ['/en', '/ar'];
const seen = new Map();
const queue = [...start];
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  const page = await context.newPage();
  const consoleErrors = [];
  const failed = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 300)));
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message.slice(0, 300)}`));
  page.on('requestfailed', (r) => {
    // The Next.js router cancels prefetches of per-request (dynamic) pages such as the forms: not a failure.
    if (r.url().includes('_rsc=') && r.failure()?.errorText === 'net::ERR_ABORTED') return;
    failed.push(`${r.url()} ${r.failure()?.errorText ?? ''}`);
  });
  page.on('response', (r) => r.status() >= 400 && !r.url().endsWith(path) && failed.push(`${r.status()} ${r.url()}`));
  let status = 0;
  let xRobots = null;
  try {
    const res = await page.goto(base + path, { waitUntil: 'networkidle', timeout: 45000 });
    status = res?.status() ?? 0;
    xRobots = res?.headers()['x-robots-tag'] ?? null;
  } catch (e) {
    consoleErrors.push(`navigation: ${e.message.slice(0, 200)}`);
  }
  const info = await page
    .evaluate(() => ({
      title: document.title,
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
      canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href') ?? null,
      robots: document.querySelector('meta[name=robots]')?.getAttribute('content') ?? null,
      hreflang: [...document.querySelectorAll('link[rel=alternate][hreflang]')].map((l) => `${l.hreflang}=${l.getAttribute('href')}`),
      links: [...new Set([...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')))],
      deadLinks: [...document.querySelectorAll('a[href="#"], a:not([href])')].length,
      description: document.querySelector('meta[name=description]')?.getAttribute('content') ?? null,
      og: Object.fromEntries(
        ['og:title', 'og:description', 'og:url', 'og:image', 'og:locale', 'og:type', 'twitter:card'].map((k) => [
          k,
          document.querySelector(`meta[property="${k}"], meta[name="${k}"]`)?.getAttribute('content') ?? null,
        ]),
      ),
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
        try {
          const j = JSON.parse(s.textContent);
          return [j].flat().map((x) => x['@type']).join('+');
        } catch {
          return 'INVALID_JSON';
        }
      }),
      imagesMissingAlt: [...document.querySelectorAll('img:not([alt])')].map((i) => i.currentSrc || i.src),
      brokenImages: [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0 && i.loading !== 'lazy').map((i) => i.currentSrc || i.src),
      headingSkips: (() => {
        const levels = [...document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6')].map((h) => Number(h.tagName[1]));
        return levels.filter((l, i) => i > 0 && l > levels[i - 1] + 1).length;
      })(),
    }))
    .catch(() => ({ links: [] }));
  seen.set(path, { status, xRobots, ...info, consoleErrors, failed });
  for (const href of info.links ?? []) {
    if (!href || !href.startsWith('/') || href.startsWith('//')) continue;
    const clean = href.split('#')[0].split('?')[0];
    if (clean.startsWith('/_next') || /\.(png|jpe?g|svg|webp|ico|pdf|xml|txt)$/.test(clean)) continue;
    if (!seen.has(clean) && !queue.includes(clean)) queue.push(clean);
  }
  await page.close();
}
await browser.close();

const pages = [...seen.entries()].map(([path, v]) => ({ path, ...v }));
const summary = {
  base,
  crawledAt: new Date().toISOString(),
  pages: pages.length,
  non200: pages.filter((p) => p.status !== 200).map((p) => `${p.status} ${p.path}`),
  withConsoleErrors: pages.filter((p) => p.consoleErrors.length).map((p) => ({ path: p.path, errors: p.consoleErrors })),
  withFailedRequests: pages.filter((p) => p.failed.length).map((p) => ({ path: p.path, failed: p.failed })),
  deadLinks: pages.filter((p) => p.deadLinks).map((p) => `${p.path}: ${p.deadLinks}`),
  multipleH1: pages.filter((p) => (p.h1?.length ?? 0) !== 1).map((p) => `${p.path}: ${p.h1?.length}`),
  missingDescription: pages.filter((p) => p.status === 200 && !p.description).map((p) => p.path),
  duplicateDescriptions: Object.entries(
    pages.filter((p) => p.description).reduce((acc, p) => ((acc[p.description] = [...(acc[p.description] ?? []), p.path]), acc), {}),
  )
    .filter(([, v]) => v.length > 1)
    .map(([d, v]) => ({ description: d.slice(0, 80), paths: v })),
  nonSelfCanonical: pages.filter((p) => p.status === 200 && p.canonical && !p.canonical.endsWith(p.path)).map((p) => `${p.path} -> ${p.canonical}`),
  missingHreflang: pages.filter((p) => p.status === 200 && (p.hreflang?.length ?? 0) < 3).map((p) => p.path),
  noindex: pages.filter((p) => p.robots?.includes('noindex') || p.xRobots?.includes('noindex')).map((p) => p.path),
  jsonLdInvalid: pages.filter((p) => p.jsonLd?.includes('INVALID_JSON')).map((p) => p.path),
  imagesMissingAlt: pages.filter((p) => p.imagesMissingAlt?.length).map((p) => ({ path: p.path, images: p.imagesMissingAlt })),
  brokenImages: pages.filter((p) => p.brokenImages?.length).map((p) => ({ path: p.path, images: p.brokenImages })),
  headingSkips: pages.filter((p) => p.headingSkips).map((p) => `${p.path}: ${p.headingSkips}`),
  ogIncomplete: pages.filter((p) => p.status === 200 && Object.values(p.og ?? {}).some((v) => !v)).map((p) => p.path),
  duplicateTitles: Object.entries(
    pages.reduce((acc, p) => ((acc[p.title] = [...(acc[p.title] ?? []), p.path]), acc), {}),
  )
    .filter(([, v]) => v.length > 1)
    .map(([t, v]) => ({ title: t, paths: v })),
};
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ summary, pages }, null, 2));
console.log(JSON.stringify(summary, null, 2));
