import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  normalizeWorkout,
  parseWorkoutsFromICS,
  startOfIsoWeek,
  toDayKey,
  workoutsByDayForWeek,
} from '../app/lib/workouts'

const fixturePath = resolve(process.cwd(), '../frontend/public/data/trainingsplan_v2.ics')
const fixtureIcs = readFileSync(fixturePath, 'utf8')

describe('workouts parser', () => {
  it('parses workouts and creates stable uid+start ids', () => {
    const workouts = parseWorkoutsFromICS(fixtureIcs)

    expect(workouts.length).toBeGreaterThan(20)
    expect(workouts[0].uid).toBe('f5f26698-24cc-454f-8704-054fd755d735')
    expect(workouts[0].id).toContain('f5f26698-24cc-454f-8704-054fd755d735__')
    expect(workouts[0].summary).toContain('Leichter Run')
  })

  it('groups current week workouts Monday to Sunday', () => {
    const workouts = parseWorkoutsFromICS(fixtureIcs)
    const weekStart = startOfIsoWeek(new Date('2026-03-23T10:00:00'))
    const grouped = workoutsByDayForWeek(workouts, weekStart)

    expect(grouped[toDayKey(new Date('2026-03-23T12:00:00'))]).toHaveLength(1)
    expect(grouped[toDayKey(new Date('2026-03-24T12:00:00'))]).toHaveLength(1)
    expect(grouped[toDayKey(new Date('2026-03-25T12:00:00'))]).toHaveLength(1)
    expect(grouped[toDayKey(new Date('2026-03-26T12:00:00'))]).toHaveLength(1)
    expect(grouped[toDayKey(new Date('2026-03-27T12:00:00'))]).toHaveLength(1)
    expect(grouped[toDayKey(new Date('2026-03-28T12:00:00'))]).toHaveLength(1)
    expect(grouped[toDayKey(new Date('2026-03-29T12:00:00'))]).toHaveLength(0)
  })

  it('expands all-day multi-day events across every covered day', () => {
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

    const workouts = parseWorkoutsFromICS(sample)
    const weekStart = new Date('2026-05-11T08:00:00')
    const grouped = workoutsByDayForWeek(workouts, weekStart)

    expect(grouped['2026-05-13']).toHaveLength(1)
    expect(grouped['2026-05-14']).toHaveLength(1)
    expect(grouped['2026-05-15']).toHaveLength(1)
    expect(grouped['2026-05-16']).toHaveLength(0)
  })
})

describe('normalizeWorkout', () => {
  it('converts string dates to Date objects', () => {
    const input = {
      id: 'test-123',
      uid: 'uid-456',
      summary: 'Test Run',
      description: '5 km',
      start: '2026-03-23T05:00:00.000Z',
      end: '2026-03-23T05:30:00.000Z',
      isAllDay: false,
    }

    const normalized = normalizeWorkout(input)

    expect(normalized.start).toBeInstanceOf(Date)
    expect(normalized.end).toBeInstanceOf(Date)
    expect(normalized.start.getFullYear()).toBe(2026)
  })

  it('handles Date object inputs', () => {
    const startDate = new Date('2026-03-23T05:00:00')
    const endDate = new Date('2026-03-23T05:30:00')

    const input = {
      id: 'test-123',
      uid: 'uid-456',
      summary: 'Test Run',
      description: '5 km',
      start: startDate,
      end: endDate,
      isAllDay: false,
    }

    const normalized = normalizeWorkout(input)

    expect(normalized.start).toBeInstanceOf(Date)
    expect(normalized.end).toBeInstanceOf(Date)
    expect(normalized.start).toEqual(startDate)
  })

  it('handles null end dates', () => {
    const input = {
      id: 'test-123',
      uid: 'uid-456',
      summary: 'Test Run',
      description: 'no end',
      start: '2026-03-23T05:00:00.000Z',
      end: null,
      isAllDay: false,
    }

    const normalized = normalizeWorkout(input)

    expect(normalized.start).toBeInstanceOf(Date)
    expect(normalized.end).toBeNull()
  })
})
