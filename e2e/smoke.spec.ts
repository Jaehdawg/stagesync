import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  // Basic check for Next.js app
  await expect(page).toHaveTitle(/Create Next App/);
});
