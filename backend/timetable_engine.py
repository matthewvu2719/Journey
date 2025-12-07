"""
Timetable Generation Engine
Handles scheduling, conflict detection, and optimization
"""
from typing import List, Dict, Tuple, Optional, Set
from datetime import time, datetime, timedelta, date
from collections import defaultdict
import random


class TimeSlot:
    """Represents a time slot in the schedule"""
    
    def __init__(self, day: int, start: time, end: time):
        self.day = day  # 0-6 (Monday-Sunday)
        self.start = start
        self.end = end
    
    def overlaps(self, other: 'TimeSlot') -> bool:
        """Check if this slot overlaps with another"""
        if self.day != other.day:
            return False
        return (self.start < other.end) and (other.start < self.end)
    
    def duration_minutes(self) -> int:
        """Calculate duration in minutes"""
        start_minutes = self.start.hour * 60 + self.start.minute
        end_minutes = self.end.hour * 60 + self.end.minute
        return end_minutes - start_minutes
    
    def __repr__(self):
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        return f"{days[self.day]} {self.start.strftime('%H:%M')}-{self.end.strftime('%H:%M')}"


class TimetableEngine:
    """Core engine for timetable generation and optimization"""
    
    def __init__(self):
        # Default working hours (can be customized per user)
        self.default_start_time = time(7, 0)   # 7 AM
        self.default_end_time = time(23, 0)    # 11 PM
        self.min_slot_duration = 15  # minutes
        self.default_buffer = 15  # minutes between slots
    
    # ========================================================================
    # CORE SCHEDULING ALGORITHM
    # ========================================================================
    
    def generate_timetable(
        self,
        habits: List[Dict],
        fixed_events: List[Dict],
        user_availability: Optional[List[Dict]] = None
    ) -> Tuple[List[Dict], List[Dict]]:
        """
        Generate optimized timetable
        Returns: (scheduled_slots, conflicts)
        """
        # Step 1: Parse fixed events into TimeSlots
        occupied_slots = self._parse_fixed_events(fixed_events)
        
        # Step 2: Calculate available time windows
        available_windows = self._calculate_available_windows(
            occupied_slots,
            user_availability
        )
        
        # Step 3: Sort habits by priority (high to low)
        sorted_habits = sorted(habits, key=lambda h: h.get('priority', 5), reverse=True)
        
        # Step 4: Schedule each habit
        scheduled_slots = []
        conflicts = []
        
        for habit in sorted_habits:
            slots, habit_conflicts = self._schedule_habit(
                habit,
                available_windows,
                occupied_slots
            )
            
            if slots:
                scheduled_slots.extend(slots)
                # Mark these slots as occupied
                for slot in slots:
                    occupied_slots.append(slot)
            else:
                conflicts.append({
                    "habit_id": habit["id"],
                    "habit_name": habit["name"],
                    "reason": "no_available_time",
                    "priority": habit.get("priority", 5)
                })
        
        # Step 5: Convert TimeSlots back to dict format
        result_slots = self._convert_slots_to_dict(scheduled_slots, sorted_habits)
        
        return result_slots, conflicts
    
    def _schedule_habit(
        self,
        habit: Dict,
        available_windows: Dict[int, List[Tuple[time, time]]],
        occupied_slots: List[TimeSlot]
    ) -> Tuple[List[TimeSlot], List[Dict]]:
        """
        Schedule a single habit across the week
        Returns: (scheduled_slots, conflicts)
        """
        target_frequency = habit.get("target_frequency", 3)
        duration = habit.get("estimated_duration", 30)  # Default 30 min
        habit_type = habit.get("habit_type", "atomic")
        
        # For atomic habits, use minimal duration
        if habit_type == "atomic":
            duration = 15  # 15 minutes placeholder
        
        # Add buffer
        duration_with_buffer = duration + self.default_buffer
        
        scheduled_slots = []
        preferred_time = habit.get("preferred_time_of_day")
        
        # Try to schedule on different days
        days_scheduled = set()
        attempts = 0
        max_attempts = 14  # Try up to 2 weeks worth of days
        
        while len(scheduled_slots) < target_frequency and attempts < max_attempts:
            attempts += 1
            
            # Pick a day that hasn't been scheduled yet
            available_days = [d for d in range(7) if d not in days_scheduled]
            if not available_days:
                break
            
            day = self._pick_best_day(
                available_days,
                available_windows,
                duration_with_buffer,
                preferred_time
            )
            
            if day is None:
                break
            
            # Find best time slot on this day
            slot = self._find_best_slot(
                day,
                duration_with_buffer,
                available_windows[day],
                occupied_slots,
                preferred_time
            )
            
            if slot:
                scheduled_slots.append(slot)
                days_scheduled.add(day)
                occupied_slots.append(slot)  # Temporarily mark as occupied
            else:
                # Can't schedule on this day, try another
                days_scheduled.add(day)
        
        conflicts = []
        if len(scheduled_slots) < target_frequency:
            conflicts.append({
                "habit_id": habit["id"],
                "reason": "insufficient_slots",
                "requested": target_frequency,
                "scheduled": len(scheduled_slots)
            })
        
        return scheduled_slots, conflicts
    
    def _find_best_slot(
        self,
        day: int,
        duration_minutes: int,
        available_windows: List[Tuple[time, time]],
        occupied_slots: List[TimeSlot],
        preferred_time: Optional[str] = None
    ) -> Optional[TimeSlot]:
        """Find the best available time slot on a given day"""
        
        for window_start, window_end in available_windows:
            # Try to fit the habit in this window
            current_time = window_start
            window_end_minutes = window_end.hour * 60 + window_end.minute
            
            while True:
                current_minutes = current_time.hour * 60 + current_time.minute
                end_minutes = current_minutes + duration_minutes
                
                if end_minutes > window_end_minutes:
                    break
                
                # Create candidate slot
                end_time = time(end_minutes // 60, end_minutes % 60)
                candidate = TimeSlot(day, current_time, end_time)
                
                # Check if it overlaps with any occupied slot
                if not any(candidate.overlaps(occupied) for occupied in occupied_slots):
                    # Check if it matches preferred time
                    if preferred_time:
                        if self._matches_preferred_time(current_time, preferred_time):
                            return candidate
                    else:
                        return candidate
                
                # Move forward by 15 minutes
                current_minutes += 15
                if current_minutes >= window_end_minutes:
                    break
                current_time = time(current_minutes // 60, current_minutes % 60)
        
        # If no slot found with preferred time, try again without preference
        if preferred_time:
            return self._find_best_slot(day, duration_minutes, available_windows, occupied_slots, None)
        
        return None
    
    def _pick_best_day(
        self,
        available_days: List[int],
        available_windows: Dict[int, List[Tuple[time, time]]],
        duration_minutes: int,
        preferred_time: Optional[str] = None
    ) -> Optional[int]:
        """Pick the best day for scheduling"""
        # Score each day based on available time
        day_scores = []
        
        for day in available_days:
            total_available = 0
            for start, end in available_windows.get(day, []):
                start_min = start.hour * 60 + start.minute
                end_min = end.hour * 60 + end.minute
                total_available += (end_min - start_min)
            
            if total_available >= duration_minutes:
                day_scores.append((day, total_available))
        
        if not day_scores:
            return None
        
        # Sort by available time (more is better)
        day_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Return day with most available time
        return day_scores[0][0]
    
    def _matches_preferred_time(self, slot_time: time, preferred: str) -> bool:
        """Check if time matches preferred time of day"""
        hour = slot_time.hour
        
        if preferred == "morning":
            return 6 <= hour < 12
        elif preferred == "afternoon":
            return 12 <= hour < 17
        elif preferred == "evening":
            return 17 <= hour < 21
        elif preferred == "night":
            return 21 <= hour or hour < 6
        
        return True
    
    # ========================================================================
    # HELPER METHODS
    # ========================================================================
    
    def _parse_fixed_events(self, fixed_events: List[Dict]) -> List[TimeSlot]:
        """Convert fixed events to TimeSlot objects"""
        slots = []
        for event in fixed_events:
            if not event.get("is_active", True):
                continue
            
            slot = TimeSlot(
                day=event["day_of_week"],
                start=event["start_time"] if isinstance(event["start_time"], time) else datetime.strptime(event["start_time"], "%H:%M:%S").time(),
                end=event["end_time"] if isinstance(event["end_time"], time) else datetime.strptime(event["end_time"], "%H:%M:%S").time()
            )
            slots.append(slot)
        
        return slots
    
    def _calculate_available_windows(
        self,
        occupied_slots: List[TimeSlot],
        user_availability: Optional[List[Dict]] = None
    ) -> Dict[int, List[Tuple[time, time]]]:
        """
        Calculate available time windows for each day
        Returns: {day: [(start, end), ...]}
        """
        available = {}
        
        for day in range(7):
            # Start with full day
            day_start = self.default_start_time
            day_end = self.default_end_time
            
            # Get occupied slots for this day
            day_occupied = [s for s in occupied_slots if s.day == day]
            day_occupied.sort(key=lambda s: (s.start.hour * 60 + s.start.minute))
            
            # Calculate gaps
            windows = []
            current_time = day_start
            
            for occupied in day_occupied:
                if occupied.start > current_time:
                    # There's a gap
                    windows.append((current_time, occupied.start))
                current_time = max(current_time, occupied.end)
            
            # Add final window if there's time left
            if current_time < day_end:
                windows.append((current_time, day_end))
            
            available[day] = windows
        
        return available
    
    def _convert_slots_to_dict(
        self,
        slots: List[TimeSlot],
        habits: List[Dict]
    ) -> List[Dict]:
        """Convert TimeSlot objects back to dict format"""
        # Group slots by habit (assuming we scheduled them in order)
        result = []
        habit_idx = 0
        slots_per_habit = defaultdict(list)
        
        # This is simplified - in production, track which slot belongs to which habit
        for slot in slots:
            result.append({
                "day_of_week": slot.day,
                "start_time": slot.start.strftime("%H:%M:%S"),
                "end_time": slot.end.strftime("%H:%M:%S"),
                "duration_minutes": slot.duration_minutes()
            })
        
        return result
    
    # ========================================================================
    # CONFLICT DETECTION
    # ========================================================================
    
    def detect_conflicts(
        self,
        slots: List[Dict],
        fixed_events: List[Dict]
    ) -> List[Dict]:
        """Detect scheduling conflicts"""
        conflicts = []
        all_slots = []
        
        # Convert to TimeSlot objects
        for slot in slots:
            ts = TimeSlot(
                day=slot["day_of_week"],
                start=datetime.strptime(slot["start_time"], "%H:%M:%S").time() if isinstance(slot["start_time"], str) else slot["start_time"],
                end=datetime.strptime(slot["end_time"], "%H:%M:%S").time() if isinstance(slot["end_time"], str) else slot["end_time"]
            )
            all_slots.append((ts, slot, "habit"))
        
        for event in fixed_events:
            if not event.get("is_active", True):
                continue
            ts = TimeSlot(
                day=event["day_of_week"],
                start=event["start_time"] if isinstance(event["start_time"], time) else datetime.strptime(event["start_time"], "%H:%M:%S").time(),
                end=event["end_time"] if isinstance(event["end_time"], time) else datetime.strptime(event["end_time"], "%H:%M:%S").time()
            )
            all_slots.append((ts, event, "fixed"))
        
        # Check all pairs for overlaps
        for i in range(len(all_slots)):
            for j in range(i + 1, len(all_slots)):
                slot1, data1, type1 = all_slots[i]
                slot2, data2, type2 = all_slots[j]
                
                if slot1.overlaps(slot2):
                    conflicts.append({
                        "type": "overlap",
                        "slot1": data1,
                        "slot2": data2,
                        "day": slot1.day,
                        "description": f"Overlap detected on {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][slot1.day]}"
                    })
        
        return conflicts
    
    # ========================================================================
    # RESCHEDULING
    # ========================================================================
    
    def reschedule_slot(
        self,
        slot_to_move: Dict,
        new_day: int,
        new_start_time: time,
        all_slots: List[Dict],
        fixed_events: List[Dict]
    ) -> Tuple[bool, Optional[Dict], List[str]]:
        """
        Attempt to reschedule a slot
        Returns: (success, new_slot, errors)
        """
        duration = slot_to_move.get("duration_minutes", 30)
        
        # Calculate new end time
        start_minutes = new_start_time.hour * 60 + new_start_time.minute
        end_minutes = start_minutes + duration
        new_end_time = time(end_minutes // 60, end_minutes % 60)
        
        # Create new slot
        new_slot = TimeSlot(new_day, new_start_time, new_end_time)
        
        # Check for conflicts
        occupied = self._parse_fixed_events(fixed_events)
        for slot_dict in all_slots:
            if slot_dict.get("id") == slot_to_move.get("id"):
                continue  # Skip the slot we're moving
            
            ts = TimeSlot(
                day=slot_dict["day_of_week"],
                start=datetime.strptime(slot_dict["start_time"], "%H:%M:%S").time() if isinstance(slot_dict["start_time"], str) else slot_dict["start_time"],
                end=datetime.strptime(slot_dict["end_time"], "%H:%M:%S").time() if isinstance(slot_dict["end_time"], str) else slot_dict["end_time"]
            )
            occupied.append(ts)
        
        # Check if new slot conflicts
        for occupied_slot in occupied:
            if new_slot.overlaps(occupied_slot):
                return False, None, [f"Conflicts with existing slot at {occupied_slot}"]
        
        # No conflicts, return new slot
        return True, {
            "day_of_week": new_day,
            "start_time": new_start_time.strftime("%H:%M:%S"),
            "end_time": new_end_time.strftime("%H:%M:%S"),
            "duration_minutes": duration
        }, []
