import { createClient } from '@supabase/supabase-js'

interface UpdateWorkoutRequest {
  summary?: string
  description?: string
  start_date?: string
  end_date?: string | null
  is_all_day?: boolean
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

  if (start_date && end_date && new Date(end_date) <= new Date(start_date)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'End time must be after start time',
    })
  }

  try {
    // Fetch existing workout to verify it exists
    const { data: existingWorkout, error: fetchError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single()

    if (fetchError || !existingWorkout) {
      throw createError({
        statusCode: 404,
        statusMessage: `Workout ${workoutId} not found`,
      })
    }

    // Update workout
    const updateData: any = {
      updated_at: new Date().toISOString(),
      edited_by_user: true,
    }

    if (summary) updateData.summary = summary
    if (description !== undefined) updateData.description = description
    if (start_date) updateData.start_date = start_date
    if (end_date !== undefined) updateData.end_date = end_date
    if (is_all_day !== undefined) updateData.is_all_day = is_all_day

    const { error: updateError } = await supabase
      .from('workouts')
      .update(updateData)
      .eq('id', workoutId)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      throw updateError
    }

    // Fetch updated workout
    const { data: updatedWorkout, error: fetchUpdatedError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId)
      .single()

    if (fetchUpdatedError) {
      throw fetchUpdatedError
    }

    // Transform from database format
    const normalizedWorkout = {
      id: updatedWorkout.id,
      uid: updatedWorkout.uid,
      summary: updatedWorkout.summary,
      description: updatedWorkout.description || '',
      start: new Date(updatedWorkout.start_date),
      end: updatedWorkout.end_date ? new Date(updatedWorkout.end_date) : null,
      isAllDay: updatedWorkout.is_all_day,
      source: updatedWorkout.source,
      edited_by_user: updatedWorkout.edited_by_user,
      created_at: updatedWorkout.created_at,
      updated_at: updatedWorkout.updated_at,
    }

    return {
      success: true,
      workout: normalizedWorkout,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Update workout error:', message)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to update workout: ${message}`,
    })
  }
})
