// Applied-throttling lab measurement (not field data): real Chrome, 4× CPU slowdown and a
// slow-4G-like network, reading the browser's own paint / LCP / layout-shift / long-task entries.
// Usage: node scripts/measure-vitals.mjs http://localhost:3005 /en /ar
import { chromium } from '@playwright/test';

const [base, ...paths] = process.argv.slice(2);
const runs = 3;
const browser = await chromium.launch();
const rows = [];
for (const path of paths) {
  const samples = [];
  for (let i = 0; i < runs; i++) {
    const context = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.addInitScript(() => {
      window.__v = { lcp: 0, cls: 0, longTasks: 0, tbt: 0 };
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__v.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__v.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__v.longTasks++; window.__v.tbt += Math.max(0, e.duration - 50); } }).observe({ type: 'longtask', buffered: true });
    });
    await page.goto(base + path, { waitUntil: 'load' });
    await page.waitForTimeout(4000);
    const v = await page.evaluate(() => ({
      ...window.__v,
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0,
      ttfb: performance.getEntriesByType('navigation')[0]?.responseStart ?? 0,
    }));
    samples.push(v);
    await context.close();
  }
  const med = (k) => samples.map((s) => s[k]).sort((a, b) => a - b)[Math.floor(runs / 2)];
  const row = { page: path, runs, TTFB: Math.round(med('ttfb')), FCP: Math.round(med('fcp')), LCP: Math.round(med('lcp')), CLS: Number(med('cls').toFixed(3)), longTasks: med('longTasks'), TBTapprox: Math.round(med('tbt')) };
  rows.push(row);
  console.log(JSON.stringify(row));
}
await browser.close();
