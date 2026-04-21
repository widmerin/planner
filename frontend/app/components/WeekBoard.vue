<template>
  <section class="week-board" aria-label="4 week board">
    <article
      v-for="week in weeks"
      :key="toDayKey(week.weekStart)"
      class="week-board-week"
      :data-week-start="toDayKey(week.weekStart)"
    >
      <header class="week-board-week-header">
        <h2 class="week-board-week-title">{{ formatWeekLabel(week.weekStart) }}</h2>
      </header>

      <div class="week-board-days">
        <section
          v-for="day in week.days"
          :key="toDayKey(day)"
          class="week-board-day"
          :class="{ today: toDayKey(day) === todayKey, 'is-drag-over': activeDropDayKey === toDayKey(day) }"
          :data-day-key="toDayKey(day)"
          @dragenter="onDayDragEnter($event, toDayKey(day))"
          @dragleave="onDayDragLeave($event, toDayKey(day))"
          @dragover="onDayDragOver"
          @drop="onDayDrop($event, toDayKey(day))"
        >
          <header class="week-board-day-header">
            <div class="week-board-day-title">{{ formatDayLabel(day) }}</div>
            <div class="week-board-day-date">{{ formatShortDate(day) }}</div>
          </header>

          <ul v-if="(workoutsByDayKey[toDayKey(day)] ?? []).length" class="week-board-workouts">
            <li
              v-for="workout in workoutsByDayKey[toDayKey(day)]"
              :key="workout.id"
              class="week-board-workout"
              draggable="true"
              :data-workout-id="workout.id"
              @dragstart="onWorkoutDragStart($event, workout.id, toDayKey(day))"
              @dragend="onWorkoutDragEnd"
            >
              <strong class="week-board-workout-title">{{ workout.summary }}</strong>
              <span class="week-board-workout-time">{{ formatTimeRange(workout) }}</span>
            </li>
          </ul>

          <p v-else class="week-board-empty">—</p>
        </section>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  DRAG_WORKOUT_MIME,
  parseDragWorkoutPayload,
  serializeDragWorkoutPayload,
} from '~/lib/dragdrop'
import {
  formatTimeRange,
  getIsoWeeks,
  startOfIsoWeek,
  toDayKey,
  workoutsByDayForRange,
  type Workout,
} from '~/lib/workouts'

const props = defineProps<{
  anchorDate: Date
  workouts: Workout[]
}>()

const emit = defineEmits<{
  (e: 'move', payload: { workoutId: string; sourceDayKey: string; targetDayKey: string }): void
}>()

const activeDropDayKey = ref<string | null>(null)

const todayKey = computed(() => toDayKey(new Date()))

const startWeek = computed(() => startOfIsoWeek(props.anchorDate))
const weeks = computed(() => getIsoWeeks(startWeek.value, 4))

const rangeStart = computed(() => weeks.value[0]?.weekStart ?? startWeek.value)
const rangeEndExclusive = computed(() => {
  const first = rangeStart.value
  const end = new Date(first)
  end.setDate(end.getDate() + 28)
  return end
})

const workoutsByDayKey = computed(() => {
  return workoutsByDayForRange(props.workouts, rangeStart.value, rangeEndExclusive.value)
})

const formatWeekLabel = (weekStart: Date) => {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)

  const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
  return `${fmt.format(weekStart)} – ${fmt.format(end)}`
}

const formatDayLabel = (date: Date) => {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date)
}

const formatShortDate = (date: Date) => {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
}

const setTransfer = (event: DragEvent, payload: { workoutId: string; sourceDayKey: string | null }) => {
  const transfer = event.dataTransfer
  if (!transfer) {
    return
  }

  transfer.setData(DRAG_WORKOUT_MIME, serializeDragWorkoutPayload(payload))
  transfer.effectAllowed = 'move'
}

const onWorkoutDragStart = (event: DragEvent, workoutId: string, sourceDayKey: string) => {
  setTransfer(event, { workoutId, sourceDayKey })
}

const onWorkoutDragEnd = () => {
  activeDropDayKey.value = null
}

const onDayDragEnter = (_event: DragEvent, dayKey: string) => {
  activeDropDayKey.value = dayKey
}

const onDayDragLeave = (_event: DragEvent, dayKey: string) => {
  if (activeDropDayKey.value === dayKey) {
    activeDropDayKey.value = null
  }
}

const onDayDragOver = (event: DragEvent) => {
  // Required to allow drop.
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const onDayDrop = (event: DragEvent, targetDayKey: string) => {
  event.preventDefault()
  activeDropDayKey.value = null

  const transfer = event.dataTransfer
  if (!transfer) {
    return
  }

  const raw = transfer.getData(DRAG_WORKOUT_MIME)
  if (!raw) {
    return
  }

  const payload = parseDragWorkoutPayload(raw)
  if (!payload) {
    return
  }

  if (!payload.sourceDayKey) {
    return
  }

  if (payload.sourceDayKey === targetDayKey) {
    return
  }

  emit('move', { workoutId: payload.workoutId, sourceDayKey: payload.sourceDayKey, targetDayKey })
}
</script>
