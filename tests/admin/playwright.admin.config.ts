import { defineConfig, devices } from '@playwright/test';

/**
 * Dashboard end-to-end tests against the PRODUCTION build (`npm run build` first).
 * The web server is an isolated test instance (scripts/e2e-admin-server.mjs): fresh embedded
 * database with synthetic data, FORM_MODE=live, local test email outbox, random auth secret.
 * Tests share one database, so they run serially in a fixed order.
 */
const PORT = Number(process.env.ADMIN_E2E_PORT ?? 3006);

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.ts/,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: '../../playwright-report/admin' }]],
  outputDir: '../../test-results/admin',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    // Read-only cross-browser journeys first, on the fresh database.
    { name: 'admin-firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } }, testMatch: /07-cross-browser\.spec\.ts/ },
    { name: 'admin-webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } }, testMatch: /07-cross-browser\.spec\.ts/ },
    {
      name: 'admin-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      testIgnore: /07-cross-browser\.spec\.ts/,
      dependencies: ['admin-firefox', 'admin-webkit'],
    },
  ],
  webServer: {
    command: 'node scripts/e2e-admin-server.mjs',
    cwd: '../..',
    url: `http://localhost:${PORT}/en/admin/sign-in`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: { ADMIN_E2E_PORT: String(PORT) },
  },
});
