import { expect, test } from '@playwright/test';

/** Smoke coverage in Firefox, WebKit (desktop Safari) and iPhone 13 emulation. Emulation ≠ real devices. */
for (const locale of ['en', 'ar']) {
  test(`${locale}: home renders with correct direction, no overflow`, async ({ page }) => {
    const res = await page.goto(`/${locale}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(page.locator('h1')).toHaveCount(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test('language switch keeps the page', async ({ page }) => {
  await page.goto('/en/services/design-review');
  const sw = page.locator('[data-testid="language-switch"]:visible').first();
  if (await sw.count()) {
    await sw.click();
  } else {
    await page.locator('.menu-toggle').click();
    await page.locator('#mobile-menu [data-testid="language-switch"]').click();
  }
  await expect(page).toHaveURL(/\/ar\/services\/design-review$/);
  await expect(page.locator('h1')).toHaveText('مراجعة التصميم');
});

test('quote form test mode end to end', async ({ page }) => {
  await page.goto('/ar/request-a-quote');
  await expect(page.locator('.form-mode')).toBeVisible();
  // Type only once React controls the inputs (slow mobile engines can hydrate after "load").
  await expect(page.locator('form[data-hydrated]')).toHaveCount(1);
  await page.locator('#quote-name').fill('اختبار');
  await page.locator('#quote-company').fill('شركة اختبار');
  await page.locator('#quote-email').fill('test@example.com');
  await page.locator('#quote-country').selectOption('SA');
  await page.locator('#quote-services-0').check();
  await page.locator('#quote-details').fill('نبذة غير سرية عن حزمة نمذجة لشبكات المرافق في المرحلة الأولى.');
  await page.locator('#quote-privacy').check();
  await page.getByRole('button', { name: 'إرسال الطلب' }).click();
  await expect(page.locator('.form-result--test')).toContainText('TEST-');
});
