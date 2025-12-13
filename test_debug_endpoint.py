#!/usr/bin/env python3
"""
Test the debug timezone endpoint
"""
import requests
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_debug_endpoint():
    print("🧪 Testing Debug Timezone Endpoint")
    print("=" * 40)
    
    # Calculate what a typical user would send
    # For example, if user is in EST (UTC-5), JavaScript getTimezoneOffset() returns 300
    # Frontend would send 300 * -1 = -300
    
    test_cases = [
        {"name": "No offset", "offset": None},
        {"name": "EST (UTC-5)", "offset": -300},  # What EST user would send
        {"name": "PST (UTC-8)", "offset": -480},  # What PST user would send
        {"name": "JST (UTC+9)", "offset": 540},   # What JST user would send
    ]
    
    for case in test_cases:
        print(f"\n📍 Testing: {case['name']}")
        
        try:
            params = {}
            if case['offset'] is not None:
                params['timezone_offset'] = case['offset']
                
            response = requests.get(f"{BASE_URL}/api/debug/timezone", params=params)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Success!")
                print(f"   📨 Received offset: {data.get('received_offset')}")
                print(f"   🌍 UTC time: {data.get('utc_time')}")
                print(f"   🖥️  Server time: {data.get('server_time')}")
                if 'calculated_local_time' in data:
                    print(f"   🏠 Calculated local: {data.get('calculated_local_time')}")
                    print(f"   📅 Calculated date: {data.get('calculated_date')}")
                    print(f"   📆 Calculated day: {data.get('calculated_day')}")
            else:
                print(f"   ❌ Failed: {response.status_code}")
                print(f"   📄 Response: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")

if __name__ == "__main__":
    test_debug_endpoint()