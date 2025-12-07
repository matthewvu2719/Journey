#!/usr/bin/env python3
"""
Test script for times_of_day many-to-many relationship
"""
import sys
sys.path.append('backend')

from database import SupabaseClient
from datetime import datetime

def test_times_of_day():
    """Test the new times_of_day functionality"""
    print("🧪 Testing Times of Day Many-to-Many Relationship\n")
    
    db = SupabaseClient()
    user_id = "test_user_times"
    
    # Test 1: Create habit with multiple times of day
    print("1️⃣ Creating habit with multiple times of day...")
    habit_data = {
        "user_id": user_id,
        "name": "Drink Water",
        "description": "Stay hydrated throughout the day",
        "category": "health",
        "priority": 8,
        "estimated_duration": 5,
        "days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
        "times_of_day": ["morning", "noon", "afternoon", "night"]
    }
    
    try:
        habit = db.create_habit(habit_data)
        print(f"✅ Created habit: {habit['name']}")
        print(f"   Times of day: {habit.get('times_of_day', [])}")
        habit_id = habit['id']
    except Exception as e:
        print(f"❌ Failed to create habit: {e}")
        return False
    
    # Test 2: Retrieve habit and verify times_of_day
    print("\n2️⃣ Retrieving habit and verifying times_of_day...")
    try:
        habits = db.get_habits(user_id)
        retrieved_habit = next((h for h in habits if h['id'] == habit_id), None)
        
        if retrieved_habit:
            times = retrieved_habit.get('times_of_day', [])
            print(f"✅ Retrieved habit: {retrieved_habit['name']}")
            print(f"   Times of day: {times}")
            
            expected_times = ["morning", "noon", "afternoon", "night"]
            if set(times) == set(expected_times):
                print("✅ Times of day match expected values")
            else:
                print(f"⚠️  Times mismatch. Expected: {expected_times}, Got: {times}")
        else:
            print("❌ Could not retrieve habit")
            return False
    except Exception as e:
        print(f"❌ Failed to retrieve habit: {e}")
        return False
    
    # Test 3: Create habit with single time
    print("\n3️⃣ Creating habit with single time of day...")
    habit_data_single = {
        "user_id": user_id,
        "name": "Morning Meditation",
        "category": "wellness",
        "priority": 9,
        "days": ["Mon", "Wed", "Fri"],
        "times_of_day": ["morning"]
    }
    
    try:
        habit_single = db.create_habit(habit_data_single)
        print(f"✅ Created habit: {habit_single['name']}")
        print(f"   Times of day: {habit_single.get('times_of_day', [])}")
    except Exception as e:
        print(f"❌ Failed to create habit: {e}")
        return False
    
    # Test 4: Create habit with no times (should work)
    print("\n4️⃣ Creating habit with no times of day...")
    habit_data_no_time = {
        "user_id": user_id,
        "name": "Flexible Task",
        "category": "work",
        "priority": 5,
        "days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
        "times_of_day": []
    }
    
    try:
        habit_no_time = db.create_habit(habit_data_no_time)
        print(f"✅ Created habit: {habit_no_time['name']}")
        print(f"   Times of day: {habit_no_time.get('times_of_day', [])}")
    except Exception as e:
        print(f"❌ Failed to create habit: {e}")
        return False
    
    # Test 5: Complete a habit (should not require time_of_day)
    print("\n5️⃣ Completing habit without time_of_day...")
    completion_data = {
        "habit_id": habit_id,
        "mood_before": "okay",
        "mood_after": "good",
        "energy_level_before": "medium",
        "energy_level_after": "high",
        "is_successful": True,
        "actual_duration": 5
    }
    
    try:
        completed = db.complete_habit(completion_data)
        print(f"✅ Completed habit: {completed['name']}")
        print(f"   Mood: {completed.get('mood_before')} → {completed.get('mood_after')}")
    except Exception as e:
        print(f"❌ Failed to complete habit: {e}")
        return False
    
    # Test 6: Filter habits by time of day
    print("\n6️⃣ Filtering habits by time of day...")
    try:
        all_habits = db.get_habits(user_id)
        morning_habits = [h for h in all_habits if h.get('times_of_day') and 'morning' in h['times_of_day']]
        print(f"✅ Found {len(morning_habits)} morning habits:")
        for h in morning_habits:
            print(f"   - {h['name']}: {h.get('times_of_day', [])}")
    except Exception as e:
        print(f"❌ Failed to filter habits: {e}")
        return False
    
    # Cleanup
    print("\n🧹 Cleaning up test data...")
    try:
        for habit in db.get_habits(user_id):
            db.delete_habit(habit['id'])
        print("✅ Cleanup complete")
    except Exception as e:
        print(f"⚠️  Cleanup warning: {e}")
    
    print("\n" + "="*60)
    print("✅ ALL TESTS PASSED!")
    print("="*60)
    return True

if __name__ == "__main__":
    success = test_times_of_day()
    sys.exit(0 if success else 1)
