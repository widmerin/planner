# Week Planner MVP Plan

## Phase 1 — Project setup
Success criteria:
- Nuxt app exists in `frontend`
- App is client-rendered
- Dependencies for ICS parsing, unit tests, and Playwright are installed
- Root `.gitignore` covers generated artifacts

## Phase 2 — Core functionality
Success criteria:
- Workouts are loaded from `trainingsplan_v2.ics`
- Weekly overview is shown Monday to Sunday
- Previous/next/current week navigation works
- Workout completion can be toggled in UI
- Done state persists via localStorage using `UID + DTSTART`

## Phase 3 — Validation
Success criteria:
- Unit tests validate parser and week grouping behavior
- Playwright test verifies mobile rendering and done-state persistence
- All tests pass
- Dev server starts successfully
