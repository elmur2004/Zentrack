import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openByReference, signIn } from './helpers';

async function noHorizontalOverflow(page: Page) {
  const [scroll, width] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(scroll).toBeLessThanOrEqual(width);
}

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  if (serious.length) console.log(JSON.stringify(serious.map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) })), null, 2));
  expect(serious).toEqual([]);
}

test('A16 accessibility scan of key screens in both languages (no serious or critical issues)', async ({ page }) => {
  await signIn(page, 'owner');
  for (const locale of ['en', 'ar'] as const) {
    for (const path of ['', '/requests', '/queue', '/archive', '/team', '/settings', '/audit', '/account']) {
      await page.goto(`/${locale}/admin${path}`);
      await axe(page);
    }
    await openByReference(page, 'ZNT-2026-0042', locale);
    await axe(page);
    for (const tab of ['files', 'notes', 'communication', 'activity']) {
      await page.getByTestId(`tab-${tab}`).click();
      await axe(page);
    }
  }
  const anonContext = await page.context().browser()!.newContext();
  const anon = await anonContext.newPage();
  for (const locale of ['en', 'ar']) {
    await anon.goto(`/${locale}/admin/sign-in`);
    await axe(anon);
  }
  await anonContext.close();
});

test('A16 phone and tablet widths in both languages: no horizontal scrolling, working navigation', async ({ browser }) => {
  for (const width of [360, 390, 768]) {
    const context = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await signIn(page, 'owner', width === 390 ? 'ar' : 'en');
    const locale = width === 390 ? 'ar' : 'en';
    for (const path of ['', '/requests', '/team', '/settings', '/audit']) {
      await page.goto(`/${locale}/admin${path}`);
      await noHorizontalOverflow(page);
    }
    await openByReference(page, 'ZNT-2026-0042', locale);
    await noHorizontalOverflow(page);
    if (width < 1024) {
      const menu = page.locator('.adm-top__menu');
      await menu.click();
      await expect(page.locator('.adm-app')).toHaveAttribute('data-menu-open', 'true');
      await page.keyboard.press('Escape');
      await expect(page.locator('.adm-app')).toHaveAttribute('data-menu-open', 'false');
      await expect(menu).toBeFocused();
    }
    await context.close();
  }
});

test('A16 keyboard: tabs follow arrow keys, dialogs trap and restore focus, reduced motion is honoured', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await signIn(page, 'owner');
  await openByReference(page, 'ZNT-2026-0042');
  const first = page.getByTestId('tab-overview');
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('tab-files')).toBeFocused();
  await expect(page.getByTestId('tab-files')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(page.getByTestId('tab-activity')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(first).toBeFocused();
  // Dialog: opens with focus inside, Escape closes, focus returns to the opener.
  const archive = page.getByTestId('archive-button');
  await archive.focus();
  await page.keyboard.press('Enter');
  const dialog = page.locator('dialog[open]');
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(() => document.activeElement?.closest('dialog') !== null)).toBe(true);
  const duration = await dialog.evaluate((el) => getComputedStyle(el).animationDuration);
  expect(parseFloat(duration)).toBeLessThan(0.05);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(archive).toBeFocused();
  // In Arabic the arrow keys follow the reading direction.
  await page.getByTestId('admin-language-switch').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.getByTestId('tab-overview').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByTestId('tab-files')).toBeFocused();
  await context.close();
});

test('A17 honest states: no results, API failure, offline, rate limiting and long text', async ({ page, context }) => {
  await signIn(page, 'owner');
  await page.goto('/en/admin/requests');
  await page.getByTestId('inbox-search').fill('zz-no-such-request-zz');
  await expect(page.getByTestId('inbox-empty')).toContainText('No requests match these filters.');
  await page.getByTestId('inbox-empty').getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByTestId('inbox-table')).toBeVisible();

  await page.route('**/api/admin/requests', (route) => route.fulfill({ status: 500, body: '{}' }));
  await page.getByLabel('Sort by').selectOption('updated.desc');
  await expect(page.locator('.adm-content').getByRole('alert')).toContainText('Requests could not be loaded.');
  await page.unroute('**/api/admin/requests');
  await page.locator('.adm-content').getByRole('alert').getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('.adm-content').getByRole('alert')).toHaveCount(0);

  await context.setOffline(true);
  await page.getByLabel('Sort by').selectOption('received.asc');
  await expect(page.locator('.adm-content').getByRole('alert')).toContainText('You appear to be offline.');
  await context.setOffline(false);
  await page.locator('.adm-content').getByRole('alert').getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('.adm-content').getByRole('alert')).toHaveCount(0);

  // Long Arabic company/description wraps without breaking the layout.
  await page.getByTestId('inbox-search').fill('نص طويل');
  await page.getByTestId('request-link').first().click();
  await noHorizontalOverflow(page);
  await expect(page.getByTestId('description')).toBeVisible();

  // Sign-in rate limiting is explained, not hidden.
  const anon = await context.browser()!.newPage();
  await anon.route('**/api/auth/sign-in/email', (route) => route.fulfill({ status: 429, body: '{}', contentType: 'application/json' }));
  await anon.goto('/ar/admin/sign-in');
  await anon.locator('input[type=email]').fill('someone@example.invalid');
  await anon.locator('input[type=password]').fill('not-a-real-password');
  await anon.getByTestId('sign-in-submit').click();
  await expect(anon.getByTestId('sign-in-error')).toContainText('محاولات كثيرة');
  await anon.close();
});
