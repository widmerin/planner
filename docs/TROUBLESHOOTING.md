# Troubleshooting: "Could not load the workout plan"

## ✅ Checklist - Do These First

### 1. **Add Supabase Credentials**
Create/update `frontend/.env.local`:
```env
NUXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Get these from:**
- Go to [supabase.com/dashboard](https://supabase.com/dashboard)
- Open your project
- Click **Settings** → **API**
- Copy:
  - **Project URL** → `NUXT_PUBLIC_SUPABASE_URL`
  - **Anon public** → `NUXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. **Verify Supabase Database Schema**
In Supabase dashboard, check **SQL Editor**:
- Table `workouts` exists with columns: id, uid, summary, description, start_date, end_date, is_all_day
- Table `workout_completion` exists with columns: id, workout_id, completed_date, completed_at, synced_at
- RLS policies allow public access (for MVP)

If missing, run the SQL from [docs/SUPABASE_SETUP.md](../docs/SUPABASE_SETUP.md)

### 3. **Restart Dev Server**
```bash
cd frontend
npm run dev
```

### 4. **Check Browser Console**
Open browser DevTools (F12):
- **Console tab**: Look for error messages
- **Network tab**: 
  - Check `/api/workouts` response (should be 200 or 500 with details)
  - Check `/api/workouts/sync` response
  - Check `/api/workouts/completions` response

---

## 🔍 Common Errors & Fixes

### Error: "Supabase credentials not configured"
**Fix:** Add `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_ANON_KEY` to `frontend/.env.local`

**Why:** Without credentials, the API routes can't connect to Supabase.

---

### Error: "ICS file not found"
**Fix:** Verify file exists:
```bash
ls -la frontend/public/data/trainingsplan_v2.ics
```

**If missing:** Copy from root:
```bash
cp public/data/trainingsplan_v2.ics frontend/public/data/
```

---

### Error: "No workouts in database"
**Possible causes:**
1. First sync hasn't run
2. ICS file has no events
3. Database schema missing

**Fix:**
1. Check dev server logs for `/api/workouts/sync` response
2. Manually test sync by calling it:
   ```bash
   curl -X POST http://localhost:3000/api/workouts/sync
   ```
3. Check in Supabase dashboard if `workouts` table has any rows

---

### Error: Network fetch failures
**Fix:** Ensure:
1. Dev server is running: `npm run dev` outputs "Local: http://localhost:3000"
2. No firewall blocking localhost:3000
3. Fresh terminal (no stale `npm` processes)

Try:
```bash
# Kill any lingering npm processes
pkill -f "npm run dev"

# Start fresh
cd frontend
npm run dev
```

---

## 🐛 Detailed Debugging

### 1. Print API Response Details
Edit `frontend/app/app.vue` temporarily:

```typescript
const loadWorkouts = async () => {
  try {
    const response = await fetch('/api/workouts')
    console.log('API Response:', response.status, response.statusText)
    
    const data = await response.json()
    console.log('Response Data:', data)  // Add this line
    
    if (!response.ok) {
      throw new Error(`Could not load workouts: ${response.statusText}`)
    }
    // ... rest of code
```

Then check browser console for the logged data.

### 2. Test Endpoints with curl
```bash
# Test if workouts endpoint has data
curl -s http://localhost:3000/api/workouts | jq .

# Test sync endpoint
curl -s -X POST http://localhost:3000/api/workouts/sync | jq .

# Test completions endpoint
curl -s http://localhost:3000/api/workouts/completions | jq .
```

### 3. Check Server Logs
In the terminal where you ran `npm run dev`, look for error messages from API routes.

---

## 📋 Verification Steps

**Step 1: Env variables loaded**
```bash
grep NUXT_PUBLIC_SUPABASE frontend/.env.local
# Should output your credentials
```

**Step 2: ICS file accessible**
```bash
head -5 frontend/public/data/trainingsplan_v2.ics
# Should show iCalendar content starting with "BEGIN:VCALENDAR"
```

**Step 3: Dev server running**
Visit http://localhost:3000 in browser. Should see login screen.

**Step 4: Login successful**
After logging in, page should load or show detailed error.

**Step 5: Browser console clean**
No red errors, only yellow warnings are OK.

---

## 🆘 Still Stuck?

If none of the above works:

1. **Check all 3 files exist:**
   ```bash
   ls -la frontend/.env.local
   ls -la frontend/public/data/trainingsplan_v2.ics
   ls -la frontend/server/api/workouts/index.get.ts
   ```

2. **Check Supabase status:**
   - Go to supabase.com → your project
   - Check **Project Status** shows "Active"
   - Check **Logs** for any errors

3. **Verify database schema:**
   ```sql
   -- Run this in Supabase SQL Editor
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
   Should show: `workouts`, `workout_completion`

4. **Check RLS policies:**
   - Go to **Authentication** → **Policies**
   - `workouts` should allow SELECT
   - `workout_completion` should allow INSERT/SELECT/UPDATE

5. **Check logs in Supabase:**
   - Go to **Logs** tab
   - Look for connection errors or permission denied messages

---

## Next Steps Once Fixed

✅ Login to app  
✅ See workouts listed for the week  
✅ Check a workout as done  
✅ Refresh page — it stays checked!

If that works, Supabase integration is working correctly! 🎉
