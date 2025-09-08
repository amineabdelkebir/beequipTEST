import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Navigate to a URL
  async goto(url: string) {
    await this.page.goto(url);
  }

  // Click an element
  async click(locator: Locator) {
    await locator.click();
  }

  // Fill an input field
  async type(locator: Locator, text: string) {
    await locator.fill(text);
  }

  // Get text from an element
  async getText(locator: Locator) {
    return await locator.textContent();
  }

  // Check if element is visible
  async isVisible(locator: Locator) {
    return await locator.isVisible();
  }
}
