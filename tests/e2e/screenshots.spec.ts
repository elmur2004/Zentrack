import { test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

/**
 * Named QA screenshots (spec §17.4 naming). Public build only: no withheld project data and
 * no real submission details appear in evidence. Run: npx playwright test --project=screenshots
 */
const DIR = 'docs/screenshots';
mkdirSync(DIR, { recursive: true });

async function settle(page: Page, full: boolean) {
  await page.evaluate(() => document.fonts.ready);
  if (full) {
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
  }
  await page.waitForTimeout(1900);
}

const shots: Array<{ name: string; path: string; w: number; h: number; full?: boolean; reduced?: boolean; act?: (p: Page) => Promise<void> }> = [
  { name: 'home-en-1440', path: '/en', w: 1440, h: 900 },
  { name: 'home-ar-1440', path: '/ar', w: 1440, h: 900 },
  { name: 'home-en-390', path: '/en', w: 390, h: 844 },
  { name: 'home-ar-390', path: '/ar', w: 390, h: 844 },
  { name: 'home-ar-390-motion-reduced', path: '/ar', w: 390, h: 844, reduced: true },
  { name: 'home-en-1440-full', path: '/en', w: 1440, h: 900, full: true },
  { name: 'home-ar-1440-full', path: '/ar', w: 1440, h: 900, full: true },
  { name: 'home-ar-320', path: '/ar', w: 320, h: 720 },
  { name: 'home-en-1920', path: '/en', w: 1920, h: 1080 },
  { name: 'service-en-1440', path: '/en/services/coordination', w: 1440, h: 900, full: true },
  { name: 'service-ar-390', path: '/ar/services/shop-drawings', w: 390, h: 844, full: true },
  { name: 'services-ar-1440', path: '/ar/services', w: 1440, h: 900, full: true },
  { name: 'infrastructure-en-1440-water-selected', path: '/en/infrastructure', w: 1440, h: 900, act: async (p) => {
    await p.locator('.explorer [data-net-btn="water"]').first().click();
    await p.locator('.explorer').first().scrollIntoViewIfNeeded();
  } },
  { name: 'infrastructure-ar-390', path: '/ar/infrastructure', w: 390, h: 844, full: true },
  { name: 'how-we-work-ar-1440-track', path: '/ar/how-we-work', w: 1440, h: 900, act: async (p) => {
    await p.locator('#stage-drawings').scrollIntoViewIfNeeded();
    await p.mouse.wheel(0, 200);
  } },
  { name: 'about-ar-1440', path: '/ar/about', w: 1440, h: 900, full: true },
  { name: 'about-en-390', path: '/en/about', w: 390, h: 844, full: true },
  { name: 'clients-en-1440', path: '/en/clients', w: 1440, h: 900, full: true },
  { name: 'projects-en-1440-empty-state', path: '/en/projects', w: 1440, h: 900, full: true },
  { name: 'blog-ar-1440-empty-state', path: '/ar/blog', w: 1440, h: 900 },
  { name: 'menu-ar-360-open', path: '/ar', w: 360, h: 760, act: async (p) => {
    await p.locator('.menu-toggle').click();
  } },
  { name: 'menu-en-1440-services-open', path: '/en', w: 1440, h: 900, act: async (p) => {
    await p.locator('.site-nav').getByRole('button', { name: 'Services' }).click();
  } },
  { name: 'quote-ar-390-errors', path: '/ar/request-a-quote', w: 390, h: 844, act: async (p) => {
    await p.getByRole('button', { name: 'إرسال الطلب' }).click();
  } },
  { name: 'quote-en-1440-test-complete', path: '/en/request-a-quote', w: 1440, h: 900, act: async (p) => {
    await p.locator('#quote-name').fill('Test Person');
    await p.locator('#quote-company').fill('Fixture Co');
    await p.locator('#quote-email').fill('test@example.com');
    await p.locator('#quote-country').selectOption('EG');
    await p.locator('#quote-services-1').check();
    await p.locator('#quote-details').fill('Synthetic test enquiry for screenshot evidence only.');
    await p.locator('#quote-privacy').check();
    await p.getByRole('button', { name: 'Send Request' }).click();
    await p.locator('.form-result--test').waitFor();
  } },
  { name: 'quote-en-1440-upload-states', path: '/en/request-a-quote', w: 1440, h: 900, act: async (p) => {
    const input = p.locator('.file-picker__input');
    await input.setInputFiles({ name: 'model.rvt', mimeType: 'application/octet-stream', buffer: Buffer.from('x') });
    await input.setInputFiles({ name: 'plan.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\n') });
    await p.locator('.file-list__item--test').waitFor();
    await p.locator('.file-list').scrollIntoViewIfNeeded();
  } },
  { name: 'careers-en-390', path: '/en/careers', w: 390, h: 844, full: true },
  { name: 'partners-ar-1440', path: '/ar/partners', w: 1440, h: 900, full: true },
  { name: 'privacy-ar-1440', path: '/ar/privacy', w: 1440, h: 900, full: true },
  { name: 'notfound-ar-390', path: '/ar/no-such-page', w: 390, h: 844 },
];

for (const s of shots) {
  test(s.name, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, reducedMotion: s.reduced ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    await page.goto(s.path);
    await settle(page, !!s.full);
    if (s.act) {
      await s.act(page);
      await page.waitForTimeout(900);
    }
    await page.screenshot({ path: `${DIR}/${s.name}.png`, fullPage: !!s.full });
    await ctx.close();
  });
}
