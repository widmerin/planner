# Requirements: Week Planner

**Defined:** 2026-04-12
**Core Value:** A single runner can see their weekly training plan, mark workouts done, and track pace — synced across devices.

## v1 Requirements

### Workouts

- [x] **WORK-01**: User can create a new workout with summary, description, date, and time
- [x] **WORK-02**: User can delete an unwanted workout with confirmation
- [x] **WORK-03**: User can edit existing workout details (summary, description, time)
- [x] **WORK-04**: New workouts persist to Supabase and survive page reload

### Pace Tracking

- [x] **PACE-01**: User sees "Add pace" button on all run workouts (not yoga/bike)
- [x] **PACE-02**: User can add or update pace (min/km) for any completed run workout
- [x] **PACE-03**: Pace data syncs to Supabase and persists

## v2 Requirements (Future)

### Testing & Quality

- **TEST-01**: E2E tests for workout CRUD (create, edit, delete)
- **TEST-02**: E2E tests for pace tracking (add, update)
- **TEST-03**: E2E tests for week navigation
- **TEST-04**: Mock data setup for tests to run without Supabase

### Code Quality

- **CODE-01**: Security audit (no hardcoded secrets, input validation)
- **CODE-02**: Code simplification (remove dead code, consistent patterns)
- **CODE-03**: Error handling consistency

### Offline Experience

- **OFLN-01**: Failed sync operations are queued locally
- **OFLN-02**: Queued operations retry automatically when connection restored
- **OFLN-03**: User sees indicator when offline operations are pending

### Enhanced Features

- **ENHN-01**: User can view pace history over time (basic chart)
- **ENHN-02**: User can export/import ICS file
- **ENHN-03**: User can configure workout categories (run types)

## Out of Scope

| Feature | Reason |
|---------|--------|
| OAuth login | Basic email/password sufficient for single user |
| Video/image attachments | Not needed for training plan |
| Real-time collaboration | Single user app |
| Push notifications | Overkill for personal schedule |
| Advanced analytics | Manual tracking sufficient for MVP |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| WORK-01 | Phase 1 | ✓ Complete |
| WORK-02 | Phase 1 | ✓ Complete |
| WORK-03 | Phase 1 | ✓ Complete |
| WORK-04 | Phase 1 | ✓ Complete |
| PACE-01 | Phase 2 | ✓ Complete |
| PACE-02 | Phase 2 | ✓ Complete |
| PACE-03 | Phase 2 | ✓ Complete |
| TEST-01 | Phase 3 | Pending |
| TEST-02 | Phase 3 | Pending |
| TEST-03 | Phase 3 | Pending |
| TEST-04 | Phase 3 | Pending |
| CODE-01 | Phase 4 | Pending |
| CODE-02 | Phase 4 | Pending |
| CODE-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 7 total (all complete)
- v2 requirements: 10 total (pending)

---
*Requirements defined: 2026-04-12*
*Last updated: 2026-04-12 after Phase 1 & 2 completion*
