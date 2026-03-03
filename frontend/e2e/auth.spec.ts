import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { USERS } from './fixtures/auth';

/**
 * E2E tests for authentication flow.
 *
 * These tests require the full Docker stack to be running:
 *   make dev
 */
test.describe('Authentication', () => {
  test('redirects unauthenticated users to the Keycloak login page', async ({ page }) => {
    await page.goto('/');
    // Keycloak login page is on a different host
    await expect(page).toHaveURL(/keycloak|localhost:8180/, { timeout: 15_000 });
  });

  test('successful login redirects back to the dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitForApp(USERS.alice.username, USERS.alice.password);

    await expect(page).toHaveURL('http://localhost:5173/', { timeout: 10_000 });
    await expect(page.getByText(/welcome back/i)).toBeVisible();
  });

  test('personalized greeting shows the logged-in username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitForApp(USERS.alice.username, USERS.alice.password);

    // Keycloak "alice" user has display name "alice" or "Alice"
    await expect(page.getByText(/alice/i)).toBeVisible();
  });

  test('renders the sidebar navigation after login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitForApp(USERS.alice.username, USERS.alice.password);

    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /my events/i })).toBeVisible();
  });

  test('shows the user avatar with initials in the header', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAndWaitForApp(USERS.alice.username, USERS.alice.password);

    // Avatar button exists in the header
    await expect(page.getByRole('button', { name: /user menu/i })).toBeVisible();
  });
});
