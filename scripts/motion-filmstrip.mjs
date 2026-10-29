/**
 * Deterministic motion filmstrips (before/after evidence for docs/animation-enhancements.md).
 *   node scripts/motion-filmstrip.mjs <baseUrl> <outDir>
 * CSS animations are paused with the Web Animations API and seeked to exact times, so frames are
 * comparable between builds (no timing jitter from screen recording). Also captures explorer and
 * Track states. Output: individual PNGs plus one contact sheet per sequence.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:3005';
const OUT = resolve(process.argv[3] ?? 'docs/qa/after/filmstrips');
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

async function seekAll(page, t) {
  await page.evaluate((ms) => {
    for (const a of document.getAnimations()) {
      a.pause();
      a.currentTime = ms;
    }
  }, t);
  await page.waitForTimeout(60);
}

async function sheet(name, files, cols, title) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const cells = files
    .map((f) => `<figure><img src="data:image/png;base64,${readFileSync(f.path).toString('base64')}"><figcaption>${f.label}</figcaption></figure>`)
    .join('');
  await page.setContent(`<!doctype html><html><head><style>
    body{margin:0;padding:20px;background:#f8f9fa;font:14px/1.4 system-ui,Segoe UI,sans-serif;color:#0b1624}
    h1{font-size:18px;margin:0 0 14px}
    .g{display:grid;grid-template-columns:repeat(${cols},1fr);gap:12px}
    figure{margin:0;background:#fff;border:1px solid #dfe3e8;border-radius:6px;padding:6px}
    img{display:block;width:100%;height:auto;border-radius:4px}
    figcaption{margin-top:6px;font-weight:600}
  </style></head><body><h1>${title}</h1><div class="g">${cells}</div></body></html>`);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
  await page.close();
}

// ---- Hero assembly (EN 1440 and AR 390) ----------------------------------------------
for (const [locale, width, height] of [['en', 1440, 900], ['ar', 390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/${locale}`, { waitUntil: 'networkidle' });
  const frames = [];
  for (const t of [0, 250, 500, 750, 1000, 1250, 1500, 1750, 2000]) {
    await seekAll(page, t);
    const path = join(OUT, `hero-${locale}-${width}-${String(t).padStart(4, '0')}.png`);
    await page.locator('.hero__visual').screenshot({ path });
    frames.push({ path, label: `${t} ms` });
  }
  await sheet(`hero-${locale}-${width}`, frames, width > 800 ? 5 : 9, `Hero assembly — /${locale} at ${width}px (CSS animations seeked)`);
  await ctx.close();
}

// ---- Explorer: first selection draw, switching, and re-selection ---------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/en/infrastructure`, { waitUntil: 'networkidle' });
  const explorer = page.locator('.explorer').first();
  await explorer.scrollIntoViewIfNeeded();
  const frames = [];
  const shot = async (label) => {
    const path = join(OUT, `explorer-${frames.length}.png`);
    await explorer.screenshot({ path });
    frames.push({ path, label });
  };
  await shot('Initial (all networks)');
  await page.locator('[data-net-btn="water"]').click();
  for (const t of [0, 150, 300, 600]) {
    await seekAll(page, t);
    await shot(`Water selected · ${t} ms`);
  }
  await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
  await page.locator('[data-net-btn="sewerage"]').click();
  await seekAll(page, 150);
  await shot('Sewerage selected · 150 ms');
  await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
  await page.locator('[data-net-btn="water"]').click();
  await seekAll(page, 150);
  await shot('Water re-selected · 150 ms');
  await sheet('explorer-en-1440', frames, 4, 'Infrastructure explorer — /en/infrastructure at 1440px');
  await ctx.close();
}

// ---- Arabic explorer label + reduced-motion end states --------------------------------
{
  const frames = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/ar/infrastructure`, { waitUntil: 'networkidle' });
  const explorer = page.locator('.explorer').first();
  await explorer.scrollIntoViewIfNeeded();
  for (const id of ['sewerage', 'lv-mv']) {
    await page.locator(`[data-net-btn="${id}"]`).click();
    await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
    await page.waitForTimeout(120);
    const path = join(OUT, `explorer-ar-${id}.png`);
    await explorer.screenshot({ path });
    frames.push({ path, label: `/ar explorer · ${id} selected` });
  }
  await ctx.close();

  const reduced = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const rp = await reduced.newPage();
  await rp.goto(`${BASE}/en`, { waitUntil: 'networkidle' });
  const heroPath = join(OUT, 'hero-en-1440-reduced-motion.png');
  await rp.locator('.hero__visual').screenshot({ path: heroPath });
  frames.push({ path: heroPath, label: 'Hero, prefers-reduced-motion: final state at load' });
  await reduced.close();
  await sheet('explorer-ar-and-reduced', frames, 3, 'Arabic explorer labels and reduced-motion hero');
}

// ---- Track: each stage while scrolling (and back) -------------------------------------
for (const locale of ['en', 'ar']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/${locale}/how-we-work`, { waitUntil: 'networkidle' });
  const frames = [];
  const stages = page.locator('.track__stage');
  const n = await stages.count();
  for (let i = 0; i < n; i += 1) {
    await stages.nth(i).evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.45));
    await page.waitForTimeout(700);
    await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
    const path = join(OUT, `track-${locale}-${i + 1}.png`);
    await page.screenshot({ path });
    frames.push({ path, label: `Stage ${i + 1}` });
  }
  await sheet(`track-${locale}-1440`, frames, 3, `Zentrac Track — /${locale}/how-we-work at 1440px (scrolling forward)`);
  await ctx.close();
}

await browser.close();
console.log(`✓ filmstrips in ${OUT}`);
