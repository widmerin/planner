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
          <h2 id="pace-modal-title">Add pace</h2>
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
            <button type="button" class="btn" @click="closePaceModal">Skip</button>
            <button type="button" class="btn btn-primary" @click="savePaceFromModal">Save</button>
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
import {
  formatTimeRange,
  getIsoWeekDays,
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
    return
  }

  paceState.value = {
    ...paceState.value,
    [id]: value,
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
  if (activePaceWorkout.value) {
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
  if (activePaceWorkout.value) {
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
    const response = await fetch('/data/trainingsplan_v2.ics')
    if (!response.ok) {
      throw new Error(`Could not load calendar: ${response.status}`)
    }

    const icsText = await response.text()
    workouts.value = parseWorkoutsFromICS(icsText)
  }
  catch {
    loadError.value = 'Could not load the workout plan.'
  }
  finally {
    isLoading.value = false
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
    loadWorkouts()
  }
})
</script>

