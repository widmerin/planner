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

  const workoutId = getRouterParam(event, 'id')
  if (!workoutId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing workout ID',
    })
  }

  try {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId)

    if (error) {
      console.error('Supabase delete error:', error)
      throw error
    }

    return {
      success: true,
      deleted: workoutId,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Delete workout error:', message)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to delete workout: ${message}`,
    })
  }
})
