import { expect, test } from '@playwright/test';

/**
 * Owner decisions of 28 Oct 2026 on the public build (preview mode, no database):
 * approved privacy policy (OD-04), empty index pages kept out of search (OD-29), contact
 * channels only from the dashboard (OD-02: none shown without a database), reviewed copy.
 */
test('the approved privacy policy is complete in both languages', async ({ page }) => {
  await page.goto('/en/privacy');
  await expect(page.getByTestId('privacy-version')).toContainText('Last updated: 28 October 2026');
  await expect(page.getByTestId('privacy-version')).toContainText('Version: 2026-10-28');
  await expect(page.locator('.pending-chip')).toHaveCount(0);
  await expect(page.getByText(/Pending owner confirmation|Draft template/)).toHaveCount(0);
  await expect(page.locator('#retention')).toContainText('deleted 24 months after the last activity');
  await expect(page.locator('#retention')).toContainText('deleted 12 months after');
  await expect(page.locator('#access')).toContainText('visible only to the owner and managers');
  // Without a configured email the request channel is the postal address (no placeholder).
  await expect(page.getByTestId('privacy-contact')).toHaveText('To make a request, write to our office address above, quoting your reference number if you have one.');
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);

  await page.goto('/ar/privacy');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByTestId('privacy-version')).toContainText('آخر تحديث');
  await expect(page.getByTestId('privacy-version').locator('bdi[dir=ltr]')).toHaveText('2026-10-28');
  await expect(page.locator('#retention')).toContainText('بعد 24 شهرًا من آخر نشاط');
  await expect(page.locator('#retention')).toContainText('بعد 30 يومًا');
  await expect(page.locator('#cookies')).toContainText('بعد ساعتين');
  await expect(page.locator('main')).not.toContainText(/Pending|Draft|Version/);
});

test('empty Projects and Insights pages stay reachable but are kept out of search and the sitemap', async ({ page, request }) => {
  for (const path of ['/en/projects', '/ar/projects', '/en/blog', '/ar/blog']) {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  }
  await page.goto('/en/about');
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/en/about</loc>');
  expect(sitemap).not.toContain('/en/projects</loc>');
  expect(sitemap).not.toContain('/ar/blog</loc>');
});

test('contact channels never appear without the dashboard setting; reviewed copy is in place', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByTestId('footer-contacts')).toHaveCount(0);
  await expect(page.locator('a[href^="https://wa.me/"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Developers and owners: how we support you' })).toBeVisible();
  await page.goto('/ar');
  await expect(page.getByRole('link', { name: 'المقاولون: كيف ندعمكم' })).toBeVisible();

  await page.goto('/en/partners');
  await expect(page.locator('label[for="partner-details"]')).toContainText('Collaboration details');
  await page.goto('/en/careers');
  // CV upload is offered (private, quarantined storage in live mode; validated only in preview).
  await expect(page.locator('input[type=file][accept*="pdf"]')).toHaveCount(1);

  await page.goto('/en/services/coordination');
  const title = page.locator('#process-title');
  await expect(title).toHaveText(/Review\s*,?\s*→\s*Model/);
  await expect(title.locator('[aria-hidden="true"]')).toHaveCount(3);
});
