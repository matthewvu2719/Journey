#!/usr/bin/env python3
"""
Test script to verify timezone fix for today's stats calculation
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test_timezone_stats():
    """Test that timezone offset is properly handled"""
    
    print("🧪 Testing Timezone Fix for Today's Stats")
    print("=" * 50)
    
    # Test different timezone offsets
    test_cases = [
        {"name": "UTC", "offset": 0},
        {"name": "PST (UTC-8)", "offset": -480},  # -8 hours * 60 minutes
        {"name": "EST (UTC-5)", "offset": -300},  # -5 hours * 60 minutes
        {"name": "JST (UTC+9)", "offset": 540},   # +9 hours * 60 minutes
        {"name": "Local", "offset": -datetime.now().astimezone().utcoffset().total_seconds() / 60}
    ]
    
    for case in test_cases:
        print(f"\n📍 Testing {case['name']} (offset: {case['offset']} minutes)")
        
        try:
            # Test stats endpoint with timezone offset
            response = requests.get(f"{BASE_URL}/api/stats/today", params={
                "timezone_offset": case['offset']
            })
            
            if response.status_code == 200:
                stats = response.json()
                print(f"   ✅ Stats retrieved successfully")
                print(f"   📊 Habits today: {stats.get('habits_today', 0)}")
                print(f"   ✅ Completed: {stats.get('completed_today', 0)}")
                print(f"   📈 Success rate: {stats.get('success_rate_today', 0)}%")
                print(f"   ⏰ Time remaining: {stats.get('time_remaining', 0)} min")
            else:
                print(f"   ❌ Failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    # Test habits for today endpoint
    print(f"\n📅 Testing Habits for Today Endpoint")
    try:
        local_offset = -datetime.now().astimezone().utcoffset().total_seconds() / 60
        response = requests.get(f"{BASE_URL}/api/habits/today", params={
            "timezone_offset": local_offset
        })
        
        if response.status_code == 200:
            habits = response.json()
            print(f"   ✅ Found {len(habits)} habits for today (local time)")
            for habit in habits[:3]:  # Show first 3
                print(f"   📝 {habit.get('name', 'Unknown')} - {habit.get('category', 'No category')}")
        else:
            print(f"   ❌ Failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print(f"\n🎯 Timezone Fix Test Complete!")
    print(f"💡 Frontend should now send timezone_offset parameter automatically")

if __name__ == "__main__":
    test_timezone_stats()