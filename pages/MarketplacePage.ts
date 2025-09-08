// MarketplacePage.ts
import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';


const normalize = (s: string) => s.replace(/\D/g, '');

async function setInputHard(input: import('@playwright/test').Locator, value: string) {
  await input.scrollIntoViewIfNeeded();
  await input.focus();
  await input.press(process.platform === 'darwin' ? 'Meta+a' : 'Control+a');
  await input.press('Delete');
  await input.type(value, { delay: 10 }); 
  await input.blur();                     
  
  await input.evaluate(el => {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

async function setThenApply(
  section: import('@playwright/test').Locator,
  input: import('@playwright/test').Locator,
  value: string
) {
  
  for (let attempt = 0; attempt < 2; attempt++) {
    await setInputHard(input, value);

    const got = await input.inputValue();
    if (normalize(got) !== normalize(value)) {
      if (!got) continue; 
    }

    // Click "OK/Apply" 
    const applyBtn = section
      .getByRole('button', { name: /^(ok|apply|anwenden|übernehmen|appliquer|aplicar)$/i })
      .first()
      .or(section.locator('button:enabled').first());

    await applyBtn.click();

   
    const applied = await Promise.race([
      section
        .page()
        .locator('[data-hook="active-filter-chip"],[data-testid="active-filter-chip"],.filter-chip')
        .filter({ hasText: new RegExp(normalize(value)) })
        .first()
        .waitFor({ state: 'visible', timeout: 2000 })
        .then(() => true)
        .catch(() => false),
      section
        .page()
        .waitForFunction(v => location.search.includes(v), normalize(value), { timeout: 2000 })
        .then(() => true)
        .catch(() => false),
    ]);

    if (applied) return;
  }

  
  await section.page().waitForLoadState('networkidle').catch(() => {});
}

// --- Page Object ---
export class MarketplacePage extends BasePage {
  constructor(page: Page) {
    super(page);
    // Optional: sensible defaults
    this.page.setDefaultTimeout(10_000);
    this.page.setDefaultNavigationTimeout(30_000);
  }

  // Open the Marketplace page
  async openMarketplace() {
    await this.page.locator('a[target="_self"]', { hasText: 'Marktplaats' }).click();
  }

  // Apply filters for truck search
  async filterTruck() {
    // Open Vrachtwagen filter
    await this.page.click('h3 a[href="/marktplaats/vrachtwagen/"]');

    // ==== Schuifzeilen  ====
    await this.page.locator('button:has(span[data-hook="see-more-filter-items"])').click();
  
  await this.page.locator('span[data-hook="aggregation-label"]', { hasText: 'Schuifzeilen' }).click();
   
    

    // ==== Bouwjaar: 2018–2023 ====
    await this.page.getByText('Bouwjaar', { exact: true }).click();
    const yearSection = this.page.locator('fieldset:has(legend:has-text("Bouwjaar"))');

    const yearFrom = yearSection
      .locator(
        '[data-hook="aggregation-yearOfConstruction-from"] input, ' +
          'input[data-hook="aggregation-yearOfConstruction-from"], ' +
          '[data-hook="aggregation-yearOfConstruction-from"]'
      )
      .first();

    const yearTo = yearSection
      .locator(
        '[data-hook="aggregation-yearOfConstruction-to"] input, ' +
          'input[data-hook="aggregation-yearOfConstruction-to"], ' +
          '[data-hook="aggregation-yearOfConstruction-to"]'
      )
      .first();

    await setThenApply(yearSection, yearFrom, '2018');
    await setThenApply(yearSection, yearTo, '2023');

    // ==== Kilometerstand: < 300000 ====
    await this.page.getByText('Kilometerstand', { exact: true }).click();
    const kmSection = this.page.locator('fieldset:has(legend:has-text("Kilometerstand"))');

    const kmTo = kmSection
      .locator(
        '[data-hook="aggregation-usageInKilometers-to"] input, ' +
          'input[data-hook="aggregation-usageInKilometers-to"], ' +
          '[data-hook="aggregation-usageInKilometers-to"]'
      )
      .first();

    await setThenApply(kmSection, kmTo, '300000');

    // ==== Aantal cilinders: 6 ====
    await this.page.getByText('Aantal cilinders', { exact: true }).click();
    await this.page.click('a[href*="aantal-cilinders:6"]');
  }

  // Select the first truck ad from the filtered list
  async selectTruckAd() {
    await this.page.locator('(//article[@data-hook="object-card"])[1]').click();
  }
}
