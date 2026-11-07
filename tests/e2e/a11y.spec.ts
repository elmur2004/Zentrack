import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = ['', 'about', 'services', 'services/coordination', 'infrastructure', 'buildings', 'how-we-work', 'clients', 'projects', 'blog', 'request-a-quote', 'partners', 'careers', 'privacy', 'nope'];

for (const locale of ['en', 'ar']) {
  for (const path of PAGES) {
    test(`axe: /${locale}/${path} has no serious or critical violations`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`/${locale}${path ? `/${path}` : ''}`);
      await page.waitForTimeout(400);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      if (serious.length)
        console.log(
          JSON.stringify(
            serious.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) })),
            null,
            2,
          ),
        );
      expect(serious).toEqual([]);
    });
  }
}
