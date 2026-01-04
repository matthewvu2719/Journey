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
            
            # For atomic habits, set estimated_duration to null
            if habit_data.get('habit_type') == 'atomic':
                habit['estimated_duration'] = None
                
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
        
        # Filter fields but allow 0 values for estimated_duration
        filtered_data = {}
        for k, v in habit_data.items():
            if k in allowed_fields:
                # Allow None and 0 values for estimated_duration, filter None for others
                if k == 'estimated_duration' or v is not None:
                    filtered_data[k] = v
        
        # For atomic habits, set estimated_duration to null
        if habit_data.get('habit_type') == 'atomic':
            filtered_data['estimated_duration'] = None
        
        try:
            # Insert habit
            response = self.client.table("habits").insert(filtered_data).execute()
            habit = response.data[0]
            
            # Batch the relationship insertions for better performance
            if days_list or times_of_day_list:
                try:
                    # Prepare all relationships at once
                    all_operations = []
                    
                    # Days relationships
                    if days_list:
                        day_name_to_id = {
                            'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4,
                            'Fri': 5, 'Sat': 6, 'Sun': 7
                        }
                        day_relationships = [
                            {"habit_id": habit['id'], "day_id": day_name_to_id[day]}
                            for day in days_list if day in day_name_to_id
                        ]
                        if day_relationships:
                            self.client.table("days_habits").insert(day_relationships).execute()
                        habit['days'] = days_list
                    
                    # Times of day relationships
                    if times_of_day_list:
                        time_name_to_id = {
                            'morning': 1, 'noon': 2, 'afternoon': 3, 'night': 4
                        }
                        time_relationships = [
                            {"habit_id": habit['id'], "time_of_day_id": time_name_to_id[time]}
                            for time in times_of_day_list if time in time_name_to_id
                        ]
                        if time_relationships:
                            self.client.table("times_of_day_habits").insert(time_relationships).execute()
                        habit['times_of_day'] = times_of_day_list
                        
                except Exception as e:
                    print(f"Warning: Could not link relationships: {e}")
                    # Still return the data even if linking fails
                    if days_list:
                        habit['days'] = days_list
                    if times_of_day_list:
                        habit['times_of_day'] = times_of_day_list
            
            return habit
        except Exception as e:
            print(f"Error creating habit: {e}")
            raise
    
    def get_habits(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all habits for a user with their associated days and times_of_day - optimized version"""
        if self.mock_mode:
            return [h for h in self.mock_habits if h.get("user_id") == user_id]
        
        # Use regular Supabase queries for better reliability
        try:
            response = self.client.table("habits").select("*").eq("user_id", user_id).execute()
            habits = response.data
            
            if not habits:
                return []
            
            # Batch fetch days for all habits
            habit_ids = [h['id'] for h in habits]
            
            try:
                # Fetch all days relationships in one query
                days_response = self.client.table("days_habits").select("habit_id, day_id").in_("habit_id", habit_ids).execute()
                days_map = {}
                day_id_to_name = {1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun'}
                
                for item in days_response.data:
                    habit_id = item['habit_id']
                    day_name = day_id_to_name.get(item['day_id'])
                    if day_name:
                        if habit_id not in days_map:
                            days_map[habit_id] = []
                        days_map[habit_id].append(day_name)
                
                # Assign days to habits
                for habit in habits:
                    habit['days'] = days_map.get(habit['id'], [])
                    
            except Exception as e:
                print(f"Warning: Could not batch fetch days: {e}")
                for habit in habits:
                    habit['days'] = []
            
            try:
                # Fetch all times_of_day relationships in one query
                times_response = self.client.table("times_of_day_habits").select("habit_id, time_of_day_id").in_("habit_id", habit_ids).execute()
                times_map = {}
                time_id_to_name = {1: 'morning', 2: 'noon', 3: 'afternoon', 4: 'night'}
                
                for item in times_response.data:
                    habit_id = item['habit_id']
                    time_name = time_id_to_name.get(item['time_of_day_id'])
                    if time_name:
                        if habit_id not in times_map:
                            times_map[habit_id] = []
                        times_map[habit_id].append(time_name)
                
                # Assign times_of_day to habits
                for habit in habits:
                    habit['times_of_day'] = times_map.get(habit['id'], [])
                    
            except Exception as e:
                print(f"Warning: Could not batch fetch times of day: {e}")
                for habit in habits:
                    habit['times_of_day'] = []
            
            return habits
            
        except Exception as e:
            print(f"Fallback get_habits also failed: {e}")
            return []
    
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
    
    def update_habit_schedule(self, habit_id: int, user_id: str, new_time: str = None, new_days: List[int] = None, reason: str = "User requested") -> bool:
        """Update habit scheduling information"""
        try:
            # Prepare update data
            update_data = {}
            
            if new_time:
                # Map time strings to time_of_day_id if needed
                time_map = {"morning": 1, "noon": 2, "afternoon": 3, "night": 4}
                if new_time.lower() in time_map:
                    update_data["time_of_day_id"] = time_map[new_time.lower()]
                else:
                    # Assume it's a specific time like "07:00"
                    update_data["preferred_time"] = new_time
            
            if new_days is not None:
                # Convert day numbers to day names if needed
                day_names = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
                if all(isinstance(day, int) and 0 <= day <= 6 for day in new_days):
                    update_data["days_of_week"] = [day_names[day] for day in new_days]
                else:
                    update_data["days_of_week"] = new_days
            
            # Add metadata
            update_data["last_modified"] = datetime.now().isoformat()
            update_data["reschedule_reason"] = reason
            
            # Update the habit
            if self.mock_mode:
                for i, h in enumerate(self.mock_habits):
                    if h["id"] == habit_id and h.get("user_id") == user_id:
                        self.mock_habits[i] = {**h, **update_data}
                        return True
                return False
            
            response = self.client.table("habits").update(update_data).eq("id", habit_id).eq("user_id", user_id).execute()
            return len(response.data) > 0
            
        except Exception as e:
            print(f"Error updating habit schedule: {e}")
            return False
    
    def delete_habit(self, habit_id: int) -> bool:
        """Delete a habit"""
        if self.mock_mode:
            self.mock_habits = [h for h in self.mock_habits if h["id"] != habit_id]
            return True
        
        self.client.table("habits").delete().eq("id", habit_id).execute()
        return True

    # ========================================================================
    # HABIT BREAKDOWN METHODS (TWO-TABLE ARCHITECTURE)
    # ========================================================================

    def create_habit_breakdown(self, habit_id: int, subtasks: list[str], user_id: str, preserve_original: bool = False) -> dict:
        """
        Creates a breakdown session for a habit and stores each subtask as a row in
        public.habit_breakdown_subtasks (NOT in public.habits).

        This implementation does NOT rely on Postgres RPC return types and does NOT
        write any `subtask_ids` column to `habit_breakdowns` (because it doesn't exist).

        Returns:
            {
              "breakdown_session_id": "<uuid str>",
              "original_habit_id": habit_id,
              "created_at": "<timestamp>",
              "subtask_ids": [1,2,3]
            }
        """
        print(f"[DEBUG] create_habit_breakdown called: habit_id={habit_id}, user_id={user_id}, subtasks={subtasks}, preserve_original={preserve_original}")
        
        if not subtasks or not isinstance(subtasks, list):
            print(f"[DEBUG] ERROR: Invalid subtasks parameter: {subtasks}")
            raise ValueError("subtasks must be a non-empty list of strings")

        # 1) Create the breakdown session (let DB generate UUID by default)
        print(f"[DEBUG] Step 1: Creating breakdown session in habit_breakdowns table...")
        try:
            # Insert and get the result - Supabase returns inserted data by default
            session_res = (
                self.client.table("habit_breakdowns")
                .insert({
                    "original_habit_id": habit_id,
                    "user_id": user_id,
                    "preserve_original": preserve_original,
                })
                .execute()
            )
            print(f"[DEBUG] Step 1 SUCCESS: session_res.data = {session_res.data}")
        except Exception as e:
            print(f"[DEBUG] Step 1 FAILED: Error creating breakdown session: {e}")
            print(f"[DEBUG] Error type: {type(e).__name__}")
            print(f"[DEBUG] Error details: {getattr(e, 'message', str(e))}")
            raise

        if not session_res.data or len(session_res.data) == 0:
            print(f"[DEBUG] ERROR: session_res.data is empty/None")
            raise Exception("Failed to create breakdown session")

        session_id = session_res.data[0]["breakdown_session_id"]
        created_at = session_res.data[0].get("created_at")
        print(f"[DEBUG] Session created: session_id={session_id}, created_at={created_at}")

        # 2) Insert subtasks as rows
        print(f"[DEBUG] Step 2: Preparing subtask rows...")
        rows = []
        for idx, name in enumerate(subtasks, start=1):
            if not isinstance(name, str) or not name.strip():
                print(f"[DEBUG] Skipping invalid subtask at index {idx}: {name}")
                continue
            rows.append(
                {
                    "breakdown_session_id": session_id,
                    "name": name.strip(),
                    "description": f"Subtask {idx} of breakdown",
                    "breakdown_order": idx,
                    "estimated_duration": 15,
                }
            )
        print(f"[DEBUG] Prepared {len(rows)} subtask rows: {rows}")

        if not rows:
            # rollback session if no valid rows
            print(f"[DEBUG] ERROR: No valid subtask rows, rolling back session...")
            self.client.table("habit_breakdowns").delete().eq("breakdown_session_id", session_id).execute()
            raise ValueError("No valid subtask names provided")

        print(f"[DEBUG] Step 2: Inserting subtasks into habit_breakdown_subtasks table...")
        try:
            subtasks_res = (
                self.client.table("habit_breakdown_subtasks")
                .insert(rows)
                .execute()
            )
            print(f"[DEBUG] Step 2 SUCCESS: subtasks_res.data = {subtasks_res.data}")
        except Exception as e:
            print(f"[DEBUG] Step 2 FAILED: Error inserting subtasks: {e}")
            print(f"[DEBUG] Error type: {type(e).__name__}")
            # Rollback the session
            print(f"[DEBUG] Rolling back session {session_id}...")
            self.client.table("habit_breakdowns").delete().eq("breakdown_session_id", session_id).execute()
            raise

        #subtask_ids = [r["id"] for r in (subtasks_res.data or []) if "id" in r]
        #print(f"[DEBUG] Extracted subtask_ids: {subtask_ids}")

        # 3) Update the original habit to point to the active session
        print(f"[DEBUG] Step 3: Updating original habit {habit_id}...")
        update_payload = {"active_breakdown_session_id": session_id}
        if not preserve_original:
            update_payload["is_active"] = False
        print(f"[DEBUG] Update payload: {update_payload}")

        try:
            self.client.table("habits").update(update_payload).eq("id", habit_id).execute()
            print(f"[DEBUG] Step 3 SUCCESS: Habit updated")
        except Exception as e:
            print(f"[DEBUG] Step 3 FAILED: Error updating habit: {e}")
            # Don't rollback here - the breakdown was created successfully
            print(f"[DEBUG] Warning: Breakdown created but habit not updated")

        result = {
            "breakdown_session_id": session_id,
            "original_habit_id": habit_id,
            "created_at": created_at,
            #"subtask_ids": subtask_ids,
            "can_rollback": True,
        }
        print(f"[DEBUG] create_habit_breakdown SUCCESS: returning {result}")
        return result

    def get_habit_breakdowns(self, habit_id: int) -> Dict[str, Any]:
        """Get all (active) breakdown subtasks for a habit."""
        if self.mock_mode:
            if not hasattr(self, 'mock_breakdown_sessions'):
                self.mock_breakdown_sessions = []
            if not hasattr(self, 'mock_breakdown_subtasks'):
                self.mock_breakdown_subtasks = []

            active_sessions = [s for s in self.mock_breakdown_sessions if s['original_habit_id'] == habit_id and s.get('rolled_back_at') is None]
            session_ids = {s['breakdown_session_id'] for s in active_sessions}
            subtasks = [t for t in self.mock_breakdown_subtasks if t['breakdown_session_id'] in session_ids]
            subtasks.sort(key=lambda x: (x['breakdown_session_id'], x.get('breakdown_order') or 0))
            return {'breakdowns': subtasks, 'total_subtasks': len(subtasks), 'habit_id': habit_id}

        try:
            res = self.client.rpc('get_habit_subtasks', {'p_habit_id': habit_id}).execute()
            subtasks = res.data or []
            return {'breakdowns': subtasks, 'total_subtasks': len(subtasks), 'habit_id': habit_id}
        except Exception as e:
            print(f"Error getting habit breakdowns: {e}")
            return {'breakdowns': [], 'total_subtasks': 0, 'habit_id': habit_id}

    def get_habit_breakdown(self, breakdown_session_id: str) -> Optional[Dict[str, Any]]:
        """Get breakdown session metadata + subtasks."""
        if self.mock_mode:
            if not hasattr(self, 'mock_breakdown_sessions'):
                self.mock_breakdown_sessions = []
            if not hasattr(self, 'mock_breakdown_subtasks'):
                self.mock_breakdown_subtasks = []

            session = next((s for s in self.mock_breakdown_sessions if s['breakdown_session_id'] == breakdown_session_id), None)
            if not session:
                return None
            subtasks = [t for t in self.mock_breakdown_subtasks if t['breakdown_session_id'] == breakdown_session_id]
            subtasks.sort(key=lambda x: x.get('breakdown_order') or 0)
            return {**session, 'subtasks': subtasks}

        try:
            session_res = self.client.table('habit_breakdowns').select('*').eq('breakdown_session_id', breakdown_session_id).limit(1).execute()
            if not session_res.data:
                return None
            session = session_res.data[0]
            subtasks_res = self.client.rpc('get_breakdown_subtasks', {'p_session_id': breakdown_session_id}).execute()
            session['subtasks'] = subtasks_res.data or []
            return session
        except Exception as e:
            print(f"Error getting habit breakdown: {e}")
            return None

    def rollback_habit_breakdown(self, habit_id: int = None, breakdown_session_id: str = None, restore_original: bool = True) -> bool:
        """Rollback breakdown(s).

        - If breakdown_session_id is provided: rollback that session.
        - Else if habit_id is provided: rollback all active sessions for that habit.

        Note: DB function rollback_breakdown(p_session_id) always restores the original habit.
        The restore_original flag is kept for backward compatibility.
        """
        from datetime import datetime

        if self.mock_mode:
            if not hasattr(self, 'mock_breakdown_sessions'):
                self.mock_breakdown_sessions = []
            # rollback by session
            if breakdown_session_id:
                for s in self.mock_breakdown_sessions:
                    if s['breakdown_session_id'] == breakdown_session_id and s.get('rolled_back_at') is None:
                        s['rolled_back_at'] = datetime.now().isoformat()
                        return True
                return False
            # rollback by habit
            if habit_id is not None:
                changed = False
                for s in self.mock_breakdown_sessions:
                    if s['original_habit_id'] == habit_id and s.get('rolled_back_at') is None:
                        s['rolled_back_at'] = datetime.now().isoformat()
                        changed = True
                return changed
            return False

        try:
            if breakdown_session_id:
                res = self.client.rpc('rollback_breakdown', {'p_session_id': breakdown_session_id}).execute()
                return bool(res.data) if res.data is not None else False

            if habit_id is None:
                return False

            # Find active sessions for this habit
            sessions = self.client.table('habit_breakdowns').select('breakdown_session_id').eq('original_habit_id', habit_id).is_('rolled_back_at', 'null').execute()
            session_ids = [r['breakdown_session_id'] for r in (sessions.data or [])]
            if not session_ids:
                return False

            ok_any = False
            for sid in session_ids:
                try:
                    r = self.client.rpc('rollback_breakdown', {'p_session_id': sid}).execute()
                    ok_any = ok_any or bool(r.data)
                except Exception:
                    pass
            return ok_any

        except Exception as e:
            print(f"Error rolling back habit breakdown: {e}")
            return False

    def get_habit_subtasks(self, parent_habit_id: int) -> list[dict]:
        """
        Get subtasks for the *active* breakdown session of a habit, from
        public.habit_breakdown_subtasks.
        """
        if self.mock_mode:
            return []

        try:
            br = (
                self.client.table("habit_breakdowns")
                .select("breakdown_session_id")
                .eq("original_habit_id", parent_habit_id)
                .is_("rolled_back_at", "null")
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )

            if not br.data:
                return []

            session_id = br.data[0]["breakdown_session_id"]

            subs = (
                self.client.table("habit_breakdown_subtasks")
                .select("*")
                .eq("breakdown_session_id", session_id)
                .order("breakdown_order")
                .execute()
            )
            return subs.data or []
        except Exception as e:
            print(f"Error getting habit subtasks: {e}")
            return []

    def get_habit_with_subtasks(self, habit_id: int) -> Dict[str, Any]:
        """Get a habit with its breakdown subtasks (if any)."""
        habit = self.get_habit(habit_id)
        if not habit:
            return None
        habit['subtasks'] = self.get_habit_subtasks(habit_id)
        return habit


    
    
    def get_habits_for_today(self, user_id: str, time_of_day: Optional[str] = None, timezone_offset: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get habits scheduled for today, optionally filtered by time of day - optimized version"""
        from datetime import datetime, timedelta
        
        if self.mock_mode:
            # Use existing logic for mock mode
            # Calculate local time based on timezone offset
            if timezone_offset is not None:
                local_now = datetime.utcnow() + timedelta(minutes=timezone_offset)
            else:
                local_now = datetime.now()
            today = local_now.strftime('%a')
            all_habits = self.get_habits(user_id)
            
            today_habits = []
            for habit in all_habits:
                habit_days = habit.get('days', [])
                habit_times = habit.get('times_of_day', [])
                
                # Check if habit is scheduled for today
                if not habit_days:
                    is_today = True
                else:
                    is_today = today in habit_days
                
                # If filtering by time of day
                if time_of_day:
                    if not habit_times:
                        is_time_match = True
                    else:
                        is_time_match = time_of_day in habit_times
                else:
                    is_time_match = True
                
                if is_today and is_time_match:
                    today_habits.append(habit)
            
            return today_habits
        
        # Use fallback method for Supabase mode too (simpler and more reliable)
        # Calculate local time based on timezone offset
        if timezone_offset is not None:
            local_now = datetime.utcnow() + timedelta(minutes=timezone_offset)
        else:
            local_now = datetime.now()
        today = local_now.strftime('%a')
        all_habits = self.get_habits(user_id)
        
        today_habits = []
        for habit in all_habits:
            habit_days = habit.get('days', [])
            habit_times = habit.get('times_of_day', [])
            
            # Check if habit is scheduled for today
            if not habit_days:
                is_today = True
            else:
                is_today = today in habit_days
            
            # If filtering by time of day
            if time_of_day:
                if not habit_times:
                    is_time_match = True
                else:
                    is_time_match = time_of_day in habit_times
            else:
                is_time_match = True
            
            if is_today and is_time_match:
                today_habits.append(habit)
        
        return today_habits
    
    def get_habit_instances_for_today(self, user_id: str, time_of_day: Optional[str] = None, timezone_offset: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get habit instances for today - each time-of-day counts as separate instance"""
        from datetime import datetime, timedelta
        
        # Calculate local time based on timezone offset
        if timezone_offset is not None:
            local_now = datetime.utcnow() + timedelta(minutes=timezone_offset)
        else:
            local_now = datetime.now()
        today = local_now.strftime('%a')
        all_habits = self.get_habits(user_id)
        
        habit_instances = []
        for habit in all_habits:
            habit_days = habit.get('days', [])
            habit_times = habit.get('times_of_day', [])
            
            # Check if habit is scheduled for today
            if not habit_days:
                is_today = True
            else:
                is_today = today in habit_days
            
            if is_today:
                # If habit has no specific times, create one instance
                if not habit_times:
                    if not time_of_day:  # Only include if not filtering by time
                        habit_instances.append({
                            **habit,
                            'time_of_day': 'flexible',
                            'instance_id': f"{habit['id']}_flexible"
                        })
                else:
                    # Create instance for each time of day
                    for time_slot in habit_times:
                        if not time_of_day or time_of_day == time_slot:
                            habit_instances.append({
                                **habit,
                                'time_of_day': time_slot,
                                'instance_id': f"{habit['id']}_{time_slot}"
                            })
        
        return habit_instances

    def get_habits_for_date(self, user_id: str, target_date: str, timezone_offset: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get habits scheduled for a specific date (YYYY-MM-DD format)"""
        from datetime import datetime, timedelta
        
        try:
            # Parse the target date and get day of week
            target_datetime = datetime.fromisoformat(target_date)
            target_day = target_datetime.strftime('%a')
            
            all_habits = self.get_habits(user_id)
            
            date_habits = []
            for habit in all_habits:
                habit_days = habit.get('days', [])
                
                # Check if habit is scheduled for this day of week
                if not habit_days:
                    is_scheduled = True  # Daily habits
                else:
                    is_scheduled = target_day in habit_days
                
                if is_scheduled:
                    date_habits.append({
                        **habit,
                        'scheduled_date': target_date,
                        'day_of_week': target_day
                    })
            
            return date_habits
        except ValueError:
            return []  # Invalid date format

    def get_habit_instances_for_date(self, user_id: str, target_date: str, timezone_offset: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get habit instances for a specific date - each time-of-day counts as separate instance"""
        from datetime import datetime, timedelta
        
        try:
            # Parse the target date and get day of week
            target_datetime = datetime.fromisoformat(target_date)
            target_day = target_datetime.strftime('%a')
            
            all_habits = self.get_habits(user_id)
            
            habit_instances = []
            for habit in all_habits:
                habit_days = habit.get('days', [])
                habit_times = habit.get('times_of_day', [])
                
                # Check if habit is scheduled for this day of week
                if not habit_days:
                    is_scheduled = True  # Daily habits
                else:
                    is_scheduled = target_day in habit_days
                
                if is_scheduled:
                    # If habit has no specific times, create one instance
                    if not habit_times:
                        habit_instances.append({
                            **habit,
                            'time_of_day': 'flexible',
                            'instance_id': f"{habit['id']}_flexible",
                            'scheduled_date': target_date,
                            'day_of_week': target_day
                        })
                    else:
                        # Create instance for each time of day
                        for time_slot in habit_times:
                            habit_instances.append({
                                **habit,
                                'time_of_day': time_slot,
                                'instance_id': f"{habit['id']}_{time_slot}",
                                'scheduled_date': target_date,
                                'day_of_week': target_day
                            })
            
            return habit_instances
        except ValueError:
            return []  # Invalid date format

    def get_habits_for_relative_date(self, user_id: str, relative_days: int, timezone_offset: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get habits for a relative date (e.g., +1 for tomorrow, -1 for yesterday)"""
        from datetime import datetime, timedelta
        
        # Calculate local time based on timezone offset
        if timezone_offset is not None:
            local_now = datetime.utcnow() + timedelta(minutes=timezone_offset)
        else:
            local_now = datetime.now()
        
        # Calculate target date
        target_date = local_now + timedelta(days=relative_days)
        target_date_str = target_date.strftime('%Y-%m-%d')
        
        return self.get_habits_for_date(user_id, target_date_str, timezone_offset)

    def get_habit_instances_for_relative_date(self, user_id: str, relative_days: int, timezone_offset: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get habit instances for a relative date (e.g., +1 for tomorrow, -1 for yesterday)"""
        from datetime import datetime, timedelta
        
        # Calculate local time based on timezone offset
        if timezone_offset is not None:
            local_now = datetime.utcnow() + timedelta(minutes=timezone_offset)
        else:
            local_now = datetime.now()
        
        # Calculate target date
        target_date = local_now + timedelta(days=relative_days)
        target_date_str = target_date.strftime('%Y-%m-%d')
        
        return self.get_habit_instances_for_date(user_id, target_date_str, timezone_offset)

    # ============================================================================
    # COMPREHENSIVE DATE RANGE RETRIEVAL SYSTEM
    # ============================================================================

    def get_habits_for_week(self, user_id: str, week_offset: int = 0, timezone_offset: Optional[int] = None) -> Dict[str, Any]:
        """Get habits for a specific week (0 = current week, +1 = next week, -1 = last week)"""
        from datetime import datetime, timedelta
        
        # Calculate local time based on timezone offset
        if timezone_offset is not None:
            local_now = datetime.utcnow() + timedelta(minutes=timezone_offset)
        else:
            local_now = datetime.now()
        
        # Calculate target week
        target_date = local_now + timedelta(weeks=week_offset)
        monday = target_date - timedelta(days=target_date.weekday())
        sunday = monday + timedelta(days=6)
        
        # Get habits for each day of the week
        week_habits = {}
        total_instances = 0
        
        for i in range(7):
            day_date = monday + timedelta(days=i)
            day_name = day_date.strftime('%A')
            day_habits = self.get_habit_instances_for_date(user_id, day_date.strftime('%Y-%m-%d'), timezone_offset)
            week_habits[day_name.lower()] = {
                'date': day_date.strftime('%Y-%m-%d'),
                'day_name': day_name,
                'habits': day_habits,
                'count': len(day_habits)
            }
            total_instances += len(day_habits)
        
        return {
            'week_start': monday.strftime('%Y-%m-%d'),
            'week_end': sunday.strftime('%Y-%m-%d'),
            'week_offset': week_offset,
            'total_instances': total_instances,
            'days': week_habits
        }

    def get_habits_for_month(self, user_id: str, month_offset: int = 0, timezone_offset: Optional[int] = None) -> Dict[str, Any]:
        """Get habits for a specific month (0 = current month, +1 = next month, -1 = last month)"""
        from datetime import datetime, timedelta
        from calendar import monthrange
        
        # Calculate local time based on timezone offset
        if timezone_offset is not None:
            local_now = datetime.utcnow() + timedelta(minutes=timezone_offset)
        else:
            local_now = datetime.now()
        
        # Calculate target month
        target_year = local_now.year
        target_month = local_now.month + month_offset
        
        # Handle year overflow/underflow
        while target_month > 12:
            target_month -= 12
            target_year += 1
        while target_month < 1:
            target_month += 12
            target_year -= 1
        
        # Get first and last day of month
        first_day = datetime(target_year, target_month, 1)
        days_in_month = monthrange(target_year, target_month)[1]
        last_day = datetime(target_year, target_month, days_in_month)
        
        # Get habits for each day of the month
        month_habits = {}
        total_instances = 0
        
        for day in range(1, days_in_month + 1):
            day_date = datetime(target_year, target_month, day)
            day_key = f"{target_year}-{target_month:02d}-{day:02d}"
            day_habits = self.get_habit_instances_for_date(user_id, day_key, timezone_offset)
            month_habits[day_key] = {
                'date': day_key,
                'day_name': day_date.strftime('%A'),
                'day_number': day,
                'habits': day_habits,
                'count': len(day_habits)
            }
            total_instances += len(day_habits)
        
        return {
            'month_start': first_day.strftime('%Y-%m-%d'),
            'month_end': last_day.strftime('%Y-%m-%d'),
            'month_name': first_day.strftime('%B'),
            'year': target_year,
            'month_offset': month_offset,
            'total_instances': total_instances,
            'days_in_month': days_in_month,
            'days': month_habits
        }

    def get_habits_for_date_range(self, user_id: str, start_date: str, end_date: str, timezone_offset: Optional[int] = None) -> Dict[str, Any]:
        """Get habits for a custom date range"""
        from datetime import datetime, timedelta
        
        try:
            start_dt = datetime.fromisoformat(start_date)
            end_dt = datetime.fromisoformat(end_date)
            
            if start_dt > end_dt:
                start_dt, end_dt = end_dt, start_dt  # Swap if reversed
            
            # Get habits for each day in range
            range_habits = {}
            total_instances = 0
            current_date = start_dt
            
            while current_date <= end_dt:
                date_key = current_date.strftime('%Y-%m-%d')
                day_habits = self.get_habit_instances_for_date(user_id, date_key, timezone_offset)
                range_habits[date_key] = {
                    'date': date_key,
                    'day_name': current_date.strftime('%A'),
                    'habits': day_habits,
                    'count': len(day_habits)
                }
                total_instances += len(day_habits)
                current_date += timedelta(days=1)
            
            total_days = (end_dt - start_dt).days + 1
            
            return {
                'start_date': start_date,
                'end_date': end_date,
                'total_days': total_days,
                'total_instances': total_instances,
                'average_per_day': total_instances / total_days if total_days > 0 else 0,
                'days': range_habits
            }
        except ValueError:
            return {'error': 'Invalid date format. Use YYYY-MM-DD'}

    def get_habits_for_day_of_week(self, user_id: str, day_name: str, weeks_ahead: int = 4, timezone_offset: Optional[int] = None) -> Dict[str, Any]:
        """Get habits for all occurrences of a specific day of the week (e.g., all Mondays for next 4 weeks)"""
        from datetime import datetime, timedelta
        
        # Calculate local time based on timezone offset
        if timezone_offset is not None:
            local_now = datetime.utcnow() + timedelta(minutes=timezone_offset)
        else:
            local_now = datetime.now()
        
        # Map day names to weekday numbers
        day_mapping = {
            'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
            'friday': 4, 'saturday': 5, 'sunday': 6
        }
        
        target_weekday = day_mapping.get(day_name.lower())
        if target_weekday is None:
            return {'error': f'Invalid day name: {day_name}'}
        
        # Find next occurrence of this day
        days_ahead = (target_weekday - local_now.weekday()) % 7
        if days_ahead == 0 and local_now.hour >= 12:  # If it's past noon today, get next week's occurrence
            days_ahead = 7
        
        occurrences = {}
        total_instances = 0
        
        for week in range(weeks_ahead):
            target_date = local_now + timedelta(days=days_ahead + (week * 7))
            date_key = target_date.strftime('%Y-%m-%d')
            day_habits = self.get_habit_instances_for_date(user_id, date_key, timezone_offset)
            
            occurrences[date_key] = {
                'date': date_key,
                'week_number': week + 1,
                'habits': day_habits,
                'count': len(day_habits)
            }
            total_instances += len(day_habits)
        
        return {
            'day_name': day_name.title(),
            'weeks_ahead': weeks_ahead,
            'total_instances': total_instances,
            'average_per_occurrence': total_instances / weeks_ahead if weeks_ahead > 0 else 0,
            'occurrences': occurrences
        }

    def get_habits_summary_by_period(self, user_id: str, period: str = 'week', timezone_offset: Optional[int] = None) -> Dict[str, Any]:
        """Get comprehensive habits summary for different periods (day/week/month/year)"""
        from datetime import datetime, timedelta
        
        if period == 'day':
            return {
                'period': 'day',
                'today': self.get_habit_instances_for_today(user_id, timezone_offset=timezone_offset),
                'yesterday': self.get_habit_instances_for_relative_date(user_id, -1, timezone_offset),
                'tomorrow': self.get_habit_instances_for_relative_date(user_id, 1, timezone_offset)
            }
        elif period == 'week':
            return {
                'period': 'week',
                'this_week': self.get_habits_for_week(user_id, 0, timezone_offset),
                'last_week': self.get_habits_for_week(user_id, -1, timezone_offset),
                'next_week': self.get_habits_for_week(user_id, 1, timezone_offset)
            }
        elif period == 'month':
            return {
                'period': 'month',
                'this_month': self.get_habits_for_month(user_id, 0, timezone_offset),
                'last_month': self.get_habits_for_month(user_id, -1, timezone_offset),
                'next_month': self.get_habits_for_month(user_id, 1, timezone_offset)
            }
        else:
            return {'error': f'Invalid period: {period}. Use day/week/month'}

    def get_habits_count_for_today(self, user_id: str, time_of_day: Optional[str] = None, timezone_offset: Optional[int] = None) -> int:
        """Get count of habit instances scheduled for today (each time-of-day counts separately)"""
        return len(self.get_habit_instances_for_today(user_id, time_of_day, timezone_offset))
    
    def get_time_remaining_today(self, user_id: str, timezone_offset: Optional[int] = None) -> int:
        """Get remaining time for uncompleted big habits today - accounts for times_of_day"""
        from datetime import datetime, timedelta
        
        if self.mock_mode:
            # Mock implementation - calculate from mock data
            # Calculate local time based on timezone offset
            if timezone_offset is not None:
                local_now = datetime.utcnow() + timedelta(minutes=timezone_offset)
            else:
                local_now = datetime.now()
            today_date = local_now.date().isoformat()
            
            all_habits = self.get_habits(user_id)
            today_completions = self.get_completions(
                user_id=user_id,
                start_date=today_date,
                end_date=today_date
            )
            
            # Count completions per habit
            completions_per_habit = {}
            for completion in today_completions:
                habit_id = completion['habit_id']
                completions_per_habit[habit_id] = completions_per_habit.get(habit_id, 0) + 1
            
            time_remaining = 0
            # Calculate local time based on timezone offset
            if timezone_offset is not None:
                local_now = datetime.utcnow() + timedelta(minutes=timezone_offset)
            else:
                local_now = datetime.now()
            today_day = local_now.strftime('%a')
            
            for habit in all_habits:
                if (habit.get('habit_type') == 'big' and 
                    habit.get('estimated_duration')):
                    
                    # Check if habit is scheduled for today
                    habit_days = habit.get('days', [])
                    if habit_days and today_day not in habit_days:
                        continue
                    
                    # Count times per day for this habit
                    habit_times = habit.get('times_of_day', [])
                    times_per_day = len(habit_times) if habit_times else 1
                    
                    # Count completed instances
                    completed_instances = completions_per_habit.get(habit['id'], 0)
                    
                    # Calculate remaining instances
                    remaining_instances = max(0, times_per_day - completed_instances)
                    
                    # Add to time remaining
                    time_remaining += remaining_instances * habit.get('estimated_duration', 0)
            
            return time_remaining
        
        try:
            # Use regular Supabase queries for better compatibility
            
            # Calculate local time based on timezone offset
            if timezone_offset is not None:
                local_now = datetime.utcnow() + timedelta(minutes=timezone_offset)
            else:
                local_now = datetime.now()
            
            # Get today's day of week (convert Python 0=Monday to schema 1=Monday, 7=Sunday)
            python_dow = local_now.weekday()  # 0=Monday, 6=Sunday
            schema_dow = python_dow + 1 if python_dow < 6 else 7  # 1=Monday, 7=Sunday
            
            # Step 1: Get big habits with duration for user
            habits_response = self.client.table("habits").select("id, estimated_duration").eq("user_id", user_id).eq("habit_type", "big").eq("is_active", True).not_.is_("estimated_duration", "null").execute()
            
            if not habits_response.data:
                return 0
            
            big_habit_ids = [h['id'] for h in habits_response.data]
            habits_by_id = {h['id']: h for h in habits_response.data}
            
            # Step 2: Filter habits scheduled for today
            # Get habits with no specific days (should happen every day)
            habits_with_days_response = self.client.table("days_habits").select("habit_id").in_("habit_id", big_habit_ids).execute()
            habits_with_days = {item['habit_id'] for item in habits_with_days_response.data} if habits_with_days_response.data else set()
            habits_no_days = [h_id for h_id in big_habit_ids if h_id not in habits_with_days]
            
            # Get habits scheduled for today
            habits_today_response = self.client.table("days_habits").select("habit_id").eq("day_id", schema_dow).in_("habit_id", big_habit_ids).execute()
            habits_scheduled_today = {item['habit_id'] for item in habits_today_response.data} if habits_today_response.data else set()
            
            # Combine: habits with no days + habits scheduled for today
            today_habit_ids = list(set(habits_no_days) | habits_scheduled_today)
            
            if not today_habit_ids:
                return 0
            
            # Step 3: Count times per day for each habit
            times_response = self.client.table("times_of_day_habits").select("habit_id").in_("habit_id", today_habit_ids).execute()
            times_per_habit = {}
            
            for item in times_response.data if times_response.data else []:
                habit_id = item['habit_id']
                times_per_habit[habit_id] = times_per_habit.get(habit_id, 0) + 1
            
            # Step 4: Get today's completions
            today_date = local_now.date().isoformat()
            completions_response = self.client.table("habit_completions").select("habit_id").eq("user_id", user_id).eq("completed_date", today_date).in_("habit_id", today_habit_ids).execute()
            
            completions_per_habit = {}
            for item in completions_response.data if completions_response.data else []:
                habit_id = item['habit_id']
                completions_per_habit[habit_id] = completions_per_habit.get(habit_id, 0) + 1
            
            # Step 5: Calculate time remaining
            time_remaining = 0
            
            for habit_id in today_habit_ids:
                habit = habits_by_id[habit_id]
                estimated_duration = habit['estimated_duration']
                
                # Times per day for this habit
                times_per_day = times_per_habit.get(habit_id, 1)  # Default to 1 if no times specified
                
                # Completed instances today
                completed_instances = completions_per_habit.get(habit_id, 0)
                
                # Remaining instances (can't be negative)
                remaining_instances = max(0, times_per_day - completed_instances)
                
                # Add to total time remaining
                time_remaining += remaining_instances * estimated_duration
            
            return time_remaining
            
        except Exception as e:
            print(f"Error in get_time_remaining_today: {e}")
            import traceback
            traceback.print_exc()
            return 0

    def get_today_stats(self, user_id: str, timezone_offset: Optional[int] = None) -> Dict[str, Any]:
        """Get comprehensive stats for today - optimized version"""
        from datetime import datetime, date as date_type, timedelta
        
        print(f"[DEBUG] get_today_stats called with timezone_offset: {timezone_offset}")
        
        # Calculate local time based on timezone offset
        if timezone_offset is not None:
            # timezone_offset is in minutes (e.g., -300 for EST)
            utc_now = datetime.utcnow()
            local_now = utc_now + timedelta(minutes=timezone_offset)
            print(f"[DEBUG] UTC time: {utc_now}")
            print(f"[DEBUG] Local time (with offset): {local_now}")
        else:
            # Fallback to server time
            local_now = datetime.now()
            print(f"[DEBUG] Using server time: {local_now}")
        
        today_date = local_now.date().isoformat()
        today_day = local_now.strftime('%a')  # 'Mon', 'Tue', etc.
        
        print(f"[DEBUG] Calculated today_date: {today_date}")
        print(f"[DEBUG] Calculated today_day: {today_day}")
        
        if self.mock_mode:
            # Use existing logic for mock mode
            all_habits = self.get_habits(user_id)
            today_completions = self.get_completions(
                user_id=user_id,
                start_date=today_date,
                end_date=today_date
            )
            
            # Build list of habit instances (habit × time_of_day combinations) for today
            habit_instances = []
            completed_instances = set()
            
            for habit in all_habits:
                habit_days = habit.get('days', [])
                habit_times = habit.get('times_of_day', [])
                
                # Check if habit is scheduled for today
                if not habit_days or today_day in habit_days:
                    # If no times specified, default to one instance
                    if not habit_times:
                        habit_times = ['default']
                    
                    # Create an instance for each time of day
                    for time_of_day in habit_times:
                        instance_key = f"{habit['id']}_{time_of_day}"
                        habit_instances.append({
                            'habit_id': habit['id'],
                            'time_of_day': time_of_day,
                            'instance_key': instance_key
                        })
                        
                        # Check if this instance is completed
                        is_completed = False
                        for completion in today_completions:
                            if completion['habit_id'] == habit['id']:
                                completion_time = self._get_time_name_from_id(completion.get('time_of_day_id'))
                                if completion_time == time_of_day or (time_of_day == 'default' and completion_time):
                                    is_completed = True
                                    completed_instances.add(instance_key)
                                    break
            
            # Calculate success rate
            total_instances = len(habit_instances)
            completed_count = len(completed_instances)
            success_rate = round((completed_count / total_instances) * 100) if total_instances > 0 else 0
            
            # Get time remaining using optimized function
            time_remaining = self.get_time_remaining_today(user_id, timezone_offset)
            
            mock_stats = {
                'habits_today': total_instances,
                'completed_today': completed_count,
                'success_rate_today': success_rate,
                'time_remaining': time_remaining,
                'completions_today': len(today_completions)
            }
            
            print(f"[STATS DEBUG] ===== MOCK MODE CALCULATED STATS =====")
            print(f"[STATS DEBUG] User: {user_id}")
            print(f"[STATS DEBUG] Date: {today_date} ({today_day})")
            print(f"[STATS DEBUG] Total Habits Today: {total_instances}")
            print(f"[STATS DEBUG] Completed Today: {completed_count}")
            print(f"[STATS DEBUG] Success Rate: {success_rate}%")
            print(f"[STATS DEBUG] Time Remaining: {time_remaining} minutes")
            print(f"[STATS DEBUG] Raw Completions: {len(today_completions)}")
            print(f"[STATS DEBUG] ======================================")
            
            return mock_stats
        
        try:
            # Use regular Supabase queries instead of execute_sql for better compatibility
            
            # Get today's day of week (convert Python 0=Monday to schema 1=Monday, 7=Sunday)
            python_dow = local_now.weekday()  # 0=Monday, 6=Sunday (using timezone-adjusted time)
            schema_dow = python_dow + 1 if python_dow < 6 else 7  # 1=Monday, 7=Sunday
            
            print(f"[DEBUG] Today is day {schema_dow} (Python: {python_dow})")
            
            # Step 1: Get all active habits for user
            habits_response = self.client.table("habits").select("id").eq("user_id", user_id).eq("is_active", True).execute()
            all_habit_ids = [h['id'] for h in habits_response.data] if habits_response.data else []
            
            if not all_habit_ids:
                print(f"[DEBUG] No active habits found for user {user_id}")
                return {
                    'habits_today': 0,
                    'completed_today': 0,
                    'success_rate_today': 0,
                    'time_remaining': 0,
                    'completions_today': 0
                }
            
            print(f"[DEBUG] Found {len(all_habit_ids)} active habits")
            
            # Step 2: Filter habits scheduled for today
            # Get habits with no specific days (should happen every day)
            habits_no_days_response = self.client.table("habits").select("id").eq("user_id", user_id).eq("is_active", True).execute()
            habits_with_days_response = self.client.table("days_habits").select("habit_id").in_("habit_id", all_habit_ids).execute()
            
            habits_with_days = {item['habit_id'] for item in habits_with_days_response.data} if habits_with_days_response.data else set()
            habits_no_days = [h['id'] for h in habits_no_days_response.data if h['id'] not in habits_with_days] if habits_no_days_response.data else []
            
            # Get habits scheduled for today
            habits_today_response = self.client.table("days_habits").select("habit_id").eq("day_id", schema_dow).in_("habit_id", all_habit_ids).execute()
            habits_scheduled_today = {item['habit_id'] for item in habits_today_response.data} if habits_today_response.data else set()
            
            # Combine: habits with no days + habits scheduled for today
            today_habit_ids = list(set(habits_no_days) | habits_scheduled_today)
            
            print(f"[DEBUG] Habits scheduled for today: {len(today_habit_ids)} (no days: {len(habits_no_days)}, scheduled: {len(habits_scheduled_today)})")
            
            if not today_habit_ids:
                return {
                    'habits_today': 0,
                    'completed_today': 0,
                    'success_rate_today': 0,
                    'time_remaining': 0,
                    'completions_today': 0
                }
            
            # Step 3: Count times per day for each habit
            times_response = self.client.table("times_of_day_habits").select("habit_id").in_("habit_id", today_habit_ids).execute()
            times_per_habit = {}
            
            for item in times_response.data if times_response.data else []:
                habit_id = item['habit_id']
                times_per_habit[habit_id] = times_per_habit.get(habit_id, 0) + 1
            
            # Habits with no specific times = 1 time per day
            total_instances = 0
            for habit_id in today_habit_ids:
                times_count = times_per_habit.get(habit_id, 1)  # Default to 1 if no times specified
                total_instances += times_count
            
            print(f"[DEBUG] Total habit instances today: {total_instances}")
            
            # Step 4: Get today's completions
            # Use the timezone-adjusted date we calculated earlier
            completions_response = self.client.table("habit_completions").select("habit_id, time_of_day_id, completed_at").eq("user_id", user_id).eq("completed_date", today_date).in_("habit_id", today_habit_ids).execute()
            
            completions_per_habit = {}
            total_completions = 0
            
            print(f"[DEBUG] ===== QUERYING TODAY'S COMPLETIONS =====")
            print(f"[DEBUG] Query: user_id={user_id}, completed_date={today_date}")
            print(f"[DEBUG] Filtering for habit_ids: {today_habit_ids}")
            print(f"[DEBUG] Raw completions found: {len(completions_response.data) if completions_response.data else 0}")
            
            for item in completions_response.data if completions_response.data else []:
                habit_id = item['habit_id']
                time_of_day_id = item.get('time_of_day_id')
                completed_at = item.get('completed_at')
                print(f"[DEBUG] Found completion: habit_id={habit_id}, time_of_day_id={time_of_day_id}, completed_at={completed_at}")
                completions_per_habit[habit_id] = completions_per_habit.get(habit_id, 0) + 1
                total_completions += 1
            
            print(f"[DEBUG] Total completions today: {total_completions}")
            print(f"[DEBUG] Completions per habit: {completions_per_habit}")
            print(f"[DEBUG] ==========================================")
            
            # Step 5: Calculate completed instances (capped at expected times per day)
            completed_instances = 0
            for habit_id in today_habit_ids:
                expected_times = times_per_habit.get(habit_id, 1)
                actual_completions = completions_per_habit.get(habit_id, 0)
                completed_instances += min(actual_completions, expected_times)
            
            # Step 6: Calculate success rate
            success_rate = round((completed_instances / total_instances) * 100) if total_instances > 0 else 0
            
            print(f"[DEBUG] Completed instances: {completed_instances}/{total_instances} = {success_rate}%")
            
            # Get time remaining using optimized function
            time_remaining = self.get_time_remaining_today(user_id, timezone_offset)
            
            # COMPREHENSIVE STATS DEBUG LOGGING
            final_stats = {
                'habits_today': total_instances,
                'completed_today': completed_instances,
                'success_rate_today': success_rate,
                'time_remaining': time_remaining,
                'completions_today': total_completions
            }
            
            print(f"[STATS DEBUG] ===== FINAL CALCULATED STATS =====")
            print(f"[STATS DEBUG] User: {user_id}")
            print(f"[STATS DEBUG] Date: {today_date} ({today_day})")
            print(f"[STATS DEBUG] Total Habits Today: {total_instances}")
            print(f"[STATS DEBUG] Completed Today: {completed_instances}")
            print(f"[STATS DEBUG] Success Rate: {success_rate}%")
            print(f"[STATS DEBUG] Time Remaining: {time_remaining} minutes")
            print(f"[STATS DEBUG] Raw Completions: {total_completions}")
            print(f"[STATS DEBUG] =====================================")
            
            # Additional debug: Show per-habit breakdown
            print(f"[STATS DEBUG] PER-HABIT BREAKDOWN:")
            for habit_id in today_habit_ids:
                expected = times_per_habit.get(habit_id, 1)
                actual = completions_per_habit.get(habit_id, 0)
                counted = min(actual, expected)
                print(f"[STATS DEBUG]   Habit {habit_id}: {counted}/{expected} (actual: {actual})")
            print(f"[STATS DEBUG] =====================================")
            
            return final_stats
                
        except Exception as e:
            print(f"Error in get_today_stats: {e}")
            import traceback
            traceback.print_exc()
            # Fallback to simpler queries
            try:
                # Count today's completions
                completions_response = self.client.table("habit_completions").select("id", count="exact").eq("user_id", user_id).eq("completed_date", today_date).execute()
                completions_today = completions_response.count or 0
                
                # Get basic habit count (simplified)
                habits_response = self.client.table("habits").select("id", count="exact").eq("user_id", user_id).execute()
                habits_today = habits_response.count or 0
                
                # Calculate basic success rate
                success_rate = round((completions_today / habits_today) * 100) if habits_today > 0 else 0
                
                # Get time remaining using optimized function
                time_remaining = self.get_time_remaining_today(user_id, timezone_offset)
                
                fallback_stats = {
                    'habits_today': habits_today,
                    'completed_today': completions_today,
                    'success_rate_today': success_rate,
                    'time_remaining': time_remaining,
                    'completions_today': completions_today
                }
                
                print(f"[STATS DEBUG] ===== FALLBACK CALCULATED STATS =====")
                print(f"[STATS DEBUG] User: {user_id}")
                print(f"[STATS DEBUG] Date: {today_date}")
                print(f"[STATS DEBUG] Total Habits Today: {habits_today}")
                print(f"[STATS DEBUG] Completed Today: {completions_today}")
                print(f"[STATS DEBUG] Success Rate: {success_rate}%")
                print(f"[STATS DEBUG] Time Remaining: {time_remaining} minutes")
                print(f"[STATS DEBUG] Raw Completions: {completions_today}")
                print(f"[STATS DEBUG] ========================================")
                
                return fallback_stats
            except Exception as fallback_error:
                print(f"Fallback query also failed: {fallback_error}")
                return {
                    'habits_today': 0,
                    'completed_today': 0,
                    'success_rate_today': 0,
                    'time_remaining': 0,
                    'completions_today': 0
                }
    
    def _get_time_name_from_id(self, time_id: Optional[int]) -> Optional[str]:
        """Convert time_of_day_id to time name"""
        if not time_id:
            return None
        
        time_map = {1: 'morning', 2: 'noon', 3: 'afternoon', 4: 'night'}
        return time_map.get(time_id)
    
    def _get_actual_completions_count(self, user_id: str, target_date) -> int:
        """Get the actual count of completions from habit_completions table for freshness check"""
        try:
            if self.mock_mode:
                # For mock mode, count from mock data
                today_date_str = target_date.isoformat() if hasattr(target_date, 'isoformat') else str(target_date)
                return len([c for c in self.mock_logs if 
                           c.get('user_id') == user_id and 
                           c.get('completed_date') == today_date_str])
            
            # Convert target_date to string format for database query
            date_str = target_date.isoformat() if hasattr(target_date, 'isoformat') else str(target_date)
            
            # Query habit_completions table directly
            response = self.client.table("habit_completions")\
                .select("id", count="exact")\
                .eq("user_id", user_id)\
                .eq("completed_date", date_str)\
                .execute()
            
            return response.count or 0
            
        except Exception as e:
            print(f"[ERROR] Failed to get actual completions count: {e}")
            return 0
    
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
    
    def get_unlocked_bobo_items(self, user_id: str, item_type: str = None) -> List[Dict[str, Any]]:
        """Get unlocked bobo items for a user, optionally filtered by type"""
        try:
            if self.mock_mode:
                if not hasattr(self, 'mock_bobo_items'):
                    self.mock_bobo_items = []
                
                items = [item for item in self.mock_bobo_items if item.get('user_id') == user_id]
                if item_type:
                    items = [item for item in items if item.get('item_type') == item_type]
                return items
            
            if not self.client:
                return []
            
            query = self.client.table('bobo_items').select('*').eq('user_id', user_id)
            
            if item_type:
                query = query.eq('item_type', item_type)
            
            result = query.execute()
            return result.data if result and result.data else []
            
        except Exception as e:
            print(f"Error getting unlocked bobo items: {e}")
            return []

    def get_completions_count(self, user_id: str) -> int:
        """Get total count of completions for a user (optimized)"""
        try:
            if self.mock_mode:
                if not hasattr(self, 'mock_completions'):
                    self.mock_completions = []
                return len([log for log in self.mock_completions if log.get('user_id') == user_id])
            
            if not self.client:
                return 0
            
            # Use count query for better performance
            result = self.client.table('habit_completions')\
                .select('*', count='exact')\
                .eq('user_id', user_id)\
                .execute()
            
            return result.count if result and hasattr(result, 'count') else 0
            
        except Exception as e:
            print(f"Error getting completions count: {e}")
            return 0
    
    def get_completions(
        self,
        user_id: Optional[str] = None,
        habit_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get habit completions with filters - optimized version"""
        if self.mock_mode:
            if not hasattr(self, 'mock_completions'):
                self.mock_completions = []
            completions = self.mock_completions
            if user_id:
                completions = [c for c in completions if c.get("user_id") == user_id]
            if habit_id:
                completions = [c for c in completions if c.get("habit_id") == habit_id]
            if start_date:
                start_date_str = start_date.isoformat() if hasattr(start_date, 'isoformat') else str(start_date)
                completions = [c for c in completions if c.get("completed_date", "") >= start_date_str]
            if end_date:
                end_date_str = end_date.isoformat() if hasattr(end_date, 'isoformat') else str(end_date)
                completions = [c for c in completions if c.get("completed_date", "") <= end_date_str]
            if limit:
                completions = completions[:limit]
            return completions
        
        try:
            # Build optimized query with proper indexing hints
            query = self.client.table("habit_completions").select("*")
            
            # Apply filters in order of selectivity (most selective first)
            if user_id:
                query = query.eq("user_id", user_id)
            if start_date:
                query = query.gte("completed_date", start_date.isoformat())
            if end_date:
                query = query.lte("completed_date", end_date.isoformat())
            if habit_id:
                query = query.eq("habit_id", habit_id)
            
            # Add ordering for consistent results and better performance
            query = query.order("completed_date", desc=True).order("id", desc=True)
            
            # Apply limit if specified
            if limit:
                query = query.limit(limit)
            
            response = query.execute()
            results = response.data or []
            
            # Ensure date fields are serialized as strings
            from datetime import date as date_type, datetime
            for result in results:
                if 'completed_date' in result and isinstance(result['completed_date'], date_type):
                    result['completed_date'] = result['completed_date'].isoformat()
                if 'completed_at' in result and isinstance(result['completed_at'], datetime):
                    result['completed_at'] = result['completed_at'].isoformat()
            
            return results
            
        except Exception as e:
            print(f"Error in get_completions: {e}")
            return []
    
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
    
    def create_completion_and_update_stats(self, completion_data: Dict[str, Any], timezone_offset: Optional[int] = None) -> Dict[str, Any]:
        """
        Create habit completion and update daily statistics in database
        This ensures data consistency between habit_completions and daily_success_rates tables
        Implements fallback to real-time calculation when database operations fail
        """
        from datetime import date as date_type, datetime, timedelta
        
        completion = None
        
        try:
            # Step 1: Create the completion record with error handling
            try:
                completion = self.create_completion(completion_data)
                
                if not completion:
                    raise Exception("Failed to create completion record")
                    
            except Exception as completion_error:
                print(f"[ERROR] Failed to create completion: {completion_error}")
                # If we can't create the completion, we can't proceed
                raise completion_error
            
            # Step 2: Determine the date for statistics update with error handling
            try:
                # Use the completion date from the record, or calculate from timezone offset
                if 'completed_date' in completion and completion['completed_date']:
                    if isinstance(completion['completed_date'], str):
                        target_date = date_type.fromisoformat(completion['completed_date'])
                    else:
                        target_date = completion['completed_date']
                else:
                    # Calculate local date based on timezone offset with fallback
                    if timezone_offset is not None:
                        try:
                            local_now = datetime.utcnow() + timedelta(minutes=timezone_offset)
                        except Exception as tz_error:
                            print(f"[WARNING] Timezone calculation failed: {tz_error}, using server time")
                            local_now = datetime.now()
                    else:
                        local_now = datetime.now()
                    target_date = local_now.date()
                    
            except Exception as date_error:
                print(f"[ERROR] Date calculation failed: {date_error}, using today")
                target_date = datetime.now().date()
            
            # Step 3: Get user_id from completion data with validation
            user_id = completion_data.get('user_id')
            if not user_id:
                print("[WARNING] No user_id in completion data, cannot update daily stats")
                return completion
            
            # Step 4: Try to recalculate and update daily statistics with fallback
            try:
                print(f"[DEBUG] Updating daily stats for user {user_id} on {target_date}")
                print(f"[COMPLETION DEBUG] ===== RECALCULATING STATS AFTER COMPLETION =====")
                print(f"[COMPLETION DEBUG] Completion created for habit_id: {completion.get('habit_id')}")
                print(f"[COMPLETION DEBUG] Completion date: {completion.get('completed_date')}")
                print(f"[COMPLETION DEBUG] Time of day: {completion.get('time_of_day_id')}")
                print(f"[COMPLETION DEBUG] About to call get_today_stats...")
                
                # Try to use existing calculation logic to get fresh stats
                try:
                    calculated_stats = self.get_today_stats(user_id, timezone_offset)
                    
                    if not calculated_stats or not isinstance(calculated_stats, dict):
                        raise Exception("Invalid calculated stats returned")
                    
                    print(f"[COMPLETION DEBUG] Stats recalculated successfully:")
                    print(f"[COMPLETION DEBUG] - Habits today: {calculated_stats.get('habits_today')}")
                    print(f"[COMPLETION DEBUG] - Completed today: {calculated_stats.get('completed_today')}")
                    print(f"[COMPLETION DEBUG] - Success rate: {calculated_stats.get('success_rate_today')}%")
                    print(f"[COMPLETION DEBUG] - Time remaining: {calculated_stats.get('time_remaining')}")
                        
                except Exception as calc_error:
                    print(f"[ERROR] Stats calculation failed: {calc_error}")
                    # Fallback to basic calculation
                    print("[DEBUG] Falling back to basic stats calculation")
                    calculated_stats = self._fallback_basic_stats_calculation(user_id, target_date, timezone_offset)
                
                # Step 5: Try to save/update the daily success rate record
                try:
                    save_result = self.save_daily_success_rate(
                        user_id=user_id,
                        date=target_date,
                        total_instances=calculated_stats.get('habits_today', 0),
                        completed_instances=calculated_stats.get('completed_today', 0),
                        time_remaining=calculated_stats.get('time_remaining', 0)
                    )
                    
                    if save_result:
                        print(f"[DEBUG] Successfully updated daily stats after completion creation")
                    else:
                        print(f"[WARNING] Failed to save daily stats, but completion was created")
                        
                except Exception as save_error:
                    print(f"[ERROR] Failed to save daily stats: {save_error}")
                    print("[DEBUG] Completion was created but stats update failed")
                
            except Exception as stats_error:
                print(f"[ERROR] Stats update process failed: {stats_error}")
                print("[DEBUG] Completion was created but stats could not be updated")
            
            return completion
            
        except Exception as e:
            print(f"[ERROR] create_completion_and_update_stats failed: {e}")
            import traceback
            traceback.print_exc()
            
            # If we have a completion, return it even if stats update failed
            if completion:
                print("[DEBUG] Returning completion despite stats update failure")
                return completion
            
            # If completion creation failed, return the original data to indicate failure
            print("[ERROR] Completion creation failed, returning original data")
            return completion_data
    
    def delete_completion_and_update_stats(self, completion_id: int, timezone_offset: Optional[int] = None) -> bool:
        """
        Delete habit completion and update daily statistics in database
        This ensures data consistency between habit_completions and daily_success_rates tables
        Implements fallback to real-time calculation when database operations fail
        """
        from datetime import date as date_type, datetime, timedelta
        
        completion = None
        delete_success = False
        
        try:
            # Step 1: Get the completion record before deleting with error handling
            try:
                completion = self.get_completion(completion_id)
                
                if not completion:
                    print(f"[WARNING] Completion {completion_id} not found")
                    return False
                    
            except Exception as get_error:
                print(f"[ERROR] Failed to retrieve completion {completion_id}: {get_error}")
                return False
            
            user_id = completion.get('user_id')
            completed_date = completion.get('completed_date')
            
            # Step 2: Delete the completion record with error handling
            try:
                delete_success = self.delete_completion(completion_id)
                
                if not delete_success:
                    print(f"[ERROR] Failed to delete completion {completion_id}")
                    return False
                    
            except Exception as delete_error:
                print(f"[ERROR] Delete operation failed for completion {completion_id}: {delete_error}")
                return False
            
            # Step 3: Determine the date for statistics update with error handling
            try:
                if completed_date:
                    if isinstance(completed_date, str):
                        target_date = date_type.fromisoformat(completed_date)
                    else:
                        target_date = completed_date
                else:
                    # Calculate local date based on timezone offset with fallback
                    if timezone_offset is not None:
                        try:
                            local_now = datetime.utcnow() + timedelta(minutes=timezone_offset)
                        except Exception as tz_error:
                            print(f"[WARNING] Timezone calculation failed: {tz_error}, using server time")
                            local_now = datetime.now()
                    else:
                        local_now = datetime.now()
                    target_date = local_now.date()
                    
            except Exception as date_error:
                print(f"[ERROR] Date calculation failed: {date_error}, using today")
                target_date = datetime.now().date()
            
            # Step 4: Try to recalculate and update daily statistics with fallback
            if user_id:
                try:
                    print(f"[DEBUG] Updating daily stats for user {user_id} on {target_date} after deletion")
                    
                    # Try to use existing calculation logic to get fresh stats
                    try:
                        calculated_stats = self.get_today_stats(user_id, timezone_offset)
                        
                        if not calculated_stats or not isinstance(calculated_stats, dict):
                            raise Exception("Invalid calculated stats returned")
                            
                    except Exception as calc_error:
                        print(f"[ERROR] Stats calculation failed: {calc_error}")
                        # Fallback to basic calculation
                        print("[DEBUG] Falling back to basic stats calculation")
                        calculated_stats = self._fallback_basic_stats_calculation(user_id, target_date, timezone_offset)
                    
                    # Step 5: Try to save/update the daily success rate record
                    try:
                        save_result = self.save_daily_success_rate(
                            user_id=user_id,
                            date=target_date,
                            total_instances=calculated_stats.get('habits_today', 0),
                            completed_instances=calculated_stats.get('completed_today', 0),
                            time_remaining=calculated_stats.get('time_remaining', 0)
                        )
                        
                        if save_result:
                            print(f"[DEBUG] Successfully updated daily stats after completion deletion")
                        else:
                            print(f"[WARNING] Failed to save daily stats, but completion was deleted")
                            
                    except Exception as save_error:
                        print(f"[ERROR] Failed to save daily stats: {save_error}")
                        print("[DEBUG] Completion was deleted but stats update failed")
                    
                except Exception as stats_error:
                    print(f"[ERROR] Stats update process failed: {stats_error}")
                    print("[DEBUG] Completion was deleted but stats could not be updated")
            else:
                print("[WARNING] No user_id found in completion, cannot update daily stats")
            
            return True
            
        except Exception as e:
            print(f"[ERROR] delete_completion_and_update_stats failed: {e}")
            import traceback
            traceback.print_exc()
            
            # Return the delete success status if we got that far
            return delete_success
    
    def validate_daily_stats_consistency(self, user_id: str, target_date: date, timezone_offset: Optional[int] = None) -> Dict[str, Any]:
        """
        Validate consistency between habit_completions and daily_success_rates tables
        Returns validation results and performs recalculation if inconsistencies are detected
        """
        from datetime import datetime, timedelta
        
        try:
            print(f"[DEBUG] Validating consistency for user {user_id} on {target_date}")
            
            # Step 1: Get stored daily success rate
            stored_stats = self.get_daily_success_rate(user_id, target_date)
            
            # Step 2: Calculate actual stats from habit_completions
            actual_stats = self.get_today_stats(user_id, timezone_offset)
            
            # Step 3: Compare stored vs actual
            is_consistent = True
            inconsistencies = []
            
            if stored_stats:
                stored_total = stored_stats.get('total_habit_instances', 0)
                stored_completed = stored_stats.get('completed_instances', 0)
                stored_rate = stored_stats.get('success_rate', 0.0)
                
                actual_total = actual_stats.get('habits_today', 0)
                actual_completed = actual_stats.get('completed_today', 0)
                actual_rate = actual_stats.get('success_rate_today', 0.0)
                
                # Check for inconsistencies
                if stored_total != actual_total:
                    is_consistent = False
                    inconsistencies.append(f"Total instances mismatch: stored={stored_total}, actual={actual_total}")
                
                if stored_completed != actual_completed:
                    is_consistent = False
                    inconsistencies.append(f"Completed instances mismatch: stored={stored_completed}, actual={actual_completed}")
                
                # Allow small floating point differences in success rate
                if abs(stored_rate - actual_rate) > 0.1:
                    is_consistent = False
                    inconsistencies.append(f"Success rate mismatch: stored={stored_rate}, actual={actual_rate}")
            else:
                # No stored stats found - this is an inconsistency if there are actual stats
                if actual_stats.get('habits_today', 0) > 0 or actual_stats.get('completed_today', 0) > 0:
                    is_consistent = False
                    inconsistencies.append("No stored stats found but actual data exists")
            
            # Step 4: If inconsistent, recalculate and update
            if not is_consistent:
                print(f"[DEBUG] Inconsistencies detected: {inconsistencies}")
                print(f"[DEBUG] Recalculating and updating stored stats")
                
                # Recalculate and save correct stats
                updated_stats = self.save_daily_success_rate(
                    user_id=user_id,
                    date=target_date,
                    total_instances=actual_stats.get('habits_today', 0),
                    completed_instances=actual_stats.get('completed_today', 0),
                    time_remaining=actual_stats.get('time_remaining', 0)
                )
                
                return {
                    'is_consistent': False,
                    'inconsistencies': inconsistencies,
                    'stored_stats': stored_stats,
                    'actual_stats': actual_stats,
                    'updated_stats': updated_stats,
                    'action_taken': 'recalculated_and_updated'
                }
            else:
                print(f"[DEBUG] Data is consistent")
                return {
                    'is_consistent': True,
                    'inconsistencies': [],
                    'stored_stats': stored_stats,
                    'actual_stats': actual_stats,
                    'action_taken': 'none'
                }
                
        except Exception as e:
            print(f"Error in validate_daily_stats_consistency: {e}")
            import traceback
            traceback.print_exc()
            return {
                'is_consistent': False,
                'inconsistencies': [f"Validation error: {str(e)}"],
                'error': str(e),
                'action_taken': 'error'
            }
    
    def recalculate_daily_stats_from_completions(self, user_id: str, target_date: date, timezone_offset: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """
        Recalculate daily statistics from habit_completions data and update stored record
        This method is used when inconsistencies are detected or for data repair
        """
        try:
            print(f"[DEBUG] Recalculating daily stats from completions for user {user_id} on {target_date}")
            
            # Use the existing calculation logic which reads from habit_completions
            calculated_stats = self.get_today_stats(user_id, timezone_offset)
            
            # Save the recalculated stats
            updated_stats = self.save_daily_success_rate(
                user_id=user_id,
                date=target_date,
                total_instances=calculated_stats.get('habits_today', 0),
                completed_instances=calculated_stats.get('completed_today', 0),
                time_remaining=calculated_stats.get('time_remaining', 0)
            )
            
            print(f"[DEBUG] Successfully recalculated and saved daily stats")
            return updated_stats
            
        except Exception as e:
            print(f"Error in recalculate_daily_stats_from_completions: {e}")
            import traceback
            traceback.print_exc()
            return None
    
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
        user_id: Optional[str] = None,
        habit_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Dict[str, Any]]:
        """Legacy method - maps to get_completions"""
        completions = self.get_completions(user_id=user_id, habit_id=habit_id, start_date=start_date, end_date=end_date)
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
        """Link a habit to specific days - optimized for new habits"""
        if self.mock_mode:
            return
        
        try:
            # Map day names to IDs
            day_name_to_id = {
                'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4,
                'Fri': 5, 'Sat': 6, 'Sun': 7
            }
            
            # For new habits, just insert (no need to delete first)
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
        """Link a habit to specific times of day - optimized for new habits"""
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
            
            # For new habits, just insert (no need to delete first)
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
        
        # Fill in defaults for missing days (16 hours = 960 minutes)
        defaults = {
            'Mon': 960, 'Tue': 960, 'Wed': 960, 'Thu': 960, 'Fri': 960,
            'Sat': 960, 'Sun': 960
        }
        
        for day, default_capacity in defaults.items():
            if day not in capacity_dict:
                capacity_dict[day] = default_capacity
        
        return capacity_dict
    
    def check_habit_capacity(self, user_id: str, habit_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if adding a new habit would exceed daily capacity (16 hours = 960 minutes)
        
        Returns:
            Dict with 'can_add': bool, 'message': str, 'current_usage': dict, 'new_usage': dict
        """
        # Get current habits
        existing_habits = self.get_habits(user_id)
        
        # Get daily capacities (all 960 minutes = 16 hours)
        daily_capacities = self.get_daily_capacities(user_id)
        
        # Calculate current usage per day
        current_usage = {day: 0 for day in daily_capacities.keys()}
        
        for habit in existing_habits:
            if not habit.get('is_active', True):
                continue
                
            duration = habit.get('estimated_duration', 0)
            if not duration:  # Skip atomic habits (no duration)
                continue
                
            habit_days = habit.get('days', [])
            if not habit_days:  # No specific days = daily
                habit_days = list(daily_capacities.keys())
            
            # Add duration to each scheduled day
            for day in habit_days:
                if day in current_usage:
                    current_usage[day] += duration
        
        # Calculate new usage if this habit is added
        new_habit_duration = habit_data.get('estimated_duration', 0)
        new_usage = current_usage.copy()
        
        if new_habit_duration > 0:  # Only check habits with duration
            new_habit_days = habit_data.get('days', [])
            if not new_habit_days:  # No specific days = daily
                new_habit_days = list(daily_capacities.keys())
            
            for day in new_habit_days:
                if day in new_usage:
                    new_usage[day] += new_habit_duration
        
        # Check if any day exceeds capacity
        exceeds_capacity = False
        problem_days = []
        
        for day, usage in new_usage.items():
            capacity = daily_capacities[day]
            if usage > capacity:
                exceeds_capacity = True
                problem_days.append({
                    'day': day,
                    'usage': usage,
                    'capacity': capacity,
                    'excess': usage - capacity
                })
        
        # Generate response
        if exceeds_capacity:
            problem_day = problem_days[0]  # Show first problem day
            message = (
                f"Adding this habit would exceed your daily limit on {problem_day['day']}. "
                f"You'd have {problem_day['usage']} minutes ({problem_day['usage']/60:.1f} hours) "
                f"but your limit is {problem_day['capacity']} minutes (16 hours). "
                f"Consider reducing other habits or changing the schedule."
            )
            can_add = False
        else:
            max_usage = max(new_usage.values())
            message = f"Great! This habit fits within your 16-hour daily limit. Max usage: {max_usage/60:.1f} hours."
            can_add = True
        
        return {
            'can_add': can_add,
            'message': message,
            'current_usage': current_usage,
            'new_usage': new_usage,
            'problem_days': problem_days if exceeds_capacity else []
        }
    
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

    def check_reward_claimed_for_period(self, user_id: str, achievement_type: str) -> bool:
        """Check if user has already claimed this achievement type for the current period"""
        from datetime import datetime, timedelta
        
        if self.mock_mode:
            if not hasattr(self, 'mock_reward_claims'):
                self.mock_reward_claims = []
            
            # Calculate current period
            now = datetime.now()
            if achievement_type == 'daily_perfect':
                current_period = now.strftime('%Y-%m-%d')
            elif achievement_type == 'weekly_perfect':
                # ISO week format: YYYY-WW
                year, week, _ = now.isocalendar()
                current_period = f"{year}-{week:02d}"
            elif achievement_type == 'monthly_perfect':
                current_period = now.strftime('%Y-%m')
            else:
                return False
            
            return any(
                claim.get('user_id') == user_id and 
                claim.get('achievement_type') == achievement_type and
                claim.get('claim_period') == current_period
                for claim in self.mock_reward_claims
            )
        
        try:
            now = datetime.now()
            
            # Calculate current period based on achievement type
            if achievement_type == 'daily_perfect':
                current_period = now.strftime('%Y-%m-%d')
            elif achievement_type == 'weekly_perfect':
                # ISO week format: YYYY-WW
                year, week, _ = now.isocalendar()
                current_period = f"{year}-{week:02d}"
            elif achievement_type == 'monthly_perfect':
                current_period = now.strftime('%Y-%m')
            else:
                return False
            
            result = self.client.table('rewards_check')\
                .select('id')\
                .eq('user_id', user_id)\
                .eq('achievement_type', achievement_type)\
                .eq('claim_period', current_period)\
                .limit(1)\
                .execute()
            
            return len(result.data) > 0 if result.data else False
        except Exception as e:
            print(f"Error checking reward claim for period: {e}")
            return False

    def record_reward_claim(self, user_id: str, achievement_type: str) -> bool:
        """Record that user claimed this achievement type for the current period"""
        from datetime import datetime
        
        if self.mock_mode:
            if not hasattr(self, 'mock_reward_claims'):
                self.mock_reward_claims = []
            
            # Calculate current period
            now = datetime.now()
            if achievement_type == 'daily_perfect':
                current_period = now.strftime('%Y-%m-%d')
            elif achievement_type == 'weekly_perfect':
                year, week, _ = now.isocalendar()
                current_period = f"{year}-{week:02d}"
            elif achievement_type == 'monthly_perfect':
                current_period = now.strftime('%Y-%m')
            else:
                return False
            
            self.mock_reward_claims.append({
                'user_id': user_id,
                'achievement_type': achievement_type,
                'claim_date': now.date().isoformat(),
                'claim_period': current_period
            })
            return True
        
        try:
            now = datetime.now()
            
            # Calculate current period based on achievement type
            if achievement_type == 'daily_perfect':
                current_period = now.strftime('%Y-%m-%d')
            elif achievement_type == 'weekly_perfect':
                year, week, _ = now.isocalendar()
                current_period = f"{year}-{week:02d}"
            elif achievement_type == 'monthly_perfect':
                current_period = now.strftime('%Y-%m')
            else:
                return False
            
            result = self.client.table('rewards_check').insert({
                'user_id': user_id,
                'achievement_type': achievement_type,
                'claim_date': now.date().isoformat(),
                'claim_period': current_period
            }).execute()
            
            return result.data is not None and len(result.data) > 0
        except Exception as e:
            print(f"Error recording reward claim: {e}")
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


    # ========================================================================
    # VOICE CALL PREFERENCES
    # ========================================================================
    
    def get_call_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's call preferences"""
        if self.mock_mode:
            if not hasattr(self, 'mock_call_prefs'):
                self.mock_call_prefs = {}
            return self.mock_call_prefs.get(user_id)
        
        try:
            result = self.client.table('call_preferences')\
                .select('*')\
                .eq('user_id', user_id)\
                .limit(1)\
                .execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error getting call preferences: {e}")
            return None
    
    def save_call_preferences(self, user_id: str, preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Save user's call preferences"""
        pref_data = {
            'user_id': user_id,
            'call_method': preferences.get('call_method', 'webrtc'),
            'phone_number': preferences.get('phone_number'),
            'allow_calls': preferences.get('allow_calls', True),
            'preferred_times': preferences.get('preferred_times', [])
        }
        
        if self.mock_mode:
            if not hasattr(self, 'mock_call_prefs'):
                self.mock_call_prefs = {}
            self.mock_call_prefs[user_id] = pref_data
            return pref_data
        
        try:
            result = self.client.table('call_preferences').upsert(pref_data).execute()
            return result.data[0] if result.data else pref_data
        except Exception as e:
            print(f"Error saving call preferences: {e}")
            return pref_data
    
    # ========================================================================
    # SCHEDULED CALLS
    # ========================================================================
    
    def create_scheduled_call(self, call_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a scheduled call"""
        if self.mock_mode:
            call = {**call_data, "id": self.next_id, "created_at": datetime.now().isoformat()}
            if not hasattr(self, 'mock_scheduled_calls'):
                self.mock_scheduled_calls = []
            self.mock_scheduled_calls.append(call)
            self.next_id += 1
            return call
        
        try:
            result = self.client.table('scheduled_calls').insert(call_data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error creating scheduled call: {e}")
            return None
    
    def get_scheduled_call(self, call_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific scheduled call"""
        if self.mock_mode:
            if not hasattr(self, 'mock_scheduled_calls'):
                return None
            return next((c for c in self.mock_scheduled_calls if c['id'] == call_id), None)
        
        try:
            result = self.client.table('scheduled_calls').select('*').eq('id', call_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error getting scheduled call: {e}")
            return None
    
    def get_scheduled_calls(self, user_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get scheduled calls for a user"""
        if self.mock_mode:
            if not hasattr(self, 'mock_scheduled_calls'):
                self.mock_scheduled_calls = []
            calls = [c for c in self.mock_scheduled_calls if c.get('user_id') == user_id]
            if status:
                calls = [c for c in calls if c.get('status') == status]
            return calls
        
        try:
            query = self.client.table('scheduled_calls').select('*').eq('user_id', user_id)
            if status:
                query = query.eq('status', status)
            result = query.order('scheduled_time', desc=False).execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error getting scheduled calls: {e}")
            return []
    
    def update_scheduled_call(self, call_id: int, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a scheduled call"""
        if self.mock_mode:
            if not hasattr(self, 'mock_scheduled_calls'):
                return None
            for i, c in enumerate(self.mock_scheduled_calls):
                if c['id'] == call_id:
                    self.mock_scheduled_calls[i].update(update_data)
                    return self.mock_scheduled_calls[i]
            return None
        
        try:
            result = self.client.table('scheduled_calls').update(update_data).eq('id', call_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error updating scheduled call: {e}")
            return None
    
    # ========================================================================
    # CALL LOGS
    # ========================================================================
    
    def create_call_log(self, log_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a call log entry"""
        if self.mock_mode:
            log = {**log_data, "id": self.next_id, "created_at": datetime.now().isoformat()}
            if not hasattr(self, 'mock_call_logs'):
                self.mock_call_logs = []
            self.mock_call_logs.append(log)
            self.next_id += 1
            return log
        
        try:
            result = self.client.table('call_logs').insert(log_data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error creating call log: {e}")
            return None
    
    def get_call_logs(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get call logs for a user"""
        if self.mock_mode:
            if not hasattr(self, 'mock_call_logs'):
                self.mock_call_logs = []
            logs = [l for l in self.mock_call_logs if l.get('user_id') == user_id]
            return logs[:limit]
        
        try:
            result = self.client.table('call_logs')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('created_at', desc=True)\
                .limit(limit)\
                .execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error getting call logs: {e}")
            return []
    # ========================================================================
    # DAILY SUCCESS RATES
    # ========================================================================
    
    def save_daily_success_rate(self, user_id: str, target_date: date, total_instances: int, completed_instances: int, time_remaining: Optional[int] = None) -> Dict[str, Any]:
        """Save or update daily success rate for a specific date with comprehensive error handling"""
        
        # Input validation and sanitization with edge case handling
        try:
            # Handle edge case: empty or invalid user_id
            if not user_id or not isinstance(user_id, str) or not user_id.strip():
                print(f"[ERROR] Invalid user_id provided: '{user_id}'")
                return None
            
            user_id = user_id.strip()  # Remove whitespace
            
            # Handle edge case: invalid date
            from datetime import date as date_type, datetime
            if not isinstance(target_date, date_type):
                print(f"[ERROR] Invalid date provided: {target_date} (type: {type(target_date)})")
                return None
            
            # Handle edge case: future dates (optional validation)
            if target_date > datetime.now().date():
                print(f"[WARNING] Future date provided: {target_date}, allowing but noting")
            
            # Sanitize numeric inputs with edge case handling
            try:
                total_instances = max(0, int(total_instances)) if total_instances is not None else 0
            except (TypeError, ValueError) as total_error:
                print(f"[WARNING] Invalid total_instances '{total_instances}': {total_error}, defaulting to 0")
                total_instances = 0
            
            try:
                completed_instances = max(0, int(completed_instances)) if completed_instances is not None else 0
            except (TypeError, ValueError) as completed_error:
                print(f"[WARNING] Invalid completed_instances '{completed_instances}': {completed_error}, defaulting to 0")
                completed_instances = 0
            
            # Handle edge case: completed instances exceeding total instances
            if completed_instances > total_instances:
                print(f"[WARNING] Completed instances ({completed_instances}) exceeds total ({total_instances}), capping to total")
                completed_instances = total_instances
            
            # Handle edge case: users with no habits (zero values)
            if total_instances == 0 and completed_instances == 0:
                print(f"[DEBUG] User {user_id} has no habits on {date}, storing zero values")
            
            # Calculate success rate safely with edge case handling
            try:
                if total_instances > 0:
                    success_rate = (completed_instances / total_instances * 100)
                    success_rate = max(0.0, min(100.0, round(success_rate, 2)))  # Clamp between 0-100
                else:
                    success_rate = 0.0
            except (ZeroDivisionError, TypeError, ValueError, OverflowError) as calc_error:
                print(f"[WARNING] Success rate calculation failed: {calc_error}, defaulting to 0")
                success_rate = 0.0
            
            # Sanitize time_remaining with edge case handling
            if time_remaining is not None:
                try:
                    time_remaining = max(0, int(time_remaining))
                    # Handle edge case: unreasonably large time values (more than 24 hours)
                    if time_remaining > 1440:  # 24 hours in minutes
                        print(f"[WARNING] Unusually large time_remaining ({time_remaining} minutes), capping to 1440")
                        time_remaining = 1440
                except (TypeError, ValueError, OverflowError) as time_error:
                    print(f"[WARNING] Invalid time_remaining value '{time_remaining}': {time_error}, setting to None")
                    time_remaining = None
            
        except Exception as validation_error:
            print(f"[ERROR] Input validation failed: {validation_error}")
            import traceback
            traceback.print_exc()
            # Return None to indicate failure
            return None
        
        # Prepare data for storage
        try:
            rate_data = {
                'user_id': user_id,
                'date': target_date.isoformat(),
                'total_habit_instances': total_instances,
                'completed_instances': completed_instances,
                'success_rate': success_rate,
                'time_remaining': time_remaining,
                'updated_at': datetime.now().isoformat()
            }
        except Exception as data_prep_error:
            print(f"[ERROR] Data preparation failed: {data_prep_error}")
            return None
        
        # Handle mock mode with error handling
        if self.mock_mode:
            try:
                if not hasattr(self, 'mock_daily_rates'):
                    self.mock_daily_rates = []
                
                # Check if record exists
                existing_idx = None
                for i, rate in enumerate(self.mock_daily_rates):
                    if rate.get('user_id') == user_id and rate.get('date') == target_date.isoformat():
                        existing_idx = i
                        break
                
                if existing_idx is not None:
                    # Update existing
                    self.mock_daily_rates[existing_idx].update(rate_data)
                    return self.mock_daily_rates[existing_idx]
                else:
                    # Create new
                    rate_data['id'] = self.next_id
                    rate_data['created_at'] = datetime.now().isoformat()
                    self.mock_daily_rates.append(rate_data)
                    self.next_id += 1
                    return rate_data
                    
            except Exception as mock_error:
                print(f"[ERROR] Mock mode operation failed: {mock_error}")
                return None
        
        # Database operations with comprehensive error handling
        try:
            # Check if database client is available
            if not self.client:
                print(f"[ERROR] Database client not available")
                return None
            
            # Try to upsert the record
            result = self.client.table('daily_success_rates')\
                .upsert(rate_data, on_conflict='user_id,date')\
                .execute()
            
            if result and result.data and len(result.data) > 0:
                print(f"[DEBUG] Successfully saved daily success rate: {result.data[0]}")
                return result.data[0]
            else:
                print(f"[WARNING] Upsert operation returned no data")
                return None
                
        except Exception as db_error:
            print(f"[ERROR] Database operation failed: {db_error}")
            import traceback
            traceback.print_exc()
            
            # Try alternative approach: separate insert/update
            try:
                print(f"[DEBUG] Attempting alternative insert/update approach")
                
                # First try to get existing record
                existing = self.get_daily_success_rate(user_id, target_date)
                
                if existing:
                    # Update existing record
                    update_result = self.client.table('daily_success_rates')\
                        .update(rate_data)\
                        .eq('user_id', user_id)\
                        .eq('date', target_date.isoformat())\
                        .execute()
                    
                    if update_result and update_result.data:
                        print(f"[DEBUG] Successfully updated existing record")
                        return update_result.data[0]
                else:
                    # Insert new record
                    rate_data['created_at'] = datetime.now().isoformat()
                    insert_result = self.client.table('daily_success_rates')\
                        .insert(rate_data)\
                        .execute()
                    
                    if insert_result and insert_result.data:
                        print(f"[DEBUG] Successfully inserted new record")
                        return insert_result.data[0]
                
            except Exception as alt_error:
                print(f"[ERROR] Alternative database approach also failed: {alt_error}")
            
            # Final fallback: return the data we would have stored (for consistency)
            print(f"[WARNING] All database operations failed, returning prepared data without storage")
            rate_data['id'] = 0  # Indicate this wasn't actually stored
            rate_data['created_at'] = rate_data['updated_at']
            return rate_data
    
    def get_daily_success_rates_batch(self, user_id: str, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Get daily success rates for a date range with comprehensive error handling"""
        
        # Input validation
        try:
            if not user_id or not isinstance(user_id, str):
                print(f"[ERROR] Invalid user_id provided: {user_id}")
                return []
            
            if not hasattr(start_date, 'year') or not hasattr(end_date, 'year'):
                print(f"[ERROR] Invalid dates provided: {start_date}, {end_date}")
                return []
                
        except Exception as validation_error:
            print(f"[ERROR] Input validation failed: {validation_error}")
            return []
        
        # Handle mock mode
        if self.mock_mode:
            try:
                if not hasattr(self, 'mock_daily_rates'):
                    self.mock_daily_rates = []
                
                start_str = start_date.isoformat()
                end_str = end_date.isoformat()
                
                results = []
                for rate in self.mock_daily_rates:
                    if (rate.get('user_id') == user_id and 
                        start_str <= rate.get('date', '') <= end_str):
                        if self._validate_daily_success_rate_data(rate):
                            results.append(rate)
                
                return results
                
            except Exception as mock_error:
                print(f"[ERROR] Mock mode batch operation failed: {mock_error}")
                return []
        
        # Database operations
        try:
            if not self.client:
                print(f"[ERROR] Database client not available")
                return []
            
            # Execute batch query
            result = self.client.table('daily_success_rates')\
                .select('*')\
                .eq('user_id', user_id)\
                .gte('date', start_date.isoformat())\
                .lte('date', end_date.isoformat())\
                .execute()
            
            if result and result.data:
                validated_results = []
                for item in result.data:
                    if self._validate_daily_success_rate_data(item):
                        validated_results.append(item)
                    else:
                        print(f"[WARNING] Found corrupted data for {user_id} on {item.get('date')}")
                
                return validated_results
            
            return []
            
        except Exception as db_error:
            print(f"[ERROR] Database batch query failed: {db_error}")
            return []

    def get_daily_success_rate(self, user_id: str, date: date) -> Optional[Dict[str, Any]]:
        """Get daily success rate for a specific date with comprehensive error handling"""
        
        # Input validation
        try:
            if not user_id or not isinstance(user_id, str):
                print(f"[ERROR] Invalid user_id provided: {user_id}")
                return None
            
            if not hasattr(date, 'year'):  # Check if it's a date-like object
                print(f"[ERROR] Invalid date provided: {date}")
                return None
                
        except Exception as validation_error:
            print(f"[ERROR] Input validation failed: {validation_error}")
            return None
        
        # Handle mock mode with error handling
        if self.mock_mode:
            try:
                if not hasattr(self, 'mock_daily_rates'):
                    self.mock_daily_rates = []
                
                date_str = date.isoformat()
                for rate in self.mock_daily_rates:
                    if rate.get('user_id') == user_id and rate.get('date') == date_str:
                        # Validate the data before returning
                        if self._validate_daily_success_rate_data(rate):
                            return rate
                        else:
                            print(f"[WARNING] Found corrupted mock data for {user_id} on {date_str}")
                            return None
                
                return None
                
            except Exception as mock_error:
                print(f"[ERROR] Mock mode operation failed: {mock_error}")
                return None
        
        # Database operations with comprehensive error handling
        try:
            # Check if database client is available
            if not self.client:
                print(f"[ERROR] Database client not available")
                return None
            
            # Execute the query
            result = self.client.table('daily_success_rates')\
                .select('*')\
                .eq('user_id', user_id)\
                .eq('date', date.isoformat())\
                .execute()
            
            if result and result.data and len(result.data) > 0:
                retrieved_data = result.data[0]
                
                # Validate retrieved data
                if self._validate_daily_success_rate_data(retrieved_data):
                    print(f"[DEBUG] Successfully retrieved daily success rate for {user_id} on {date}")
                    return retrieved_data
                else:
                    print(f"[WARNING] Retrieved corrupted data for {user_id} on {date}, returning None")
                    return None
            else:
                print(f"[DEBUG] No daily success rate found for {user_id} on {date}")
                return None
                
        except Exception as db_error:
            print(f"[ERROR] Database query failed: {db_error}")
            import traceback
            traceback.print_exc()
            
            # Try alternative query approach
            try:
                print(f"[DEBUG] Attempting alternative query approach")
                
                # Use a more basic query
                alt_result = self.client.table('daily_success_rates')\
                    .select('id, user_id, date, total_habit_instances, completed_instances, success_rate, time_remaining')\
                    .eq('user_id', user_id)\
                    .eq('date', date.isoformat())\
                    .limit(1)\
                    .execute()
                
                if alt_result and alt_result.data and len(alt_result.data) > 0:
                    alt_data = alt_result.data[0]
                    if self._validate_daily_success_rate_data(alt_data):
                        print(f"[DEBUG] Alternative query succeeded")
                        return alt_data
                
            except Exception as alt_error:
                print(f"[ERROR] Alternative query also failed: {alt_error}")
            
            return None
    
    def _validate_daily_success_rate_data(self, data: Dict[str, Any]) -> bool:
        """Validate daily success rate data for corruption or inconsistencies"""
        try:
            if not isinstance(data, dict):
                return False
            
            # Check required fields
            required_fields = ['user_id', 'date', 'total_habit_instances', 'completed_instances', 'success_rate']
            for field in required_fields:
                if field not in data:
                    print(f"[WARNING] Missing required field: {field}")
                    return False
            
            # Validate data types and ranges
            total_instances = data.get('total_habit_instances', 0)
            completed_instances = data.get('completed_instances', 0)
            success_rate = data.get('success_rate', 0)
            
            # Check numeric values
            if not isinstance(total_instances, (int, float)) or total_instances < 0:
                print(f"[WARNING] Invalid total_habit_instances: {total_instances}")
                return False
            
            if not isinstance(completed_instances, (int, float)) or completed_instances < 0:
                print(f"[WARNING] Invalid completed_instances: {completed_instances}")
                return False
            
            if not isinstance(success_rate, (int, float)) or success_rate < 0 or success_rate > 100:
                print(f"[WARNING] Invalid success_rate: {success_rate}")
                return False
            
            # Check logical consistency
            if completed_instances > total_instances:
                print(f"[WARNING] Completed instances ({completed_instances}) exceeds total ({total_instances})")
                return False
            
            # Validate success rate calculation (allow small floating point differences)
            if total_instances > 0:
                expected_rate = (completed_instances / total_instances) * 100
                if abs(success_rate - expected_rate) > 0.1:
                    print(f"[WARNING] Success rate mismatch: stored={success_rate}, expected={expected_rate}")
                    return False
            
            return True
            
        except Exception as validation_error:
            print(f"[ERROR] Data validation failed: {validation_error}")
            return False
    
    def _recalculate_and_update_corrupted_data(self, user_id: str, target_date: date, timezone_offset: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """
        Handle corrupted or invalid stored data by recalculating and updating
        This method is called when stored data fails validation
        """
        try:
            print(f"[DEBUG] Recalculating corrupted data for user {user_id} on {target_date}")
            
            # Use the existing calculation logic to get fresh stats
            calculated_stats = self.get_today_stats(user_id, timezone_offset)
            
            if not calculated_stats or not isinstance(calculated_stats, dict):
                print(f"[ERROR] Failed to recalculate stats for corrupted data")
                return None
            
            # Validate and sanitize the calculated stats
            validated_stats = {
                'habits_today': max(0, calculated_stats.get('habits_today', 0)),
                'completed_today': max(0, calculated_stats.get('completed_today', 0)),
                'success_rate_today': max(0.0, min(100.0, calculated_stats.get('success_rate_today', 0))),
                'time_remaining': max(0, calculated_stats.get('time_remaining', 0)),
                'completions_today': max(0, calculated_stats.get('completions_today', 0)),
                'source': 'recalculated_from_corrupted'
            }
            
            # Additional validation for calculated stats
            if validated_stats['completed_today'] > validated_stats['habits_today']:
                print(f"[WARNING] Recalculated stats inconsistent, capping completed to total")
                validated_stats['completed_today'] = validated_stats['habits_today']
                # Recalculate success rate
                if validated_stats['habits_today'] > 0:
                    validated_stats['success_rate_today'] = (
                        validated_stats['completed_today'] / validated_stats['habits_today']
                    ) * 100
                else:
                    validated_stats['success_rate_today'] = 0.0
            
            # Try to update the corrupted record with correct data
            try:
                updated_result = self.save_daily_success_rate(
                    user_id=user_id,
                    target_date=target_date,
                    total_instances=validated_stats['habits_today'],
                    completed_instances=validated_stats['completed_today'],
                    time_remaining=validated_stats['time_remaining']
                )
                
                if updated_result:
                    print(f"[DEBUG] Successfully updated corrupted data with recalculated values")
                    validated_stats['source'] = 'recalculated_and_updated'
                else:
                    print(f"[WARNING] Failed to update corrupted data, but returning recalculated values")
                
            except Exception as update_error:
                print(f"[ERROR] Failed to update corrupted data: {update_error}")
                # Still return the recalculated data even if update fails
                
            return validated_stats
            
        except Exception as e:
            print(f"[ERROR] Failed to recalculate corrupted data: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _create_zero_value_stats(self) -> Dict[str, Any]:
        """
        Create zero-value statistics for users with no habits
        This handles the edge case where a user has no habits defined
        """
        return {
            'habits_today': 0,
            'completed_today': 0,
            'success_rate_today': 0.0,
            'time_remaining': 0,
            'completions_today': 0,
            'source': 'no_habits'
        }

    def get_daily_success_rates_range(self, user_id: str, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Get daily success rates for a date range"""
        if self.mock_mode:
            if not hasattr(self, 'mock_daily_rates'):
                self.mock_daily_rates = []
            
            rates = []
            for rate in self.mock_daily_rates:
                if (rate.get('user_id') == user_id and 
                    start_date.isoformat() <= rate.get('date', '') <= end_date.isoformat()):
                    rates.append(rate)
            return sorted(rates, key=lambda x: x.get('date', ''))
        
        try:
            result = self.client.table('daily_success_rates')\
                .select('*')\
                .eq('user_id', user_id)\
                .gte('date', start_date.isoformat())\
                .lte('date', end_date.isoformat())\
                .order('date')\
                .execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error getting daily success rates range: {e}")
            return []
    
    def delete_daily_success_rate(self, user_id: str, date: date) -> bool:
        """Delete daily success rate for a specific date"""
        if self.mock_mode:
            if not hasattr(self, 'mock_daily_rates'):
                self.mock_daily_rates = []
            
            initial_len = len(self.mock_daily_rates)
            self.mock_daily_rates = [
                rate for rate in self.mock_daily_rates 
                if not (rate.get('user_id') == user_id and rate.get('date') == date.isoformat())
            ]
            return len(self.mock_daily_rates) < initial_len
        
        try:
            result = self.client.table('daily_success_rates')\
                .delete()\
                .eq('user_id', user_id)\
                .eq('date', date.isoformat())\
                .execute()
            return len(result.data) > 0 if result.data else False
        except Exception as e:
            print(f"Error deleting daily success rate: {e}")
            return False



    # ========================================================================
    # FRICTION HELPER SYSTEM
    # ========================================================================
    
    def create_friction_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a friction help session record"""
        if self.mock_mode:
            session = {
                **session_data,
                "id": self.next_id,
                "created_at": datetime.now().isoformat()
            }
            # Mock storage would go here
            self.next_id += 1
            return session
        
        try:
            response = self.client.table("friction_sessions").insert(session_data).execute()
            return response.data[0]
        except Exception as e:
            print(f"Error creating friction session: {e}")
            raise
    
    def get_user_friction_history(self, user_id: str, habit_id: Optional[int] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Get user's friction help history for context"""
        if self.mock_mode:
            # Mock implementation
            return []
        
        try:
            query = self.client.table("friction_sessions").select("*").eq("user_id", user_id)
            
            if habit_id:
                query = query.eq("habit_id", habit_id)
            
            response = query.order("created_at", desc=True).limit(limit).execute()
            return response.data
        except Exception as e:
            print(f"Error getting friction history: {e}")
            return []
    
    def get_user_ml_context(self, user_id: str, habit_id: Optional[int] = None) -> Dict[str, Any]:
        """Gather ML context for friction help (completion patterns, energy levels, etc.)"""
        try:
            # Get recent completions for pattern analysis
            recent_completions = self.get_completions(
                user_id=user_id,
                habit_id=habit_id,
                limit=30  # Last 30 completions
            )
            
            # Analyze completion patterns
            energy_patterns = {}
            mood_patterns = {}
            time_patterns = {}
            
            for completion in recent_completions:
                # Energy level analysis
                energy_before = completion.get('energy_level_before')
                energy_after = completion.get('energy_level_after')
                if energy_before:
                    energy_patterns[energy_before] = energy_patterns.get(energy_before, 0) + 1
                
                # Mood analysis
                mood_before = completion.get('mood_before')
                mood_after = completion.get('mood_after')
                if mood_before:
                    mood_patterns[mood_before] = mood_patterns.get(mood_before, 0) + 1
                
                # Time of day analysis
                time_of_day_id = completion.get('time_of_day_id')
                if time_of_day_id:
                    time_patterns[time_of_day_id] = time_patterns.get(time_of_day_id, 0) + 1
            
            # Get habit-specific data if habit_id provided
            habit_data = None
            if habit_id:
                habit_data = self.get_habit(habit_id)
            
            # Calculate success rates by time of day
            time_success_rates = {}
            for time_id, count in time_patterns.items():
                total_attempts = len([c for c in recent_completions if c.get('time_of_day_id') == time_id])
                if total_attempts > 0:
                    time_success_rates[time_id] = count / total_attempts
            
            return {
                'recent_completions_count': len(recent_completions),
                'energy_patterns': energy_patterns,
                'mood_patterns': mood_patterns,
                'time_patterns': time_patterns,
                'time_success_rates': time_success_rates,
                'habit_data': habit_data,
                'most_successful_energy': max(energy_patterns.items(), key=lambda x: x[1])[0] if energy_patterns else None,
                'most_successful_time': max(time_success_rates.items(), key=lambda x: x[1])[0] if time_success_rates else None,
                'analysis_date': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error gathering ML context: {e}")
            return {
                'recent_completions_count': 0,
                'energy_patterns': {},
                'mood_patterns': {},
                'time_patterns': {},
                'time_success_rates': {},
                'habit_data': None,
                'most_successful_energy': None,
                'most_successful_time': None,
                'analysis_date': datetime.now().isoformat(),
                'error': str(e)
            }
    
    def update_friction_session_feedback(self, session_id: int, action_taken: str, was_helpful: bool) -> bool:
        """Update friction session with user feedback"""
        if self.mock_mode:
            return True
        
        try:
            response = self.client.table("friction_sessions").update({
                "action_taken": action_taken,
                "was_helpful": was_helpful,
                "updated_at": datetime.now().isoformat()
            }).eq("id", session_id).execute()
            
            return len(response.data) > 0
        except Exception as e:
            print(f"Error updating friction session feedback: {e}")
            return False


    # ============================================================================
    # JOURNEY OBSTACLE TRACKING SYSTEM
    # ============================================================================
    
    def create_obstacle_encounter(self, encounter_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create an obstacle encounter record"""
        if self.mock_mode:
            encounter = {
                **encounter_data,
                "id": self.next_id,
                "encountered_at": datetime.now().isoformat()
            }
            if not hasattr(self, 'mock_obstacle_encounters'):
                self.mock_obstacle_encounters = []
            self.mock_obstacle_encounters.append(encounter)
            self.next_id += 1
            return encounter
        
        try:
            response = self.client.table("obstacle_encounters").insert(encounter_data).execute()
            return response.data[0]
        except Exception as e:
            print(f"Error creating obstacle encounter: {e}")
            raise
    
    def update_obstacle_resolution(
        self, 
        encounter_id: int, 
        was_overcome: bool, 
        solution_used: str = None,
        time_to_resolve: int = None
    ) -> bool:
        """Update obstacle encounter with resolution details"""
        if self.mock_mode:
            if hasattr(self, 'mock_obstacle_encounters'):
                for encounter in self.mock_obstacle_encounters:
                    if encounter.get("id") == encounter_id:
                        encounter.update({
                            "was_overcome": was_overcome,
                            "solution_used": solution_used,
                            "time_to_resolve": time_to_resolve,
                            "resolved_at": datetime.now().isoformat()
                        })
                        return True
            return False
        
        try:
            update_data = {
                "was_overcome": was_overcome,
                "resolved_at": datetime.now().isoformat()
            }
            if solution_used:
                update_data["solution_used"] = solution_used
            if time_to_resolve:
                update_data["time_to_resolve"] = time_to_resolve
            
            response = self.client.table("obstacle_encounters").update(update_data).eq("id", encounter_id).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error updating obstacle resolution: {e}")
            return False
    
    def get_user_obstacle_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user's obstacle statistics"""
        if self.mock_mode:
            # Mock obstacle stats
            return {
                'user_id': user_id,
                'total_obstacles_encountered': 0,
                'total_obstacles_overcome': 0,
                'current_success_streak': 0,
                'longest_success_streak': 0,
                'distraction_detours_overcome': 0,
                'energy_valleys_overcome': 0,
                'maze_mountains_overcome': 0,
                'memory_fogs_overcome': 0,
                'journey_level': 1,
                'journey_experience': 0,
                'obstacle_badges_earned': [],
                'journey_milestones_reached': [],
                'last_updated': datetime.now().isoformat()
            }
        
        try:
            response = self.client.table("obstacle_stats").select("*").eq("user_id", user_id).execute()
            
            if response.data:
                return response.data[0]
            else:
                # Create initial stats record
                initial_stats = {
                    'user_id': user_id,
                    'total_obstacles_encountered': 0,
                    'total_obstacles_overcome': 0,
                    'current_success_streak': 0,
                    'longest_success_streak': 0,
                    'distraction_detours_overcome': 0,
                    'energy_valleys_overcome': 0,
                    'maze_mountains_overcome': 0,
                    'memory_fogs_overcome': 0,
                    'journey_level': 1,
                    'journey_experience': 0,
                    'obstacle_badges_earned': [],
                    'journey_milestones_reached': [],
                    'last_updated': datetime.now().isoformat()
                }
                
                create_response = self.client.table("obstacle_stats").insert(initial_stats).execute()
                return create_response.data[0]
                
        except Exception as e:
            print(f"Error getting obstacle stats: {e}")
            return {}
    
    def update_obstacle_stats(self, user_id: str, obstacle_type: str, was_overcome: bool) -> bool:
        """Update user's obstacle statistics after encounter resolution"""
        try:
            current_stats = self.get_user_obstacle_stats(user_id)
            
            # Update counters
            current_stats['total_obstacles_encountered'] += 1
            
            if was_overcome:
                current_stats['total_obstacles_overcome'] += 1
                
                # Update obstacle-specific counters
                obstacle_map = {
                    'distraction_detour': 'distraction_detours_overcome',
                    'energy_drain_valley': 'energy_valleys_overcome', 
                    'maze_mountain': 'maze_mountains_overcome',
                    'memory_fog': 'memory_fogs_overcome'
                }
                
                if obstacle_type in obstacle_map:
                    stat_key = obstacle_map[obstacle_type]
                    current_stats[stat_key] = current_stats.get(stat_key, 0) + 1
                
                # Update success streak
                current_stats['current_success_streak'] += 1
                if current_stats['current_success_streak'] > current_stats.get('longest_success_streak', 0):
                    current_stats['longest_success_streak'] = current_stats['current_success_streak']
                
                # Add experience points
                current_stats['journey_experience'] = current_stats.get('journey_experience', 0) + 10
                
                # Level up calculation (every 100 XP)
                new_level = (current_stats['journey_experience'] // 100) + 1
                current_stats['journey_level'] = min(new_level, 100)
                
            else:
                # Reset success streak if obstacle not overcome
                current_stats['current_success_streak'] = 0
            
            current_stats['last_updated'] = datetime.now().isoformat()
            
            if self.mock_mode:
                return True
            
            # Update in database
            response = self.client.table("obstacle_stats").update(current_stats).eq("user_id", user_id).execute()
            return len(response.data) > 0
            
        except Exception as e:
            print(f"Error updating obstacle stats: {e}")
            return False
    
    def get_obstacle_history(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get user's obstacle encounter history"""
        if self.mock_mode:
            if hasattr(self, 'mock_obstacle_encounters'):
                user_encounters = [e for e in self.mock_obstacle_encounters if e.get("user_id") == user_id]
                return sorted(user_encounters, key=lambda x: x.get("encountered_at", ""), reverse=True)[:limit]
            return []
        
        try:
            response = self.client.table("obstacle_encounters")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("encountered_at", desc=True)\
                .limit(limit)\
                .execute()
            
            return response.data
        except Exception as e:
            print(f"Error getting obstacle history: {e}")
            return []
    
    def create_journey_achievement(self, achievement_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a journey achievement record"""
        if self.mock_mode:
            achievement = {
                **achievement_data,
                "id": self.next_id,
                "created_at": datetime.now().isoformat()
            }
            if not hasattr(self, 'mock_journey_achievements'):
                self.mock_journey_achievements = []
            self.mock_journey_achievements.append(achievement)
            self.next_id += 1
            return achievement
        
        try:
            response = self.client.table("journey_achievements").insert(achievement_data).execute()
            return response.data[0]
        except Exception as e:
            print(f"Error creating journey achievement: {e}")
            raise
    
    def unlock_journey_achievement(self, achievement_id: int) -> bool:
        """Mark a journey achievement as unlocked"""
        if self.mock_mode:
            if hasattr(self, 'mock_journey_achievements'):
                for achievement in self.mock_journey_achievements:
                    if achievement.get("id") == achievement_id:
                        achievement.update({
                            "is_unlocked": True,
                            "unlocked_at": datetime.now().isoformat()
                        })
                        return True
            return False
        
        try:
            response = self.client.table("journey_achievements").update({
                "is_unlocked": True,
                "unlocked_at": datetime.now().isoformat()
            }).eq("id", achievement_id).execute()
            
            return len(response.data) > 0
        except Exception as e:
            print(f"Error unlocking journey achievement: {e}")
            return False
    
    def get_user_journey_achievements(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's journey achievements"""
        if self.mock_mode:
            if hasattr(self, 'mock_journey_achievements'):
                return [a for a in self.mock_journey_achievements if a.get("user_id") == user_id]
            return []
        
        try:
            response = self.client.table("journey_achievements")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("created_at", desc=True)\
                .execute()
            
            return response.data
        except Exception as e:
            print(f"Error getting journey achievements: {e}")
            return []


    # ============================================================================
    # USER PREFERENCES MANAGEMENT
    # ============================================================================

    def get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get user preferences including timezone"""
        if self.mock_mode:
            # Mock mode - return default preferences
            return {
                'user_id': user_id,
                'timezone': 'UTC',
                'date_format': 'YYYY-MM-DD',
                'time_format': '24h',
                'week_start': 'monday'
            }
        
        try:
            result = self.client.table('user_preferences')\
                .select('*')\
                .eq('user_id', user_id)\
                .execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            else:
                # Return default preferences if none found
                return {
                    'user_id': user_id,
                    'timezone': 'UTC',
                    'date_format': 'YYYY-MM-DD',
                    'time_format': '24h',
                    'week_start': 'monday'
                }
        except Exception as e:
            print(f"Error getting user preferences: {e}")
            # Return default preferences on error
            return {
                'user_id': user_id,
                'timezone': 'UTC',
                'date_format': 'YYYY-MM-DD',
                'time_format': '24h',
                'week_start': 'monday'
            }

    def update_user_preferences(self, user_id: str, preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Update user preferences"""
        if self.mock_mode:
            # Mock mode - just return the updated preferences
            return {
                'user_id': user_id,
                **preferences
            }
        
        try:
            # Check if preferences exist
            existing = self.client.table('user_preferences')\
                .select('*')\
                .eq('user_id', user_id)\
                .execute()
            
            preferences_data = {
                'user_id': user_id,
                **preferences,
                'updated_at': datetime.now().isoformat()
            }
            
            if existing.data and len(existing.data) > 0:
                # Update existing preferences
                result = self.client.table('user_preferences')\
                    .update(preferences_data)\
                    .eq('user_id', user_id)\
                    .execute()
            else:
                # Insert new preferences
                preferences_data['created_at'] = datetime.now().isoformat()
                result = self.client.table('user_preferences')\
                    .insert(preferences_data)\
                    .execute()
            
            return result.data[0] if result.data else preferences_data
        except Exception as e:
            print(f"Error updating user preferences: {e}")
            return preferences_data

    def get_user_timezone_offset(self, user_id: str) -> int:
        """Get user's timezone offset in minutes from UTC"""
        try:
            import pytz
            from datetime import datetime
            
            preferences = self.get_user_preferences(user_id)
            timezone_name = preferences.get('timezone', 'UTC')
            
            # Convert timezone name to offset
            tz = pytz.timezone(timezone_name)
            now = datetime.now(tz)
            offset_seconds = now.utcoffset().total_seconds()
            offset_minutes = int(offset_seconds / 60)
            
            return offset_minutes
        except Exception as e:
            print(f"Error getting timezone offset: {e}")
            return 0  # Default to UTC

    def _fallback_basic_stats_calculation(self, user_id: str, target_date: date, timezone_offset: Optional[int] = None) -> Dict[str, Any]:
        """
        Fallback method for basic daily statistics calculation when main calculation fails
        This method provides a simplified calculation with minimal database dependencies
        """
        from datetime import datetime, timedelta
        
        print(f"[DEBUG] _fallback_basic_stats_calculation for user {user_id} on {target_date}")
        
        try:
            # Handle users with no habits (edge case)
            try:
                habits = self.get_habits(user_id)
                if not habits:
                    print(f"[DEBUG] User {user_id} has no habits, returning zero stats")
                    return {
                        'habits_today': 0,
                        'completed_today': 0,
                        'success_rate_today': 0.0,
                        'time_remaining': 0,
                        'completions_today': 0
                    }
            except Exception as habits_error:
                print(f"[ERROR] Failed to get habits in fallback: {habits_error}")
                # Return safe defaults if we can't even get habits
                return {
                    'habits_today': 0,
                    'completed_today': 0,
                    'success_rate_today': 0.0,
                    'time_remaining': 0,
                    'completions_today': 0
                }
            
            # Calculate day of week for target date with error handling
            try:
                if timezone_offset is not None:
                    # Adjust for timezone when determining day of week
                    utc_datetime = datetime.combine(target_date, datetime.min.time())
                    local_datetime = utc_datetime + timedelta(minutes=timezone_offset)
                    day_of_week = local_datetime.strftime('%a')
                else:
                    # Use server timezone as fallback
                    day_of_week = target_date.strftime('%a')
                    
                print(f"[DEBUG] Target date {target_date} is {day_of_week}")
                
            except Exception as dow_error:
                print(f"[ERROR] Failed to calculate day of week: {dow_error}")
                # Use a safe default
                day_of_week = target_date.strftime('%a')
            
            # Count habits scheduled for today with error handling
            total_instances = 0
            try:
                for habit in habits:
                    try:
                        habit_days = habit.get('days', [])
                        habit_times = habit.get('times_of_day', [])
                        
                        # Check if habit is scheduled for this day
                        is_scheduled = not habit_days or day_of_week in habit_days
                        
                        if is_scheduled:
                            # Count instances based on times of day
                            times_count = len(habit_times) if habit_times else 1
                            total_instances += times_count
                            
                    except Exception as habit_error:
                        print(f"[WARNING] Error processing habit {habit.get('id', 'unknown')}: {habit_error}")
                        # Skip this habit but continue with others
                        continue
                        
            except Exception as counting_error:
                print(f"[ERROR] Failed to count habit instances: {counting_error}")
                total_instances = len(habits)  # Fallback to simple count
            
            # Get completions for the target date with error handling
            completed_instances = 0
            try:
                completions = self.get_completions(
                    user_id=user_id,
                    start_date=target_date,
                    end_date=target_date
                )
                
                if completions:
                    # Count unique habit completions (handle multiple completions per habit)
                    completed_habits = set()
                    for completion in completions:
                        try:
                            habit_id = completion.get('habit_id')
                            if habit_id:
                                completed_habits.add(habit_id)
                        except Exception as completion_error:
                            print(f"[WARNING] Error processing completion: {completion_error}")
                            continue
                    
                    completed_instances = len(completed_habits)
                else:
                    completed_instances = 0
                    
            except Exception as completions_error:
                print(f"[ERROR] Failed to get completions: {completions_error}")
                completed_instances = 0
            
            # Calculate success rate with error handling
            try:
                if total_instances > 0:
                    success_rate = (completed_instances / total_instances) * 100
                    success_rate = max(0.0, min(100.0, round(success_rate, 2)))
                else:
                    success_rate = 0.0
            except Exception as rate_error:
                print(f"[ERROR] Failed to calculate success rate: {rate_error}")
                success_rate = 0.0
            
            # Calculate time remaining with error handling (simplified version)
            time_remaining = 0
            try:
                for habit in habits:
                    try:
                        # Only count 'big' habits with estimated duration
                        if (habit.get('habit_type') == 'big' and 
                            habit.get('estimated_duration') and
                            habit.get('estimated_duration') > 0):
                            
                            habit_days = habit.get('days', [])
                            habit_times = habit.get('times_of_day', [])
                            
                            # Check if habit is scheduled for this day
                            is_scheduled = not habit_days or day_of_week in habit_days
                            
                            if is_scheduled:
                                # Check if this habit was completed
                                habit_completed = any(
                                    c.get('habit_id') == habit['id'] 
                                    for c in completions if completions
                                )
                                
                                if not habit_completed:
                                    # Add estimated duration for uncompleted habits
                                    times_count = len(habit_times) if habit_times else 1
                                    time_remaining += habit['estimated_duration'] * times_count
                                    
                    except Exception as time_error:
                        print(f"[WARNING] Error calculating time for habit {habit.get('id', 'unknown')}: {time_error}")
                        continue
                        
            except Exception as time_calc_error:
                print(f"[ERROR] Failed to calculate time remaining: {time_calc_error}")
                time_remaining = 0
            
            # Ensure all values are valid
            total_instances = max(0, total_instances)
            completed_instances = max(0, min(completed_instances, total_instances))
            success_rate = max(0.0, min(100.0, success_rate))
            time_remaining = max(0, time_remaining)
            
            fallback_stats = {
                'habits_today': total_instances,
                'completed_today': completed_instances,
                'success_rate_today': success_rate,
                'time_remaining': time_remaining,
                'completions_today': completed_instances
            }
            
            print(f"[DEBUG] Fallback calculation result: {fallback_stats}")
            return fallback_stats
            
        except Exception as e:
            print(f"[ERROR] Fallback calculation completely failed: {e}")
            import traceback
            traceback.print_exc()
            
            # Return absolute safe defaults
            return {
                'habits_today': 0,
                'completed_today': 0,
                'success_rate_today': 0.0,
                'time_remaining': 0,
                'completions_today': 0
            }

    def get_or_calculate_daily_stats(self, user_id: str, target_date: Optional[date] = None, timezone_offset: Optional[int] = None) -> Dict[str, Any]:
        """
        Database-first approach for daily statistics with comprehensive error handling:
        1. Try to get from daily_success_rates table
        2. If not found, calculate using existing logic
        3. Create DailySuccessRate model instance and store in database
        4. Return the data for immediate frontend display
        5. Fallback to real-time calculation when database operations fail
        6. Handle edge cases: no habits, missing timezone, corrupted data
        """
        from datetime import datetime, timedelta
        
        print(f"[DEBUG] get_or_calculate_daily_stats called with timezone_offset: {timezone_offset}")
        
        # Enhanced input validation and edge case handling
        try:
            if not user_id or not isinstance(user_id, str) or user_id.strip() == "":
                print(f"[ERROR] Invalid user_id: {user_id}")
                return self._get_safe_default_stats()
        except Exception as validation_error:
            print(f"[ERROR] User ID validation failed: {validation_error}")
            return self._get_safe_default_stats()
        
        # Enhanced timezone offset handling with comprehensive fallback
        try:
            if timezone_offset is not None:
                try:
                    # Validate timezone offset is reasonable (-12 to +14 hours in minutes)
                    if not isinstance(timezone_offset, (int, float)):
                        print(f"[WARNING] Invalid timezone offset type {type(timezone_offset)}, using server time")
                        timezone_offset = None
                    elif timezone_offset < -720 or timezone_offset > 840:
                        print(f"[WARNING] Invalid timezone offset value {timezone_offset} (outside -720 to +840 range), using server time")
                        timezone_offset = None
                        
                    if timezone_offset is not None:
                        utc_now = datetime.utcnow()
                        local_now = utc_now + timedelta(minutes=timezone_offset)
                        print(f"[DEBUG] UTC time: {utc_now}")
                        print(f"[DEBUG] Local time (with offset): {local_now}")
                    else:
                        local_now = datetime.now()
                        print(f"[DEBUG] Using server time after timezone validation failure")
                except (ValueError, TypeError, OverflowError) as tz_error:
                    print(f"[WARNING] Timezone calculation failed: {tz_error}, using server time")
                    local_now = datetime.now()
                    timezone_offset = None
            else:
                # Handle missing timezone offset (use server time as fallback)
                local_now = datetime.now()
                print(f"[DEBUG] No timezone offset provided, using server time as fallback: {local_now}")
        except Exception as time_error:
            print(f"[ERROR] Failed to calculate local time: {time_error}")
            # Fallback to server time
            local_now = datetime.now()
            timezone_offset = None
            print(f"[DEBUG] Emergency fallback to server time: {local_now}")
        
        # Enhanced date handling with validation
        try:
            if target_date is None:
                target_date = local_now.date()
            elif not hasattr(target_date, 'year'):  # Check if it's a date-like object
                print(f"[ERROR] Invalid target_date type: {type(target_date)}")
                target_date = local_now.date()
            # Validate date is not too far in the future or past
            today = datetime.now().date()
            days_diff = abs((target_date - today).days)
            if days_diff > 365:
                print(f"[WARNING] Target date {target_date} is {days_diff} days from today, using today")
                target_date = today
        except Exception as date_error:
            print(f"[ERROR] Date handling failed: {date_error}")
            target_date = datetime.now().date()
        
        print(f"[DEBUG] Target date: {target_date}")
        
        # Step 1: Try to get from daily_success_rates table with enhanced error handling
        try:
            stored_stats = self.get_daily_success_rate(user_id, target_date)
            
            if stored_stats:
                print(f"[DEBUG] Found stored stats: {stored_stats}")
                # Enhanced validation for corrupted or invalid stored data
                try:
                    if self._validate_daily_success_rate_data(stored_stats):
                        validated_stats = {
                            'habits_today': max(0, stored_stats.get('total_habit_instances', 0)),
                            'completed_today': max(0, stored_stats.get('completed_instances', 0)),
                            'success_rate_today': max(0.0, min(100.0, stored_stats.get('success_rate', 0))),
                            'time_remaining': max(0, stored_stats.get('time_remaining', 0)),
                            'completions_today': max(0, stored_stats.get('completed_instances', 0)),
                            'source': 'database'
                        }
                        
                        # Additional consistency check for corrupted data
                        if (validated_stats['completed_today'] > validated_stats['habits_today'] and 
                            validated_stats['habits_today'] > 0):
                            print(f"[WARNING] Inconsistent stored data detected (completed > total), recalculating and updating")
                            # Recalculate and update the corrupted data
                            corrected_stats = self._recalculate_and_update_corrupted_data(user_id, target_date, timezone_offset)
                            if corrected_stats:
                                return corrected_stats
                            # If correction fails, continue to calculation fallback
                            raise ValueError("Stored data is inconsistent and correction failed")
                        
                        # FRESHNESS CHECK: Verify cached stats match actual completions
                        try:
                            print(f"[DEBUG] Performing freshness check on cached stats...")
                            actual_completions_count = self._get_actual_completions_count(user_id, target_date)
                            cached_completions = validated_stats['completed_today']
                            
                            print(f"[DEBUG] Actual completions in DB: {actual_completions_count}")
                            print(f"[DEBUG] Cached completions: {cached_completions}")
                            
                            if actual_completions_count != cached_completions:
                                print(f"[WARNING] STALE CACHED DATA DETECTED!")
                                print(f"[WARNING] Cached shows {cached_completions} but DB has {actual_completions_count}")
                                print(f"[WARNING] Forcing recalculation and cache update...")
                                
                                # Force recalculation
                                fresh_stats = self.get_today_stats(user_id, timezone_offset)
                                if fresh_stats:
                                    # Update the cache with fresh data
                                    try:
                                        self.save_daily_success_rate(
                                            user_id=user_id,
                                            target_date=target_date,
                                            total_instances=fresh_stats.get('habits_today', 0),
                                            completed_instances=fresh_stats.get('completed_today', 0),
                                            time_remaining=fresh_stats.get('time_remaining', 0)
                                        )
                                        fresh_stats['source'] = 'recalculated_and_cached'
                                        print(f"[DEBUG] Cache updated with fresh data")
                                    except Exception as cache_update_error:
                                        print(f"[WARNING] Failed to update cache: {cache_update_error}")
                                        fresh_stats['source'] = 'recalculated_only'
                                    
                                    return fresh_stats
                                else:
                                    print(f"[ERROR] Fresh calculation failed, using stale cache")
                            else:
                                print(f"[DEBUG] Cached data is fresh and accurate")
                        except Exception as freshness_error:
                            print(f"[WARNING] Freshness check failed: {freshness_error}, using cached data")
                        
                        return validated_stats
                    else:
                        print(f"[WARNING] Stored data failed validation, attempting to recalculate and update")
                        # Handle corrupted data by recalculating and updating
                        corrected_stats = self._recalculate_and_update_corrupted_data(user_id, target_date, timezone_offset)
                        if corrected_stats:
                            return corrected_stats
                        # If correction fails, continue to calculation fallback
                        
                except Exception as validation_error:
                    print(f"[ERROR] Stored data validation failed: {validation_error}")
                    # Attempt to handle corrupted data
                    try:
                        corrected_stats = self._recalculate_and_update_corrupted_data(user_id, target_date, timezone_offset)
                        if corrected_stats:
                            return corrected_stats
                    except Exception as correction_error:
                        print(f"[ERROR] Failed to correct corrupted data: {correction_error}")
                    # Continue to calculation fallback
                    
        except Exception as db_error:
            print(f"[ERROR] Database retrieval failed: {db_error}")
            # Continue to calculation fallback
        
        print(f"[DEBUG] No valid stored stats found, falling back to calculation...")
        
        # Step 2: Enhanced fallback to real-time calculation
        try:
            # Check if user has no habits first (edge case handling)
            try:
                user_habits = self.get_habits(user_id)
                if not user_habits or len(user_habits) == 0:
                    print(f"[DEBUG] User {user_id} has no habits, creating zero-value DailySuccessRate")
                    # Create and store zero-value stats for users with no habits
                    zero_stats = self._create_zero_value_stats()
                    try:
                        stored_result = self.save_daily_success_rate(
                            user_id=user_id,
                            target_date=target_date,
                            total_instances=0,
                            completed_instances=0,
                            time_remaining=0
                        )
                        if stored_result:
                            zero_stats['source'] = 'no_habits_stored'
                        else:
                            zero_stats['source'] = 'no_habits_calculated'
                    except Exception as storage_error:
                        print(f"[WARNING] Failed to store zero-value stats: {storage_error}")
                        zero_stats['source'] = 'no_habits_calculated'
                    
                    return zero_stats
            except Exception as habits_check_error:
                print(f"[WARNING] Failed to check user habits: {habits_check_error}")
                # Continue with normal calculation
            
            calculated_stats = self.get_today_stats(user_id, timezone_offset)
            print(f"[DEBUG] Calculated stats: {calculated_stats}")
            
            # Enhanced validation of calculated stats
            if not isinstance(calculated_stats, dict):
                raise ValueError("Invalid calculated stats format")
            
            # Ensure all required fields are present with valid values
            validated_calculated_stats = {
                'habits_today': max(0, calculated_stats.get('habits_today', 0)),
                'completed_today': max(0, calculated_stats.get('completed_today', 0)),
                'success_rate_today': max(0.0, min(100.0, calculated_stats.get('success_rate_today', 0))),
                'time_remaining': max(0, calculated_stats.get('time_remaining', 0)),
                'completions_today': max(0, calculated_stats.get('completions_today', 0)),
                'source': 'calculated'
            }
            
            # Additional validation for calculated stats
            if validated_calculated_stats['completed_today'] > validated_calculated_stats['habits_today']:
                print(f"[WARNING] Calculated stats inconsistent, capping completed to total")
                validated_calculated_stats['completed_today'] = validated_calculated_stats['habits_today']
                # Recalculate success rate
                if validated_calculated_stats['habits_today'] > 0:
                    validated_calculated_stats['success_rate_today'] = (
                        validated_calculated_stats['completed_today'] / validated_calculated_stats['habits_today']
                    ) * 100
                else:
                    validated_calculated_stats['success_rate_today'] = 0.0
            
            # Step 3: Try to store calculated results (but don't fail if storage fails)
            try:
                stored_result = self.save_daily_success_rate(
                    user_id=user_id,
                    target_date=target_date,
                    total_instances=validated_calculated_stats['habits_today'],
                    completed_instances=validated_calculated_stats['completed_today'],
                    time_remaining=validated_calculated_stats['time_remaining']
                )

                if stored_result:
                    validated_calculated_stats['source'] = 'calculated_and_cached'
                    print(f"[DEBUG] Successfully stored calculated stats: {stored_result}")
                else:
                    validated_calculated_stats['source'] = 'calculated_not_cached'
                    print(f"[WARNING] save_daily_success_rate returned no data; returning calculated stats only")

            except Exception as storage_error:
                validated_calculated_stats['source'] = 'calculated_cache_failed'
                print(f"[WARNING] Failed to store calculated stats: {storage_error}")

            return validated_calculated_stats

        except Exception as calc_error:
            print(f"[ERROR] Real-time calculation failed: {calc_error}")
            return self._get_safe_default_stats()

    
    # ============================================================================
    # JOURNEY ACHIEVEMENT METHODS
    # ============================================================================
    
    def record_obstacle_encounter(self, user_id: str, obstacle_type: str, encounter_data: Dict[str, Any]) -> bool:
        """Record an obstacle encounter in the database"""
        if self.mock_mode:
            if not hasattr(self, 'mock_obstacle_encounters'):
                self.mock_obstacle_encounters = []
            
            encounter = {
                'id': len(self.mock_obstacle_encounters) + 1,
                'user_id': user_id,
                'obstacle_type': obstacle_type,
                'encountered_at': datetime.now().isoformat(),
                'resolved_at': None,
                'was_overcome': False,
                **encounter_data
            }
            self.mock_obstacle_encounters.append(encounter)
            return True
        
        try:
            encounter_record = {
                'user_id': user_id,
                'obstacle_type': obstacle_type,
                'encountered_at': datetime.now().isoformat(),
                'resolved_at': None,
                'was_overcome': False,
                **encounter_data
            }
            
            response = self.client.table("obstacle_encounters").insert(encounter_record).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error recording obstacle encounter: {e}")
            return False
    
    def resolve_obstacle_encounter(self, encounter_id: int, was_overcome: bool, resolution_data: Dict[str, Any] = None) -> bool:
        """Mark an obstacle encounter as resolved"""
        if self.mock_mode:
            if hasattr(self, 'mock_obstacle_encounters'):
                for encounter in self.mock_obstacle_encounters:
                    if encounter['id'] == encounter_id:
                        encounter['resolved_at'] = datetime.now().isoformat()
                        encounter['was_overcome'] = was_overcome
                        if resolution_data:
                            encounter.update(resolution_data)
                        return True
            return False
        
        try:
            update_data = {
                'resolved_at': datetime.now().isoformat(),
                'was_overcome': was_overcome
            }
            if resolution_data:
                update_data.update(resolution_data)
            
            response = self.client.table("obstacle_encounters")\
                .update(update_data)\
                .eq("id", encounter_id)\
                .execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error resolving obstacle encounter: {e}")
            return False
    
    def save_journey_achievement(self, user_id: str, achievement_data: Dict[str, Any]) -> bool:
        """Save a journey achievement to the database"""
        if self.mock_mode:
            if not hasattr(self, 'mock_journey_achievements'):
                self.mock_journey_achievements = []
            
            achievement = {
                'id': len(self.mock_journey_achievements) + 1,
                'user_id': user_id,
                'created_at': datetime.now().isoformat(),
                **achievement_data
            }
            self.mock_journey_achievements.append(achievement)
            return True
        
        try:
            achievement_record = {
                'user_id': user_id,
                'created_at': datetime.now().isoformat(),
                **achievement_data
            }
            
            response = self.client.table("journey_achievements").insert(achievement_record).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error saving journey achievement: {e}")
            return False
    
    def check_journey_achievement_unlocked(self, user_id: str, achievement_type: str) -> bool:
        """Check if a user has already unlocked a specific journey achievement"""
        if self.mock_mode:
            if hasattr(self, 'mock_journey_achievements'):
                return any(
                    a['user_id'] == user_id and a.get('achievement_type') == achievement_type 
                    for a in self.mock_journey_achievements
                )
            return False
        
        try:
            response = self.client.table("journey_achievements")\
                .select("id")\
                .eq("user_id", user_id)\
                .eq("achievement_type", achievement_type)\
                .execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Error checking journey achievement: {e}")
            return False
    
    def get_obstacle_encounter_stats(self, user_id: str) -> Dict[str, Any]:
        """Get detailed obstacle encounter statistics for journey achievements"""
        if self.mock_mode:
            if hasattr(self, 'mock_obstacle_encounters'):
                user_encounters = [e for e in self.mock_obstacle_encounters if e['user_id'] == user_id]
                overcome_encounters = [e for e in user_encounters if e.get('was_overcome', False)]
                
                # Calculate stats by obstacle type
                stats = {
                    'total_obstacles_encountered': len(user_encounters),
                    'total_obstacles_overcome': len(overcome_encounters),
                    'distraction_detours_overcome': len([e for e in overcome_encounters if e['obstacle_type'] == 'distraction_detour']),
                    'energy_valleys_overcome': len([e for e in overcome_encounters if e['obstacle_type'] == 'energy_drain_valley']),
                    'maze_mountains_overcome': len([e for e in overcome_encounters if e['obstacle_type'] == 'maze_mountain']),
                    'memory_fogs_overcome': len([e for e in overcome_encounters if e['obstacle_type'] == 'memory_fog']),
                    'current_success_streak': 0,  # Would need more complex calculation
                    'longest_success_streak': 0,
                    'journey_level': min(len(overcome_encounters) // 5 + 1, 100),
                    'journey_experience': len(overcome_encounters) * 10
                }
                return stats
            return self._get_default_obstacle_stats()
        
        try:
            # Get all encounters for user
            encounters_response = self.client.table("obstacle_encounters")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("encountered_at", desc=False)\
                .execute()
            
            encounters = encounters_response.data
            overcome_encounters = [e for e in encounters if e.get('was_overcome', False)]
            
            # Calculate stats by obstacle type
            stats = {
                'total_obstacles_encountered': len(encounters),
                'total_obstacles_overcome': len(overcome_encounters),
                'distraction_detours_overcome': len([e for e in overcome_encounters if e['obstacle_type'] == 'distraction_detour']),
                'energy_valleys_overcome': len([e for e in overcome_encounters if e['obstacle_type'] == 'energy_drain_valley']),
                'maze_mountains_overcome': len([e for e in overcome_encounters if e['obstacle_type'] == 'maze_mountain']),
                'memory_fogs_overcome': len([e for e in overcome_encounters if e['obstacle_type'] == 'memory_fog']),
                'current_success_streak': self._calculate_current_streak(encounters),
                'longest_success_streak': self._calculate_longest_streak(encounters),
                'journey_level': min(len(overcome_encounters) // 5 + 1, 100),
                'journey_experience': len(overcome_encounters) * 10
            }
            return stats
        except Exception as e:
            print(f"Error getting obstacle encounter stats: {e}")
            return self._get_default_obstacle_stats()
    
    def _get_default_obstacle_stats(self) -> Dict[str, Any]:
        """Return default obstacle stats structure"""
        return {
            'total_obstacles_encountered': 0,
            'total_obstacles_overcome': 0,
            'distraction_detours_overcome': 0,
            'energy_valleys_overcome': 0,
            'maze_mountains_overcome': 0,
            'memory_fogs_overcome': 0,
            'current_success_streak': 0,
            'longest_success_streak': 0,
            'journey_level': 1,
            'journey_experience': 0
        }
    
    def _calculate_current_streak(self, encounters: List[Dict]) -> int:
        """Calculate current success streak from most recent encounters"""
        if not encounters:
            return 0
        
        # Sort by date descending (most recent first)
        sorted_encounters = sorted(encounters, key=lambda x: x['encountered_at'], reverse=True)
        
        streak = 0
        for encounter in sorted_encounters:
            if encounter.get('was_overcome', False):
                streak += 1
            else:
                break
        
        return streak
    
    def _calculate_longest_streak(self, encounters: List[Dict]) -> int:
        """Calculate longest success streak from all encounters"""
        if not encounters:
            return 0
        
        # Sort by date ascending (oldest first)
        sorted_encounters = sorted(encounters, key=lambda x: x['encountered_at'])
        
        longest_streak = 0
        current_streak = 0
        
        for encounter in sorted_encounters:
            if encounter.get('was_overcome', False):
                current_streak += 1
                longest_streak = max(longest_streak, current_streak)
            else:
                current_streak = 0
        
        return longest_streak
                    

    def _get_safe_default_stats(self) -> Dict[str, Any]:
        """Return safe default statistics when all other methods fail"""
        return {
            'habits_today': 0,
            'completed_today': 0,
            'success_rate_today': 0.0,
            'time_remaining': 0,
            'completions_today': 0,
            'source': 'safe_defaults'
        }


# Global database instance
db = SupabaseClient()