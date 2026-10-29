import { expect, test, type Page } from '@playwright/test';
import { PDF_BYTES, signIn } from './helpers';

/**
 * Owner decisions of 28 Oct 2026 in a real browser, against the real database:
 *  - partner and career forms create records in the dashboard (OD-05), CVs stay private;
 *  - public contact channels are edited in the dashboard and appear on the website (OD-02);
 *  - the owner can pause a form; the approved privacy policy (OD-04) is published.
 * Synthetic data only (example.invalid addresses, fictional names).
 */
const PTR = /PTR-\d{4}-[0-9A-HJKMNP-TV-Z]{6}/;
const CAR = /CAR-\d{4}-[0-9A-HJKMNP-TV-Z]{6}/;

async function openApplication(staff: Page, reference: string, locale: 'en' | 'ar' = 'en') {
  await staff.goto(`/${locale}/admin/applications`);
  await staff.getByTestId('apps-search').fill(reference);
  const link = staff.getByTestId('apps-table').getByRole('link', { name: reference });
  await expect(link).toHaveCount(1);
  expect(staff.url()).not.toContain(reference); // search text never enters the URL
  await link.click();
  await expect(staff.getByTestId('application-title')).toContainText(reference);
}

/** Reloads until the regenerated page (ISR) shows the expected state. */
async function reloadUntil(page: Page, url: string, check: () => Promise<boolean>) {
  for (let i = 0; i < 12; i += 1) {
    await page.goto(url);
    if (await check()) return;
    await page.waitForTimeout(500);
  }
  throw new Error(`page did not update: ${url}`);
}

test('P1 partner enquiry → Partners & careers record; status, note; reviewers have no access', async ({ page, browser }) => {
  await page.goto('/en/partners');
  await expect(page.locator('.form-mode')).toHaveCount(0); // live mode
  await expect(page.getByText('Collaboration details')).toBeVisible();
  await page.locator('#partner-name').fill('Partner Live Test');
  await page.locator('#partner-company').fill('Survey Fixture Co');
  await page.locator('#partner-email').fill('partner.live@example.invalid');
  await page.locator('#partner-country').selectOption('SA');
  await page.locator('#partner-partnerType').selectOption('survey');
  await page.locator('#partner-details').fill('Synthetic partner enquiry: survey teams for fictional utility corridors (test data).');
  await page.locator('#partner-privacy').check();
  await page.getByRole('button', { name: 'Send Enquiry' }).click();
  const result = page.locator('.form-result');
  await expect(result).toContainText('received');
  const reference = ((await result.textContent()) ?? '').match(PTR)?.[0] ?? '';
  expect(reference).toMatch(PTR);

  const owner = await browser.newPage();
  await signIn(owner, 'owner');
  await expect(owner.getByRole('link', { name: /Partners & careers/ })).toBeVisible();
  await expect(owner.getByTestId('stat-new-partner')).toContainText('1');
  await openApplication(owner, reference);
  await expect(owner.getByTestId('application-fields')).toContainText('Survey Fixture Co');
  await expect(owner.getByTestId('application-description')).toHaveText('Synthetic partner enquiry: survey teams for fictional utility corridors (test data).');
  await expect(owner.getByTestId('application-status')).toContainText('New');
  await owner.getByTestId('app-status-select').selectOption('in_review');
  await owner.getByTestId('app-status-update').click();
  await expect(owner.getByTestId('application-status')).toContainText('In review');
  await owner.getByTestId('app-note-input').fill('Internal test note: compare with existing survey partners.');
  await owner.getByTestId('app-note-add').click();
  await expect(owner.getByTestId('notes')).toContainText('compare with existing survey partners');
  await expect(owner.getByTestId('activity')).toContainText('Status: New → In review');
  // The reply action opens the staff member's own mail app; nothing is "sent" from the dashboard.
  await expect(owner.getByTestId('app-mailto')).toHaveAttribute('href', new RegExp(`^mailto:partner\\.live@example\\.invalid\\?subject=${reference}`));
  await owner.close();

  const reviewer = await browser.newPage();
  await signIn(reviewer, 'reviewer');
  await expect(reviewer.getByRole('link', { name: /Partners & careers/ })).toHaveCount(0);
  await reviewer.goto('/en/admin/applications');
  await expect(reviewer.getByTestId('state-forbidden')).toBeVisible();
  await reviewer.close();
});

test('P2 Arabic career application with a CV → private, quarantined until a manager releases it', async ({ page, browser }) => {
  await page.goto('/ar/careers');
  await page.locator('#career-name').fill('مهندس الاختبار');
  await page.locator('#career-email').fill('career.live@example.invalid');
  await page.locator('#career-discipline').selectOption('bim-coordinator');
  await page.locator('#career-experience').fill('٥');
  await page.locator('input[type=file]').setInputFiles({ name: 'السيرة-الذاتية-تجريبية.pdf', mimeType: 'application/pdf', buffer: PDF_BYTES });
  await expect(page.locator('.file-list__item--uploaded')).toHaveCount(1);
  await page.locator('#career-privacy').check();
  await page.getByRole('button', { name: 'إرسال الطلب' }).click();
  const result = page.locator('.form-result');
  await expect(result).toContainText('تؤكد هذه الرسالة الاستلام فقط');
  const reference = ((await result.textContent()) ?? '').match(CAR)?.[0] ?? '';
  expect(reference).toMatch(CAR);

  const manager = await browser.newPage();
  await signIn(manager, 'manager', 'ar');
  await openApplication(manager, reference, 'ar');
  await expect(manager.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(manager.getByTestId('application-title').locator('bdi[dir=ltr]')).toHaveText(reference);
  await expect(manager.getByTestId('application-fields')).toContainText('5 سنوات');
  await expect(manager.getByText('السيرة-الذاتية-تجريبية.pdf')).toBeVisible();
  await expect(manager.getByTestId('scan-state')).toHaveText('لم يُفحص — يلزم الإفراج عنه');
  await expect(manager.getByTestId('file-download')).toHaveCount(0);
  await manager.getByTestId('file-release').click();
  await manager.getByTestId('release-confirm').click();
  await expect(manager.getByTestId('scan-state')).toHaveText('أُفرج عنه بعد المراجعة');
  const download = manager.waitForEvent('download');
  await manager.getByTestId('file-download').click();
  expect((await download).suggestedFilename()).toBe('السيرة-الذاتية-تجريبية.pdf');
  // Managers cannot delete; the record panel offers archive/spam only.
  await expect(manager.getByTestId('app-delete')).toHaveCount(0);
  await manager.close();
});

test('P3 contact channels edited in the dashboard appear on the website; clearing them hides them', async ({ page, browser }) => {
  await page.goto('/en');
  await expect(page.getByTestId('footer-contacts')).toHaveCount(0);

  const owner = await browser.newPage();
  await signIn(owner, 'owner');
  await owner.goto('/en/admin/settings');
  // Invalid values are refused with a field message.
  await owner.getByTestId('contact-phone').fill('0100 123');
  await owner.getByTestId('settings-save').click();
  await expect(owner.getByTestId('contacts-settings').getByRole('alert')).toContainText('Enter the number in international format');
  await expect(owner.getByTestId('contact-phone')).toHaveAttribute('aria-invalid', 'true');
  await owner.getByTestId('contact-email').fill('office@example.invalid');
  await owner.getByTestId('contact-phone').fill('+20 2 1234 5678');
  await owner.getByTestId('contact-whatsapp').fill('+20 100 123 4567');
  await owner.getByTestId('contact-linkedin').fill('https://www.linkedin.com/company/example-test');
  await owner.getByTestId('settings-save').click();
  await expect(owner.locator('.adm-toast', { hasText: 'Saved' })).toBeVisible();

  await reloadUntil(page, '/en', async () => (await page.getByTestId('footer-contacts').count()) === 1);
  const footer = page.getByTestId('footer-contacts');
  await expect(footer.getByRole('link', { name: 'office@example.invalid' })).toHaveAttribute('href', 'mailto:office@example.invalid');
  await expect(footer.getByRole('link', { name: '+20 2 1234 5678' })).toHaveAttribute('href', 'tel:+20212345678');
  await expect(footer.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute('href', 'https://wa.me/201001234567');
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(ld.join('')).toContain('"email":"office@example.invalid"');
  // Arabic pages, the quote page and the privacy policy use the same details.
  await reloadUntil(page, '/ar', async () => (await page.getByTestId('footer-contacts').count()) === 1);
  await expect(page.getByTestId('footer-contacts').locator('a[dir=ltr]').first()).toHaveText('office@example.invalid');
  await page.goto('/en/request-a-quote');
  await expect(page.locator('.office-card')).toContainText('+20 2 1234 5678');
  await reloadUntil(page, '/en/privacy', async () => (await page.getByTestId('privacy-contact').textContent())?.includes('office@example.invalid') ?? false);

  // Clearing every field removes the channels again (no placeholders).
  await owner.goto('/en/admin/settings');
  for (const f of ['email', 'phone', 'whatsapp', 'linkedin']) await owner.getByTestId(`contact-${f}`).fill('');
  await owner.getByTestId('settings-save').click();
  await expect(owner.locator('.adm-toast', { hasText: 'Saved' })).toBeVisible();
  await reloadUntil(page, '/en', async () => (await page.getByTestId('footer-contacts').count()) === 0);
  await owner.close();
});

test('P4 the owner can pause the careers form; the website says so honestly', async ({ page, browser }) => {
  const owner = await browser.newPage();
  await signIn(owner, 'owner');
  await owner.goto('/en/admin/settings');
  await owner.getByTestId('career-intake').uncheck();
  await owner.getByTestId('settings-save').click();
  await expect(owner.locator('.adm-toast', { hasText: 'Saved' })).toBeVisible();
  await page.goto('/en/careers');
  await expect(page.getByTestId('form-closed')).toContainText('We are not accepting applications at the moment.');
  await expect(page.locator('#career-name')).toHaveCount(0);
  await page.goto('/ar/careers');
  await expect(page.getByTestId('form-closed')).toContainText('لا نستقبل طلبات توظيف في الوقت الحالي');
  await owner.goto('/en/admin/applications');
  await expect(owner.getByTestId('forms-paused')).toContainText('The careers form is paused');
  await owner.goto('/en/admin/settings');
  await owner.getByTestId('career-intake').check();
  await owner.getByTestId('settings-save').click();
  await expect(owner.locator('.adm-toast', { hasText: 'Saved' })).toBeVisible();
  await page.goto('/en/careers');
  await expect(page.locator('#career-name')).toBeVisible();
  await owner.close();
});

test('P5 the approved privacy policy is published with its version and no pending items', async ({ page, browser }) => {
  await page.goto('/en/privacy');
  await expect(page.getByTestId('privacy-version')).toContainText('2026-10-28');
  await expect(page.getByText('Pending owner confirmation')).toHaveCount(0);
  await expect(page.getByText('Draft template')).toHaveCount(0);
  await expect(page.locator('#retention')).toContainText('24 months after the last activity');
  await expect(page.locator('#retention')).toContainText('12 months');
  await page.goto('/ar/privacy');
  await expect(page.locator('#retention')).toContainText('24 شهرًا');
  await expect(page.locator('#cookies')).toContainText('ساعتين');

  const owner = await browser.newPage();
  await signIn(owner, 'owner');
  await owner.goto('/en/admin/settings');
  await expect(owner.getByTestId('integrations')).toContainText('2026-10-28');
  await expect(owner.getByTestId('retention')).toContainText('Career applications and CVs: deleted 12 months after the last activity.');
  await owner.close();
});
