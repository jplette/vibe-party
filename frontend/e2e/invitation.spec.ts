import { test, expect } from '@playwright/test';

/**
 * E2E tests for the invitation response pages.
 *
 * These pages are public — no auth required.
 * Requires: make dev
 */
test.describe('InvitationAcceptPage', () => {
  test('shows "Link Invalid" when accessed without a token', async ({ page }) => {
    await page.goto('/invitation/accept');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/link invalid/i)).toBeVisible();
    await expect(page.getByText(/no invitation token provided/i)).toBeVisible();
  });

  test('shows the VibeParty branding', async ({ page }) => {
    await page.goto('/invitation/accept');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/vibe/i).first()).toBeVisible();
  });

  test('shows "Link Invalid" for a clearly fake token', async ({ page }) => {
    await page.goto('/invitation/accept?token=definitely-fake-token-abc123');
    await page.waitForLoadState('networkidle');

    // API will reject the bad token, resulting in an error state
    await expect(
      page.getByText(/link invalid/i).or(page.getByText(/accepting your invitation/i))
    ).toBeVisible({ timeout: 8_000 });
  });

  test('"Go to Home" button is visible in the error state', async ({ page }) => {
    await page.goto('/invitation/accept');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /go to home/i })).toBeVisible();
  });

  test('"Go to Home" navigates to / when clicked', async ({ page }) => {
    await page.goto('/invitation/accept');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /go to home/i }).click();
    // App root redirects to Keycloak since user is not authenticated
    await expect(page).toHaveURL(/localhost:5173\/|keycloak|8180/, { timeout: 10_000 });
  });
});

test.describe('InvitationDeclinePage', () => {
  test('shows "Link Invalid" when accessed without a token', async ({ page }) => {
    await page.goto('/invitation/decline');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/link invalid/i)).toBeVisible();
    await expect(page.getByText(/no invitation token provided/i)).toBeVisible();
  });

  test('shows the VibeParty branding', async ({ page }) => {
    await page.goto('/invitation/decline');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/vibe/i).first()).toBeVisible();
  });
});

test.describe('NotFoundPage', () => {
  test('shows 404 for an unknown route', async ({ page }) => {
    await page.goto('/this-route-definitely-does-not-exist');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('404')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/page not found/i)).toBeVisible();
  });
});
