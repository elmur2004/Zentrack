/**
 * Dashboard screenshots with SYNTHETIC data (run against the isolated test server):
 *   node scripts/e2e-admin-server.mjs   (separate terminal; fresh seed)
 *   node scripts/admin-screenshots.mjs [outDir]
 * Writes EN/AR overview, inbox, request detail, Partners & careers, settings and mobile states.
 * The partner enquiry and career application are created through the public form endpoint with
 * fictional data. No real data is involved.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';

const BASE = process.env.ADMIN_BASE ?? 'http://localhost:3006';
const OUT = process.argv[2] ?? 'docs/screenshots/admin';
mkdirSync(OUT, { recursive: true });
const creds = JSON.parse(readFileSync('.data/e2e/credentials.json', 'utf8')).accounts;

const browser = await chromium.launch();
async function signedIn(viewport, locale = 'en') {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${BASE}/${locale}/admin/sign-in`);
  await page.locator('input[type=email]').fill(creds.owner.email);
  await page.locator('input[type=password]').fill(creds.owner.password);
  await page.getByTestId('sign-in-submit').click();
  await page.waitForURL(new RegExp(`/${locale}/admin$`));
  return { context, page };
}
async function detailHref(page, reference) {
  await page.goto(`${BASE}/en/admin/requests`);
  await page.getByTestId('inbox-search').fill(reference);
  const link = page.getByTestId('request-link').filter({ hasText: reference });
  await link.waitFor();
  // "/en/admin/requests/<id>" → "/requests/<id>" (re-prefixed per locale below)
  return (await link.getAttribute('href')).replace(/^\/en\/admin/, '');
}

const shots = [];
// Synthetic partner enquiry and career application through the public endpoint (live test server).
async function submit(type, locale, values) {
  const res = await fetch(`${BASE}/api/enquiries`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: BASE },
    body: JSON.stringify({ type, locale, idempotencyKey: `shot-${type}-${Date.now()}-abcdef`, values, context: { page: `/${locale}/${type === 'career' ? 'careers' : 'partners'}` } }),
  });
  const body = await res.json();
  if (!body.reference) throw new Error(`${type} submission failed: ${res.status}`);
  return body.reference;
}
const partnerRef = await submit('partner', 'en', {
  name: 'Partner Example (test)',
  company: 'Example Survey Co (test data)',
  email: 'partner@example.invalid',
  phone: '',
  country: 'SA',
  partnerType: 'survey',
  details: 'Fictional partner enquiry for screenshots: survey teams for utility corridors. Test data only.',
  privacy: true,
});
const careerRef = await submit('career', 'ar', {
  name: 'مهندس تجريبي',
  email: 'applicant@example.invalid',
  discipline: 'bim-coordinator',
  experience: '6',
  portfolio: 'https://portfolio.example.invalid/work',
  cv: '',
  privacy: true,
});
const { context, page } = await signedIn({ width: 1440, height: 900 });
const detail = await detailHref(page, 'ZNT-2026-0042');
for (const locale of ['en', 'ar']) {
  await page.goto(`${BASE}/${locale}/admin`);
  await page.screenshot({ path: `${OUT}/overview-${locale}.png`, fullPage: true });
  await page.goto(`${BASE}/${locale}/admin/requests`);
  await page.screenshot({ path: `${OUT}/inbox-${locale}.png`, fullPage: true });
  await page.goto(`${BASE}/${locale}/admin${detail}`);
  await page.screenshot({ path: `${OUT}/detail-${locale}.png`, fullPage: true });
  await page.goto(`${BASE}/${locale}/admin${detail}?tab=communication`);
  await page.screenshot({ path: `${OUT}/detail-communication-${locale}.png`, fullPage: true });
  shots.push(`overview-${locale}`, `inbox-${locale}`, `detail-${locale}`, `detail-communication-${locale}`);
}
async function applicationHref(reference) {
  await page.goto(`${BASE}/en/admin/applications`);
  await page.getByTestId('apps-search').fill(reference);
  const link = page.getByTestId('apps-table').getByRole('link', { name: reference });
  await link.waitFor();
  return (await link.getAttribute('href')).replace(/^\/en\/admin/, '');
}
const partnerHref = await applicationHref(partnerRef);
const careerHref = await applicationHref(careerRef);
for (const locale of ['en', 'ar']) {
  await page.goto(`${BASE}/${locale}/admin/applications`);
  await page.getByTestId('apps-count').waitFor();
  await page.screenshot({ path: `${OUT}/applications-${locale}.png`, fullPage: true });
  shots.push(`applications-${locale}`);
}
await page.goto(`${BASE}/en/admin${partnerHref}`);
await page.screenshot({ path: `${OUT}/application-partner-en.png`, fullPage: true });
await page.goto(`${BASE}/ar/admin${careerHref}`);
await page.screenshot({ path: `${OUT}/application-career-ar.png`, fullPage: true });
shots.push('application-partner-en', 'application-career-ar');
// Contact details as an owner would type them (fictional, not saved).
await page.goto(`${BASE}/en/admin/settings`);
await page.getByTestId('contact-email').fill('office@example.invalid');
await page.getByTestId('contact-phone').fill('+20 2 1234 5678');
await page.getByTestId('contact-linkedin').fill('https://www.linkedin.com/company/example-test');
await page.getByTestId('contacts-settings').screenshot({ path: `${OUT}/settings-contacts-en.png` });
await page.locator('#website-forms').screenshot({ path: `${OUT}/settings-forms-en.png` });
await page.getByTestId('retention').screenshot({ path: `${OUT}/settings-retention-en.png` });
shots.push('settings-contacts-en', 'settings-forms-en', 'settings-retention-en');
await page.goto(`${BASE}/en/admin/team`);
await page.screenshot({ path: `${OUT}/team-en.png`, fullPage: true });
await page.goto(`${BASE}/ar/admin/settings`);
await page.screenshot({ path: `${OUT}/settings-ar.png`, fullPage: true });
shots.push('team-en', 'settings-ar');
await context.close();

for (const locale of ['en', 'ar']) {
  const m = await signedIn({ width: 390, height: 844 }, locale);
  await m.page.goto(`${BASE}/${locale}/admin/requests`);
  await m.page.screenshot({ path: `${OUT}/mobile-inbox-${locale}.png` });
  await m.page.goto(`${BASE}/${locale}/admin${detail}`);
  await m.page.screenshot({ path: `${OUT}/mobile-detail-${locale}.png` });
  await m.page.locator('.adm-top__menu').click();
  await m.page.waitForTimeout(300);
  await m.page.screenshot({ path: `${OUT}/mobile-menu-${locale}.png` });
  shots.push(`mobile-inbox-${locale}`, `mobile-detail-${locale}`, `mobile-menu-${locale}`);
  await m.context.close();
}
const anon = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const ap = await anon.newPage();
for (const locale of ['en', 'ar']) {
  await ap.goto(`${BASE}/${locale}/admin/sign-in`);
  await ap.screenshot({ path: `${OUT}/sign-in-${locale}.png` });
  shots.push(`sign-in-${locale}`);
}
await browser.close();
console.log(`✓ ${shots.length} screenshots in ${OUT}`);
