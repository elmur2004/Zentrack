// Measures first-view transfer (compressed bytes) per resource type with a real browser.
// Usage: node scripts/measure-transfer.mjs http://localhost:3005 /en /ar
import { chromium } from '@playwright/test';

const [base, ...paths] = process.argv.slice(2);
const browser = await chromium.launch();
for (const path of paths) {
  for (const vp of [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1440, height: 900 },
  ]) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    const client = await context.newCDPSession(page);
    await client.send('Network.enable');
    const types = new Map();
    const sizes = new Map();
    client.on('Network.responseReceived', (e) => types.set(e.requestId, e.type));
    client.on('Network.loadingFinished', (e) => sizes.set(e.requestId, e.encodedDataLength));
    const urls = new Map();
    client.on('Network.requestWillBeSent', (e) => urls.set(e.requestId, e.request.url));
    const html = await (await page.request.get(base + path)).text();
    const initialScripts = new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]));
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const totals = {};
    let initialJs = 0;
    let prefetchJs = 0;
    for (const [id, bytes] of sizes) {
      const t = types.get(id) ?? 'Other';
      totals[t] = (totals[t] ?? 0) + bytes;
      if (t === 'Script') {
        const u = new URL(urls.get(id) ?? '', base).pathname;
        if (initialScripts.has(u)) initialJs += bytes;
        else prefetchJs += bytes;
      }
    }
    const all = Object.values(totals).reduce((a, b) => a + b, 0);
    const kib = (n) => `${(n / 1024).toFixed(1)} KiB`;
    console.log(
      `${path} [${vp.name}] total ${kib(all)} — ` +
        Object.entries(totals).map(([k, v]) => `${k} ${kib(v)}`).join(', ') +
        ` | initial JS (scripts in HTML) ${kib(initialJs)}, later/prefetched JS ${kib(prefetchJs)}`,
    );
    await context.close();
  }
}
await browser.close();
