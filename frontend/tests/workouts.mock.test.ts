import { describe, expect, it } from 'vitest'

import {
  toDayKey,
  startOfIsoWeek,
  getIsoWeekDays,
  workoutsByDayForWeek,
  formatTimeRange,
  normalizeWorkout,
  validateWorkout,
} from '../app/lib/workouts'

describe('Date utilities', () => {
  it('toDayKey formats date as YYYY-MM-DD', () => {
    expect(toDayKey(new Date('2026-04-13'))).toBe('2026-04-13')
    expect(toDayKey(new Date('2026-12-01'))).toBe('2026-12-01')
  })

  it('startOfIsoWeek finds Monday of the week', () => {
    const monday = startOfIsoWeek(new Date('2026-04-15'))
    expect(toDayKey(monday)).toBe('2026-04-13')

    const sunday = startOfIsoWeek(new Date('2026-04-19'))
    expect(toDayKey(sunday)).toBe('2026-04-13')
  })

  it('getIsoWeekDays returns 7 days starting Monday', () => {
    const weekStart = new Date('2026-04-13')
    const days = getIsoWeekDays(weekStart)
    
    expect(days).toHaveLength(7)
    expect(toDayKey(days[0])).toBe('2026-04-13')
    expect(toDayKey(days[6])).toBe('2026-04-19')
  })
})

describe('normalizeWorkout', () => {
  it('handles string dates', () => {
    const input = {
      id: 'test-123',
      uid: 'uid-456',
      summary: 'Test Run',
      description: '5 km',
      start: '2026-04-13T07:00:00.000Z',
      end: '2026-04-13T07:30:00.000Z',
      isAllDay: false,
    }

    const result = normalizeWorkout(input)

    expect(result.start).toBeInstanceOf(Date)
    expect(result.end).toBeInstanceOf(Date)
    expect(result.start.toISOString()).toBe('2026-04-13T07:00:00.000Z')
  })

  it('handles Date objects', () => {
    const input = {
      id: 'test-123',
      uid: 'uid-456',
      summary: 'Test Run',
      description: '5 km',
      start: new Date('2026-04-13T07:00:00Z'),
      end: new Date('2026-04-13T07:30:00Z'),
      isAllDay: false,
    }

    const result = normalizeWorkout(input)

    expect(result.start).toBeInstanceOf(Date)
    expect(result.end).toBeInstanceOf(Date)
  })

  it('handles null end date', () => {
    const input = {
      id: 'test-123',
      uid: 'uid-456',
      summary: 'Test Run',
      description: '5 km',
      start: '2026-04-13T07:00:00.000Z',
      end: null,
      isAllDay: false,
    }

    const result = normalizeWorkout(input)

    expect(result.start).toBeInstanceOf(Date)
    expect(result.end).toBeNull()
  })
})

describe('validateWorkout', () => {
  it('requires summary', () => {
    const errors = validateWorkout({ summary: '' })
    expect(errors).toContain('Summary is required')
  })

  it('allows valid workout', () => {
    const errors = validateWorkout({
      summary: '🏃 Morning Run',
      start: new Date('2026-04-13T07:00:00Z'),
      end: new Date('2026-04-13T07:30:00Z'),
      isAllDay: false,
    })
    expect(errors).toHaveLength(0)
  })

  it('rejects end time before start time', () => {
    const errors = validateWorkout({
      summary: 'Test',
      start: new Date('2026-04-13T07:30:00Z'),
      end: new Date('2026-04-13T07:00:00Z'),
      isAllDay: false,
    })
    expect(errors).toContain('End time must be after start time')
  })

  it('limits summary length', () => {
    const longSummary = 'a'.repeat(201)
    const errors = validateWorkout({ summary: longSummary })
    expect(errors).toContain('Summary must be 200 characters or less')
  })

  it('allows past dates', () => {
    const pastDate = new Date('2020-01-01T07:00:00Z')
    const errors = validateWorkout({
      summary: '🏃 Morning Run',
      start: pastDate,
      end: new Date('2020-01-01T07:30:00Z'),
      isAllDay: false,
    })
    expect(errors).toHaveLength(0)
  })
})

describe('formatTimeRange', () => {
  it('formats time range correctly', () => {
    const workout = {
      id: '1',
      uid: '1',
      summary: 'Test',
      description: '',
      start: new Date('2026-04-13T07:00:00Z'),
      end: new Date('2026-04-13T07:30:00Z'),
      isAllDay: false,
    }

    const result = formatTimeRange(workout)
    expect(result).toMatch(/\d{2}:\d{2}/)
  })

  it('handles null end time', () => {
    const workout = {
      id: '1',
      uid: '1',
      summary: 'Test',
      description: '',
      start: new Date('2026-04-13T07:00:00Z'),
      end: null,
      isAllDay: false,
    }

    const result = formatTimeRange(workout)
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})

describe('workoutsByDayForWeek', () => {
  it('groups workouts by day key', () => {
    const workouts = [
      {
        id: '1',
        uid: '1',
        summary: 'Run',
        description: '',
        start: new Date('2026-04-13T07:00:00Z'),
        end: new Date('2026-04-13T07:30:00Z'),
        isAllDay: false,
      },
      {
        id: '2',
        uid: '2',
        summary: 'Yoga',
        description: '',
        start: new Date('2026-04-14T08:00:00Z'),
        end: new Date('2026-04-14T08:30:00Z'),
        isAllDay: false,
      },
    ]

    const weekStart = new Date('2026-04-13')
    const result = workoutsByDayForWeek(workouts, weekStart)

    expect(result['2026-04-13']).toHaveLength(1)
    expect(result['2026-04-13'][0].summary).toBe('Run')
    expect(result['2026-04-14']).toHaveLength(1)
    expect(result['2026-04-14'][0].summary).toBe('Yoga')
  })

  it('excludes workouts outside the week', () => {
    const workouts = [
      {
        id: '1',
        uid: '1',
        summary: 'Run',
        description: '',
        start: new Date('2026-04-20T07:00:00Z'),
        end: new Date('2026-04-20T07:30:00Z'),
        isAllDay: false,
      },
    ]

    const weekStart = new Date('2026-04-13')
    const result = workoutsByDayForWeek(workouts, weekStart)

    // April 20 is outside week of April 13 (Mon-Sun = Apr 13-19)
    expect(result['2026-04-20']).toBeUndefined()
    // April 15 is in the week but has no workouts
    expect(result['2026-04-15']).toHaveLength(0)
  })
})
