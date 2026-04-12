# Coding Conventions

**Analysis Date:** 2026-04-12

## Vue 3 Composition API

**Component Structure:**
```vue
<template>
  <!-- Template content -->
</template>

<script setup lang="ts">
// Imports
import { ref, computed, onMounted } from 'vue'

// Props with TypeScript
const props = withDefaults(
  defineProps<{
    isOpen: boolean
    isNew?: boolean
  }>(),
  { isNew: false }
)

// Emits
const emit = defineEmits<{
  save: [workout: Partial<Workout>]
  cancel: []
}>()

// Reactive state
const isLoading = ref(false)

// Computed properties
const validationErrors = computed(() => validateWorkout(draft.value))

// Lifecycle
onMounted(async () => { ... })

// Methods
const handleSave = async () => { ... }
</script>

<style scoped>
/* Component-scoped styles */
</style>
```

**Key Patterns:**
- Use `<script setup lang="ts">` for all Vue components
- Use `withDefaults(defineProps<...>())` for typed props with defaults
- Use `defineEmits<{ ... }>()` for typed emit declarations
- Prefer `ref()` for primitives, `reactive()` for objects
- Use `computed()` for derived values

## TypeScript Usage

**Type Definitions:**
```typescript
// Types in app/lib/*.ts
export type Workout = {
  id: string
  uid: string
  summary: string
  description: string
  start: Date
  end: Date | null
  isAllDay: boolean
}

// Export types alongside functions
export const normalizeWorkout = (workout: any): Workout => { ... }
```

**Type Annotations:**
- Explicit return types for public functions
- Use `type` keyword (not `interface`) for object shapes
- Use `any` sparingly; prefer explicit types
- Component props use inline type literals with `defineProps<{ ... }>()`

## Naming Conventions

**Files:**
- Vue components: PascalCase (`EditWorkoutModal.vue`, `LoginScreen.vue`)
- TypeScript files: kebab-case (`workouts.ts`, `auth.ts`)
- Test files: `*.test.ts` or `*.spec.ts`

**Variables & Functions:**
- camelCase: variables, functions, methods (`isLoading`, `handleLogin`, `syncPaceToSupabase`)
- PascalCase: components, types (`Workout`, `LoginScreen`)

**Constants:**
- camelCase with descriptive names (`progressMilestones = [0, 25, 50, 75, 100]`)

## File Organization

```
frontend/
├── app/
│   ├── app.vue                 # Root component
│   ├── assets/main.css         # Global styles
│   ├── components/             # Vue components
│   │   ├── LoginScreen.vue
│   │   └── EditWorkoutModal.vue
│   ├── composables/            # Reusable composition functions
│   │   └── useSupabase.ts
│   └── lib/                    # Utility functions & types
│       ├── workouts.ts
│       └── auth.ts
├── server/
│   └── api/                    # Nuxt server routes
│       ├── workouts/
│       │   ├── index.get.ts
│       │   ├── sync.post.ts
│       │   └── ...
│       └── auth/
├── tests/
│   ├── workouts.test.ts        # Unit tests
│   ├── api-routes.test.ts      # API integration tests
│   └── e2e/                    # Playwright E2E tests
└── nuxt.config.ts
```

**Import Path Aliases:**
```typescript
import LoginScreen from '~/components/LoginScreen.vue'
import { parseWorkoutsFromICS } from '~/lib/workouts'
```
- `~/` maps to `frontend/app/`

## Styling Approach

**CSS Strategy:**
- Single global stylesheet: `app/assets/main.css`
- CSS custom properties (variables) for theming
- Component-scoped `<style scoped>` for component-specific overrides
- No preprocessor (plain CSS)

**CSS Variables (from main.css):**
```css
:root {
  --surface: rgba(7, 17, 31, 0.84);
  --accent: #67f0c0;
  --text: #f5f7ff;
  --muted: #90a0c0;
}
```

**Responsive Design:**
- Mobile-first approach
- Breakpoints at `640px` and `430px`
- Fluid spacing using `rem` units

**Class Naming:**
- BEM-inspired: `.day-card`, `.workout-item`, `.progress-track`
- Component prefixes: `.pace-modal`, `.edit-modal`

## Error Handling

**Async Operations:**
```typescript
try {
  const response = await fetch('/api/workouts')
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.statusMessage || `HTTP ${response.status}`)
  }
}
catch (error) {
  console.error('Error loading workouts:', error)
  loadError.value = `Unable to load workouts: ${error instanceof Error ? error.message : 'Unknown error'}`
}
finally {
  isLoading.value = false
}
```

**Console Usage:**
- `console.error()` for actual errors
- `console.warn()` for recoverable issues (e.g., sync failures)
- Avoid `console.log()` in production code

## State Management

**Local State:**
- `ref()` and `computed()` for component state
- `useStorage()` from `@vueuse/core` for localStorage persistence

```typescript
const doneState = useStorage<Record<string, boolean>>('weekplanner-done-v1', {})
const paceState = useStorage<Record<string, string>>('weekplanner-pace-v1', {})
```

**Server State:**
- Fetch via `/server/api/*` routes
- Manual fetch calls, no external state library
- Sync to Supabase on mutations

---

*Convention analysis: 2026-04-12*
