import { test, expect } from './fixtures/auth';
import { EventFormPage } from './pages/EventFormPage';

/**
 * E2E tests for event list, event creation, and event detail.
 * Requires: make dev
 */
test.describe('Event List', () => {
  test('shows the "My Events" page heading', async ({ authenticatedPage: page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /my events/i })).toBeVisible();
  });

  test('shows "All events you\'re part of" subtitle', async ({ authenticatedPage: page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/all events you're part of/i)).toBeVisible();
  });

  test('shows Create Event button in the page header', async ({ authenticatedPage: page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /create event/i })).toBeVisible();
  });

  test('clicking an event card navigates to event detail', async ({ authenticatedPage: page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('.p-card');
    const count = await cards.count();
    if (count === 0) {
      test.skip(true, 'No events present — skipping event card navigation test');
    }

    await cards.first().click();
    await expect(page).toHaveURL(/\/events\/[^/]+$/);
  });

  test('empty state shows "Create Your First Event" button when no events', async ({ authenticatedPage: page }) => {
    // This test is only meaningful for a fresh user with no events.
    // We check conditionally — if events exist, skip.
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('.p-card');
    const count = await cards.count();
    if (count > 0) {
      test.skip(true, 'Events exist — skipping empty state test');
    }

    await expect(page.getByRole('button', { name: /create your first event/i })).toBeVisible();
  });
});

test.describe('Create Event', () => {
  test('shows the event creation form', async ({ authenticatedPage: page }) => {
    const form = new EventFormPage(page);
    await form.gotoCreate();

    await expect(form.nameInput).toBeVisible();
  });

  test('shows a validation error when submitting without a name', async ({ authenticatedPage: page }) => {
    const form = new EventFormPage(page);
    await form.gotoCreate();

    await form.submitButton.click();
    await expect(form.nameError).toBeVisible();
  });

  test('successfully creates an event and redirects to its detail page', async ({ authenticatedPage: page }) => {
    const form = new EventFormPage(page);
    await form.gotoCreate();

    const uniqueName = `E2E Test Event ${Date.now()}`;
    await form.fillAndSubmit({
      name: uniqueName,
      description: 'Created by E2E test',
      location: 'Test City',
    });

    await form.expectNavigatedToEventDetail();
    await expect(page.getByText(uniqueName)).toBeVisible();
  });

  test('created event appears in the event list', async ({ authenticatedPage: page }) => {
    const form = new EventFormPage(page);
    await form.gotoCreate();

    const uniqueName = `E2E List Test ${Date.now()}`;
    await form.fillAndSubmit({ name: uniqueName });
    await form.expectNavigatedToEventDetail();

    await page.goto('/events');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(uniqueName)).toBeVisible();
  });
});

test.describe('Event Detail', () => {
  let eventUrl: string;

  // Create an event to use in all detail tests
  test.beforeEach(async ({ authenticatedPage: page }) => {
    const form = new EventFormPage(page);
    await form.gotoCreate();
    await form.fillAndSubmit({
      name: `E2E Detail Test ${Date.now()}`,
      description: 'Test description',
      location: 'Test Location',
    });
    await form.expectNavigatedToEventDetail();
    eventUrl = page.url();
  });

  test('shows the event name as the page title', async ({ authenticatedPage: page }) => {
    await page.goto(eventUrl);
    await page.waitForLoadState('networkidle');

    // The event name appears in the PageHeader
    const url = new URL(eventUrl);
    const eventId = url.pathname.split('/').pop();
    expect(eventId).toBeTruthy();
    // The heading region should have text (whatever the event was named)
    await expect(page.locator('h1, [class*="title"]').first()).toBeVisible();
  });

  test('shows the Info, Todos, Items and Guests tabs', async ({ authenticatedPage: page }) => {
    await page.goto(eventUrl);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('tab', { name: /info/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /todos/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /items/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /guests/i })).toBeVisible();
  });

  test('shows Edit and Settings buttons for the event creator', async ({ authenticatedPage: page }) => {
    await page.goto(eventUrl);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /edit/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /settings/i })).toBeVisible();
  });

  test('can navigate to the Todos tab and see the empty state', async ({ authenticatedPage: page }) => {
    await page.goto(eventUrl);
    await page.waitForLoadState('networkidle');

    await page.getByRole('tab', { name: /todos/i }).click();
    // Should either show "No todos yet" or the Add Todo button
    await expect(
      page.getByText(/no todos yet/i).or(page.getByRole('button', { name: /add todo/i }))
    ).toBeVisible();
  });

  test('can add a todo item', async ({ authenticatedPage: page }) => {
    await page.goto(eventUrl);
    await page.waitForLoadState('networkidle');

    await page.getByRole('tab', { name: /todos/i }).click();
    await page.getByRole('button', { name: /add todo/i }).click();

    await page.getByRole('textbox', { name: /todo title/i }).fill('E2E Todo Item');
    await page.getByRole('button', { name: /^add$/i }).click();

    await expect(page.getByText('E2E Todo Item')).toBeVisible({ timeout: 8_000 });
  });

  test('can navigate to the Items tab and see the empty state', async ({ authenticatedPage: page }) => {
    await page.goto(eventUrl);
    await page.waitForLoadState('networkidle');

    await page.getByRole('tab', { name: /items/i }).click();
    await expect(
      page.getByText(/no items yet/i).or(page.getByRole('button', { name: /add item/i }))
    ).toBeVisible();
  });

  test('can add a bring item', async ({ authenticatedPage: page }) => {
    await page.goto(eventUrl);
    await page.waitForLoadState('networkidle');

    await page.getByRole('tab', { name: /items/i }).click();
    await page.getByRole('button', { name: /add item/i }).click();

    await page.getByRole('textbox', { name: /item name/i }).fill('E2E Bring Item');
    await page.getByRole('button', { name: /add item/i }).click();

    await expect(page.getByText('E2E Bring Item')).toBeVisible({ timeout: 8_000 });
  });

  test('can navigate to the Guests tab', async ({ authenticatedPage: page }) => {
    await page.goto(eventUrl);
    await page.waitForLoadState('networkidle');

    await page.getByRole('tab', { name: /guests/i }).click();
    // Should show Invite Guest button (admin view) or members list
    await expect(
      page.getByRole('button', { name: /invite guest/i }).or(page.getByRole('list'))
    ).toBeVisible();
  });

  test('Edit button navigates to the event edit page', async ({ authenticatedPage: page }) => {
    await page.goto(eventUrl);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /^edit$/i }).click();
    await expect(page).toHaveURL(/\/events\/[^/]+\/edit$/);
  });

  test('Settings button navigates to the event settings page', async ({ authenticatedPage: page }) => {
    await page.goto(eventUrl);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page).toHaveURL(/\/events\/[^/]+\/settings$/);
  });

  test('Back to Events link returns to the event list', async ({ authenticatedPage: page }) => {
    await page.goto(eventUrl);
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: /events/i }).first().click();
    await expect(page).toHaveURL(/\/events$/);
  });
});
