import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async () => {
  const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseKey = process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!supabaseUrl || !supabaseKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase credentials not configured. Set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
    })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Fetch current workout count from Supabase
    const { count, error } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })

    if (error) {
      throw error
    }

    return {
      success: true,
      synced: count ?? 0,
      message: `${count ?? 0} workouts available in Supabase`,
    }
  } catch (error) {
    console.error('Sync error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check workouts',
    })
  }
})
