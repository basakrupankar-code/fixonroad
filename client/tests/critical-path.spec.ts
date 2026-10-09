import { test, expect } from '@playwright/test';

test.describe('Critical Path', () => {
  test('User can select a service and proceed to checkout', async ({ page }) => {
    // 1. Visit Services Page
    await page.goto('/services');
    
    // 2. Select 'Flat Tire / Puncture Repair' (Wait for the grid to load and click the Book Now button)
    await page.waitForSelector('text=Flat Tire / Puncture Repair');
    await page.locator('text=Book Now').first().click();

    // 3. Verify Bottom Cart Tray Appears
    await expect(page.locator('text=Proceed to Checkout')).toBeVisible();

    // 4. Click Proceed to Checkout
    await page.locator('text=Proceed to Checkout').click();

    // 5. Verify redirection to auth (since user is not logged in)
    await expect(page).toHaveURL(/\/auth/);
  });
});
