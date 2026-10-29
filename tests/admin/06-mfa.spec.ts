import { expect, test, type Page } from '@playwright/test';
import { collectCspViolations, creds, signIn, signOut, totp } from './helpers';

/** Enrols TOTP from the account page using the displayed key (as an authenticator app would). */
async function enrol(page: Page, password: string) {
  await page.getByTestId('mfa-password').fill(password);
  await page.getByTestId('mfa-start').click();
  const secret = ((await page.getByTestId('totp-secret').textContent()) ?? '').trim();
  expect(secret).toMatch(/^[A-Z2-7]+=*$/);
  await page.getByTestId('totp-confirm-input').fill(totp(secret));
  await page.getByTestId('totp-confirm').click();
  await expect(page.getByTestId('backup-codes')).toBeVisible();
  await page.getByRole('button', { name: 'I have saved my backup codes' }).click();
  await expect(page.getByTestId('mfa-state')).toHaveText('Two-factor authentication is on.');
  return secret;
}

test('A18 two-factor authentication: enrolment, sign-in challenge, and the owner policy', async ({ page, browser }) => {
  // The enrolment QR code is a data: image and the flow runs client code: both must pass the strict CSP.
  const violations = await collectCspViolations(page);
  // Manager enrols voluntarily.
  await signIn(page, 'manager');
  await page.goto('/en/admin/account');
  const secret = await enrol(page, creds('manager').password);
  await signOut(page);

  // Next sign-in requires the second factor; a wrong code is refused.
  await page.locator('input[type=email]').fill(creds('manager').email);
  await page.locator('input[type=password]').fill(creds('manager').password);
  await page.getByTestId('sign-in-submit').click();
  await expect(page.getByTestId('totp-input')).toBeVisible();
  await page.getByTestId('totp-input').fill('000000');
  await page.getByTestId('sign-in-submit').click();
  await expect(page.getByTestId('sign-in-error')).toContainText('That code is not valid');
  await page.getByTestId('totp-input').fill(totp(secret));
  await page.getByTestId('sign-in-submit').click();
  await page.waitForURL(/\/en\/admin$/);
  expect(violations).toEqual([]);

  // Owner turns on the requirement; an owner without 2FA is limited to the account page until enrolled.
  const owner = await browser.newPage();
  await signIn(owner, 'owner');
  await owner.goto('/en/admin/settings');
  await owner.getByTestId('require-mfa').check();
  await owner.getByTestId('settings-save').click();
  await expect(owner.locator('.adm-toast', { hasText: 'Saved' })).toBeVisible();
  await owner.goto('/en/admin/requests');
  await expect(owner).toHaveURL(/\/en\/admin\/account\?mfa=required/);
  await expect(owner.getByTestId('mfa-required')).toBeVisible();
  await enrol(owner, creds('owner').password);
  await owner.goto('/en/admin/requests');
  await expect(owner).toHaveURL(/\/en\/admin\/requests$/);
  await owner.close();
});
