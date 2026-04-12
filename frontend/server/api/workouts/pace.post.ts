import { createClient } from '@supabase/supabase-js'

interface SavePaceRequest {
  workoutId: string
  pace: string
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

  const body = await readBody<SavePaceRequest>(event)
  const { workoutId, pace, date } = body

  if (!workoutId || !date) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: workoutId, date',
    })
  }

  try {
    const { error } = await supabase
      .from('workout_completion')
      .update({ pace: pace || null })
      .eq('workout_id', workoutId)
      .eq('completed_date', date)

    if (error) {
      console.error('Supabase update error:', error)
      throw error
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
