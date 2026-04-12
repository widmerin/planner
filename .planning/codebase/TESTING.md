# Testing Patterns

**Analysis Date:** 2026-04-12

## Test Framework

**Unit & Integration Tests:**
- **Framework:** Vitest v4.1.1
- **Config:** `frontend/vitest.config.ts`
- **Assertion Library:** Vitest built-in (`expect`)
- **Coverage:** V8 provider (`@vitest/coverage-v8`)

**E2E Tests:**
- **Framework:** Playwright v1.58.2
- **Config:** `frontend/playwright.config.ts`
- **Browser:** Chromium (Pixel 7 mobile viewport)

**Run Commands:**
```bash
npm run test              # Unit tests with coverage
npm run test:watch        # Watch mode
npm run test:e2e          # Playwright E2E tests
```

## Test File Organization

```
frontend/tests/
├── workouts.test.ts          # Unit tests for workout logic
├── api-routes.test.ts        # API integration tests
└── e2e/
    └── week-planner.spec.ts  # Playwright E2E tests
```

**Naming:** Tests use `*.test.ts` suffix; Playwright specs use `*.spec.ts`

**Unit Test Config:**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['app/lib/**/*.ts'],
    },
  },
})
```

## Unit Tests (workouts.test.ts)

**Pattern:**
```typescript
import { describe, expect, it } from 'vitest'
import {
  normalizeWorkout,
  parseWorkoutsFromICS,
  startOfIsoWeek,
  toDayKey,
  workoutsByDayForWeek,
} from '../app/lib/workouts'

describe('workouts parser', () => {
  it('parses workouts and creates stable uid+start ids', () => {
    const workouts = parseWorkoutsFromICS(fixtureIcs)
    expect(workouts.length).toBeGreaterThan(20)
    expect(workouts[0].uid).toBe('f5f26698-24cc-454f-8704-054fd755d735')
  })

  it('groups current week workouts Monday to Sunday', () => {
    const workouts = parseWorkoutsFromICS(fixtureIcs)
    const weekStart = startOfIsoWeek(new Date('2026-03-23T10:00:00'))
    const grouped = workoutsByDayForWeek(workouts, weekStart)
    expect(grouped[toDayKey(new Date('2026-03-23T12:00:00'))]).toHaveLength(1)
  })
})
```

**Test Data:**
- ICS fixtures loaded from `frontend/public/data/trainingsplan_v2.ics`
- Inline ICS strings for specific test cases:
```typescript
const sample = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'BEGIN:VEVENT',
  'UID:test-vacation',
  'DTSTART;VALUE=DATE:20260513',
  'DTEND;VALUE=DATE:20260516',
  'SUMMARY:Vacation',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\n')
```

**Assertions Used:**
- `toBeGreaterThan()`, `toHaveLength()`, `toBeInstanceOf()`, `toEqual()`
- `toBeTruthy()`, `toContain()`, `toBeNull()`

## API Route Tests (api-routes.test.ts)

**Pattern:**
```typescript
import { describe, it, expect, beforeAll } from 'vitest'

describe('Supabase API Routes', () => {
  let skipTests = false

  beforeAll(async () => {
    skipTests = !(await isServerRunning())
  })

  it('returns workouts in correct format', async () => {
    if (skipTests) {
      console.log('⏭️  Skipping API tests (dev server not running)')
      return
    }

    const response = await fetch(`${API_URL}/api/workouts`)
    if (response.ok) {
      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(Array.isArray(data.workouts)).toBe(true)
    }
  })
})
```

**Key Characteristics:**
- Skips if server not running (`isServerRunning()` check)
- Uses `beforeAll` for single setup
- Tests against `http://localhost:3000`
- Accepts multiple valid response statuses for operations requiring seeded data

## E2E Tests (week-planner.spec.ts)

**Pattern:**
```typescript
import { expect, test, type Page } from '@playwright/test'

const login = async (page: Page) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Week Planner' })).toBeVisible()
  const username = process.env.APP_USER || ''
  const password = process.env.APP_PASSWORD || ''
  await page.fill('input#username', username)
  await page.fill('input#password', password)
  await page.click('button:has-text("Sign In")')
}

test('shows workouts and persists done state', async ({ page }) => {
  await login(page)
  await expect(page.getByText('🏃 Leichter Run – W1').first()).toBeVisible()
  // ...
})
```

**Playwright Config:**
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: devices['Pixel 7'],
    },
  ],
})
```

**E2E Test Characteristics:**
- Mobile viewport (Pixel 7)
- Login helper function handles authentication
- Environment variables for credentials: `APP_USER`, `APP_PASSWORD`
- Uses role-based locators: `getByRole('heading')`, `getByRole('button')`, `getByRole('dialog')`
- Uses semantic locators: `page.getByText()`, `page.locator('li.workout-item')`

**Common E2E Patterns:**
```typescript
// Checkbox interaction
const checkbox = page.locator('input[type="checkbox"]').first()
await checkbox.check()
await expect(checkbox).toBeChecked()

// Modal handling
await expect(page.getByRole('dialog')).toBeVisible()
// ...
await page.getByRole('button', { name: 'Save' }).click()
await expect(page.getByRole('dialog')).toBeHidden()

// State persistence verification
await page.reload()
await expect(checkbox).toBeChecked()

// Filter rows by content
const runRow = page.locator('li.workout-item').filter({ hasText: '🏃 Leichter Run – W1' }).first()

// Hover to reveal buttons
await runRow.hover()
const editBtn = runRow.locator('button[aria-label*="Edit"]')
```

## Coverage

**Configuration:**
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'html'],
  include: ['app/lib/**/*.ts'],
}
```

**Coverage Targets:**
- Library functions in `app/lib/*.ts`
- Does not include Vue components or API routes

## What to Test

**Unit Tests:**
- Pure functions (`normalizeWorkout`, `toDayKey`, `parseWorkoutsFromICS`)
- Data transformations
- Business logic (week calculations, date handling)

**API Tests:**
- Endpoint responses
- Request/response format validation
- Error handling

**E2E Tests:**
- User flows (login, mark done, edit)
- State persistence across reloads
- Modal interactions
- Pace tracking for run workouts only

---

*Testing analysis: 2026-04-12*
