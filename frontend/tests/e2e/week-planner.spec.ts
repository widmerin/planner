import { expect, test } from '@playwright/test'

test('shows workouts and persists done state', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Week Planner' })).toBeVisible()
  await expect(page.getByText('🏃 Leichter Run – W1').first()).toBeVisible()

  const checkbox = page.locator('input[type="checkbox"]').first()
  await checkbox.check()
  await expect(checkbox).toBeChecked()

  await page.reload()
  await expect(page.locator('input[type="checkbox"]').first()).toBeChecked()
  await expect(checkbox).toBeChecked()
})
