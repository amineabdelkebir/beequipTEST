# Beequip End-to-End Tests (Playwright)

## Overview
This project contains automated Playwright tests that validate a **full Beequip user journey**:

1. Open the Beequip homepage  
2. Navigate to the **Marketplace**  
3. Filter **Vrachtwagens** by:
   - Body type: **Schuifzeilen**
   - Bouwjaar: **2018–2023**
   - Kilometerstand: **< 300.000 km**
   - Aantal cilinders: **6**
4. Select the first truck ad  
5. Open the **Lease Calculator**  
6. Search for the company **Beequip** (`KVK: 63204258`)  
7. Use an email with a safe domain (`@example.com` or `@mailinator.com`)  
8. Calculate a monthly lease price  
9. Adjust **aanbetaling** and **looptijd** to see the price update  
10. Request a quote and verify confirmation text:  
    ```
    Geen zorgen, je zit nog nergens aan vast.
    ```
11. *(Stretch)* Check the quote email in Mailinator  
12. *(Stretch)* Run **data-driven tests** with different `aanbetaling` and `looptijd` values  

## Requirements
- [Node.js](https://nodejs.org/) 18+  
- [Playwright](https://playwright.dev/) (installed via devDependencies)  

If Yarn is not available
## Setup
```bash
# Install dependencies
npm install


# Install Playwright browsers
npx playwright install

