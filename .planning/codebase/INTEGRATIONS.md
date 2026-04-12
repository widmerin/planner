# External Integrations

**Analysis Date:** 2026-04-12

## Supabase (Backend Database)

**Purpose:** Database storage and authentication

**Implementation:**
- Package: `@supabase/supabase-js`
- Usage: `frontend/app/composables/useSupabase.ts`

**Functions:**
- `fetchWorkouts()` - Fetch all workouts, ordered by start date
- `insertWorkouts()` - Bulk upsert workouts by UID
- `markWorkoutComplete()` - Record workout completion with date
- `unmarkWorkoutComplete()` - Remove workout completion record
- `fetchCompletions()` - Get all completion records

**Configuration:**
- Runtime config in `frontend/nuxt.config.ts`
- Environment vars: `NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_ANON_KEY`

**Tables:**
- `workouts` - Stores workout events
- `workout_completion` - Tracks completed workouts

---

## ICAL.js (ICS Parsing)

**Purpose:** Parse training plan from iCalendar format

**Implementation:**
- Package: `ical.js`
- Usage: `frontend/app/lib/workouts.ts`

**Key Function:**
- `parseWorkoutsFromICS(icsText)` - Parse ICS text into Workout array

**Parsed Fields:**
- UID, summary, description
- Start/end dates
- All-day event flag

---

## VueUse (Composables)

**Purpose:** Vue composition utilities

**Package:** `@vueuse/core` ^14.2.1

**Usage:** Provides utility composables for reactivity, storage, etc.

---

## Playwright (E2E Testing)

**Purpose:** End-to-end browser testing

**Package:** `@playwright/test` ^1.58.2

**Configuration:**
- Test command: `npm run test:e2e`
- Tests in: `frontend/tests/e2e/` (implied)

---

## Authentication API

**Purpose:** User authentication via server routes

**Implementation:**
- `frontend/app/lib/auth.ts`

**Endpoints (server-side):**
- `/api/auth/login` - POST login
- `/api/auth/logout` - POST logout
- `/api/auth/session` - GET session check

---

## Environment Configuration

**Required env vars:**
- `NUXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NUXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

**Location:** `.env` file in `frontend/` directory

---

*Integration audit: 2026-04-12*
