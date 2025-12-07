# Unified Habit Model Structure

## Overview

The system now uses a **single unified `HabitBase` model** that serves both purposes:
1. **Creating new habits** (with completion fields as null)
2. **Tracking completions** (updating the same habit row with completion data)

## Model Structure

### HabitBase (Unified Model)

```python
class HabitBase(BaseModel):
    # User identification
    user_id: str
    
    # Core habit fields (required when creating)
    name: str
    description: Optional[str]
    category: str
    priority: int (1-10)
    target_frequency: int (1-7 times per week)
    estimated_duration: Optional[int]
    time_of_day: Optional[TimeOfDay]
    notes: Optional[str]
    
    # Completion tracking fields (null when creating, filled when completing)
    mood_before: Optional[MoodLevel]
    mood_after: Optional[MoodLevel]
    energy_level_before: Optional[EnergyLevel]
    energy_level_after: Optional[EnergyLevel]
    is_successful: Optional[bool]
    actual_duration: Optional[int]
```

## How It Works

### 1. Creating a New Habit

When a user creates a new habit, only the core fields are filled:

```json
{
  "user_id": "user123",
  "name": "Morning Run",
  "category": "fitness",
  "priority": 8,
  "target_frequency": 5,
  "estimated_duration": 30,
  "time_of_day": "morning",
  "notes": "Run in the park",
  
  // Completion fields are null
  "mood_before": null,
  "mood_after": null,
  "energy_level_before": null,
  "energy_level_after": null,
  "is_successful": null,
  "actual_duration": null
}
```

### 2. Completing a Habit

When a user completes a habit (clicks on it in WeeklySchedule), **the same habit row is UPDATED** with completion data:

```json
{
  "habit_id": 1,
  "mood_before": "good",
  "mood_after": "great",
  "energy_level_before": "high",
  "energy_level_after": "high",
  "time_of_day": "morning",
  "is_successful": true,
  "actual_duration": 30
}
```

The habit row now contains:
```json
{
  "id": 1,
  "user_id": "user123",
  "name": "Morning Run",
  "category": "fitness",
  "priority": 8,
  "target_frequency": 5,
  "estimated_duration": 30,
  "time_of_day": "morning",
  
  // Completion fields NOW FILLED
  "mood_before": "good",
  "mood_after": "great",
  "energy_level_before": "high",
  "energy_level_after": "high",
  "is_successful": true,
  "actual_duration": 30
}
```

## Database Structure

### habits table
Stores **everything** in one row - both habit definition AND latest completion:

**Core fields:**
- id, user_id, name, description, category
- priority, target_frequency, estimated_duration
- time_of_day, notes, is_active, created_at

**Completion fields (updated when habit is completed):**
- mood_before, mood_after
- energy_level_before, energy_level_after
- is_successful, actual_duration

## API Endpoints

### Create Habit
```http
POST /api/habits
{
  "name": "Study Math",
  "category": "learning",
  "priority": 9,
  "target_frequency": 5,
  "estimated_duration": 60
}
```

### Complete Habit (Updates the habit row)
```http
POST /api/completions
{
  "habit_id": 1,
  "mood_before": "good",
  "mood_after": "great",
  "energy_level_before": "high",
  "energy_level_after": "high",
  "time_of_day": "morning",
  "is_successful": true,
  "actual_duration": 60
}
```

This **UPDATES** the habit row with ID 1, setting the completion fields.

## Benefits of Unified Model

1. **Simplicity**: One row per habit, no separate completion table
2. **Single source of truth**: All habit data in one place
3. **Easy to query**: No joins needed to see habit + completion status
4. **Clear separation**: Core fields vs completion fields
5. **Null safety**: Completion fields are optional/null by default
6. **Type safety**: Pydantic validation for all fields

## Frontend Usage

### Creating a Habit (HabitForm)
```javascript
const habitData = {
  name: "Morning Run",
  category: "fitness",
  priority: 8,
  target_frequency: 5,
  estimated_duration: 30
  // Completion fields omitted (will be null)
}
await api.createHabit(habitData)
```

### Completing a Habit (WeeklySchedule)
```javascript
const completionData = {
  habit_id: habitId,
  mood_before: 'good',
  mood_after: 'great',
  energy_level_before: 'high',
  energy_level_after: 'high',
  time_of_day: 'morning',
  is_successful: true,
  actual_duration: habit.estimated_duration
}
// This UPDATES the habit row
await api.createCompletion(completionData)
```

## Migration Required

### Run this SQL in Supabase:

```sql
-- Add completion fields to habits table
ALTER TABLE public.habits 
  ADD COLUMN IF NOT EXISTS mood_before TEXT CHECK (mood_before IN ('poor', 'okay', 'good', 'great')),
  ADD COLUMN IF NOT EXISTS mood_after TEXT CHECK (mood_after IN ('poor', 'okay', 'good', 'great')),
  ADD COLUMN IF NOT EXISTS energy_level_before TEXT CHECK (energy_level_before IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS energy_level_after TEXT CHECK (energy_level_after IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS is_successful BOOLEAN,
  ADD COLUMN IF NOT EXISTS actual_duration INTEGER;
```

Or run the file: `add-completion-fields-to-habits.sql`

## How Completion Works

1. User clicks habit card in WeeklySchedule
2. Frontend calls `api.createCompletion(completionData)`
3. Backend receives POST to `/api/completions`
4. Backend calls `db.create_completion()` which **UPDATES** the habit row
5. Habit row now has completion data filled in
6. Frontend shows green background on the card
