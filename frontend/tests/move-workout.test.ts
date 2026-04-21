import { describe, expect, it } from 'vitest'

import { moveWorkoutToDayKey, type Workout } from '../app/lib/workouts'

describe('moveWorkoutToDayKey', () => {
  it('moves timed workouts preserving time-of-day and duration', () => {
    const workout: Workout = {
      id: 'w1',
      uid: 'u1',
      summary: 'Intervals',
      description: '',
      start: new Date('2026-01-05T09:15:30.000Z'),
      end: new Date('2026-01-05T10:45:30.000Z'),
      isAllDay: false,
    }

    const moved = moveWorkoutToDayKey(workout, '2026-01-21')

    expect(moved.isAllDay).toBe(false)
    expect(moved.start.toISOString()).toBe('2026-01-21T09:15:30.000Z')
    expect(moved.end?.toISOString()).toBe('2026-01-21T10:45:30.000Z')
  })

  it('moves timed workouts without end preserving time-of-day', () => {
    const workout: Workout = {
      id: 'w1',
      uid: 'u1',
      summary: 'Intervals',
      description: '',
      start: new Date('2026-01-05T09:15:00.000Z'),
      end: null,
      isAllDay: false,
    }

    const moved = moveWorkoutToDayKey(workout, '2026-01-21')

    expect(moved.isAllDay).toBe(false)
    expect(moved.start.toISOString()).toBe('2026-01-21T09:15:00.000Z')
    expect(moved.end).toBeNull()
  })

  it('moves all-day single-day workouts to the correct local calendar day', () => {
    const workout: Workout = {
      id: 'w1',
      uid: 'u1',
      summary: 'Rest',
      description: '',
      start: new Date('2026-01-05T00:00:00.000Z'),
      end: null,
      isAllDay: true,
    }

    const moved = moveWorkoutToDayKey(workout, '2026-01-21')

    expect(moved.isAllDay).toBe(true)
    expect(moved.start.getFullYear()).toBe(2026)
    expect(moved.start.getMonth()).toBe(0) // Jan
    expect(moved.start.getDate()).toBe(21)
    expect(moved.end).toBeNull()
  })

  it('moves all-day multi-day workouts preserving span (end-exclusive) in local calendar days', () => {
    const workout: Workout = {
      id: 'w1',
      uid: 'u1',
      summary: 'Camp',
      description: '',
      start: new Date('2026-01-05T00:00:00.000Z'),
      end: new Date('2026-01-08T00:00:00.000Z'), // 3 days
      isAllDay: true,
    }

    const moved = moveWorkoutToDayKey(workout, '2026-01-21')

    expect(moved.isAllDay).toBe(true)
    expect(moved.start.getFullYear()).toBe(2026)
    expect(moved.start.getMonth()).toBe(0)
    expect(moved.start.getDate()).toBe(21)

    expect(moved.end).not.toBeNull()
    expect(moved.end!.getFullYear()).toBe(2026)
    expect(moved.end!.getMonth()).toBe(0)
    expect(moved.end!.getDate()).toBe(24)
  })
})
