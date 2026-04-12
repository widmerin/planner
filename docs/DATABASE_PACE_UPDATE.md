# Database Schema Update for Pace/Distance Persistence

## Summary
The app now saves pace (min/km) when you mark a workout as done and add pace in the modal. This requires a new `pace` column in the `workout_completion` table.

## Required Changes

### Update `workout_completion` Table

Add a `pace` column to store the pace/distance data:

```sql
-- Add pace column to workout_completion table
alter table public.workout_completion
add column pace text null;

-- Add comment to document the field
comment on column public.workout_completion.pace is 'Pace in min/km format (e.g., "6:05")';
```

## How It Works

1. **User marks workout as done** ✓ (already synced to DB)
2. **Modal appears asking for pace** (new feature)
3. **User enters pace** (e.g., "6:05" for 6 minutes 5 seconds per km)
4. **Pace is saved to database** (new feature)

## Data Flow

### Saving Pace
```
User enters pace in modal
    ↓
setPace() updates localStorage
    ↓
syncPaceToSupabase() sends to API
    ↓
/api/workouts/pace endpoint updates workout_completion.pace
    ↓
Supabase stores the pace
```

### Loading Pace
```
loadWorkouts() fetches completions
    ↓
/api/workouts/completions returns completions + paces
    ↓
paceState (localStorage) is populated from Supabase data
    ↓
UI displays pace when workout is marked done
```

## Testing

After applying the SQL change:

1. Mark a workout as done
2. Enter a pace in the modal (e.g., "6:05")
3. Click Save
4. Refresh the page
5. The pace should still be there (persisted to Supabase)

## Troubleshooting

### Pace not saving?
1. Check browser console for errors
2. Verify the `pace` column exists in Supabase
3. Check that RLS policies allow writes to `workout_completion` table

### Schema Check
```sql
-- Verify the pace column exists
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'workout_completion'
order by ordinal_position;
```

Expected output should include:
```
pace | text | YES
```

## API Endpoints

### Save Pace
**POST** `/api/workouts/pace`

Request:
```json
{
  "workoutId": "f5f26698-24cc-454f-8704-054fd755d735__...",
  "pace": "6:05",
  "date": "2026-03-23"
}
```

Response:
```json
{
  "success": true,
  "workoutId": "...",
  "pace": "6:05",
  "date": "2026-03-23"
}
```

### Get Completions with Pace
**GET** `/api/workouts/completions`

Response:
```json
{
  "success": true,
  "completions": {
    "2026-03-23": ["workout-id-1", "workout-id-2"]
  },
  "paces": {
    "workout-id-1": "6:05",
    "workout-id-2": "5:45"
  }
}
```
