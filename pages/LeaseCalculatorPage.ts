import { BasePage } from './BasePage';
import { Page, Locator, expect } from '@playwright/test';
import { HEADERS, COMPANY, EMAIL_DOMAINS } from '../utils/constants';

export class LeaseCalculatorPage extends BasePage {
  readonly aanbetalingInput: Locator;
  readonly looptijdInput: Locator;
  readonly requestQuoteBtn: Locator;
  readonly companyInput: Locator;
  readonly emailInput: Locator;
  readonly openCalculatorBtn: Locator;
  readonly berekenBtn: Locator;
  readonly monthlyPrice: Locator;
  


  constructor(page: Page) {
    super(page);

    
    
    this.openCalculatorBtn = page.locator('[data-hook="lease-offer-button"]');
    this.companyInput = page.locator('[data-hook="company-search-input"]');
    this.emailInput =  page.locator('[data-hook="contact-person-email"]');
    this.aanbetalingInput =  page.locator('[data-hook="downpayment-input"]');
    this.looptijdInput =  page.locator('[data-hook="tenor-input"]');
    this.berekenBtn =  page.locator('[data-hook="go-to-lease-price"]');
    this.monthlyPrice =  page.locator('[data-hook="monthly-payment"]');
    this.requestQuoteBtn =  page.locator('[data-hook="go-to-advice-page"]');
  }

  async enableCalculatorBypass() {
  await this.page.route('**/lease-calculator/**', async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        'x-vercel-protection-bypass': 'VreVj3DC9fVuVRcQzUoz3rtAgitcbX6M',
      },
    });
  });
}

  // Open the lease calculator section
  async openCalculator() {
    await this.enableCalculatorBypass(); 
  const btn = this.openCalculatorBtn.first();
  await btn.waitFor({ state: 'visible', timeout: 5000 });
  await btn.click();
}

  // Fill company + email
  async fillCompanyAndEmail() {
     await this.page.locator('[data-hook="company-search-input"]').fill(COMPANY.kvk);
    await this.page.locator('text=Beequip').first().click();   // fallback: click the text
   await this.emailInput.fill(`qa.lease${EMAIL_DOMAINS[0]}`);
}

  // Click "Bereken je leaseprijs"
async calculateLease() {
  await this.berekenBtn.click();

  
  await this.page.waitForTimeout(10000);

  
  //await this.page.locator('[data-hook="downpayment-input"]').fill('35000');
 

}


async getMonthlyPrice(): Promise<number> {
  await this.monthlyPrice.waitFor({ state: 'visible', timeout: 20000 });
  const text = (await this.monthlyPrice.innerText()).trim();
  const m = text.match(/[\d.,]+/);
  const num = m ? Number(m[0].replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')) : NaN;
  if (Number.isNaN(num)) throw new Error(`Monthly price not found in: "${text}"`);
  return num;
}

  // Adjust parameters (aanbetaling & looptijd)
  async adjustLease(downPayment: string, term: string) {
    const before = await this.getMonthlyPrice();

  // Fill down payment and blur with Tab
  const downInput = this.page.locator('[data-hook="downpayment-input"]');
  await downInput.fill(downPayment);
  await downInput.press('Tab');

  // Fill term and blur with Tab
  const termInput = this.page.locator('[data-hook="tenor-input"]');
  await termInput.fill(term);
  await termInput.press('Tab');

  // Wait until monthly price actually changes from "before"
  await this.page.waitForFunction((oldVal) => {
    const el = document.querySelector('[data-hook="monthly-payment"]');
    if (!el) return false;
    const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
    const m = txt.match(/[\d.,]+/);
    if (!m) return false;
    const val = Number(m[0].replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
    return !Number.isNaN(val) && val !== oldVal;
  }, before, { timeout: 15000 });

  const after = await this.getMonthlyPrice();
  return { before, after };
}



  // Request a quote
async requestQuote() {
  await this.requestQuoteBtn.click();

  // Verify confirmation message in UI
  await expect(
    this.page.getByText(/Geen zorgen, je zit nog nergens aan vast/i)
  ).toBeVisible({ timeout: 10_000 });
}


  //  Full flow shortcut
  async runFlow() {
    await this.openCalculator();
    await this.fillCompanyAndEmail();
    await this.calculateLease();

     const { before, after } = await this.adjustLease('2000', '60');
  

   // expect(after).toBeLessThan(before);

    await this.requestQuote();
  }
}
