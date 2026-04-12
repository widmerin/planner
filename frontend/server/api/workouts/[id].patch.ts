import { createClient } from '@supabase/supabase-js'

interface UpdateWorkoutRequest {
  summary?: string
  description?: string
  start_date?: string
  end_date?: string | null
  is_all_day?: boolean
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

  const workoutId = getRouterParam(event, 'id')
  if (!workoutId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing workout ID',
    })
  }

  const body = await readBody<UpdateWorkoutRequest>(event)
  const { summary, description, start_date, end_date, is_all_day } = body

  if (!summary?.trim() && !description && !start_date && end_date === undefined && is_all_day === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least one field must be provided for update',
    })
  }

  if (summary && summary.length > 200) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Summary must be 200 characters or less',
    })
  }

  if (description && description.length > 1000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Description must be 1000 characters or less',
    })
  }

  const updateData: Record<string, any> = {}

  if (summary !== undefined) updateData.summary = summary
  if (description !== undefined) updateData.description = description
  if (start_date !== undefined) updateData.start_date = start_date
  if (end_date !== undefined) updateData.end_date = end_date
  if (is_all_day !== undefined) updateData.is_all_day = is_all_day

  try {
    const { data, error } = await supabase
      .from('workouts')
      .update(updateData)
      .eq('id', workoutId)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${error.message}`,
      })
    }

    const normalizedWorkout = {
      id: data.id,
      uid: data.uid,
      summary: data.summary,
      description: data.description || '',
      start: new Date(data.start_date),
      end: data.end_date ? new Date(data.end_date) : null,
      isAllDay: data.is_all_day,
    }

    return {
      success: true,
      workout: normalizedWorkout,
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    const message = error instanceof Error ? error.message : String(error)
    console.error('Update workout error:', message)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to update workout: ${message}`,
    })
  }
})
