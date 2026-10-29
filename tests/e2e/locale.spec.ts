import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 } });

test('L02 switching on a service detail keeps the same service', async ({ page }) => {
  await page.goto('/en/services/coordination');
  await page.locator('.site-header__lang').click();
  await expect(page).toHaveURL(/\/ar\/services\/coordination$/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('h1')).toHaveText('التنسيق بين التخصصات');
  await page.locator('.site-header__lang').click();
  await expect(page).toHaveURL(/\/en\/services\/coordination$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('L06 back/forward after switching keeps the right direction', async ({ page }) => {
  await page.goto('/en/about');
  await page.locator('.site-header__lang').click();
  await expect(page).toHaveURL(/\/ar\/about$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/en\/about$/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await page.goForward();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

test('section anchor and stable-ID query survive the switch', async ({ page }) => {
  await page.goto('/en/request-a-quote?service=shop-drawings&scope=coordination');
  await expect(page.locator('#quote-services-2')).toBeChecked();
  await expect(page.locator('input[type=radio][value=coordination]')).toBeChecked();
  await page.locator('.site-header__lang').click();
  await expect(page).toHaveURL(/\/ar\/request-a-quote\?service=shop-drawings&scope=coordination$/);
  await expect(page.locator('#quote-services-2')).toBeChecked();

  await page.goto('/en/how-we-work#engagement');
  await page.locator('.site-header__lang').click();
  await expect(page).toHaveURL(/\/ar\/how-we-work#engagement$/);
});

test('L05 a form draft survives a language switch (text only, nothing persisted)', async ({ page }) => {
  await page.goto('/en/request-a-quote');
  await page.locator('#quote-name').fill('Lina Haddad');
  await page.locator('#quote-details').fill('مخططات تنسيق خدمات لحزمة طرق ومرافق في المرحلة الثانية.');
  await page.locator('.site-header__lang').click();
  await expect(page).toHaveURL(/\/ar\/request-a-quote$/);
  await expect(page.locator('#quote-name')).toHaveValue('Lina Haddad');
  await expect(page.locator('#quote-details')).toHaveValue(/مخططات تنسيق خدمات/);
  // never stored in browser storage or the URL
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
  expect(stored).not.toContain('Lina');
  expect(page.url()).not.toContain('Lina');
});

test('L05 selected files trigger a localized warning before switching', async ({ page }) => {
  await page.goto('/en/request-a-quote');
  await page.locator('.file-picker__input').setInputFiles({ name: 'plan.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\n%test\n') });
  await expect(page.locator('.file-list__item')).toHaveCount(1);
  let message = '';
  page.once('dialog', async (d) => {
    message = d.message();
    await d.dismiss();
  });
  await page.locator('.site-header__lang').click();
  expect(message).toContain('Selected files cannot be carried over');
  await expect(page).toHaveURL(/\/en\/request-a-quote$/); // cancelled: stayed on the page
});
