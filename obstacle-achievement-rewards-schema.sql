-- Obstacle Achievement Rewards System Schema
-- Creates tier-based progression system for obstacle achievements

-- Table: obstacle_achievement_tiers
-- Tracks user progress through achievement tiers (1→2→3)
CREATE TABLE IF NOT EXISTS obstacle_achievement_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    current_tier INTEGER NOT NULL DEFAULT 1,
    current_goal INTEGER NOT NULL,
    is_redeemable BOOLEAN NOT NULL DEFAULT FALSE,
    times_redeemed INTEGER NOT NULL DEFAULT 0,
    last_redeemed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_id),
    CHECK (current_tier >= 1 AND current_tier <= 3),
    CHECK (times_redeemed >= 0),
    CHECK (current_goal > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_obstacle_tiers_user ON obstacle_achievement_tiers(user_id);
CREATE INDEX IF NOT EXISTS idx_obstacle_tiers_redeemable ON obstacle_achievement_tiers(user_id, is_redeemable);
CREATE INDEX IF NOT EXISTS idx_obstacle_tiers_achievement ON obstacle_achievement_tiers(achievement_id);

-- Achievement ID reference:
-- distraction_master: Overcome 5/50/500 Distraction Detours
-- energy_warrior: Overcome 5/50/500 Energy Valleys
-- maze_solver: Overcome 5/50/500 Maze Mountains
-- memory_keeper: Overcome 5/50/500 Memory Fogs
-- journey_champion: Overcome 25/250/2500 total obstacles
-- obstacle_navigator: Overcome 1 obstacle (one-time, no tiers)

-- Verify bobo_items table supports 'emoji' item_type
-- (Should already exist, just documenting expected structure)
-- bobo_items columns: id, user_id, item_type, item_id, unlocked_at
-- item_type values: 'hat', 'costume', 'color', 'dance', 'theme', 'emoji'

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_obstacle_tiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_obstacle_tiers_updated_at ON obstacle_achievement_tiers;
CREATE TRIGGER trigger_update_obstacle_tiers_updated_at
    BEFORE UPDATE ON obstacle_achievement_tiers
    FOR EACH ROW
    EXECUTE FUNCTION update_obstacle_tiers_updated_at();

-- RLS Policies
ALTER TABLE obstacle_achievement_tiers ENABLE ROW LEVEL SECURITY;

-- Users can view their own tier data
CREATE POLICY "Users can view own obstacle tiers"
    ON obstacle_achievement_tiers FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id LIKE 'guest_%');

-- Users can insert their own tier data
CREATE POLICY "Users can insert own obstacle tiers"
    ON obstacle_achievement_tiers FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id LIKE 'guest_%');

-- Users can update their own tier data
CREATE POLICY "Users can update own obstacle tiers"
    ON obstacle_achievement_tiers FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id LIKE 'guest_%');

-- Helper function to initialize achievement tiers for a user
CREATE OR REPLACE FUNCTION initialize_obstacle_achievement_tiers(p_user_id TEXT)
RETURNS void AS $$
BEGIN
    -- Distraction Master (Tier 1: 5)
    INSERT INTO obstacle_achievement_tiers (user_id, achievement_id, current_tier, current_goal)
    VALUES (p_user_id, 'distraction_master', 1, 5)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Energy Warrior (Tier 1: 5)
    INSERT INTO obstacle_achievement_tiers (user_id, achievement_id, current_tier, current_goal)
    VALUES (p_user_id, 'energy_warrior', 1, 5)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Maze Solver (Tier 1: 5)
    INSERT INTO obstacle_achievement_tiers (user_id, achievement_id, current_tier, current_goal)
    VALUES (p_user_id, 'maze_solver', 1, 5)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Memory Keeper (Tier 1: 5)
    INSERT INTO obstacle_achievement_tiers (user_id, achievement_id, current_tier, current_goal)
    VALUES (p_user_id, 'memory_keeper', 1, 5)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Journey Champion (Tier 1: 25)
    INSERT INTO obstacle_achievement_tiers (user_id, achievement_id, current_tier, current_goal)
    VALUES (p_user_id, 'journey_champion', 1, 25)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
    
    -- Obstacle Navigator (one-time: 1)
    INSERT INTO obstacle_achievement_tiers (user_id, achievement_id, current_tier, current_goal)
    VALUES (p_user_id, 'obstacle_navigator', 1, 1)
    ON CONFLICT (user_id, achievement_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE obstacle_achievement_tiers IS 'Tracks tier-based progression for obstacle achievements';
COMMENT ON COLUMN obstacle_achievement_tiers.current_tier IS 'Current tier level (1, 2, or 3)';
COMMENT ON COLUMN obstacle_achievement_tiers.current_goal IS 'Number of obstacles needed for current tier';
COMMENT ON COLUMN obstacle_achievement_tiers.is_redeemable IS 'True when user has reached current_goal and can redeem';
COMMENT ON COLUMN obstacle_achievement_tiers.times_redeemed IS 'Total number of times this achievement has been redeemed';
