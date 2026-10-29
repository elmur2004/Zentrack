// Records short videos of the signature motion (hero, explorer, Track) for before/after evidence.
// Usage: node scripts/record-motion.mjs http://localhost:3000 docs/qa/before/videos
import { chromium } from '@playwright/test';
import { mkdirSync, renameSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const [base = 'http://localhost:3000', outDir = 'docs/qa/videos'] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const tmp = join(outDir, '_tmp');

const scenarios = [
  {
    name: 'hero-en-1440',
    viewport: { width: 1440, height: 900 },
    run: async (page) => {
      await page.goto(base + '/en');
      await page.waitForTimeout(2600);
      await page.mouse.move(1100, 400);
      await page.mouse.move(1250, 520, { steps: 20 });
      await page.waitForTimeout(900);
    },
  },
  {
    name: 'hero-ar-390',
    viewport: { width: 390, height: 844 },
    run: async (page) => {
      await page.goto(base + '/ar');
      await page.waitForTimeout(2600);
    },
  },
  {
    name: 'explorer-en-1440',
    viewport: { width: 1440, height: 900 },
    run: async (page) => {
      await page.goto(base + '/en/infrastructure');
      await page.locator('.explorer').first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      for (const id of ['water', 'sewerage', 'stormwater', 'lv-mv', 'roads', 'canals']) {
        await page.locator(`[data-net-btn="${id}"]`).first().click();
        await page.waitForTimeout(700);
      }
      // rapid repeated selection
      for (const id of ['irrigation', 'firefighting', 'street-lighting', 'cctv-telecom']) {
        await page.locator(`[data-net-btn="${id}"]`).first().click();
        await page.waitForTimeout(120);
      }
      await page.waitForTimeout(900);
    },
  },
  {
    name: 'track-ar-1440',
    viewport: { width: 1440, height: 900 },
    run: async (page) => {
      await page.goto(base + '/ar/how-we-work');
      await page.waitForTimeout(800);
      for (let i = 0; i < 16; i++) {
        await page.mouse.wheel(0, 260);
        await page.waitForTimeout(220);
      }
      for (let i = 0; i < 6; i++) {
        await page.mouse.wheel(0, -320);
        await page.waitForTimeout(220);
      }
      await page.waitForTimeout(600);
    },
  },
];

const browser = await chromium.launch();
for (const s of scenarios) {
  rmSync(tmp, { recursive: true, force: true });
  const context = await browser.newContext({ viewport: s.viewport, recordVideo: { dir: tmp, size: s.viewport.width > 800 ? { width: 1280, height: 800 } : s.viewport } });
  const page = await context.newPage();
  await s.run(page);
  await context.close();
  const file = readdirSync(tmp).find((f) => f.endsWith('.webm'));
  if (file) renameSync(join(tmp, file), join(outDir, `${s.name}.webm`));
  console.log('recorded', s.name);
}
rmSync(tmp, { recursive: true, force: true });
await browser.close();
