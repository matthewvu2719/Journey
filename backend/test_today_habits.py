#!/usr/bin/env python3
"""
Test script to demonstrate the new "habits for today" functionality
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
USER_ID = "default_user"

def test_habits_today_endpoints():
    """Test the new habits for today endpoints"""
    
    print("🧪 Testing Habits for Today Endpoints")
    print("=" * 50)
    
    # Test 1: Get all habits for today
    print("\n1️⃣ Testing: GET /api/habits/today")
    try:
        response = requests.get(f"{BASE_URL}/api/habits/today")
        if response.status_code == 200:
            habits = response.json()
            print(f"✅ Success! Found {len(habits)} habits for today")
            for habit in habits:
                print(f"   - {habit['name']} (Days: {habit.get('days', 'All')}, Times: {habit.get('times_of_day', 'All')})")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")
    
    # Test 2: Get habits count for today
    print("\n2️⃣ Testing: GET /api/habits/today/count")
    try:
        response = requests.get(f"{BASE_URL}/api/habits/today/count")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Total habits today: {result['count']}")
            print(f"   User ID: {result['user_id']}")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")
    
    # Test 3: Get habits for specific time of day
    for time_of_day in ['morning', 'noon', 'afternoon', 'night']:
        print(f"\n3️⃣ Testing: GET /api/habits/today?time_of_day={time_of_day}")
        try:
            response = requests.get(f"{BASE_URL}/api/habits/today", params={"time_of_day": time_of_day})
            if response.status_code == 200:
                habits = response.json()
                print(f"✅ Success! Found {len(habits)} habits for {time_of_day}")
                for habit in habits:
                    print(f"   - {habit['name']}")
            else:
                print(f"❌ Error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Connection Error: {e}")
    
    # Test 4: Get count for specific time of day
    print(f"\n4️⃣ Testing: GET /api/habits/today/count?time_of_day=morning")
    try:
        response = requests.get(f"{BASE_URL}/api/habits/today/count", params={"time_of_day": "morning"})
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Morning habits count: {result['count']}")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")
    
    # Test 5: Get comprehensive today stats
    print(f"\n5️⃣ Testing: GET /api/stats/today")
    try:
        response = requests.get(f"{BASE_URL}/api/stats/today")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Success! Today's comprehensive stats:")
            print(f"   - Habits Today: {stats['habits_today']}")
            print(f"   - Completed Today: {stats['completed_today']}")
            print(f"   - Success Rate: {stats['success_rate_today']}%")
            print(f"   - Time Remaining: {stats['time_remaining']} minutes")
            print(f"   - Total Completions: {stats['completions_today']}")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")
    
    print(f"\n📅 Today is: {datetime.now().strftime('%A (%a)')}")
    print("💡 Note: Habits are counted as instances (habit × time_of_day combinations)")
    print("   Example: 1 habit with 3 times of day = 3 habit instances")

if __name__ == "__main__":
    test_habits_today_endpoints()