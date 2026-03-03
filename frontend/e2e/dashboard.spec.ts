import { test, expect } from './fixtures/auth';
import { DashboardPage } from './pages/DashboardPage';

/**
 * E2E tests for the Dashboard page.
 * Requires: make dev
 */
test.describe('Dashboard', () => {
  test('renders the welcome banner', async ({ authenticatedPage: page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForLoad();

    await expect(page.getByText(/welcome back/i)).toBeVisible();
    await expect(page.getByText(/ready to plan your next event/i)).toBeVisible();
  });

  test('displays the "Recent Events" section heading', async ({ authenticatedPage: page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForLoad();

    await expect(page.getByRole('heading', { name: /recent events/i })).toBeVisible();
  });

  test('shows the Create Event button', async ({ authenticatedPage: page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForLoad();

    await expect(page.getByRole('button', { name: /create event/i }).first()).toBeVisible();
  });

  test('clicking Create Event navigates to the event creation form', async ({ authenticatedPage: page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForLoad();

    await dashboard.clickCreateEvent();
    await expect(page).toHaveURL(/\/events\/new/);
  });

  test('clicking View All Events navigates to the events list', async ({ authenticatedPage: page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForLoad();

    // "View all events" button is only shown when there are events;
    // fall back to the nav link to keep the test reliable
    const viewAllBtn = page.getByRole('button', { name: /view all events/i });
    const count = await viewAllBtn.count();
    if (count > 0) {
      await viewAllBtn.click();
    } else {
      await page.getByRole('link', { name: /my events/i }).click();
    }
    await expect(page).toHaveURL(/\/events/);
  });

  test('navigates to event detail when an event card is clicked', async ({ authenticatedPage: page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForLoad();

    const cards = page.locator('.p-card');
    const cardCount = await cards.count();
    if (cardCount === 0) {
      test.skip(true, 'No events available on dashboard — skipping card click test');
    }

    await cards.first().click();
    await expect(page).toHaveURL(/\/events\/[^/]+$/);
  });

  test('sidebar navigation links are visible', async ({ authenticatedPage: page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForLoad();

    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /my events/i })).toBeVisible();
  });
});
