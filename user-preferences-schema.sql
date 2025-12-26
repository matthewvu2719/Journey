-- User Preferences Table for Timezone Management
-- Add this to your Supabase database

CREATE TABLE IF NOT EXISTS user_preferences (
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
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Add RLS (Row Level Security) if using Supabase Auth
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to manage their own preferences
CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (auth.uid()::text = user_id);

-- Insert some example preferences (optional)
INSERT INTO user_preferences (user_id, timezone, date_format, time_format, week_start) 
VALUES 
    ('default_user', 'America/New_York', 'YYYY-MM-DD', '24h', 'monday'),
    ('guest_1764871751353_lugns9dz6', 'America/New_York', 'YYYY-MM-DD', '24h', 'monday')
ON CONFLICT (user_id) DO NOTHING;