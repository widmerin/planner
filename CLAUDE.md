<!-- GSD:project-start source:PROJECT.md -->
## Project

**Week Planner**

A mobile-optimized weekly workout planner for personal running schedule. Displays workouts from an ICS calendar file, allows marking them complete, and tracks running pace. Simple, elegant, no frills.

**Core Value:** A single runner can see their weekly training plan, mark workouts done, and track pace — synced across devices.

### Constraints

- **Tech Stack**: Nuxt + Vue + Supabase — already implemented
- **Platform**: Mobile-first, browser-based
- **No Backend**: Client-rendered only, serverless API routes
- **No User Management**: Single user for MVP
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript - All frontend code
## Runtime
- Browser (client-side rendering)
- npm
- Lockfile: `frontend/package-lock.json` (implied)
## Frameworks
- Nuxt 4.4.2 - Vue meta-framework
- Vue 3.5.30 - UI framework
- vue-router 5.0.4 - Routing
- CSS (vanilla, in `frontend/assets/main.css`)
## Key Dependencies
- `@supabase/supabase-js` ^2.103.0 - Database and auth client
- `ical.js` ^2.2.1 - iCalendar file parsing
- `@vueuse/core` ^14.2.1 - Vue composition utilities
- `sharp` ^0.34.5 - Image processing
## Dev Dependencies
- `vitest` ^4.1.1 - Unit testing framework
- `@vitest/coverage-v8` ^4.1.1 - V8 coverage provider
- `@playwright/test` ^1.58.2 - E2E testing
- `playwright` ^1.58.2 - Browser automation
- `@nuxt/test-utils` ^4.0.0 - Nuxt testing utilities
## Configuration
- `NUXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NUXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- File: `frontend/nuxt.config.ts`
- SSR disabled (client-side rendering only)
- DevTools enabled
- PWA manifest configured
## Platform Requirements
- Node.js (latest)
- npm scripts in `frontend/package.json`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Vue 3 Composition API
- Use `<script setup lang="ts">` for all Vue components
- Use `withDefaults(defineProps<...>())` for typed props with defaults
- Use `defineEmits<{ ... }>()` for typed emit declarations
- Prefer `ref()` for primitives, `reactive()` for objects
- Use `computed()` for derived values
## TypeScript Usage
- Explicit return types for public functions
- Use `type` keyword (not `interface`) for object shapes
- Use `any` sparingly; prefer explicit types
- Component props use inline type literals with `defineProps<{ ... }>()`
## Naming Conventions
- Vue components: PascalCase (`EditWorkoutModal.vue`, `LoginScreen.vue`)
- TypeScript files: kebab-case (`workouts.ts`, `auth.ts`)
- Test files: `*.test.ts` or `*.spec.ts`
- camelCase: variables, functions, methods (`isLoading`, `handleLogin`, `syncPaceToSupabase`)
- PascalCase: components, types (`Workout`, `LoginScreen`)
- camelCase with descriptive names (`progressMilestones = [0, 25, 50, 75, 100]`)
## File Organization
- `~/` maps to `frontend/app/`
## Styling Approach
- Single global stylesheet: `app/assets/main.css`
- CSS custom properties (variables) for theming
- Component-scoped `<style scoped>` for component-specific overrides
- No preprocessor (plain CSS)
- Mobile-first approach
- Breakpoints at `640px` and `430px`
- Fluid spacing using `rem` units
- BEM-inspired: `.day-card`, `.workout-item`, `.progress-track`
- Component prefixes: `.pace-modal`, `.edit-modal`
## Error Handling
- `console.error()` for actual errors
- `console.warn()` for recoverable issues (e.g., sync failures)
- Avoid `console.log()` in production code
## State Management
- `ref()` and `computed()` for component state
- `useStorage()` from `@vueuse/core` for localStorage persistence
- Fetch via `/server/api/*` routes
- Manual fetch calls, no external state library
- Sync to Supabase on mutations
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Client-side rendering (CSR mode via Nuxt)
- Component-based UI with Vue 3 `<script setup>` syntax
- Composable pattern for shared state/logic
- Server-side API routes via Nuxt/Nitro
- Dual persistence: Supabase (remote) + LocalStorage (local)
## Layers
- Purpose: Render the application interface
- Location: `frontend/app/components/`
- Contains: Vue components (LoginScreen, EditWorkoutModal)
- Depends on: Composables, lib utilities
- Used by: `app.vue`
- Purpose: State management and business logic coordination
- Location: `frontend/app/app.vue`
- Contains: Main page component with reactive state, week navigation, workout management
- Depends on: Composables, lib utilities
- Exposes: Workouts data, done/pace state, navigation controls
- Purpose: Shared state and logic reusable across components
- Location: `frontend/app/composables/`
- Contains: `useSupabase.ts` - Supabase client and database operations
- Pattern: Singleton Supabase client with typed query methods
- Purpose: Pure functions and data transformations
- Location: `frontend/app/lib/`
- Contains:
- Pattern: Export utility functions, TypeScript types/interfaces
- Purpose: Server-side endpoints for Supabase operations
- Location: `frontend/server/api/`
- Contains: Auth endpoints, workout CRUD endpoints
- Depends on: Supabase client
- Used by: Frontend via `$fetch`
- Remote: Supabase (PostgreSQL) for workouts, completions, paces
- Local: LocalStorage via `@vueuse/core` `useStorage` for done/pace state
## Data Flow
## Key Abstractions
- Purpose: Represents a scheduled training workout
- Location: `frontend/app/lib/workouts.ts`
- Pattern: TypeScript interface with Date handling
```typescript
```
- Purpose: Encapsulates Supabase client and typed database operations
- Location: `frontend/app/composables/useSupabase.ts`
- Pattern: Singleton client, returns typed methods (fetchWorkouts, insertWorkouts, markWorkoutComplete, etc.)
- Purpose: Modal dialog for editing workout details
- Location: `frontend/app/components/EditWorkoutModal.vue`
- Pattern: Props in, events out (`save`, `cancel`)
## Entry Points
- Location: `frontend/app/app.vue`
- Triggers: Page load
- Responsibilities: Auth check, workout loading, week navigation, state management
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
- API calls wrapped in try/catch with console.error/warn
- Load errors displayed in error panel
- Sync failures logged but don't block UI
- Validation errors shown in EditWorkoutModal
## Cross-Cutting Concerns
- Local: `@vueuse/core` `useStorage()` for `doneState` and `paceState`
- Remote: Supabase tables for cross-device sync
- ISO week calculation in `lib/workouts.ts`
- `toDayKey()` for consistent date string format (`YYYY-MM-DD`)
- Touch swipe navigation for week switching
- Responsive CSS with media queries
- Dark theme optimized for OLED
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
