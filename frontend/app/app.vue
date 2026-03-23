<template>
  <div>
    <LoginScreen v-if="!isLoggedIn" @login="handleLogin" />

    <main v-else class="page">
      <NuxtRouteAnnouncer />

      <header class="page-header">
        <div class="header-top">
          <div>
            <p class="eyebrow">Running Schedule</p>
            <h1>Week Planner</h1>
          </div>
          <button type="button" class="logout-btn" @click="handleLogout" title="Sign out">Sign Out</button>
        </div>

        <p class="subtitle">{{ weekLabel }}</p>

        <div class="week-controls">
          <button type="button" class="btn" @click="goToPreviousWeek">Previous</button>
          <button type="button" class="btn btn-primary" @click="goToCurrentWeek">Current</button>
          <button type="button" class="btn" @click="goToNextWeek">Next</button>
        </div>

        <section v-if="!isLoading && !loadError" class="progress-card">
          <div class="progress-meta">
            <strong>Overall progress</strong>
            <span>{{ doneCount }} / {{ totalCount }} done ({{ progressPercent }}%)</span>
          </div>
          <div class="progress-track" role="progressbar" aria-label="Overall progress" :aria-valuemin="0" :aria-valuemax="100" :aria-valuenow="progressPercent">
            <div class="progress-fill" :style="{ width: `${progressPercent}%` }" />
          </div>
        </section>

        <section v-if="!isLoading && !loadError && overallTotal > 0" class="all-weeks-card">
          <div class="all-weeks-meta">
            <strong>All weeks</strong>
            <span>{{ overallDoneCount }} / {{ overallTotal }} workouts ({{ overallProgressPercent }}%)</span>
          </div>
          <div class="progress-track" role="progressbar" aria-label="All weeks progress" :aria-valuemin="0" :aria-valuemax="100" :aria-valuenow="overallProgressPercent">
            <div class="progress-fill" :style="{ width: `${overallProgressPercent}%` }" />
          </div>
        </section>
      </header>

      <section v-if="isLoading" class="panel">Loading workouts…</section>
      <section v-else-if="loadError" class="panel panel-error">{{ loadError }}</section>

      <section v-else class="week-grid">
        <article v-for="day in weekDays" :key="toDayKey(day)" class="day-card">
          <header class="day-header">
            <h2>{{ formatDayLabel(day) }}</h2>
            <p>{{ formatShortDate(day) }}</p>
          </header>

          <ul v-if="workoutsForDay(day).length" class="workout-list">
            <li v-for="workout in workoutsForDay(day)" :key="workout.id" class="workout-item">
              <label class="check-row">
                <input
                  type="checkbox"
                  :checked="isDone(workout.id)"
                  :aria-label="`Mark ${workout.summary} done`"
                  @change="toggleDone(workout.id)"
                >

                <span class="workout-content" :class="{ done: isDone(workout.id) }">
                  <strong>{{ workout.summary }}</strong>
                  <span class="time">{{ formatTimeRange(workout) }}</span>
                  <span v-if="workout.description" class="description">{{ workout.description }}</span>
                </span>
              </label>
            </li>
          </ul>

          <p v-else class="empty">No workout planned.</p>
        </article>
      </section>
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
import { isAuthenticated, clearAuthToken } from '~/lib/auth'

const isLoggedIn = ref(false)
const anchorDate = ref(new Date())
const workouts = ref<Workout[]>([])
const isLoading = ref(true)
const loadError = ref('')
const doneState = useStorage<Record<string, boolean>>('weekplanner-done-v1', {})

const weekStart = computed(() => startOfIsoWeek(anchorDate.value))
const weekDays = computed(() => getIsoWeekDays(weekStart.value))
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

const isDone = (id: string) => Boolean(doneState.value[id])

const toggleDone = (id: string) => {
  doneState.value = {
    ...doneState.value,
    [id]: !doneState.value[id],
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

const handleLogin = () => {
  isLoggedIn.value = true
  loadWorkouts()
}

const handleLogout = () => {
  clearAuthToken()
  isLoggedIn.value = false
  anchorDate.value = new Date()
}

const loadWorkouts = async () => {
  try {
    const response = await fetch('/trainingsplan_v2.ics')
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

onMounted(() => {
  // Always reset to current week
  anchorDate.value = new Date()

  // Check if already authenticated
  if (isAuthenticated()) {
    isLoggedIn.value = true
    loadWorkouts()
  }
})
</script>

