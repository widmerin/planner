import type { Page, Route } from '@playwright/test'

export type Workout = {
  id: string
  uid: string
  summary: string
  description?: string
  start: string
  end: string
  isAllDay: boolean
}

export type WorkoutsResponse = { workouts: Workout[] }

export const DAY_KEYS = {
  past: '2026-04-01',
  source: '2026-04-07',
  target: '2026-04-08',
} as const

export const DEFAULT_WORKOUTS: Workout[] = [
  {
    id: 'w1',
    uid: 'test-uid',
    summary: '🏃 Easy Run',
    description: '6 km easy pace',
    start: '2026-04-07T08:00:00Z',
    end: '2026-04-07T09:00:00Z',
    isAllDay: false,
  },
  {
    id: 'w2',
    uid: 'test-uid',
    summary: '🧘 Yoga',
    description: 'Morning stretch',
    start: '2026-04-08T07:00:00Z',
    end: '2026-04-08T08:00:00Z',
    isAllDay: false,
  },
  {
    id: 'wPast',
    uid: 'test-uid',
    summary: '🏃 Past Run',
    description: 'Already happened',
    start: '2026-04-01T08:00:00Z',
    end: '2026-04-01T09:00:00Z',
    isAllDay: false,
  },
]

export type SetupMockOptions = {
  baseURL?: string
  workouts?: Workout[]
  patchMode?: 'success' | 'fail'
}

export function setupAuthMocks(page: Page, baseURL: string) {
  page.route(`${baseURL}/api/auth/login`, async (route) => {
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

  page.route(`${baseURL}/api/auth/session`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ authenticated: false }),
    })
  })
}

export function setupWorkoutsGetMock(page: Page, baseURL: string, workouts: Workout[]) {
  page.route(`${baseURL}/api/workouts`, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ workouts } satisfies WorkoutsResponse),
    })
  })
}

export function setupWorkoutsPatchMock(page: Page, baseURL: string, mode: 'success' | 'fail') {
  page.route(new RegExp(`${escapeRegExp(baseURL)}/api/workouts/[^/]+$`), async (route) => {
    const req = route.request()
    if (req.method() !== 'PATCH') return route.fallback()

    if (mode === 'fail') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'mock patch failure' }),
      })
      return
    }

    // Echo back the patched workout shape (best-effort) to keep UI in sync.
    const postData = req.postDataJSON?.() as unknown
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, workout: postData }),
    })
  })
}

export function setupE2EMocks(page: Page, options: SetupMockOptions = {}) {
  const baseURL = options.baseURL ?? 'http://127.0.0.1:5173'
  const workouts = options.workouts ?? DEFAULT_WORKOUTS
  const patchMode = options.patchMode ?? 'success'

  setupAuthMocks(page, baseURL)
  setupWorkoutsGetMock(page, baseURL, workouts)
  setupWorkoutsPatchMock(page, baseURL, patchMode)

  return { baseURL, workouts }
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
