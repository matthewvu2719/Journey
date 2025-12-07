-- ============================================================================
-- PERSONAL HABIT COACH - COMPLETE DATABASE SCHEMA
-- Phase 1 & 2 - All Tables Combined
-- ============================================================================
-- Run this in Supabase SQL Editor: Your Project → SQL Editor → New Query
-- ============================================================================

-- ============================================================================
-- TABLE: habits (Enhanced with Phase 1 & 2 features)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.habits (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Phase 1: Habit types
  habit_type TEXT NOT NULL DEFAULT 'atomic' CHECK (habit_type IN ('atomic', 'big')),
  estimated_duration INTEGER CHECK (estimated_duration IS NULL OR estimated_duration > 0),
  
  -- Phase 1: Priority system
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category TEXT NOT NULL,
  target_frequency INTEGER NOT NULL CHECK (target_frequency BETWEEN 1 AND 7),
  
  -- Phase 1: Preferences
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
-- TABLE: habit_logs (Enhanced with Phase 2 features)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id BIGSERIAL PRIMARY KEY,
  habit_id BIGINT NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  
  -- Phase 2: Start/end tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  actual_duration INTEGER,
  
  -- Phase 2: Mood tracking (before and after)
  mood_before TEXT CHECK (mood_before IN ('poor', 'okay', 'good', 'great')),
  mood_after TEXT CHECK (mood_after IN ('poor', 'okay', 'good', 'great')),
  
  energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')),
  time_of_day TEXT,
  notes TEXT,
  
  -- Phase 2: Success tracking
  is_successful BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON public.habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_completed_at ON public.habit_logs(completed_at);
CREATE INDEX IF NOT EXISTS idx_habit_logs_started_at ON public.habit_logs(started_at);

COMMENT ON TABLE public.habit_logs IS 'Habit completion logs with start/end times and mood tracking';


-- ============================================================================
-- TABLE: user_availability
-- ============================================================================
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


-- ============================================================================
-- TABLE: fixed_events (Phase 2)
-- ============================================================================
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
-- TABLE: timetable_slots (Phase 2)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.timetable_slots (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  habit_id BIGINT REFERENCES public.habits(id) ON DELETE CASCADE,
  
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  is_flexible BOOLEAN DEFAULT TRUE,
  buffer_minutes INTEGER DEFAULT 15,
  priority_score FLOAT,
  
  is_completed BOOLEAN DEFAULT FALSE,
  completion_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timetable_slots_user_id ON public.timetable_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_habit_id ON public.timetable_slots(habit_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_day_of_week ON public.timetable_slots(day_of_week);

COMMENT ON TABLE public.timetable_slots IS 'Scheduled time slots for habits in weekly timetable';


-- ============================================================================
-- TABLE: schedule_conflicts (Phase 2)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.schedule_conflicts (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  conflict_type TEXT NOT NULL,
  description TEXT,
  
  slot_id_1 BIGINT REFERENCES public.timetable_slots(id) ON DELETE CASCADE,
  slot_id_2 BIGINT REFERENCES public.timetable_slots(id) ON DELETE CASCADE,
  
  resolution_status TEXT DEFAULT 'pending',
  resolution_action TEXT,
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_conflicts_user_id ON public.schedule_conflicts(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_conflicts_status ON public.schedule_conflicts(resolution_status);

COMMENT ON TABLE public.schedule_conflicts IS 'Detected scheduling conflicts and their resolutions';


-- ============================================================================
-- TABLE: duration_predictions (Phase 2 - ML)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.duration_predictions (
  id BIGSERIAL PRIMARY KEY,
  habit_id BIGINT NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  
  predicted_duration INTEGER NOT NULL,
  confidence_score FLOAT,
  
  time_of_day TEXT,
  day_of_week INTEGER,
  energy_level TEXT,
  
  actual_duration INTEGER,
  prediction_error INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_duration_predictions_habit_id ON public.duration_predictions(habit_id);

COMMENT ON TABLE public.duration_predictions IS 'ML predictions for habit durations with learning feedback';


-- ============================================================================
-- TABLE: timetable_versions (Phase 2)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.timetable_versions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  version_number INTEGER NOT NULL,
  generation_reason TEXT,
  
  total_habits INTEGER,
  total_slots INTEGER,
  conflicts_count INTEGER,
  
  timetable_data JSONB,
  
  is_active BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timetable_versions_user_id ON public.timetable_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_timetable_versions_is_active ON public.timetable_versions(is_active);

COMMENT ON TABLE public.timetable_versions IS 'Version history of generated timetables';


-- ============================================================================
-- VIEWS
-- ============================================================================

-- Combined weekly schedule view
CREATE OR REPLACE VIEW public.weekly_schedule_view AS
SELECT 
  ts.user_id,
  ts.day_of_week,
  ts.start_time,
  ts.end_time,
  h.name as habit_name,
  h.category,
  h.priority,
  h.color,
  ts.is_completed,
  'habit' as event_type
FROM public.timetable_slots ts
JOIN public.habits h ON ts.habit_id = h.id
WHERE h.is_active = TRUE

UNION ALL

SELECT 
  fe.user_id,
  fe.day_of_week,
  fe.start_time,
  fe.end_time,
  fe.title as habit_name,
  'fixed' as category,
  0 as priority,
  fe.color,
  FALSE as is_completed,
  'fixed_event' as event_type
FROM public.fixed_events fe
WHERE fe.is_active = TRUE

ORDER BY day_of_week, start_time;


-- Habit performance metrics
CREATE OR REPLACE VIEW public.habit_performance_view AS
SELECT 
  h.id as habit_id,
  h.user_id,
  h.name,
  h.habit_type,
  h.estimated_duration,
  COUNT(hl.id) as total_completions,
  AVG(hl.actual_duration) as avg_actual_duration,
  AVG(hl.actual_duration - h.estimated_duration) as avg_duration_diff,
  COUNT(CASE WHEN hl.is_successful THEN 1 END)::FLOAT / NULLIF(COUNT(hl.id), 0) as success_rate,
  MODE() WITHIN GROUP (ORDER BY hl.mood_after) as most_common_mood_after
FROM public.habits h
LEFT JOIN public.habit_logs hl ON h.id = hl.habit_id
WHERE h.is_active = TRUE
GROUP BY h.id, h.user_id, h.name, h.habit_type, h.estimated_duration;


-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Calculate slot duration
CREATE OR REPLACE FUNCTION calculate_slot_duration(start_t TIME, end_t TIME)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(EPOCH FROM (end_t - start_t)) / 60;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- Check if slots overlap
CREATE OR REPLACE FUNCTION slots_overlap(
  start1 TIME, end1 TIME,
  start2 TIME, end2 TIME
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (start1 < end2) AND (start2 < end1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fixed_events_updated_at
  BEFORE UPDATE ON public.fixed_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timetable_slots_updated_at
  BEFORE UPDATE ON public.timetable_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Demo habits
INSERT INTO public.habits (user_id, name, description, habit_type, estimated_duration, priority, difficulty, category, target_frequency, preferred_time_of_day, color)
VALUES 
  ('default_user', 'Morning Meditation', '10 minutes of mindfulness', 'big', 10, 8, 'easy', 'wellness', 7, 'morning', '#10b981'),
  ('default_user', 'Gym Workout', '1 hour strength training', 'big', 60, 9, 'hard', 'fitness', 4, 'morning', '#ef4444'),
  ('default_user', 'Read for 30min', 'Read personal development books', 'big', 30, 7, 'medium', 'learning', 5, 'evening', '#3b82f6'),
  ('default_user', 'Drink Water', 'Stay hydrated', 'atomic', NULL, 5, 'easy', 'health', 7, NULL, '#06b6d4'),
  ('default_user', 'Code Practice', 'Practice coding for 1 hour', 'big', 60, 8, 'medium', 'learning', 5, 'afternoon', '#8b5cf6')
ON CONFLICT DO NOTHING;

-- Demo fixed events
INSERT INTO public.fixed_events (user_id, title, day_of_week, start_time, end_time, source, color)
VALUES 
  ('default_user', 'Math Class', 1, '09:00', '10:30', 'manual', '#ef4444'),
  ('default_user', 'Physics Lab', 1, '14:00', '16:00', 'manual', '#3b82f6'),
  ('default_user', 'Chemistry', 2, '10:00', '11:30', 'manual', '#10b981'),
  ('default_user', 'Team Meeting', 4, '15:00', '16:00', 'manual', '#8b5cf6')
ON CONFLICT DO NOTHING;


-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'habits', 'habit_logs', 'user_availability',
    'fixed_events', 'timetable_slots', 'schedule_conflicts',
    'duration_predictions', 'timetable_versions'
  )
ORDER BY table_name;

-- Count records
SELECT 
  (SELECT COUNT(*) FROM public.habits) as habits,
  (SELECT COUNT(*) FROM public.habit_logs) as logs,
  (SELECT COUNT(*) FROM public.fixed_events) as fixed_events,
  (SELECT COUNT(*) FROM public.timetable_slots) as slots;


-- ============================================================================
-- DONE! 🎉
-- All tables for Phase 1 & 2 are now created
-- ============================================================================
