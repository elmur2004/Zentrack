import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against the PRODUCTION build (`npm run build` first).
 * The web server starts with FORM_MODE=preview so submissions use the honest test adapter.
 */
const PORT = Number(process.env.E2E_PORT ?? 3005);

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: 4,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /cross-browser|screenshots/ },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testMatch: /cross-browser\.spec/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testMatch: /cross-browser\.spec/ },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'] }, testMatch: /cross-browser\.spec/ },
    { name: 'screenshots', use: { ...devices['Desktop Chrome'] }, testMatch: /screenshots\.spec/ },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/en`,
    reuseExistingServer: true,
    timeout: 120_000,
    // Test server only: raise per-client rate limits so the whole suite can run from one machine.
    // DATABASE_DRIVER=none: the public suite never opens the local development database
    // (.env.local), so its pages show the no-database fallback (no contact channels).
    env: { FORM_MODE: 'preview', ENQUIRY_RATE_LIMIT: '500', UPLOAD_RATE_LIMIT: '500', DATABASE_DRIVER: 'none', DATABASE_URL: '', JOBS_SCHEDULER: 'off' },
  },
});
