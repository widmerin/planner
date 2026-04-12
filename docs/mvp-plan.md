# Week Planner MVP Plan (Build From Scratch)

This plan is written so another developer can create the app from zero context and verify it is production-ready for MVP scope.

## 1) Goal and scope

### Goal
Build a mobile-first weekly running planner as a Nuxt client-rendered app in `frontend`, using workouts from `public/data/trainingsplan_v2.ics`.

### In-scope MVP features
- Weekly overview (Monday to Sunday) of planned workouts
- Mark workouts as done
- Persist done state to Supabase database
- Track pace (min/km) for running workouts with database persistence
- Reliable parsing of ICS events (including all-day and multi-day entries)
- Automated tests (unit + mobile E2E)

### Out-of-scope for MVP
- User management / multi-user accounts
- Calendar editing or ICS upload UI
- Multiple user profiles

## 2) Technical decisions

- Framework: Nuxt (Vue 3), client-rendered (`ssr: false`)
- Data source: 
  - Static ICS file in `frontend/public/data/trainingsplan_v2.ics`
  - Supabase PostgreSQL for persistent workout metadata (done state, pace)
- Backend: Nitro API routes (built into Nuxt)
- ICS parser: `ical.js`
- Local persistence: `@vueuse/core` `useStorage` with stable keys (synced to Supabase)
- Database: Supabase (PostgreSQL with Row Level Security)
- Unit tests: Vitest
- Integration tests: Playwright (mobile Chromium profile)
- Keep architecture simple: one main page + small utility modules

## 3) Prerequisites

- Node.js 22 LTS (or latest active LTS)
- npm 10+
- Linux/macOS/Windows shell
- Git

## 4) Project scaffold from scratch

1. Create app in subdirectory:

```bash
npx nuxi@latest init frontend
cd frontend
npm install
```

2. Install required dependencies:

```bash
npm install ical.js @vueuse/core
npm install -D vitest @vitest/coverage-v8 @playwright/test playwright @nuxt/test-utils
```

3. Configure Nuxt for client rendering and global CSS in `frontend/nuxt.config.ts`:
- `ssr: false`
- `css: ['~/assets/main.css']`
- app head metadata for mobile/PWA basics (manifest, theme-color)

4. Ensure root `.gitignore` includes at least:
- `frontend/node_modules/`
- `frontend/.nuxt/`
- `frontend/.output/`
- `frontend/coverage/`
- `frontend/test-results/`
- `frontend/playwright-report/`
- `frontend/.env`
- `frontend/.env.local`

## 5) Required folder structure

Minimum structure:

```text
frontend/
	app/
		app.vue
		assets/main.css
		lib/workouts.ts
		components/LoginScreen.vue        # only if auth gate is enabled
	public/
		data/trainingsplan_v2.ics
		manifest.json
		robots.txt
	server/
		api/auth/*                        # only if auth gate is enabled
		utils/auth.ts                     # only if auth gate is enabled
	tests/
		workouts.test.ts
		e2e/week-planner.spec.ts
	vitest.config.ts
	playwright.config.ts
```

## 6) Data model and parsing rules

Implement in `app/lib/workouts.ts`:

- `Workout` type:
	- `id: string` (stable unique id)
	- `uid: string`
	- `summary: string`
	- `description: string`
	- `start: Date`
	- `end: Date | null`
	- `isAllDay: boolean`
- Build stable id with `UID + DTSTART` (example: `${uid}__${dtstart}`)
- Parse all `VEVENT` entries from ICS
- Sort workouts ascending by start timestamp

Date utilities:
- `startOfIsoWeek(date)` returns Monday 00:00
- `getIsoWeekDays(weekStart)` returns 7 days
- `toDayKey(date)` returns `YYYY-MM-DD`

Grouping behavior:
- Timed events map to the key of `start`
- All-day events with `DTEND` expand across each covered day (exclusive end semantics)
- `workoutsByDayForWeek` pre-initializes all week keys and returns grouped workouts

## 7) UI implementation checklist

Implement the weekly planner screen in `app/app.vue`:

- Fetch ICS from `/data/trainingsplan_v2.ics` on mount
- Parse workouts using `parseWorkoutsFromICS`
- Maintain `anchorDate` to control visible week
- Show Monday-Sunday cards with workouts per day
- Add controls:
	- previous week
	- current week
	- next week
- Add done checkbox per workout
- Show empty day state (`No workout planned.`)
- Mobile-first layout and touch-friendly controls

Persistence:
- Store done state in localStorage with `useStorage` key `weekplanner-done-v1`
- Store pace in localStorage with `useStorage` key `weekplanner-pace-v1`
- Data shapes: 
  - `Record<string, boolean>` by workout id for done state
  - `Record<string, string>` by workout id for pace (e.g., "6:05" for 6m5s/km)
- Both are synced to Supabase `workout_completion` table with RLS policies

Recommended quality details:
- Loading and error states while reading ICS
- Time formatting helper (`formatTimeRange`)
- Basic progress indicator (done vs total)
- Pace modal for capturing min/km on completion

## 8) Database schema (Supabase)

Two tables with RLS enabled for MVP:

**workouts table:**
```sql
id uuid primary key
uid text unique not null
summary text not null
description text
start_date timestamp not null
end_date timestamp
is_all_day boolean
created_at timestamp default now()
```

**workout_completion table:**
```sql
id uuid primary key
workout_id uuid references workouts(id)
completed_date date not null
completed_at timestamp default now()
pace text  -- stores pace as "m:ss" format
unique(workout_id, completed_date)
```

Required RLS policies (allow anonymous access for MVP):
- workouts: SELECT, INSERT, UPDATE for all
- workout_completion: SELECT, INSERT, UPDATE, DELETE for all

## 9) Backend API routes (Nitro)

Implement in `server/api/workouts/`:

- `GET /api/workouts` - fetch all workouts
- `POST /api/workouts/sync` - sync ICS file to database
- `GET /api/workouts/completions` - fetch completion records + paces
- `POST /api/workouts/toggle` - mark workout done/undone
- `POST /api/workouts/pace` - save pace for completed workout

All routes use Supabase client with anon key from `.env.local`

## 10) Optional auth gate (current implementation)

MVP does not require user management. Keep auth only if you need a simple shared login screen.

If enabled:
- Env vars: `APP_USER`, `APP_PASSWORD`
- API routes:
	- `POST /api/auth/login`
	- `POST /api/auth/logout`
	- `GET /api/auth/session`
- Cookie session name: `weekplanner-session`

For local dev and E2E:

```bash
cd frontend
cp .env.example .env.local  # if example exists
# then set APP_USER and APP_PASSWORD
```

If auth is removed, also simplify E2E tests accordingly.

## 11) Test strategy and success criteria

### Unit tests (`tests/workouts.test.ts`)

Must verify:
- ICS parsing returns expected volume and stable ids
- ISO week grouping Monday-Sunday is correct
- Multi-day all-day events expand to all covered days
- `normalizeWorkout()` converts string dates to Date objects (JSON serialization fix)

### API tests (`tests/api-routes.test.ts`)

Must verify (requires dev server running):
- GET /api/workouts returns correct format
- GET /api/workouts/completions returns completions and paces
- POST /api/workouts/sync processes ICS file
- POST /api/workouts/toggle marks workouts done/undone
- POST /api/workouts/pace saves pace data

### E2E tests (`tests/e2e/week-planner.spec.ts`)

Must verify on mobile viewport:
- Planner page is visible and workouts render
- User can mark workout done
- Done state persists after reload (via Supabase)
- Pace modal normalizes input formats (6.40 → 6:40)
- Saved pace displays inline (· 6:40 min/km)
- Pace persists after reload (loaded from Supabase)
- Modal only opens for run workouts (not yoga/bike)

## 12) Commands for implementation and verification

From `frontend`:

```bash
npm run dev
npm run test
npm run test:e2e
npm run build
```

Definition of done for this MVP:
- Dev server runs successfully
- Unit tests pass
- E2E tests pass
- Weekly overview works on mobile
- Done state persists in localStorage
- ICS file is the single source of workout truth

## 11) Delivery checklist

- [ ] `frontend` contains the Nuxt app and runs locally
- [ ] `public/data/trainingsplan_v2.ics` is included and used
- [ ] Weekly planner UX is usable on mobile
- [ ] Done toggle persistence works after reload
- [ ] Test suite (unit + E2E) is green
- [ ] `.gitignore` excludes generated/test artifacts
- [ ] README run/test commands are correct and minimal

When every checkbox is complete, the MVP is ready for handover.
