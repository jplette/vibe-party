import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Dashboard page (/).
 */
export class DashboardPage {
  readonly page: Page;
  readonly greeting: Locator;
  readonly createEventButton: Locator;
  readonly viewAllButton: Locator;
  readonly statsSection: Locator;
  readonly recentEventsSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.greeting = page.getByText(/welcome back/i);
    this.createEventButton = page.getByRole('button', { name: /create event/i }).first();
    this.viewAllButton = page.getByRole('button', { name: /view all events/i });
    this.statsSection = page.locator('[class*="stats"]');
    this.recentEventsSection = page.getByRole('heading', { name: /recent events/i });
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForLoad() {
    await expect(this.greeting).toBeVisible({ timeout: 10_000 });
  }

  async clickCreateEvent() {
    await this.createEventButton.click();
    await this.page.waitForURL('**/events/new');
  }

  async clickViewAllEvents() {
    await this.viewAllButton.click();
    await this.page.waitForURL('**/events');
  }

  async getEventCardCount(): Promise<number> {
    return await this.page.locator('.p-card').count();
  }

  async clickFirstEventCard() {
    await this.page.locator('.p-card').first().click();
    await this.page.waitForURL(/\/events\/[^/]+$/);
  }
}
