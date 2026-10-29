// Captures named screenshots for visual QA.
// Usage: node scripts/screenshots.mjs <outDir> <baseUrl> <spec...>
//   spec = name|path|width[|height][|reduced][|full][|action]
// Example: node scripts/screenshots.mjs docs/screenshots http://localhost:3000 "home-en-1440|/en|1440|900||full"
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [outDir, base, ...specs] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
for (const spec of specs) {
  const [name, path, w, h, reduced, full, action] = spec.split('|');
  const context = await browser.newContext({
    viewport: { width: Number(w), height: Number(h || 900) },
    reducedMotion: reduced === 'reduced' ? 'reduce' : 'no-preference',
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (action === 'menu') {
    await page.getByRole('button', { name: /menu|القائمة/i }).first().click();
    await page.waitForTimeout(400);
  } else if (action?.startsWith('scroll:')) {
    await page.evaluate((y) => window.scrollTo(0, Number(y)), action.slice(7));
    await page.waitForTimeout(700);
  } else if (action?.startsWith('click:')) {
    await page.locator(action.slice(6)).first().click();
    await page.waitForTimeout(800);
  }
  if (full === 'full') {
    // reveal everything so full-page captures are not blank below the fold
    await page.evaluate(async () => {
      // slow enough for every reveal observer to see each element (fast jumps leave items armed)
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(800);
  } else {
    await page.waitForTimeout(1900);
  }
  await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: full === 'full' });
  console.log('saved', name);
  await context.close();
}
await browser.close();
