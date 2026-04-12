import { createClient } from '@supabase/supabase-js'
import { parseWorkoutsFromICS } from '~/lib/workouts'
import fs from 'fs'
import path from 'path'

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
    // Read ICS file - try multiple paths
    let icsContent: string | null = null
    const possiblePaths = [
      path.join(process.cwd(), 'public/data/trainingsplan_v2.ics'),
      path.join(process.cwd(), 'frontend/public/data/trainingsplan_v2.ics'),
    ]

    for (const icsPath of possiblePaths) {
      try {
        if (fs.existsSync(icsPath)) {
          icsContent = fs.readFileSync(icsPath, 'utf-8')
          break
        }
      } catch {
        // Continue to next path
      }
    }

    if (!icsContent) {
      throw new Error(`ICS file not found in any of: ${possiblePaths.join(', ')}`)
    }

    // Parse workouts
    const workouts = parseWorkoutsFromICS(icsContent)

    // Transform for database
    const workoutRows = workouts.map((w) => ({
      uid: w.uid,
      summary: w.summary,
      description: w.description,
      start_date: w.start.toISOString(),
      end_date: w.end?.toISOString() || null,
      is_all_day: w.isAllDay,
    }))

    // Upsert to database
    const { error } = await supabase
      .from('workouts')
      .upsert(workoutRows, { onConflict: 'uid' })

    if (error) {
      console.error('Supabase upsert error:', JSON.stringify(error, null, 2))
      throw error
    }

    return {
      success: true,
      synced: workoutRows.length,
      message: `Synced ${workoutRows.length} workouts`,
    }
  } catch (error) {
    console.error('Sync error details:', error)
    let message = 'Unknown error'
    
    if (error && typeof error === 'object') {
      if ('message' in error) {
        message = (error as any).message
      } else {
        message = JSON.stringify(error)
      }
    } else if (error instanceof Error) {
      message = error.message
    }
    
    console.error('Sync error message:', message)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to sync workouts: ${message}`,
    })
  }
})
