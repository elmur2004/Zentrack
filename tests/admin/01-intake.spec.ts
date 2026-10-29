import { expect, test } from '@playwright/test';
import { openByReference, PDF_BYTES, signIn } from './helpers';

const REF = /ZNT-\d{4}-[0-9A-HJKMNP-TV-Z]{6}/;

test('A1 English website enquiry → one dashboard record, same reference, private quarantined file', async ({ page, browser }) => {
  await page.goto('/en/request-a-quote');
  await expect(page.locator('.form-mode')).toHaveCount(0); // live mode: no "preview" banner
  await page.locator('#quote-name').fill('Jamie Live Test');
  await page.locator('#quote-company').fill('Live Intake Test Co');
  await page.locator('#quote-email').fill('live.en@example.invalid');
  await page.locator('#quote-country').selectOption('AE');
  await page.locator('#quote-services-1').check();
  await page.locator('#quote-details').fill('Synthetic live enquiry: BIM coordination for a fictional utilities corridor (test data).');
  await page.locator('input[type=file]').setInputFiles({ name: 'Coordination plan.pdf', mimeType: 'application/pdf', buffer: PDF_BYTES });
  await expect(page.locator('.file-list__item--uploaded')).toHaveCount(1);
  await page.locator('#quote-privacy').check();
  await page.getByRole('button', { name: 'Send Request' }).click();
  const result = page.locator('.form-result');
  await expect(result).toContainText('Your request has been received. Reference:');
  const reference = ((await result.textContent()) ?? '').match(REF)?.[0] ?? '';
  expect(reference).toMatch(REF);

  const staff = await browser.newPage();
  await signIn(staff, 'owner');
  await openByReference(staff, reference);
  await expect(staff.getByTestId('description')).toHaveText('Synthetic live enquiry: BIM coordination for a fictional utilities corridor (test data).');
  await expect(staff.getByText('live.en@example.invalid')).toBeVisible();
  await expect(staff.getByText('Submitted in English')).toBeVisible();
  await staff.getByTestId('tab-files').click();
  await expect(staff).toHaveURL(/tab=files/);
  await expect(staff.getByTestId('scan-state')).toHaveText('Not scanned — release required');
  await expect(staff.getByTestId('file-download')).toHaveCount(0);
  await staff.getByTestId('file-release').click();
  await staff.getByTestId('release-confirm').click();
  await expect(staff.getByTestId('scan-state')).toHaveText('Released after review');
  const download = staff.waitForEvent('download');
  await staff.getByTestId('file-download').click();
  expect((await download).suggestedFilename()).toBe('Coordination plan.pdf');
  // A reload keeps the tab (direct link to a section works).
  await staff.reload();
  await expect(staff.getByTestId('tab-files')).toHaveAttribute('aria-selected', 'true');
  await staff.close();
});

test('A2 Arabic enquiry with mixed-direction text and an Arabic filename arrives uncorrupted', async ({ page, browser }) => {
  const details = 'طلب ZNT-2026-0042 — تنسيق BIM / LOD 400 لشبكة صرف تجريبية، هاتف +20 100 000 0000. بيانات اختبار فقط.';
  await page.goto('/ar/request-a-quote');
  await page.locator('#quote-name').fill('سارة الاختبار');
  await page.locator('#quote-company').fill('شركة الاختبار — BIM Experts');
  await page.locator('#quote-email').fill('live.ar@example.invalid');
  await page.locator('#quote-phone').fill('+٢٠ ١٠٠ ١٢٣ ٤٥٦٧');
  await page.locator('#quote-country').selectOption('EG');
  await page.locator('#quote-services-0').check();
  await page.locator('#quote-details').fill(details);
  await page.locator('input[type=file]').setInputFiles({ name: 'مخطط-التنسيق-02.pdf', mimeType: 'application/pdf', buffer: PDF_BYTES });
  await expect(page.locator('.file-list__item--uploaded')).toHaveCount(1);
  await page.locator('#quote-privacy').check();
  await page.getByRole('button', { name: 'إرسال الطلب' }).click();
  const result = page.locator('.form-result');
  await expect(result).toContainText(REF);
  const reference = ((await result.textContent()) ?? '').match(REF)?.[0] ?? '';

  const staff = await browser.newPage();
  await signIn(staff, 'owner', 'ar');
  await openByReference(staff, reference, 'ar');
  await expect(staff.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(staff.getByTestId('description')).toHaveText(details);
  await expect(staff.getByTestId('request-title').locator('bdi[dir=ltr]')).toHaveText(reference);
  await expect(staff.getByText('+201001234567')).toBeVisible(); // Arabic-Indic digits normalised for the phone only
  await staff.getByTestId('tab-files').click();
  await expect(staff.getByText('مخطط-التنسيق-02.pdf')).toBeVisible();
  await staff.close();
});

test('A3 a retried submission returns the same reference and creates no duplicate', async ({ page, baseURL }) => {
  const payload = {
    type: 'quote',
    locale: 'en',
    idempotencyKey: `e2e-retry-${Date.now()}-abcdef`,
    values: { name: 'Retry Person', company: 'Retry Twice Co', email: 'retry@example.invalid', phone: '', country: 'GB', services: ['not-sure'], scope: '', details: 'Synthetic retry test: the same submission sent twice.', attachments: [], privacy: true },
  };
  const send = () => page.request.post('/api/enquiries', { data: payload, headers: { origin: baseURL! } });
  const first = await (await send()).json();
  const second = await (await send()).json();
  expect(first.status).toBe('received');
  expect(second).toEqual(first);
  expect(Object.keys(first).sort()).toEqual(['reference', 'status']); // receipt carries nothing internal
  await signIn(page, 'owner');
  await page.goto('/en/admin/requests');
  await page.getByTestId('inbox-search').fill('Retry Twice Co');
  await expect(page.getByTestId('request-link')).toHaveCount(1);
});
