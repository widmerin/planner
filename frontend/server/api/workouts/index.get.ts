import { createClient } from '@supabase/supabase-js'

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

  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Supabase query error:', error)
      throw error
    }

    const workouts = (data || []).map((row: any) => ({
      id: row.id,
      uid: row.uid,
      summary: row.summary,
      description: row.description || '',
      start: new Date(row.start_date),
      end: row.end_date ? new Date(row.end_date) : null,
      isAllDay: row.is_all_day,
    }))

    return {
      success: true,
      workouts,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Fetch workouts error:', message)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch workouts: ${message}`,
    })
  }
})
