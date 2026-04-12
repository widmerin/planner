import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async () => {
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

  try {
    const { data, error } = await supabase
      .from('workout_completion')
      .select('workout_id, completed_date, pace')

    if (error) {
      console.error('Supabase query error:', error)
      throw error
    }

    const completions: Record<string, string[]> = {}
    const paces: Record<string, string> = {}

    for (const row of data || []) {
      const date = row.completed_date
      if (!completions[date]) {
        completions[date] = []
      }
      completions[date].push(row.workout_id)
      
      if (row.pace) {
        paces[row.workout_id] = row.pace
      }
    }

    return {
      success: true,
      completions,
      paces,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Fetch completions error:', message)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch completions: ${message}`,
    })
  }
})
