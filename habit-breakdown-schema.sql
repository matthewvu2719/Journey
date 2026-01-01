-- Habit Breakdown System Database Schema
-- Add columns to support habit breakdown functionality

-- Add breakdown-related columns to habits table
ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS parent_habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_subtask BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS breakdown_order INTEGER,
ADD COLUMN IF NOT EXISTS breakdown_session_id TEXT;

-- Create index for better performance on breakdown queries
CREATE INDEX IF NOT EXISTS idx_habits_parent_habit_id ON habits(parent_habit_id);
CREATE INDEX IF NOT EXISTS idx_habits_is_subtask ON habits(is_subtask);
CREATE INDEX IF NOT EXISTS idx_habits_breakdown_session_id ON habits(breakdown_session_id);

-- Create habit_breakdowns table to track breakdown sessions
CREATE TABLE IF NOT EXISTS habit_breakdowns (
    id SERIAL PRIMARY KEY,
    breakdown_session_id TEXT UNIQUE NOT NULL,
    original_habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    subtask_ids INTEGER[] NOT NULL,
    user_id TEXT NOT NULL,
    preserve_original BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rolled_back_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create indexes for habit_breakdowns table
CREATE INDEX IF NOT EXISTS idx_habit_breakdowns_session_id ON habit_breakdowns(breakdown_session_id);
CREATE INDEX IF NOT EXISTS idx_habit_breakdowns_original_habit_id ON habit_breakdowns(original_habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_breakdowns_user_id ON habit_breakdowns(user_id);

-- Add comments for documentation
COMMENT ON COLUMN habits.parent_habit_id IS 'ID of the parent habit if this is a subtask';
COMMENT ON COLUMN habits.is_subtask IS 'Whether this habit is a subtask of another habit';
COMMENT ON COLUMN habits.breakdown_order IS 'Order of this subtask within the breakdown (1, 2, 3, etc.)';
COMMENT ON COLUMN habits.breakdown_session_id IS 'Session ID linking all subtasks from the same breakdown';

COMMENT ON TABLE habit_breakdowns IS 'Tracks habit breakdown sessions for rollback functionality';
COMMENT ON COLUMN habit_breakdowns.breakdown_session_id IS 'Unique identifier for the breakdown session';
COMMENT ON COLUMN habit_breakdowns.original_habit_id IS 'ID of the original habit that was broken down';
COMMENT ON COLUMN habit_breakdowns.subtask_ids IS 'Array of IDs of the created subtasks';
COMMENT ON COLUMN habit_breakdowns.preserve_original IS 'Whether the original habit was kept active';
COMMENT ON COLUMN habit_breakdowns.rolled_back_at IS 'Timestamp when the breakdown was rolled back (NULL if not rolled back)';

-- Create a view for easy querying of habits with their breakdown status
CREATE OR REPLACE VIEW habits_with_breakdown_info AS
SELECT 
    h.*,
    CASE 
        WHEN h.parent_habit_id IS NOT NULL THEN 'subtask'
        WHEN EXISTS (SELECT 1 FROM habits WHERE parent_habit_id = h.id) THEN 'parent'
        ELSE 'standalone'
    END as breakdown_status,
    (SELECT COUNT(*) FROM habits WHERE parent_habit_id = h.id AND is_subtask = true) as subtask_count,
    ph.name as parent_habit_name
FROM habits h
LEFT JOIN habits ph ON h.parent_habit_id = ph.id;

COMMENT ON VIEW habits_with_breakdown_info IS 'Enhanced view of habits with breakdown relationship information';

-- Function to get all subtasks for a habit in order
CREATE OR REPLACE FUNCTION get_habit_subtasks(habit_id_param INTEGER)
RETURNS TABLE (
    id INTEGER,
    name TEXT,
    description TEXT,
    breakdown_order INTEGER,
    estimated_duration INTEGER,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.name,
        h.description,
        h.breakdown_order,
        h.estimated_duration,
        h.is_active,
        h.created_at
    FROM habits h
    WHERE h.parent_habit_id = habit_id_param 
      AND h.is_subtask = true
    ORDER BY h.breakdown_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to rollback a habit breakdown
CREATE OR REPLACE FUNCTION rollback_habit_breakdown(session_id_param TEXT, restore_original_param BOOLEAN DEFAULT TRUE)
RETURNS BOOLEAN AS $$
DECLARE
    breakdown_record RECORD;
    subtask_id INTEGER;
BEGIN
    -- Get the breakdown record
    SELECT * INTO breakdown_record 
    FROM habit_breakdowns 
    WHERE breakdown_session_id = session_id_param 
      AND rolled_back_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Delete all subtasks
    FOREACH subtask_id IN ARRAY breakdown_record.subtask_ids
    LOOP
        DELETE FROM habits WHERE id = subtask_id;
    END LOOP;
    
    -- Restore original habit if requested
    IF restore_original_param THEN
        UPDATE habits 
        SET is_active = TRUE 
        WHERE id = breakdown_record.original_habit_id;
    END IF;
    
    -- Mark breakdown as rolled back
    UPDATE habit_breakdowns 
    SET rolled_back_at = NOW() 
    WHERE breakdown_session_id = session_id_param;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a habit can be broken down
CREATE OR REPLACE FUNCTION can_breakdown_habit(habit_id_param INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    habit_record RECORD;
BEGIN
    SELECT * INTO habit_record FROM habits WHERE id = habit_id_param;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Cannot break down a subtask
    IF habit_record.is_subtask THEN
        RETURN FALSE;
    END IF;
    
    -- Cannot break down if already has subtasks
    IF EXISTS (SELECT 1 FROM habits WHERE parent_habit_id = habit_id_param AND is_subtask = true) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add some sample data for testing (optional)
-- INSERT INTO habits (user_id, name, description, category, priority, estimated_duration, days, times_of_day) 
-- VALUES ('test_user', 'Morning Exercise', 'Daily workout routine', 'Health', 8, 45, ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], ARRAY['morning'])
-- ON CONFLICT DO NOTHING;