import { createClient } from '@supabase/supabase-js'

interface ToggleRequest {
  workoutId: string
  completed: boolean
  date: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabase.url?.trim()
  const supabaseKey = config.public.supabase.key?.trim()

  if (!supabaseUrl || !supabaseKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase credentials not configured',
    })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const body = await readBody<ToggleRequest>(event)
  const { workoutId, completed, date } = body

  if (!workoutId || !date || completed === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: workoutId, date, completed',
    })
  }

  try {
    if (completed) {
      const { error } = await supabase
        .from('workout_completion')
        .upsert(
          {
            workout_id: workoutId,
            completed_date: date,
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'workout_id,completed_date' },
        )

      if (error) {
        throw error
      }
    } else {
      const { error } = await supabase
        .from('workout_completion')
        .delete()
        .eq('workout_id', workoutId)
        .eq('completed_date', date)

      if (error) {
        throw error
      }
    }

    return {
      success: true,
      workoutId,
      completed,
      date,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Toggle completion error:', message)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to toggle completion status: ${message}`,
    })
  }
})
