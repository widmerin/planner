# Feature Plan: Edit Weekly Workouts

## 1) Overview

**Goal**: Enable users to edit, add, and delete workouts directly in the week planner UI, with changes persisted to Supabase.

**Impact**: Transforms the app from read-only to fully editable workout management tool.

## 2) Scope Definition

### In Scope
- **Edit workouts**: Change summary, description, start time, end time
- **Add workouts**: Create new workouts for any day in the current/future weeks
- **Delete workouts**: Remove workouts from the database
- **Move workouts**: Drag-and-drop to reschedule to different days and times
- **Undo/Cancel**: Ability to cancel unsaved changes when editing
- **Validation**: Prevent invalid times (end before start, past dates for new entries)
- **Optimistic UI**: Show changes immediately with background sync to database
- **Conflict detection**: Warn about overlapping workouts on the same day

### Out of Scope (Future Features)
- Recurring/repeating workouts
- Bulk edit (edit multiple workouts at once)
- Copy previous week's plan
- Workout templates/presets
- Sync back to ICS file
- Multi-user editing/conflict resolution
- Workout history/audit log

## 3) User Stories

```gherkin
Feature: Edit Workouts

  Scenario: User edits an existing workout
    Given I'm viewing the weekly planner
    When I click "Edit" on a workout
    Then the edit modal opens with current values populated
    And I can modify summary, description, start time, end time
    And changes are saved to Supabase
    And the UI updates immediately

  Scenario: User adds a new workout to a day
    Given I'm viewing a day card
    When I click "Add Workout" button
    Then an edit modal opens with empty fields
    And current day is pre-selected
    And I can enter summary, description, time
    And a new workout is created in Supabase

  Scenario: User deletes a workout
    Given I'm viewing a workout
    When I click the delete button
    Then a confirmation modal appears
    And on confirm, the workout is removed from Supabase
    And the UI updates immediately

  Scenario: User reschedules a workout (drag-and-drop)
    Given I'm viewing a workout
    When I drag it to a different day
    Then it moves to the new day
    And the start date is updated
    And changes sync to Supabase

  Scenario: User validates workout times
    Given I'm editing a workout
    When I set end time before start time
    Then an error is shown
    And save is disabled
```

## 4) Data Model Changes

### Extended Workout Type

Current:
```typescript
type Workout = {
  id: string
  uid: string
  summary: string
  description: string
  start: Date
  end: Date | null
  isAllDay: boolean
}
```

New fields needed (stored in database):
```typescript
type Workout = {
  // existing
  id: string
  uid: string
  summary: string
  description: string
  start: Date
  end: Date | null
  isAllDay: boolean
  
  // new fields
  source: 'ics' | 'user-created'  // distinguish ICS vs manually created
  created_at: Date
  updated_at: Date
  edited_by_user: boolean  // true if modified from original ICS
}
```

### Database Schema Changes

Add columns to `workouts` table:
```sql
alter table public.workouts
  add column source text default 'ics', -- 'ics' or 'user-created'
  add column edited_by_user boolean default false,
  add column created_at timestamp default now(),
  add column updated_at timestamp default now();
```

Create audit log table (optional but recommended):
```sql
create table public.workout_changes (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  change_type text not null, -- 'created', 'updated', 'deleted'
  old_values jsonb,
  new_values jsonb,
  changed_at timestamp default now(),
  index idx_changes_workout on (workout_id)
);
```

## 5) UI Components and Modals

### New/Modified Components

#### 1. Edit Workout Modal
- Opens when user clicks "Edit" or "Add"
- Fields:
  - Summary (required, text input)
  - Description (optional, textarea)
  - Date picker (read-only for existing, selectable for new)
  - Start time picker (HH:MM format)
  - End time picker (HH:MM format, optional)
  - All-day toggle
  - Save / Cancel buttons
- Validation indicators
- Loading state during save

#### 2. Delete Confirmation Modal
- Shows workout summary
- Confirmation message
- Cancel / Delete buttons
- Error handling if delete fails

#### 3. Day Card Enhancements
- "Add Workout" button on each day card
- Edit/Delete action buttons on each workout (hamburger menu or inline)
- Drag-handle icon for drag-and-drop
- Visual feedback for unsaved changes (dashed border, asterisk)

#### 4. Edit Mode Toggle Button
- Global "Edit" button in header
- Transforms UI to show edit controls
- Or: Always show edit button on hover (less intrusive)

### Layout Considerations

Current read-only layout:
```
┌─ Day Header (Date)
├─ Workout Item
│  ├─ Checkbox ✓
│  ├─ Title
│  ├─ Time
│  └─ Description
├─ Workout Item
└─ Empty state
```

New edit-enabled layout:
```
┌─ Day Header (Date)
├─ Workout Item
│  ├─ Drag Handle ⋮⋮
│  ├─ Content
│  │  ├─ Checkbox ✓
│  │  ├─ Title
│  │  ├─ Time
│  │  └─ Description
│  └─ Actions (Edit, Delete)
├─ Add Workout Button [+]
├─ Workout Item
└─ Empty state
```

## 6) Backend API Changes

### New Endpoints

#### POST /api/workouts/create
Create a new workout

```typescript
{
  summary: string
  description?: string
  start_date: ISO8601 string
  end_date?: ISO8601 string
  is_all_day: boolean
  source: 'user-created'
}

Response: { success: true, id: string, workout: Workout }
```

#### PATCH /api/workouts/:id
Update an existing workout

```typescript
{
  summary?: string
  description?: string
  start_date?: ISO8601 string
  end_date?: ISO8601 string
  is_all_day?: boolean
}

Response: { success: true, updated: Workout }
```

#### DELETE /api/workouts/:id
Delete a workout

```typescript
Response: { success: true, deleted_id: string }
```

#### GET /api/workouts/conflicts
Check for overlapping workouts on a date

```typescript
{
  date: YYYY-MM-DD
  start_time?: HH:MM
  end_time?: HH:MM
  exclude_workout_id?: string
}

Response: {
  success: true
  conflicts: Workout[]
}
```

### Modified Endpoints

#### GET /api/workouts
Add optional filters:
- `?source=user-created` — only user-created workouts
- `?edited=true` — only edited workouts
- `?date_after=YYYY-MM-DD` — workouts after date

## 7) Frontend Implementation

### State Management

Add to app.vue:
```typescript
// Editing state
const editingWorkoutId = ref<string | null>(null)
const editDraft = ref<Partial<Workout> | null>(null)
const showEditModal = ref(false)
const isSaving = ref(false)
const editError = ref('')

// Drag-and-drop state
const draggedWorkoutId = ref<string | null>(null)
const dropTargetDate = ref<Date | null>(null)
```

### Key Functions

```typescript
// Open edit modal for new or existing
const openEditModal = (workoutId?: string) => {
  if (workoutId) {
    editingWorkoutId.value = workoutId
    const workout = workouts.value.find(w => w.id === workoutId)
    editDraft.value = { ...workout }
  } else {
    editingWorkoutId.value = null
    editDraft.value = {
      summary: '',
      description: '',
      start: anchorDate.value,
      end: null,
      isAllDay: false,
    }
  }
  showEditModal.value = true
}

// Save changes (create or update)
const saveWorkout = async () => {
  if (!editDraft.value) return
  
  isSaving.value = true
  try {
    if (editingWorkoutId.value) {
      // Update existing
      await fetch(`/api/workouts/${editingWorkoutId.value}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft.value),
      })
    } else {
      // Create new
      await fetch('/api/workouts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft.value),
      })
    }
    
    // Reload workouts
    await loadWorkouts()
    showEditModal.value = false
  } catch (error) {
    editError.value = error.message
  } finally {
    isSaving.value = false
  }
}

// Delete workout
const deleteWorkout = async (id: string) => {
  if (!confirm('Delete this workout?')) return
  
  try {
    await fetch(`/api/workouts/${id}`, {
      method: 'DELETE',
    })
    await loadWorkouts()
  } catch (error) {
    alert(`Failed to delete: ${error.message}`)
  }
}
```

## 8) Drag-and-Drop Implementation

### Approach: Native HTML Drag and Drop

```typescript
// On workout item
const onDragStart = (e: DragEvent, workoutId: string) => {
  draggedWorkoutId.value = workoutId
  e.dataTransfer!.effectAllowed = 'move'
}

// On day card
const onDragOver = (e: DragEvent) => {
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'move'
}

const onDrop = (e: DragEvent, targetDate: Date) => {
  e.preventDefault()
  if (!draggedWorkoutId.value) return
  
  const workout = workouts.value.find(w => w.id === draggedWorkoutId.value)
  if (!workout) return
  
  // Update start date, keep time of day
  const newStart = new Date(targetDate)
  newStart.setHours(workout.start.getHours(), workout.start.getMinutes())
  
  // Calculate new end time
  let newEnd = null
  if (workout.end) {
    const duration = workout.end.getTime() - workout.start.getTime()
    newEnd = new Date(newStart.getTime() + duration)
  }
  
  // Save to database
  updateWorkoutTime(draggedWorkoutId.value, newStart, newEnd)
  draggedWorkoutId.value = null
}
```

Alternative: Vue Draggable library (simpler but adds dependency)

## 9) Validation and Error Handling

### Client-Side Validation

```typescript
const validateWorkout = (workout: Partial<Workout>): string[] => {
  const errors: string[] = []
  
  if (!workout.summary?.trim()) {
    errors.push('Summary is required')
  }
  
  if (workout.start && workout.end && workout.end <= workout.start) {
    errors.push('End time must be after start time')
  }
  
  if (workout.start && workout.start < new Date()) {
    errors.push('Cannot create workouts in the past')
  }
  
  return errors
}
```

### Server-Side Validation

In Nitro API routes:
- Validate required fields
- Check date/time limits
- Verify workout IDs exist (for updates/deletes)
- Reject edits to ICS-sourced workouts (optional policy)

### Conflict Detection

```typescript
const checkConflicts = async (date: Date, startTime: Date, endTime: Date | null) => {
  if (!endTime) return [] // all-day, no conflicts
  
  const response = await fetch('/api/workouts/conflicts', {
    method: 'GET',
    body: JSON.stringify({
      date: toDayKey(date),
      start_time: formatTime(startTime),
      end_time: formatTime(endTime),
    }),
  })
  
  return response.json()
}
```

## 10) Testing Strategy

### Unit Tests (vitest)

```typescript
- validateWorkout(())
  - ✓ rejects empty summary
  - ✓ rejects end before start
  - ✓ rejects past dates
  - ✓ accepts valid workouts

- editWorkoutModal()
  - ✓ opens with correct values for edit
  - ✓ opens empty for new
  - ✓ normalizes time inputs
```

### API Tests (vitest, requires server)

```typescript
- POST /api/workouts/create
  - ✓ creates new workout in database
  - ✓ validates required fields
  - ✓ rejects invalid times

- PATCH /api/workouts/:id
  - ✓ updates existing workout
  - ✓ returns updated data
  - ✓ rejects invalid updates

- DELETE /api/workouts/:id
  - ✓ deletes workout from database
  - ✓ returns success

- GET /api/workouts/conflicts
  - ✓ returns overlapping workouts
  - ✓ returns empty for no conflicts
```

### E2E Tests (Playwright)

```typescript
test('user can add a new workout', async ({ page }) => {
  // Navigate and login
  // Find day card
  // Click "Add Workout"
  // Enter workout details
  // Click Save
  // Verify workout appears
  // Reload and verify persistence
})

test('user can edit a workout', async ({ page }) => {
  // Open edit modal
  // Change summary and time
  // Save
  // Verify changes displayed
  // Reload and verify persisted
})

test('user can delete a workout', async ({ page }) => {
  // Find workout
  // Click Delete
  // Confirm
  // Verify workout removed
  // Reload and verify
})

test('user can drag workout to new day', async ({ page }) => {
  // Drag workout to different day
  // Verify moved
  // Reload and verify persisted
})
```

## 11) Implementation Phases

### Phase 1: Core Edit Capability (1-2 sprints)
- [x] Extend Workout type with necessary fields
- [x] Update database schema (add columns)
- [x] Implement PATCH endpoint
- [x] Add edit modal UI
- [x] Add save/cancel logic
- [ ] Unit tests for validation
- [ ] E2E test for edit workflow

### Phase 2: Create and Delete (1 sprint)
- [ ] Implement POST /api/workouts/create
- [ ] Implement DELETE /api/workouts/:id
- [ ] Add "New Workout" button and modal
- [ ] Add delete confirmation modal
- [ ] Conflict detection for new workouts
- [ ] API and E2E tests

### Phase 3: Drag-and-Drop (1-2 sprints)
- [ ] Add drag handles to UI
- [ ] Implement drag-and-drop handlers
- [ ] Visual feedback during drag
- [ ] Update workout time on drop
- [ ] E2E tests for drag flow

### Phase 4: Polish and Optimization (1 sprint)
- [ ] Optimistic UI updates (show change immediately)
- [ ] Loading indicators during save
- [ ] Error notifications with retry
- [ ] Undo functionality (optional)
- [ ] Keyboard shortcuts (Cmd+E to edit, etc.)
- [ ] Performance optimization

## 12) Accessibility Considerations

- ✓ Keyboard navigation for all modals
- ✓ ARIA labels on edit buttons
- ✓ Error messages linked to form fields
- ✓ Focus management when modal opens/closes
- ✓ Screen reader announcements for async updates
- ✓ Touch-friendly drag handles (large tap target)
- ✓ Time input with native pickers on mobile

## 13) Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Data loss if sync fails | Implement retry logic, show error UI |
| Overlapping workouts confuse users | Show conflict warnings, prevent save if serious |
| Drag-and-drop not working on all devices | Provide fallback: edit modal for time change |
| Performance degradation with many edits | Implement debouncing, lazy load old weeks |
| ICS file becomes out of sync with database | Mark ICS workouts as read-only or add sync button |
| Accidental deletion | Require confirmation, implement soft deletes |

## 14) Success Criteria

- ✓ Users can add, edit, delete workouts without leaving the planner
- ✓ All changes persist to Supabase immediately
- ✓ Changes reload correctly when app restarts
- ✓ Mobile drag-and-drop works smoothly
- ✓ Validation prevents invalid data
- ✓ Tests cover all workflows (>80% code coverage)
- ✓ No performance regressions
- ✓ Accessible to keyboard and screen readers

## 15) Documentation Needs

- [ ] Update README with new capabilities
- [ ] Add editing guide to user docs
- [ ] Document new API endpoints
- [ ] Add troubleshooting section for common editing issues
- [ ] Update technical architecture diagram

---

**Next Steps**: Review this plan with stakeholders, validate Phase 1 scope, and prepare implementation tasks.
