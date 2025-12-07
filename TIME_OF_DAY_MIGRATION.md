# Time of Day Migration to Many-to-Many Relationship

## Overview
Migrated `time_of_day` from a single-value column to a many-to-many relationship, similar to the `days` system.

## Database Changes

### New Tables
1. **times_of_day** - Reference table with 4 times:
   - 1: morning
   - 2: noon
   - 3: afternoon
   - 4: night

2. **times_of_day_habits** - Junction table linking habits to times of day
   - habit_id (FK to habits)
   - time_of_day_id (FK to times_of_day)

### Schema Changes
- **REMOVED**: `time_of_day` column from `habits` table
- **ADDED**: Many-to-many relationship via `times_of_day_habits` table

## Backend Changes

### models.py
- **HabitBase**: Changed `time_of_day` to `times_of_day: Optional[List[str]]`
- **HabitCreate**: Added `times_of_day: Optional[List[str]]`
- **HabitUpdate**: Changed `time_of_day` to `times_of_day: Optional[List[str]]`
- **Habit**: Changed `time_of_day` to `times_of_day: Optional[List[str]]`
- **CompleteHabitRequest**: Removed `time_of_day` field (no longer stored in completions)

### database.py
- **create_habit()**: 
  - Extracts `times_of_day` list before insert
  - Calls `_link_habit_times_of_day()` to create relationships
  - Removed `time_of_day` from allowed_fields

- **get_habits()**: 
  - Fetches times_of_day for each habit via `_get_habit_times_of_day()`
  - Returns habits with `times_of_day` array

- **complete_habit()**: 
  - Removed `time_of_day` from completion data (no longer tracked)

- **New Helper Methods**:
  - `_get_habit_times_of_day(habit_id)`: Returns list of time names for a habit
  - `_link_habit_times_of_day(habit_id, times_list)`: Creates/updates time relationships

## Frontend Changes

### HabitForm.jsx
- Changed from single-select dropdown to multi-select button grid
- Added `timesOfDay` array with 4 options
- Added `toggleTimeOfDay()` function
- Form state now uses `times_of_day: []` array instead of `time_of_day: null`

### WeeklySchedule.jsx
- Updated to display multiple time icons when `times_of_day` array has values
- Maps over `times_of_day` array to show all applicable time emojis

### EnhancedDashboard.jsx
- **Filtering**: Changed from `h.time_of_day === timeOfDay` to `h.times_of_day.includes(timeOfDay)`
- **No-time habits**: Changed from `!h.time_of_day` to `!h.times_of_day || h.times_of_day.length === 0`
- **Completion**: Removed `time_of_day` from completion payloads (both quick complete and full completion)

## Migration Steps

1. **Run SQL Migration**:
   ```bash
   psql -d your_database -f habit-coach/add-times-of-day-tables.sql
   ```

2. **Restart Backend**: The backend will automatically handle the new structure

3. **Frontend**: No manual migration needed - existing habits will show empty `times_of_day` arrays

## Backward Compatibility Notes

- Existing habits with old `time_of_day` column data will need manual migration if that column still exists
- The SQL migration removes the `time_of_day` column, so any existing data should be migrated first if needed
- Legacy components (HabitExplorer) still use `preferred_time_of_day` - these are separate from the main system

## Benefits

1. **Flexibility**: Habits can now be scheduled for multiple times of day (e.g., morning AND night)
2. **Consistency**: Same pattern as days scheduling system
3. **Scalability**: Easy to add more times of day if needed
4. **Cleaner API**: Array-based interface is more intuitive

## Example Usage

### Creating a habit with multiple times:
```javascript
{
  name: "Drink Water",
  category: "health",
  days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  times_of_day: ["morning", "noon", "afternoon", "night"]
}
```

### Filtering habits by time:
```javascript
const morningHabits = habits.filter(h => 
  h.times_of_day && h.times_of_day.includes('morning')
)
```

## TODO / Future Improvements

1. **ML Components**: Update ML/analytics components to work with times_of_day arrays
   - recommendation_engine.py
   - feature_engineering.py
   - difficulty_estimator.py
   - duration_predictor.py

2. **Habit Parser**: Update to parse multiple times from natural language
   - Currently extracts single `preferred_time_of_day`
   - Should extract array of times

3. **Analytics**: Update analytics to aggregate across multiple times
   - Currently looks for single `best_time_of_day`
   - Should handle habits with multiple times

4. **Timetable Engine**: Update scheduling logic to respect multiple times
   - Currently uses `preferred_time_of_day`
   - Should schedule across all specified times

## Testing

Test the following scenarios:
1. Create habit with no times (should work)
2. Create habit with one time (should work)
3. Create habit with multiple times (should work)
4. Update habit to add/remove times (should work)
5. Filter habits by time of day (should work)
6. Complete habit (should not require time_of_day)
7. View weekly schedule (should show all time icons)
