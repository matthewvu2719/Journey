-- Habit Breakdown System - Two Table Architecture (IMPROVED VERSION)
-- This approach separates breakdown sessions from individual subtasks
-- Solves the PGRST204 "missing column" issues and provides clean data structure
-- 
-- IMPROVEMENTS APPLIED:
-- ✅ UUID session IDs instead of epoch+random (collision-safe)
-- ✅ Proper UUID extension enabled
-- ✅ Normalized design (removed redundant columns from subtasks)
-- ✅ Better transaction safety in functions
-- ✅ Optimized indexes

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- TABLE 1: habit_breakdowns (one row per breakdown session - metadata)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.habit_breakdowns (
    id BIGSERIAL PRIMARY KEY,
    breakdown_session_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    original_habit_id BIGINT NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    preserve_original BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    rolled_back_at TIMESTAMPTZ
);

-- Indexes for habit_breakdowns
CREATE INDEX IF NOT EXISTS habit_breakdowns_original_habit_idx 
ON public.habit_breakdowns(original_habit_id);

CREATE INDEX IF NOT EXISTS habit_breakdowns_session_id_idx 
ON public.habit_breakdowns(breakdown_session_id);

CREATE INDEX IF NOT EXISTS habit_breakdowns_user_id_idx 
ON public.habit_breakdowns(user_id);

-- ============================================================================
-- TABLE 2: habit_breakdown_subtasks (one row per subtask) - NORMALIZED
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.habit_breakdown_subtasks (
    id BIGSERIAL PRIMARY KEY,
    breakdown_session_id UUID NOT NULL REFERENCES public.habit_breakdowns(breakdown_session_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    breakdown_order INT NOT NULL,
    estimated_duration INT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT breakdown_order_unique UNIQUE (breakdown_session_id, breakdown_order)
);

-- Indexes for habit_breakdown_subtasks (optimized)
CREATE INDEX IF NOT EXISTS breakdown_subtasks_session_idx 
ON public.habit_breakdown_subtasks(breakdown_session_id);

-- Note: breakdown_order_unique constraint already creates an index on (breakdown_session_id, breakdown_order)
-- so we don't need a separate breakdown_subtasks_order_idx

-- ============================================================================
-- OPTIONAL: Add active_breakdown_session_id to habits table for quick lookup
-- ============================================================================
ALTER TABLE public.habits 
ADD COLUMN IF NOT EXISTS active_breakdown_session_id UUID REFERENCES public.habit_breakdowns(breakdown_session_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS habits_active_breakdown_idx 
ON public.habits(active_breakdown_session_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to create a complete breakdown (session + subtasks) - IMPROVED
CREATE OR REPLACE FUNCTION create_habit_breakdown(
    p_original_habit_id BIGINT,
    p_user_id TEXT,
    p_subtask_names TEXT[],
    p_preserve_original BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    breakdown_session_id UUID,
    subtask_ids BIGINT[]
) AS $$
DECLARE
    v_session_id UUID;
    v_subtask_id BIGINT;
    v_subtask_ids BIGINT[] := '{}';
    v_subtask_name TEXT;
    v_order INT := 1;
BEGIN
    -- Validate input
    IF array_length(p_subtask_names, 1) IS NULL THEN
        RAISE EXCEPTION 'Subtasks cannot be empty';
    END IF;
    
    -- Generate UUID session ID (collision-safe)
    v_session_id := gen_random_uuid();
    
    -- Create breakdown session
    INSERT INTO public.habit_breakdowns (
        breakdown_session_id,
        original_habit_id,
        user_id,
        preserve_original
    ) VALUES (
        v_session_id,
        p_original_habit_id,
        p_user_id,
        p_preserve_original
    );
    
    -- Create subtasks (normalized - no redundant columns)
    FOREACH v_subtask_name IN ARRAY p_subtask_names
    LOOP
        INSERT INTO public.habit_breakdown_subtasks (
            breakdown_session_id,
            name,
            description,
            breakdown_order,
            estimated_duration
        ) VALUES (
            v_session_id,
            v_subtask_name,
            'Subtask ' || v_order || ' of breakdown',
            v_order,
            15  -- Default 15 minutes per subtask
        ) RETURNING id INTO v_subtask_id;
        
        v_subtask_ids := array_append(v_subtask_ids, v_subtask_id);
        v_order := v_order + 1;
    END LOOP;
    
    -- Update original habit with active breakdown session (optional)
    IF NOT p_preserve_original THEN
        UPDATE public.habits 
        SET 
            is_active = FALSE,
            active_breakdown_session_id = v_session_id
        WHERE id = p_original_habit_id;
    ELSE
        UPDATE public.habits 
        SET active_breakdown_session_id = v_session_id
        WHERE id = p_original_habit_id;
    END IF;
    
    -- Return results
    RETURN QUERY SELECT v_session_id, v_subtask_ids;
END;
$$ LANGUAGE plpgsql;

-- Function to get subtasks for a breakdown session - UPDATED
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

-- Function to get subtasks for a habit (by original_habit_id) - UPDATED
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

-- Function to rollback a breakdown - UPDATED
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
    
    -- Optionally delete subtasks (or leave them for history)
    -- DELETE FROM public.habit_breakdown_subtasks WHERE breakdown_session_id = p_session_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE public.habit_breakdowns IS 'Breakdown sessions metadata - one row per breakdown';
COMMENT ON TABLE public.habit_breakdown_subtasks IS 'Individual subtasks - one row per subtask (normalized)';

COMMENT ON COLUMN public.habit_breakdowns.breakdown_session_id IS 'UUID identifier for the breakdown session (collision-safe)';
COMMENT ON COLUMN public.habit_breakdowns.original_habit_id IS 'The habit that was broken down';
COMMENT ON COLUMN public.habit_breakdowns.preserve_original IS 'Whether original habit stays active';
COMMENT ON COLUMN public.habit_breakdowns.rolled_back_at IS 'When breakdown was rolled back (NULL = active)';

COMMENT ON COLUMN public.habit_breakdown_subtasks.breakdown_session_id IS 'Links to breakdown session (normalized design)';
COMMENT ON COLUMN public.habit_breakdown_subtasks.breakdown_order IS 'Order within breakdown (1, 2, 3...)';
COMMENT ON COLUMN public.habit_breakdown_subtasks.is_completed IS 'Whether subtask is completed';

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- If migrating from the old schema:
-- 1. Backup existing data
-- 2. Create new tables with UUID columns
-- 3. Migrate data: UPDATE breakdown_session_id = gen_random_uuid()::text
-- 4. Update application code to handle UUID instead of TEXT
-- 5. Remove redundant columns (original_habit_id, user_id) from subtasks table