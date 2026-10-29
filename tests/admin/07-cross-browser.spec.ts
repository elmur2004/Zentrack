import { expect, test } from '@playwright/test';
import { openByReference, signIn } from './helpers';

// Read-only journeys for Firefox and WebKit (they run before the Chromium suite changes data).

test('cross-browser: sign-in, filtered inbox, request tabs and language switch', async ({ page }) => {
  await signIn(page, 'owner');
  await page.goto('/en/admin/requests?status=new');
  await expect(page.getByTestId('inbox-table').locator('tbody tr').first()).toBeVisible();
  await openByReference(page, 'ZNT-2026-0042');
  await page.getByTestId('tab-files').click();
  await expect(page.getByTestId('files')).toContainText('مخطط-التنسيق-01.pdf');
  await page.getByTestId('admin-language-switch').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page).toHaveURL(/\/ar\/admin\/requests\/[0-9a-f-]+\?tab=files/);
  await expect(page.getByTestId('tab-files')).toHaveAttribute('aria-selected', 'true');
  const [scroll, width] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(scroll).toBeLessThanOrEqual(width);
});

test('cross-browser: phone width in Arabic with the navigation drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, 'owner', 'ar');
  await page.goto('/ar/admin/requests');
  await expect(page.getByTestId('inbox-table')).toBeVisible();
  const [scroll, width] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(scroll).toBeLessThanOrEqual(width);
  await page.locator('.adm-top__menu').click();
  await expect(page.locator('.adm-app')).toHaveAttribute('data-menu-open', 'true');
  await page.locator('.adm-nav__link', { hasText: 'قائمة مهامي' }).click();
  await expect(page).toHaveURL(/\/ar\/admin\/queue/);
  await expect(page.locator('.adm-app')).toHaveAttribute('data-menu-open', 'false');
});
