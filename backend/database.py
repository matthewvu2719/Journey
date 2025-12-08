"""
Supabase database client
"""
import os
from typing import List, Optional, Dict, Any
from datetime import date, datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


class SupabaseClient:
    """Wrapper for Supabase operations"""
    
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        # Try service_role key first (bypasses RLS), fallback to anon key
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
        
        # Use mock mode if credentials are missing or invalid
        if not url or not key or url == "https://your-project.supabase.co":
            print("⚠️  Running in MOCK MODE (no Supabase connection)")
            self.client = None
            self.mock_mode = True
            self._init_mock_data()
        else:
            try:
                self.client: Client = create_client(url, key)
                self.mock_mode = False
                key_type = "service_role" if os.getenv("SUPABASE_SERVICE_ROLE_KEY") else "anon"
                print(f"✓ Connected to Supabase (using {key_type} key)")
            except Exception as e:
                print(f"⚠️  Supabase connection failed: {e}")
                print("⚠️  Running in MOCK MODE")
                self.client = None
                self.mock_mode = True
                self._init_mock_data()
    
    def _init_mock_data(self):
        """Initialize mock data for demo"""
        self.mock_habits = []
        self.mock_logs = []
        self.mock_availability = []
        self.next_id = 1
    
    # ========================================================================
    # HABITS
    # ========================================================================
    
    def create_habit(self, habit_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new habit"""
        # Extract days and times_of_day lists before inserting
        days_list = habit_data.pop('days', None)
        times_of_day_list = habit_data.pop('times_of_day', None)
        
        if self.mock_mode:
            habit = {
                **habit_data, 
                "id": self.next_id, 
                "created_at": datetime.now().isoformat(), 
                "days": days_list,
                "times_of_day": times_of_day_list
            }
            self.mock_habits.append(habit)
            self.next_id += 1
            return habit
        
        # Filter to only include fields that exist in the habits table
        # Match exact database schema (removed time_of_day)
        allowed_fields = {
            'user_id', 'name', 'description', 'habit_type', 'estimated_duration',
            'priority', 'difficulty', 'category',
            'mood_before', 'mood_after', 'energy_level_before', 'energy_level_after',
            'is_successful', 'actual_duration'
        }
        
        filtered_data = {k: v for k, v in habit_data.items() if k in allowed_fields and v is not None}
        
        try:
            # Insert habit
            response = self.client.table("habits").insert(filtered_data).execute()
            habit = response.data[0]
            
            # Insert days relationships if provided
            if days_list:
                try:
                    self._link_habit_days(habit['id'], days_list)
                    habit['days'] = days_list
                except Exception as e:
                    print(f"Warning: Could not link days: {e}")
                    habit['days'] = days_list  # Still return days in response
            
            # Insert times_of_day relationships if provided
            if times_of_day_list:
                try:
                    self._link_habit_times_of_day(habit['id'], times_of_day_list)
                    habit['times_of_day'] = times_of_day_list
                except Exception as e:
                    print(f"Warning: Could not link times of day: {e}")
                    habit['times_of_day'] = times_of_day_list  # Still return times_of_day in response
            
            return habit
        except Exception as e:
            print(f"Error creating habit: {e}")
            raise
    
    def get_habits(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all habits for a user with their associated days and times_of_day"""
        if self.mock_mode:
            return [h for h in self.mock_habits if h.get("user_id") == user_id]
        
        response = self.client.table("habits").select("*").eq("user_id", user_id).execute()
        habits = response.data
        
        # Fetch days and times_of_day for each habit
        for habit in habits:
            try:
                habit['days'] = self._get_habit_days(habit['id'])
            except Exception as e:
                print(f"Warning: Could not fetch days for habit {habit['id']}: {e}")
                habit['days'] = []  # Return empty array if days table doesn't exist
            
            try:
                habit['times_of_day'] = self._get_habit_times_of_day(habit['id'])
            except Exception as e:
                print(f"Warning: Could not fetch times of day for habit {habit['id']}: {e}")
                habit['times_of_day'] = []  # Return empty array if times_of_day table doesn't exist
        
        return habits
    
    def get_habit(self, habit_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific habit"""
        if self.mock_mode:
            return next((h for h in self.mock_habits if h["id"] == habit_id), None)
        
        response = self.client.table("habits").select("*").eq("id", habit_id).execute()
        return response.data[0] if response.data else None
    
    def update_habit(self, habit_id: int, habit_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a habit"""
        if self.mock_mode:
            for i, h in enumerate(self.mock_habits):
                if h["id"] == habit_id:
                    self.mock_habits[i] = {**h, **habit_data}
                    return self.mock_habits[i]
            return None
        
        response = self.client.table("habits").update(habit_data).eq("id", habit_id).execute()
        return response.data[0] if response.data else None
    
    def delete_habit(self, habit_id: int) -> bool:
        """Delete a habit"""
        if self.mock_mode:
            self.mock_habits = [h for h in self.mock_habits if h["id"] != habit_id]
            return True
        
        self.client.table("habits").delete().eq("id", habit_id).execute()
        return True
    
    # ========================================================================
    # HABIT COMPLETIONS
    # ========================================================================
    
    def create_completion(self, completion_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a habit completion record"""
        from datetime import date as date_type, datetime
        
        # Set defaults
        if 'completed_date' not in completion_data or completion_data['completed_date'] is None:
            completion_data['completed_date'] = date_type.today().isoformat()
        
        if 'completed_at' not in completion_data:
            completion_data['completed_at'] = datetime.now().isoformat()
        
        # Calculate day_of_week if completed_date is provided
        if 'completed_date' in completion_data and completion_data['completed_date']:
            if isinstance(completion_data['completed_date'], str):
                completed_date = date_type.fromisoformat(completion_data['completed_date'])
            else:
                completed_date = completion_data['completed_date']
                # Convert date object to string BEFORE inserting
                completion_data['completed_date'] = completed_date.isoformat()
            completion_data['day_of_week'] = completed_date.weekday()  # 0=Monday, 6=Sunday
        
        # Ensure completed_at is also a string
        if 'completed_at' in completion_data and isinstance(completion_data['completed_at'], datetime):
            completion_data['completed_at'] = completion_data['completed_at'].isoformat()
        
        if self.mock_mode:
            completion = {**completion_data, "id": self.next_id}
            if not hasattr(self, 'mock_completions'):
                self.mock_completions = []
            self.mock_completions.append(completion)
            self.next_id += 1
            return completion
        
        # Insert into habit_completions table
        response = self.client.table("habit_completions").insert(completion_data).execute()
        result = response.data[0] if response.data else None
        
        # Ensure date fields are serialized as strings
        if result:
            if 'completed_date' in result and isinstance(result['completed_date'], date_type):
                result['completed_date'] = result['completed_date'].isoformat()
            if 'completed_at' in result and isinstance(result['completed_at'], datetime):
                result['completed_at'] = result['completed_at'].isoformat()
        
        return result
    
    def get_completions(
        self,
        user_id: Optional[str] = None,
        habit_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        """Get habit completions with filters"""
        if self.mock_mode:
            if not hasattr(self, 'mock_completions'):
                self.mock_completions = []
            completions = self.mock_completions
            if user_id:
                completions = [c for c in completions if c.get("user_id") == user_id]
            if habit_id:
                completions = [c for c in completions if c.get("habit_id") == habit_id]
            return completions
        
        query = self.client.table("habit_completions").select("*")
        if user_id:
            query = query.eq("user_id", user_id)
        if habit_id:
            query = query.eq("habit_id", habit_id)
        if start_date:
            query = query.gte("completed_date", start_date.isoformat())
        if end_date:
            query = query.lte("completed_date", end_date.isoformat())
        
        response = query.execute()
        results = response.data
        
        # Ensure date fields are serialized as strings
        from datetime import date as date_type, datetime
        for result in results:
            if 'completed_date' in result and isinstance(result['completed_date'], date_type):
                result['completed_date'] = result['completed_date'].isoformat()
            if 'completed_at' in result and isinstance(result['completed_at'], datetime):
                result['completed_at'] = result['completed_at'].isoformat()
        
        return results
    
    def get_completion(self, completion_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific completion"""
        if self.mock_mode:
            if not hasattr(self, 'mock_completions'):
                return None
            return next((c for c in self.mock_completions if c["id"] == completion_id), None)
        
        response = self.client.table("habit_completions").select("*").eq("id", completion_id).execute()
        result = response.data[0] if response.data else None
        
        # Ensure date fields are serialized as strings
        if result:
            from datetime import date as date_type, datetime
            if 'completed_date' in result and isinstance(result['completed_date'], date_type):
                result['completed_date'] = result['completed_date'].isoformat()
            if 'completed_at' in result and isinstance(result['completed_at'], datetime):
                result['completed_at'] = result['completed_at'].isoformat()
        
        return result
    
    def delete_completion(self, completion_id: int) -> bool:
        """Delete a completion"""
        if self.mock_mode:
            if not hasattr(self, 'mock_completions'):
                return False
            self.mock_completions = [c for c in self.mock_completions if c["id"] != completion_id]
            return True
        
        self.client.table("habit_completions").delete().eq("id", completion_id).execute()
        return True
    
    # Legacy method for backward compatibility
    def complete_habit(self, completion_data: Dict[str, Any]) -> Dict[str, Any]:
        """Legacy method - creates a completion record"""
        return self.create_completion(completion_data)
    
    def create_log(self, log_data: Dict[str, Any]) -> Dict[str, Any]:
        """Legacy method - converts to completion format"""
        completion_data = {
            "habit_id": log_data.get("habit_id"),
            "actual_duration": log_data.get("actual_duration"),
            "mood_before": log_data.get("mood_before"),
            "mood_after": log_data.get("mood_after"),
            "energy_level_before": log_data.get("energy_level"),
            "energy_level_after": log_data.get("energy_level"),
            "notes": log_data.get("notes"),
            "user_id": log_data.get("user_id", "default_user")
        }
        return self.create_completion(completion_data)
    
    def get_logs(
        self,
        habit_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        """Legacy method - maps to get_completions"""
        completions = self.get_completions(habit_id=habit_id, start_date=start_date, end_date=end_date)
        # Map completion format to legacy log format
        logs = []
        for c in completions:
            logs.append({
                "id": c.get("id"),
                "habit_id": c.get("habit_id"),
                "started_at": None,
                "completed_at": c.get("completed_at"),
                "actual_duration": c.get("actual_duration"),
                "time_of_day": c.get("time_of_day_id"),
                "mood_before": c.get("mood_before"),
                "mood_after": c.get("mood_after"),
                "energy_level": c.get("energy_level_after"),
                "notes": c.get("notes"),
                "is_successful": True,
                "created_at": c.get("completed_at")
            })
        return logs
    
    def get_log_stats(self, user_id: str) -> Dict[str, Any]:
        """Get statistics about completions"""
        completions = self.get_completions()
        habits = self.get_habits(user_id)
        
        return {
            "total_logs": len(completions),
            "total_habits": len(habits),
            "logs_this_week": len([c for c in completions if self._is_this_week(c.get("created_at"))])
        }
    
    def _is_this_week(self, date_str: str) -> bool:
        """Check if date is in current week"""
        dt = datetime.fromisoformat(date_str.replace('Z', ''))
        now = datetime.now()
        week_start = now - timedelta(days=now.weekday())
        return dt >= week_start
    
    # ========================================================================
    # AVAILABILITY
    # ========================================================================
    
    def create_availability(self, availability_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create availability slot"""
        if self.mock_mode:
            avail = {**availability_data, "id": self.next_id}
            self.mock_availability.append(avail)
            self.next_id += 1
            return avail
        
        response = self.client.table("user_availability").insert(availability_data).execute()
        return response.data[0]
    
    def get_availability(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user availability"""
        if self.mock_mode:
            return [a for a in self.mock_availability if a.get("user_id") == user_id]
        
        response = self.client.table("user_availability").select("*").eq("user_id", user_id).execute()
        return response.data
    
    # ========================================================================
    # FIXED EVENTS (Phase 2)
    # ========================================================================
    
    def create_fixed_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a fixed event"""
        if self.mock_mode:
            event = {**event_data, "id": self.next_id, "created_at": datetime.now().isoformat(), "is_active": True}
            if not hasattr(self, 'mock_fixed_events'):
                self.mock_fixed_events = []
            self.mock_fixed_events.append(event)
            self.next_id += 1
            return event
        
        response = self.client.table("fixed_events").insert(event_data).execute()
        return response.data[0]
    
    def get_fixed_events(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all fixed events for a user"""
        if self.mock_mode:
            if not hasattr(self, 'mock_fixed_events'):
                self.mock_fixed_events = []
            return [e for e in self.mock_fixed_events if e.get("user_id") == user_id and e.get("is_active", True)]
        
        response = self.client.table("fixed_events").select("*").eq("user_id", user_id).eq("is_active", True).execute()
        return response.data
    
    def get_fixed_event(self, event_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific fixed event"""
        if self.mock_mode:
            if not hasattr(self, 'mock_fixed_events'):
                return None
            return next((e for e in self.mock_fixed_events if e["id"] == event_id), None)
        
        response = self.client.table("fixed_events").select("*").eq("id", event_id).execute()
        return response.data[0] if response.data else None
    
    def update_fixed_event(self, event_id: int, event_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a fixed event"""
        if self.mock_mode:
            if not hasattr(self, 'mock_fixed_events'):
                return None
            for i, e in enumerate(self.mock_fixed_events):
                if e["id"] == event_id:
                    self.mock_fixed_events[i] = {**e, **event_data, "updated_at": datetime.now().isoformat()}
                    return self.mock_fixed_events[i]
            return None
        
        response = self.client.table("fixed_events").update(event_data).eq("id", event_id).execute()
        return response.data[0] if response.data else None
    
    def delete_fixed_event(self, event_id: int) -> bool:
        """Delete a fixed event"""
        if self.mock_mode:
            if not hasattr(self, 'mock_fixed_events'):
                return False
            self.mock_fixed_events = [e for e in self.mock_fixed_events if e["id"] != event_id]
            return True
        
        self.client.table("fixed_events").delete().eq("id", event_id).execute()
        return True
    
    # ========================================================================
    # TIMETABLE SLOTS (Phase 2)
    # ========================================================================
    
    def create_timetable_slot(self, slot_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a timetable slot"""
        if self.mock_mode:
            slot = {
                **slot_data,
                "id": self.next_id,
                "created_at": datetime.now().isoformat(),
                "is_completed": False
            }
            if not hasattr(self, 'mock_timetable_slots'):
                self.mock_timetable_slots = []
            self.mock_timetable_slots.append(slot)
            self.next_id += 1
            return slot
        
        response = self.client.table("timetable_slots").insert(slot_data).execute()
        return response.data[0]
    
    def get_timetable_slots(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all timetable slots for a user"""
        if self.mock_mode:
            if not hasattr(self, 'mock_timetable_slots'):
                self.mock_timetable_slots = []
            return [s for s in self.mock_timetable_slots if s.get("user_id") == user_id]
        
        response = self.client.table("timetable_slots").select("*").eq("user_id", user_id).execute()
        return response.data
    
    def get_timetable_slot(self, slot_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific timetable slot"""
        if self.mock_mode:
            if not hasattr(self, 'mock_timetable_slots'):
                return None
            return next((s for s in self.mock_timetable_slots if s["id"] == slot_id), None)
        
        response = self.client.table("timetable_slots").select("*").eq("id", slot_id).execute()
        return response.data[0] if response.data else None
    
    def update_timetable_slot(self, slot_id: int, slot_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a timetable slot"""
        if self.mock_mode:
            if not hasattr(self, 'mock_timetable_slots'):
                return None
            for i, s in enumerate(self.mock_timetable_slots):
                if s["id"] == slot_id:
                    self.mock_timetable_slots[i] = {**s, **slot_data, "updated_at": datetime.now().isoformat()}
                    return self.mock_timetable_slots[i]
            return None
        
        response = self.client.table("timetable_slots").update(slot_data).eq("id", slot_id).execute()
        return response.data[0] if response.data else None
    
    def delete_timetable_slot(self, slot_id: int) -> bool:
        """Delete a timetable slot"""
        if self.mock_mode:
            if not hasattr(self, 'mock_timetable_slots'):
                return False
            self.mock_timetable_slots = [s for s in self.mock_timetable_slots if s["id"] != slot_id]
            return True
        
        self.client.table("timetable_slots").delete().eq("id", slot_id).execute()
        return True
    
    # ========================================================================
    # TIMETABLE VERSIONS
    # ========================================================================
    
    def get_latest_timetable_version(self, user_id: str) -> int:
        """Get the latest version number for user's timetable"""
        if self.mock_mode:
            if not hasattr(self, 'mock_timetable_versions'):
                self.mock_timetable_versions = []
            versions = [v["version_number"] for v in self.mock_timetable_versions if v.get("user_id") == user_id]
            return max(versions) if versions else 0
        
        response = self.client.table("timetable_versions").select("version_number").eq("user_id", user_id).order("version_number", desc=True).limit(1).execute()
        return response.data[0]["version_number"] if response.data else 0
    
    def save_timetable_version(
        self,
        user_id: str,
        version_number: int,
        slots: List[Dict],
        conflicts: List[Dict]
    ) -> Dict[str, Any]:
        """Save a timetable version"""
        version_data = {
            "user_id": user_id,
            "version_number": version_number,
            "generation_reason": "manual",
            "total_habits": len(set(s.get("habit_id") for s in slots if s.get("habit_id"))),
            "total_slots": len(slots),
            "conflicts_count": len(conflicts),
            "timetable_data": {"slots": slots, "conflicts": conflicts},
            "is_active": True
        }
        
        if self.mock_mode:
            if not hasattr(self, 'mock_timetable_versions'):
                self.mock_timetable_versions = []
            version = {**version_data, "id": self.next_id, "created_at": datetime.now().isoformat()}
            self.mock_timetable_versions.append(version)
            self.next_id += 1
            return version
        
        response = self.client.table("timetable_versions").insert(version_data).execute()
        return response.data[0]
    
    # ========================================================================
    # LOG HELPERS (Legacy compatibility)
    # ========================================================================
    
    def get_log(self, log_id: int) -> Optional[Dict[str, Any]]:
        """Legacy method - maps to get_completion"""
        return self.get_completion(log_id)
    
    def update_log(self, log_id: int, log_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Legacy method - maps to update_completion"""
        completion_data = {
            "actual_duration": log_data.get("actual_duration"),
            "mood_before": log_data.get("mood_before"),
            "mood_after": log_data.get("mood_after"),
            "energy_level_before": log_data.get("energy_level"),
            "energy_level_after": log_data.get("energy_level"),
            "notes": log_data.get("notes")
        }
        completion_data = {k: v for k, v in completion_data.items() if v is not None}
        
        if self.mock_mode:
            if not hasattr(self, 'mock_completions'):
                return None
            for i, c in enumerate(self.mock_completions):
                if c["id"] == log_id:
                    self.mock_completions[i] = {**c, **completion_data}
                    return self.mock_completions[i]
            return None
        
        response = self.client.table("habit_completions").update(completion_data).eq("id", log_id).execute()
        return response.data[0] if response.data else None

    # ========================================================================
    # DAYS RELATIONSHIP HELPERS
    # ========================================================================
    
    def _get_habit_days(self, habit_id: int) -> List[str]:
        """Get list of day names for a habit"""
        if self.mock_mode:
            habit = next((h for h in self.mock_habits if h["id"] == habit_id), None)
            return habit.get("days", []) if habit else []
        
        try:
            # Map day IDs to names
            day_id_to_name = {
                1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu',
                5: 'Fri', 6: 'Sat', 7: 'Sun'
            }
            
            # Query days_habits table
            response = self.client.table("days_habits")\
                .select("day_id")\
                .eq("habit_id", habit_id)\
                .execute()
            
            if response.data:
                return [day_id_to_name[item['day_id']] for item in response.data if item['day_id'] in day_id_to_name]
            return []
        except Exception as e:
            print(f"Error fetching habit days: {e}")
            return []
    
    def _link_habit_days(self, habit_id: int, days_list: List[str]) -> None:
        """Link a habit to specific days"""
        if self.mock_mode:
            return
        
        try:
            # Map day names to IDs
            day_name_to_id = {
                'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4,
                'Fri': 5, 'Sat': 6, 'Sun': 7
            }
            
            # Delete existing relationships
            self.client.table("days_habits").delete().eq("habit_id", habit_id).execute()
            
            # Insert new relationships
            if days_list:
                relationships = [
                    {"habit_id": habit_id, "day_id": day_name_to_id[day]}
                    for day in days_list if day in day_name_to_id
                ]
                if relationships:
                    self.client.table("days_habits").insert(relationships).execute()
        except Exception as e:
            print(f"Error linking habit days: {e}")
    
    # ========================================================================
    # TIMES OF DAY RELATIONSHIP HELPERS
    # ========================================================================
    
    def _get_habit_times_of_day(self, habit_id: int) -> List[str]:
        """Get list of time of day names for a habit"""
        if self.mock_mode:
            habit = next((h for h in self.mock_habits if h["id"] == habit_id), None)
            return habit.get("times_of_day", []) if habit else []
        
        try:
            # Map time of day IDs to names
            time_id_to_name = {
                1: 'morning',
                2: 'noon',
                3: 'afternoon',
                4: 'night'
            }
            
            # Query times_of_day_habits table
            response = self.client.table("times_of_day_habits")\
                .select("time_of_day_id")\
                .eq("habit_id", habit_id)\
                .execute()
            
            if response.data:
                return [time_id_to_name[item['time_of_day_id']] for item in response.data if item['time_of_day_id'] in time_id_to_name]
            return []
        except Exception as e:
            print(f"Error fetching habit times of day: {e}")
            return []
    
    def _link_habit_times_of_day(self, habit_id: int, times_of_day_list: List[str]) -> None:
        """Link a habit to specific times of day"""
        if self.mock_mode:
            return
        
        try:
            # Map time of day names to IDs
            time_name_to_id = {
                'morning': 1,
                'noon': 2,
                'afternoon': 3,
                'night': 4
            }
            
            # Delete existing relationships
            self.client.table("times_of_day_habits").delete().eq("habit_id", habit_id).execute()
            
            # Insert new relationships
            if times_of_day_list:
                relationships = [
                    {"habit_id": habit_id, "time_of_day_id": time_name_to_id[time]}
                    for time in times_of_day_list if time in time_name_to_id
                ]
                if relationships:
                    self.client.table("times_of_day_habits").insert(relationships).execute()
        except Exception as e:
            print(f"Error linking habit times of day: {e}")
    
    def get_schedule(self, user_id: str) -> Dict[str, Any]:
        """Get user's schedule (legacy method for compatibility)"""
        return {"habits": self.get_habits(user_id)}

    
    # ========================================================================
    # DAILY CAPACITY PREFERENCES
    # ========================================================================
    
    def get_daily_capacities(self, user_id: str) -> Dict[str, int]:
        """
        Get user's daily capacity preferences
        Returns dict mapping day name to capacity in minutes
        If no preferences set, returns defaults
        """
        if self.mock_mode:
            if not hasattr(self, 'mock_capacities'):
                self.mock_capacities = []
            user_capacities = [c for c in self.mock_capacities if c.get("user_id") == user_id]
        else:
            response = self.client.table("daily_capacity_preferences").select("*").eq("user_id", user_id).execute()
            user_capacities = response.data
        
        # Convert to dict
        capacity_dict = {}
        for cap in user_capacities:
            capacity_dict[cap['day_of_week']] = cap['capacity_minutes']
        
        # Fill in defaults for missing days
        defaults = {
            'Mon': 120, 'Tue': 120, 'Wed': 120, 'Thu': 120, 'Fri': 120,
            'Sat': 180, 'Sun': 180
        }
        
        for day, default_capacity in defaults.items():
            if day not in capacity_dict:
                capacity_dict[day] = default_capacity
        
        return capacity_dict
    
    def set_daily_capacity(self, user_id: str, day_of_week: str, capacity_minutes: int) -> Dict[str, Any]:
        """
        Set capacity for a specific day
        Uses upsert to update if exists, insert if not
        """
        capacity_data = {
            'user_id': user_id,
            'day_of_week': day_of_week,
            'capacity_minutes': capacity_minutes,
            'updated_at': datetime.now().isoformat()
        }
        
        if self.mock_mode:
            if not hasattr(self, 'mock_capacities'):
                self.mock_capacities = []
            
            # Find existing
            existing = next((c for c in self.mock_capacities 
                           if c['user_id'] == user_id and c['day_of_week'] == day_of_week), None)
            
            if existing:
                existing.update(capacity_data)
                return existing
            else:
                capacity_data['id'] = self.next_id
                capacity_data['created_at'] = datetime.now().isoformat()
                self.mock_capacities.append(capacity_data)
                self.next_id += 1
                return capacity_data
        
        # Upsert in Supabase
        response = self.client.table("daily_capacity_preferences").upsert(
            capacity_data,
            on_conflict='user_id,day_of_week'
        ).execute()
        
        return response.data[0] if response.data else None
    
    def set_all_daily_capacities(self, user_id: str, capacities: Dict[str, int]) -> List[Dict[str, Any]]:
        """
        Set capacities for all days at once
        """
        results = []
        
        for day, capacity in capacities.items():
            result = self.set_daily_capacity(user_id, day, capacity)
            if result:
                results.append(result)
        
        return results
    
    def delete_daily_capacity(self, user_id: str, day_of_week: str) -> bool:
        """Delete a daily capacity preference (will revert to default)"""
        if self.mock_mode:
            if not hasattr(self, 'mock_capacities'):
                return False
            
            initial_len = len(self.mock_capacities)
            self.mock_capacities = [c for c in self.mock_capacities 
                                   if not (c['user_id'] == user_id and c['day_of_week'] == day_of_week)]
            return len(self.mock_capacities) < initial_len
        
        response = self.client.table("daily_capacity_preferences").delete().eq(
            "user_id", user_id
        ).eq("day_of_week", day_of_week).execute()
        
        return len(response.data) > 0


    # ========================================================================
    # UNLOCKED REWARDS
    # ========================================================================
    
    def save_unlocked_reward(self, reward_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save an unlocked reward"""
        if self.mock_mode:
            reward_data['id'] = self.next_id
            self.next_id += 1
            if not hasattr(self, 'mock_rewards'):
                self.mock_rewards = []
            self.mock_rewards.append(reward_data)
            return reward_data
        
        try:
            result = self.client.table('unlocked_rewards').insert(reward_data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error saving unlocked reward: {e}")
            return None
    
    def get_unlocked_rewards(self, user_id: str, reward_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get user's unlocked rewards, optionally filtered by type"""
        if self.mock_mode:
            if not hasattr(self, 'mock_rewards'):
                self.mock_rewards = []
            rewards = [r for r in self.mock_rewards if r.get('user_id') == user_id]
            if reward_type:
                rewards = [r for r in rewards if r.get('reward_type') == reward_type]
            return rewards
        
        try:
            query = self.client.table('unlocked_rewards').select('*').eq('user_id', user_id)
            if reward_type:
                query = query.eq('reward_type', reward_type)
            result = query.order('unlocked_at', desc=True).execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error getting unlocked rewards: {e}")
            return []
    
    def check_reward_unlocked(self, user_id: str, achievement_type: str) -> bool:
        """Check if user has already unlocked this achievement type"""
        if self.mock_mode:
            if not hasattr(self, 'mock_rewards'):
                return False
            return any(r.get('user_id') == user_id and r.get('achievement_type') == achievement_type 
                      for r in self.mock_rewards)
        
        try:
            result = self.client.table('unlocked_rewards')\
                .select('id')\
                .eq('user_id', user_id)\
                .eq('achievement_type', achievement_type)\
                .limit(1)\
                .execute()
            return len(result.data) > 0 if result.data else False
        except Exception as e:
            print(f"Error checking reward: {e}")
            return False


    # ========================================================================
    # BOBO CUSTOMIZATIONS
    # ========================================================================
    
    def get_equipped_customizations(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's equipped Bobo customizations"""
        if self.mock_mode:
            if not hasattr(self, 'mock_equipped'):
                self.mock_equipped = {}
            equipped = self.mock_equipped.get(user_id)
            print(f"[MOCK] Retrieved equipped customizations for {user_id}: {equipped}")
            return equipped
        
        try:
            print(f"[DB] Fetching equipped customizations for {user_id}")
            result = self.client.table('bobo_equipped')\
                .select('*')\
                .eq('user_id', user_id)\
                .limit(1)\
                .execute()
            
            print(f"[DB] Query result: {result.data}")
            
            if result.data and len(result.data) > 0:
                equipped = {
                    'hat': result.data[0].get('hat'),
                    'costume': result.data[0].get('costume'),
                    'dance': result.data[0].get('dance'),
                    'color': result.data[0].get('color')
                }
                print(f"[DB] Returning equipped: {equipped}")
                return equipped
            print(f"[DB] No equipped customizations found for {user_id}")
            return None
        except Exception as e:
            print(f"[DB] Error getting equipped customizations: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def save_equipped_customizations(self, user_id: str, customizations: Dict[str, Any]) -> Dict[str, Any]:
        """Save user's equipped Bobo customizations"""
        if self.mock_mode:
            if not hasattr(self, 'mock_equipped'):
                self.mock_equipped = {}
            self.mock_equipped[user_id] = customizations
            print(f"[MOCK] Saved equipped customizations for {user_id}: {customizations}")
            return customizations
        
        try:
            # Upsert (insert or update)
            data = {
                'user_id': user_id,
                'hat': customizations.get('hat'),
                'costume': customizations.get('costume'),
                'dance': customizations.get('dance'),
                'color': customizations.get('color')
            }
            
            print(f"[DB] Saving equipped customizations for {user_id}: {data}")
            result = self.client.table('bobo_equipped').upsert(data).execute()
            print(f"[DB] Save result: {result.data}")
            return result.data[0] if result.data else customizations
        except Exception as e:
            print(f"[DB] Error saving equipped customizations: {e}")
            import traceback
            traceback.print_exc()
            return customizations


    # ========================================================================
    # BOBO ITEMS (Individual customizations)
    # ========================================================================
    
    def save_bobo_item(self, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save an individual Bobo item (hat, costume, dance, color)"""
        if self.mock_mode:
            if not hasattr(self, 'mock_bobo_items'):
                self.mock_bobo_items = []
            item_data['id'] = self.next_id
            self.next_id += 1
            self.mock_bobo_items.append(item_data)
            print(f"[MOCK] Saved bobo item: {item_data}")
            return item_data
        
        try:
            print(f"[DB] Attempting to save bobo item: {item_data}")
            result = self.client.table('bobo_items').insert(item_data).execute()
            print(f"[DB] Save result: {result}")
            if result.data:
                print(f"[DB] Successfully saved: {result.data[0]}")
                return result.data[0]
            else:
                print(f"[DB] No data returned from insert")
                return None
        except Exception as e:
            print(f"[DB] Error saving bobo item: {e}")
            print(f"[DB] Error type: {type(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def get_bobo_items(self, user_id: str, item_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get user's unlocked Bobo items, optionally filtered by type"""
        if self.mock_mode:
            if not hasattr(self, 'mock_bobo_items'):
                self.mock_bobo_items = []
            items = [i for i in self.mock_bobo_items if i.get('user_id') == user_id]
            if item_type:
                items = [i for i in items if i.get('item_type') == item_type]
            return items
        
        try:
            query = self.client.table('bobo_items').select('*').eq('user_id', user_id)
            if item_type:
                query = query.eq('item_type', item_type)
            result = query.order('unlocked_at', desc=True).execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error getting bobo items: {e}")
            return []
    
    def check_bobo_item_unlocked(self, user_id: str, item_type: str, item_id: str) -> bool:
        """Check if user has unlocked a specific Bobo item"""
        if self.mock_mode:
            if not hasattr(self, 'mock_bobo_items'):
                return False
            return any(
                i.get('user_id') == user_id and 
                i.get('item_type') == item_type and 
                i.get('item_id') == item_id 
                for i in self.mock_bobo_items
            )
        
        try:
            result = self.client.table('bobo_items')\
                .select('id')\
                .eq('user_id', user_id)\
                .eq('item_type', item_type)\
                .eq('item_id', item_id)\
                .limit(1)\
                .execute()
            return len(result.data) > 0 if result.data else False
        except Exception as e:
            print(f"Error checking bobo item: {e}")
            return False
