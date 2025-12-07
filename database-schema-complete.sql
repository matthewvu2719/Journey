-- ============================================================================
-- PERSONAL HABIT COACH - COMPLETE DATABASE SCHEMA
-- All tables, migrations, and features consolidated
-- ============================================================================
-- Run this in Supabase SQL Editor: Your Project → SQL Editor → New Query
-- This file replaces all individual migration files
-- ============================================================================

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- TABLE: habits (Main habit definitions)
CREATE TABLE IF NOT EXISTS public.habits (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Habit types (atomic vs big)
  habit_type TEXT NOT NULL DEFAULT 'atomic' CHECK (habit_type IN ('atomic', 'big')),
  estimated_duration INTEGER CHECK (estimated_duration IS NULL OR estimated_duration > 0),
  
  -- Priority and difficulty
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  
  -- Categorization
  category TEXT NOT NULL,
  target_frequency INTEGER NOT NULL CHECK (target_frequency BETWEEN 1 AND 7),
  
  -- Preferences
  preferred_time_of_day TEXT CHECK (preferred_time_of_day IN ('morning', 'afternoon', 'evening', 'night')),
  color TEXT DEFAULT '#6366f1',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_priority ON public.habits(priority);
CREATE INDEX IF NOT EXISTS idx_habits_is_active ON public.habits(is_active);

COMMENT ON TABLE public.habits IS 'User habits with atomic/big types, priority, and preferences';


-- ============================================================================
-- SCHEDULING TABLES
-- ============================================================================

-- TABLE: days (Reference table for days of week)
CREATE TABLE IF NOT EXISTS public.days (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (name IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'))
);

INSERT INTO public.days (id, name) VALUES
  (1, 'Mon'), (2, 'Tue'), (3, 'Wed'), (4, 'Thu'),
  (5, 'Fri'), (6, 'Sat'), (7, 'Sun')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.days IS 'Days of the week reference table';


-- TABLE: days_habits (Many-to-many: habits ↔ days)
CREATE TABLE IF NOT EXISTS public.days_habits (
  habit_id BIGINT NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  day_id INTEGER NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
  PRIMARY KEY (habit_id, day_id)
);

CREATE INDEX IF NOT EXISTS idx_days_habits_habit_id ON public.days_habits(habit_id);
CREATE INDEX IF NOT EXISTS idx_days_habits_day_id ON public.days_habits(day_id);

COMMENT ON TABLE public.days_habits IS 'Junction table linking habits to specific days of the week';


-- TABLE: times_of_day (Reference table for times of day)
CREATE TABLE IF NOT EXISTS public.times_of_day (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (name IN ('morning', 'noon', 'afternoon', 'night'))
);

INSERT INTO public.times_of_day (id, name) VALUES
  (1, 'morning'), (2, 'noon'), (3, 'afternoon'), (4, 'night')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.times_of_day IS 'Times of day reference table';


-- TABLE: times_of_day_habits (Many-to-many: habits ↔ times)
CREATE TABLE IF NOT EXISTS public.times_of_day_habits (
  habit_id BIGINT NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  time_of_day_id INTEGER NOT NULL REFERENCES public.times_of_day(id) ON DELETE CASCADE,
  PRIMARY KEY (habit_id, time_of_day_id)
);

CREATE INDEX IF NOT EXISTS idx_times_of_day_habits_habit_id ON public.times_of_day_habits(habit_id);
CREATE INDEX IF NOT EXISTS idx_times_of_day_habits_time_id ON public.times_of_day_habits(time_of_day_id);

COMMENT ON TABLE public.times_of_day_habits IS 'Junction table linking habits to times of day';


-- ============================================================================
-- COMPLETION TRACKING
-- ============================================================================

-- TABLE: habit_completions (Tracks individual completions)
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id BIGSERIAL PRIMARY KEY,
  habit_id BIGINT NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  
  -- Temporal tracking
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  completed_date DATE DEFAULT CURRENT_DATE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Mon, 6=Sun
  time_of_day_id INTEGER REFERENCES public.times_of_day(id),
  
  -- Completion metrics
  actual_duration INTEGER CHECK (actual_duration > 0),
  mood_before TEXT CHECK (mood_before IN ('poor', 'okay', 'good', 'great')),
  mood_after TEXT CHECK (mood_after IN ('poor', 'okay', 'good', 'great')),
  energy_level_before TEXT CHECK (energy_level_before IN ('low', 'medium', 'high')),
  energy_level_after TEXT CHECK (energy_level_after IN ('low', 'medium', 'high')),
  notes TEXT,
  
  -- Prevent duplicate completions for same habit/date/time
  UNIQUE(habit_id, completed_date, time_of_day_id)
);

CREATE INDEX IF NOT EXISTS idx_completions_habit ON public.habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_completions_date ON public.habit_completions(completed_date);
CREATE INDEX IF NOT EXISTS idx_completions_user ON public.habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_user_date ON public.habit_completions(user_id, completed_date);

COMMENT ON TABLE public.habit_completions IS 'Tracks individual habit completions with temporal and metric data';
COMMENT ON COLUMN public.habit_completions.day_of_week IS '0=Monday, 1=Tuesday, ..., 6=Sunday';


-- ============================================================================
-- CAPACITY MANAGEMENT
-- ============================================================================

-- TABLE: daily_capacity_preferences (User time budgets)
CREATE TABLE IF NOT EXISTS public.daily_capacity_preferences (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
  capacity_minutes INTEGER NOT NULL DEFAULT 120 CHECK (capacity_minutes >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_daily_capacity_user ON public.daily_capacity_preferences(user_id);

COMMENT ON TABLE public.daily_capacity_preferences IS 'User-defined daily time capacity for habit scheduling';
COMMENT ON COLUMN public.daily_capacity_preferences.capacity_minutes IS 'Available minutes per day for habits';


-- ============================================================================
-- LEGACY TABLES (Phase 1 & 2 - kept for compatibility)
-- ============================================================================

-- TABLE: habit_logs (Legacy completion tracking)
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id BIGSERIAL PRIMARY KEY,
  habit_id BIGINT NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  actual_duration INTEGER,
  
  mood_before TEXT CHECK (mood_before IN ('poor', 'okay', 'good', 'great')),
  mood_after TEXT CHECK (mood_after IN ('poor', 'okay', 'good', 'great')),
  
  energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')),
  time_of_day TEXT,
  notes TEXT,
  
  is_successful BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON public.habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_completed_at ON public.habit_logs(completed_at);

COMMENT ON TABLE public.habit_logs IS 'Legacy habit completion logs (use habit_completions for new data)';


-- TABLE: user_availability
CREATE TABLE IF NOT EXISTS public.user_availability (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  energy_level TEXT NOT NULL CHECK (energy_level IN ('low', 'medium', 'high'))
);

CREATE INDEX IF NOT EXISTS idx_user_availability_user_id ON public.user_availability(user_id);

COMMENT ON TABLE public.user_availability IS 'User availability schedule for ML recommendations';


-- TABLE: fixed_events
CREATE TABLE IF NOT EXISTS public.fixed_events (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  is_recurring BOOLEAN DEFAULT TRUE,
  recurrence_pattern TEXT,
  
  source TEXT DEFAULT 'manual',
  color TEXT DEFAULT '#94a3b8',
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fixed_events_user_id ON public.fixed_events(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_events_day_of_week ON public.fixed_events(day_of_week);

COMMENT ON TABLE public.fixed_events IS 'Fixed events like classes, meetings from imported timetables';


-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_habits_updated_at ON public.habits;
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fixed_events_updated_at ON public.fixed_events;
CREATE TRIGGER update_fixed_events_updated_at
  BEFORE UPDATE ON public.fixed_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_capacity_updated_at ON public.daily_capacity_preferences;
CREATE TRIGGER update_capacity_updated_at
  BEFORE UPDATE ON public.daily_capacity_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on capacity preferences
ALTER TABLE public.daily_capacity_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own capacity preferences" ON public.daily_capacity_preferences;
CREATE POLICY "Users can view their own capacity preferences"
  ON public.daily_capacity_preferences FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own capacity preferences" ON public.daily_capacity_preferences;
CREATE POLICY "Users can insert their own capacity preferences"
  ON public.daily_capacity_preferences FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own capacity preferences" ON public.daily_capacity_preferences;
CREATE POLICY "Users can update their own capacity preferences"
  ON public.daily_capacity_preferences FOR UPDATE
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete their own capacity preferences" ON public.daily_capacity_preferences;
CREATE POLICY "Users can delete their own capacity preferences"
  ON public.daily_capacity_preferences FOR DELETE
  USING (auth.uid()::text = user_id);


-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'habits', 'days', 'days_habits', 'times_of_day', 'times_of_day_habits',
    'habit_completions', 'daily_capacity_preferences',
    'habit_logs', 'user_availability', 'fixed_events'
  )
ORDER BY table_name;

-- Count records
SELECT 
  (SELECT COUNT(*) FROM public.habits) as habits,
  (SELECT COUNT(*) FROM public.days) as days,
  (SELECT COUNT(*) FROM public.times_of_day) as times_of_day,
  (SELECT COUNT(*) FROM public.habit_completions) as completions,
  (SELECT COUNT(*) FROM public.daily_capacity_preferences) as capacity_prefs;


-- ============================================================================
-- DONE! 🎉
-- Complete database schema created
-- All features: habits, scheduling, completions, capacity management
-- ============================================================================
