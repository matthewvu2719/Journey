# Weekly Reset System - How It Works

## Overview
The habit tracking system automatically handles weekly resets without requiring any special attributes on habits. Here's how it works:

## Completion Tracking
- Each completion is stored in the `habit_completions` table with a `completed_date` field
- Completions are tied to specific dates (e.g., "2024-12-06")
- When a new week starts, there are simply no completion records for the new week's dates yet

## Visual Status Indicators

### Green Background
- Habit is completed for that specific day
- Shows a checkmark icon

### Red Background  
- Habit is scheduled for a past date (overdue)
- Not completed yet
- Indicates the user missed this habit

### Default (Light Background)
- Habit is scheduled for today or a future date
- Not yet completed
- Waiting to be done

## How Weekly Reset Works

### Example Timeline:
```
Week 1 (Dec 2-8):
- Monday: Complete "Morning Run" → completion record created with date "2024-12-02"
- Tuesday: Complete "Morning Run" → completion record created with date "2024-12-03"
- Wednesday: Skip "Morning Run" → no completion record

Week 2 (Dec 9-15):
- Monday: "Morning Run" shows as incomplete (no completion for "2024-12-09" yet)
- The habit is still on the schedule (because it's in the days array)
- Previous week's completions remain in history for analytics
```

## Key Points

1. **No Date Attribute Needed**: Habits don't need a `date_type` or similar attribute. They persist indefinitely.

2. **Completion is Date-Specific**: Each completion is tied to a specific date, so completions naturally reset each day/week.

3. **Historical Data Preserved**: All past completions remain in the database for:
   - Analytics and insights
   - Streak tracking
   - ML recommendations
   - Progress visualization

4. **Schedule Persistence**: Habits remain on the schedule based on their `days` array (e.g., ["Mon", "Wed", "Fri"]), regardless of completion status.

## Database Schema
```sql
-- Habits table (persistent)
CREATE TABLE habits (
  id SERIAL PRIMARY KEY,
  name TEXT,
  days TEXT[],  -- ["Mon", "Wed", "Fri"]
  times_of_day TEXT[],  -- ["morning", "afternoon"]
  -- ... other fields
);

-- Completions table (date-specific records)
CREATE TABLE habit_completions (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER REFERENCES habits(id),
  completed_date DATE,  -- This makes each completion unique per day
  time_of_day_id INTEGER,
  -- ... other fields
);
```

## Frontend Logic
The `WeeklySchedule` component:
1. Maps each day to its actual date (e.g., "Mon" → "2024-12-09")
2. Checks if a completion exists for that habit + date + time combination
3. Applies visual styling based on completion status and date comparison
