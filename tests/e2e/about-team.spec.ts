import { expect, test, type Locator } from '@playwright/test';

/**
 * Founding team on the About page (owner request of 10 Nov 2026, C26): the founder and three
 * co-founders, real portraits where supplied, discipline drawings otherwise, nothing from the
 * CVs beyond the approved fields.
 */
async function expectLoaded(images: Locator) {
  for (const img of await images.all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  }
}

test('About shows the founder and three co-founders in English and Arabic', async ({ page }) => {
  await page.goto('/en/about');
  const team = page.locator('section[aria-labelledby="team-title"]');
  await expect(team.getByRole('heading', { level: 2 })).toHaveText('The people behind Zentrac.');
  await expect(team.getByRole('heading', { level: 3 })).toHaveText(['Mark Mofreh', 'Mario Mofreh', 'Wessam Anber', 'Amal Khalil']);
  await expect(team.locator('.team-lead .eyebrow')).toHaveText('Founder');
  await expect(team.getByRole('list', { name: 'Co-founders' }).locator('> li')).toHaveCount(3);
  await expect(team.getByRole('img', { name: 'Portrait of Mark Mofreh' })).toBeVisible();
  await expect(team.getByRole('img', { name: 'Portrait of Mario Mofreh' })).toBeVisible();
  await expectLoaded(team.locator('img'));
  // Portraits are transparent cut-outs standing on the navy brand panel.
  await expect(team.locator('.team__panel--portrait img')).toHaveCount(2);
  for (const src of await team.locator('.team__panel--portrait img').evaluateAll((els) => els.map((el) => (el as HTMLImageElement).currentSrc))) {
    expect(decodeURIComponent(src)).toMatch(/\/team\/[a-z-]+\.webp/);
  }
  // People without a portrait get a decorative drawing, hidden from assistive technology.
  await expect(team.locator('.team__drawing')).toHaveCount(2);
  for (const d of await team.locator('.team__drawing').all()) await expect(d).toHaveAttribute('aria-hidden', 'true');
  // Nothing from the CVs beyond the approved fields: no emails, phone numbers or profile links.
  expect(await team.innerText()).not.toMatch(/@|\+20|\b0\d{10}\b|linkedin/i);

  await page.goto('/ar/about');
  const ar = page.locator('section[aria-labelledby="team-title"]');
  await expect(ar.getByRole('heading', { level: 3 })).toHaveText(['مارك مفرح', 'ماريو مفرح', 'وسام عنبر', 'أمل خليل']);
  await expect(ar.getByRole('list', { name: 'الشركاء المؤسسون' }).locator('> li').nth(2)).toContainText('شريكة مؤسسة');
  await expect(ar.getByRole('img', { name: 'صورة مارك مفرح' })).toBeVisible();
  await expectLoaded(ar.locator('img'));
  // Drawings and photos are never mirrored in Arabic.
  for (const el of await ar.locator('.team__motif, .team__photo').all()) expect(await el.evaluate((n) => getComputedStyle(n).transform)).toBe('none');
});
