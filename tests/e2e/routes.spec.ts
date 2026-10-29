import { expect, test } from '@playwright/test';
import { LOCALES, NOT_PUBLIC, PAGES, url } from './routes';

/** L01, L17, L19 and reflow: every public page in both locales. */
for (const locale of LOCALES) {
  test.describe(`${locale} pages`, () => {
    for (const path of PAGES) {
      test(`${url(locale, path)} renders correctly`, async ({ page }) => {
        const res = await page.goto(url(locale, path));
        expect(res?.status()).toBe(200);

        // direction and language are in the server HTML (before hydration)
        const html = await res!.text();
        expect(html).toMatch(new RegExp(`<html[^>]*lang="${locale}"[^>]*dir="${locale === 'ar' ? 'rtl' : 'ltr'}"`));

        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page).toHaveTitle(locale === 'ar' ? /زينتراك/ : /Zentrac/);

        // self-canonical + reciprocal hreflang alternates
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
        expect(canonical).toMatch(new RegExp(`${url(locale, path)}$`));
        for (const l of ['en', 'ar', 'x-default'])
          await expect(page.locator(`link[rel="alternate"][hreflang="${l}"]`)).toHaveCount(1);

        // no raw dictionary keys or bracket placeholders in visible text
        const text = await page.locator('body').innerText();
        expect(text).not.toMatch(/\[(Email|Phone|XX|Website)\]|undefined|\bTBC\b/);
        expect(text).not.toMatch(/\b(home|common|nav|forms)\.[a-z]+\.[a-z]+/i);

        // 320px reflow: no horizontal page scrolling
        await page.setViewportSize({ width: 320, height: 720 });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(1);
      });
    }

    for (const path of NOT_PUBLIC) {
      test(`${url(locale, path)} is a real 404`, async ({ page }) => {
        const res = await page.goto(url(locale, path));
        expect(res?.status()).toBe(404);
        await expect(page.locator('h1')).toHaveText(locale === 'ar' ? 'الصفحة غير موجودة' : 'Page not found');
        await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
        // BUG-01: the 404 is in the server HTML (no-JS visitors, crawlers), with recovery links and a 404 title
        const html = await res!.text();
        expect(html).toMatch(new RegExp(`<html[^>]*lang="${locale}"[^>]*dir="${locale === 'ar' ? 'rtl' : 'ltr'}"`));
        expect(html).not.toContain('__next_error__');
        expect(html).toContain(locale === 'ar' ? 'الصفحة غير موجودة' : 'Page not found');
        expect(html).toMatch(new RegExp(`<a[^>]+href="/${locale}/request-a-quote"`));
        await expect(page).toHaveTitle(locale === 'ar' ? /^الصفحة غير موجودة/ : /^Page not found/);
        await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
      });
    }
  });
}

test('root redirects to /en without language sniffing', async ({ request }) => {
  const res = await request.get('/', { maxRedirects: 0, headers: { 'accept-language': 'ar' } });
  expect(res.status()).toBe(307);
  expect(res.headers()['location']).toMatch(/\/en$/);
});

test('canonical URL policy: one redirect to the lowercase, slash-normalized URL', async ({ request }) => {
  const cases: Array<[string, number, RegExp]> = [
    ['/EN', 308, /\/en$/],
    ['/en/Services', 308, /\/en\/services$/],
    ['/AR/Services/Coordination?ref=x', 308, /\/ar\/services\/coordination\?ref=x$/],
    ['/About', 307, /\/en\/about$/],
    ['/en/services/', 308, /\/en\/services$/],
    ['/en//services', 308, /\/en\/services$/],
    // admin: only the locale/"admin" segments are normalized; tokens and IDs keep their case
    ['/EN/Admin/invite/AbC123', 308, /\/en\/admin\/invite\/AbC123$/],
  ];
  for (const [path, status, location] of cases) {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status(), path).toBe(status);
    expect(res.headers()['location'], path).toMatch(location);
  }
  // canonical URLs themselves are served directly, and tracking parameters do not change the canonical
  const direct = await request.get('/en/services?utm_source=test', { maxRedirects: 0 });
  expect(direct.status()).toBe(200);
  expect(await direct.text()).toMatch(/<link rel="canonical" href="[^"]*\/en\/services"/);
});

test('sitemap lists published routes only, with alternates', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  expect(xml).toContain('/en/services/coordination');
  expect(xml).toContain('/ar/services/coordination');
  expect(xml).toContain('hreflang="x-default"');
  expect(xml).not.toContain('/projects/');
  expect(xml).not.toContain('/blog/');
  expect(xml).not.toMatch(/\/(en|ar)\/review(\/|<|")/); // private review area (not /services/design-review)
});

test('robots.txt points to the sitemap and blocks the API', async ({ request }) => {
  const txt = await (await request.get('/robots.txt')).text();
  expect(txt).toContain('Disallow: /api/');
  expect(txt).toContain('Sitemap:');
});
