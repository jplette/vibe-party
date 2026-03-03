import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Keycloak login page.
 *
 * Keycloak serves its own login UI at a separate origin (:8180).
 * After successful login it redirects back to the app.
 */
export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    // Keycloak login form field ids
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator('#kc-login');
    this.errorMessage = page.locator('.alert-error, #input-error');
  }

  /** Navigate to the app root, which will redirect to Keycloak login. */
  async goto() {
    await this.page.goto('/');
  }

  /** Fill in credentials and submit. Waits for the Keycloak form to appear. */
  async login(username: string, password: string) {
    await this.usernameInput.waitFor({ state: 'visible' });
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /** Complete the full login flow and wait for the app dashboard to appear. */
  async loginAndWaitForApp(username: string, password: string) {
    await this.goto();
    // Wait for redirect to Keycloak
    await this.page.waitForURL(/keycloak|localhost:8180/);
    await this.login(username, password);
    // Wait for redirect back to app
    await this.page.waitForURL('http://localhost:5173/**');
    await expect(this.page.getByText(/welcome back/i)).toBeVisible({ timeout: 10_000 });
  }
}
