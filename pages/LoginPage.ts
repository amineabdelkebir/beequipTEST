import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { BASE_URL, BASIC_AUTH } from '../utils/constants';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openHome() {
    // Convert username:password to Base64 for Basic Auth
    const authHeader = Buffer.from(`${BASIC_AUTH.username}:${BASIC_AUTH.password}`).toString('base64');

    // Set the header
    await this.page.setExtraHTTPHeaders({
      Authorization: `Basic ${authHeader}`,
    });

    // Open the staging sitego ahead next
    
    await this.page.goto(BASE_URL);
  }
}
