<template>
  <div>
    <LoginScreen v-if="!isLoggedIn" @login="handleLogin" />

    <main
      v-else
      class="page"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <NuxtRouteAnnouncer />

      <header class="page-header">
        <div class="header-top">
          <div class="header-copy header-brand">
            <p class="eyebrow">Running Schedule</p>
            <h1>Week Planner</h1>
            <p class="subtitle">{{ weekLabel }}</p>
          </div>

          <div class="header-actions">
            <button type="button" class="btn btn-add" aria-label="Add workout" @click="openNewWorkoutModal">+</button>
            <div class="week-controls week-controls-compact">
              <button type="button" class="btn btn-nav" aria-label="Previous week" @click="goToPreviousWeek">&lt;</button>
              <button type="button" class="btn btn-primary btn-today" @click="goToCurrentWeek">Today</button>
              <button type="button" class="btn btn-nav" aria-label="Next week" @click="goToNextWeek">&gt;</button>
            </div>
          </div>
        </div>

        <div v-if="!isLoading && !loadError" class="progress-stack">
          <section class="progress-card progress-card-week">
            <div class="progress-card-head">
              <div>
                <p class="progress-kicker">This week</p>
                <strong>{{ weekMomentumLabel }}</strong>
              </div>
              <div class="progress-score">
                <span>{{ progressPercent }}%</span>
              </div>
            </div>

            <div class="progress-track-wrap">
              <div class="progress-track progress-track-week" role="progressbar" aria-label="This week progress" :aria-valuemin="0" :aria-valuemax="100" :aria-valuenow="progressPercent">
                <div class="progress-fill progress-fill-week" :style="{ width: `${progressPercent}%` }" />
              </div>

              <div class="progress-pips" aria-hidden="true">
                <span v-for="milestone in progressMilestones" :key="`week-${milestone}`" class="progress-pip" :class="{ active: progressPercent >= milestone }" />
              </div>
            </div>

            <div class="progress-meta playful-meta">
              <span>{{ doneCount }} of {{ totalCount }} workouts checked off</span>
              <span class="progress-caption">{{ totalCount - doneCount }} left</span>
            </div>
          </section>

          <section v-if="overallTotal > 0" class="progress-card all-weeks-card progress-card-season">
            <div class="progress-card-head">
              <div>
                <p class="progress-kicker">Full plan</p>
                <strong>{{ overallMomentumLabel }}</strong>
              </div>
              <div class="progress-score progress-score-secondary">
                <span>{{ overallProgressPercent }}%</span>
              </div>
            </div>

            <div class="progress-track-wrap">
              <div class="progress-track progress-track-season" role="progressbar" aria-label="All weeks progress" :aria-valuemin="0" :aria-valuemax="100" :aria-valuenow="overallProgressPercent">
                <div class="progress-fill progress-fill-season" :style="{ width: `${overallProgressPercent}%` }" />
              </div>

              <div class="progress-pips" aria-hidden="true">
                <span v-for="milestone in progressMilestones" :key="`season-${milestone}`" class="progress-pip progress-pip-secondary" :class="{ active: overallProgressPercent >= milestone }" />
              </div>
            </div>

            <div class="all-weeks-meta playful-meta">
              <span>{{ overallDoneCount }} of {{ overallTotal }} workouts completed</span>
              <span class="progress-caption">{{ overallTotal - overallDoneCount }} to go</span>
            </div>
          </section>
        </div>
      </header>

      <section v-if="isLoading" class="panel">Loading workouts…</section>
      <section v-else-if="loadError" class="panel panel-error">{{ loadError }}</section>

      <section v-else class="week-grid">
        <article v-for="day in weekDays" :key="toDayKey(day)" class="day-card" :class="{ today: isToday(day) }">
          <div class="day-label">{{ formatDayLabel(day) }} • {{ formatShortDate(day) }}</div>

          <ul v-if="workoutsForDay(day).length" class="workout-list">
            <li
              v-for="workout in workoutsForDay(day)"
              :key="workout.id"
              class="workout-item"
              :class="{ done: isDone(workout.id) }"
            >
              <label class="check-row">
                <input
                  type="checkbox"
                  :checked="isDone(workout.id)"
                  :aria-label="`Mark ${workout.summary} done`"
                  @change="onDoneChange(workout.id, $event)"
                >

                <span class="workout-content" :class="{ done: isDone(workout.id) }">
                  <span class="workout-title-row">
                    <strong>{{ workout.summary }}</strong>
                    <span v-if="canTrackPace(workout) && getPace(workout.id)" class="pace-inline">· {{ getPace(workout.id) }} min/km</span>
                    <span v-if="isDone(workout.id) && extractDistance(workout.description)" class="distance-badge">{{ extractDistance(workout.description) }} km</span>
                  </span>
                  <span class="time">{{ formatTimeRange(workout) }}</span>
                  <span v-if="workout.description" class="description">{{ workout.description }}</span>

                </span>
              </label>
              <div class="workout-actions">
                <button
                  v-if="canTrackPace(workout)"
                  type="button"
                  class="btn-pace"
                  :aria-label="`${getPace(workout.id) ? 'Edit' : 'Add'} pace for ${workout.summary}`"
                  @click="openPaceModal(workout.id)"
                >
                  ⏱
                </button>
                <button type="button" class="btn-delete" :aria-label="`Delete ${workout.summary}`" @click="confirmDelete(workout)">✕</button>
                <button type="button" class="btn-edit" :aria-label="`Edit ${workout.summary}`" @click="openEditModal(workout)">✎</button>
              </div>
            </li>
          </ul>

          <p v-else class="empty">No workout planned.</p>
        </article>
      </section>

      <footer v-if="!isLoading && !loadError" class="page-footer">
        <button type="button" class="btn export-btn" @click="exportWorkoutsAsJson">
          <span aria-hidden="true">⤓</span>
          <span>Export JSON</span>
        </button>
      </footer>

      <div
        v-if="activePaceWorkout"
        class="modal-backdrop"
        role="presentation"
        @click="closePaceModal"
      >
        <section
          class="pace-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pace-modal-title"
          @click.stop
        >
          <h2 id="pace-modal-title">{{ getPace(activePaceWorkout?.id ?? '') ? 'Update pace' : 'Add pace' }}</h2>
          <p class="pace-modal-summary">{{ activePaceWorkout.summary }}</p>

          <label for="pace-modal-input" class="pace-label">Pace (min/km)</label>
          <input
            id="pace-modal-input"
            v-model="paceDraft"
            class="pace-input"
            type="text"
            inputmode="decimal"
            placeholder="e.g. 6:05"
            @keyup.enter="savePaceFromModal"
          >

          <div class="pace-modal-actions">
            <button type="button" class="btn" @click="closePaceModal">Done</button>
            <button type="button" class="btn btn-primary" @click="savePaceFromModal">Save</button>
          </div>
        </section>
      </div>

      <EditWorkoutModal
        :is-open="showEditModal"
        :is-new="isCreatingWorkout"
        :workout="editingWorkout"
        @save="onWorkoutSave"
        @cancel="onEditCancel"
      />

      <div
        v-if="deletingWorkout"
        class="modal-backdrop"
        role="presentation"
        @click="cancelDelete"
      >
        <section
          class="delete-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          @click.stop
        >
          <h2 id="delete-modal-title">Delete Workout?</h2>
          <p>Are you sure you want to delete "{{ deletingWorkout.summary }}"?</p>
          <div class="delete-modal-actions">
            <button type="button" class="btn" @click="cancelDelete">Cancel</button>
            <button type="button" class="btn btn-danger" @click="executeDelete">Delete</button>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStorage } from '@vueuse/core'
import LoginScreen from '~/components/LoginScreen.vue'
import EditWorkoutModal from '~/components/EditWorkoutModal.vue'
import {
  formatTimeRange,
  getIsoWeekDays,
  normalizeWorkout,
  parseWorkoutsFromICS,
  startOfIsoWeek,
  toDayKey,
  workoutsByDayForWeek,
  type Workout,
} from '~/lib/workouts'
import { isAuthenticated, logout } from '~/lib/auth'

const isLoggedIn = ref(false)
const anchorDate = ref(new Date())
const workouts = ref<Workout[]>([])
const isLoading = ref(true)
const loadError = ref('')
const doneState = useStorage<Record<string, boolean>>('weekplanner-done-v1', {})
const paceState = useStorage<Record<string, string>>('weekplanner-pace-v1', {})
const activePaceWorkoutId = ref<string | null>(null)
const paceDraft = ref('')
const touchStartX = ref<number | null>(null)
const touchStartY = ref<number | null>(null)
const showEditModal = ref(false)
const editingWorkout = ref<Partial<Workout> | null>(null)
const isCreatingWorkout = ref(false)
const deletingWorkout = ref<Workout | null>(null)
const isDeleting = ref(false)

const weekStart = computed(() => startOfIsoWeek(anchorDate.value))
const weekDays = computed(() => getIsoWeekDays(weekStart.value))
const todayDayKey = computed(() => toDayKey(new Date()))
const workoutsByDay = computed(() => workoutsByDayForWeek(workouts.value, weekStart.value))
const weekWorkouts = computed(() => {
  return weekDays.value.flatMap((day) => workoutsByDay.value[toDayKey(day)] ?? [])
})
const totalCount = computed(() => weekWorkouts.value.length)
const doneCount = computed(() => weekWorkouts.value.filter((workout) => isDone(workout.id)).length)
const progressPercent = computed(() => {
  if (!totalCount.value) {
    return 0
  }
  return Math.round((doneCount.value / totalCount.value) * 100)
})

const overallDoneCount = computed(() => {
  return workouts.value.filter((workout) => isDone(workout.id)).length
})

const overallTotal = computed(() => workouts.value.length)

const overallProgressPercent = computed(() => {
  if (!overallTotal.value) {
    return 0
  }
  return Math.round((overallDoneCount.value / overallTotal.value) * 100)
})

const progressMilestones = [0, 25, 50, 75, 100]

const weekMomentumLabel = computed(() => {
  if (!totalCount.value) {
    return 'Recovery mode'
  }
  if (progressPercent.value === 100) {
    return 'Week cleared'
  }
  if (progressPercent.value >= 75) {
    return 'Strong finish'
  }
  if (progressPercent.value >= 40) {
    return 'Good rhythm'
  }
  return 'Warm-up phase'
})

const overallMomentumLabel = computed(() => {
  if (!overallTotal.value) {
    return 'Plan loading'
  }
  if (overallProgressPercent.value === 100) {
    return 'Season complete'
  }
  if (overallProgressPercent.value >= 70) {
    return 'Cruising'
  }
  if (overallProgressPercent.value >= 35) {
    return 'Building volume'
  }
  return 'Base training'
})

const weekLabel = computed(() => {
  const firstDay = weekStart.value
  const lastDay = new Date(firstDay)
  lastDay.setDate(lastDay.getDate() + 6)

  const monthFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  })
  return `${monthFormatter.format(firstDay)} – ${monthFormatter.format(lastDay)}`
})

const formatDayLabel = (date: Date) => {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
  }).format(date)
}

const formatShortDate = (date: Date) => {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

const workoutsForDay = (date: Date) => {
  return workoutsByDay.value[toDayKey(date)] ?? []
}

const isToday = (date: Date) => {
  return toDayKey(date) === todayDayKey.value
}

const activePaceWorkout = computed(() => {
  if (!activePaceWorkoutId.value) {
    return null
  }

  return workouts.value.find((workout) => workout.id === activePaceWorkoutId.value) ?? null
})

const isDone = (id: string) => Boolean(doneState.value[id])

const canTrackPace = (workout: Workout) => {
  const summary = workout.summary.toLowerCase()
  return !summary.includes('yoga') && !summary.includes('fahrrad')
}

const canTrackPaceById = (id: string) => {
  const workout = workouts.value.find((entry) => entry.id === id)
  if (!workout) {
    return false
  }

  return canTrackPace(workout)
}

const getPace = (id: string) => paceState.value[id] ?? ''

const extractDistance = (description: string): string => {
  const match = description.match(/^(\d+(?:[.,]\d+)?)\s*km/i)
  return match ? match[1] : ''
}

const normalizePace = (pace: string) => {
  const value = pace.trim()
  if (!value) {
    return ''
  }

  const match = value.match(/^(\d{1,2})[\.,:](\d{1,2})$/)
  if (!match) {
    return value
  }

  const minutes = String(Number.parseInt(match[1], 10))
  const seconds = String(Number.parseInt(match[2], 10)).padStart(2, '0')
  return `${minutes}:${seconds}`
}

const setPace = (id: string, pace: string) => {
  const value = normalizePace(pace)

  if (!value) {
    const { [id]: _, ...rest } = paceState.value
    paceState.value = rest
  } else {
    paceState.value = {
      ...paceState.value,
      [id]: value,
    }
  }

  // Sync to Supabase
  const workout = workouts.value.find((w) => w.id === id)
  if (workout) {
    const dateStr = toDayKey(workout.start)
    syncPaceToSupabase(id, value, dateStr).catch((error) => {
      console.warn('Could not sync pace to Supabase:', error)
    })
  }
}

const syncPaceToSupabase = async (workoutId: string, pace: string, date: string) => {
  try {
    const response = await fetch('/api/workouts/pace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workoutId, pace, date }),
    })

    if (!response.ok) {
      throw new Error(`Failed to sync pace: ${response.status}`)
    }
  } catch (error) {
    console.warn('Error syncing pace:', error)
  }
}

const setDone = (id: string, done: boolean) => {
  if (!done) {
    const { [id]: _, ...rest } = paceState.value
    paceState.value = rest
  }

  doneState.value = {
    ...doneState.value,
    [id]: done,
  }

  // Sync to Supabase
  const workout = workouts.value.find((w) => w.id === id)
  if (workout) {
    const dateStr = toDayKey(workout.start)
    syncCompletionToSupabase(id, done, dateStr).catch((error) => {
      console.warn('Could not sync completion to Supabase:', error)
    })
  }
}

const syncCompletionToSupabase = async (workoutId: string, completed: boolean, date: string) => {
  try {
    const response = await fetch('/api/workouts/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workoutId, completed, date }),
    })

    if (!response.ok) {
      throw new Error(`Failed to sync: ${response.status}`)
    }
  } catch (error) {
    console.warn('Error syncing completion:', error)
  }
}

const onDoneChange = (id: string, event: Event) => {
  const checkbox = event.target as HTMLInputElement | null
  const checked = Boolean(checkbox?.checked)

  setDone(id, checked)

  if (checked && canTrackPaceById(id)) {
    openPaceModal(id)
  }
}

const openPaceModal = (id: string) => {
  activePaceWorkoutId.value = id
  paceDraft.value = getPace(id)
}

const closePaceModal = () => {
  activePaceWorkoutId.value = null
  paceDraft.value = ''
}

const savePaceFromModal = () => {
  if (!activePaceWorkoutId.value) {
    return
  }

  setPace(activePaceWorkoutId.value, paceDraft.value)
  closePaceModal()
}

const exportWorkoutsAsJson = () => {
  const payload = {
    exportedAt: new Date().toISOString(),
    workouts: workouts.value.map((workout) => ({
      id: workout.id,
      uid: workout.uid,
      summary: workout.summary,
      description: workout.description,
      start: workout.start.toISOString(),
      end: workout.end ? workout.end.toISOString() : null,
      isAllDay: workout.isAllDay,
      done: isDone(workout.id),
      pace: getPace(workout.id) || null,
    })),
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const day = new Date().toISOString().slice(0, 10)

  link.href = url
  link.download = `workouts-export-${day}.json`
  link.click()

  URL.revokeObjectURL(url)
}

const openEditModal = (workout: Workout) => {
  editingWorkout.value = { ...workout }
  isCreatingWorkout.value = false
  showEditModal.value = true
}

const openNewWorkoutModal = () => {
  const defaultDate = new Date(weekStart.value)
  defaultDate.setHours(9, 0, 0, 0)
  editingWorkout.value = {
    summary: '',
    description: '',
    start: defaultDate,
    end: null,
    isAllDay: false,
  }
  isCreatingWorkout.value = true
  showEditModal.value = true
}

const onWorkoutSave = async (draft: Partial<Workout>) => {
  if (isCreatingWorkout.value) {
    await createWorkout(draft)
  } else {
    await updateWorkout(draft)
  }
}

const createWorkout = async (draft: Partial<Workout>) => {
  try {
    const response = await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: draft.summary,
        description: draft.description,
        start: draft.start instanceof Date ? draft.start.toISOString() : draft.start,
        end: draft.end instanceof Date ? draft.end.toISOString() : draft.end,
        isAllDay: draft.isAllDay,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.statusMessage || `Create failed: ${response.status}`)
    }

    const data = await response.json()
    const normalized = normalizeWorkout(data.workout)

    workouts.value = [...workouts.value, normalized].sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    )

    showEditModal.value = false
    editingWorkout.value = null
    isCreatingWorkout.value = false
  } catch (error) {
    console.error('Error creating workout:', error)
    throw error
  }
}

const updateWorkout = async (draft: Partial<Workout>) => {
  if (!editingWorkout.value?.id) {
    console.error('No workout ID to update')
    return
  }

  try {
    const response = await fetch(`/api/workouts/${editingWorkout.value.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: draft.summary,
        description: draft.description,
        start: draft.start instanceof Date ? draft.start.toISOString() : draft.start,
        end: draft.end instanceof Date ? draft.end.toISOString() : draft.end,
        isAllDay: draft.isAllDay,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.statusMessage || `Update failed: ${response.status}`)
    }

    const updatedWorkout = await response.json()
    const normalized = normalizeWorkout(updatedWorkout.workout)

    const index = workouts.value.findIndex((w) => w.id === normalized.id)
    if (index >= 0) {
      workouts.value[index] = normalized
    }

    showEditModal.value = false
    editingWorkout.value = null
  } catch (error) {
    console.error('Error updating workout:', error)
    throw error
  }
}

const onEditCancel = () => {
  showEditModal.value = false
  editingWorkout.value = null
  isCreatingWorkout.value = false
}

const confirmDelete = (workout: Workout) => {
  deletingWorkout.value = workout
}

const cancelDelete = () => {
  deletingWorkout.value = null
}

const executeDelete = async () => {
  if (!deletingWorkout.value) {
    return
  }

  isDeleting.value = true
  const workoutId = deletingWorkout.value.id

  try {
    const response = await fetch(`/api/workouts/${workoutId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.statusMessage || `Delete failed: ${response.status}`)
    }

    workouts.value = workouts.value.filter((w) => w.id !== workoutId)
    deletingWorkout.value = null
  } catch (error) {
    console.error('Error deleting workout:', error)
    throw error
  } finally {
    isDeleting.value = false
  }
}

const goToPreviousWeek = () => {
  const nextDate = new Date(anchorDate.value)
  nextDate.setDate(nextDate.getDate() - 7)
  anchorDate.value = nextDate
}

const goToNextWeek = () => {
  const nextDate = new Date(anchorDate.value)
  nextDate.setDate(nextDate.getDate() + 7)
  anchorDate.value = nextDate
}

const goToCurrentWeek = () => {
  anchorDate.value = new Date()
}

const onTouchStart = (event: TouchEvent) => {
  if (activePaceWorkout.value || showEditModal.value) {
    return
  }

  const touch = event.changedTouches.item(0)
  if (!touch) {
    return
  }

  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
}

const onTouchEnd = (event: TouchEvent) => {
  if (activePaceWorkout.value || showEditModal.value) {
    return
  }

  const touch = event.changedTouches.item(0)
  if (!touch || touchStartX.value === null || touchStartY.value === null) {
    return
  }

  const deltaX = touch.clientX - touchStartX.value
  const deltaY = touch.clientY - touchStartY.value
  const horizontalThreshold = 56

  touchStartX.value = null
  touchStartY.value = null

  if (Math.abs(deltaX) < horizontalThreshold || Math.abs(deltaX) <= Math.abs(deltaY)) {
    return
  }

  if (deltaX < 0) {
    goToNextWeek()
    return
  }

  goToPreviousWeek()
}

const handleLogin = () => {
  isLoggedIn.value = true
  loadWorkouts()
}

const handleLogout = () => {
  void logout()
  isLoggedIn.value = false
  anchorDate.value = new Date()
}

const loadWorkouts = async () => {
  try {
    // Fetch workouts from Supabase
    const response = await fetch('/api/workouts')
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const message = errorData.statusMessage || `HTTP ${response.status}`
      throw new Error(`Could not load workouts: ${message}`)
    }

    const data = await response.json()
    if (!data.workouts || data.workouts.length === 0) {
      console.warn('No workouts in database yet. Trying to sync from ICS...')
    }
    workouts.value = data.workouts.map(normalizeWorkout)

    // Load completions from Supabase
    const completionsResponse = await fetch('/api/workouts/completions')
    if (completionsResponse.ok) {
      const completionsData = await completionsResponse.json()
      // Sync completions to local state
      for (const [date, workoutIds] of Object.entries(completionsData.completions)) {
        for (const workoutId of workoutIds as string[]) {
          doneState.value[workoutId] = true
        }
      }
      // Load pace data from Supabase
      if (completionsData.paces) {
        paceState.value = {
          ...paceState.value,
          ...completionsData.paces,
        }
      }
    }
  }
  catch (error) {
    console.error('Error loading workouts:', error)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    loadError.value = `Unable to load workouts: ${errorMsg}`
  }
  finally {
    isLoading.value = false
  }
}

const syncWorkoutsToSupabase = async () => {
  try {
    const response = await fetch('/api/workouts/sync', { method: 'POST' })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.warn('Sync failed:', errorData.statusMessage || response.status)
      return false
    }
    const data = await response.json()
    console.log(`✓ Synced ${data.synced} workouts from ICS`)
    return true
  }
  catch (error) {
    console.warn('Error syncing workouts:', error)
    return false
  }
}

useHead({
  title: 'Week Planner',
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
  ],
})

onMounted(async () => {
  anchorDate.value = new Date()

  if (await isAuthenticated()) {
    isLoggedIn.value = true
    // Sync workouts from ICS to Supabase on first load
    await syncWorkoutsToSupabase()
    // Then load all workouts and completions
    loadWorkouts()
  }
})
</script>

<style scoped>
.btn-add {
  background: #00d9a3;
  color: white;
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.5rem;
  font-weight: 300;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, transform 0.1s;
  padding: 0;
  line-height: 1;
}

.btn-add:hover {
  background: #00c691;
  transform: scale(1.05);
}

.btn-add:active {
  transform: scale(0.95);
}

.btn-add:focus {
  outline: 2px solid #00d9a3;
  outline-offset: 2px;
}

.workout-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.workout-item:hover .workout-actions {
  opacity: 1;
}

.btn-pace {
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem 0.4rem;
  color: #666;
  border-radius: 4px;
  min-width: 2rem;
  min-height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s, color 0.2s, background 0.2s;
  opacity: 1;
}

.btn-pace:hover {
  color: #00d9a3;
  background: rgba(0, 217, 163, 0.1);
}

.btn-pace:focus {
  outline: 2px solid #00d9a3;
  outline-offset: 2px;
}

.btn-pace.has-pace {
  color: #00d9a3;
}

.btn-edit,
.btn-delete {
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem 0.4rem;
  color: #666;
  border-radius: 4px;
  min-width: 2rem;
  min-height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s, color 0.2s, background 0.2s;
}

.btn-edit:hover {
  color: #00d9a3;
  background: rgba(0, 217, 163, 0.1);
}

.btn-edit:focus {
  outline: 2px solid #00d9a3;
  outline-offset: 2px;
}

.btn-delete:hover {
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

.btn-delete:focus {
  outline: 2px solid #e74c3c;
  outline-offset: 2px;
}

.workout-item {
  position: relative;
}

.delete-modal {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.delete-modal h2 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #1a1a1a;
}

.delete-modal p {
  margin: 0 0 1.5rem 0;
  color: #666;
}

.delete-modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-danger {
  background: #e74c3c;
  color: white;
  border-color: #e74c3c;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
  border-color: #c0392b;
}
</style>

