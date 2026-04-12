<template>
  <div v-if="isOpen" class="modal-backdrop" role="presentation" @click="onBackdropClick">
    <section class="modal edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title" @click.stop>
      <h2 id="edit-modal-title">{{ isNew ? 'New Workout' : 'Edit Workout' }}</h2>

      <form @submit.prevent="onSave">
        <div v-if="validationErrors.length" class="form-errors">
          <ul>
            <li v-for="error in validationErrors" :key="error">{{ error }}</li>
          </ul>
        </div>

        <div class="form-group">
          <label for="edit-summary">Summary *</label>
          <input
            id="edit-summary"
            v-model="draft.summary"
            type="text"
            placeholder="e.g., 🏃 Easy Run"
          >
        </div>

        <div class="form-group">
          <label for="edit-description">Description</label>
          <textarea id="edit-description" v-model="draft.description" placeholder="e.g., 5 km @ easy pace" />
        </div>

        <div class="form-group">
          <label for="edit-date">Date *</label>
          <input
            id="edit-date"
            :value="formatEditDate(draft.start)"
            type="date"
            @change="onDateChange"
          >
        </div>

        <div v-if="!draft.isAllDay" class="form-row">
          <div class="form-group">
            <label for="edit-start-time">Start Time *</label>
            <input
              id="edit-start-time"
              :value="formatTime(draft.start)"
              type="time"
              @change="onStartTimeChange"
            >
          </div>

          <div class="form-group">
            <label for="edit-end-time">End Time</label>
            <input
              id="edit-end-time"
              :value="draft.end ? formatTime(draft.end) : ''"
              type="time"
              @change="onEndTimeChange"
            >
          </div>
        </div>

        <div class="form-group checkbox-group">
          <label for="edit-all-day">
            <input id="edit-all-day" v-model="draft.isAllDay" type="checkbox">
            All day
          </label>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn" :disabled="isSaving" @click="onCancel">Cancel</button>
          <button type="button" class="btn btn-primary" :disabled="isSaving" @click="onSave">
            {{ isSaving ? 'Saving...' : 'Save' }}
          </button>
        </div>

        <p v-if="saveError" class="form-error">{{ saveError }}</p>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatTime, validateWorkout, type Workout } from '~/lib/workouts'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    isNew: boolean
    workout?: Partial<Workout>
  }>(),
  {
    isNew: false,
  },
)

const emit = defineEmits<{
  save: [workout: Partial<Workout>]
  cancel: []
}>()

const draft = ref<Partial<Workout>>({
  summary: '',
  description: '',
  start: new Date(),
  end: null,
  isAllDay: false,
})

const isSaving = ref(false)
const saveError = ref('')

watch(
  () => props.workout,
  (newWorkout) => {
    if (newWorkout) {
      let startDate: Date
      if (newWorkout.start instanceof Date && !isNaN(newWorkout.start.getTime())) {
        startDate = newWorkout.start
      } else if (typeof newWorkout.start === 'string' && newWorkout.start) {
        startDate = new Date(newWorkout.start)
      } else {
        startDate = new Date()
      }
      
      let endDate: Date | null = null
      if (newWorkout.end) {
        if (newWorkout.end instanceof Date && !isNaN(newWorkout.end.getTime())) {
          endDate = newWorkout.end
        } else if (typeof newWorkout.end === 'string') {
          const parsed = new Date(newWorkout.end)
          if (!isNaN(parsed.getTime())) {
            endDate = parsed
          }
        }
      }
      
      draft.value = {
        summary: newWorkout.summary || '',
        description: newWorkout.description || '',
        start: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), startDate.getHours(), startDate.getMinutes()),
        end: endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), endDate.getHours(), endDate.getMinutes()) : null,
        isAllDay: newWorkout.isAllDay || false,
      }
    }
  },
  { immediate: true },
)

const validationErrors = computed(() => validateWorkout(draft.value))

const formatEditDate = (date: Date | null | undefined): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return ''
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const onDateChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const [year, month, day] = input.value.split('-').map(Number)
  
  const currentStart = draft.value.start instanceof Date ? draft.value.start : new Date()
  const hours = currentStart.getHours()
  const minutes = currentStart.getMinutes()
  
  const newDate = new Date(year, month - 1, day, hours, minutes)
  draft.value.start = newDate

  if (draft.value.end instanceof Date) {
    const endDate = new Date(newDate)
    endDate.setHours(draft.value.end.getHours(), draft.value.end.getMinutes())
    draft.value.end = endDate
  }
}

const onStartTimeChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const [hours, minutes] = input.value.split(':').map(Number)
  
  const currentStart = draft.value.start instanceof Date ? draft.value.start : new Date()
  const newStart = new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate(), hours, minutes)
  draft.value.start = newStart
}

const onEndTimeChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.value) {
    draft.value.end = null
    return
  }

  const [hours, minutes] = input.value.split(':').map(Number)
  
  const currentStart = draft.value.start instanceof Date ? draft.value.start : new Date()
  const newEnd = new Date(currentStart.getFullYear(), currentStart.getMonth(), currentStart.getDate(), hours, minutes)
  draft.value.end = newEnd
}

const onBackdropClick = () => {
  if (!isSaving.value) {
    emit('cancel')
  }
}

const onCancel = () => {
  emit('cancel')
}

const onSave = async () => {
  console.log('EditWorkoutModal onSave called', { draft: draft.value, errors: validationErrors.value })
  saveError.value = ''
  isSaving.value = true

  try {
    console.log('Emitting save event with', draft.value)
    emit('save', { ...draft.value })
  } catch (error) {
    console.error('onSave error:', error)
    saveError.value = error instanceof Error ? error.message : 'Failed to save workout'
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.edit-modal h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  color: #1a1a1a;
}

.form-errors {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  color: #c33;
}

.form-errors ul {
  margin: 0;
  padding-left: 1.5rem;
}

.form-errors li {
  margin: 0.25rem 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 0.95rem;
}

.form-group input[type='text'],
.form-group input[type='date'],
.form-group input[type='time'],
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
}

.form-group input[type='text']:focus,
.form-group input[type='date']:focus,
.form-group input[type='time']:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #00d9a3;
  box-shadow: 0 0 0 3px rgba(0, 217, 163, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  margin-bottom: 0;
}

.checkbox-group input[type='checkbox'] {
  margin-right: 0.5rem;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-error {
  color: #c33;
  font-size: 0.9rem;
  margin: 1rem 0 0 0;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  background: white;
  color: #333;
  transition: all 0.2s;
}

.btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #999;
}

.btn-primary {
  background: #00d9a3;
  color: white;
  border-color: #00d9a3;
}

.btn-primary:hover:not(:disabled) {
  background: #00c691;
  border-color: #00c691;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .modal {
    padding: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
