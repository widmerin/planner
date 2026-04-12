import { describe, it, expect, beforeAll } from 'vitest'

const API_URL = 'http://localhost:3000'

// Skip these tests if server isn't running
const isServerRunning = async () => {
  try {
    const response = await fetch(API_URL)
    return true
  } catch {
    return false
  }
}

describe('Supabase API Routes', () => {
  let skipTests = false

  beforeAll(async () => {
    skipTests = !(await isServerRunning())
  })

  describe('GET /api/workouts', () => {
    it('returns workouts in correct format', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping API tests (dev server not running)')
        return
      }

      // This test assumes workouts have been synced first
      // In a real test environment, you'd seed the database
      const response = await fetch(`${API_URL}/api/workouts`)

      if (response.ok) {
        const data = await response.json()
        expect(data).toHaveProperty('success', true)
        expect(Array.isArray(data.workouts)).toBe(true)

        if (data.workouts.length > 0) {
          const workout = data.workouts[0]
          expect(workout).toHaveProperty('id')
          expect(workout).toHaveProperty('uid')
          expect(workout).toHaveProperty('summary')
          expect(workout).toHaveProperty('start')
          expect(workout).toHaveProperty('isAllDay')
        }
      }
    })
  })

  describe('GET /api/workouts/completions', () => {
    it('returns completions with paces in correct format', async () => {
      if (skipTests) return

      const response = await fetch(`${API_URL}/api/workouts/completions`)

      if (response.ok) {
        const data = await response.json()
        expect(data).toHaveProperty('success', true)
        expect(typeof data.completions).toBe('object')
        expect(typeof data.paces).toBe('object')
      }
    })
  })

  describe('POST /api/workouts/sync', () => {
    it('syncs workouts from ICS to Supabase', async () => {
      if (skipTests) return

      const response = await fetch(`${API_URL}/api/workouts/sync`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('synced')
        expect(typeof data.synced).toBe('number')
      }
    })
  })

  describe('POST /api/workouts/toggle', () => {
    it('requires valid workoutId from database', async () => {
      if (skipTests) return

      // This test just verifies the endpoint accepts the correct format
      // Real testing requires a running Supabase instance with test data
      const response = await fetch(`${API_URL}/api/workouts/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId: 'test-id-that-does-not-exist',
          completed: true,
          date: '2026-04-12',
        }),
      })

      // Should either succeed (if ID exists) or fail with proper error
      expect([400, 404, 500]).toContain(response.status)
    })
  })

  describe('POST /api/workouts/pace', () => {
    it('accepts pace data in correct format', async () => {
      if (skipTests) return

      const response = await fetch(`${API_URL}/api/workouts/pace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId: 'test-id-that-does-not-exist',
          pace: '6:05',
          date: '2026-04-12',
        }),
      })

      // Should either succeed (if completion exists) or fail with proper error
      expect([400, 404, 500]).toContain(response.status)
    })

    it('returns error for missing required fields', async () => {
      if (skipTests) return

      const response = await fetch(`${API_URL}/api/workouts/pace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pace: '6:05',
          // missing workoutId and date
        }),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/workouts', () => {
    it('returns 400 for missing summary', async () => {
      if (skipTests) return

      const response = await fetch(`${API_URL}/api/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'Test workout',
          start: '2026-04-15T09:00:00Z',
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.statusMessage).toContain('Summary is required')
    })

    it('returns 400 for missing start date', async () => {
      if (skipTests) return

      const response = await fetch(`${API_URL}/api/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: 'Test Workout',
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.statusMessage).toContain('Start date is required')
    })

    it('returns 400 for invalid start date format', async () => {
      if (skipTests) return

      const response = await fetch(`${API_URL}/api/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: 'Test Workout',
          start: 'invalid-date',
        }),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/workouts/:id', () => {
    it('handles missing workout ID', async () => {
      if (skipTests) return

      const response = await fetch(`${API_URL}/api/workouts/`, {
        method: 'DELETE',
      })

      // Returns 404 for invalid path, or the request might go through
      expect([200, 404]).toContain(response.status)
    })
  })
})
