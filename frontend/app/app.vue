<template>
  <main class="page">
    <NuxtRouteAnnouncer />

    <header class="page-header">
      <p class="eyebrow">Running Schedule</p>
      <h1>Week Planner</h1>
      <p class="subtitle">{{ weekLabel }}</p>

      <div class="week-controls">
        <button type="button" class="btn" @click="goToPreviousWeek">Previous</button>
        <button type="button" class="btn btn-primary" @click="goToCurrentWeek">Current</button>
        <button type="button" class="btn" @click="goToNextWeek">Next</button>
      </div>
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
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStorage } from '@vueuse/core'
import {
  formatTimeRange,
  getIsoWeekDays,
  parseWorkoutsFromICS,
  startOfIsoWeek,
  toDayKey,
  workoutsByDayForWeek,
  type Workout,
} from '~/lib/workouts'

const anchorDate = ref(new Date())
const workouts = ref<Workout[]>([])
const isLoading = ref(true)
const loadError = ref('')
const doneState = useStorage<Record<string, boolean>>('weekplanner-done-v1', {})

const weekStart = computed(() => startOfIsoWeek(anchorDate.value))
const weekDays = computed(() => getIsoWeekDays(weekStart.value))
const workoutsByDay = computed(() => workoutsByDayForWeek(workouts.value, weekStart.value))

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

onMounted(async () => {
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
})
</script>
