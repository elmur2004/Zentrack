import { defineConfig, devices } from '@playwright/test';

/** Tests for the PRIVATE review build. Start it first: npm run dev:review (port 3100). */
export default defineConfig({
  testDir: '.',
  timeout: 90_000,
  workers: 2,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:3100', ...devices['Desktop Chrome'] },
});
