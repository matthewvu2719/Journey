"""
Personal Habit Coach - FastAPI Backend (Phase 1 & 2 Enhanced)
"""
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from datetime import datetime, date, time
import os
import uuid

from models import (
    Habit, HabitCreate, HabitUpdate,
    CompletionCreate, Completion, CompleteHabitRequest,
    UserAvailability, UserAvailabilityCreate,
    ChatMessage, ChatResponse, AnalyticsResponse,
    DailyCapacity, DailyCapacityCreate, DailyCapacityUpdate, DailyCapacityBulkUpdate, DayOfWeek
)
from database import SupabaseClient
from ml_engine import MLEngine
from intelligent_chatbot import intelligent_chatbot
from timetable_engine import TimetableEngine
from auth import (
    auth_service, get_current_user, get_user_id, get_user_id_optional,
    SignUpRequest, SignInRequest, GuestLoginRequest, AuthResponse, UserInfo
)

# Initialize FastAPI
app = FastAPI(
    title="Personal Habit Coach API - Phase 1 & 2",
    description="AI-powered habit tracking with timetable generation",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", os.getenv("FRONTEND_URL", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
db = SupabaseClient()
ml_engine = MLEngine()
# intelligent_chatbot is imported as a singleton from intelligent_chatbot.py
timetable_engine = TimetableEngine()


@app.get("/")
async def root():
    return {
        "message": "Personal Habit Coach API - Phase 1 & 2",
        "version": "2.0.0",
        "features": [
            "Authentication (Supabase + Guest mode)",
            "Enhanced habits (atomic/big, priority)",
            "Timetable generation",
            "Real-time tracking",
            "Conflict detection"
        ],
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "auth_enabled": auth_service.supabase_enabled,
        "database_mode": "supabase" if not db.mock_mode else "mock"
    }


# ============================================================================
# AUTHENTICATION ENDPOINTS (Phase 1)
# ============================================================================

@app.post("/api/auth/signup", response_model=AuthResponse)
async def signup(request: SignUpRequest):
    """Sign up new user with Supabase Auth"""
    try:
        result = auth_service.sign_up(request.email, request.password, request.name)
        return AuthResponse(
            user_id=result["user_id"],
            email=result["email"],
            access_token=result["access_token"],
            refresh_token=result.get("refresh_token"),
            user_type="authenticated"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/signin", response_model=AuthResponse)
async def signin(request: SignInRequest):
    """Sign in user with Supabase Auth"""
    try:
        result = auth_service.sign_in(request.email, request.password)
        return AuthResponse(
            user_id=result["user_id"],
            email=result["email"],
            access_token=result["access_token"],
            refresh_token=result.get("refresh_token"),
            user_type="authenticated"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")


@app.post("/api/auth/guest", response_model=AuthResponse)
async def guest_login(request: GuestLoginRequest):
    """Create guest session"""
    guest_id = request.device_id or f"guest_{uuid.uuid4().hex[:12]}"
    token = auth_service.create_guest_token(guest_id)
    
    return AuthResponse(
        user_id=guest_id,
        email=None,
        access_token=token,
        refresh_token=None,
        user_type="guest"
    )


@app.post("/api/auth/signout")
async def signout(user_id: str = Depends(get_user_id)):
    """Sign out current user"""
    # For guest mode, just return success (token discarded client-side)
    # For Supabase, call sign_out
    return {"message": "Signed out successfully"}


@app.get("/api/auth/me", response_model=UserInfo)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return UserInfo(
        user_id=current_user["user_id"],
        email=current_user.get("email"),
        user_type=current_user.get("type", "guest")
    )


# ============================================================================
# HABITS ENDPOINTS
# ============================================================================

@app.post("/api/habits", response_model=Habit)
async def create_habit(habit: HabitCreate, user_id: str = Depends(get_user_id_optional)):
    """Create a new habit (Phase 1 Enhanced)"""
    try:
        habit_data = habit.dict()
        # Use authenticated user_id or default to "default_user" for backward compatibility
        habit_data["user_id"] = user_id if user_id else "default_user"
        result = db.create_habit(habit_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/habits", response_model=List[Habit])
async def get_habits(user_id: str = Depends(get_user_id_optional)):
    """Get all habits for current user"""
    try:
        # Use authenticated user_id or default to "default_user" for backward compatibility
        query_user_id = user_id if user_id else "default_user"
        habits = db.get_habits(query_user_id)
        return habits
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/habits/{habit_id}", response_model=Habit)
async def get_habit(habit_id: int, user_id: str = Depends(get_user_id_optional)):
    """Get a specific habit"""
    try:
        habit = db.get_habit(habit_id)
        if not habit:
            raise HTTPException(status_code=404, detail="Habit not found")
        # Verify ownership
        if habit.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        return habit
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/habits/{habit_id}", response_model=Habit)
async def update_habit(
    habit_id: int,
    habit: HabitUpdate,
    user_id: str = Depends(get_user_id_optional)
):
    """Update a habit (Phase 1 Enhanced)"""
    try:
        # Verify ownership
        existing = db.get_habit(habit_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Habit not found")
        if existing.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Update only provided fields
        update_data = {k: v for k, v in habit.dict().items() if v is not None}
        result = db.update_habit(habit_id, update_data)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/habits/{habit_id}")
async def delete_habit(habit_id: int, user_id: str = Depends(get_user_id_optional)):
    """Delete a habit"""
    try:
        # Verify ownership
        existing = db.get_habit(habit_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Habit not found")
        if existing.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        success = db.delete_habit(habit_id)
        return {"message": "Habit deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HABIT COMPLETION ENDPOINT
# ============================================================================
# COMPLETION ENDPOINTS
# ============================================================================

@app.post("/api/completions", response_model=Completion)
async def create_completion(completion: CompletionCreate, user_id: str = Depends(get_user_id_optional)):
    """Create a habit completion record"""
    try:
        # Use authenticated user_id or default
        completion_data = completion.dict()
        completion_data['user_id'] = user_id if user_id else completion_data.get('user_id', 'default_user')
        
        result = db.create_completion(completion_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/completions", response_model=List[Completion])
async def get_completions(
    user_id: str = Depends(get_user_id_optional),
    habit_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get habit completions with optional filters"""
    try:
        query_user_id = user_id if user_id else "default_user"
        completions = db.get_completions(
            user_id=query_user_id,
            habit_id=habit_id,
            start_date=start_date,
            end_date=end_date
        )
        return completions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/completions/{completion_id}", response_model=Completion)
async def get_completion(completion_id: int):
    """Get a specific completion"""
    try:
        completion = db.get_completion(completion_id)
        if not completion:
            raise HTTPException(status_code=404, detail="Completion not found")
        return completion
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/completions/{completion_id}")
async def delete_completion(completion_id: int):
    """Delete a completion"""
    try:
        success = db.delete_completion(completion_id)
        if not success:
            raise HTTPException(status_code=404, detail="Completion not found")
        return {"message": "Completion deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Legacy endpoint for backward compatibility
@app.post("/api/habits/{habit_id}/complete", response_model=Completion)
async def complete_habit_legacy(
    habit_id: int,
    completion: CompleteHabitRequest,
    user_id: str = Depends(get_user_id_optional)
):
    """Legacy endpoint - creates a completion record"""
    try:
        completion_data = {
            "habit_id": habit_id,
            "user_id": user_id if user_id else "default_user",
            "mood_before": completion.mood_before,
            "mood_after": completion.mood_after,
            "energy_level_before": completion.energy_level_before,
            "energy_level_after": completion.energy_level_after,
            "actual_duration": completion.actual_duration,
            "notes": completion.notes
        }
        result = db.create_completion(completion_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# AVAILABILITY ENDPOINTS
# ============================================================================

@app.post("/api/availability", response_model=UserAvailability)
async def create_availability(availability: UserAvailabilityCreate):
    """Set user availability for a time slot"""
    try:
        result = db.create_availability(availability.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/availability", response_model=List[UserAvailability])
async def get_availability(user_id: str = "default_user"):
    """Get user's availability schedule"""
    try:
        availability = db.get_availability(user_id)
        return availability
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ML/AI ENDPOINTS
# ============================================================================

@app.get("/api/recommendations")
async def get_recommendations(user_id: str = "default_user"):
    """Get ML-powered habit schedule recommendations"""
    try:
        # Get user data
        habits = db.get_habits(user_id)
        logs = db.get_logs()
        availability = db.get_availability(user_id)
        
        # Generate recommendations
        recommendations = ml_engine.generate_recommendations(
            habits, logs, availability
        )
        
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics", response_model=AnalyticsResponse)
async def get_analytics(user_id: str = "default_user"):
    """Get ML-powered analytics and insights"""
    try:
        habits = db.get_habits(user_id)
        logs = db.get_logs()
        
        analytics = ml_engine.analyze_patterns(habits, logs)
        
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_coach(message: ChatMessage):
    """Chat with AI habit coach (intelligent version with intent recognition)"""
    try:
        # Get context
        habits = db.get_habits(message.user_id)
        logs = db.get_logs()
        schedule = db.get_schedule(message.user_id)
        
        # Build user context
        user_context = {
            'habits': habits,
            'logs': logs,
            'schedule': schedule,
            'user_id': message.user_id
        }
        
        # Process message with intelligent chatbot
        result = intelligent_chatbot.process_message(
            message.message,
            user_context
        )
        
        # Return response with optional action data
        return ChatResponse(
            response=result['response'],
            timestamp=datetime.now(),
            action=result.get('action'),
            action_data=result.get('action_data')
        )
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn


# ============================================================================
# DAILY CAPACITY PREFERENCES ENDPOINTS
# ============================================================================

@app.get("/api/capacity", response_model=Dict[str, int])
async def get_daily_capacities(user_id: str = Depends(get_user_id_optional)):
    """
    Get user's daily capacity preferences
    Returns dict mapping day name to capacity in minutes
    """
    try:
        query_user_id = user_id if user_id else "default_user"
        capacities = db.get_daily_capacities(query_user_id)
        return capacities
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/capacity/{day_of_week}")
async def set_daily_capacity(
    day_of_week: DayOfWeek,
    capacity: DailyCapacityUpdate,
    user_id: str = Depends(get_user_id_optional)
):
    """Set capacity for a specific day"""
    try:
        query_user_id = user_id if user_id else "default_user"
        result = db.set_daily_capacity(
            query_user_id, 
            day_of_week.value, 
            capacity.capacity_minutes
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/capacity")
async def set_all_daily_capacities(
    bulk_update: DailyCapacityBulkUpdate,
    user_id: str = Depends(get_user_id_optional)
):
    """Set capacities for all days at once"""
    try:
        query_user_id = user_id if user_id else "default_user"
        
        # Convert DayOfWeek enum keys to strings
        capacities_dict = {day.value: minutes for day, minutes in bulk_update.capacities.items()}
        
        results = db.set_all_daily_capacities(query_user_id, capacities_dict)
        return {"message": "Capacities updated", "updated": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/capacity/{day_of_week}")
async def delete_daily_capacity(
    day_of_week: DayOfWeek,
    user_id: str = Depends(get_user_id_optional)
):
    """Delete a daily capacity preference (reverts to default)"""
    try:
        query_user_id = user_id if user_id else "default_user"
        success = db.delete_daily_capacity(query_user_id, day_of_week.value)
        
        if success:
            return {"message": f"Capacity for {day_of_week.value} reset to default"}
        else:
            raise HTTPException(status_code=404, detail="Capacity preference not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ACHIEVEMENT ENDPOINTS
# ============================================================================

from achievement_engine import AchievementEngine
from models import AchievementProgress, AchievementUnlock

@app.post("/api/achievements/check", response_model=List[AchievementUnlock])
async def check_achievements(
    completion_date: Optional[str] = None,
    user_id: str = Depends(get_user_id)
):
    """
    Check for newly unlocked achievements after completing a habit
    
    Returns list of unlocked achievements with rewards
    """
    try:
        # Get database session (you'll need to adapt this to your Supabase setup)
        # For now, we'll create a simple wrapper
        achievement_engine = AchievementEngine(db)
        unlocked = achievement_engine.check_achievements(user_id, completion_date)
        return unlocked
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check achievements: {str(e)}")


@app.get("/api/achievements/progress", response_model=AchievementProgress)
async def get_achievement_progress(user_id: str = Depends(get_user_id)):
    """
    Get user's current achievement progress
    
    Returns progress for daily, weekly, and monthly achievements
    """
    try:
        achievement_engine = AchievementEngine(db)
        progress = achievement_engine.get_user_progress(user_id)
        return AchievementProgress(user_id=user_id, **progress)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get progress: {str(e)}")


@app.get("/api/achievements/rewards")
async def get_available_rewards(user_id: str = Depends(get_user_id)):
    """
    Get all available rewards that can be unlocked
    
    Returns libraries of dances, emotions, hats, costumes, and themes
    """
    try:
        return {
            'dances': AchievementEngine.DANCES,
            'emotions': AchievementEngine.EMOTIONS,
            'hats': AchievementEngine.HATS,
            'costumes': AchievementEngine.COSTUMES,
            'themes': AchievementEngine.THEMES,
            'motivational_sentences': AchievementEngine.MOTIVATIONAL_SENTENCES
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get rewards: {str(e)}")
