# Week Planner

## What This Is

A mobile-optimized weekly workout planner for personal running schedule. Displays workouts from an ICS calendar file, allows marking them complete, and tracks running pace. Simple, elegant, no frills.

## Core Value

A single runner can see their weekly training plan, mark workouts done, and track pace — synced across devices.

## Requirements

### Validated

- ✓ Weekly workout display with ISO week navigation — shipped
- ✓ ICS parsing and sync from `trainingsplan_v2.ics` — shipped
- ✓ Mark workouts done with checkbox — shipped
- ✓ Pace tracking (min/km) with modal on completion — shipped
- ✓ Progress tracking (weekly % and full plan %) — shipped
- ✓ Supabase sync for cross-device persistence — shipped
- ✓ Touch swipe navigation for week switching — shipped
- ✓ Edit existing workout — shipped
- ✓ Export workouts as JSON — shipped
- ✓ Login screen with session management — shipped
- ✓ Create new workout manually — Phase 1
- ✓ Delete unwanted workouts — Phase 1

### Active

- [ ] Improve pace tracking UI visibility
- [ ] Offline queue for failed syncs

### Out of Scope

- OAuth login — basic email/password sufficient
- Video/image uploads — not needed for training plan
- Real-time collaboration — single user app
- Advanced analytics — manual tracking sufficient
- Service worker for offline viewing — stretch goal only

## Context

**Technical Environment:**
- Nuxt 4.4.2 + Vue 3 (CSR mode)
- Supabase for remote data persistence
- LocalStorage for local state (via @vueuse/core)
- ical.js for ICS parsing

**Existing Codebase:**
- Frontend in `frontend/` directory
- Server API routes for Supabase operations
- Composables for shared state (`useSupabase.ts`)
- Utility libraries for workouts and auth

**Known Issues to Address:**
- Create/delete workout functionality missing (CONCERNS.md)
- Pace tracking UI not prominent (CONCERNS.md)
- Offline sync failures not queued for retry (CONCERNS.md)
- ICS re-parses on every sync (technical debt)

## Constraints

- **Tech Stack**: Nuxt + Vue + Supabase — already implemented
- **Platform**: Mobile-first, browser-based
- **No Backend**: Client-rendered only, serverless API routes
- **No User Management**: Single user for MVP

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Nuxt CSR mode | Simple SPA, no SSR complexity needed | ✓ Good |
| Supabase for remote sync | Free tier, simple setup | ✓ Good |
| LocalStorage for local state | Fast, works offline temporarily | ⚠️ Revisit - needs offline queue |
| Basic email/password auth | MVP scope, no OAuth needed | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-12 after Phase 1 completion*
