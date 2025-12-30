-- Journey Obstacle System Database Schema
-- Task 2.4: Journey Obstacle System

-- ============================================================================
-- OBSTACLE ENCOUNTERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS obstacle_encounters (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    habit_id INTEGER NOT NULL,
    obstacle_type TEXT NOT NULL CHECK (obstacle_type IN ('distraction_detour', 'energy_drain_valley', 'maze_mountain', 'memory_fog')),
    friction_session_id INTEGER REFERENCES friction_sessions(id),
    
    -- Journey context
    journey_stage TEXT DEFAULT 'beginning' CHECK (journey_stage IN ('beginning', 'middle', 'advanced')),
    previous_success_streak INTEGER DEFAULT 0 CHECK (previous_success_streak >= 0),
    
    -- Obstacle details
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    user_description TEXT,
    bobo_response TEXT,
    
    -- Resolution tracking
    was_overcome BOOLEAN,
    solution_used TEXT,
    time_to_resolve INTEGER CHECK (time_to_resolve > 0), -- Minutes
    
    -- Timestamps
    encountered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for performance
    CONSTRAINT fk_obstacle_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_obstacle_habit FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

-- Indexes for obstacle encounters
CREATE INDEX IF NOT EXISTS idx_obstacle_encounters_user_id ON obstacle_encounters(user_id);
CREATE INDEX IF NOT EXISTS idx_obstacle_encounters_habit_id ON obstacle_encounters(habit_id);
CREATE INDEX IF NOT EXISTS idx_obstacle_encounters_type ON obstacle_encounters(obstacle_type);
CREATE INDEX IF NOT EXISTS idx_obstacle_encounters_encountered_at ON obstacle_encounters(encountered_at DESC);
CREATE INDEX IF NOT EXISTS idx_obstacle_encounters_resolved ON obstacle_encounters(was_overcome) WHERE was_overcome IS NOT NULL;

-- ============================================================================
-- OBSTACLE STATISTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS obstacle_stats (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    
    -- Overall obstacle stats
    total_obstacles_encountered INTEGER DEFAULT 0 CHECK (total_obstacles_encountered >= 0),
    total_obstacles_overcome INTEGER DEFAULT 0 CHECK (total_obstacles_overcome >= 0),
    current_success_streak INTEGER DEFAULT 0 CHECK (current_success_streak >= 0),
    longest_success_streak INTEGER DEFAULT 0 CHECK (longest_success_streak >= 0),
    
    -- Obstacle type breakdown
    distraction_detours_overcome INTEGER DEFAULT 0 CHECK (distraction_detours_overcome >= 0),
    energy_valleys_overcome INTEGER DEFAULT 0 CHECK (energy_valleys_overcome >= 0),
    maze_mountains_overcome INTEGER DEFAULT 0 CHECK (maze_mountains_overcome >= 0),
    memory_fogs_overcome INTEGER DEFAULT 0 CHECK (memory_fogs_overcome >= 0),
    
    -- Journey progress
    journey_level INTEGER DEFAULT 1 CHECK (journey_level >= 1 AND journey_level <= 100),
    journey_experience INTEGER DEFAULT 0 CHECK (journey_experience >= 0),
    
    -- Achievement tracking
    obstacle_badges_earned TEXT[] DEFAULT '{}',
    journey_milestones_reached TEXT[] DEFAULT '{}',
    
    -- Timestamps
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_obstacle_stats_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT chk_overcome_total CHECK (total_obstacles_overcome <= total_obstacles_encountered),
    CONSTRAINT chk_longest_streak CHECK (longest_success_streak >= current_success_streak)
);

-- Index for obstacle stats
CREATE INDEX IF NOT EXISTS idx_obstacle_stats_user_id ON obstacle_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_obstacle_stats_level ON obstacle_stats(journey_level);

-- ============================================================================
-- JOURNEY ACHIEVEMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS journey_achievements (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_type TEXT NOT NULL CHECK (achievement_type IN (
        'obstacle_navigator', 'distraction_master', 'energy_warrior', 
        'maze_solver', 'memory_keeper', 'journey_champion', 'persistence_legend'
    )),
    achievement_name TEXT NOT NULL,
    achievement_description TEXT NOT NULL,
    
    -- Achievement criteria
    obstacle_type TEXT CHECK (obstacle_type IN ('distraction_detour', 'energy_drain_valley', 'maze_mountain', 'memory_fog')),
    required_count INTEGER DEFAULT 1 CHECK (required_count > 0),
    current_progress INTEGER DEFAULT 0 CHECK (current_progress >= 0),
    
    -- Rewards
    reward_type TEXT NOT NULL CHECK (reward_type IN (
        'journey_badge', 'special_hat', 'special_costume', 'special_color', 
        'special_dance', 'champion_theme', 'legend_title'
    )),
    reward_data JSONB DEFAULT '{}',
    
    -- Status
    is_unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_journey_achievements_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT chk_progress_count CHECK (current_progress <= required_count),
    CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_type)
);

-- Indexes for journey achievements
CREATE INDEX IF NOT EXISTS idx_journey_achievements_user_id ON journey_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_achievements_type ON journey_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_journey_achievements_unlocked ON journey_achievements(is_unlocked, unlocked_at);

-- ============================================================================
-- JOURNEY REWARDS TABLE (for storing unlocked rewards)
-- ============================================================================

CREATE TABLE IF NOT EXISTS journey_rewards (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    reward_type TEXT NOT NULL CHECK (reward_type IN (
        'badge', 'hat', 'costume', 'color', 'dance', 'theme', 'title'
    )),
    reward_data JSONB NOT NULL,
    achievement_type TEXT NOT NULL,
    
    -- Timestamps
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_journey_rewards_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for journey rewards
CREATE INDEX IF NOT EXISTS idx_journey_rewards_user_id ON journey_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_rewards_type ON journey_rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_journey_rewards_unlocked_at ON journey_rewards(unlocked_at DESC);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to automatically update obstacle stats when encounters are resolved
CREATE OR REPLACE FUNCTION update_obstacle_stats_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when was_overcome is set (obstacle resolved)
    IF NEW.was_overcome IS NOT NULL AND OLD.was_overcome IS NULL THEN
        -- Update obstacle stats
        INSERT INTO obstacle_stats (user_id, total_obstacles_encountered, total_obstacles_overcome)
        VALUES (NEW.user_id, 1, CASE WHEN NEW.was_overcome THEN 1 ELSE 0 END)
        ON CONFLICT (user_id) DO UPDATE SET
            total_obstacles_encountered = obstacle_stats.total_obstacles_encountered + 1,
            total_obstacles_overcome = obstacle_stats.total_obstacles_overcome + 
                CASE WHEN NEW.was_overcome THEN 1 ELSE 0 END,
            current_success_streak = CASE 
                WHEN NEW.was_overcome THEN obstacle_stats.current_success_streak + 1
                ELSE 0
            END,
            longest_success_streak = GREATEST(
                obstacle_stats.longest_success_streak,
                CASE WHEN NEW.was_overcome THEN obstacle_stats.current_success_streak + 1 ELSE 0 END
            ),
            -- Update obstacle-specific counters
            distraction_detours_overcome = obstacle_stats.distraction_detours_overcome + 
                CASE WHEN NEW.obstacle_type = 'distraction_detour' AND NEW.was_overcome THEN 1 ELSE 0 END,
            energy_valleys_overcome = obstacle_stats.energy_valleys_overcome + 
                CASE WHEN NEW.obstacle_type = 'energy_drain_valley' AND NEW.was_overcome THEN 1 ELSE 0 END,
            maze_mountains_overcome = obstacle_stats.maze_mountains_overcome + 
                CASE WHEN NEW.obstacle_type = 'maze_mountain' AND NEW.was_overcome THEN 1 ELSE 0 END,
            memory_fogs_overcome = obstacle_stats.memory_fogs_overcome + 
                CASE WHEN NEW.obstacle_type = 'memory_fog' AND NEW.was_overcome THEN 1 ELSE 0 END,
            -- Update journey experience (10 XP per overcome obstacle)
            journey_experience = obstacle_stats.journey_experience + 
                CASE WHEN NEW.was_overcome THEN 10 ELSE 0 END,
            -- Update journey level (every 100 XP)
            journey_level = LEAST(100, ((obstacle_stats.journey_experience + 
                CASE WHEN NEW.was_overcome THEN 10 ELSE 0 END) / 100) + 1),
            last_updated = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic obstacle stats updates
DROP TRIGGER IF EXISTS trigger_update_obstacle_stats ON obstacle_encounters;
CREATE TRIGGER trigger_update_obstacle_stats
    AFTER UPDATE ON obstacle_encounters
    FOR EACH ROW
    EXECUTE FUNCTION update_obstacle_stats_trigger();

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- View for obstacle analytics
CREATE OR REPLACE VIEW obstacle_analytics AS
SELECT 
    oe.user_id,
    oe.obstacle_type,
    COUNT(*) as total_encounters,
    COUNT(*) FILTER (WHERE oe.was_overcome = true) as total_overcome,
    ROUND(
        COUNT(*) FILTER (WHERE oe.was_overcome = true)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as success_rate,
    AVG(oe.time_to_resolve) FILTER (WHERE oe.was_overcome = true) as avg_resolution_time,
    MIN(oe.encountered_at) as first_encounter,
    MAX(oe.encountered_at) as latest_encounter
FROM obstacle_encounters oe
GROUP BY oe.user_id, oe.obstacle_type;

-- View for journey progress
CREATE OR REPLACE VIEW journey_progress AS
SELECT 
    os.user_id,
    os.journey_level,
    os.journey_experience,
    os.total_obstacles_overcome,
    os.current_success_streak,
    os.longest_success_streak,
    ROUND(
        os.total_obstacles_overcome::numeric / 
        NULLIF(os.total_obstacles_encountered, 0) * 100, 2
    ) as overall_success_rate,
    COUNT(ja.id) FILTER (WHERE ja.is_unlocked = true) as achievements_unlocked,
    COUNT(jr.id) as rewards_earned
FROM obstacle_stats os
LEFT JOIN journey_achievements ja ON os.user_id = ja.user_id
LEFT JOIN journey_rewards jr ON os.user_id = jr.user_id
GROUP BY os.user_id, os.journey_level, os.journey_experience, 
         os.total_obstacles_overcome, os.current_success_streak, 
         os.longest_success_streak, os.total_obstacles_encountered;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert sample obstacle types documentation
INSERT INTO obstacle_encounters (user_id, habit_id, obstacle_type, severity, user_description, bobo_response, journey_stage, previous_success_streak, encountered_at)
VALUES 
    ('sample_user', 1, 'distraction_detour', 'medium', 'Got distracted by phone notifications', 'Watch out! There''s a distraction detour ahead! Let me help you find the right path back to your journey!', 'beginning', 0, NOW() - INTERVAL '1 day'),
    ('sample_user', 2, 'energy_drain_valley', 'high', 'Feeling too tired to exercise', 'We''ve entered Energy Drain Valley! Don''t worry, I know the secret paths to recharge your batteries!', 'beginning', 1, NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PERMISSIONS (if using RLS)
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE obstacle_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE obstacle_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_rewards ENABLE ROW LEVEL SECURITY;

-- Policies for obstacle_encounters
CREATE POLICY "Users can view their own obstacle encounters" ON obstacle_encounters
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own obstacle encounters" ON obstacle_encounters
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own obstacle encounters" ON obstacle_encounters
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policies for obstacle_stats
CREATE POLICY "Users can view their own obstacle stats" ON obstacle_stats
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own obstacle stats" ON obstacle_stats
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own obstacle stats" ON obstacle_stats
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policies for journey_achievements
CREATE POLICY "Users can view their own journey achievements" ON journey_achievements
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own journey achievements" ON journey_achievements
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own journey achievements" ON journey_achievements
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policies for journey_rewards
CREATE POLICY "Users can view their own journey rewards" ON journey_rewards
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own journey rewards" ON journey_rewards
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE obstacle_encounters IS 'Tracks when users encounter obstacles on their habit journey';
COMMENT ON TABLE obstacle_stats IS 'Aggregated statistics for user obstacle encounters and journey progress';
COMMENT ON TABLE journey_achievements IS 'Journey-specific achievements for obstacle mastery';
COMMENT ON TABLE journey_rewards IS 'Unlocked rewards from journey achievements';

COMMENT ON COLUMN obstacle_encounters.obstacle_type IS 'Journey-themed obstacle: distraction_detour, energy_drain_valley, maze_mountain, memory_fog';
COMMENT ON COLUMN obstacle_encounters.journey_stage IS 'User journey stage: beginning (levels 1-10), middle (11-50), advanced (51-100)';
COMMENT ON COLUMN obstacle_encounters.time_to_resolve IS 'Time taken to resolve obstacle in minutes';

COMMENT ON COLUMN obstacle_stats.journey_level IS 'User journey mastery level (1-100, increases every 100 XP)';
COMMENT ON COLUMN obstacle_stats.journey_experience IS 'Experience points earned from overcoming obstacles (10 XP per obstacle)';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 Journey Obstacle System schema created successfully!';
    RAISE NOTICE '📊 Tables: obstacle_encounters, obstacle_stats, journey_achievements, journey_rewards';
    RAISE NOTICE '🔧 Triggers: Automatic obstacle stats updates';
    RAISE NOTICE '📈 Views: obstacle_analytics, journey_progress';
    RAISE NOTICE '🔒 Security: Row Level Security policies enabled';
    RAISE NOTICE '🚀 Ready for Task 2.4 implementation!';
END $$;