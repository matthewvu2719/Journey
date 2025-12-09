-- Voice Call System Database Schema
-- Supports both WebRTC (free) and Twilio (paid) calls

-- ========================================================================
-- CALL PREFERENCES
-- ========================================================================
CREATE TABLE IF NOT EXISTS call_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    call_method VARCHAR(20) DEFAULT 'webrtc' CHECK (call_method IN ('webrtc', 'twilio')),
    phone_number VARCHAR(20), -- Required for Twilio
    allow_calls BOOLEAN DEFAULT true,
    preferred_times JSONB, -- [{"day": "monday", "time": "09:00"}, ...]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_call_preferences_user ON call_preferences(user_id);

-- ========================================================================
-- SCHEDULED CALLS
-- ========================================================================
CREATE TABLE IF NOT EXISTS scheduled_calls (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    call_method VARCHAR(20) NOT NULL CHECK (call_method IN ('webrtc', 'twilio')),
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    call_purpose TEXT DEFAULT 'check_in', -- 'habit_reminder', 'check_in', 'motivation'
    phone_number VARCHAR(20), -- For Twilio calls
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'notification_sent', 'in_progress', 'completed', 'failed', 'cancelled')),
    notification_sent BOOLEAN DEFAULT false,
    call_sid VARCHAR(100), -- Twilio call SID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scheduled_calls_user ON scheduled_calls(user_id);
CREATE INDEX idx_scheduled_calls_time ON scheduled_calls(scheduled_time);
CREATE INDEX idx_scheduled_calls_status ON scheduled_calls(status);

-- ========================================================================
-- CALL LOGS
-- ========================================================================
CREATE TABLE IF NOT EXISTS call_logs (
    id SERIAL PRIMARY KEY,
    scheduled_call_id INTEGER REFERENCES scheduled_calls(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    call_method VARCHAR(20) NOT NULL CHECK (call_method IN ('webrtc', 'twilio')),
    call_sid VARCHAR(100), -- Twilio call SID (null for WebRTC)
    session_id VARCHAR(100), -- WebRTC session ID (null for Twilio)
    duration_seconds INTEGER,
    transcript JSONB, -- [{"timestamp": "...", "speaker": "bobo|user", "text": "..."}]
    bobo_responses JSONB, -- AI responses during call
    call_outcome VARCHAR(50) CHECK (call_outcome IN ('completed', 'no_answer', 'busy', 'failed', 'user_ended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_call_logs_user ON call_logs(user_id);
CREATE INDEX idx_call_logs_scheduled ON call_logs(scheduled_call_id);
CREATE INDEX idx_call_logs_created ON call_logs(created_at DESC);

-- ========================================================================
-- FUNCTIONS & TRIGGERS
-- ========================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_call_preferences_updated_at
    BEFORE UPDATE ON call_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_calls_updated_at
    BEFORE UPDATE ON scheduled_calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================================================
-- SAMPLE DATA (for testing)
-- ========================================================================

-- Example: User prefers WebRTC calls
-- INSERT INTO call_preferences (user_id, call_method, allow_calls, preferred_times)
-- VALUES (
--     'user-uuid-here',
--     'webrtc',
--     true,
--     '[{"day": "monday", "time": "09:00"}, {"day": "wednesday", "time": "09:00"}, {"day": "friday", "time": "09:00"}]'
-- );

-- Example: User prefers phone calls
-- INSERT INTO call_preferences (user_id, call_method, phone_number, allow_calls, preferred_times)
-- VALUES (
--     'user-uuid-here',
--     'twilio',
--     '+1234567890',
--     true,
--     '[{"day": "monday", "time": "08:00"}]'
-- );
