# Supabase Verification Guide

## RLS Policy Issue Found

**Problem:** The `workouts` table is missing the INSERT and UPDATE policies needed for the sync endpoint to work.

**Error:** `"new row violates row-level security policy for table \"workouts\""`

## Quick Fix

Run these SQL commands in your Supabase dashboard (SQL Editor):

### 1. Add INSERT policy to workouts table
```sql
create policy "allow_anon_insert_workouts" on public.workouts
  for insert
  with check (true);
```

### 2. Add UPDATE policy to workouts table
```sql
create policy "allow_anon_update_workouts" on public.workouts
  for update
  using (true);
```

### 3. Verify the policies exist
```sql
-- Check workouts table policies
select schemaname, tablename, policyname, permissive, roles, qual
from pg_policies
where tablename = 'workouts';

-- Check workout_completion table policies
select schemaname, tablename, policyname, permissive, roles, qual
from pg_policies
where tablename = 'workout_completion';
```

## How to Apply

1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the sidebar
3. Click "New Query"
4. Paste the INSERT policy command above
5. Click "Run"
6. Repeat for UPDATE policy
7. Test: `curl -X POST http://localhost:3000/api/workouts/sync`

## Complete RLS Setup for MVP

If you want to recreate from scratch, drop existing policies and create all at once:

```sql
-- Drop existing policies if any
drop policy if exists "allow_anon_select_workouts" on public.workouts;
drop policy if exists "allow_anon_insert_workouts" on public.workouts;
drop policy if exists "allow_anon_update_workouts" on public.workouts;

-- Create complete policies for workouts table
create policy "allow_anon_select_workouts" on public.workouts
  for select
  using (true);

create policy "allow_anon_insert_workouts" on public.workouts
  for insert
  with check (true);

create policy "allow_anon_update_workouts" on public.workouts
  for update
  using (true);

-- Verify all policies
select schemaname, tablename, policyname, permissive from pg_policies where tablename = 'workouts';
```

## Verification Steps

After applying the policies, verify with these tests:

### Test 1: Check API connection
```bash
curl http://localhost:3000/api/workouts
# Should return: {"success":true,"workouts":[]}
```

### Test 2: Check sync endpoint
```bash
curl -X POST http://localhost:3000/api/workouts/sync
# Should return: {"success":true,"synced":XX,"message":"Synced XX workouts"}
```

### Test 3: Verify workouts loaded
```bash
curl http://localhost:3000/api/workouts
# Should return workouts from trainingsplan_v2.ics
```

## Troubleshooting

If you still see RLS errors:

1. **Verify RLS is enabled:**
   ```sql
   select oid, relname, relrowsecurity
   from pg_class
   where relname in ('workouts', 'workout_completion');
   ```
   Should show `true` for `relrowsecurity`

2. **Check table exists:**
   ```sql
   select * from information_schema.tables 
   where table_name = 'workouts';
   ```

3. **View all policies on workouts:**
   ```sql
   select * from pg_policies where tablename = 'workouts';
   ```

4. **If issues persist**, try disabling RLS temporarily to verify data:
   ```sql
   alter table public.workouts disable row level security;
   ```
   Then re-enable and set up policies again.
