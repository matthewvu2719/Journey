-- ============================================================================
-- ADD USER PREFERENCES TABLE FOR TIMEZONE MANAGEMENT
-- Run this in Supabase SQL Editor to add the missing table
-- ============================================================================

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    date_format TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
    time_format TEXT NOT NULL DEFAULT '24h',
    week_start TEXT NOT NULL DEFAULT 'monday',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one preference record per user
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Add RLS (Row Level Security) if using Supabase Auth
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to manage their own preferences
-- Note: This policy works for authenticated users. For guest users, you may need to adjust.
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid()::text = user_id);

-- Insert default preferences for existing users
INSERT INTO public.user_preferences (user_id, timezone, date_format, time_format, week_start) 
VALUES 
    ('default_user', 'America/New_York', 'YYYY-MM-DD', '24h', 'monday'),
    ('guest_1764871751353_lugns9dz6', 'America/New_York', 'YYYY-MM-DD', '24h', 'monday')
ON CONFLICT (user_id) DO NOTHING;

-- Verify the table was created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check the data
SELECT * FROM public.user_preferences;

-- ============================================================================
-- DONE! The user_preferences table is now ready for timezone management
-- ============================================================================