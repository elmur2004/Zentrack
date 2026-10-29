// Audit helper: element and RSC payload weight per page section (docs/performance-before-after.md).
// Usage: node scripts/dom-weight.mjs http://localhost:3005 /en /ar
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://localhost:3005';
const paths = process.argv.slice(3);
const browser = await chromium.launch();
for (const p of paths.length ? paths : ['/en', '/ar', '/en/request-a-quote', '/en/services/coordination']) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(base + p, { waitUntil: 'networkidle' });
  const info = await page.evaluate(() => {
    const all = document.querySelectorAll('*').length;
    const svgEls = document.querySelectorAll('svg, svg *').length;
    const sections = [...document.querySelectorAll('main > *')].map((s) => ({
      id: (s.id || s.className || s.tagName).toString().slice(0, 40),
      els: s.querySelectorAll('*').length,
      svg: s.querySelectorAll('svg *').length,
    }));
    const header = document.querySelector('header')?.querySelectorAll('*').length;
    const footer = document.querySelector('footer')?.querySelectorAll('*').length;
    const flight = [...document.scripts].filter((s) => s.textContent.includes('__next_f')).reduce((n, s) => n + s.textContent.length, 0);
    const html = document.documentElement.outerHTML.length;
    return { all, svgEls, header, footer, flight, html, sections };
  });
  console.log(p, JSON.stringify(info));
  await page.close();
}
await browser.close();
