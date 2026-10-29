import { expect, test, type Page } from '@playwright/test';

/**
 * SEC-01: the public site sends a Content-Security-Policy that allows only same-origin resources and
 * runs its real interactions (motion, explorer, Track/GSAP, quote form with an upload) without a
 * single violation. Private dashboard policy: tests/admin/02-access.spec.ts.
 */
test.use({ viewport: { width: 1440, height: 900 } });

async function collectCspViolations(page: Page): Promise<string[]> {
  const violations: string[] = [];
  await page.exposeFunction('__zntCspViolation', (v: string) => violations.push(v));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      const report = (window as unknown as { __zntCspViolation: (v: string) => void }).__zntCspViolation;
      report(`${e.effectiveDirective} blocked ${e.blockedURI || '(inline)'} on ${location.pathname}`);
    });
  });
  return violations;
}

test('public pages send a same-origin Content-Security-Policy and security headers', async ({ request }) => {
  for (const path of ['/en', '/ar/request-a-quote', '/en/does-not-exist']) {
    const res = await request.get(path);
    const h = res.headers();
    const csp = h['content-security-policy'] ?? '';
    expect(csp, path).toContain("default-src 'self'");
    expect(csp, path).toContain("frame-ancestors 'none'");
    expect(csp, path).toContain("object-src 'none'");
    expect(csp, path).toContain("base-uri 'self'");
    expect(csp, path).toContain("form-action 'self'");
    expect(csp, path).not.toMatch(/script-src[^;]*'unsafe-eval'/);
    expect(csp, path).not.toMatch(/https?:\/\//); // no third-party origin anywhere
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  }
});

test('core public interactions run without CSP violations', async ({ page }) => {
  const violations = await collectCspViolations(page);
  await page.goto('/en');
  await page.goto('/en/infrastructure');
  await page.locator('[data-net-btn="water"]').first().click();
  await page.goto('/ar/how-we-work');
  // scroll through the Track so GSAP and ScrollTrigger load (dynamic chunks via 'self')
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await page.goto('/en/request-a-quote');
  await page.locator('input[type=file]').first().setInputFiles({
    name: 'coordination-sheet-01.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n% synthetic test file\n%%EOF\n', 'latin1'),
  });
  await expect(page.locator('.file-list__item--test')).toContainText('Checked (test only, not stored)');
  expect(violations).toEqual([]);
});
