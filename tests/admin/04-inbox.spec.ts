import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { openByCompany, openByReference, signIn } from './helpers';

test('A11 filters, sort and paging live in the URL (stable codes only) and survive detail, language switch and reload', async ({ page }) => {
  await signIn(page, 'owner');
  await page.goto('/en/admin/requests');
  await page.getByTestId('filters-toggle').click();
  await page.getByRole('checkbox', { name: 'New', exact: true }).check();
  await page.getByLabel('Rows per page').selectOption('10');
  await expect(page).toHaveURL(/status=new/);
  await expect(page).toHaveURL(/pageSize=10/);
  await expect(page.getByTestId('inbox-table').locator('tbody tr')).toHaveCount(10);
  await page.getByTestId('page-next').click();
  await expect(page).toHaveURL(/page=2/);
  const listUrl = page.url();
  const rows = page.getByTestId('inbox-table').locator('tbody tr');
  const statuses = await rows.locator('.adm-badge[data-status]').allTextContents();
  expect(statuses.length).toBeGreaterThan(0);
  expect(new Set(statuses)).toEqual(new Set(['New']));
  // Search text is used but never written to the URL.
  await page.getByTestId('inbox-search').fill('Example');
  await expect(page).not.toHaveURL(/Example/);
  await page.getByTestId('inbox-search').fill('');
  await expect(page).toHaveURL(/page=1|^((?!page=).)*$/);
  await page.getByTestId('page-next').click();
  await expect(page).toHaveURL(/page=2/);
  // Open a record and come back: same filters and page.
  await page.getByTestId('request-link').first().click();
  await page.getByRole('link', { name: 'Back to list' }).click();
  await expect(page).toHaveURL(listUrl);
  // Switch language: same state in Arabic; then reload.
  await page.getByTestId('admin-language-switch').click();
  await expect(page).toHaveURL(/\/ar\/admin\/requests\?.*status=new/);
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.reload();
  await expect(page.getByTestId('inbox-table').locator('.adm-badge[data-status]').first()).toHaveText('جديد');
  await expect(page.getByText('الصفحة 2 من')).toBeVisible();
});

test('A11b selection: "this page" and "all matching" are distinct, and bulk changes need confirmation', async ({ page }) => {
  await signIn(page, 'owner');
  await page.goto('/en/admin/requests?pageSize=10');
  await page.getByRole('checkbox', { name: 'Select all on this page' }).check();
  const bar = page.getByTestId('selection-bar');
  await expect(bar).toContainText('10 selected');
  await bar.getByRole('button', { name: /Select all \d+ matching requests/ }).click();
  await expect(bar).toContainText(/All \d+ matching requests are selected\./);
  await bar.getByRole('button', { name: 'Archive' }).click();
  const dialog = page.locator('dialog[open]');
  await expect(dialog).toContainText(/Archive \d+ requests\?/);
  await expect(dialog).toContainText('keep their history');
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toHaveCount(0);
  await bar.getByRole('button', { name: 'Clear selection' }).click();
  await expect(bar).toHaveCount(0);
});

test('A11c switching language keeps the open request, the tab and unsaved text', async ({ page }) => {
  await signIn(page, 'owner');
  await openByReference(page, 'ZNT-2026-0042');
  await page.getByTestId('tab-notes').click();
  const text = 'Unsaved draft text — نص غير محفوظ';
  await page.getByTestId('note-input').fill(text);
  await page.getByTestId('admin-language-switch').click();
  await expect(page).toHaveURL(/\/ar\/admin\/requests\/[0-9a-f-]+\?tab=notes/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByTestId('note-input')).toHaveValue(text);
});

test('A12 due dates: overdue and due-today follow-ups are flagged in the configured timezone', async ({ page }) => {
  await signIn(page, 'owner');
  await page.goto('/en/admin/requests?followUp=due&sort=follow_up&dir=asc');
  const table = page.getByTestId('inbox-table');
  await expect(table).toContainText('Overdue');
  await expect(table).toContainText('Due today');
  await page.goto('/en/admin/requests?followUp=overdue');
  await expect(table.locator('tbody tr')).toHaveCount(1);
});

test('A13 export: permitted scope, UTF-8 with Arabic intact, formula-safe cells, no contact data by default', async ({ page }) => {
  await signIn(page, 'manager');
  await page.goto('/en/admin/requests');
  await page.getByTestId('export-open').click();
  const dialog = page.getByTestId('export-dialog');
  await expect(dialog.getByTestId('export-count')).toContainText(/requests will be exported/);
  await dialog.getByLabel('Column and label language').selectOption('ar');
  const download = page.waitForEvent('download');
  await dialog.getByTestId('export-download').click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^zentrac-quote-requests-\d{4}-\d{2}-\d{2}\.csv$/);
  const bytes = readFileSync(await file.path());
  expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  const text = bytes.subarray(3).toString('utf8');
  expect(text).toContain('"الرقم المرجعي"');
  expect(text).toContain('شركة الاختبار — BIM Experts');
  expect(text).toContain(`"'=HYPERLINK(""http://example.invalid"",""x"")"`);
  expect(text).not.toContain('@example.invalid');
});

test('A14 archive and restore move a record out of and back into the pipeline and metrics', async ({ page }) => {
  await signIn(page, 'owner');
  await page.goto('/en/admin');
  const archivedBefore = Number(await page.getByTestId('stat-archived').locator('.adm-stat__value').textContent());
  await openByCompany(page, 'Example Company 5');
  const detailUrl = page.url();
  await page.getByTestId('archive-button').click();
  await page.getByTestId('disposition-confirm').click();
  await expect(page.getByText('This request is archived.')).toBeVisible();
  await page.goto('/en/admin/requests');
  await page.getByTestId('inbox-search').fill('Example Company 5');
  await expect(page.getByTestId('inbox-empty')).toBeVisible();
  await page.goto('/en/admin/archive');
  await page.getByTestId('inbox-search').fill('Example Company 5');
  await expect(page.getByTestId('request-link')).toHaveCount(1);
  await page.goto('/en/admin');
  await expect(page.getByTestId('stat-archived').locator('.adm-stat__value')).toHaveText(String(archivedBefore + 1));
  await page.goto(detailUrl);
  await page.getByTestId('restore-button').click();
  await page.getByTestId('disposition-confirm').click();
  await expect(page.getByText('This request is archived.')).toHaveCount(0);
  await page.getByTestId('tab-activity').click();
  await expect(page.getByTestId('timeline')).toContainText('Archived');
  await expect(page.getByTestId('timeline')).toContainText('Restored to active');
  await page.goto('/en/admin');
  await expect(page.getByTestId('stat-archived').locator('.adm-stat__value')).toHaveText(String(archivedBefore));
});
