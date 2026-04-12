import { expect, test, type Page } from '@playwright/test'

const BASE_URL = 'http://127.0.0.1:5173'

const setupMocks = (page: Page) => {
  page.route(`${BASE_URL}/api/auth/login`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        user: { username: 'testuser' },
        token: 'mock-token-123',
      }),
    })
  })

  page.route(`${BASE_URL}/api/auth/session`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        authenticated: false,
      }),
    })
  })
}

const login = async (page: Page) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Week Planner' })).toBeVisible()
  await page.fill('input#username', 'testuser')
  await page.fill('input#password', 'testpass')
  await page.click('button:has-text("Sign In")')
  
  await expect(page.locator('section:has-text("Loading")')).toBeHidden({ timeout: 10000 })
  await expect(page.locator('.workout-item').first()).toBeVisible({ timeout: 5000 })
}

test.describe('Workout CRUD', () => {
  test.beforeEach(async ({ page }) => {
    setupMocks(page)
  })

  test('shows workouts after login', async ({ page }) => {
    await login(page)

    await expect(page.locator('.workout-item').first()).toBeVisible()
    const workoutCount = await page.locator('.workout-item').count()
    expect(workoutCount).toBeGreaterThan(0)
  })

  test('displays workout details', async ({ page }) => {
    await login(page)

    await expect(page.locator('.workout-item').first()).toBeVisible()
    const firstWorkout = page.locator('.workout-item').first()
    
    await expect(firstWorkout.locator('strong')).toBeVisible()
    const timeText = await firstWorkout.locator('.time').textContent()
    expect(timeText).toMatch(/\d/)
  })
})

test.describe('Date/Time Display', () => {
  test.beforeEach(async ({ page }) => {
    setupMocks(page)
  })

  test('displays workout times in correct format', async ({ page }) => {
    await login(page)

    const timeElements = page.locator('.time')
    const count = await timeElements.count()
    expect(count).toBeGreaterThan(0)
    
    const firstTime = await timeElements.first().textContent()
    expect(firstTime).toMatch(/\d/)
  })
})

test.describe('Week Navigation', () => {
  test.beforeEach(async ({ page }) => {
    setupMocks(page)
  })

  test('has navigation buttons', async ({ page }) => {
    await login(page)

    await expect(page.locator('button[aria-label="Previous week"]')).toBeVisible()
    await expect(page.locator('button[aria-label="Next week"]')).toBeVisible()
    await expect(page.locator('button:has-text("Today")')).toBeVisible()
  })
})

test.describe('Pace Tracking', () => {
  test.beforeEach(async ({ page }) => {
    setupMocks(page)
  })

  test('run workouts can be checked', async ({ page }) => {
    await login(page)

    const runRow = page.locator('li.workout-item').filter({ hasText: '🏃' }).first()
    const checkbox = runRow.locator('input[type="checkbox"]')
    await expect(checkbox).toBeVisible()
    await checkbox.check()
  })

  test('non-run workouts can be checked without pace modal', async ({ page }) => {
    await login(page)

    const nonRunRow = page.locator('li.workout-item').filter({ hasText: '🧘' }).first()
    if (await nonRunRow.isVisible()) {
      const checkbox = nonRunRow.locator('input[type="checkbox"]')
      await checkbox.check()
      await expect(page.locator('.pace-modal')).not.toBeVisible()
    }
  })

  test('pace modal opens when checking run workout', async ({ page }) => {
    await login(page)

    const runRow = page.locator('li.workout-item').filter({ hasText: '🏃' }).first()
    const checkbox = runRow.locator('input[type="checkbox"]')
    await checkbox.check()

    await expect(page.locator('.pace-modal')).toBeVisible()
  })

  test('pace modal save button saves pace and closes', async ({ page }) => {
    await login(page)

    const runRow = page.locator('li.workout-item').filter({ hasText: '🏃' }).first()
    const checkbox = runRow.locator('input[type="checkbox"]')
    await checkbox.check()

    await expect(page.locator('.pace-modal')).toBeVisible()
    await page.fill('#pace-modal-input', '5:30')
    await page.click('.pace-modal button:has-text("Save")')

    await expect(page.locator('.pace-modal')).not.toBeVisible()
    await expect(runRow.locator('.pace-inline')).toContainText('5:30')
  })

  test('pace modal skip button closes without saving', async ({ page }) => {
    await login(page)

    const runRow = page.locator('li.workout-item').filter({ hasText: '🏃' }).first()
    const checkbox = runRow.locator('input[type="checkbox"]')
    await checkbox.check()

    await expect(page.locator('.pace-modal')).toBeVisible()
    await page.click('.pace-modal button:has-text("Skip")')

    await expect(page.locator('.pace-modal')).not.toBeVisible()
  })
})

test.describe('CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    setupMocks(page)

    // Mock workout API endpoints
    page.route(`${BASE_URL}/api/workouts`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ workouts: [] }),
        })
      } else if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postDataBuffer?.toString() || '{}')
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            workout: {
              id: 'new-workout-' + Date.now(),
              uid: 'new-uid',
              summary: body.summary,
              description: body.description || '',
              start: body.start,
              end: body.end,
              isAllDay: body.isAllDay || false,
            },
          }),
        })
      }
    })

    page.route(`${BASE_URL}/api/workouts/*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })
  })

  test('can create new workout via UI', async ({ page }) => {
    await login(page)

    // Click add button
    await page.click('button[aria-label="Add workout"]')
    await expect(page.locator('.edit-modal')).toBeVisible()

    // Fill in workout details
    await page.fill('#edit-summary', '🏃 Test Run')
    await page.fill('#edit-description', '6 km easy pace')
    await page.fill('#edit-date', '2026-04-15')

    // Save
    await page.click('.edit-modal button[type="submit"]')

    // Modal should close
    await expect(page.locator('.edit-modal')).not.toBeVisible()
  })

  test('can edit existing workout via UI', async ({ page }) => {
    await login(page)

    // Wait for workouts to load with mock data
    await page.waitForSelector('.workout-item', { timeout: 5000 })

    // Click edit button on first workout
    const firstWorkout = page.locator('.workout-item').first()
    await firstWorkout.locator('button.btn-edit').click()

    await expect(page.locator('.edit-modal')).toBeVisible()
    await expect(page.locator('#edit-summary')).not.toBeEmpty()

    // Modify summary
    await page.fill('#edit-summary', '🏃 Edited Run')

    // Save
    await page.click('.edit-modal button[type="submit"]')

    // Modal should close
    await expect(page.locator('.edit-modal')).not.toBeVisible()
  })

  test('can delete workout via UI', async ({ page }) => {
    await login(page)

    // Wait for workouts to load
    await page.waitForSelector('.workout-item', { timeout: 5000 })

    const initialCount = await page.locator('.workout-item').count()
    expect(initialCount).toBeGreaterThan(0)

    // Click delete button on first workout
    const firstWorkout = page.locator('.workout-item').first()
    await firstWorkout.locator('button.btn-delete').click()

    // Handle confirm dialog
    page.on('dialog', async (dialog) => {
      await dialog.accept()
    })

    // Wait for workout to be removed
    await page.waitForTimeout(500)
  })
})
