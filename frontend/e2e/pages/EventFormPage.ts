import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object Model for EventCreate and EventEdit forms.
 */
export class EventFormPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly locationInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly nameError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByLabel(/event name/i);
    this.descriptionInput = page.getByLabel(/description/i);
    this.locationInput = page.getByLabel(/location/i);
    this.submitButton = page.getByRole('button', { name: /create event|save changes/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
    this.nameError = page.getByText(/name is required/i);
  }

  async gotoCreate() {
    await this.page.goto('/events/new');
    await this.page.waitForLoadState('networkidle');
  }

  async fillAndSubmit(values: {
    name: string;
    description?: string;
    location?: string;
  }) {
    await this.nameInput.fill(values.name);
    if (values.description) {
      await this.descriptionInput.fill(values.description);
    }
    if (values.location) {
      await this.locationInput.fill(values.location);
    }
    await this.submitButton.click();
  }

  async expectNavigatedToEventDetail() {
    await expect(this.page).toHaveURL(/\/events\/[^/]+$/, { timeout: 10_000 });
  }
}
