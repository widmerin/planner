# Supabase Integration Guide

## Phase 1: Supabase Project Setup

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project:
   - **Project name**: week-planner
   - **Database password**: Strong password (save securely)
   - **Region**: Choose closest to your users
4. Wait for project initialization (~2 min)

### Step 2: Get Credentials
From the Supabase dashboard → Settings → API:
- **Project URL**: `https://xxxxx.supabase.co`
- **Anon Key**: Public key (safe to expose in frontend)
- **Service Role Key**: Keep private (backend only)

### Step 3: Enable Row Level Security (RLS)
For MVP without user auth, we'll use anon key with RLS disabled on public tables.
- Dashboard → Authentication → Policies
- Tables will have RLS enabled but allow all anon access initially

---

## Database Schema

### Table 1: `workouts`
Stores parsed workout data from ICS file.

```sql
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  uid text unique not null,
  summary text not null,
  description text,
  start_date timestamp not null,
  end_date timestamp,
  is_all_day boolean default false,
  created_at timestamp default now(),
  
  -- indexes
  constraint valid_dates check (end_date is null or end_date >= start_date)
);

-- enable RLS (allow all anon access for MVP)
alter table public.workouts enable row level security;

create policy "allow_anon_select_workouts" on public.workouts
  for select
  using (true);

create policy "allow_anon_insert_workouts" on public.workouts
  for insert
  with check (true);

create policy "allow_anon_update_workouts" on public.workouts
  for update
  using (true);

-- index for week queries
create index idx_workouts_start_date on public.workouts(start_date);
```

### Table 2: `workout_completion`
Tracks which workouts user marked as done (synced from localStorage).

```sql
create table public.workout_completion (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  completed_date date not null,
  completed_at timestamp default now(),
  synced_at timestamp default now(),
  
  -- composites
  unique(workout_id, completed_date),
  constraint valid_completion_date check (completed_date <= current_date)
);

alter table public.workout_completion enable row level security;

create policy "allow_anon_insert_completion" on public.workout_completion
  for insert
  with check (true);

create policy "allow_anon_select_completion" on public.workout_completion
  for select
  using (true);

create policy "allow_anon_update_completion" on public.workout_completion
  for update
  using (true);

create index idx_completion_workout on public.workout_completion(workout_id);
create index idx_completion_date on public.workout_completion(completed_date);
```

---

## Environment Configuration

### `.env.local` (frontend root)
```env
NUXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### `nuxt.config.ts`
Add runtimeConfig:
```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      supabase: {
        url: process.env.NUXT_PUBLIC_SUPABASE_URL,
        key: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    },
  },
})
```

---

## Implementation Strategy

### Migration Flow
1. **Initial sync**: Parse ICS → Insert workouts into `workouts` table
2. **Read from DB**: Subsequent loads fetch from Supabase instead of parsing ICS
3. **Completion tracking**: Sync localStorage completions to `workout_completion` table
4. **Fallback**: App works offline with localStorage, syncs when connection returns

### Data Architecture
```
LocalStorage (client cache)
    ↓ (sync on interval)
    ↓
Supabase DB (source of truth)
    ↑ (fetch on load)
    ↑
Frontend App
```

---

## Dependencies to Install
```bash
npm install @supabase/supabase-js
```

---

## Success Criteria Checklist
- [ ] Supabase project created with correct credentials
- [ ] Database schema created (workouts + workout_completion tables)
- [ ] RLS policies configured
- [ ] Environment variables set in `.env.local`
- [ ] `@supabase/supabase-js` installed
- [ ] Nuxt config updated with Supabase settings
- [ ] Initial data sync script created
- [ ] API routes built for CRUD operations
- [ ] Frontend composable created for DB queries
- [ ] LocalStorage fallback implemented
- [ ] E2E tests passing

---

## Next Steps
1. Complete this setup
2. Create Nuxt composable for Supabase client (`composables/useSupabase.ts`)
3. Build API routes for workouts CRUD
4. Migrate frontend components to use Supabase
5. Implement sync logic with localStorage
