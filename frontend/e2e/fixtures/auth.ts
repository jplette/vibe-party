import { test as base, type Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * Seed user credentials (configured in Keycloak dev realm).
 */
export const USERS = {
  alice: { username: 'alice', password: 'alice123' },
  bob:   { username: 'bob',   password: 'bob123' },
} as const;

/**
 * Extended test fixture that injects an authenticated `page` for alice.
 *
 * Usage:
 *   import { test } from '../fixtures/auth';
 *   test('my test', async ({ authenticatedPage }) => { ... });
 */
type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitForApp(USERS.alice.username, USERS.alice.password);
    await use(page);
  },
});

export { expect } from '@playwright/test';
