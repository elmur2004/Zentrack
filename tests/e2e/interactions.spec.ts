import { expect, test } from '@playwright/test';

test.describe('mobile menu (M11, L14)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const locale of ['en', 'ar']) {
    test(`${locale}: opens as a modal, Escape closes and focus returns`, async ({ page }) => {
      await page.goto(`/${locale}/services`);
      const toggle = page.locator('.menu-toggle');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await toggle.click();
      const dialog = page.locator('#mobile-menu');
      await expect(dialog).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(await page.evaluate(() => document.getElementById('mobile-menu')!.contains(document.activeElement))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.classList.contains('menu-open'))).toBe(true);
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(toggle).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.classList.contains('menu-open'))).toBe(false);
    });
  }

  test('route selection closes the drawer', async ({ page }) => {
    await page.goto('/en');
    await page.locator('.menu-toggle').click();
    await page.locator('#mobile-menu').getByRole('link', { name: 'How We Work' }).click();
    await expect(page).toHaveURL(/\/en\/how-we-work$/);
    await expect(page.locator('#mobile-menu')).toBeHidden();
  });

  test('320px header has no collisions or clipped language control', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/ar');
    const brand = await page.locator('.site-header__brand').boundingBox();
    const actions = await page.locator('.site-header__actions').boundingBox();
    expect(brand && actions).toBeTruthy();
    // RTL: brand on the right, actions on the left, no overlap
    expect(actions!.x + actions!.width).toBeLessThanOrEqual(brand!.x + 1);
    await expect(page.locator('.site-header__lang')).toBeVisible();
  });
});

test.describe('desktop navigation and widgets', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('services disclosure works by keyboard', async ({ page }) => {
    await page.goto('/en');
    const btn = page.locator('.site-nav').getByRole('button', { name: 'Services' });
    await btn.focus();
    await page.keyboard.press('Enter');
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.services-panel')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.services-panel')).toBeHidden();
    await expect(btn).toBeFocused();
  });

  test('M07 infrastructure explorer selection, description and Show all', async ({ page }) => {
    await page.goto('/ar/infrastructure');
    const explorer = page.locator('.explorer').first();
    const water = explorer.locator('[data-net-btn="water"]');
    await water.click();
    await expect(water).toHaveAttribute('aria-pressed', 'true');
    await expect(explorer.locator('.explorer__detail')).toContainText('المياه');
    await expect(explorer.locator('.schematic')).toHaveAttribute('data-selected', 'water');
    await explorer.getByRole('button', { name: 'عرض الكل' }).click();
    await expect(explorer.locator('.schematic')).toHaveAttribute('data-selected', 'all');
    // all eleven descriptions are readable without the diagram
    await expect(page.locator('.category-card')).toHaveCount(11);
  });

  test('M08 Track progresses with scroll and stations are real anchors', async ({ page }) => {
    await page.goto('/en/how-we-work');
    await expect(page.locator('.track__station[data-active]')).toContainText('01');
    await page.locator('#stage-site-support').scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 500);
    await expect(page.locator('.track__station[data-active]')).toContainText('06', { timeout: 5000 });
    // ScrollTrigger loads on demand and scrubs (0.5 s), so poll the bar until it settles
    await expect
      .poll(() => page.locator('.track__progress').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a), { timeout: 5000 })
      .toBeGreaterThan(0.85);
    await page.locator('.track__station').filter({ hasText: 'Coordinate' }).click();
    await expect(page).toHaveURL(/#stage-coordinate$/);
  });

  test('L12/L13 logo and drawings are never mirrored; breadcrumb arrows follow reading direction', async ({ page }) => {
    await page.goto('/ar/services/coordination');
    const logoTransform = await page.locator('.site-header__brand img').evaluate((el) => getComputedStyle(el).transform);
    expect(logoTransform).toBe('none');
    const svgTransform = await page.locator('.hero-illus svg').evaluate((el) => getComputedStyle(el).transform);
    expect(svgTransform).toBe('none');
    const crumb = await page.locator('.breadcrumbs__sep').first().evaluate((el) => getComputedStyle(el).transform);
    expect(crumb).toMatch(/^matrix\(-1/);
  });

  test('L08 technical tokens keep their order in Arabic', async ({ page }) => {
    await page.goto('/ar');
    const ref = page.locator('.register__ref').first();
    await expect(ref).toHaveText('RFI-024');
    await expect(ref).toHaveAttribute('dir', 'ltr');
  });
});

test.describe('reduced motion and no-JS fallbacks', () => {
  test('reduced motion: content visible immediately, Track static and vertical', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('/en');
    expect(await page.locator('.hero__title').evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    expect(await page.locator('.hs-sheet').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    await page.mouse.wheel(0, 3000);
    await expect(page.locator('[data-reveal-state="armed"]')).toHaveCount(0);
    await expect(page.locator('.track__visual').first()).toBeHidden();
    await expect(page.locator('.track__stage')).toHaveCount(6);
    await ctx.close();
  });

  test('L20 without JavaScript the copy, links and process remain usable', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('/ar/how-we-work');
    await expect(page.locator('h1')).toHaveText('كيف نعمل');
    for (const stage of ['review', 'model', 'coordinate', 'drawings', 'quantities', 'site-support'])
      await expect(page.locator(`#stage-${stage}`)).toBeVisible();
    await page.goto('/en/infrastructure');
    await expect(page.locator('.category-card')).toHaveCount(11);
    await page.goto('/en');
    await expect(page.locator('.hero__title')).toBeVisible();
    await page.locator('.hero__ctas a').first().click();
    await expect(page).toHaveURL(/\/en\/request-a-quote$/);
    await expect(page.locator('noscript')).toHaveCount(1);
    await ctx.close();
  });
});

test('M04 header becomes opaque after scrolling, without changing height', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/en');
  const header = page.locator('.site-header');
  const h0 = (await header.boundingBox())!.height;
  await expect(header).not.toHaveAttribute('data-solid', /.*/);
  await page.mouse.wheel(0, 600);
  await expect(header).toHaveAttribute('data-solid', 'true');
  expect((await header.boundingBox())!.height).toBe(h0);
});
