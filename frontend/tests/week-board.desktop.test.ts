import { describe, expect, it } from 'vitest'

import {
  addDays,
  getIsoWeeks,
  startOfIsoWeek,
  toDayKey,
  workoutsByDayForRange,
  type Workout,
} from '../app/lib/workouts'

describe('Desktop 4-week board model', () => {
  it('builds 4 consecutive ISO weeks and provides stable day keys', () => {
    const anchorDate = new Date('2026-01-06T12:00:00.000Z') // Tue
    const weekStart = startOfIsoWeek(anchorDate)

    const weeks = getIsoWeeks(weekStart, 4)
    expect(weeks).toHaveLength(4)
    expect(toDayKey(weeks[0].weekStart)).toBe('2026-01-05')
    expect(toDayKey(weeks[3].weekStart)).toBe('2026-01-26')

    const allDays = weeks.flatMap((week) => week.days.map(toDayKey))
    expect(allDays).toHaveLength(28)
    expect(new Set(allDays).size).toBe(28)
  })

  it('groups workouts into the correct day buckets across the full 4-week range', () => {
    const weekStart = new Date('2026-01-05T00:00:00.000Z')
    const rangeStart = weekStart
    const rangeEndExclusive = addDays(rangeStart, 28)

    const workouts: Workout[] = [
      {
        id: 'w1',
        uid: 'u1',
        summary: 'Workout A',
        description: '',
        start: new Date('2026-01-05T09:00:00.000Z'),
        end: new Date('2026-01-05T10:00:00.000Z'),
        isAllDay: false,
      },
      {
        id: 'w2',
        uid: 'u2',
        summary: 'Workout B',
        description: '',
        start: new Date('2026-01-21T09:00:00.000Z'),
        end: new Date('2026-01-21T10:00:00.000Z'),
        isAllDay: false,
      },
    ]

    const grouped = workoutsByDayForRange(workouts, rangeStart, rangeEndExclusive)

    expect(grouped['2026-01-05'].map((w) => w.id)).toEqual(['w1'])
    expect(grouped['2026-01-21'].map((w) => w.id)).toEqual(['w2'])
  })
})
