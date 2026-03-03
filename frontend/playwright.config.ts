import { defineConfig, devices } from '@playwright/test';

/**
 * Vibe Party E2E test configuration.
 *
 * Runs against the Vite dev server on port 5173.
 * Requires all Docker services to be running (`make dev`) before executing.
 *
 * Usage:
 *   npm run test:e2e              — run all E2E tests headless (Chromium)
 *   npm run test:e2e -- --headed  — run headed for local debugging
 *   npm run test:e2e -- --debug   — step-through debugger
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid auth state conflicts
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'e2e-report' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to add cross-browser coverage:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],
  // Do NOT use webServer here — the full Docker stack is required.
  // Run `make dev` before executing E2E tests.
});
