# Simplified Completion System - Single Model

## Overview

The system now uses **only the `Habit` model** (based on `HabitBase`) for everything:
- Creating habits
- Viewing habits  
- Completing habits (updates the same row)

## Models

### HabitBase (Unified)
```python
class HabitBase(BaseModel):
    user_id: str
    name: str
    category: str
    priority: int
    target_frequency: int
    estimated_duration: Optional[int]
    time_of_day: Optional[TimeOfDay]
    notes: Optional[str]
    
    # Completion fields (null when creating, filled when completing)
    mood_before: Optional[MoodLevel]
    mood_after: Optional[MoodLevel]
    energy_level_before: Optional[EnergyLevel]
    energy_level_after: Optional[EnergyLevel]
    is_successful: Optional[bool]
    actual_duration: Optional[int]
```

### CompleteHabitRequest
```python
class CompleteHabitRequest(BaseModel):
    habit_id: int
    mood_before: Optional[MoodLevel]
    mood_after: Optional[MoodLevel]
    energy_level_before: Optional[EnergyLevel]
    energy_level_after: Optional[EnergyLevel]
    time_of_day: Optional[TimeOfDay]
    is_successful: Optional[bool]
    actual_duration: Optional[int]
    notes: Optional[str]
```

## API Endpoints

### Create Habit
```http
POST /api/habits
Response: Habit

{
  "name": "Morning Run",
  "category": "fitness",
  "priority": 8,
  "target_frequency": 5
}
```

Returns:
```json
{
  "id": 1,
  "user_id": "user123",
  "name": "Morning Run",
  "category": "fitness",
  "priority": 8,
  "target_frequency": 5,
  "mood_before": null,
  "mood_after": null,
  "is_successful": null,
  ...
}
```

### Complete Habit
```http
POST /api/completions
Response: Habit

{
  "habit_id": 1,
  "mood_before": "good",
  "mood_after": "great",
  "energy_level_before": "high",
  "energy_level_after": "high",
  "is_successful": true
}
```

Returns the **updated Habit**:
```json
{
  "id": 1,
  "user_id": "user123",
  "name": "Morning Run",
  "category": "fitness",
  "priority": 8,
  "target_frequency": 5,
  "mood_before": "good",        ← UPDATED
  "mood_after": "great",        ← UPDATED
  "energy_level_before": "high", ← UPDATED
  "energy_level_after": "high",  ← UPDATED
  "is_successful": true,        ← UPDATED
  ...
}
```

### Get Habits
```http
GET /api/habits
Response: List[Habit]
```

Returns all habits with their current completion status.

## Database

### habits table
Single table with all fields:

**Core fields:**
- id, user_id, name, description, category
- priority, target_frequency, estimated_duration
- time_of_day, notes, is_active, created_at, updated_at

**Completion fields:**
- mood_before, mood_after
- energy_level_before, energy_level_after
- is_successful, actual_duration

## How It Works

1. **Create habit**: Core fields filled, completion fields null
2. **Complete habit**: POST to `/api/completions` → updates the habit row
3. **View habits**: GET `/api/habits` → see all habits with completion status

## Removed

- ❌ `HabitComplete` model
- ❌ `HabitCompleteCreate` model  
- ❌ `HabitCompleteUpdate` model
- ❌ `habit_complete` table (not used)
- ❌ `/api/completions` GET endpoints
- ❌ `/api/logs` endpoints

## What Remains

- ✅ `HabitBase` - unified model
- ✅ `Habit` - response model (uses HabitBase)
- ✅ `HabitCreate` - create request
- ✅ `HabitUpdate` - update request
- ✅ `CompleteHabitRequest` - completion request
- ✅ `habits` table - single source of truth

## Benefits

1. **Simple**: One model, one table
2. **Clear**: All habit data in one place
3. **Efficient**: No joins, no separate tables
4. **Consistent**: Same structure everywhere

## Migration

Run this SQL to add completion fields to habits table:

```sql
ALTER TABLE public.habits 
  ADD COLUMN IF NOT EXISTS mood_before TEXT CHECK (mood_before IN ('poor', 'okay', 'good', 'great')),
  ADD COLUMN IF NOT EXISTS mood_after TEXT CHECK (mood_after IN ('poor', 'okay', 'good', 'great')),
  ADD COLUMN IF NOT EXISTS energy_level_before TEXT CHECK (energy_level_before IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS energy_level_after TEXT CHECK (energy_level_after IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS is_successful BOOLEAN,
  ADD COLUMN IF NOT EXISTS actual_duration INTEGER;
```

Or run: `add-completion-fields-to-habits.sql`
