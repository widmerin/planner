export type Workout = {
  id: string
  uid: string
  summary: string
  description: string
  start: Date
  end: Date | null
  isAllDay: boolean
  source?: 'ics' | 'user-created'
  edited_by_user?: boolean
  created_at?: Date
  updated_at?: Date
}

export const normalizeWorkout = (workout: any): Workout => {
  return {
    id: workout.id,
    uid: workout.uid,
    summary: workout.summary,
    description: workout.description || '',
    start: typeof workout.start === 'string' ? new Date(workout.start) : workout.start,
    end: workout.end ? (typeof workout.end === 'string' ? new Date(workout.end) : workout.end) : null,
    isAllDay: workout.isAllDay,
  }
}

export const toDayKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const startOfIsoWeek = (date: Date): Date => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  const day = copy.getDay()
  const offset = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + offset)
  return copy
}

export const getIsoWeekDays = (weekStart: Date): Date[] => {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + index)
    return day
  })
}

const normalizeDateOnly = (date: Date): Date => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const expandAllDayRange = (start: Date, end: Date | null): Date[] => {
  const startDate = normalizeDateOnly(start)
  const endDate = end ? normalizeDateOnly(end) : normalizeDateOnly(start)
  const days: Date[] = []

  if (endDate <= startDate) {
    return [startDate]
  }

  for (const cursor = new Date(startDate); cursor < endDate; cursor.setDate(cursor.getDate() + 1)) {
    days.push(new Date(cursor))
  }

  return days
}

export const workoutsByDayForWeek = (
  workouts: Workout[],
  weekStart: Date,
): Record<string, Workout[]> => {
  const days = getIsoWeekDays(weekStart)
  const keys = new Set(days.map(toDayKey))
  const grouped: Record<string, Workout[]> = {}

  for (const dayKey of keys) {
    grouped[dayKey] = []
  }

  for (const workout of workouts) {
    if (workout.isAllDay) {
      const allDays = expandAllDayRange(workout.start, workout.end)
      for (const day of allDays) {
        const key = toDayKey(day)
        if (keys.has(key)) {
          grouped[key].push(workout)
        }
      }
      continue
    }

    const key = toDayKey(workout.start)
    if (keys.has(key)) {
      grouped[key].push(workout)
    }
  }

  return grouped
}

export const formatTimeRange = (workout: Workout): string => {
  if (workout.isAllDay) {
    return 'All day'
  }

  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (!workout.end) {
    return formatter.format(workout.start)
  }

  return `${formatter.format(workout.start)} – ${formatter.format(workout.end)}`
}

export const validateWorkout = (workout: Partial<Workout>): string[] => {
  const errors: string[] = []

  if (!workout.summary?.trim()) {
    errors.push('Summary is required')
  }

  if (workout.summary && workout.summary.length > 200) {
    errors.push('Summary must be 200 characters or less')
  }

  if (workout.description && workout.description.length > 1000) {
    errors.push('Description must be 1000 characters or less')
  }

  if (!workout.isAllDay && workout.start && workout.end && workout.end <= workout.start) {
    errors.push('End time must be after start time')
  }

  if (workout.start && workout.start < new Date()) {
    const dateStr = workout.start.toISOString().split('T')[0]
    const todayStr = new Date().toISOString().split('T')[0]
    if (dateStr < todayStr) {
      errors.push('Cannot create workouts in the past')
    }
  }

  return errors
}

export const formatTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export const parseTime = (timeStr: string): number | null => {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return hours * 60 + minutes
}

export const dateKeyToDate = (dayKey: string): Date => {
  const [year, month, day] = dayKey.split('-')
  return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))
}
