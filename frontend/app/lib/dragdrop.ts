export type DragWorkoutPayload = {
  workoutId: string
  sourceDayKey: string | null
}

export const DRAG_WORKOUT_MIME = 'application/x-weekplanner-workout'

export const serializeDragWorkoutPayload = (payload: DragWorkoutPayload): string => {
  return JSON.stringify(payload)
}

export const parseDragWorkoutPayload = (raw: string): DragWorkoutPayload | null => {
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    const workoutId = (parsed as any).workoutId
    const sourceDayKey = (parsed as any).sourceDayKey

    if (typeof workoutId !== 'string' || workoutId.length === 0) {
      return null
    }

    if (sourceDayKey !== null && typeof sourceDayKey !== 'string') {
      return null
    }

    return { workoutId, sourceDayKey }
  } catch {
    return null
  }
}
