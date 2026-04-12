# Week Planner

MVP week planner for a running schedule with Supabase backend persistence.

## Features

- 📅 Weekly overview (Monday–Sunday) of planned workouts from ICS file
- ✅ Mark workouts as completed
- ⏱️ Track pace (min/km) for running workouts
- 💾 Persist completion status and pace to Supabase database
- 📱 Mobile-first responsive design
- 🧪 Full test coverage (unit + E2E)

## Tech Stack

- **Frontend**: Nuxt 4 (Vue 3), client-rendered
- **Backend**: Nitro API routes
- **Database**: Supabase (PostgreSQL)
- **Parsing**: ical.js (ICS calendar events)
- **Testing**: Vitest (unit), Playwright (E2E)

## Setup

### Prerequisites

- Node.js 22 LTS or later
- npm 10+
- Supabase account (free tier works)

### Environment Setup

1. Create Supabase project and get credentials from Dashboard → Settings → API
2. Create `.env` file in root:
   ```env
   APP_USER=your_username
   APP_PASSWORD=your_password
   ```
3. Create `frontend/.env.local`:
   ```env
   APP_USER=your_username
   APP_PASSWORD=your_password
   NUXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NUXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

### Database Setup

Run this SQL in Supabase SQL Editor:

```sql
-- Create workouts table
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  uid text unique not null,
  summary text not null,
  description text,
  start_date timestamp not null,
  end_date timestamp,
  is_all_day boolean default false,
  created_at timestamp default now()
);

alter table public.workouts enable row level security;

create policy "allow_anon_select_workouts" on public.workouts for select using (true);
create policy "allow_anon_insert_workouts" on public.workouts for insert with check (true);
create policy "allow_anon_update_workouts" on public.workouts for update using (true);

-- Create workout_completion table
create table public.workout_completion (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  completed_date date not null,
  completed_at timestamp default now(),
  pace text,
  unique(workout_id, completed_date)
);

alter table public.workout_completion enable row level security;

create policy "allow_anon_select_completion" on public.workout_completion for select using (true);
create policy "allow_anon_insert_completion" on public.workout_completion for insert with check (true);
create policy "allow_anon_update_completion" on public.workout_completion for update using (true);
create policy "allow_anon_delete_completion" on public.workout_completion for delete using (true);
```

## Run

```bash
cd frontend
npm install
npm run dev
```

App will be at `http://localhost:3000/`

First time: Log in with credentials from `.env.local`, then click "Sync" to load workouts from `trainingsplan_v2.ics`.

## Test

```bash
cd frontend

# Unit tests
npm test

# Unit tests with coverage
npm run test:coverage

# E2E tests (requires running dev server in another terminal)
npm run test:e2e

# E2E tests in headed browser
npm run test:e2e -- --headed
```

## Documentation

- [MVP Plan](docs/mvp-plan.md) — Implementation checklist with success criteria
- [Supabase Setup](docs/SUPABASE_SETUP.md) — Database schema details
- [Database Pace Update](docs/DATABASE_PACE_UPDATE.md) — Pace persistence feature
- [Verify Supabase](docs/VERIFY_SUPABASE.md) — RLS policy troubleshooting
- [Troubleshooting](docs/TROUBLESHOOTING.md) — Common issues and fixes
