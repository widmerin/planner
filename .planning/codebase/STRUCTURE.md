# Codebase Structure

**Analysis Date:** 2026-04-12

## Directory Layout

```
planner/
├── .planning/
│   └── codebase/          # This documentation
├── frontend/
│   ├── app/               # Main Nuxt application
│   │   ├── app.vue        # Root component
│   │   ├── assets/        # Static assets (CSS)
│   │   ├── components/    # Vue components
│   │   ├── composables/   # Vue composables
│   │   └── lib/           # Utility libraries
│   ├── server/            # Server-side API routes
│   │   ├── api/           # REST endpoints
│   │   └── utils/         # Server utilities
│   ├── tests/             # Test files
│   │   ├── e2e/           # Playwright E2E tests
│   │   └── *.test.ts      # Unit tests
│   ├── public/            # Static files (favicon)
│   ├── nuxt.config.ts     # Nuxt configuration
│   ├── package.json       # Dependencies
│   └── vitest.config.ts   # Unit test configuration
└── README.md
```

## Directory Purposes

**`frontend/app/`:**
- Purpose: Main frontend application source
- Contains: Root Vue app, components, composables, utilities

**`frontend/app/components/`:**
- Purpose: Reusable Vue UI components
- Contains: LoginScreen.vue, EditWorkoutModal.vue

**`frontend/app/composables/`:**
- Purpose: Vue composables (shared reactive logic)
- Contains: useSupabase.ts

**`frontend/app/lib/`:**
- Purpose: Pure utility functions and types
- Contains: workouts.ts (ICS parsing, date utils), auth.ts (API calls)

**`frontend/app/assets/`:**
- Purpose: Global CSS styles
- Contains: main.css (design system, component styles)

**`frontend/server/api/`:**
- Purpose: Server-side REST API endpoints
- Contains: auth/, workouts/ route directories

**`frontend/tests/`:**
- Purpose: Test files
- Contains: E2E specs, unit tests

## Key File Locations

**Entry Points:**
- `frontend/app/app.vue`: Root component, main app logic

**Configuration:**
- `frontend/nuxt.config.ts`: Nuxt configuration
- `frontend/vitest.config.ts`: Unit test configuration
- `frontend/playwright.config.ts`: E2E test configuration

**Core Logic:**
- `frontend/app/lib/workouts.ts`: Workout types, ICS parsing, date utilities
- `frontend/app/lib/auth.ts`: Authentication API helpers
- `frontend/app/composables/useSupabase.ts`: Supabase client and queries

**Components:**
- `frontend/app/components/LoginScreen.vue`: Login form
- `frontend/app/components/EditWorkoutModal.vue`: Workout edit dialog

**API Routes:**
- `frontend/server/api/auth/login.post.ts`: Authentication endpoint
- `frontend/server/api/auth/session.get.ts`: Session check
- `frontend/server/api/auth/logout.post.ts`: Logout endpoint
- `frontend/server/api/workouts/index.get.ts`: Get all workouts
- `frontend/server/api/workouts/sync.post.ts`: ICS sync to Supabase
- `frontend/server/api/workouts/completions.get.ts`: Get completions/paces
- `frontend/server/api/workouts/toggle.post.ts`: Toggle workout completion
- `frontend/server/api/workouts/pace.post.ts`: Update pace
- `frontend/server/api/workouts/update.patch.ts`: Update workout details

**Tests:**
- `frontend/tests/e2e/week-planner.spec.ts`: Playwright E2E tests
- `frontend/tests/workouts.test.ts`: Unit tests for workouts lib
- `frontend/tests/api-routes.test.ts`: API route tests

**Static Assets:**
- `frontend/public/favicon.svg`: App favicon

## Naming Conventions

**Files:**
- Vue components: PascalCase (LoginScreen.vue, EditWorkoutModal.vue)
- Composables: camelCase with `use` prefix (useSupabase.ts)
- Utility libs: camelCase (workouts.ts, auth.ts)
- API routes: kebab-case with method suffix (login.post.ts)

**Directories:**
- Components: Plural or singular noun (components/, composables/, lib/)
- API routes: Plural nouns matching resources (auth/, workouts/)

## Where to Add New Code

**New Component:**
- Location: `frontend/app/components/`
- Pattern: Single-file component with `<template>`, `<script setup>`, `<style scoped>`

**New Composable:**
- Location: `frontend/app/composables/`
- Pattern: Named export function, returns reactive state/methods

**New Utility Function:**
- Location: `frontend/app/lib/` in appropriate file
- Pattern: Pure function, export for use elsewhere

**New API Endpoint:**
- Location: `frontend/server/api/{resource}/{method}.ts`
- Pattern: Export default function with named route based on filename

**New Test:**
- Unit: `frontend/tests/{module}.test.ts`
- E2E: `frontend/tests/e2e/{feature}.spec.ts`

## Special Directories

**`frontend/app/assets/`:**
- Purpose: CSS design system and component styles
- Generated: No
- Committed: Yes

**`frontend/public/`:**
- Purpose: Static files served as-is
- Contains: favicon.svg
- Generated: No
- Committed: Yes

**`frontend/.nuxt/`:**
- Purpose: Nuxt build output
- Generated: Yes (build artifact)
- Committed: No (in .gitignore)

**`frontend/node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (npm install)
- Committed: No (in .gitignore)

**`frontend/coverage/`:**
- Purpose: Test coverage reports
- Generated: Yes (test runs)
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-04-12*
