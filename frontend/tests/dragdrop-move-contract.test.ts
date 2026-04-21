import { describe, expect, it } from 'vitest'

import {
  DRAG_WORKOUT_MIME,
  parseDragWorkoutPayload,
  serializeDragWorkoutPayload,
} from '../app/lib/dragdrop'

describe('drag/drop payload contract', () => {
  it('serializes and parses workout drag payload', () => {
    const raw = serializeDragWorkoutPayload({ workoutId: 'w1', sourceDayKey: '2026-01-05' })
    expect(parseDragWorkoutPayload(raw)).toEqual({ workoutId: 'w1', sourceDayKey: '2026-01-05' })
  })

  it('rejects malformed payloads', () => {
    expect(parseDragWorkoutPayload('')).toBeNull()
    expect(parseDragWorkoutPayload('not-json')).toBeNull()
    expect(parseDragWorkoutPayload(JSON.stringify({}))).toBeNull()
    expect(parseDragWorkoutPayload(JSON.stringify({ workoutId: 123 }))).toBeNull()
    expect(parseDragWorkoutPayload(JSON.stringify({ workoutId: 'w1', sourceDayKey: 5 }))).toBeNull()
  })

  it('uses a stable custom mime type', () => {
    expect(DRAG_WORKOUT_MIME).toBe('application/x-weekplanner-workout')
  })
})
