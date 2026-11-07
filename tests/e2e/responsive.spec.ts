import { expect, test, type Page } from '@playwright/test';

/**
 * 03 §9–§10 responsive and inclusive-display checks, both languages:
 * width sweep 320–1920, 200% / 400% zoom (CSS-pixel equivalents), WCAG 1.4.12 text spacing,
 * phone landscape, forced colours and switching reduced motion on mid-session.
 * Emulation in desktop Chromium (not real devices); real-device checks are listed in
 * docs/bilingual-accessibility-qa.md.
 */
const WIDTHS = [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920];
const TEMPLATES = ['', 'services/coordination', 'infrastructure', 'buildings', 'how-we-work', 'request-a-quote', 'privacy', 'does-not-exist'];

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const offenders = [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.right > doc.clientWidth + 1 && getComputedStyle(el).position !== 'fixed';
      })
      .slice(0, 3)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`);
    return { extra: doc.scrollWidth - doc.clientWidth, offenders };
  });
}

/**
 * Readable text cut off by a clipping box: any element holding its own text that extends outside an
 * ancestor with overflow hidden/clip. Decorative art clipped on purpose (aria-hidden, SVG) and
 * visually-hidden helpers are ignored.
 */
async function clippedText(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    const clippers = [...document.querySelectorAll<HTMLElement>('main *, header *')].filter((el) => {
      const cs = getComputedStyle(el);
      const clips = ['hidden', 'clip'].includes(cs.overflowX) || ['hidden', 'clip'].includes(cs.overflowY);
      return clips && el.clientWidth > 2 && el.clientHeight > 2;
    });
    for (const box of clippers) {
      const b = box.getBoundingClientRect();
      for (const el of box.querySelectorAll<HTMLElement>('*')) {
        const ownText = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
        if (!ownText || el.closest('svg, [aria-hidden="true"], .sr-only, .visually-hidden')) continue;
        // inside a scroll container (e.g. a data table region): reachable by scrolling, not lost
        let scroller = false;
        for (let a = el.parentElement; a && a !== box; a = a.parentElement) {
          const cs = getComputedStyle(a);
          if (['auto', 'scroll'].includes(cs.overflowX) || ['auto', 'scroll'].includes(cs.overflowY)) scroller = true;
        }
        if (scroller) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.bottom > b.bottom + 2 || r.right > b.right + 2 || r.left < b.left - 2 || r.top < b.top - 2) {
          out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${el.textContent!.trim().slice(0, 30)}" in ${String(box.className).split(' ')[0]}`);
        }
      }
    }
    return [...new Set(out)].slice(0, 5);
  });
}

for (const locale of ['en', 'ar'] as const) {
  for (const width of WIDTHS) {
    test(`/${locale} at ${width}px: no horizontal page scrolling on representative templates`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 800 : 900 });
      for (const path of TEMPLATES) {
        await page.goto(`/${locale}${path ? `/${path}` : ''}`);
        const o = await horizontalOverflow(page);
        expect(o.extra, `${locale}/${path} ${width}px ${o.offenders.join(', ')}`).toBeLessThanOrEqual(0);
      }
    });
  }

  test(`/${locale} at 200% and 400% zoom (640px / 320px CSS viewports): content reflows, header leaves room`, async ({ page }) => {
    for (const [width, height] of [
      [640, 450],
      [320, 256],
    ]) {
      await page.setViewportSize({ width, height });
      for (const path of ['', 'services/coordination', 'request-a-quote']) {
        await page.goto(`/${locale}${path ? `/${path}` : ''}`);
        expect((await horizontalOverflow(page)).extra, `${path} @${width}`).toBeLessThanOrEqual(0);
        const header = await page.locator('.site-header').boundingBox();
        expect(header!.height, `header height @${width}x${height}`).toBeLessThanOrEqual(height * 0.35);
        await expect(page.locator('h1')).toBeVisible();
      }
    }
  });

  test(`/${locale} WCAG 1.4.12 text spacing: no clipped text or horizontal scrolling`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ['', 'services/coordination', 'request-a-quote', 'how-we-work']) {
      await page.goto(`/${locale}${path ? `/${path}` : ''}`);
      await page.addStyleTag({
        content:
          '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-block-end: 2em !important; }',
      });
      expect((await horizontalOverflow(page)).extra, path).toBeLessThanOrEqual(0);
      expect(await clippedText(page), path).toEqual([]);
    }
    // the issue register scrolls sideways at this size, so keyboard users must be able to reach it
    await page.goto(`/${locale}`);
    const region = page.getByRole('region', { name: locale === 'ar' ? /سجل/ : /register/i });
    await expect(region).toHaveAttribute('tabindex', '0');
  });

  test(`/${locale} phone landscape: header, menu and form stay usable`, async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto(`/${locale}`);
    const header = await page.locator('.site-header').boundingBox();
    expect(header!.height).toBeLessThanOrEqual(390 * 0.3);
    await page.locator('.menu-toggle').click();
    const menu = page.locator('.mobile-menu[open]');
    await expect(menu).toBeVisible();
    // the drawer scrolls when its content is taller than the screen, so every link is reachable
    const lastLink = menu.locator('a').last();
    await lastLink.scrollIntoViewIfNeeded();
    await expect(lastLink).toBeInViewport();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await page.goto(`/${locale}/request-a-quote`);
    const field = page.locator('#quote-details');
    await field.focus();
    const box = await field.boundingBox();
    const headerNow = await page.locator('.site-header').boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(headerNow!.y + headerNow!.height - 1); // focused field not under the sticky header
  });
}

test('forced colours: focus indicators and control boundaries survive (EN and AR)', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const locale of ['en', 'ar']) {
    await page.goto(`/${locale}/request-a-quote`);
    await page.keyboard.press('Tab'); // skip link
    const skip = page.locator('.skip-link');
    await expect(skip).toBeFocused();
    expect(await skip.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
    const input = page.locator('#quote-name');
    await input.focus();
    const styles = await input.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { outline: cs.outlineStyle, border: cs.borderTopStyle };
    });
    expect(styles.outline).not.toBe('none');
    expect(styles.border).not.toBe('none');
    await page.screenshot({ path: `docs/qa/after/screenshots/forced-colors-quote-${locale}-1280.png` });
  }
});

test('turning reduced motion on mid-session reveals everything and stops the hero sequence', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/en');
  await expect.poll(() => page.locator('[data-reveal-state="armed"]').count()).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.locator('[data-reveal-state="armed"]').count()).toBe(0);
  const hidden = await page.evaluate(
    () => [...document.querySelectorAll<HTMLElement>('[data-reveal]')].filter((el) => getComputedStyle(el).opacity !== '1').length,
  );
  expect(hidden).toBe(0);
  const heroAnimations = await page.evaluate(() => document.querySelector('.hero-scene')!.getAnimations({ subtree: true }).length);
  expect(heroAnimations).toBe(0);
});
