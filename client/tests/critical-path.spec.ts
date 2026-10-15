import { test, expect } from '@playwright/test';

test.describe('Cart Access Control and RBAC (/cart)', () => {
  test('Unauthenticated user attempting to access /cart is redirected to signin with return URL', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/signin\?redirect=%2Fcart/);
  });

  test('Unauthenticated user clicking Book Now or Add to Cart is redirected to signin with return URL and intent cached', async ({ page }) => {
    // 1. Visit Services Page
    await page.goto('/services');

    // 2. Wait for services grid to load
    await page.waitForSelector('text=Flat Tire / Puncture Repair');

    // 3. Click Book Now
    await page.locator('text=Book Now').first().click();

    // 4. Verify redirected to signin with return URL
    await expect(page).toHaveURL(/\/signin\?redirect=%2Fcart/);

    // 5. Verify intent cached in sessionStorage
    const intent = await page.evaluate(() => sessionStorage.getItem('fixonroad_pending_cart_intent'));
    expect(intent).not.toBeNull();
    const parsed = JSON.parse(intent || '{}');
    expect(parsed.service).toBeDefined();
    expect(parsed.service.id).toBe('flat-tire');
  });

  test('Clicking cart button on service card redirects unauthenticated user to signin', async ({ page }) => {
    await page.goto('/services');
    await page.waitForSelector('text=Flat Tire / Puncture Repair');

    // Click Add to cart button
    await page.locator('button[title="Add to cart"]').first().click();
    await expect(page).toHaveURL(/\/signin\?redirect=%2Fcart/);
  });
});
