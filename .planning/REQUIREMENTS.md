# Requirements: Week Planner

**Defined:** 2026-04-12
**Core Value:** A single runner can see their weekly training plan, mark workouts done, and track pace — synced across devices.

## v1 Requirements

### Workouts

- [ ] **WORK-01**: User can create a new workout with summary, description, date, and time
- [ ] **WORK-02**: User can delete an unwanted workout with confirmation
- [ ] **WORK-03**: User can edit existing workout details (summary, description, time)
- [ ] **WORK-04**: New workouts persist to Supabase and survive page reload

### Pace Tracking

- [ ] **PACE-01**: User sees "Add pace" button on all run workouts (not yoga/bike)
- [ ] **PACE-02**: User can add or update pace (min/km) for any completed run workout
- [ ] **PACE-03**: Pace data syncs to Supabase and persists

### Sync & Offline

- [ ] **SYNC-01**: Failed sync operations are queued locally
- [ ] **SYNC-02**: Queued operations retry automatically when connection restored
- [ ] **SYNC-03**: User sees indicator when offline operations are pending

## v2 Requirements

### Offline Experience

- **OFLN-01**: Service worker caches app shell for offline viewing
- **OFLN-02**: Previously loaded workouts viewable offline

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
| WORK-01 | Phase 1 | Pending |
| WORK-02 | Phase 1 | Pending |
| WORK-03 | Phase 1 | Pending |
| WORK-04 | Phase 1 | Pending |
| PACE-01 | Phase 2 | Pending |
| PACE-02 | Phase 2 | Pending |
| PACE-03 | Phase 2 | Pending |
| SYNC-01 | Phase 3 | Pending |
| SYNC-02 | Phase 3 | Pending |
| SYNC-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-12*
*Last updated: 2026-04-12 after initial definition*
