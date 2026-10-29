import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, type Page } from '@playwright/test';

export type RoleKey = 'owner' | 'manager' | 'reviewer' | 'reviewer2' | 'readonly';

/** Synthetic accounts created by the seed for this test run (random passwords, local file). */
export function creds(key: RoleKey): { email: string; password: string } {
  const file = resolve(__dirname, '../../.data/e2e/credentials.json');
  return JSON.parse(readFileSync(file, 'utf8')).accounts[key];
}

export async function signIn(page: Page, key: RoleKey, locale: 'en' | 'ar' = 'en') {
  const c = creds(key);
  await page.goto(`/${locale}/admin/sign-in`);
  await page.locator('input[type=email]').fill(c.email);
  await page.locator('input[type=password]').fill(c.password);
  await page.getByTestId('sign-in-submit').click();
  await page.waitForURL(new RegExp(`/${locale}/admin(\\?.*)?$`));
}

/**
 * Collects Content-Security-Policy violations for every document the page loads (the listener is
 * re-installed on each navigation; reports survive navigations through an exposed binding).
 */
export async function collectCspViolations(page: Page): Promise<string[]> {
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

export async function signOut(page: Page) {
  await page.getByTestId('sign-out').click();
  await page.waitForURL(/\/admin\/sign-in\?reason=signed-out/);
}

/** Opens a request by its reference through the inbox search (search text never enters the URL). */
export async function openByReference(page: Page, reference: string, locale: 'en' | 'ar' = 'en') {
  await page.goto(`/${locale}/admin/requests`);
  await page.getByTestId('inbox-search').fill(reference);
  const link = page.getByTestId('request-link').filter({ hasText: reference });
  await expect(link).toHaveCount(1);
  expect(page.url()).not.toContain(encodeURIComponent(reference));
  await link.click();
  await expect(page.getByTestId('request-title')).toContainText(reference);
}

/** Searches the inbox and opens the row whose company matches (waits for the filtered results). */
export async function openByCompany(page: Page, company: string, locale: 'en' | 'ar' = 'en', path = 'requests') {
  await page.goto(`/${locale}/admin/${path}`);
  await page.getByTestId('inbox-search').fill(company);
  const row = page.getByTestId('inbox-table').locator('tbody tr').filter({ hasText: company });
  await expect(row).toHaveCount(1);
  await expect(page.getByTestId('inbox-table').locator('tbody tr')).toHaveCount(1);
  await row.getByTestId('request-link').click();
  await expect(page.getByTestId('request-title')).toBeVisible();
}

/** RFC 6238 TOTP (SHA-1, 6 digits, 30 s) for the two-factor journey. */
export function totp(secretBase32: string, at = Date.now()): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = secretBase32.replace(/=+$/, '').toUpperCase();
  let bits = '';
  for (const ch of clean) bits += alphabet.indexOf(ch).toString(2).padStart(5, '0');
  const bytes = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / 30)));
  const h = createHmac('sha1', bytes).update(counter).digest();
  const o = h[h.length - 1] & 0xf;
  const code = ((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).toString();
  return code.padStart(6, '0');
}

export const PDF_BYTES = Buffer.from('%PDF-1.4\n% synthetic e2e test file\n%%EOF\n', 'latin1');
