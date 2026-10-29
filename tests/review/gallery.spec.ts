import { expect, test } from '@playwright/test';

/**
 * Private review build only (synthetic fixture record): case-study template + gallery dialog.
 * Run with the review server up:  npm run dev:review  then
 *   npx playwright test --config tests/review/playwright.review.config.ts
 */
const SLUG = 'synthetic-fixture-utilities-package';

for (const locale of ['en', 'ar'] as const) {
  test(`${locale}: gallery dialog keyboard, direction, Escape and focus restore`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${locale}/review/projects/${SLUG}`);
    await expect(page.locator('.record-banner')).toBeVisible();
    // facts: owner/developer and direct appointing party are separate rows
    await expect(page.locator('.facts dt')).toContainText([locale === 'ar' ? 'مالك المشروع / المطور' : 'Project owner / developer']);
    const thumbs = page.locator('.gallery__thumb');
    await expect(thumbs).toHaveCount(2); // first image is the hero, the rest form the gallery
    await thumbs.first().click();
    const dialog = page.locator('dialog.lightbox');
    await expect(dialog).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.classList.contains('menu-open'))).toBe(true);
    const pos = dialog.locator('.lightbox__pos');
    await expect(pos).toContainText(locale === 'ar' ? 'الصورة 1 من 2' : 'Image 1 of 2');
    // "next" follows reading direction: ArrowRight in LTR, ArrowLeft in RTL
    await page.keyboard.press(locale === 'ar' ? 'ArrowLeft' : 'ArrowRight');
    await expect(pos).toContainText(locale === 'ar' ? 'الصورة 2 من 2' : 'Image 2 of 2');
    await expect(dialog.getByRole('button', { name: locale === 'ar' ? 'الصورة التالية' : 'Next image' })).toBeDisabled();
    await page.keyboard.press('Home');
    await expect(pos).toContainText(locale === 'ar' ? 'الصورة 1 من 2' : 'Image 1 of 2');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(thumbs.first()).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.classList.contains('menu-open'))).toBe(false);
  });
}

test('approved-fixture screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/en/review/projects/${SLUG}`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'docs/screenshots/project-en-1440-review-fixture.png', fullPage: true });
});

test('filters on the review index: query params, count, zero state, clear', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/ar/review/projects');
  await page.locator('#filter-country').selectOption('RW');
  await expect(page).toHaveURL(/country=RW/);
  await expect(page.locator('.projects-browser__count')).toHaveText('مشروع واحد');
  await page.locator('#filter-service').selectOption('shop-drawings');
  await expect(page.locator('.projects-browser__count')).toHaveText('لا توجد مشروعات مطابقة');
  await page.getByRole('button', { name: 'مسح عوامل التصفية' }).first().click();
  await expect(page).toHaveURL(/\/ar\/review\/projects$/);
  await page.goBack();
  await expect(page).toHaveURL(/service=shop-drawings/);
});
