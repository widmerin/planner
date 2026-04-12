# Architecture

**Analysis Date:** 2026-04-12

## Pattern Overview

**Overall:** Single Page Application (SPA) with Nuxt 4 + Vue 3 Composition API

**Key Characteristics:**
- Client-side rendering (CSR mode via Nuxt)
- Component-based UI with Vue 3 `<script setup>` syntax
- Composable pattern for shared state/logic
- Server-side API routes via Nuxt/Nitro
- Dual persistence: Supabase (remote) + LocalStorage (local)

## Layers

**UI Layer:**
- Purpose: Render the application interface
- Location: `frontend/app/components/`
- Contains: Vue components (LoginScreen, EditWorkoutModal)
- Depends on: Composables, lib utilities
- Used by: `app.vue`

**Application Logic Layer:**
- Purpose: State management and business logic coordination
- Location: `frontend/app/app.vue`
- Contains: Main page component with reactive state, week navigation, workout management
- Depends on: Composables, lib utilities
- Exposes: Workouts data, done/pace state, navigation controls

**Composable Layer:**
- Purpose: Shared state and logic reusable across components
- Location: `frontend/app/composables/`
- Contains: `useSupabase.ts` - Supabase client and database operations
- Pattern: Singleton Supabase client with typed query methods

**Utility Layer:**
- Purpose: Pure functions and data transformations
- Location: `frontend/app/lib/`
- Contains:
  - `workouts.ts` - ICS parsing, date utilities, workout validation
  - `auth.ts` - Authentication API calls (login/logout/session check)
- Pattern: Export utility functions, TypeScript types/interfaces

**API Layer:**
- Purpose: Server-side endpoints for Supabase operations
- Location: `frontend/server/api/`
- Contains: Auth endpoints, workout CRUD endpoints
- Depends on: Supabase client
- Used by: Frontend via `$fetch`

**Data Layer:**
- Remote: Supabase (PostgreSQL) for workouts, completions, paces
- Local: LocalStorage via `@vueuse/core` `useStorage` for done/pace state

## Data Flow

**Authentication Flow:**

1. User enters credentials in `LoginScreen.vue`
2. Calls `login()` from `lib/auth.ts`
3. `$fetch('/api/auth/login')` hits `server/api/auth/login.post.ts`
4. Server validates credentials against Supabase auth
5. Session cookie set, user authenticated
6. `app.vue` checks `isAuthenticated()` on mount
7. If authenticated, triggers `syncWorkoutsToSupabase()` and `loadWorkouts()`

**Workout Loading Flow:**

1. `app.vue` calls `loadWorkouts()` on authentication
2. Fetches from `/api/workouts` → `server/api/workouts/index.get.ts`
3. Normalizes response via `normalizeWorkout()` from `lib/workouts.ts`
4. Fetches completions from `/api/workouts/completions`
5. Syncs to local `doneState` (LocalStorage)
6. Renders week grid with workouts grouped by day

**Workout Completion Flow:**

1. User checks a workout checkbox
2. `onDoneChange()` updates `doneState` (LocalStorage)
3. `syncCompletionToSupabase()` calls `/api/workouts/toggle`
4. Server updates `workout_completion` table in Supabase
5. If running workout, opens pace modal for tracking

**ICS Sync Flow:**

1. `syncWorkoutsToSupabase()` calls `/api/workouts/sync`
2. Server parses `trainingsplan_v2.ics`
3. Upserts workouts to Supabase with `uid` conflict resolution
4. Frontend reloads workouts after sync

## Key Abstractions

**Workout Type:**
- Purpose: Represents a scheduled training workout
- Location: `frontend/app/lib/workouts.ts`
- Pattern: TypeScript interface with Date handling

```typescript
export type Workout = {
  id: string
  uid: string
  summary: string
  description: string
  start: Date
  end: Date | null
  isAllDay: boolean
  source?: 'ics' | 'user-created'
  edited_by_user?: boolean
}
```

**useSupabase Composable:**
- Purpose: Encapsulates Supabase client and typed database operations
- Location: `frontend/app/composables/useSupabase.ts`
- Pattern: Singleton client, returns typed methods (fetchWorkouts, insertWorkouts, markWorkoutComplete, etc.)

**EditWorkoutModal Component:**
- Purpose: Modal dialog for editing workout details
- Location: `frontend/app/components/EditWorkoutModal.vue`
- Pattern: Props in, events out (`save`, `cancel`)

## Entry Points

**Main Application:**
- Location: `frontend/app/app.vue`
- Triggers: Page load
- Responsibilities: Auth check, workout loading, week navigation, state management

**API Routes:**
- `/api/auth/login` - POST authentication
- `/api/auth/logout` - POST logout
- `/api/auth/session` - GET session check
- `/api/workouts` - GET all workouts
- `/api/workouts/sync` - POST ICS sync
- `/api/workouts/completions` - GET completion/pace data
- `/api/workouts/toggle` - POST toggle completion
- `/api/workouts/pace` - POST update pace
- `/api/workouts/[id]` - PATCH update workout

## Error Handling

**Strategy:** Graceful degradation with console warnings

**Patterns:**
- API calls wrapped in try/catch with console.error/warn
- Load errors displayed in error panel
- Sync failures logged but don't block UI
- Validation errors shown in EditWorkoutModal

## Cross-Cutting Concerns

**State Persistence:**
- Local: `@vueuse/core` `useStorage()` for `doneState` and `paceState`
- Remote: Supabase tables for cross-device sync

**Date Handling:**
- ISO week calculation in `lib/workouts.ts`
- `toDayKey()` for consistent date string format (`YYYY-MM-DD`)

**Mobile Optimization:**
- Touch swipe navigation for week switching
- Responsive CSS with media queries
- Dark theme optimized for OLED

---

*Architecture analysis: 2026-04-12*
