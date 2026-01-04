-- ============================================================================
-- FIX BREAKDOWN FUNCTIONS - Run this in Supabase SQL Editor
-- ============================================================================
-- This script drops the old problematic functions and creates clean new ones
-- that work with the two-table architecture (habit_breakdowns + habit_breakdown_subtasks)

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- STEP 1: DROP OLD FUNCTIONS (they cause PGRST204 errors)
-- ============================================================================

-- Drop old create_habit_breakdown (all overloads)
DROP FUNCTION IF EXISTS create_habit_breakdown(BIGINT, TEXT, TEXT[], BOOLEAN);
DROP FUNCTION IF EXISTS create_habit_breakdown(p_original_habit_id BIGINT, p_user_id TEXT, p_subtask_names TEXT[], p_preserve_original BOOLEAN);

-- Drop old helper functions that use the wrong table
DROP FUNCTION IF EXISTS create_subtasks_for_breakdown(INTEGER, TEXT, TEXT[]);
DROP FUNCTION IF EXISTS create_subtasks_for_breakdown(habit_id_param INTEGER, breakdown_session_id_param TEXT, subtask_names TEXT[]);
DROP FUNCTION IF EXISTS delete_subtasks_for_breakdown(TEXT);
DROP FUNCTION IF EXISTS delete_subtasks_for_breakdown(breakdown_session_id_param TEXT);

-- Drop old get functions
DROP FUNCTION IF EXISTS get_habit_subtasks(BIGINT);
DROP FUNCTION IF EXISTS get_breakdown_subtasks(TEXT);
DROP FUNCTION IF EXISTS get_breakdown_subtasks(UUID);
DROP FUNCTION IF EXISTS rollback_breakdown(TEXT);
DROP FUNCTION IF EXISTS rollback_breakdown(UUID);

-- ============================================================================
-- STEP 2: ENSURE TABLES HAVE CORRECT STRUCTURE
-- ============================================================================

-- Remove subtask_ids column from habit_breakdowns if it exists (this causes the error!)
ALTER TABLE public.habit_breakdowns DROP COLUMN IF EXISTS subtask_ids;

-- Ensure breakdown_session_id has a default UUID
ALTER TABLE public.habit_breakdowns 
ALTER COLUMN breakdown_session_id SET DEFAULT gen_random_uuid();

-- ============================================================================
-- STEP 3: CREATE NEW CLEAN FUNCTIONS
-- ============================================================================

-- Function to get subtasks for a breakdown session (by UUID)
CREATE OR REPLACE FUNCTION get_breakdown_subtasks(p_session_id UUID)
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    description TEXT,
    breakdown_order INT,
    estimated_duration INT,
    is_completed BOOLEAN,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.description,
        s.breakdown_order,
        s.estimated_duration,
        s.is_completed,
        s.completed_at,
        s.created_at
    FROM public.habit_breakdown_subtasks s
    WHERE s.breakdown_session_id = p_session_id
    ORDER BY s.breakdown_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get subtasks for a habit (by original_habit_id)
CREATE OR REPLACE FUNCTION get_habit_subtasks(p_habit_id BIGINT)
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    description TEXT,
    breakdown_order INT,
    estimated_duration INT,
    is_completed BOOLEAN,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    breakdown_session_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.description,
        s.breakdown_order,
        s.estimated_duration,
        s.is_completed,
        s.completed_at,
        s.created_at,
        s.breakdown_session_id
    FROM public.habit_breakdown_subtasks s
    JOIN public.habit_breakdowns b ON s.breakdown_session_id = b.breakdown_session_id
    WHERE b.original_habit_id = p_habit_id 
      AND b.rolled_back_at IS NULL  -- Only active breakdowns
    ORDER BY s.breakdown_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to rollback a breakdown
CREATE OR REPLACE FUNCTION rollback_breakdown(p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_original_habit_id BIGINT;
BEGIN
    -- Get original habit ID
    SELECT original_habit_id INTO v_original_habit_id
    FROM public.habit_breakdowns
    WHERE breakdown_session_id = p_session_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Mark breakdown as rolled back
    UPDATE public.habit_breakdowns 
    SET rolled_back_at = NOW()
    WHERE breakdown_session_id = p_session_id;
    
    -- Restore original habit
    UPDATE public.habits 
    SET 
        is_active = TRUE,
        active_breakdown_session_id = NULL
    WHERE id = v_original_habit_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: ADD COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_breakdown_subtasks(UUID) IS 'Get subtasks for a specific breakdown session by UUID';
COMMENT ON FUNCTION get_habit_subtasks(BIGINT) IS 'Get all active subtasks for a habit (joins through breakdown sessions)';
COMMENT ON FUNCTION rollback_breakdown(UUID) IS 'Mark a breakdown as rolled back and restore the original habit';

-- ============================================================================
-- VERIFICATION QUERIES (run these to check the fix worked)
-- ============================================================================

-- Check that habit_breakdowns doesn't have subtask_ids column
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'habit_breakdowns' AND table_schema = 'public';

-- Check that functions exist
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' AND routine_name LIKE '%breakdown%';

-- ============================================================================
-- DONE! The Python code in database.py now handles breakdown creation
-- directly via table inserts (not RPC), which avoids the PGRST204 error.
-- ============================================================================