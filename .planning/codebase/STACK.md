# Technology Stack

**Analysis Date:** 2026-04-12

## Languages

**Primary:**
- TypeScript - All frontend code

## Runtime

**Environment:**
- Browser (client-side rendering)

**Package Manager:**
- npm
- Lockfile: `frontend/package-lock.json` (implied)

## Frameworks

**Core:**
- Nuxt 4.4.2 - Vue meta-framework
- Vue 3.5.30 - UI framework
- vue-router 5.0.4 - Routing

**Styling:**
- CSS (vanilla, in `frontend/assets/main.css`)

## Key Dependencies

**Supabase:**
- `@supabase/supabase-js` ^2.103.0 - Database and auth client

**ICS Parsing:**
- `ical.js` ^2.2.1 - iCalendar file parsing

**Utilities:**
- `@vueuse/core` ^14.2.1 - Vue composition utilities
- `sharp` ^0.34.5 - Image processing

## Dev Dependencies

**Testing:**
- `vitest` ^4.1.1 - Unit testing framework
- `@vitest/coverage-v8` ^4.1.1 - V8 coverage provider
- `@playwright/test` ^1.58.2 - E2E testing
- `playwright` ^1.58.2 - Browser automation

**Nuxt Testing:**
- `@nuxt/test-utils` ^4.0.0 - Nuxt testing utilities

## Configuration

**Environment Variables:**
- `NUXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NUXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

**Nuxt Config:**
- File: `frontend/nuxt.config.ts`
- SSR disabled (client-side rendering only)
- DevTools enabled
- PWA manifest configured

## Platform Requirements

**Development:**
- Node.js (latest)

**Build:**
- npm scripts in `frontend/package.json`

---

*Stack analysis: 2026-04-12*
