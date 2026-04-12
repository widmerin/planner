# Codebase Concerns

**Analysis Date:** 2026-04-12

## Data Persistence Issues

### LocalStorage as Primary State
- **Files:** `frontend/app/app.vue` (lines 202-203)
- **Issue:** Uses `@vueuse/core` `useStorage()` for `doneState` and `paceState`. Data exists in localStorage but sync to Supabase is fire-and-forget with silent failures.
- **Impact:** If Supabase sync fails (network issues), local changes are not queued for retry. Data could be lost on storage clear.
- **Fix approach:** Implement an offline queue that persists pending syncs to localStorage and replays them when online.

### Supabase Sync Failure Handling
- **Files:** `frontend/app/app.vue` (lines 408-411, 371-374)
- **Issue:** `syncCompletionToSupabase` and `syncPaceToSupabase` catch errors and log warnings, but do not persist failed operations.
- **Impact:** User marks workout done offline, sync fails silently, on next load localStorage has the change but Supabase doesn't.
- **Fix approach:** Add pending operations queue with retry logic using IndexedDB or localStorage with timestamp.

### Completion Data Structure
- **Files:** `frontend/app/composables/useSupabase.ts` (lines 129-150)
- **Issue:** `fetchCompletions` loads ALL completion records on every app load. No pagination or date range filtering.
- **Impact:** As training plan grows, initial load gets slower. Full plan could have thousands of completion records.
- **Fix approach:** Add date range parameters to fetch only relevant completions (e.g., past 90 days + future workouts).

## Supabase Integration

### Auth Not Fully Integrated
- **Files:** `frontend/app/lib/auth.ts`, `frontend/app/app.vue` (line 683)
- **Issue:** Auth exists (`login`, `logout`, `isAuthenticated`) but uses simple `/api/auth/*` endpoints. No Supabase Auth integration.
- **Impact:** Authentication is basic, doesn't use Supabase Auth's features (password reset, magic links, OAuth).
- **Fix approach:** Migrate to Supabase Auth with RLS policies tied to authenticated users.

### RLS Policies Unknown
- **Files:** Not visible in codebase
- **Issue:** Documentation claims RLS policies configured, but no schema or policy definitions in codebase.
- **Impact:** Cannot verify if data access is properly secured.
- **Fix approach:** Document Supabase schema with SQL migrations file.

### Single Client Instance
- **Files:** `frontend/app/composables/useSupabase.ts` (lines 4, 9-14)
- **Issue:** Uses module-level singleton pattern. Works for SSR but in client-only mode (SSR disabled), this is unnecessary.
- **Impact:** Minimal impact, but pattern is confusing when SSR is explicitly disabled.
- **Fix approach:** Consider simplifying to direct client creation per composable call.

## Mobile Optimization

### SSR Disabled
- **Files:** `frontend/nuxt.config.ts` (line 4)
- **Issue:** `ssr: false` means content not rendered on server. Initial page load shows blank until JS loads.
- **Impact:** Slightly worse SEO (acceptable for personal app), perceived performance on slow connections.
- **Fix approach:** Consider hybrid SSR for workout list only.

### No Service Worker for Offline
- **Files:** None
- **Issue:** No service worker registered. Offline capability limited to cached assets.
- **Impact:** App completely unusable offline. Cannot view previously loaded workouts.
- **Fix approach:** Add Workbox/Service Worker for caching workouts and pending operations.

### Touch Gestures Conflict
- **Files:** `frontend/app/app.vue` (lines 556-597)
- **Issue:** Swipe left/right for week navigation can conflict with checkbox interactions on mobile.
- **Impact:** Users may accidentally navigate weeks when trying to tap checkboxes.
- **Fix approach:** Increase touch threshold or add explicit "swipe mode" toggle.

## Missing MVP Features

### Create New Workout Not Implemented
- **Files:** `frontend/app/components/EditWorkoutModal.vue` (prop `is-new: false`)
- **Issue:** Phase 2 from docs not started. Can only edit existing ICS workouts.
- **Impact:** Users cannot add custom workouts.
- **Fix approach:** Implement "Add Workout" button with create form.

### Delete Workout Not Implemented
- **Files:** None
- **Issue:** No delete functionality. Cannot remove unwanted workouts.
- **Impact:** Stale workouts from ICS remain even if training plan changes.
- **Fix approach:** Add delete endpoint and confirmation dialog.

### Pace Tracking UI Gaps
- **Files:** `frontend/app/app.vue` (lines 111-113)
- **Issue:** Pace modal opens on workout completion but pace data not shown prominently. Only displays inline when done.
- **Impact:** Users may not realize they can track pace.
- **Fix approach:** Add "Add pace" button visible on all workout items.

## Build & Deployment

### Environment Variables Not Documented
- **Files:** `frontend/nuxt.config.ts` (lines 10-11)
- **Issue:** Required env vars (`NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_ANON_KEY`) not documented.
- **Impact:** Deployment confusion, especially for new developers.
- **Fix approach:** Add `.env.example` file with placeholder values.

### Heavy Dependency
- **Files:** `frontend/package.json` (line 20)
- **Issue:** `sharp` is included for image processing. Used for PWA icons only.
- **Impact:** Adds ~2MB to node_modules. Image processing at build time.
- **Fix approach:** Use pre-generated icons and remove sharp dependency.

### No CI/CD Pipeline
- **Files:** None
- **Issue:** No GitHub Actions, no automated tests in CI.
- **Impact:** No regression protection, manual deployment process.
- **Fix approach:** Add GitHub Actions workflow for tests and preview deployments.

## Technical Debt

### ICS Parsing on Every Sync
- **Files:** `frontend/server/api/workouts/sync.post.ts`
- **Issue:** Full ICS re-parse on every sync, then upsert all workouts.
- **Impact:** Inefficient, especially with large ICS files. Could cause duplicate work.
- **Fix approach:** Track last sync timestamp, only process changed entries.

### Magic Numbers in Code
- **Files:** `frontend/app/app.vue` (line 582)
- **Issue:** `horizontalThreshold = 56` is hardcoded with no explanation.
- **Impact:** Unclear why 56px was chosen. Difficult to adjust.
- **Fix approach:** Extract to constant with descriptive name.

### Inconsistent Date Handling
- **Files:** `frontend/app/lib/workouts.ts`, `frontend/app/composables/useSupabase.ts`
- **Issue:** Mix of Date objects, ISO strings, and `YYYY-MM-DD` strings.
- **Impact:** Potential bugs when passing data between components.
- **Fix approach:** Standardize on ISO strings internally, convert at boundaries.

### No Input Sanitization
- **Files:** `frontend/app/components/EditWorkoutModal.vue`
- **Issue:** Workout summary/description accepted and stored as-is.
- **Impact:** XSS if description rendered as HTML (currently safe as text).
- **Fix approach:** Sanitize on render if rich text support added later.

---

*Concerns audit: 2026-04-12*
