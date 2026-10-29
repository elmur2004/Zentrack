import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { collectCspViolations, creds, openByCompany, openByReference, signIn, signOut } from './helpers';

test('A5 assignment controls who can see and work on a request; the audit trail records it', async ({ browser }) => {
  const manager = await browser.newPage();
  await signIn(manager, 'manager');
  await openByCompany(manager, 'Example Engineering Co.');
  const url = manager.url();
  await manager.getByTestId('assignee-select').selectOption({ label: 'Test Reviewer (Reviewer)' });
  await manager.getByTestId('assign-save').click();
  await expect(manager.getByText(/^Assigned /)).toBeVisible();

  const reviewer = await browser.newPage();
  await signIn(reviewer, 'reviewer');
  await openByCompany(reviewer, 'Example Engineering Co.', 'en', 'queue');
  expect(reviewer.url()).toBe(url);
  await expect(reviewer.getByTestId('assign-save')).toHaveCount(0); // cannot reassign
  await reviewer.getByTestId('tab-notes').click();
  await expect(reviewer.getByTestId('note-input')).toBeVisible(); // but may add internal notes

  const outsider = await browser.newPage();
  await signIn(outsider, 'reviewer2');
  const res = await outsider.goto(url);
  expect(res?.status()).toBe(404);
  await expect(outsider.getByTestId('state-not-found')).toBeVisible();

  const owner = await browser.newPage();
  await signIn(owner, 'owner');
  await owner.goto('/en/admin/audit?category=request');
  await expect(owner.getByTestId('audit-table')).toContainText('Assignment changed');
  await expect(owner.getByTestId('audit-table')).toContainText('Test Reviewer');
  for (const p of [manager, reviewer, outsider, owner]) await p.close();
});

test('A6 direct requests, changed IDs, exports and downloads are denied on the server', async ({ browser, baseURL }) => {
  const anon = await browser.newPage();
  const redirect = await anon.request.get('/en/admin/requests', { maxRedirects: 0 });
  expect(redirect.status()).toBe(307);
  expect(redirect.headers()['location']).toContain('/en/admin/sign-in');
  expect((await anon.request.post('/api/admin/requests', { data: { view: 'inbox', query: {} }, headers: { origin: baseURL! } })).status()).toBe(401);
  expect((await anon.request.post('/api/admin/export', { data: { scope: 'filtered', query: {} }, headers: { origin: baseURL! } })).status()).toBe(401);
  expect((await anon.request.get(`/api/admin/files/upl_000000000000000000000000?token=x`)).status()).toBe(404);
  // Cross-site requests with a valid session are refused too (CSRF).
  const owner = await browser.newPage();
  await signIn(owner, 'owner');
  expect((await owner.request.post('/api/admin/requests', { data: {}, headers: { origin: 'https://evil.example' } })).status()).toBe(403);

  const outsider = await browser.newPage();
  await signIn(outsider, 'reviewer2');
  const list = await (await outsider.request.post('/api/admin/requests', { data: { view: 'inbox', query: {} }, headers: { origin: baseURL! } })).json();
  expect(list.total).toBe(0);
  expect((await outsider.request.post('/api/admin/export', { data: { scope: 'filtered', query: {} }, headers: { origin: baseURL! } })).status()).toBe(403);
  for (const path of ['/en/admin/team', '/en/admin/settings', '/en/admin/audit']) {
    await outsider.goto(path);
    await expect(outsider.getByTestId('state-forbidden')).toBeVisible();
  }
  // Honest empty states for someone with nothing assigned (no unauthorized counts leak).
  await outsider.goto('/en/admin/queue');
  await expect(outsider.getByTestId('inbox-empty')).toContainText('Nothing is assigned to you.');
  await outsider.goto('/ar/admin');
  await expect(outsider.getByTestId('stat-new').locator('.adm-stat__value')).toHaveText('0');
  await expect(outsider.getByText('لا توجد طلبات في هذه الفترة.').first()).toBeVisible();
  expect((await outsider.goto(`/en/admin/requests/${randomUUID()}`))?.status()).toBe(404);
  expect((await outsider.goto('/en/admin/requests/not-a-real-id'))?.status()).toBe(404);

  // Read-only: can open an assigned record, but has no note, status or send controls.
  const readOnly = await browser.newPage();
  await signIn(readOnly, 'readonly');
  await readOnly.goto('/en/admin/requests');
  await readOnly.getByTestId('request-link').first().click();
  await expect(readOnly.getByTestId('status-form')).toHaveCount(0);
  await readOnly.getByTestId('tab-notes').click();
  await expect(readOnly.getByTestId('note-input')).toHaveCount(0);
  await expect(readOnly.getByText('You can read notes but not add them.')).toBeVisible();
  for (const p of [anon, owner, outsider, readOnly]) await p.close();
});

test('A15 sign-out and revocation end access at once, including stale tabs and file links', async ({ browser, baseURL }) => {
  // Stale private file link after sign-out.
  const owner = await browser.newPage();
  await signIn(owner, 'owner');
  await openByReference(owner, 'ZNT-2026-0042');
  await owner.getByTestId('tab-files').click();
  if (await owner.getByTestId('file-release').count()) {
    await owner.getByTestId('file-release').click();
    await owner.getByTestId('release-confirm').click();
  }
  const linkRequest = owner.waitForRequest(/\/api\/admin\/files\//);
  const download = owner.waitForEvent('download');
  await owner.getByTestId('file-download').click();
  const fileUrl = (await linkRequest).url();
  await download;
  await signOut(owner);
  const stale = await owner.request.get(fileUrl);
  expect(stale.status()).toBe(401);
  expect(await stale.text()).not.toContain('%PDF');

  // Revocation: the reviewer's open tab loses access on its next request.
  const reviewer = await browser.newPage();
  await signIn(reviewer, 'reviewer');
  await reviewer.goto('/en/admin/queue');
  const admin = await browser.newPage();
  await signIn(admin, 'owner');
  await admin.goto('/en/admin/team');
  const row = admin.getByTestId('team-table').locator('tr', { hasText: 'reviewer@example.invalid' });
  await row.getByRole('button', { name: 'Revoke access' }).click();
  await admin.getByTestId('revoke-confirm').click();
  await expect(row).toContainText('Revoked');
  const api = await reviewer.request.post('/api/admin/requests', { data: { view: 'queue', query: {} }, headers: { origin: baseURL! } });
  expect(api.status()).toBe(401);
  await reviewer.reload();
  await expect(reviewer).toHaveURL(/\/en\/admin\/sign-in/);
  // Revoked accounts cannot sign back in.
  await reviewer.locator('input[type=email]').fill('reviewer@example.invalid');
  await reviewer.locator('input[type=password]').fill(creds('reviewer').password);
  await reviewer.getByTestId('sign-in-submit').click();
  await expect(reviewer.getByTestId('sign-in-error')).toContainText('does not have dashboard access');
  // Restore for later journeys.
  await row.getByRole('button', { name: 'Restore access' }).click();
  await expect(row).toContainText('Active');
  for (const p of [owner, reviewer, admin]) await p.close();
});

test('SEC-01 dashboard pages carry a strict per-request nonce policy and run without CSP violations', async ({ browser }) => {
  const anon = await browser.newPage();
  const first = await anon.request.get('/en/admin/sign-in');
  const second = await anon.request.get('/en/admin/sign-in');
  const policy = first.headers()['content-security-policy'] ?? '';
  const nonce = /'nonce-([^']+)'/.exec(policy)?.[1];
  expect(nonce, 'nonce present').toBeTruthy();
  expect(policy).toContain("'strict-dynamic'");
  expect(policy).toContain("frame-ancestors 'none'");
  expect(policy).toContain("object-src 'none'");
  expect(policy).not.toContain("'unsafe-inline' 'strict-dynamic'");
  expect(policy).not.toMatch(/script-src[^;]*'unsafe-eval'/);
  expect(/'nonce-([^']+)'/.exec(second.headers()['content-security-policy'] ?? '')?.[1]).not.toBe(nonce); // fresh per request
  // Next.js applied the nonce to its scripts; the only inline script without it is allowed by hash.
  const html = await first.text();
  const scripts = html.match(/<script\b[^>]*>/g) ?? [];
  expect(scripts.length).toBeGreaterThan(2);
  for (const tag of scripts) {
    if (tag.includes('application/ld+json')) continue;
    if (!tag.includes(`nonce="${nonce}"`)) expect(html).toContain("document.documentElement.classList.add('js')");
  }
  // A client-supplied policy is never trusted.
  const forged = await anon.request.get('/en/admin/sign-in', { headers: { 'content-security-policy': "script-src 'nonce-attacker'" } });
  expect(await forged.text()).not.toContain('nonce="attacker"');
  await anon.close();

  // Signed-in screens (inbox, request detail with tabs, team, settings, account) run without violations.
  const page = await browser.newPage();
  const violations = await collectCspViolations(page);
  await signIn(page, 'owner');
  for (const path of ['', '/requests', '/team', '/settings', '/audit', '/account']) await page.goto(`/en/admin${path}`);
  await openByReference(page, 'ZNT-2026-0042', 'ar');
  for (const tab of ['files', 'notes', 'communication', 'activity']) await page.getByTestId(`tab-${tab}`).click();
  expect(violations).toEqual([]);
  await page.close();
});
