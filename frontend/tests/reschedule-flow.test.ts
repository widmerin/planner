import { describe, expect, it, vi } from 'vitest'
import { isDayKeyBeforeToday, moveWorkoutToDayKey, normalizeWorkout, type Workout } from '../app/lib/workouts'

const makeWorkout = (partial: Partial<Workout> = {}): Workout => {
  return {
    id: partial.id ?? 'w1',
    uid: partial.uid ?? 'uid1',
    summary: partial.summary ?? 'Easy run',
    description: partial.description ?? '',
    start: partial.start ?? new Date('2026-04-20T06:00:00.000Z'),
    end: partial.end ?? new Date('2026-04-20T07:00:00.000Z'),
    isAllDay: partial.isAllDay ?? false,
  }
}

describe('reschedule flow (optimistic + PATCH)', () => {
  it('blocks moves into the past (no optimistic move, no PATCH)', async () => {
    const targetDayKey = '2026-04-19'
    const now = new Date('2026-04-20T12:00:00.000Z')

    expect(isDayKeyBeforeToday(targetDayKey, now)).toBe(true)

    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }) as any)

    const attemptMove = async () => {
      if (isDayKeyBeforeToday(targetDayKey, now)) {
        return { moved: false }
      }

      await fetchMock('/api/workouts/w1', { method: 'PATCH' })
      return { moved: true }
    }

    const result = await attemptMove()

    expect(result.moved).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('moves workout optimistically and then replaces with normalized API response', async () => {
    const initial = makeWorkout({ id: 'w1', start: new Date('2026-04-20T06:00:00.000Z') })

    const moved = {
      ...initial,
      ...moveWorkoutToDayKey(initial, '2026-04-22'),
    }

    const fetchMock = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({
          workout: {
            id: 'w1',
            uid: 'uid1',
            summary: 'Easy run',
            description: '',
            start: '2026-04-22T06:00:00.000Z',
            end: '2026-04-22T07:00:00.000Z',
            isAllDay: false,
          },
        }),
      } as any
    })

    const persistReschedule = async (workout: Workout) => {
      const response = await fetchMock(`/api/workouts/${workout.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: workout.start.toISOString(),
          end_date: workout.end ? workout.end.toISOString() : null,
          is_all_day: workout.isAllDay,
        }),
      })

      if (!response.ok) {
        throw new Error('not ok')
      }

      const data = await response.json()
      return normalizeWorkout(data.workout)
    }

    const updated = await persistReschedule(moved)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(updated.start.toISOString()).toBe('2026-04-22T06:00:00.000Z')
    expect(updated.end?.toISOString()).toBe('2026-04-22T07:00:00.000Z')
  })

  it('reverts optimistic update when PATCH fails', async () => {
    const initial = makeWorkout({ id: 'w1', start: new Date('2026-04-20T06:00:00.000Z') })
    const optimistic = {
      ...initial,
      ...moveWorkoutToDayKey(initial, '2026-04-22'),
    }

    const fetchMock = vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }) as any)

    const persist = async () => {
      const response = await fetchMock(`/api/workouts/${optimistic.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: optimistic.start.toISOString(),
          end_date: optimistic.end ? optimistic.end.toISOString() : null,
          is_all_day: optimistic.isAllDay,
        }),
      })
      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`)
      }
    }

    let state: Workout = optimistic
    try {
      await persist()
    } catch {
      state = initial
    }

    expect(state.start.toISOString()).toBe(initial.start.toISOString())
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
