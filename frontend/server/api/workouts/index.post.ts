import { createClient } from '@supabase/supabase-js'

interface CreateWorkoutRequest {
  summary: string
  description?: string
  start: string
  end?: string | null
  isAllDay?: boolean
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

  const body = await readBody<CreateWorkoutRequest>(event)

  if (!body.summary?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Summary is required',
    })
  }

  if (body.summary.length > 200) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Summary must be 200 characters or less',
    })
  }

  if (body.description && body.description.length > 1000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Description must be 1000 characters or less',
    })
  }

  if (!body.start) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Start date is required',
    })
  }

  const startDate = new Date(body.start)
  if (isNaN(startDate.getTime())) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid start date format',
    })
  }

  if (body.end) {
    const endDate = new Date(body.end)
    if (isNaN(endDate.getTime())) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid end date format',
      })
    }
    if (endDate <= startDate) {
      throw createError({
        statusCode: 400,
        statusMessage: 'End time must be after start time',
      })
    }
  }

  const uid = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  try {
    const { data, error } = await supabase
      .from('workouts')
      .insert({
        uid,
        summary: body.summary.trim(),
        description: body.description?.trim() || null,
        start_date: startDate.toISOString(),
        end_date: body.end ? new Date(body.end).toISOString() : null,
        is_all_day: body.isAllDay ?? false,
        source: 'user-created',
        edited_by_user: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      throw error
    }

    const normalizedWorkout = {
      id: data.id,
      uid: data.uid,
      summary: data.summary,
      description: data.description || '',
      start: new Date(data.start_date),
      end: data.end_date ? new Date(data.end_date) : null,
      isAllDay: data.is_all_day,
      source: data.source,
      edited_by_user: data.edited_by_user,
    }

    return {
      success: true,
      workout: normalizedWorkout,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Create workout error:', message)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to create workout: ${message}`,
    })
  }
})
