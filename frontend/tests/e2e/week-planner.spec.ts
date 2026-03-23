import { expect, test } from '@playwright/test'

test('shows workouts and persists done state', async ({ page }) => {
  await page.goto('/')

  // Login
  await expect(page.getByRole('heading', { name: 'Week Planner' })).toBeVisible()
  await page.fill('input#username', 'runner')
  await page.fill('input#password', 'run2026')
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
