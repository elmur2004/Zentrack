import { expect, test, type Page } from '@playwright/test';

/**
 * 03 §14 essential journeys, each run in English and Arabic against the production build
 * (preview form mode: receipts are clearly labelled test receipts). The live path — a public
 * quote creating exactly one stored, authorized dashboard record — is verified by
 * tests/admin/01-intake.spec.ts. Portfolio filters and the gallery run against the private
 * review build (tests/review/gallery.spec.ts) because no project record is publicly approved.
 */
const L = {
  en: {
    dir: 'ltr',
    send: 'Send Request',
    receipt: 'Test completed; no request was sent. Test reference: TEST-',
    offline: 'You appear to be offline. Your details are still here',
    notFound: 'Page not found',
    projectsEmpty: 'Project details are being prepared for publication.',
    serviceH1: 'Coordination',
  },
  ar: {
    dir: 'rtl',
    send: 'إرسال الطلب',
    receipt: 'اكتمل الاختبار؛ لم يُرسل أي طلب',
    offline: 'يبدو أنك غير متصل بالإنترنت. بياناتك ما زالت محفوظة',
    notFound: 'الصفحة غير موجودة',
    projectsEmpty: null as string | null,
    serviceH1: 'التنسيق بين التخصصات',
  },
} as const;
const other = (l: 'en' | 'ar') => (l === 'en' ? 'ar' : 'en');

async function fillQuote(page: Page, details: string) {
  await page.locator('#quote-name').fill('شركة الاختبار — BIM Experts');
  await page.locator('#quote-company').fill('Test Engineering Co.');
  await page.locator('#quote-email').fill('test@example.invalid');
  await page.locator('#quote-country').selectOption('EG');
  await page.locator('#quote-details').fill(details);
  await page.locator('#quote-privacy').check();
}

for (const locale of ['en', 'ar'] as const) {
  const t = L[locale];

  test.describe(`${locale} journeys`, () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test(`J1 ${locale}: home → services → service → preselected quote → invalid → corrected → test receipt`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await page.locator(`main a[href="/${locale}/services"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/services$`));
      await page.locator(`main a[href="/${locale}/services/coordination"]`).first().click();
      await expect(page.locator('h1')).toHaveText(t.serviceH1);
      await page.locator(`main a[href="/${locale}/request-a-quote?service=coordination"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/request-a-quote\\?service=coordination$`));
      await expect(page.locator('input[type=checkbox][value="coordination"]')).toBeChecked();
      await page.getByRole('button', { name: t.send }).click();
      await expect(page.locator('.error-summary')).toBeFocused();
      await fillQuote(page, 'Non-confidential overview: utility coordination for one road package (ZNT-2026-0042 test).');
      await page.getByRole('button', { name: t.send }).click();
      await expect(page.locator('.form-result--test')).toContainText(t.receipt);
      await expect(page.locator('.form-result--test')).toBeFocused();
    });

    test(`J2 ${locale}: direct nested URL → switch language → reload → back/forward keep route, language and direction`, async ({ page }) => {
      const o = other(locale);
      await page.goto(`/${locale}/services/shop-drawings`);
      await page.locator('.site-header__lang').click();
      await expect(page).toHaveURL(new RegExp(`/${o}/services/shop-drawings$`));
      await expect(page.locator('html')).toHaveAttribute('dir', L[o].dir);
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('lang', o);
      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`/${locale}/services/shop-drawings$`));
      await expect(page.locator('html')).toHaveAttribute('dir', t.dir);
      await page.goForward();
      await expect(page).toHaveURL(new RegExp(`/${o}/services/shop-drawings$`));
      await expect(page.locator('html')).toHaveAttribute('lang', o);
    });

    test(`J4 ${locale}: rapid explorer selection, keyboard, resize and locale change keep a single coherent state`, async ({ page }) => {
      await page.goto(`/${locale}/infrastructure`);
      const explorer = page.locator('.explorer').first();
      for (const id of ['water', 'sewerage', 'roads', 'canals', 'lv-mv']) await explorer.locator(`[data-net-btn="${id}"]`).click();
      await expect(explorer.locator('[data-net-btn="lv-mv"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(explorer.locator('[aria-pressed="true"]')).toHaveCount(1);
      await expect(explorer.locator('.schematic')).toHaveAttribute('data-selected', 'lv-mv');
      await expect(explorer.locator('g.is-selected')).toHaveCount(1);
      await expect(explorer.locator('[data-explorer-tag]')).toBeVisible();
      await expect(explorer.locator('[data-explorer-tag]')).toContainText('06');
      // keyboard: Enter and Space both select
      await explorer.locator('[data-net-btn="water"]').focus();
      await page.keyboard.press('Enter');
      await expect(explorer.locator('[data-net-btn="water"]')).toHaveAttribute('aria-pressed', 'true');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Space');
      await expect(explorer.locator('[aria-pressed="true"]')).toHaveCount(1);
      await expect(explorer.locator('[data-net-btn="water"]')).toHaveAttribute('aria-pressed', 'false');
      // resize to a phone: state kept, no horizontal scrolling, diagram never mirrored
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(explorer.locator('[aria-pressed="true"]')).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      expect(await explorer.locator('.schematic').evaluate((el) => getComputedStyle(el).transform)).toBe('none');
      // locale change: the other language starts from the overview, with its own labels
      await page.locator('.menu-toggle').click();
      await page.locator('.mobile-menu[open] .mobile-menu__lang').click();
      await expect(page).toHaveURL(new RegExp(`/${other(locale)}/infrastructure$`));
      await expect(page.locator('.explorer').first().locator('.schematic')).toHaveAttribute('data-selected', 'all');
    });

    test(`J5 ${locale}: Track forward and back, anchor entry, then reduced motion keep every stage readable`, async ({ page }) => {
      await page.goto(`/${locale}/how-we-work`);
      const stages = page.locator('.track__stage');
      const count = await stages.count();
      expect(count).toBe(6);
      const activeIndex = () => page.locator('.track__station[data-active="true"]').getAttribute('data-index');
      for (const i of [1, 4]) {
        await stages.nth(i).evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.45));
        await expect.poll(activeIndex).toBe(String(i));
      }
      await stages.nth(2).evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.45));
      await expect.poll(activeIndex).toBe('2'); // backwards
      await page.goto(`/${locale}/how-we-work#stage-quantities`);
      const target = page.locator('#stage-quantities');
      await expect(target).toBeInViewport();
      const header = await page.locator('.site-header').boundingBox();
      expect((await target.boundingBox())!.y).toBeGreaterThanOrEqual(header!.y + header!.height - 1); // not under the sticky header
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (let i = 0; i < count; i++) {
        await expect(stages.nth(i).locator('h3, h2').first()).toBeVisible();
        // a fade already in flight may finish (opacity changes are allowed under reduced motion); nothing stays dimmed
        await expect.poll(() => stages.nth(i).evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
      }
    });

    test(`J6 ${locale}: public portfolio is withheld honestly; locale switch; withheld record is a 404`, async ({ page }) => {
      await page.goto(`/${locale}/projects`);
      await expect(page.locator('.project-card')).toHaveCount(0); // no record is publicly approved
      await expect(page.locator('.empty-panel').first()).toBeVisible();
      if (t.projectsEmpty) await expect(page.getByText(t.projectsEmpty)).toBeVisible();
      await page.locator('.site-header__lang').click();
      await expect(page).toHaveURL(new RegExp(`/${other(locale)}/projects$`));
      const res = await page.goto(`/${locale}/projects/sedra`);
      expect(res?.status()).toBe(404);
    });

    test(`J7 ${locale}: unknown and withheld URLs are real localized 404s with working recovery links`, async ({ page }) => {
      for (const path of ['no-such-page', 'projects/amaala-staff-village-zone-4', 'services/survey']) {
        const res = await page.goto(`/${locale}/${path}`);
        expect(res?.status(), path).toBe(404);
        await expect(page.locator('h1')).toHaveText(t.notFound);
        await expect(page.locator('html')).toHaveAttribute('dir', t.dir);
      }
      await page.locator(`.status-page__links a[href="/${locale}/services"]`).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/services$`));
      await expect(page.locator('h1')).toHaveCount(1);
    });

    test(`J8 ${locale}: a started form survives a language switch; selected files get an honest warning`, async ({ page }) => {
      const o = other(locale);
      await page.goto(`/${locale}/request-a-quote`);
      await page.locator('#quote-name').fill('شركة الاختبار — BIM Experts');
      await page.locator('#quote-details').fill('LV / MV crossing at Phase 1B, RFI-024 (test fixture).');
      await page.locator('.site-header__lang').click();
      await expect(page).toHaveURL(new RegExp(`/${o}/request-a-quote$`));
      await expect(page.locator('#quote-name')).toHaveValue('شركة الاختبار — BIM Experts');
      await expect(page.locator('#quote-details')).toHaveValue('LV / MV crossing at Phase 1B, RFI-024 (test fixture).');
      await page.locator('.file-picker__input').setInputFiles({ name: 'مخطط-التنسيق-01.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\n%test\n') });
      await expect(page.locator('.file-list__item')).toHaveCount(1);
      let warning = '';
      page.once('dialog', async (d) => {
        warning = d.message();
        await d.dismiss();
      });
      await page.locator('.site-header__lang').click();
      expect(warning.length).toBeGreaterThan(10);
      await expect(page).toHaveURL(new RegExp(`/${o}/request-a-quote$`)); // cancelled: stayed, nothing lost
      await expect(page.locator('.file-list__item')).toHaveCount(1);
    });

    test(`J9 ${locale}: offline submission keeps the text; retry sends exactly one request`, async ({ page, context }) => {
      await page.goto(`/${locale}/request-a-quote`);
      await fillQuote(page, 'Stormwater and sewer crossing review for one package (offline retry test).');
      await page.locator('input[type=checkbox][value="coordination"]').check();
      let accepted = 0;
      page.on('response', (r) => r.url().endsWith('/api/enquiries') && r.status() < 300 && (accepted += 1));
      await context.setOffline(true);
      await page.getByRole('button', { name: t.send }).click();
      await expect(page.locator('.form__status')).toContainText(t.offline);
      await expect(page.locator('#quote-details')).toHaveValue(/offline retry test/);
      await context.setOffline(false);
      await page.getByRole('button', { name: t.send }).click();
      await expect(page.locator('.form-result--test')).toContainText(t.receipt);
      expect(accepted).toBe(1);
    });
  });

  test(`J3 ${locale}: mobile menu by keyboard and touch; focus and page scrolling come back`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(`/${locale}`);
    const toggle = page.locator('.menu-toggle');
    await toggle.focus();
    await page.keyboard.press('Enter');
    const menu = page.locator('.mobile-menu[open]');
    await expect(menu).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/menu-open/); // page behind does not scroll
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      // the page behind is inert: focus is in the drawer (or briefly in the browser UI, reported as <body>)
      const where = await page.evaluate(() => (document.activeElement?.closest('.mobile-menu') ? 'drawer' : document.activeElement?.tagName));
      expect(['drawer', 'BODY']).toContain(where);
    }
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(toggle).toBeFocused();
    await expect(page.locator('html')).not.toHaveClass(/menu-open/);
    // touch: open, follow a link; the drawer closes on the new page
    await toggle.tap();
    await page.locator(`.mobile-menu[open] a[href="/${locale}/how-we-work"]`).first().tap();
    await expect(page).toHaveURL(new RegExp(`/${locale}/how-we-work$`));
    await expect(page.locator('.mobile-menu[open]')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveClass(/menu-open/);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await ctx.close();
  });

  test(`J10 ${locale}: without JavaScript the site reads and navigates; the form says what it needs`, async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`/${locale}`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.hero-scene__svg')).toBeVisible(); // final illustration state, not blank
    expect(await page.locator(`footer a[href^="/${locale}/"]`).count()).toBeGreaterThan(5); // real links without the menu script
    await page.locator(`footer a[href="/${locale}/services"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/services$`));
    await expect(page.locator('h1')).toBeVisible();
    await page.goto(`/${locale}/how-we-work`);
    for (const stage of ['review', 'model', 'coordinate', 'drawings', 'quantities', 'site-support']) await expect(page.locator(`#stage-${stage}`)).toBeVisible();
    await page.goto(`/${locale}/request-a-quote`);
    await expect(page.locator('noscript')).toHaveCount(1);
    const res = await page.goto(`/${locale}/no-such-page`);
    expect(res?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText(t.notFound); // server-rendered 404 (BUG-01)
    await ctx.close();
  });
}
