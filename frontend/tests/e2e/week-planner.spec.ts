import { expect, test } from '@playwright/test'

test('shows workouts and persists done state', async ({ page }) => {
  await page.goto('/')

  // Login with credentials from environment variables
  await expect(page.getByRole('heading', { name: 'Week Planner' })).toBeVisible()
  const username = process.env.NUXT_PUBLIC_APP_USER
  const password = process.env.NUXT_PUBLIC_APP_PASSWORD
  await page.fill('input#username', username)
  await page.fill('input#password', password)
  await page.click('button:has-text("Sign In")')

  // Wait for planner to appear
  await expect(page.getByText('🏃 Leichter Run – W1').first()).toBeVisible()

  const checkbox = page.locator('input[type="checkbox"]').first()
  await checkbox.check()
  await expect(checkbox).toBeChecked()

  // Verify state persists after reload (auth token stays in localStorage)
  await page.reload()

  // Should remain logged in and show planner
  await expect(page.getByText('🏃 Leichter Run – W1').first()).toBeVisible()
  await expect(page.locator('input[type="checkbox"]').first()).toBeChecked()
})
