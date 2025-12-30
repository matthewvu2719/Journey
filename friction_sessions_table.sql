-- Friction Sessions Table for AI-Powered Friction Helper System
-- This table tracks when users request help with habit obstacles

CREATE TABLE IF NOT EXISTS friction_sessions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    habit_id INTEGER NOT NULL,
    friction_type TEXT NOT NULL CHECK (friction_type IN ('distraction', 'low-energy', 'complexity', 'forgetfulness')),
    solutions_provided JSONB NOT NULL DEFAULT '[]',
    action_taken TEXT,
    was_helpful BOOLEAN,
    additional_context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints (if habits table exists)
    CONSTRAINT fk_friction_habit 
        FOREIGN KEY (habit_id) 
        REFERENCES habits(id) 
        ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_friction_sessions_user_id ON friction_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_friction_sessions_habit_id ON friction_sessions(habit_id);
CREATE INDEX IF NOT EXISTS idx_friction_sessions_friction_type ON friction_sessions(friction_type);
CREATE INDEX IF NOT EXISTS idx_friction_sessions_created_at ON friction_sessions(created_at);

-- RLS (Row Level Security) policies if using Supabase
-- ALTER TABLE friction_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own friction sessions
-- CREATE POLICY "Users can view own friction sessions" ON friction_sessions
--     FOR SELECT USING (auth.uid()::text = user_id);

-- CREATE POLICY "Users can insert own friction sessions" ON friction_sessions
--     FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- CREATE POLICY "Users can update own friction sessions" ON friction_sessions
--     FOR UPDATE USING (auth.uid()::text = user_id);

-- Comments for documentation
COMMENT ON TABLE friction_sessions IS 'Tracks AI-powered friction helper sessions for habit obstacles';
COMMENT ON COLUMN friction_sessions.friction_type IS 'Type of obstacle: distraction, low-energy, complexity, forgetfulness';
COMMENT ON COLUMN friction_sessions.solutions_provided IS 'JSON array of AI-generated solutions offered to user';
COMMENT ON COLUMN friction_sessions.action_taken IS 'What action the user took based on suggestions';
COMMENT ON COLUMN friction_sessions.was_helpful IS 'User feedback on whether the help was useful';