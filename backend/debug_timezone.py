#!/usr/bin/env python3
"""
Debug timezone issues with habit counting
"""
import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

from database import SupabaseClient

def debug_timezone():
    """Debug timezone handling for habits"""
    
    print("🕐 Debugging Timezone Issues")
    print("=" * 50)
    
    # Initialize database
    db = SupabaseClient()
    user_id = 'guest_1764871751353_lugns9dz6'
    
    print("=== CURRENT TIME INFO ===")
    print(f"Server UTC time: {datetime.utcnow()}")
    print(f"Server local time: {datetime.now()}")
    today_name = datetime.now().strftime('%a')
    print(f"Server thinks today is: {today_name}")
    
    print(f"\n=== TESTING DIFFERENT TIMEZONES ===")
    for offset_hours in [-8, -7, -6, -5, 0, 7, 8]:
        offset_minutes = offset_hours * 60
        local_time = datetime.utcnow() + timedelta(minutes=offset_minutes)
        day_name = local_time.strftime('%a')
        
        habits_today = db.get_habits_for_today(user_id, timezone_offset=offset_minutes)
        
        time_str = local_time.strftime('%Y-%m-%d %H:%M')
        print(f"UTC{offset_hours:+d}: {time_str} ({day_name}) -> {len(habits_today)} habits")
        
        if len(habits_today) == 4:
            print(f"  *** FOUND 4 HABITS FOR {day_name} ***")
            for habit in habits_today:
                name = habit.get('name', 'Unknown')
                print(f"    - {name}")
    
    print(f"\n=== ALL HABITS WITH DAYS ===")
    all_habits = db.get_habits(user_id)
    for habit in all_habits:
        name = habit.get('name', 'Unknown')
        days = habit.get('days', [])
        times = habit.get('times_of_day', [])
        active = habit.get('is_active', True)
        print(f"- {name}: Days={days}, Times={times}, Active={active}")
    
    print(f"\n=== WHAT'S YOUR TIMEZONE? ===")
    print("Enter your timezone offset from UTC (e.g., -8 for PST, +7 for Vietnam):")
    try:
        user_offset = int(input().strip())
        user_offset_minutes = user_offset * 60
        
        user_local_time = datetime.utcnow() + timedelta(minutes=user_offset_minutes)
        user_day = user_local_time.strftime('%a')
        user_habits = db.get_habits_for_today(user_id, timezone_offset=user_offset_minutes)
        
        print(f"\nYour local time: {user_local_time.strftime('%Y-%m-%d %H:%M')} ({user_day})")
        print(f"Habits for your today ({user_day}): {len(user_habits)}")
        
        if user_habits:
            for habit in user_habits:
                name = habit.get('name', 'Unknown')
                print(f"  - {name}")
        
    except (ValueError, KeyboardInterrupt):
        print("Skipping manual timezone test")

if __name__ == "__main__":
    debug_timezone()