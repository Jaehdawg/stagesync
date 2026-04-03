import { test, expect } from '@playwright/test'

test('shows the StageSync homepage', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/StageSync/)
  await expect(page.getByRole('heading', { name: /live band karaoke simplified/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /band portal/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /learn more/i })).toBeVisible()
})
