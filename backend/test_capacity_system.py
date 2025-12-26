#!/usr/bin/env python3
"""
Test script for 16-hour daily capacity system
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

from database import SupabaseClient

def test_capacity_system():
    """Test the 16-hour daily capacity system"""
    
    print("🕐 Testing 16-Hour Daily Capacity System")
    print("=" * 50)
    
    # Initialize database
    db = SupabaseClient()
    test_user_id = "test_capacity_user"
    
    # Test 1: Check default capacities
    print("\n1. Testing Default Capacities:")
    capacities = db.get_daily_capacities(test_user_id)
    
    for day, capacity in capacities.items():
        hours = capacity / 60
        print(f"   {day}: {capacity} minutes ({hours} hours)")
    
    # Verify all days are 16 hours (960 minutes)
    expected_capacity = 960  # 16 hours
    all_correct = all(cap == expected_capacity for cap in capacities.values())
    
    if all_correct:
        print("   ✅ All days set to 16 hours (960 minutes)")
    else:
        print("   ❌ Some days have incorrect capacity")
        return False
    
    # Test 2: Check capacity with no habits
    print("\n2. Testing Capacity Check with No Habits:")
    
    # Create a test habit (2 hours daily)
    test_habit = {
        'name': 'Test Workout',
        'category': 'fitness',
        'estimated_duration': 120,  # 2 hours
        'days': [],  # Daily (all days)
        'user_id': test_user_id
    }
    
    result = db.check_habit_capacity(test_user_id, test_habit)
    
    print(f"   Can add: {result['can_add']}")
    print(f"   Message: {result['message']}")
    
    if result['can_add']:
        print("   ✅ Can add 2-hour daily habit")
    else:
        print("   ❌ Cannot add 2-hour daily habit")
        return False
    
    # Test 3: Check capacity with excessive habit
    print("\n3. Testing Capacity Check with Excessive Habit:")
    
    # Create an excessive habit (17 hours daily)
    excessive_habit = {
        'name': 'Impossible Habit',
        'category': 'test',
        'estimated_duration': 1020,  # 17 hours (exceeds 16-hour limit)
        'days': [],  # Daily
        'user_id': test_user_id
    }
    
    result = db.check_habit_capacity(test_user_id, excessive_habit)
    
    print(f"   Can add: {result['can_add']}")
    print(f"   Message: {result['message']}")
    
    if not result['can_add']:
        print("   ✅ Correctly rejected 17-hour habit")
    else:
        print("   ❌ Incorrectly allowed 17-hour habit")
        return False
    
    # Test 4: Check capacity with multiple habits
    print("\n4. Testing Multiple Habits Scenario:")
    
    # Simulate existing habits totaling 14 hours
    existing_habits = [
        {'name': 'Morning Workout', 'estimated_duration': 60, 'days': [], 'is_active': True},
        {'name': 'Work', 'estimated_duration': 480, 'days': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], 'is_active': True},
        {'name': 'Evening Study', 'estimated_duration': 120, 'days': [], 'is_active': True},
    ]
    
    # Mock the get_habits method for this test
    original_get_habits = db.get_habits
    db.get_habits = lambda user_id: existing_habits if user_id == test_user_id else []
    
    # Try to add a 3-hour habit (should fail on weekdays due to 8-hour work)
    new_habit = {
        'name': 'Long Hobby',
        'category': 'hobby',
        'estimated_duration': 180,  # 3 hours
        'days': [],  # Daily
        'user_id': test_user_id
    }
    
    result = db.check_habit_capacity(test_user_id, new_habit)
    
    print(f"   Can add 3-hour habit with existing habits: {result['can_add']}")
    print(f"   Message: {result['message']}")
    
    # Restore original method
    db.get_habits = original_get_habits
    
    # Test 5: Check atomic habits (no duration)
    print("\n5. Testing Atomic Habits (No Duration):")
    
    atomic_habit = {
        'name': 'Drink Water',
        'category': 'health',
        'estimated_duration': None,  # Atomic habit
        'days': [],
        'user_id': test_user_id
    }
    
    result = db.check_habit_capacity(test_user_id, atomic_habit)
    
    print(f"   Can add atomic habit: {result['can_add']}")
    print(f"   Message: {result['message']}")
    
    if result['can_add']:
        print("   ✅ Atomic habits don't count against capacity")
    else:
        print("   ❌ Atomic habits incorrectly count against capacity")
        return False
    
    print("\n" + "=" * 50)
    print("✅ All capacity system tests passed!")
    print("\nSummary:")
    print("- Default capacity: 16 hours (960 minutes) per day")
    print("- Users can add habits freely within this limit")
    print("- Atomic habits (no duration) don't count against limit")
    print("- System prevents exceeding daily capacity")
    print("- Clear error messages when capacity exceeded")
    
    return True

if __name__ == "__main__":
    success = test_capacity_system()
    sys.exit(0 if success else 1)