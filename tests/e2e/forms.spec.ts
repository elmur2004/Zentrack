import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 900 } });

async function fillValidQuote(page: import('@playwright/test').Page, prefix = 'quote') {
  await page.locator(`#${prefix}-name`).fill('مارك Test');
  await page.locator(`#${prefix}-company`).fill('Fixture Engineering Co.');
  await page.locator(`#${prefix}-email`).fill('test@example.com');
  await page.locator(`#${prefix}-country`).selectOption('EG');
  await page.locator(`#${prefix}-details`).fill('Non-confidential overview: stormwater and sewer coordination for one road package.');
  await page.locator(`#${prefix}-privacy`).check();
}

test('preview mode is unmistakable and never claims a real send', async ({ page }) => {
  await page.goto('/en/request-a-quote');
  await expect(page.locator('.form-mode')).toHaveText(/Preview only\. This test will not send a real enquiry\./);
  await fillValidQuote(page);
  await page.locator('#quote-services-1').check();
  await page.getByRole('button', { name: 'Send Request' }).click();
  const result = page.locator('.form-result--test');
  await expect(result).toContainText('Test completed; no request was sent. Test reference: TEST-');
  await expect(result).not.toContainText('has been received');
  await expect(result).toBeFocused();
  await page.getByRole('button', { name: 'Send another request' }).click();
  await expect(page.locator('#quote-name')).toHaveValue('');
});

test('invalid submit shows a focused error summary with field links (EN)', async ({ page }) => {
  await page.goto('/en/request-a-quote');
  await page.getByRole('button', { name: 'Send Request' }).click();
  const summary = page.locator('.error-summary');
  await expect(summary).toBeFocused();
  await expect(summary).toContainText('Please enter your name.');
  await expect(summary).toContainText('Select a service or choose “Not sure”.');
  await expect(page.locator('#quote-name')).toHaveAttribute('aria-invalid', 'true');
  const describedBy = await page.locator('#quote-name').getAttribute('aria-describedby');
  expect(describedBy).toContain('quote-name-error');
  await summary.getByRole('link', { name: /Email/ }).click();
  await expect(page.locator('#quote-email')).toBeFocused();
});

test('BUG-02 after an invalid submit, fixing the fields and pressing Send once submits (EN and AR)', async ({ page }) => {
  for (const [locale, send, receipt] of [
    ['en', 'Send Request', 'Test completed; no request was sent.'],
    ['ar', 'إرسال الطلب', 'اكتمل الاختبار؛ لم يُرسل أي طلب'],
  ] as const) {
    await page.goto(`/${locale}/request-a-quote`);
    await page.getByRole('button', { name: send }).click();
    await expect(page.locator('.error-summary')).toBeFocused();
    await fillValidQuote(page);
    await page.locator('#quote-services-1').check();
    // errors clear as soon as a field is valid, so nothing moves while Send is pressed
    await expect(page.locator('#quote-name')).not.toHaveAttribute('aria-invalid', 'true');
    // the privacy checkbox was fixed last: its message must not shift Send between press and release
    await page.getByRole('button', { name: send }).click();
    await expect(page.locator('.form-result--test')).toContainText(receipt);
  }
});

test('L17 Arabic validation messages and LTR inputs inside the RTL form', async ({ page }) => {
  await page.goto('/ar/request-a-quote');
  await page.getByRole('button', { name: 'إرسال الطلب' }).click();
  await expect(page.locator('.error-summary')).toContainText('يرجى إدخال الاسم.');
  await expect(page.locator('.error-summary')).toContainText('يرجى إدخال بريد إلكتروني صحيح.');
  await expect(page.locator('#quote-email')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('#quote-phone')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('#quote-name')).toHaveAttribute('dir', 'auto');
});

test('L10/L11 Arabic-Indic phone digits are accepted; text is kept after a failure', async ({ page }) => {
  await page.goto('/ar/request-a-quote');
  await fillValidQuote(page);
  await page.locator('#quote-services-5').check(); // Not sure
  await page.locator('#quote-phone').fill('+٢٠ ١٠٠ ١٢٣ ٤٥٦٧');
  // simulate a transport failure: text must remain
  await page.route('**/api/enquiries', (route) => route.abort());
  await page.getByRole('button', { name: 'إرسال الطلب' }).click();
  await expect(page.locator('.form__status')).toContainText('تعذر إرسال الطلب. بياناتك ما زالت محفوظة');
  await expect(page.locator('#quote-name')).toHaveValue('مارك Test');
  await page.unroute('**/api/enquiries');
  await page.getByRole('button', { name: 'إرسال الطلب' }).click();
  await expect(page.locator('.form-result--test')).toContainText('اكتمل الاختبار؛ لم يُرسل أي طلب');
});

test('rate-limit and unavailable responses are explained honestly', async ({ page }) => {
  await page.goto('/en/request-a-quote');
  await fillValidQuote(page);
  await page.locator('#quote-services-1').check();
  await page.route('**/api/enquiries', (route) => route.fulfill({ status: 429, body: '{"status":"rate-limited"}', contentType: 'application/json' }));
  await page.getByRole('button', { name: 'Send Request' }).click();
  await expect(page.locator('.form__status')).toContainText('Too many attempts');
  await page.route('**/api/enquiries', (route) => route.fulfill({ status: 503, body: '{"status":"unavailable"}', contentType: 'application/json' }));
  await page.getByRole('button', { name: 'Send Request' }).click();
  await expect(page.locator('.form__status')).toContainText('Online submission is temporarily unavailable.');
});

test('double activation sends one request', async ({ page }) => {
  await page.goto('/en/request-a-quote');
  await fillValidQuote(page);
  await page.locator('#quote-services-1').check();
  let count = 0;
  await page.route('**/api/enquiries', async (route) => {
    count += 1;
    await new Promise((r) => setTimeout(r, 600));
    await route.continue();
  });
  const btn = page.getByRole('button', { name: 'Send Request' });
  await btn.dblclick();
  await expect(page.locator('.form-result--test')).toBeVisible();
  expect(count).toBe(1);
});

test('uploads: rejected type, mismatched signature and a valid PDF', async ({ page }) => {
  await page.goto('/en/request-a-quote');
  const input = page.locator('.file-picker__input');
  await input.setInputFiles({ name: 'model.rvt', mimeType: 'application/octet-stream', buffer: Buffer.from('RVT') });
  await expect(page.locator('.file-list__item--rejected')).toContainText('This file type is not accepted');
  await input.setInputFiles({ name: 'fake.pdf', mimeType: 'application/pdf', buffer: Buffer.from('MZ not a pdf') });
  await expect(page.locator('.file-list__item--rejected').last()).toContainText('contents do not match');
  await input.setInputFiles({ name: 'مخطط-الموقع.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\n%test\n') });
  await expect(page.locator('.file-list__item--test')).toContainText('Checked (test only, not stored)');
  await expect(page.locator('.file-list__item--test bdi')).toHaveText('مخطط-الموقع.pdf');
  await page.getByRole('button', { name: 'Remove مخطط-الموقع.pdf' }).click();
  await expect(page.locator('.file-list__item--test')).toHaveCount(0);
});

test('careers: CV or portfolio required; confirmation is receipt-only wording', async ({ page }) => {
  await page.goto('/en/careers');
  await page.locator('#career-name').fill('Lina');
  await page.locator('#career-email').fill('lina@example.com');
  await page.locator('#career-discipline').selectOption('bim-modeller');
  await page.locator('#career-privacy').check();
  await page.getByRole('button', { name: 'Send Application' }).click();
  await expect(page.locator('.error-summary')).toContainText('Please add a CV or a portfolio link.');
  await page.locator('#career-portfolio').fill('https://portfolio.example.com/lina');
  await page.locator('#career-experience').fill('٧');
  await page.getByRole('button', { name: 'Send Application' }).click();
  await expect(page.locator('.form-result--test')).toContainText('Test completed; no request was sent.');
});

test('partners form validates organisation type', async ({ page }) => {
  await page.goto('/ar/partners');
  await page.getByRole('button', { name: 'إرسال الاستفسار' }).click();
  await expect(page.locator('.error-summary')).toContainText('يرجى اختيار نوع المؤسسة.');
});
