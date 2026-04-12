import { createClient } from '@supabase/supabase-js'

interface SavePaceRequest {
  workoutId: string
  pace: string // e.g., "6:05" or empty string to delete
  date: string // YYYY-MM-DD
}

export default defineEventHandler(async (event) => {
  const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseKey = process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!supabaseUrl || !supabaseKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase credentials not configured',
    })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const body = await readBody<SavePaceRequest>(event)
  const { workoutId, pace, date } = body

  if (!workoutId || !date) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: workoutId, date',
    })
  }

  try {
    if (!pace) {
      // Clear pace for this workout
      const { error } = await supabase
        .from('workout_completion')
        .update({ pace: null })
        .eq('workout_id', workoutId)
        .eq('completed_date', date)

      if (error) {
        console.error('Supabase update error:', error)
        throw error
      }
    } else {
      // Save pace for this workout
      const { error } = await supabase
        .from('workout_completion')
        .update({ pace })
        .eq('workout_id', workoutId)
        .eq('completed_date', date)

      if (error) {
        console.error('Supabase update error:', error)
        throw error
      }
    }

    return {
      success: true,
      workoutId,
      pace,
      date,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Save pace error:', message)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to save pace: ${message}`,
    })
  }
})
