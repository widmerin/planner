# Week Planner Frontend

Nuxt 4 app for the week planner. See [../README.md](../README.md) for complete setup and documentation.

## Quick Start

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — Start dev server on port 3000
- `npm run build` — Build for production
- `npm test` — Run unit tests
- `npm run test:coverage` — Unit tests with coverage report
- `npm run test:e2e` — Run E2E tests with Playwright
- `npm run test:e2e -- --headed` — E2E with visible browser
- `npm run lint` — Run ESLint

## Architecture

- `app/app.vue` — Main planner component
- `app/lib/workouts.ts` — ICS parsing and date utilities
- `app/composables/useSupabase.ts` — Supabase client setup
- `app/components/LoginScreen.vue` — Auth gate
- `server/api/workouts/*.ts` — Backend API endpoints
- `tests/` — Unit and E2E tests
- `public/data/trainingsplan_v2.ics` — Calendar data
