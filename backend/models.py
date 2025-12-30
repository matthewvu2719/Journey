"""
Pydantic models for API validation - Simplified to match database schema
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


# ============================================================================
# ENUMS
# ============================================================================

class EnergyLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class MoodLevel(str, Enum):
    poor = "poor"
    okay = "okay"
    good = "good"
    great = "great"


class TimeOfDay(str, Enum):
    morning = "morning"
    noon = "noon"
    afternoon = "afternoon"
    night = "night"


# ============================================================================
# UNIFIED HABIT MODEL
# ============================================================================

class HabitBase(BaseModel):
    """Base model for habit definition - what the habit IS"""
    # User identification
    user_id: str = "default_user"
    
    # Core habit fields
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    habit_type: Optional[str] = Field("atomic", description="atomic or big")
    category: str = Field(..., max_length=50)
    priority: int = Field(5, ge=1, le=10, description="Priority 1-10")
    difficulty: Optional[str] = Field("medium", description="easy, medium, or hard")
    estimated_duration: Optional[int] = Field(None, ge=1, description="Duration in minutes")
    notes: Optional[str] = None
    
    # Scheduling (many-to-many relationships)
    days: Optional[List[str]] = Field(None, description="List of days: Mon, Tue, Wed, Thu, Fri, Sat, Sun")
    times_of_day: Optional[List[str]] = Field(None, description="List of times: morning, noon, afternoon, night")


class HabitCreate(BaseModel):
    """Create habit request - matches database schema"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    habit_type: Optional[str] = Field("atomic", description="atomic or big")
    category: str = Field(..., max_length=50)
    priority: int = Field(5, ge=1, le=10, description="Priority 1-10")
    estimated_duration: Optional[int] = Field(None, ge=1, description="Duration in minutes")
    difficulty: Optional[str] = Field("medium", description="easy, medium, or hard")
    days: Optional[List[str]] = Field(None, description="List of days: Mon, Tue, Wed, Thu, Fri, Sat, Sun")
    times_of_day: Optional[List[str]] = Field(None, description="List of times: morning, noon, afternoon, night")
    user_id: str = "default_user"


class HabitUpdate(BaseModel):
    """Update habit request"""
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[int] = Field(None, ge=1, le=10)
    estimated_duration: Optional[int] = None
    notes: Optional[str] = None
    days: Optional[List[str]] = None
    times_of_day: Optional[List[str]] = None
    is_active: Optional[bool] = None


class Habit(HabitBase):
    """Habit response model - inherits all fields from HabitBase plus database fields"""
    id: int
    is_active: bool = True
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# COMPLETION MODELS
# ============================================================================

class CompletionCreate(BaseModel):
    """Create a habit completion - tracks what was done"""
    habit_id: int
    completed_date: Optional[date] = None  # Defaults to today
    time_of_day_id: Optional[int] = Field(None, ge=1, le=4, description="1=morning, 2=noon, 3=afternoon, 4=night")
    actual_duration: Optional[int] = Field(None, ge=1, description="Actual duration in minutes")
    mood_before: Optional[MoodLevel] = None
    mood_after: Optional[MoodLevel] = None
    energy_level_before: Optional[EnergyLevel] = None
    energy_level_after: Optional[EnergyLevel] = None
    notes: Optional[str] = None
    user_id: str = "default_user"


class Completion(BaseModel):
    """Completion response model"""
    id: int
    habit_id: int
    user_id: str
    completed_at: datetime
    completed_date: date
    day_of_week: Optional[int] = None
    time_of_day_id: Optional[int] = None
    actual_duration: Optional[int] = None
    mood_before: Optional[MoodLevel] = None
    mood_after: Optional[MoodLevel] = None
    energy_level_before: Optional[EnergyLevel] = None
    energy_level_after: Optional[EnergyLevel] = None
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True


# Legacy model for backward compatibility
class CompleteHabitRequest(BaseModel):
    """Legacy request model - maps to CompletionCreate"""
    habit_id: int
    mood_before: Optional[MoodLevel] = None
    mood_after: Optional[MoodLevel] = None
    energy_level_before: Optional[EnergyLevel] = None
    energy_level_after: Optional[EnergyLevel] = None
    actual_duration: Optional[int] = Field(None, ge=1, description="Actual duration in minutes")
    notes: Optional[str] = None


# ============================================================================
# ANALYTICS & ML MODELS
# ============================================================================

class AnalyticsResponse(BaseModel):
    total_habits: int
    total_completions: int
    average_completion_rate: float
    best_time_of_day: str
    best_energy_level: str
    success_by_difficulty: dict
    completion_trend: List[dict]
    recommendations: List[str]

    
class ChatMessage(BaseModel):
    message: str
    user_id: str = "default_user"
    timezone_offset: Optional[int] = None  # Timezone offset in minutes from UTC


class ChatResponse(BaseModel):
    response: str
    timestamp: datetime
    action: Optional[str] = None
    action_data: Optional[Dict] = None


# ============================================================================
# AVAILABILITY MODELS
# ============================================================================

class UserAvailabilityBase(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    start_time: str
    end_time: str
    energy_level: EnergyLevel


class UserAvailabilityCreate(UserAvailabilityBase):
    user_id: str = "default_user"


class UserAvailability(UserAvailabilityBase):
    id: int
    user_id: str
    
    class Config:
        from_attributes = True


# ============================================================================
# DAILY CAPACITY PREFERENCES
# ============================================================================

class DayOfWeek(str, Enum):
    """Day of week enum"""
    Mon = "Mon"
    Tue = "Tue"
    Wed = "Wed"
    Thu = "Thu"
    Fri = "Fri"
    Sat = "Sat"
    Sun = "Sun"


class DailyCapacityBase(BaseModel):
    """Base model for daily capacity preferences"""
    day_of_week: DayOfWeek
    capacity_minutes: int = Field(120, ge=0, le=1440, description="Available minutes per day (0-1440)")


class DailyCapacityCreate(DailyCapacityBase):
    """Create daily capacity preference"""
    user_id: str = "default_user"


class DailyCapacityUpdate(BaseModel):
    """Update daily capacity preference"""
    capacity_minutes: int = Field(..., ge=0, le=1440)


class DailyCapacity(DailyCapacityBase):
    """Daily capacity response model"""
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DailyCapacityBulkUpdate(BaseModel):
    """Bulk update all days at once"""
    capacities: Dict[DayOfWeek, int] = Field(
        ..., 
        description="Dictionary mapping day to capacity in minutes"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "capacities": {
                    "Mon": 120,
                    "Tue": 120,
                    "Wed": 120,
                    "Thu": 120,
                    "Fri": 120,
                    "Sat": 180,
                    "Sun": 180
                }
            }
        }


# ============================================================================
# JOURNEY OBSTACLE SYSTEM MODELS
# ============================================================================

class ObstacleType(str, Enum):
    """Journey-themed obstacle types that map to friction types"""
    distraction_detour = "distraction_detour"  # Maps to distraction
    energy_drain_valley = "energy_drain_valley"  # Maps to low-energy
    maze_mountain = "maze_mountain"  # Maps to complexity
    memory_fog = "memory_fog"  # Maps to forgetfulness


class ObstacleEncounter(BaseModel):
    """Track when users encounter obstacles on their journey"""
    id: Optional[int] = None
    user_id: str
    habit_id: int
    obstacle_type: ObstacleType
    friction_session_id: Optional[int] = None  # Link to friction session
    
    # Journey context
    journey_stage: str = Field("beginning", description="beginning, middle, advanced")
    previous_success_streak: int = Field(0, ge=0, description="Days of success before obstacle")
    
    # Obstacle details
    severity: str = Field("medium", description="low, medium, high")
    user_description: Optional[str] = None
    bobo_response: Optional[str] = None
    
    # Resolution tracking
    was_overcome: Optional[bool] = None
    solution_used: Optional[str] = None
    time_to_resolve: Optional[int] = None  # Minutes
    
    # Timestamps
    encountered_at: datetime = Field(default_factory=datetime.now)
    resolved_at: Optional[datetime] = None


class ObstacleStats(BaseModel):
    """User's obstacle statistics for journey progress tracking"""
    id: Optional[int] = None
    user_id: str
    
    # Overall obstacle stats
    total_obstacles_encountered: int = Field(0, ge=0)
    total_obstacles_overcome: int = Field(0, ge=0)
    current_success_streak: int = Field(0, ge=0)
    longest_success_streak: int = Field(0, ge=0)
    
    # Obstacle type breakdown
    distraction_detours_overcome: int = Field(0, ge=0)
    energy_valleys_overcome: int = Field(0, ge=0)
    maze_mountains_overcome: int = Field(0, ge=0)
    memory_fogs_overcome: int = Field(0, ge=0)
    
    # Journey progress
    journey_level: int = Field(1, ge=1, le=100, description="User's journey mastery level")
    journey_experience: int = Field(0, ge=0, description="Experience points earned")
    
    # Achievement tracking
    obstacle_badges_earned: List[str] = Field(default_factory=list)
    journey_milestones_reached: List[str] = Field(default_factory=list)
    
    # Timestamps
    last_updated: datetime = Field(default_factory=datetime.now)


class JourneyAchievement(BaseModel):
    """Journey-specific achievements for obstacle mastery"""
    id: Optional[int] = None
    user_id: str
    achievement_type: str  # 'obstacle_master', 'journey_warrior', 'persistence_champion'
    achievement_name: str
    achievement_description: str
    
    # Achievement criteria
    obstacle_type: Optional[ObstacleType] = None
    required_count: int = Field(1, ge=1)
    current_progress: int = Field(0, ge=0)
    
    # Rewards
    reward_type: str  # 'badge', 'title', 'bobo_message', 'special_animation'
    reward_data: Dict[str, Any] = Field(default_factory=dict)
    
    # Status
    is_unlocked: bool = Field(False)
    unlocked_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)


# ============================================================================
# FRICTION HELPER MODELS
# ============================================================================

class FrictionType(str, Enum):
    distraction = "distraction"
    low_energy = "low-energy"
    complexity = "complexity"
    forgetfulness = "forgetfulness"


class FrictionHelpRequest(BaseModel):
    """Request for friction help"""
    friction_type: FrictionType
    additional_context: Optional[str] = None


class FrictionSolution(BaseModel):
    """Individual friction solution"""
    title: str
    description: str
    action_type: str  # 'pomodoro', 'reschedule', 'breakdown', 'environment', 'reduce'
    action_data: Optional[Dict[str, Any]] = None
    confidence_score: float = Field(..., ge=0.0, le=1.0)


class FrictionHelpResponse(BaseModel):
    """Response with AI-generated friction solutions"""
    friction_type: FrictionType
    habit_name: str
    bobo_message: str
    solutions: List[FrictionSolution]
    recommended_actions: List[str]
    user_context: Dict[str, Any]
    generated_at: datetime = Field(default_factory=datetime.now)


class FrictionSession(BaseModel):
    """Track friction help sessions for analytics"""
    id: Optional[int] = None
    user_id: str
    habit_id: int
    friction_type: FrictionType
    solutions_provided: List[Dict[str, Any]]
    action_taken: Optional[str] = None
    was_helpful: Optional[bool] = None
    created_at: datetime = Field(default_factory=datetime.now)


# ============================================================================
# DAILY SUCCESS RATE MODELS
# ============================================================================

class DailySuccessRateBase(BaseModel):
    """Base model for daily success rate statistics"""
    user_id: str
    date: date
    total_habit_instances: int = Field(0, ge=0, description="Total number of habit instances for the day")
    completed_instances: int = Field(0, ge=0, description="Number of completed habit instances")
    success_rate: float = Field(0.0, ge=0.0, le=100.0, description="Success rate percentage (0-100)")
    time_remaining: Optional[int] = Field(None, ge=0, description="Remaining time in minutes")


class DailySuccessRateCreate(DailySuccessRateBase):
    """Create daily success rate record"""
    pass


class DailySuccessRateUpdate(BaseModel):
    """Update daily success rate record"""
    total_habit_instances: Optional[int] = Field(None, ge=0)
    completed_instances: Optional[int] = Field(None, ge=0)
    success_rate: Optional[float] = Field(None, ge=0.0, le=100.0)
    time_remaining: Optional[int] = Field(None, ge=0)


class DailySuccessRate(DailySuccessRateBase):
    """Daily success rate response model with database fields"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
    
    def calculate_success_rate(self) -> float:
        """Calculate success rate percentage from instances"""
        if self.total_habit_instances == 0:
            return 0.0
        return (self.completed_instances / self.total_habit_instances) * 100.0
    
    def is_perfect_day(self) -> bool:
        """Check if all habits were completed (100% success rate)"""
        return self.total_habit_instances > 0 and self.completed_instances == self.total_habit_instances
    
    def to_stats_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format matching existing stats API"""
        return {
            'habits_today': self.total_habit_instances,
            'completed_today': self.completed_instances,
            'success_rate_today': self.success_rate,
            'time_remaining': self.time_remaining or 0
        }
    
    @classmethod
    def from_calculation(cls, user_id: str, date: date, calculated_stats: Dict[str, Any]) -> 'DailySuccessRate':
        """Create DailySuccessRate instance from calculated statistics"""
        return cls(
            id=0,  # Will be set by database
            user_id=user_id,
            date=date,
            total_habit_instances=calculated_stats.get('habits_today', 0),
            completed_instances=calculated_stats.get('completed_today', 0),
            success_rate=calculated_stats.get('success_rate_today', 0.0),
            time_remaining=calculated_stats.get('time_remaining', 0),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )


# ============================================================================
# ACHIEVEMENT MODELS
# ============================================================================

class UnlockedReward(BaseModel):
    """Model for tracking unlocked rewards"""
    id: Optional[int] = None
    user_id: str
    reward_type: str  # motivational_sentence, dance, hat_costume, theme
    reward_data: Dict  # JSON data about the reward
    unlocked_at: datetime = Field(default_factory=datetime.now)
    achievement_type: str  # any_completion, daily_perfect, weekly_perfect, monthly_perfect


class AchievementProgress(BaseModel):
    """Model for achievement progress tracking"""
    user_id: str
    daily_progress: Dict
    weekly_progress: Dict
    monthly_progress: Dict
    total_completions: int


class AchievementUnlock(BaseModel):
    """Model for achievement unlock notification"""
    achievement_type: str
    achievement_name: str
    reward_type: str
    reward: Dict
    message: str

