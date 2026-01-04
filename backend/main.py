"""
Personal Habit Coach - FastAPI Backend (Phase 1 & 2 Enhanced)
"""
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from datetime import datetime, date, time, timedelta
import os
import uuid

from models import (
    Habit, HabitCreate, HabitUpdate,
    CompletionCreate, Completion, CompleteHabitRequest,
    UserAvailability, UserAvailabilityCreate,
    ChatMessage, ChatResponse, AnalyticsResponse,
    DailyCapacity, DailyCapacityCreate, DailyCapacityUpdate, DailyCapacityBulkUpdate, DayOfWeek,
    FrictionHelpRequest, FrictionHelpResponse, FrictionSession, FrictionType,
    HabitBreakdownRequest, HabitBreakdownResponse, HabitBreakdownRollback
)
from database import SupabaseClient
from ml_engine import MLEngine
from ml_trainer import get_ml_trainer
from ml_scheduler import get_ml_scheduler
from intelligent_chatbot import get_intelligent_chatbot
from timetable_engine import TimetableEngine
from auth import (
    auth_service, get_current_user, get_user_id, get_user_id_optional,
    SignUpRequest, SignInRequest, GuestLoginRequest, AuthResponse, UserInfo,
    UserPreferences, UserPreferencesUpdate
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
ml_trainer = get_ml_trainer(db)  # Initialize ML trainer with database
ml_scheduler = get_ml_scheduler(db)  # Initialize ML scheduler
intelligent_chatbot = get_intelligent_chatbot(db)  # Initialize chatbot with database
timetable_engine = TimetableEngine()


# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Start background tasks on app startup"""
    print("🚀 Starting ML Scheduler...")
    await ml_scheduler.start()


@app.on_event("shutdown")
async def shutdown_event():
    """Stop background tasks on app shutdown"""
    print("🛑 Stopping ML Scheduler...")
    await ml_scheduler.stop()


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

@app.get("/api/debug/timezone")
async def debug_timezone(timezone_offset: Optional[int] = None):
    """Debug endpoint to test timezone offset"""
    from datetime import datetime, timedelta
    
    utc_now = datetime.utcnow()
    server_now = datetime.now()
    
    result = {
        "received_offset": timezone_offset,
        "utc_time": utc_now.isoformat(),
        "server_time": server_now.isoformat(),
    }
    
    if timezone_offset is not None:
        calculated_local = utc_now + timedelta(minutes=timezone_offset)
        result["calculated_local_time"] = calculated_local.isoformat()
        result["calculated_date"] = calculated_local.date().isoformat()
        result["calculated_day"] = calculated_local.strftime('%a')
    
    return result


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
    # Get user preferences to include timezone
    try:
        preferences = db.get_user_preferences(current_user["user_id"])
        timezone = preferences.get("timezone")
    except:
        timezone = None
    
    return UserInfo(
        user_id=current_user["user_id"],
        email=current_user.get("email"),
        user_type=current_user.get("type", "guest"),
        timezone=timezone
    )


# ============================================================================
# USER PREFERENCES ENDPOINTS
# ============================================================================

@app.get("/api/preferences", response_model=UserPreferences)
async def get_user_preferences(user_id: str = Depends(get_user_id)):
    """Get user preferences including timezone"""
    try:
        preferences = db.get_user_preferences(user_id)
        return UserPreferences(**preferences)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/preferences", response_model=UserPreferences)
async def update_user_preferences(
    preferences: UserPreferencesUpdate,
    user_id: str = Depends(get_user_id)
):
    """Update user preferences"""
    try:
        # Only update provided fields
        update_data = {k: v for k, v in preferences.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No preferences provided to update")
        
        result = db.update_user_preferences(user_id, update_data)
        return UserPreferences(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/preferences/timezones")
async def get_available_timezones():
    """Get list of available timezones"""
    try:
        import pytz
        
        # Get common timezones organized by region
        common_timezones = {
            "North America": [
                {"value": "America/New_York", "label": "Eastern Time (UTC-5/-4)"},
                {"value": "America/Chicago", "label": "Central Time (UTC-6/-5)"},
                {"value": "America/Denver", "label": "Mountain Time (UTC-7/-6)"},
                {"value": "America/Los_Angeles", "label": "Pacific Time (UTC-8/-7)"},
                {"value": "America/Anchorage", "label": "Alaska Time (UTC-9/-8)"},
                {"value": "Pacific/Honolulu", "label": "Hawaii Time (UTC-10)"},
            ],
            "Europe": [
                {"value": "Europe/London", "label": "London (UTC+0/+1)"},
                {"value": "Europe/Paris", "label": "Paris (UTC+1/+2)"},
                {"value": "Europe/Berlin", "label": "Berlin (UTC+1/+2)"},
                {"value": "Europe/Rome", "label": "Rome (UTC+1/+2)"},
                {"value": "Europe/Madrid", "label": "Madrid (UTC+1/+2)"},
                {"value": "Europe/Moscow", "label": "Moscow (UTC+3)"},
            ],
            "Asia": [
                {"value": "Asia/Tokyo", "label": "Tokyo (UTC+9)"},
                {"value": "Asia/Shanghai", "label": "Shanghai (UTC+8)"},
                {"value": "Asia/Kolkata", "label": "India (UTC+5:30)"},
                {"value": "Asia/Dubai", "label": "Dubai (UTC+4)"},
                {"value": "Asia/Singapore", "label": "Singapore (UTC+8)"},
            ],
            "Australia": [
                {"value": "Australia/Sydney", "label": "Sydney (UTC+10/+11)"},
                {"value": "Australia/Melbourne", "label": "Melbourne (UTC+10/+11)"},
                {"value": "Australia/Perth", "label": "Perth (UTC+8)"},
            ],
            "Other": [
                {"value": "UTC", "label": "UTC (Coordinated Universal Time)"},
            ]
        }
        
        return {
            "timezones": common_timezones,
            "total_count": sum(len(zones) for zones in common_timezones.values())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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


@app.get("/api/habits/today")
async def get_habits_for_today(
    time_of_day: Optional[str] = None,
    timezone_offset: Optional[int] = None,
    user_id: str = Depends(get_user_id_optional)
):
    """Get habits scheduled for today, optionally filtered by time of day"""
    try:
        query_user_id = user_id if user_id else "default_user"
        habits = db.get_habits_for_today(query_user_id, time_of_day, timezone_offset)
        return habits
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/habits/today/count")
async def get_habits_count_for_today(
    time_of_day: Optional[str] = None,
    timezone_offset: Optional[int] = None,
    user_id: str = Depends(get_user_id_optional)
):
    """Get count of habits scheduled for today, optionally filtered by time of day"""
    try:
        query_user_id = user_id if user_id else "default_user"
        count = db.get_habits_count_for_today(query_user_id, time_of_day, timezone_offset)
        return {"count": count}
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
# HABIT BREAKDOWN ENDPOINTS
# ============================================================================

@app.post("/api/habits/{habit_id}/breakdown", response_model=HabitBreakdownResponse)
async def create_habit_breakdown(
    habit_id: int,
    request: HabitBreakdownRequest,
    user_id: str = Depends(get_user_id_optional)
):
    """Break down a habit into subtasks"""
    print(f"[DEBUG API] POST /api/habits/{habit_id}/breakdown called")
    print(f"[DEBUG API] Request: subtasks={request.subtasks}, preserve_original={request.preserve_original}")
    print(f"[DEBUG API] User ID: {user_id}")
    
    try:
        # Verify habit exists and user owns it
        existing = db.get_habit(habit_id)
        print(f"[DEBUG API] Existing habit: {existing}")
        
        if not existing:
            print(f"[DEBUG API] ERROR: Habit {habit_id} not found")
            raise HTTPException(status_code=404, detail="Habit not found")
        if existing.get("user_id") != user_id:
            print(f"[DEBUG API] ERROR: User {user_id} not authorized for habit owned by {existing.get('user_id')}")
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Check if habit is already a subtask
        if existing.get("is_subtask"):
            print(f"[DEBUG API] ERROR: Habit {habit_id} is already a subtask")
            raise HTTPException(status_code=400, detail="Cannot break down a subtask")
        
        # Create breakdown
        print(f"[DEBUG API] Calling db.create_habit_breakdown...")
        breakdown = db.create_habit_breakdown(
            habit_id=habit_id,
            subtasks=request.subtasks,
            user_id=user_id,
            preserve_original=request.preserve_original
        )
        
        print(f"[DEBUG API] Breakdown created successfully: {breakdown}")
        return breakdown
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DEBUG API] ERROR: Exception in create_habit_breakdown: {e}")
        print(f"[DEBUG API] Exception type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/habits/{habit_id}/subtasks")
async def get_habit_subtasks(
    habit_id: int,
    user_id: str = Depends(get_user_id_optional)
):
    """Get all subtasks for a habit"""
    try:
        # Verify habit exists and user owns it
        existing = db.get_habit(habit_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Habit not found")
        if existing.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        subtasks = db.get_habit_subtasks(habit_id)
        return {"habit_id": habit_id, "subtasks": subtasks}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/habits/{habit_id}/with-subtasks")
async def get_habit_with_subtasks(
    habit_id: int,
    user_id: str = Depends(get_user_id_optional)
):
    """Get a habit with its subtasks"""
    try:
        # Verify habit exists and user owns it
        existing = db.get_habit(habit_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Habit not found")
        if existing.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        habit_with_subtasks = db.get_habit_with_subtasks(habit_id)
        return habit_with_subtasks
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/breakdowns/{breakdown_session_id}")
async def get_habit_breakdown(
    breakdown_session_id: str,
    user_id: str = Depends(get_user_id_optional)
):
    """Get breakdown information by session ID"""
    try:
        breakdown = db.get_habit_breakdown(breakdown_session_id)
        if not breakdown:
            raise HTTPException(status_code=404, detail="Breakdown session not found")
        
        # Verify user owns the original habit
        original_habit = db.get_habit(breakdown["original_habit_id"])
        if not original_habit or original_habit.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        return breakdown
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/breakdowns/{breakdown_session_id}/rollback")
async def rollback_habit_breakdown(
    breakdown_session_id: str,
    request: HabitBreakdownRollback,
    user_id: str = Depends(get_user_id_optional)
):
    """Rollback a habit breakdown"""
    try:
        # Verify breakdown exists and user owns it
        breakdown = db.get_habit_breakdown(breakdown_session_id)
        if not breakdown:
            raise HTTPException(status_code=404, detail="Breakdown session not found")
        
        original_habit = db.get_habit(breakdown["original_habit_id"])
        if not original_habit or original_habit.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Perform rollback
        success = db.rollback_habit_breakdown(
            breakdown_session_id=breakdown_session_id,
            restore_original=request.restore_original
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to rollback breakdown")
        
        return {"message": "Breakdown rolled back successfully", "breakdown_session_id": breakdown_session_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



        count = db.get_habits_count_for_today(query_user_id, time_of_day)
        return {"count": count, "time_of_day": time_of_day, "user_id": query_user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/logs/stats")
async def get_log_stats(user_id: str = Depends(get_user_id_optional)):
    """Get user's habit completion statistics"""
    try:
        query_user_id = user_id if user_id else "default_user"
        
        # Get recent completions for streak calculation
        from datetime import datetime, timedelta
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
        
        completions = db.get_completions(
            user_id=query_user_id,
            start_date=start_date,
            end_date=end_date
        )
        
        # Calculate current streak
        current_streak = 0
        if completions:
            # Group completions by date
            dates_with_completions = set()
            for completion in completions:
                if completion.get('completed_at'):
                    try:
                        # Handle different date formats
                        completed_at = completion['completed_at']
                        if isinstance(completed_at, str):
                            # Try parsing ISO format
                            if 'T' in completed_at:
                                completion_date = datetime.fromisoformat(completed_at.replace('Z', '+00:00')).date()
                            else:
                                completion_date = datetime.fromisoformat(completed_at).date()
                        else:
                            completion_date = completed_at.date() if hasattr(completed_at, 'date') else completed_at
                        dates_with_completions.add(completion_date)
                    except (ValueError, AttributeError):
                        # Skip invalid dates
                        continue
            
            # Count consecutive days from today
            current_date = datetime.now().date()
            while current_date in dates_with_completions:
                current_streak += 1
                current_date -= timedelta(days=1)
        
        return {
            "current_streak": current_streak,
            "total_completions": len(completions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get log stats: {str(e)}")


@app.get("/api/success-rates/date/{target_date}")
async def get_success_rate_for_date(
    target_date: str,
    user_id: str = Depends(get_user_id_optional)
):
    """Get success rate for a specific date"""
    try:
        from datetime import datetime
        try:
            from daily_success_scheduler import daily_scheduler
        except ImportError:
            # Fallback if scheduler is not available
            raise HTTPException(status_code=503, detail="Success rate scheduler not available. Please rebuild Docker image.")
        
        query_user_id = user_id if user_id else "default_user"
        
        # Parse date
        date_obj = datetime.fromisoformat(target_date).date()
        
        # Get success rate with proper status
        result = daily_scheduler.get_success_rate_for_date(query_user_id, date_obj)
        
        return result
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get success rate: {str(e)}")


@app.get("/api/success-rates/range")
async def get_success_rates_range(
    start_date: str,
    end_date: str,
    user_id: str = Depends(get_user_id_optional),
    timezone_offset: Optional[int] = None
):
    """Get success rates for a date range (for monthly calendar)"""
    try:
        from datetime import datetime
        try:
            from daily_success_scheduler import daily_scheduler
        except ImportError:
            # Fallback if scheduler is not available
            raise HTTPException(status_code=503, detail="Success rate scheduler not available. Please rebuild Docker image.")
        
        query_user_id = user_id if user_id else "default_user"
        
        # Parse dates
        start_date_obj = datetime.fromisoformat(start_date).date()
        end_date_obj = datetime.fromisoformat(end_date).date()
        
        # Get stored rates from database
        stored_rates = db.get_daily_success_rates_range(query_user_id, start_date_obj, end_date_obj)
        
        # Create a map of stored rates by date
        stored_map = {rate['date']: rate for rate in stored_rates}
        
        # Generate complete range with proper status for each date
        results = []
        current_date = start_date_obj
        
        # Calculate user's local "today" based on timezone offset
        if timezone_offset is not None:
            local_now = datetime.utcnow() + timedelta(minutes=timezone_offset)
            today = local_now.date()
        else:
            today = datetime.now().date()
        
        while current_date <= end_date_obj:
            date_str = current_date.isoformat()
            
            if date_str in stored_map:
                # Use stored rate
                rate = stored_map[date_str]
                success_rate = rate['success_rate']
                if success_rate == 0:
                    status = 'red'
                elif success_rate < 80:
                    status = 'yellow'
                else:
                    status = 'green'
                
                results.append({
                    **rate,
                    'status': status
                })
            elif current_date > today:
                # Future date - return gray status
                results.append({
                    'date': date_str,
                    'total_habit_instances': 0,
                    'completed_instances': 0,
                    'success_rate': 0.0,
                    'status': 'gray',
                    'is_future_date': True
                })
            else:
                # Past date with no stored data or current day - return red status with 0%
                results.append({
                    'date': date_str,
                    'total_habit_instances': 0,
                    'completed_instances': 0,
                    'success_rate': 0.0,
                    'status': 'red',
                    'is_missing_data': True
                })
            
            current_date += timedelta(days=1)
        
        return {
            "start_date": start_date,
            "end_date": end_date,
            "rates": results
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get success rates range: {str(e)}")


@app.post("/api/success-rates/calculate/{target_date}")
async def calculate_daily_success_rate(
    target_date: str,
    user_id: str = Depends(get_user_id_optional)
):
    """Manually calculate and store success rate for a specific date"""
    try:
        from datetime import datetime
        
        query_user_id = user_id if user_id else "default_user"
        
        # Parse date
        date_obj = datetime.fromisoformat(target_date).date()
        
        # Return red status with 0% for missing data - no calculation performed
        return {
            "success": True, 
            "data": {
                'date': target_date,
                'total_instances': 0,
                'completed_instances': 0,
                'success_rate': 0.0,
                'status': 'red',
                'is_missing_data': True
            }
        }
            
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate success rate: {str(e)}")


@app.get("/api/dashboard/data")
async def get_dashboard_data(
    user_id: str = Depends(get_user_id_optional),
    timezone_offset: Optional[int] = None
):
    """Get all dashboard data in a single optimized request using database-first approach"""
    try:
        query_user_id = user_id if user_id else "default_user"
        
        # Get all data in parallel for better performance
        import asyncio
        from concurrent.futures import ThreadPoolExecutor
        
        def get_habits_sync():
            return db.get_habits(query_user_id)
        
        def get_completions_sync():
            from datetime import date, datetime, timedelta
            # Calculate local time based on timezone offset
            if timezone_offset is not None:
                local_now = datetime.utcnow() + timedelta(minutes=timezone_offset)
            else:
                local_now = datetime.now()
            today = local_now.date()
            return db.get_completions(
                user_id=query_user_id,
                start_date=today,
                end_date=today
            )
        
        def get_stats_sync():
            # Use database-first approach for daily statistics
            return db.get_or_calculate_daily_stats(query_user_id, timezone_offset=timezone_offset)
        
        # Execute database calls in parallel
        with ThreadPoolExecutor(max_workers=3) as executor:
            habits_future = executor.submit(get_habits_sync)
            completions_future = executor.submit(get_completions_sync)
            stats_future = executor.submit(get_stats_sync)
            
            habits = habits_future.result()
            completions = completions_future.result()
            stats = stats_future.result()
        
        # Add indicator for whether data was retrieved from database or calculated
        stats_with_source = {
            **stats,
            "data_source": stats.get("source", "calculated"),  # Indicates source: 'database', 'calculated', 'fallback', or 'error'
            "is_stored": stats.get("source") == "database"  # True if data was retrieved from database
        }
        
        print(f"[DASHBOARD API DEBUG] ===== DASHBOARD DATA RESPONSE =====")
        print(f"[DASHBOARD API DEBUG] User: {query_user_id}")
        print(f"[DASHBOARD API DEBUG] Habits count: {len(habits)}")
        print(f"[DASHBOARD API DEBUG] Completions count: {len(completions)}")
        print(f"[DASHBOARD API DEBUG] Stats source: {stats_with_source.get('data_source')}")
        print(f"[DASHBOARD API DEBUG] Habits today: {stats_with_source.get('habits_today')}")
        print(f"[DASHBOARD API DEBUG] Completed today: {stats_with_source.get('completed_today')}")
        print(f"[DASHBOARD API DEBUG] Success rate: {stats_with_source.get('success_rate_today')}%")
        print(f"[DASHBOARD API DEBUG] Time remaining: {stats_with_source.get('time_remaining')}")
        print(f"[DASHBOARD API DEBUG] =======================================")
        
        return {
            "habits": habits,
            "completions": completions,
            "stats": stats_with_source,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Error in get_dashboard_data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stats/today")
async def get_today_stats(
    user_id: str = Depends(get_user_id_optional),
    timezone_offset: Optional[int] = None
):
    """Get comprehensive stats for today"""
    try:
        query_user_id = user_id if user_id else "default_user"
        print(f"[API DEBUG] ===== GET TODAY STATS API CALLED =====")
        print(f"[API DEBUG] User: {query_user_id}")
        print(f"[API DEBUG] Timezone offset: {timezone_offset}")
        print(f"[API DEBUG] Calling db.get_today_stats...")
        
        stats = db.get_today_stats(query_user_id, timezone_offset)
        
        print(f"[API DEBUG] ===== RETURNING STATS TO FRONTEND =====")
        print(f"[API DEBUG] Habits today: {stats.get('habits_today')}")
        print(f"[API DEBUG] Completed today: {stats.get('completed_today')}")
        print(f"[API DEBUG] Success rate: {stats.get('success_rate_today')}%")
        print(f"[API DEBUG] Time remaining: {stats.get('time_remaining')}")
        print(f"[API DEBUG] Raw completions: {stats.get('completions_today')}")
        print(f"[API DEBUG] ==========================================")
        
        return stats
    except Exception as e:
        print(f"[API ERROR] get_today_stats failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HABIT COMPLETION ENDPOINT
# ============================================================================
# COMPLETION ENDPOINTS
# ============================================================================

@app.post("/api/completions", response_model=Completion)
async def create_completion(
    completion: CompletionCreate, 
    user_id: str = Depends(get_user_id_optional),
    timezone_offset: Optional[int] = None
):
    """Create a habit completion record and update daily statistics with comprehensive error handling"""
    try:
        # Input validation and sanitization
        try:
            completion_data = completion.dict()
            
            # Validate and sanitize user_id
            if user_id and isinstance(user_id, str) and user_id.strip():
                completion_data['user_id'] = user_id.strip()
            elif completion_data.get('user_id') and isinstance(completion_data['user_id'], str):
                completion_data['user_id'] = completion_data['user_id'].strip()
            else:
                completion_data['user_id'] = 'default_user'
            
            # Validate timezone_offset
            if timezone_offset is not None:
                if not isinstance(timezone_offset, (int, float)) or timezone_offset < -720 or timezone_offset > 840:
                    print(f"[WARNING] Invalid timezone offset {timezone_offset}, ignoring")
                    timezone_offset = None
            
        except Exception as validation_error:
            print(f"[ERROR] Input validation failed: {validation_error}")
            raise HTTPException(status_code=400, detail="Invalid input data")
        
        # Use enhanced method that updates daily statistics with fallback handling
        try:
            print(f"[COMPLETION API DEBUG] ===== CREATING COMPLETION =====")
            print(f"[COMPLETION API DEBUG] User: {completion_data.get('user_id')}")
            print(f"[COMPLETION API DEBUG] Habit ID: {completion_data.get('habit_id')}")
            print(f"[COMPLETION API DEBUG] Date: {completion_data.get('completed_date')}")
            print(f"[COMPLETION API DEBUG] Time of day: {completion_data.get('time_of_day_id')}")
            print(f"[COMPLETION API DEBUG] Timezone offset: {timezone_offset}")
            
            result = db.create_completion_and_update_stats(completion_data, timezone_offset)
            
            # Check if the result indicates success
            if not result or not isinstance(result, dict):
                raise HTTPException(status_code=500, detail="Failed to create completion")
            
            # Check if this is the original data (indicating failure)
            if result == completion_data:
                raise HTTPException(status_code=500, detail="Completion creation failed")
            
            print(f"[COMPLETION API DEBUG] ===== COMPLETION CREATED SUCCESSFULLY =====")
            print(f"[COMPLETION API DEBUG] Completion ID: {result.get('id')}")
            print(f"[COMPLETION API DEBUG] Stats should be updated in database now")
            print(f"[COMPLETION API DEBUG] ==========================================")
            
            return result
            
        except HTTPException:
            raise
        except Exception as creation_error:
            print(f"[ERROR] Completion creation failed: {creation_error}")
            # Try fallback to basic completion creation (without stats update)
            try:
                print("[DEBUG] Attempting fallback completion creation")
                fallback_result = db.create_completion(completion_data)
                if fallback_result:
                    print("[WARNING] Created completion without stats update")
                    return fallback_result
                else:
                    raise HTTPException(status_code=500, detail="All completion creation methods failed")
            except Exception as fallback_error:
                print(f"[ERROR] Fallback completion creation also failed: {fallback_error}")
                raise HTTPException(status_code=500, detail="Unable to create completion")
                
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Unexpected error in create_completion: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


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
async def delete_completion(completion_id: int, timezone_offset: Optional[int] = None):
    """Delete a completion and update daily statistics with comprehensive error handling"""
    try:
        # Input validation
        try:
            if not isinstance(completion_id, int) or completion_id <= 0:
                raise HTTPException(status_code=400, detail="Invalid completion ID")
            
            # Validate timezone_offset
            if timezone_offset is not None:
                if not isinstance(timezone_offset, (int, float)) or timezone_offset < -720 or timezone_offset > 840:
                    print(f"[WARNING] Invalid timezone offset {timezone_offset}, ignoring")
                    timezone_offset = None
                    
        except HTTPException:
            raise
        except Exception as validation_error:
            print(f"[ERROR] Input validation failed: {validation_error}")
            raise HTTPException(status_code=400, detail="Invalid input data")
        
        # Check if completion exists before attempting deletion
        try:
            existing_completion = db.get_completion(completion_id)
            if not existing_completion:
                raise HTTPException(status_code=404, detail="Completion not found")
        except HTTPException:
            raise
        except Exception as check_error:
            print(f"[WARNING] Could not verify completion existence: {check_error}")
            # Continue with deletion attempt anyway
        
        # Use enhanced method that updates daily statistics with fallback handling
        try:
            success = db.delete_completion_and_update_stats(completion_id, timezone_offset)
            
            if not success:
                # Try fallback to basic deletion (without stats update)
                try:
                    print("[DEBUG] Attempting fallback completion deletion")
                    fallback_success = db.delete_completion(completion_id)
                    if fallback_success:
                        print("[WARNING] Deleted completion without stats update")
                        return {"message": "Completion deleted successfully (stats update failed)"}
                    else:
                        raise HTTPException(status_code=404, detail="Completion not found or could not be deleted")
                except Exception as fallback_error:
                    print(f"[ERROR] Fallback deletion also failed: {fallback_error}")
                    raise HTTPException(status_code=500, detail="Unable to delete completion")
            
            return {"message": "Completion deleted successfully"}
            
        except HTTPException:
            raise
        except Exception as deletion_error:
            print(f"[ERROR] Completion deletion failed: {deletion_error}")
            raise HTTPException(status_code=500, detail="Failed to delete completion")
                
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Unexpected error in delete_completion: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


# Legacy endpoint for backward compatibility
@app.post("/api/habits/{habit_id}/complete", response_model=Completion)
async def complete_habit_legacy(
    habit_id: int,
    completion: CompleteHabitRequest,
    user_id: str = Depends(get_user_id_optional)
):
    """Legacy endpoint - creates a completion record and triggers ML training"""
    try:
        user_id = user_id if user_id else "default_user"
        
        completion_data = {
            "habit_id": habit_id,
            "user_id": user_id,
            "mood_before": completion.mood_before,
            "mood_after": completion.mood_after,
            "energy_level_before": completion.energy_level_before,
            "energy_level_after": completion.energy_level_after,
            "actual_duration": completion.actual_duration,
            "notes": completion.notes
        }
        result = db.create_completion(completion_data)
        
        # Trigger ML training on completion
        try:
            training_status = ml_trainer.on_habit_completion(user_id, completion_data)
            result['ml_training_status'] = training_status
        except Exception as ml_error:
            print(f"ML training error: {ml_error}")
            # Don't fail the completion if ML training fails
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# FRICTION HELPER ENDPOINTS
# ============================================================================

@app.post("/api/habits/{habit_id}/friction-help")
async def get_friction_help(
    habit_id: int,
    request: FrictionHelpRequest,
    user_id: str = Depends(get_user_id_optional)
):
    """Get AI-powered friction help for a specific habit"""
    try:
        user_id = user_id if user_id else "default_user"
        
        # Validate friction type
        valid_friction_types = ["distraction", "low-energy", "complexity", "forgetfulness"]
        if request.friction_type not in valid_friction_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid friction type. Must be one of: {', '.join(valid_friction_types)}"
            )
        
        # Get habit data
        habit = db.get_habit(habit_id)
        if not habit:
            raise HTTPException(status_code=404, detail="Habit not found")
        
        # Gather user context for AI
        user_context = db.get_user_ml_context(user_id, habit_id)
        
        # Get friction history for context
        friction_history = db.get_user_friction_history(user_id, habit_id, limit=5)
        
        # Generate AI solutions using intelligent chatbot
        ai_response = await intelligent_chatbot.get_friction_solutions(
            habit=habit,
            friction_type=request.friction_type,
            user_context=user_context,
            additional_context=request.additional_context,
            friction_history=friction_history
        )
        
        # Create friction session record
        session_data = {
            "user_id": user_id,
            "habit_id": habit_id,
            "friction_type": request.friction_type,
            "solutions_provided": ai_response.get("solutions", []),
            "created_at": datetime.now().isoformat()
        }
        
        session = db.create_friction_session(session_data)
        
        # Prepare response
        response = {
            "friction_type": request.friction_type,
            "habit_name": habit["name"],
            "bobo_message": ai_response.get("bobo_message", "I'm here to help you overcome this obstacle!"),
            "solutions": ai_response.get("solutions", []),
            "recommended_actions": ai_response.get("recommended_actions", []),
            "user_context": {
                "recent_completions": user_context.get("recent_completions_count", 0),
                "most_successful_time": user_context.get("most_successful_time"),
                "most_successful_energy": user_context.get("most_successful_energy"),
                "success_patterns": user_context.get("time_success_rates", {})
            },
            "session_id": session["id"],
            "generated_at": datetime.now().isoformat()
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating friction help: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to generate friction help")


@app.post("/api/friction-sessions/{session_id}/feedback")
async def update_friction_feedback(
    session_id: int,
    action_taken: str,
    was_helpful: bool,
    user_id: str = Depends(get_user_id_optional)
):
    """Update friction session with user feedback"""
    try:
        success = db.update_friction_session_feedback(session_id, action_taken, was_helpful)
        
        if not success:
            raise HTTPException(status_code=404, detail="Friction session not found")
        
        return {"success": True, "message": "Feedback recorded"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating friction feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to update feedback")


@app.get("/api/users/{user_id}/energy-patterns")
async def get_energy_patterns(
    user_id: str,
    current_user_id: str = Depends(get_user_id_optional)
):
    """Get user's energy patterns for ML-powered scheduling optimization"""
    try:
        # Ensure user can only access their own data
        if current_user_id and user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get completion logs for energy analysis
        completion_logs = db.get_completions(user_id=user_id, limit=100)
        
        # Initialize ML engine and perform advanced energy analysis
        ml_engine = MLEngine()
        energy_analysis = ml_engine.analyze_energy_patterns(
            user_id=user_id,
            completion_logs=completion_logs,
            days_back=30
        )
        
        # Get user habits for schedule optimization
        habits = db.get_habits(user_id)
        
        # Generate optimal schedule recommendations
        schedule_optimization = ml_engine.generate_optimal_schedule(
            habits=habits,
            energy_patterns=energy_analysis
        )
        
        # Extract key insights for API response
        time_patterns = energy_analysis.get("time_energy_patterns", {})
        optimal_windows = energy_analysis.get("optimal_windows", {})
        
        # Map to legacy format for backward compatibility
        peak_times = optimal_windows.get("peak_performance_times", ["morning"])
        low_periods = optimal_windows.get("low_energy_periods", ["night"])
        
        # Calculate success rates by time
        time_success_rates = {
            time: data.get("success_rate", 0.5)
            for time, data in time_patterns.items()
        }
        
        # Energy distribution from patterns
        energy_distribution = {}
        for time, data in time_patterns.items():
            energy_dist = data.get("energy_distribution_before", {})
            for energy, count in energy_dist.items():
                energy_distribution[energy] = energy_distribution.get(energy, 0) + count
        
        response = {
            "user_id": user_id,
            "analysis_period_days": energy_analysis.get("analysis_period_days", 30),
            "data_points": energy_analysis.get("data_points", 0),
            "confidence_score": energy_analysis.get("confidence_score", 0.0),
            
            # Core energy patterns
            "peak_energy_times": peak_times,
            "low_energy_periods": low_periods,
            "energy_distribution": energy_distribution,
            "time_success_rates": time_success_rates,
            
            # Advanced analysis
            "time_energy_patterns": time_patterns,
            "day_energy_patterns": energy_analysis.get("day_energy_patterns", {}),
            "energy_trends": energy_analysis.get("energy_trends", {}),
            "optimal_windows": optimal_windows,
            
            # Recommendations
            "recommendations": {
                "energy_based": energy_analysis.get("recommendations", []),
                "optimal_scheduling": f"Schedule important habits during {', '.join(peak_times)} for best results",
                "avoid_periods": f"Consider rescheduling from {', '.join(low_periods)} if struggling",
                "energy_boost_needed": len([t for t in time_patterns.values() if t.get("typical_energy_before") == "low"]) > 0
            },
            
            # Schedule optimization
            "schedule_optimization": {
                "total_habits": len(habits),
                "optimizable_habits": len([r for r in schedule_optimization.get("schedule", []) if r["reschedule_benefit"]["improvement"] > 5]),
                "average_success_probability": schedule_optimization.get("optimization_summary", {}).get("average_success_probability", 0.5),
                "top_recommendations": schedule_optimization.get("schedule", [])[:5]  # Top 5 recommendations
            },
            
            "generated_at": energy_analysis.get("generated_at")
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting energy patterns: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to get energy patterns")


@app.post("/api/users/{user_id}/habits/{habit_id}/reschedule-suggestion")
async def get_reschedule_suggestion(
    user_id: str,
    habit_id: int,
    struggles: List[str],
    current_user_id: str = Depends(get_user_id_optional)
):
    """Get AI-powered rescheduling suggestions based on current struggles"""
    try:
        # Ensure user can only access their own data
        if current_user_id and user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get habit data
        habit = db.get_habit(habit_id)
        if not habit:
            raise HTTPException(status_code=404, detail="Habit not found")
        
        # Get completion logs for energy analysis
        completion_logs = db.get_completions(user_id=user_id, habit_id=habit_id, limit=50)
        
        # Initialize ML engine and get energy patterns
        ml_engine = MLEngine()
        energy_analysis = ml_engine.analyze_energy_patterns(
            user_id=user_id,
            completion_logs=completion_logs,
            days_back=30
        )
        
        # Get reschedule suggestions
        reschedule_suggestion = ml_engine.suggest_habit_reschedule(
            habit=habit,
            current_struggles=struggles,
            energy_patterns=energy_analysis
        )
        
        return reschedule_suggestion
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting reschedule suggestion: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to get reschedule suggestion")


@app.put("/api/habits/{habit_id}/reschedule")
async def reschedule_habit(
    habit_id: int,
    reschedule_data: dict,
    current_user_id: str = Depends(get_user_id_optional)
):
    """Reschedule a habit to a new time slot"""
    try:
        user_id = current_user_id if current_user_id else "default_user"
        
        # Get the habit to verify ownership
        habit = db.get_habit(habit_id, user_id)
        if not habit:
            raise HTTPException(status_code=404, detail="Habit not found")
        
        # Extract reschedule parameters
        new_time = reschedule_data.get("new_time")
        new_days = reschedule_data.get("new_days", [])
        reason = reschedule_data.get("reason", "User requested")
        
        # Update habit schedule
        success = db.update_habit_schedule(
            habit_id=habit_id,
            user_id=user_id,
            new_time=new_time,
            new_days=new_days,
            reason=reason
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to reschedule habit")
        
        # Get updated habit
        updated_habit = db.get_habit(habit_id, user_id)
        
        return {
            "success": True,
            "message": f"Habit rescheduled successfully",
            "new_schedule": {
                "time": new_time,
                "days": new_days,
                "reason": reason
            },
            "habit": updated_habit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error rescheduling habit: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to reschedule habit")


@app.put("/api/users/{user_id}/preferences")
async def update_user_preferences(
    user_id: str,
    preferences: dict,
    current_user_id: str = Depends(get_user_id_optional)
):
    """Update user scheduling preferences"""
    try:
        # Ensure user can only update their own preferences
        if current_user_id and current_user_id != user_id:
            raise HTTPException(status_code=403, detail="Cannot update other user's preferences")
        
        query_user_id = current_user_id if current_user_id else user_id
        
        # Update preferences in database
        success = db.update_user_preferences(query_user_id, preferences)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update preferences")
        
        return {
            "success": True,
            "message": "Preferences updated successfully",
            "preferences": preferences
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating user preferences: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to update preferences")


@app.get("/api/users/{user_id}/optimal-schedule")
async def get_optimal_schedule(
    user_id: str,
    include_conflicts: bool = True,
    current_user_id: str = Depends(get_user_id_optional)
):
    """Get optimal schedule with conflict resolution"""
    try:
        # Ensure user can only access their own data
        if current_user_id and current_user_id != user_id:
            raise HTTPException(status_code=403, detail="Cannot access other user's data")
        
        query_user_id = current_user_id if current_user_id else user_id
        
        # Get user data
        habits = db.get_habits(query_user_id)
        completion_logs = db.get_completions(user_id=query_user_id, limit=100)
        
        # Get energy patterns
        ml_engine = MLEngine()
        energy_analysis = ml_engine.analyze_energy_patterns(
            user_id=query_user_id,
            completion_logs=completion_logs
        )
        
        # Generate optimal schedule
        schedule_optimization = ml_engine.generate_optimal_schedule(
            habits=habits,
            energy_patterns=energy_analysis
        )
        
        # Detect conflicts if requested
        conflicts = []
        if include_conflicts:
            schedule_recommendations = schedule_optimization.get("schedule", [])
            conflicts = detect_schedule_conflicts(schedule_recommendations)
        
        return {
            "user_id": query_user_id,
            "schedule_optimization": schedule_optimization,
            "conflicts": conflicts,
            "generated_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting optimal schedule: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to get optimal schedule")


def detect_schedule_conflicts(schedule_recommendations):
    """Helper function to detect scheduling conflicts"""
    conflicts = []
    time_slots = {}
    
    # Group habits by time slot
    for rec in schedule_recommendations:
        time_key = f"{rec.get('recommended_time', 'flexible')}"
        if time_key not in time_slots:
            time_slots[time_key] = []
        time_slots[time_key].append(rec)
    
    # Find conflicts (multiple habits at same time)
    for time_slot, habits_at_time in time_slots.items():
        if len(habits_at_time) > 1:
            conflicts.append({
                "time_slot": time_slot,
                "conflicting_habits": [h["habit_name"] for h in habits_at_time],
                "habit_count": len(habits_at_time),
                "resolution_needed": True
            })
    
    return conflicts


# ============================================================================
# JOURNEY OBSTACLE TRACKING ENDPOINTS
# ============================================================================

@app.post("/api/users/{user_id}/habits/{habit_id}/obstacle-encounter")
async def create_obstacle_encounter(
    user_id: str,
    habit_id: int,
    obstacle_type: str,
    severity: str = "medium",
    user_description: str = None,
    current_user_id: str = Depends(get_user_id_optional)
):
    """Create an obstacle encounter record"""
    try:
        # Ensure user can only create their own obstacle encounters
        if current_user_id and user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Validate obstacle type
        valid_obstacle_types = ["distraction_detour", "energy_drain_valley", "maze_mountain", "memory_fog"]
        if obstacle_type not in valid_obstacle_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid obstacle type. Must be one of: {', '.join(valid_obstacle_types)}"
            )
        
        # Validate severity
        valid_severities = ["low", "medium", "high"]
        if severity not in valid_severities:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid severity. Must be one of: {', '.join(valid_severities)}"
            )
        
        # Get habit to validate it exists
        habit = db.get_habit(habit_id)
        if not habit:
            raise HTTPException(status_code=404, detail="Habit not found")
        
        # Get user's current success streak for context
        obstacle_stats = db.get_user_obstacle_stats(user_id)
        
        # Get appropriate Bobo message for the obstacle
        from achievement_engine import AchievementEngine
        achievement_engine = AchievementEngine(db)
        bobo_message = achievement_engine.get_obstacle_message(obstacle_type, 'encounter')
        
        # Create obstacle encounter
        encounter_data = {
            "user_id": user_id,
            "habit_id": habit_id,
            "obstacle_type": obstacle_type,
            "severity": severity,
            "user_description": user_description,
            "bobo_response": bobo_message,
            "previous_success_streak": obstacle_stats.get('current_success_streak', 0),
            "journey_stage": "beginning" if obstacle_stats.get('journey_level', 1) <= 10 else 
                           "middle" if obstacle_stats.get('journey_level', 1) <= 50 else "advanced"
        }
        
        encounter = db.create_obstacle_encounter(encounter_data)
        
        return {
            "encounter_id": encounter["id"],
            "obstacle_type": obstacle_type,
            "bobo_message": bobo_message,
            "severity": severity,
            "journey_context": {
                "level": obstacle_stats.get('journey_level', 1),
                "experience": obstacle_stats.get('journey_experience', 0),
                "previous_streak": obstacle_stats.get('current_success_streak', 0)
            },
            "created_at": encounter["encountered_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating obstacle encounter: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to create obstacle encounter")


@app.post("/api/obstacle-encounters/{encounter_id}/resolve")
async def resolve_obstacle_encounter(
    encounter_id: int,
    was_overcome: bool,
    solution_used: str = None,
    time_to_resolve: int = None,
    current_user_id: str = Depends(get_user_id_optional)
):
    """Resolve an obstacle encounter and update statistics"""
    try:
        # Update obstacle resolution
        success = db.update_obstacle_resolution(
            encounter_id=encounter_id,
            was_overcome=was_overcome,
            solution_used=solution_used,
            time_to_resolve=time_to_resolve
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Obstacle encounter not found")
        
        # Get encounter details to update stats
        encounters = db.get_obstacle_history(current_user_id or "default_user", limit=1)
        if not encounters:
            raise HTTPException(status_code=404, detail="Encounter not found")
        
        encounter = encounters[0]
        obstacle_type = encounter.get("obstacle_type")
        user_id = encounter.get("user_id")
        
        # Update obstacle statistics
        db.update_obstacle_stats(user_id, obstacle_type, was_overcome)
        
        # Check for journey achievements
        from achievement_engine import AchievementEngine
        achievement_engine = AchievementEngine(db)
        
        unlocked_achievements = []
        if was_overcome:
            # Get appropriate Bobo message for overcoming obstacle
            bobo_message = achievement_engine.get_obstacle_message(obstacle_type, 'overcome')
            
            # Check for journey achievements
            unlocked_achievements = achievement_engine.check_journey_achievements(user_id, obstacle_type)
        else:
            bobo_message = "🤖 That's okay! Every obstacle is a learning opportunity. I'm here to help you try again! 💪"
        
        # Get updated stats
        updated_stats = db.get_user_obstacle_stats(user_id)
        
        return {
            "success": True,
            "was_overcome": was_overcome,
            "bobo_message": bobo_message,
            "updated_stats": updated_stats,
            "unlocked_achievements": unlocked_achievements,
            "resolved_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error resolving obstacle encounter: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to resolve obstacle encounter")


@app.get("/api/users/{user_id}/obstacle-stats")
async def get_user_obstacle_stats(
    user_id: str,
    current_user_id: str = Depends(get_user_id_optional)
):
    """Get user's obstacle statistics and journey progress"""
    try:
        # Ensure user can only access their own stats
        if current_user_id and user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get obstacle statistics
        stats = db.get_user_obstacle_stats(user_id)
        
        # Get recent obstacle history
        history = db.get_obstacle_history(user_id, limit=10)
        
        # Get journey achievements
        achievements = db.get_user_journey_achievements(user_id)
        
        # Calculate additional insights
        total_encountered = stats.get('total_obstacles_encountered', 0)
        total_overcome = stats.get('total_obstacles_overcome', 0)
        
        success_rate = (total_overcome / total_encountered * 100) if total_encountered > 0 else 0
        
        # Journey progress calculation
        journey_level = stats.get('journey_level', 1)
        journey_experience = stats.get('journey_experience', 0)
        experience_to_next_level = ((journey_level * 100) - journey_experience) if journey_level < 100 else 0
        
        return {
            "user_id": user_id,
            "obstacle_stats": stats,
            "success_rate": round(success_rate, 1),
            "journey_progress": {
                "level": journey_level,
                "experience": journey_experience,
                "experience_to_next_level": experience_to_next_level,
                "progress_percentage": min((journey_experience % 100), 100)
            },
            "recent_history": history,
            "achievements": achievements,
            "milestones": {
                "first_obstacle_overcome": total_overcome >= 1,
                "obstacle_master": total_overcome >= 5,
                "journey_champion": total_overcome >= 25,
                "persistence_legend": stats.get('current_success_streak', 0) >= 30
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting obstacle stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get obstacle stats")


@app.get("/api/users/{user_id}/obstacle-history")
async def get_obstacle_history(
    user_id: str,
    limit: int = 20,
    current_user_id: str = Depends(get_user_id_optional)
):
    """Get user's obstacle encounter history"""
    try:
        # Ensure user can only access their own history
        if current_user_id and user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get obstacle history
        history = db.get_obstacle_history(user_id, limit)
        
        # Add obstacle type descriptions for frontend
        obstacle_descriptions = {
            "distraction_detour": {
                "name": "Distraction Detour",
                "icon": "📱🛤️",
                "description": "Side paths that lead away from your journey"
            },
            "energy_drain_valley": {
                "name": "Energy Drain Valley", 
                "icon": "🔋⛰️",
                "description": "Challenging terrain that drains your energy"
            },
            "maze_mountain": {
                "name": "Maze Mountain",
                "icon": "🧩🏔️", 
                "description": "Complex obstacles with no clear path"
            },
            "memory_fog": {
                "name": "Memory Fog",
                "icon": "🧠🌫️",
                "description": "Cloudy conditions that obscure your markers"
            }
        }
        
        # Enhance history with descriptions
        enhanced_history = []
        for encounter in history:
            obstacle_type = encounter.get("obstacle_type")
            enhanced_encounter = {
                **encounter,
                "obstacle_info": obstacle_descriptions.get(obstacle_type, {
                    "name": obstacle_type.replace("_", " ").title(),
                    "icon": "🚧",
                    "description": "Journey obstacle"
                })
            }
            enhanced_history.append(enhanced_encounter)
        
        return {
            "user_id": user_id,
            "history": enhanced_history,
            "total_count": len(history)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting obstacle history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get obstacle history")


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
        logs = db.get_logs(user_id=user_id)  # ✅ Fixed: User-specific logs
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
        logs = db.get_logs(user_id=user_id)  # ✅ Fixed: User-specific logs
        
        analytics = ml_engine.analyze_patterns(habits, logs)
        
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ML TRAINING ENDPOINTS
# ============================================================================

@app.get("/api/ml/training-status")
async def get_ml_training_status(user_id: str = Depends(get_user_id_optional)):
    """Get ML training status for current user"""
    try:
        user_id = user_id if user_id else "default_user"
        status = ml_trainer.get_training_status(user_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/train")
async def trigger_ml_training(user_id: str = Depends(get_user_id_optional)):
    """Manually trigger ML model training"""
    try:
        user_id = user_id if user_id else "default_user"
        results = ml_trainer.train_user_models(user_id)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/daily-check")
async def daily_training_check(user_id: str = Depends(get_user_id_optional)):
    """Run daily training check (can be called by cron job)"""
    try:
        user_id = user_id if user_id else "default_user"
        results = ml_trainer.check_daily_training(user_id)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/predict-difficulty")
async def predict_habit_difficulty(habit_data: Dict[str, Any], user_id: str = Depends(get_user_id_optional)):
    """Predict difficulty for a new habit"""
    try:
        from ml.difficulty_estimator import difficulty_estimator
        
        user_id = user_id if user_id else "default_user"
        
        # Get user data for context
        habits = db.get_habits(user_id)
        logs = db.get_logs(user_id=user_id)
        user_stats = ml_trainer._calculate_user_stats(user_id, habits, logs)
        
        # Predict difficulty
        prediction = difficulty_estimator.estimate(habit_data, user_stats)
        
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/predict-duration")
async def predict_habit_duration(habit_data: Dict[str, Any], user_id: str = Depends(get_user_id_optional)):
    """Predict realistic duration for a habit"""
    try:
        from ml.duration_predictor import duration_predictor
        
        user_id = user_id if user_id else "default_user"
        
        # Predict duration
        prediction = duration_predictor.predict(habit_data)
        
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ml/recommendations")
async def get_ml_recommendations(user_id: str = Depends(get_user_id_optional), limit: int = 5):
    """Get ML-powered habit recommendations"""
    try:
        from ml.recommendation_engine import recommendation_engine
        
        user_id = user_id if user_id else "default_user"
        
        # Get user data
        habits = db.get_habits(user_id)
        logs = db.get_logs(user_id=user_id)
        user_stats = ml_trainer._calculate_user_stats(user_id, habits, logs)
        
        # Generate recommendations
        recommendations = recommendation_engine.generate_recommendations(
            user_stats, habits, logs, limit=limit
        )
        
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_coach(message: ChatMessage):
    """Chat with AI habit coach (intelligent version with intent recognition)"""
    try:
        # Get context - USER-SPECIFIC DATA
        habits = db.get_habits(message.user_id)
        logs = db.get_completions(user_id=message.user_id)  # ✅ Fixed: User-specific completions
        schedule = db.get_schedule(message.user_id)
        
        # Get today's habits specifically (with timezone support)
        today_habits = db.get_habits_for_today(message.user_id, timezone_offset=message.timezone_offset)
        
        # Get today's habit instances (each time-of-day counts separately)
        today_habit_instances = db.get_habit_instances_for_today(message.user_id, timezone_offset=user_timezone_offset)
        
        # Get user's timezone offset from preferences (fallback to message timezone_offset)
        try:
            user_timezone_offset = db.get_user_timezone_offset(message.user_id)
        except:
            user_timezone_offset = message.timezone_offset or 0
        
        # Add comprehensive date range helper functions using user's stored timezone
        def get_habits_for_tomorrow():
            return db.get_habit_instances_for_relative_date(message.user_id, 1, user_timezone_offset)
        
        def get_habits_for_yesterday():
            return db.get_habit_instances_for_relative_date(message.user_id, -1, user_timezone_offset)
        
        def get_habits_for_specific_date(date_str):
            return db.get_habit_instances_for_date(message.user_id, date_str, user_timezone_offset)
        
        def get_habits_for_this_week():
            return db.get_habits_for_week(message.user_id, 0, user_timezone_offset)
        
        def get_habits_for_next_week():
            return db.get_habits_for_week(message.user_id, 1, user_timezone_offset)
        
        def get_habits_for_last_week():
            return db.get_habits_for_week(message.user_id, -1, user_timezone_offset)
        
        def get_habits_for_this_month():
            return db.get_habits_for_month(message.user_id, 0, user_timezone_offset)
        
        def get_habits_for_next_month():
            return db.get_habits_for_month(message.user_id, 1, user_timezone_offset)
        
        def get_habits_for_last_month():
            return db.get_habits_for_month(message.user_id, -1, user_timezone_offset)
        
        def get_habits_for_date_range(start_date, end_date):
            return db.get_habits_for_date_range(message.user_id, start_date, end_date, user_timezone_offset)
        
        def get_habits_for_day_of_week(day_name, weeks_ahead=4):
            return db.get_habits_for_day_of_week(message.user_id, day_name, weeks_ahead, user_timezone_offset)
        
        # DEBUG: Print what data we're getting
        print(f"[CHAT DEBUG] User ID: {message.user_id}")
        print(f"[CHAT DEBUG] Total habits: {len(habits)}")
        print(f"[CHAT DEBUG] Today's habits: {len(today_habits)}")
        print(f"[CHAT DEBUG] Logs: {len(logs)}")
        print(f"[CHAT DEBUG] Message: {message.message}")
        
        # Build user context
        user_context = {
            'habits': habits,  # All habits
            'today_habits': today_habits,  # Today's scheduled habits (unique habits)
            'today_habit_instances': today_habit_instances,  # Today's habit instances (each time counts)
            'logs': logs,  # ✅ Now contains only this user's data
            'schedule': schedule,
            'user_id': message.user_id,
            'timezone_offset': user_timezone_offset,  # Pass user's stored timezone offset to context
            # Comprehensive date range helper functions
            'get_habits_for_tomorrow': get_habits_for_tomorrow,
            'get_habits_for_yesterday': get_habits_for_yesterday,
            'get_habits_for_specific_date': get_habits_for_specific_date,
            'get_habits_for_this_week': get_habits_for_this_week,
            'get_habits_for_next_week': get_habits_for_next_week,
            'get_habits_for_last_week': get_habits_for_last_week,
            'get_habits_for_this_month': get_habits_for_this_month,
            'get_habits_for_next_month': get_habits_for_next_month,
            'get_habits_for_last_month': get_habits_for_last_month,
            'get_habits_for_date_range': get_habits_for_date_range,
            'get_habits_for_day_of_week': get_habits_for_day_of_week,
            'db': db  # Give Bobo direct access to database functions
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


@app.get("/api/debug/chat-context")
async def debug_chat_context(message: ChatMessage):
    """Debug endpoint to see what data the chatbot receives"""
    try:
        # Get the same data that chatbot gets
        habits = db.get_habits(message.user_id)
        today_habits = db.get_habits_for_today(message.user_id)
        logs = db.get_completions(user_id=message.user_id)
        schedule = db.get_schedule(message.user_id)
        
        return {
            "user_id": message.user_id,
            "total_habits": len(habits),
            "habits": habits,
            "today_habits_count": len(today_habits), 
            "today_habits": today_habits,
            "logs_count": len(logs),
            "logs": logs[:5],  # First 5 logs
            "schedule": schedule,
            "debug_info": {
                "db_mock_mode": db.mock_mode,
                "chatbot_ai_enabled": intelligent_chatbot.ai_enabled if intelligent_chatbot else False
            }
        }
    except Exception as e:
        return {"error": str(e), "user_id": message.user_id}


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


@app.post("/api/capacity/check")
async def check_habit_capacity(
    habit_data: HabitCreate,
    user_id: str = Depends(get_user_id_optional)
):
    """Check if adding a habit would exceed daily capacity (16 hours)"""
    try:
        query_user_id = user_id if user_id else "default_user"
        
        # Convert habit data to dict
        habit_dict = habit_data.dict()
        habit_dict['user_id'] = query_user_id
        
        # Check capacity
        result = db.check_habit_capacity(query_user_id, habit_dict)
        
        return {
            "can_add": result['can_add'],
            "message": result['message'],
            "current_usage_hours": {day: usage/60 for day, usage in result['current_usage'].items()},
            "new_usage_hours": {day: usage/60 for day, usage in result['new_usage'].items()},
            "daily_limit_hours": 16,
            "problem_days": result.get('problem_days', [])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ACHIEVEMENT ENDPOINTS
# ============================================================================

from achievement_engine import AchievementEngine
from models import AchievementProgress, AchievementUnlock

# Import voice routes
from voice_routes import router as voice_router
app.include_router(voice_router)

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


@app.post("/api/achievements/unlock/daily")
async def unlock_daily_achievement(user_id: str = Depends(get_user_id)):
    """
    Unlock daily achievement if conditions are met (100% success rate for today)
    """
    try:
        achievement_engine = AchievementEngine(db)
        result = achievement_engine.unlock_daily_achievement(user_id)
        if result:
            return {"success": True, "achievement": result}
        else:
            raise HTTPException(status_code=400, detail="Daily achievement conditions not met")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to unlock daily achievement: {str(e)}")


@app.post("/api/achievements/unlock/weekly")
async def unlock_weekly_achievement(user_id: str = Depends(get_user_id)):
    """
    Unlock weekly achievement if conditions are met (100% success rate for entire week)
    """
    try:
        achievement_engine = AchievementEngine(db)
        result = achievement_engine.unlock_weekly_achievement(user_id)
        if result:
            return {"success": True, "achievement": result}
        else:
            raise HTTPException(status_code=400, detail="Weekly achievement conditions not met")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to unlock weekly achievement: {str(e)}")


@app.post("/api/achievements/unlock/monthly")
async def unlock_monthly_achievement(user_id: str = Depends(get_user_id)):
    """
    Unlock monthly achievement if conditions are met (100% success rate for entire month)
    """
    try:
        achievement_engine = AchievementEngine(db)
        result = achievement_engine.unlock_monthly_achievement(user_id)
        if result:
            return {"success": True, "achievement": result}
        else:
            raise HTTPException(status_code=400, detail="Monthly achievement conditions not met")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to unlock monthly achievement: {str(e)}")


@app.get("/api/achievements/rewards")
async def get_available_rewards(user_id: str = Depends(get_user_id)):
    """
    Get all available rewards that can be unlocked
    
    Returns libraries of dances, hats, costumes, colors, and themes
    """
    try:
        return {
            'dances': AchievementEngine.DANCES,
            'hats': AchievementEngine.HATS,
            'costumes': AchievementEngine.COSTUMES,
            'colors': AchievementEngine.COLORS,
            'themes': AchievementEngine.THEMES,
            'motivational_sentences': AchievementEngine.MOTIVATIONAL_SENTENCES
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get rewards: {str(e)}")


@app.get("/api/achievements/unlocked")
async def get_unlocked_rewards(
    reward_type: Optional[str] = None,
    user_id: str = Depends(get_user_id)
):
    """
    Get user's unlocked rewards
    
    Optional filter by reward_type
    """
    try:
        rewards = db.get_unlocked_rewards(user_id, reward_type)
        return rewards
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get unlocked rewards: {str(e)}")


@app.get("/api/achievements/claimed/{achievement_type}")
async def check_achievement_claimed(
    achievement_type: str,
    user_id: str = Depends(get_user_id)
):
    """
    Check if user has already claimed this achievement type for the current period
    
    - daily_perfect: Once per day
    - weekly_perfect: Once per week  
    - monthly_perfect: Once per month
    """
    try:
        if achievement_type not in ['daily_perfect', 'weekly_perfect', 'monthly_perfect']:
            raise HTTPException(status_code=400, detail="Invalid achievement type")
        
        claimed = db.check_reward_claimed_for_period(user_id, achievement_type)
        return {"claimed": claimed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check claimed status: {str(e)}")


# ============================================================================
# JOURNEY ACHIEVEMENT ENDPOINTS
# ============================================================================

@app.post("/api/journey/achievements/check")
async def check_journey_achievements(
    obstacle_type: Optional[str] = None,
    user_id: str = Depends(get_user_id)
):
    """
    Check for newly unlocked journey achievements after obstacle encounters
    
    Args:
        obstacle_type: Type of obstacle overcome (optional)
        
    Returns:
        List of newly unlocked journey achievements with rewards
    """
    try:
        from achievement_engine import AchievementEngine
        achievement_engine = AchievementEngine(db)
        
        unlocked_achievements = achievement_engine.check_journey_achievements(user_id, obstacle_type)
        
        return {
            "unlocked_achievements": unlocked_achievements,
            "count": len(unlocked_achievements)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check journey achievements: {str(e)}")


@app.get("/api/journey/achievements")
async def get_user_journey_achievements(user_id: str = Depends(get_user_id)):
    """
    Get all journey achievements unlocked by the user
    
    Returns:
        List of journey achievements with rewards and unlock dates
    """
    try:
        achievements = db.get_user_journey_achievements(user_id)
        return {
            "achievements": achievements,
            "total_count": len(achievements)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get journey achievements: {str(e)}")


@app.get("/api/journey/progress")
async def get_journey_progress(user_id: str = Depends(get_user_id)):
    """
    Get user's journey progress including obstacle stats and achievement progress
    
    Returns:
        Comprehensive journey progress data
    """
    try:
        # Get obstacle statistics
        obstacle_stats = db.get_obstacle_encounter_stats(user_id)
        
        # Get journey achievements
        achievements = db.get_user_journey_achievements(user_id)
        
        # Calculate progress towards next achievements
        progress_data = {
            "obstacle_stats": obstacle_stats,
            "achievements_unlocked": len(achievements),
            "journey_level": obstacle_stats.get('journey_level', 1),
            "journey_experience": obstacle_stats.get('journey_experience', 0),
            "progress_to_next_level": (obstacle_stats.get('journey_experience', 0) % 50) / 50 * 100,
            "achievement_progress": {
                "navigator_unlocked": any(a.get('achievement_type') == 'obstacle_navigator' for a in achievements),
                "distraction_master_progress": f"{obstacle_stats.get('distraction_detours_overcome', 0)}/5",
                "energy_warrior_progress": f"{obstacle_stats.get('energy_valleys_overcome', 0)}/5",
                "maze_solver_progress": f"{obstacle_stats.get('maze_mountains_overcome', 0)}/5",
                "memory_keeper_progress": f"{obstacle_stats.get('memory_fogs_overcome', 0)}/5",
                "champion_progress": f"{obstacle_stats.get('total_obstacles_overcome', 0)}/25",
                "legend_progress": f"{obstacle_stats.get('current_success_streak', 0)}/30"
            }
        }
        
        return progress_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get journey progress: {str(e)}")


@app.post("/api/journey/obstacle/encounter")
async def record_obstacle_encounter(
    obstacle_data: dict,
    user_id: str = Depends(get_user_id)
):
    """
    Record a new obstacle encounter
    
    Args:
        obstacle_data: Dictionary containing obstacle type and encounter details
        
    Returns:
        Success status and encounter ID
    """
    try:
        obstacle_type = obstacle_data.get('obstacle_type')
        if not obstacle_type:
            raise HTTPException(status_code=400, detail="obstacle_type is required")
        
        # Record the encounter
        success = db.record_obstacle_encounter(user_id, obstacle_type, obstacle_data)
        
        if success:
            return {"success": True, "message": "Obstacle encounter recorded"}
        else:
            raise HTTPException(status_code=500, detail="Failed to record obstacle encounter")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record obstacle encounter: {str(e)}")


@app.post("/api/journey/obstacle/resolve/{encounter_id}")
async def resolve_obstacle_encounter(
    encounter_id: int,
    resolution_data: dict,
    user_id: str = Depends(get_user_id)
):
    """
    Resolve an obstacle encounter (mark as overcome or not)
    
    Args:
        encounter_id: ID of the encounter to resolve
        resolution_data: Dictionary containing was_overcome and other resolution details
        
    Returns:
        Success status and any newly unlocked achievements
    """
    try:
        was_overcome = resolution_data.get('was_overcome', False)
        
        # Resolve the encounter
        success = db.resolve_obstacle_encounter(encounter_id, was_overcome, resolution_data)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to resolve obstacle encounter")
        
        # Check for journey achievements if obstacle was overcome
        unlocked_achievements = []
        if was_overcome:
            obstacle_type = resolution_data.get('obstacle_type')
            if obstacle_type:
                from achievement_engine import AchievementEngine
                achievement_engine = AchievementEngine(db)
                unlocked_achievements = achievement_engine.check_journey_achievements(user_id, obstacle_type)
        
        return {
            "success": True,
            "message": "Obstacle encounter resolved",
            "unlocked_achievements": unlocked_achievements,
            "achievement_count": len(unlocked_achievements)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resolve obstacle encounter: {str(e)}")


# ============================================================================
# BOBO CUSTOMIZATION ENDPOINTS
# ============================================================================

@app.get("/api/bobo/items")
async def get_bobo_items(
    item_type: Optional[str] = None,
    user_id: str = Depends(get_user_id)
):
    """
    Get user's unlocked Bobo items from bobo_items table
    
    Optional filter by item_type (hat, costume, dance, color)
    """
    try:
        items = db.get_bobo_items(user_id, item_type)
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get Bobo items: {str(e)}")


@app.get("/api/bobo/customizations")
async def get_equipped_customizations(user_id: str = Depends(get_user_id)):
    """
    Get user's currently equipped Bobo customizations
    
    Returns hat, costume, color, and dance IDs
    """
    try:
        equipped = db.get_equipped_customizations(user_id)
        return equipped
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get equipped customizations: {str(e)}")


@app.post("/api/bobo/equip")
async def equip_customization(
    customizations: Dict[str, Optional[str]],
    user_id: str = Depends(get_user_id)
):
    """
    Equip Bobo customizations
    
    Body should contain: { "hat": "id", "costume": "id", "color": "id", "dance": "id" }
    """
    try:
        result = db.save_equipped_customizations(user_id, customizations)
        return {"success": True, "equipped": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to equip customization: {str(e)}")


# ============================================================================
# TESTING ENDPOINTS (for development)
# ============================================================================

@app.post("/api/test/trigger-achievement")
async def trigger_test_achievement(
    achievement_type: str = 'daily',
    user_id: str = Depends(get_user_id)
):
    """
    TEST ONLY: Trigger a specific achievement type and return the rewards
    """
    try:
        from achievement_engine import AchievementEngine
        
        print(f"\n{'='*60}")
        print(f"[TEST] Triggering {achievement_type} achievement")
        print(f"[TEST] User ID: {user_id}")
        print(f"[TEST] User ID type: {type(user_id)}")
        print(f"[TEST] Database mode: {'MOCK' if db.mock_mode else 'SUPABASE'}")
        print(f"{'='*60}\n")
        
        achievement_engine = AchievementEngine(db)
        
        # Manually trigger the specific achievement
        unlocked = None
        if achievement_type in ['single', 'any_completion']:
            print(f"[TEST] Unlocking motivational sentence...")
            unlocked = achievement_engine._unlock_motivational_sentence(user_id)
        elif achievement_type == 'daily':
            print(f"[TEST] Unlocking dance...")
            unlocked = achievement_engine._unlock_dance(user_id)
        elif achievement_type == 'weekly':
            print(f"[TEST] Unlocking hat & costume...")
            unlocked = achievement_engine._unlock_hat_costume(user_id)
        elif achievement_type == 'monthly':
            print(f"[TEST] Unlocking theme...")
            unlocked = achievement_engine._unlock_theme(user_id)
        
        if unlocked:
            print(f"[TEST] ✓ Achievement unlocked successfully!")
            print(f"[TEST] Reward: {unlocked}")
            
            # Verify items were saved
            items = db.get_bobo_items(user_id)
            print(f"[TEST] Items in database for user: {len(items)}")
            
            return [unlocked]
        else:
            print(f"[TEST] ✗ No achievement unlocked (returned None)")
            return []
            
    except Exception as e:
        print(f"\n[TEST] ❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        print(f"\n")
        raise HTTPException(status_code=500, detail=f"Failed to trigger achievement: {str(e)}")


@app.get("/api/test/db-status")
async def test_db_status(user_id: str = Depends(get_user_id)):
    """
    TEST ONLY: Check database connection and current items
    """
    try:
        items = db.get_bobo_items(user_id)
        equipped = db.get_equipped_customizations(user_id)
        
        return {
            "database_mode": "mock" if db.mock_mode else "supabase",
            "user_id": user_id,
            "items_count": len(items),
            "items": items,
            "equipped": equipped
        }
    except Exception as e:
        return {
            "error": str(e),
            "database_mode": "mock" if db.mock_mode else "supabase"
        }


@app.post("/api/test/unlock-items")
async def test_unlock_items(user_id: str = Depends(get_user_id)):
    """
    TEST ONLY: Manually unlock some test items for the current user using AI generation
    """
    try:
        from bobo_customization_agent import customization_agent
        from datetime import datetime
        
        print(f"[TEST] Unlocking AI-generated items for user: {user_id}")
        print(f"[TEST] Database mock mode: {db.mock_mode}")
        
        items_created = []
        
        # Generate and save a dance using AI
        dance = customization_agent.generate_dance()
        print(f"[TEST] Generated AI dance: {dance}")
        
        dance_data = {
            'user_id': user_id,
            'item_type': 'dance',
            'item_id': dance['id'],
            'item_name': dance['name'],
            'item_description': dance.get('description', ''),
            'svg_data': '',
            'animation_data': {
                'keyframes': dance.get('keyframes', {}),
                'duration': dance.get('duration', 800),
                'timing': dance.get('timing', 'ease-in-out'),
                'movements': dance.get('movements', {
                    'arms': {'speed': 50, 'amplitude': 20, 'pattern': 'wave'},
                    'head': {'speed': 100, 'amplitude': 5, 'pattern': 'nod'},
                    'hands': {'speed': 80, 'amplitude': 15, 'pattern': 'wiggle'}
                })
            },
            'achievement_type': 'test'
        }
        print(f"[TEST] Dance data to save: {dance_data}")
        result = db.save_bobo_item(dance_data)
        print(f"[TEST] Dance save result: {result}")
        if result:
            items_created.append(f"Dance: {dance['name']}")
        else:
            print(f"[TEST] WARNING: Dance save returned None!")
        
        # Generate and save a hat using AI
        hat = customization_agent.generate_hat()
        print(f"[TEST] Generated AI hat: {hat}")
        result = db.save_bobo_item({
            'user_id': user_id,
            'item_type': 'hat',
            'item_id': hat['id'],
            'item_name': hat['name'],
            'item_description': hat.get('description', ''),
            'svg_data': hat.get('svg', ''),
            'animation_data': {},
            'achievement_type': 'test'
        })
        print(f"[TEST] Hat save result: {result}")
        items_created.append(f"Hat: {hat['name']}")
        
        # Generate and save a costume using AI
        costume = customization_agent.generate_costume()
        print(f"[TEST] Generated AI costume: {costume}")
        result = db.save_bobo_item({
            'user_id': user_id,
            'item_type': 'costume',
            'item_id': costume['id'],
            'item_name': costume['name'],
            'item_description': costume.get('description', ''),
            'svg_data': costume.get('svg', ''),
            'animation_data': {},
            'achievement_type': 'test'
        })
        print(f"[TEST] Costume save result: {result}")
        items_created.append(f"Costume: {costume['name']}")
        
        # Generate and save a color
        import random
        color = random.choice(AchievementEngine.COLORS)
        print(f"[TEST] Selected color: {color}")
        result = db.save_bobo_item({
            'user_id': user_id,
            'item_type': 'color',
            'item_id': color['id'],
            'item_name': color['name'],
            'item_description': color.get('description', ''),
            'svg_data': color.get('hex', ''),
            'animation_data': {},
            'achievement_type': 'test'
        })
        print(f"[TEST] Color save result: {result}")
        items_created.append(f"Color: {color['name']}")
        
        # Verify items were saved
        all_items = db.get_bobo_items(user_id)
        print(f"[TEST] Total items in DB for user: {len(all_items)}")
        print(f"[TEST] Items: {all_items}")
        
        return {
            "success": True,
            "message": "Test items unlocked!",
            "items": items_created,
            "debug": {
                "user_id": user_id,
                "mock_mode": db.mock_mode,
                "items_saved": len(items_created),
                "items_in_db": len(all_items)
            }
        }
    except Exception as e:
        print(f"[TEST] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to unlock test items: {str(e)}")


# Duplicate endpoints removed - using the first set of definitions above
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get bobo items: {str(e)}")


# ============================================================================
# TESTING ENDPOINTS (Remove in production)
# ============================================================================

@app.post("/api/test/trigger-achievement")
async def trigger_test_achievement(
    achievement_type: str,
    user_id: str = Depends(get_user_id)
):
    """
    Manually trigger an achievement for testing
    
    achievement_type: 'single', 'daily', 'weekly', 'monthly'
    """
    try:
        achievement_engine = AchievementEngine(db)
        
        # Manually trigger specific achievement
        result = None
        if achievement_type == 'single':
            result = achievement_engine._unlock_motivational_sentence(user_id)
        elif achievement_type == 'daily':
            result = achievement_engine._unlock_dance(user_id)
        elif achievement_type == 'weekly':
            result = achievement_engine._unlock_hat_costume(user_id)
        elif achievement_type == 'monthly':
            result = achievement_engine._unlock_theme(user_id)
        
        if result:
            return [result]  # Return as list to match check_achievements format
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trigger achievement: {str(e)}")


@app.get("/api/test/generate-item")
async def test_generate_item(item_type: str = "hat"):
    """
    TEST ONLY: Test AI generation of customization items
    
    item_type: 'hat', 'costume', or 'dance'
    """
    try:
        from bobo_customization_agent import customization_agent
        
        if item_type == 'hat':
            item = customization_agent.generate_hat()
        elif item_type == 'costume':
            item = customization_agent.generate_costume()
        elif item_type == 'dance':
            item = customization_agent.generate_dance()
        else:
            raise HTTPException(status_code=400, detail="Invalid item_type. Use 'hat', 'costume', or 'dance'")
        
        return {
            "success": True,
            "item_type": item_type,
            "generated_item": item
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate item: {str(e)}")
