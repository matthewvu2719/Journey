# Times of Day Migration - Changes Summary

## What Changed

Converted `time_of_day` from a single-value field to a many-to-many relationship, allowing habits to be scheduled for multiple times of day (e.g., morning AND afternoon).

## Files Modified

### Database Schema
- **add-times-of-day-tables.sql** ✅
  - Creates `times_of_day` reference table (morning, noon, afternoon, night)
  - Creates `times_of_day_habits` junction table
  - Removes `time_of_day` column from `habits` table

### Backend - Models
- **backend/models.py** ✅
  - `HabitBase`: `time_of_day` → `times_of_day: Optional[List[str]]`
  - `HabitCreate`: Added `times_of_day: Optional[List[str]]`
  - `HabitUpdate`: `time_of_day` → `times_of_day: Optional[List[str]]`
  - `Habit`: `time_of_day` → `times_of_day: Optional[List[str]]`
  - `CompleteHabitRequest`: Removed `time_of_day` (no longer tracked in completions)

### Backend - Database
- **backend/database.py** ✅
  - `create_habit()`: Handles `times_of_day` array, links via junction table
  - `get_habits()`: Fetches `times_of_day` for each habit
  - `complete_habit()`: Removed `time_of_day` from completion data
  - Added `_get_habit_times_of_day()`: Fetches time names for a habit
  - Added `_link_habit_times_of_day()`: Creates/updates time relationships

### Frontend - Components
- **frontend/src/components/HabitForm.jsx** ✅
  - Changed from dropdown to multi-select button grid
  - Added `timesOfDay` array and `toggleTimeOfDay()` function
  - Form state uses `times_of_day: []` array

- **frontend/src/components/WeeklySchedule.jsx** ✅
  - Displays multiple time icons for habits with multiple times
  - Maps over `times_of_day` array

- **frontend/src/components/EnhancedDashboard.jsx** ✅
  - Updated filtering: `h.times_of_day.includes(timeOfDay)`
  - Updated no-time check: `!h.times_of_day || h.times_of_day.length === 0`
  - Removed `time_of_day` from completion payloads

### Documentation
- **TIME_OF_DAY_MIGRATION.md** ✅ (New)
  - Complete migration guide
  - API examples
  - Future improvements

- **TIMES_OF_DAY_CHANGES_SUMMARY.md** ✅ (This file)

### Testing
- **test_times_of_day.py** ✅ (New)
  - Tests creating habits with multiple times
  - Tests creating habits with single time
  - Tests creating habits with no times
  - Tests completing habits
  - Tests filtering by time

## How to Apply Changes

### 1. Database Migration
```bash
# Connect to your Supabase database and run:
psql -d your_database -f habit-coach/add-times-of-day-tables.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `add-times-of-day-tables.sql`
3. Execute

### 2. Backend
No additional steps needed - changes are in code

### 3. Frontend
No additional steps needed - changes are in code

### 4. Test
```bash
cd habit-coach
python test_times_of_day.py
```

## API Changes

### Before (Single Time)
```json
{
  "name": "Morning Run",
  "category": "fitness",
  "time_of_day": "morning",
  "days": ["Mon", "Wed", "Fri"]
}
```

### After (Multiple Times)
```json
{
  "name": "Drink Water",
  "category": "health",
  "times_of_day": ["morning", "noon", "afternoon", "night"],
  "days": ["Mon", "Tue", "Wed", "Thu", "Fri"]
}
```

## Breaking Changes

⚠️ **Important**: The following are breaking changes:

1. **API Field Name**: `time_of_day` → `times_of_day`
2. **Data Type**: String → Array of strings
3. **Database Column**: `time_of_day` column removed from `habits` table
4. **Completion**: `time_of_day` no longer tracked in habit completions

## Backward Compatibility

- Old habits with `time_of_day` data will need migration if the column still exists
- The SQL migration script removes the column, so migrate data first if needed
- Frontend gracefully handles missing `times_of_day` (shows as empty array)

## Known Issues / TODO

### Components Not Yet Updated
These components still reference old `time_of_day` or `preferred_time_of_day`:

1. **HabitExplorer.jsx** - Uses `preferred_time_of_day` (legacy component)
2. **Analytics.jsx** - Displays `best_time_of_day` from backend
3. **ML Components** - Need updates:
   - `backend/ml/recommendation_engine.py`
   - `backend/ml/feature_engineering.py`
   - `backend/ml/difficulty_estimator.py`
   - `backend/ml/duration_predictor.py`
4. **Habit Parser** - `backend/habit_parser.py` extracts single time
5. **Timetable Engine** - `backend/timetable_engine.py` uses `preferred_time_of_day`
6. **Chatbot** - `backend/intelligent_chatbot.py` displays single time

### Recommended Next Steps
1. Update ML components to handle `times_of_day` arrays
2. Update habit parser to extract multiple times from text
3. Update analytics to aggregate across multiple times
4. Update timetable engine to schedule across all specified times
5. Consider migrating HabitExplorer to use new structure

## Testing Checklist

- [x] Create habit with no times
- [x] Create habit with one time
- [x] Create habit with multiple times
- [x] Retrieve habits with times_of_day
- [x] Complete habit (without time_of_day)
- [x] Filter habits by time of day
- [x] Display habits in WeeklySchedule
- [x] Display habits in EnhancedDashboard
- [ ] Test with real Supabase database
- [ ] Test ML components
- [ ] Test analytics
- [ ] Test habit parser
- [ ] Test timetable generation

## Questions?

See `TIME_OF_DAY_MIGRATION.md` for detailed documentation.
