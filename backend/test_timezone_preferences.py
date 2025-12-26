#!/usr/bin/env python3
"""
Test the new timezone preferences system
"""
import requests
import json

def test_timezone_preferences():
    """Test the timezone preferences API endpoints"""
    
    print("🕐 TESTING TIMEZONE PREFERENCES SYSTEM")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    user_id = "guest_1764871751353_lugns9dz6"
    
    # Test 1: Get available timezones
    print("\n1️⃣ TESTING: Get Available Timezones")
    print("-" * 40)
    try:
        response = requests.get(f"{base_url}/api/preferences/timezones")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {data['total_count']} available timezones")
            print("Sample timezones:")
            for region, zones in data['timezones'].items():
                print(f"  {region}: {len(zones)} zones")
                if zones:
                    print(f"    - {zones[0]['label']}")
        else:
            print(f"❌ Error: {response.status_code}")
    except Exception as e:
        print(f"❌ Connection error: {e}")
    
    # Test 2: Get current user preferences (requires auth - will likely fail)
    print("\n2️⃣ TESTING: Get User Preferences (may fail without auth)")
    print("-" * 40)
    try:
        response = requests.get(f"{base_url}/api/preferences")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Current preferences: {data}")
        else:
            print(f"⚠️ Expected auth error: {response.status_code}")
    except Exception as e:
        print(f"⚠️ Expected connection error: {e}")
    
    # Test 3: Test database functions directly
    print("\n3️⃣ TESTING: Database Functions Directly")
    print("-" * 40)
    try:
        import sys
        import os
        sys.path.append(os.path.dirname(__file__))
        from database import SupabaseClient
        
        db = SupabaseClient()
        
        # Test getting preferences
        preferences = db.get_user_preferences(user_id)
        print(f"✅ User preferences: {preferences}")
        
        # Test updating preferences
        update_data = {"timezone": "America/New_York"}
        updated = db.update_user_preferences(user_id, update_data)
        print(f"✅ Updated preferences: {updated}")
        
        # Test getting timezone offset
        offset = db.get_user_timezone_offset(user_id)
        print(f"✅ Timezone offset: {offset} minutes")
        
        # Convert to hours for readability
        hours = offset / 60
        print(f"   That's UTC{hours:+.1f}")
        
    except Exception as e:
        print(f"❌ Database test error: {e}")
    
    # Test 4: Test chat with stored timezone
    print("\n4️⃣ TESTING: Chat with Stored Timezone")
    print("-" * 40)
    try:
        # Test without timezone_offset (should use stored preference)
        data = {
            'message': 'What habits do I have tomorrow?',
            'user_id': user_id
            # No timezone_offset - should use stored preference
        }
        
        response = requests.post(f"{base_url}/api/chat", json=data, timeout=10)
        if response.status_code == 200:
            result = response.json()
            print("✅ Chat with stored timezone:")
            print(f"   Bobo: {result['response']}")
        else:
            print(f"❌ Chat error: {response.status_code}")
    except Exception as e:
        print(f"❌ Chat connection error: {e}")
    
    print(f"\n{'=' * 60}")
    print("🎯 NEXT STEPS:")
    print("1. Add the user_preferences table to your Supabase database")
    print("2. Implement frontend timezone selector")
    print("3. Update all API calls to use stored timezone preferences")
    print("4. Remove timezone_offset parameters from frontend calls")

if __name__ == "__main__":
    test_timezone_preferences()