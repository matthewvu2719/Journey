#!/usr/bin/env python3
"""
Test script for Daily Success Rate functionality

This script demonstrates:
1. Manual calculation of daily success rates
2. Storing success rates in the database
3. Retrieving monthly success rate data
4. API endpoint testing
"""

import requests
import json
from datetime import datetime, date, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
USER_ID = "default_user"

def test_daily_success_rate_system():
    """Test the complete daily success rate system"""
    
    print("🧪 Testing Daily Success Rate System")
    print("=" * 60)
    
    # Test 1: Manual calculation for yesterday
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    print(f"\n1️⃣ Testing manual calculation for {yesterday}")
    
    try:
        response = requests.post(f"{BASE_URL}/api/stats/calculate-daily-success/{yesterday}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Calculated daily success rate:")
            print(f"   Message: {result['message']}")
            if result['result']:
                print(f"   Total instances: {result['result']['total_habit_instances']}")
                print(f"   Completed: {result['result']['completed_instances']}")
                print(f"   Success rate: {result['result']['success_rate']}%")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")
    
    # Test 2: Get monthly success rates
    today = date.today()
    print(f"\n2️⃣ Testing monthly success rates for {today.year}-{today.month:02d}")
    
    try:
        response = requests.get(f"{BASE_URL}/api/stats/monthly/{today.year}/{today.month}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Retrieved monthly data:")
            print(f"   Year: {result['year']}")
            print(f"   Month: {result['month']}")
            print(f"   Stored daily rates: {len(result['daily_rates'])}")
            
            for rate in result['daily_rates']:
                print(f"     📅 {rate['date']}: {rate['success_rate']}% ({rate['completed_instances']}/{rate['total_habit_instances']})")
            
            if result['current_date_stats']:
                current = result['current_date_stats']
                print(f"   Current date ({current['date']}): {current['success_rate']}% ({current['completed_instances']}/{current['total_habit_instances']})")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")
    
    # Test 3: Calculate for multiple past dates
    print(f"\n3️⃣ Testing calculation for multiple past dates")
    
    for i in range(1, 4):  # Last 3 days
        test_date = (date.today() - timedelta(days=i)).isoformat()
        try:
            response = requests.post(f"{BASE_URL}/api/stats/calculate-daily-success/{test_date}")
            if response.status_code == 200:
                result = response.json()
                if result['result']:
                    print(f"   📅 {test_date}: {result['result']['success_rate']}%")
                else:
                    print(f"   📅 {test_date}: No data")
            else:
                print(f"   ❌ {test_date}: Error {response.status_code}")
        except Exception as e:
            print(f"   ❌ {test_date}: {e}")
    
    # Test 4: Get today's real-time stats
    print(f"\n4️⃣ Testing today's real-time stats")
    
    try:
        response = requests.get(f"{BASE_URL}/api/stats/today")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Today's real-time stats:")
            print(f"   Habits today: {stats['habits_today']}")
            print(f"   Completed: {stats['completed_today']}")
            print(f"   Success rate: {stats['success_rate_today']}%")
            print(f"   Time remaining: {stats['time_remaining']} minutes")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")
    
    print(f"\n📊 Daily Success Rate System Test Complete!")
    print(f"💡 The system will automatically calculate and store success rates at 23:30 each day")


def demonstrate_color_coding():
    """Demonstrate the color coding logic for monthly calendar"""
    
    print(f"\n🎨 Monthly Calendar Color Coding Logic:")
    print("=" * 50)
    
    # Example success rates and their colors
    examples = [
        (0, "🔴 Red"),
        (25, "🔴 Red"),
        (49, "🔴 Red"),
        (50, "🟡 Yellow"),
        (65, "🟡 Yellow"),
        (79, "🟡 Yellow"),
        (80, "🟢 Green"),
        (90, "🟢 Green"),
        (100, "🟢 Green")
    ]
    
    print("Success Rate → Color:")
    for rate, color in examples:
        print(f"  {rate:3d}% → {color}")
    
    print(f"\n📋 Color Rules:")
    print(f"  🔴 Red (0-49%):    Poor performance, needs attention")
    print(f"  🟡 Yellow (50-79%): Moderate performance, room for improvement")
    print(f"  🟢 Green (80-100%): Good performance, keep it up!")
    print(f"  ⚪ Gray:           No data available (future dates or no habits)")


if __name__ == "__main__":
    test_daily_success_rate_system()
    demonstrate_color_coding()