# Roadmap: Week Planner

**Created:** 2026-04-12
**Phases:** 3 | **Requirements:** 10 | **All v1 requirements covered** ✓

## Phase Summary

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Workout CRUD | Full create/delete/edit for workouts | WORK-01, WORK-02, WORK-03, WORK-04 | 5 |
| 2 | Pace Tracking | Make pace tracking visible and accessible | PACE-01, PACE-02, PACE-03 | 4 |
| 3 | Offline Sync | Queue failed syncs for retry | SYNC-01, SYNC-02, SYNC-03 | 3 |

---

## Phase 1: Workout CRUD

**Goal:** Full create, delete, and edit functionality for workouts.

### Requirements
- WORK-01: User can create a new workout with summary, description, date, and time
- WORK-02: User can delete an unwanted workout with confirmation
- WORK-03: User can edit existing workout details (summary, description, time)
- WORK-04: New workouts persist to Supabase and survive page reload

### Success Criteria
1. User can tap "+" or "Add Workout" button to open create form
2. Create form has fields: summary (required), description (optional), date picker, time picker
3. New workout appears in correct day slot immediately after save
4. User can tap delete icon on any workout and confirm deletion
5. Deleted workout removed from UI and Supabase

### Technical Notes
- Add `/api/workouts` POST endpoint for creating workouts
- Add `/api/workouts/[id]` DELETE endpoint
- Update `EditWorkoutModal.vue` to support `is-new: true` mode
- Add delete button with confirmation dialog
- User-created workouts marked with `source: 'user-created'`

---

## Phase 2: Pace Tracking Improvements

**Goal:** Make pace tracking visible and accessible on all run workouts.

### Requirements
- PACE-01: User sees "Add pace" button on all run workouts (not yoga/bike)
- PACE-02: User can add or update pace (min/km) for any completed run workout
- PACE-03: Pace data syncs to Supabase and persists

### Success Criteria
1. Every run workout shows a visible pace button/icon (not hidden in modal)
2. Tapping pace button opens inline pace input
3. User can update pace for any workout, not just on completion
4. Pace displayed inline next to workout title when set
5. Pace syncs to Supabase and survives page reload

### Technical Notes
- Add visible pace button to workout item template
- Create inline pace editing component or modify existing
- Ensure pace sync works for updates (not just new entries)
- Consider adding pace to workout card hover state

---

## Phase 3: Offline Sync Queue

**Goal:** Robust sync handling with local queue for failed operations.

### Requirements
- SYNC-01: Failed sync operations are queued locally
- SYNC-02: Queued operations retry automatically when connection restored
- SYNC-03: User sees indicator when offline operations are pending

### Success Criteria
1. Marking workout done offline stores operation in queue
2. Adding pace offline stores operation in queue
3. Creating/editing/deleting workout offline stores operation in queue
4. App detects online status and replays queue
5. UI shows subtle indicator when pending operations exist

### Technical Notes
- Create `useSyncQueue` composable for queue management
- Store queue in localStorage with timestamps
- Add online/offline event listeners
- Implement exponential backoff for retries
- Add pending count badge to header

---

## Phase Details (Reference)

### Phase 1: Workout CRUD
- **Files to modify:** `frontend/server/api/workouts/`, `frontend/app/components/EditWorkoutModal.vue`, `frontend/app/app.vue`
- **Dependencies:** None (standalone)

### Phase 2: Pace Tracking
- **Files to modify:** `frontend/app/app.vue`, `frontend/app/components/PaceInline.vue` (new)
- **Dependencies:** Phase 1 (for base UI)

### Phase 3: Offline Sync
- **Files to modify:** `frontend/app/composables/useSyncQueue.ts` (new), `frontend/app/app.vue`
- **Dependencies:** Phase 1 & 2 (for full queue coverage)

---

*Roadmap created: 2026-04-12*
