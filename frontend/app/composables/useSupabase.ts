import { createClient } from '@supabase/supabase-js'
import type { Workout } from '~/lib/workouts'

let supabaseClient: ReturnType<typeof createClient> | null = null

export const useSupabase = () => {
  const config = useRuntimeConfig()

  if (!supabaseClient) {
    supabaseClient = createClient(
      config.public.supabase.url,
      config.public.supabase.key,
    )
  }

  /**
   * Fetch all workouts from Supabase
   */
  const fetchWorkouts = async (): Promise<Workout[]> => {
    const { data, error } = await supabaseClient!
      .from('workouts')
      .select('*')
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Error fetching workouts:', error)
      throw error
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      uid: row.uid,
      summary: row.summary,
      description: row.description || '',
      start: new Date(row.start_date),
      end: row.end_date ? new Date(row.end_date) : null,
      isAllDay: row.is_all_day,
    }))
  }

  /**
   * Insert or bulk insert workouts to Supabase
   */
  const insertWorkouts = async (workouts: Workout[]): Promise<void> => {
    const rows = workouts.map((w) => ({
      uid: w.uid,
      summary: w.summary,
      description: w.description,
      start_date: w.start.toISOString(),
      end_date: w.end?.toISOString() || null,
      is_all_day: w.isAllDay,
    }))

    const { error } = await supabaseClient!
      .from('workouts')
      .upsert(rows, { onConflict: 'uid' })

    if (error) {
      console.error('Error inserting workouts:', error)
      throw error
    }
  }

  /**
   * Mark a workout as completed
   */
  const markWorkoutComplete = async (workoutId: string, completedDate: Date): Promise<void> => {
    const dateStr = completedDate.toISOString().split('T')[0]

    const { data: workout } = await supabaseClient!
      .from('workouts')
      .select('id')
      .eq('id', workoutId)
      .single()

    if (!workout) {
      console.error('Workout not found:', workoutId)
      throw new Error(`Workout ${workoutId} not found`)
    }

    const { error } = await supabaseClient!
      .from('workout_completion')
      .upsert(
        {
          workout_id: workout.id,
          completed_date: dateStr,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'workout_id,completed_date' },
      )

    if (error) {
      console.error('Error marking workout complete:', error)
      throw error
    }
  }

  /**
   * Mark a workout as incomplete (delete record)
   */
  const unmarkWorkoutComplete = async (workoutId: string, completedDate: Date): Promise<void> => {
    const dateStr = completedDate.toISOString().split('T')[0]

    const { data: workout } = await supabaseClient!
      .from('workouts')
      .select('id')
      .eq('id', workoutId)
      .single()

    if (!workout) {
      return
    }

    const { error } = await supabaseClient!
      .from('workout_completion')
      .delete()
      .eq('workout_id', workout.id)
      .eq('completed_date', dateStr)

    if (error) {
      console.error('Error unmarking workout complete:', error)
      throw error
    }
  }

  /**
   * Fetch completed workouts for a date range
   */
  const fetchCompletions = async (): Promise<Record<string, string[]>> => {
    const { data, error } = await supabaseClient!
      .from('workout_completion')
      .select('workout_id, completed_date')

    if (error) {
      console.error('Error fetching completions:', error)
      throw error
    }

    const completions: Record<string, string[]> = {}

    for (const row of data || []) {
      const date = row.completed_date
      if (!completions[date]) {
        completions[date] = []
      }
      completions[date].push(row.workout_id)
    }

    return completions
  }

  return {
    supabaseClient,
    fetchWorkouts,
    insertWorkouts,
    markWorkoutComplete,
    unmarkWorkoutComplete,
    fetchCompletions,
  }
}
