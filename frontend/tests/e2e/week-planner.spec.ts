import { expect, test, type Page } from '@playwright/test'

const login = async (page: Page) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Week Planner' })).toBeVisible()
  const username = process.env.APP_USER || ''
  const password = process.env.APP_PASSWORD || ''
  expect(username).toBeTruthy()
  expect(password).toBeTruthy()
  await page.fill('input#username', username)
  await page.fill('input#password', password)
  await page.click('button:has-text("Sign In")')
}

test('shows workouts and persists done state', async ({ page }) => {
  await login(page)

  // Wait for planner to appear
  await expect(page.getByText('🏃 Leichter Run – W1').first()).toBeVisible()

  const checkbox = page.locator('input[type="checkbox"]').first()
  await checkbox.check()
  await expect(checkbox).toBeChecked()

  await page.getByRole('button', { name: 'Skip' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()

  // Verify state persists after reload (auth token stays in localStorage)
  await page.reload()

  // Should remain logged in and show planner
  await expect(page.getByText('🏃 Leichter Run – W1').first()).toBeVisible()
  await expect(page.locator('input[type="checkbox"]').first()).toBeChecked()
})

test('opens pace modal for run workouts and normalizes pace format', async ({ page }) => {
  await login(page)
  await expect(page.getByText('🏃 Leichter Run – W1').first()).toBeVisible()

  const runRow = page.locator('li.workout-item').filter({ hasText: '🏃 Leichter Run – W1' }).first()
  await runRow.locator('input[type="checkbox"]').check()

  const modal = page.getByRole('dialog')
  await expect(modal).toBeVisible()
  await modal.locator('#pace-modal-input').fill('6.40')
  await modal.getByRole('button', { name: 'Save' }).click()

  await expect(modal).toBeHidden()
  await expect(runRow).toContainText('· 6:40 min/km')
})

test('does not open pace modal for yoga and bike workouts', async ({ page }) => {
  await login(page)
  await expect(page.getByText('🧘 Yoga – W1').first()).toBeVisible()

  const yogaRow = page.locator('li.workout-item').filter({ hasText: '🧘 Yoga – W1' }).first()
  await yogaRow.locator('input[type="checkbox"]').check()
  await expect(page.getByRole('dialog')).toBeHidden()

  const bikeRow = page.locator('li.workout-item').filter({ hasText: /🚴 .*W1/ }).first()
  await bikeRow.locator('input[type="checkbox"]').check()
  await expect(page.getByRole('dialog')).toBeHidden()
})
