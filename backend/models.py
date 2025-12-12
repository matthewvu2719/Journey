"""
Pydantic models for API validation - Simplified to match database schema
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
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

