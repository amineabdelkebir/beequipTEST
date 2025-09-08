// tests/beequip.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { MarketplacePage } from '../pages/MarketplacePage';
import { LeaseCalculatorPage } from '../pages/LeaseCalculatorPage';

test('Beequip full user journey', async ({ page }) => {
  // --- Scoped header ONLY for calculator calls (Option B) ---
  // Make sure this runs BEFORE any calculator request happens.
  await page.route('**/lease-calculator/**', async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        'x-vercel-protection-bypass': 'VreVj3DC9fVuVRcQzUoz3rtAgitcbX6M',
      },
    });
  });

  // Step 1: Open homepage
  const loginPage = new LoginPage(page);
  await loginPage.openHome();
  await expect(page).toHaveTitle(/Beequip MKB Equipment Lease/i);

  // Step 2: Go to Marketplace
  const marketplacePage = new MarketplacePage(page);
  await marketplacePage.openMarketplace();

  // Step 3: Filter trucks (includes Bouwjaar, Kilometerstand, 6 cilinders, Schuifzeilen)
  await marketplacePage.filterTruck();

  // Step 4: Select a truck ad
  await marketplacePage.selectTruckAd();

  // Step 5: Use Lease Calculator
  const leasePage = new LeaseCalculatorPage(page);
  await leasePage.openCalculator();

 
  await leasePage.fillCompanyAndEmail();

  await leasePage.calculateLease();

  // Step 6: Adjust lease parameters and verify price decreases (or stays same due to rounding)
  const before = await leasePage.getMonthlyPrice();

  await leasePage.adjustLease('2000', '60'); // your existing method; make sure it blurs with Tab

  // Wait until price actually changes from "before"
  await expect
    .poll(async () => leasePage.getMonthlyPrice(), {
      timeout: 15_000,
      intervals: [300, 500, 800],
    })
    .not.toBe(before);

  const after = await leasePage.getMonthlyPrice();


  /* to complete 
  // Allow equality in case UI rounds to the nearest euro
 // expect(after).toBeLessThanOrEqual(before);
*/
 
  // Step 7: Request a quote (confirmation in UI)
  await leasePage.requestQuote();


  // -------- Stretch Goal 4: Assert email via Mailinator (UI approach) --------
  // Put this RIGHT AFTER requestQuote(). Use a public inbox like qa.lease@mailinator.com
  const INBOX = 'qa.lease'; // => qa.lease@mailinator.com
  await page.goto(`https://www.mailinator.com/v4/public/inboxes.jsp?to=${INBOX}`);

  // Wait for the newest message to arrive (Mailinator UI can vary; try a couple selectors)
  const firstMsg = page.locator('.inbox-list-item, .all_message-min_item').first();
  await firstMsg.waitFor({ timeout: 60_000 });
  await firstMsg.click();

  // Read the message body (Mailinator renders the HTML email inside an iframe)
  const bodyFrame = page.frameLocator('#html_msg_body, iframe#iframe-msg-body');
  const bodyText = await bodyFrame.locator('body').innerText();

  // Basic assertion on content — adapt to your real subject/body
  expect(bodyText).toMatch(/Offerte|Quote|Beequip/i);

  
});
