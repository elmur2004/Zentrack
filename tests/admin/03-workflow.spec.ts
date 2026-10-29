import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { openByCompany, openByReference, signIn } from './helpers';

const OUTBOX = resolve(__dirname, '../../.data/e2e/outbox');
const outboxText = () => {
  try {
    return readdirSync(OUTBOX).map((f) => readFileSync(resolve(OUTBOX, f), 'utf8')).join('\n');
  } catch {
    return '';
  }
};

async function setStatus(page: Page, to: string, reason?: string) {
  const form = page.getByTestId('status-form');
  await form.locator('select').first().selectOption(to);
  if (reason !== undefined) await form.locator('textarea').fill(reason);
  await page.getByTestId('status-submit').click();
}

test('A7 forward, backward, closing and reopening transitions with reasons and localized messages', async ({ page }) => {
  await signIn(page, 'manager');
  await openByCompany(page, 'Fictional Utilities Authority (test)');
  const options = page.getByTestId('status-form').locator('select option');
  await expect(options).not.toContainText(['Won']); // only allowed transitions are offered
  await setStatus(page, 'awaiting_information');
  await expect(page.locator('.adm-detail__head .adm-badge')).toHaveText('Awaiting information');
  await setStatus(page, 'in_review'); // backward move
  await expect(page.locator('.adm-detail__head .adm-badge')).toHaveText('In review');
  // Closing needs a reason: the submit stays disabled until one is given.
  await page.getByTestId('status-form').locator('select').first().selectOption('lost');
  await expect(page.getByText('A reason is required for this change.')).toBeVisible();
  await expect(page.getByTestId('status-submit')).toHaveAttribute('aria-disabled', 'true');
  await setStatus(page, 'lost', 'Client postponed the project (synthetic).');
  await expect(page.locator('.adm-detail__head .adm-badge')).toHaveText('Not proceeding');
  await expect(page.getByText('Outcome reason: Client postponed the project (synthetic).')).toBeVisible();
  await setStatus(page, 'in_review', 'Client resumed the enquiry (synthetic).'); // reopen
  await expect(page.locator('.adm-detail__head .adm-badge')).toHaveText('In review');
  await page.getByTestId('tab-activity').click();
  await expect(page.getByTestId('timeline')).toContainText('Status: Not proceeding → In review');
  await expect(page.getByTestId('timeline')).toContainText('Reason: Client resumed the enquiry (synthetic).');
  // The same request in Arabic shows translated statuses and the assignee rule.
  await page.goto(page.url().replace('/en/', '/ar/').replace(/\?.*$/, ''));
  await expect(page.locator('.adm-detail__head .adm-badge')).toHaveText('قيد المراجعة');
  await page.getByTestId('status-form').locator('select').first().selectOption('preparing_quote');
  await expect(page.getByText('يلزم تعيين مسؤول قبل إعداد عرض السعر أو إرساله.').first()).toBeVisible();
  await page.getByTestId('status-submit').click();
  await expect(page.locator('.adm-toast', { hasText: 'عيّن مسؤولًا عن الطلب قبل إعداد عرض السعر أو إرساله.' })).toBeVisible();
  await expect(page.locator('.adm-detail__head .adm-badge')).toHaveText('قيد المراجعة'); // unchanged
});

test('A8/A9 internal notes never reach client messages; drafts use the client language and the test outbox', async ({ page, baseURL }) => {
  const marker = 'INTERNAL-NOTE-MARKER-4471';
  await signIn(page, 'owner');
  await openByReference(page, 'ZNT-2026-0042'); // Arabic-language request
  await page.getByTestId('tab-notes').click();
  await page.getByTestId('note-input').fill(`Internal only: ${marker}`);
  await page.getByTestId('note-add').click();
  await expect(page.getByTestId('notes')).toContainText(marker);
  await page.getByTestId('tab-communication').click();
  await expect(page.getByTestId('transport-note')).toContainText('Test mode');
  await page.getByTestId('template-select').selectOption('acknowledgement');
  await page.getByTestId('draft-create').click();
  const editor = page.getByTestId('draft-editor').first();
  await expect(editor.getByTestId('draft-body')).toHaveValue(/نشكركم على تواصلكم مع زينتراك/);
  await expect(editor.getByTestId('draft-body')).not.toHaveValue(new RegExp(marker));
  await expect(editor.locator('select').first()).toHaveValue('test1@example.invalid');
  await editor.getByTestId('draft-send').click();
  const dialog = page.getByTestId('send-dialog');
  await expect(dialog).toContainText('test1@example.invalid');
  await expect(dialog).toContainText('No attachments');
  await dialog.getByTestId('send-confirm').click();
  await expect(page.getByTestId('message-status').first()).toHaveText('Delivered to the local test outbox (not sent to the client)');
  const written = outboxText();
  expect(written).toContain('test1@example.invalid');
  expect(written).toContain('نشكركم');
  expect(written).not.toContain(marker);
  // The public receipt endpoint never exposes notes or workflow data.
  const replay = await page.request.post('/api/enquiries', {
    data: { type: 'quote', locale: 'en', idempotencyKey: 'e2e-public-probe-0001', values: { name: 'Probe Person', company: 'Probe Co', email: 'probe@example.invalid', country: 'GB', services: ['not-sure'], details: 'Synthetic probe to inspect the public receipt.', attachments: [], privacy: true } },
    headers: { origin: baseURL! },
  });
  const body = await replay.text();
  expect(JSON.parse(body)).toEqual({ status: 'received', reference: expect.stringMatching(/^ZNT-/) });
  expect(body).not.toMatch(/note|assignee|status_event|audit|@example\.invalid/i);
});

test('A10 two staff editing the same request: the second change is stopped, not silently applied', async ({ browser }) => {
  const a = await browser.newPage();
  const b = await browser.newPage();
  await signIn(a, 'owner');
  await signIn(b, 'manager');
  await openByCompany(a, 'Example Company 3');
  await b.goto(a.url());
  await setStatus(a, 'in_review');
  await expect(a.locator('.adm-detail__head .adm-badge')).toHaveText('In review');
  // b still shows the old version and tries a different change.
  await setStatus(b, 'awaiting_information');
  await expect(b.getByTestId('conflict')).toBeVisible();
  await expect(b.locator('.adm-detail__head .adm-badge')).toHaveText('New');
  await b.getByTestId('conflict').getByRole('button', { name: 'Refresh' }).click();
  await expect(b.locator('.adm-detail__head .adm-badge')).toHaveText('In review');
  await a.close();
  await b.close();
});
