# Roadmap: Week Planner

**Created:** 2026-04-12
**Phases:** 4 | **Requirements:** 10 | **All v1 requirements covered** ✓

## Phase Summary

| # | Phase | Goal | Status |
|---|-------|------|--------|
| 1 | Workout CRUD | Full create/delete/edit for workouts | ✓ Complete |
| 2 | Pace Tracking | Make pace tracking visible and accessible | ✓ Complete |
| 3 | Testing | E2E tests with mock data | Pending |
| 4 | Code Review | Security audit & simplification | Pending |

---

## Phase 1: Workout CRUD

**Status:** ✓ Complete

### Success Criteria (All Met)
1. ✓ User can tap "+" or "Add Workout" button to open create form
2. ✓ Create form has fields: summary (required), description (optional), date picker, time picker
3. ✓ New workout appears in correct day slot immediately after save
4. ✓ User can tap delete icon on any workout and confirm deletion
5. ✓ Deleted workout removed from UI and Supabase

---

## Phase 2: Pace Tracking Improvements

**Status:** ✓ Complete

### Success Criteria (All Met)
1. ✓ Every run workout shows a visible pace button/icon (not hidden in modal)
2. ✓ Tapping pace button opens inline pace input
3. ✓ User can update pace for any workout, not just on completion
4. ✓ Pace displayed inline next to workout title when set
5. ✓ Pace syncs to Supabase and survives page reload

---

## Phase 3: Testing

**Goal:** Comprehensive E2E test coverage with mock data for offline testing.

### Requirements
- TEST-01: E2E tests for workout CRUD (create, edit, delete)
- TEST-02: E2E tests for pace tracking (add, update)
- TEST-03: E2E tests for week navigation
- TEST-04: Mock data setup so tests run without Supabase connection

### Success Criteria
1. All core user flows have automated E2E tests
2. Tests use mock data/fixtures, not live database
3. Tests can run in CI without external dependencies
4. Test coverage report shows >80% coverage

### Technical Notes
- Create mock Supabase client for testing
- Add fixtures for sample workouts
- Mock auth flow for test isolation
- Use MSW or similar for API mocking

---

## Phase 4: Code Review & Security

**Goal:** Security audit, code simplification, and cleanup.

### Requirements
- SEC-01: Remove any hardcoded secrets or credentials
- SEC-02: Validate all user inputs on both client and server
- SEC-03: Review and sanitize HTML/output
- SIMP-01: Remove dead code and unused imports
- SIMP-02: Simplify complex functions
- SIMP-03: Consistent error handling
- DOCS-01: Document any non-obvious code

### Success Criteria
1. No security vulnerabilities (OWASP checklist)
2. Code complexity reduced (no functions > 50 lines)
3. All TODO/FIXME comments addressed or tracked
4. README updated with current state

### Security Checklist
- [ ] Environment variables properly secured
- [ ] SQL injection prevention (parameterized queries - done via Supabase)
- [ ] XSS prevention (Vue auto-escapes, review v-html usage)
- [ ] CSRF tokens if needed
- [ ] Rate limiting on API endpoints
- [ ] Input validation on all form fields
- [ ] Error messages don't leak sensitive info

### Simplification Checklist
- [ ] Remove duplicate code in API routes
- [ ] Extract shared utilities
- [ ] Consistent date/time handling
- [ ] Remove commented-out code
- [ ] Simplify conditional logic

---

## Phase Details (Reference)

### Phase 3: Testing
- **Files to add:** `tests/e2e/fixtures/`, `tests/mocks/`
- **Files to modify:** `tests/e2e/week-planner.spec.ts`

### Phase 4: Code Review
- **Files to review:** All frontend and server files
- **Focus areas:** Security, simplification, consistency

---

*Roadmap created: 2026-04-12*
*Last updated: 2026-04-12 after Phase 1 & 2 completion*
