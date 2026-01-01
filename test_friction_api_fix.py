#!/usr/bin/env python3
"""
Quick test to verify the friction helper API is working with the correct friction type mapping
"""

import asyncio
import aiohttp
import json

async def test_friction_api():
    """Test the friction helper API endpoint"""
    
    # Test data
    habit_id = 24  # Use the same habit ID from the error
    test_data = {
        "friction_type": "low-energy",  # Backend expects this format
        "additional_context": "User is struggling with lowEnergy when trying to do Test Habit"
    }
    
    url = f"http://localhost:8000/api/habits/{habit_id}/friction-help"
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=test_data) as response:
                print(f"Status: {response.status}")
                
                if response.status == 200:
                    result = await response.json()
                    print("✅ API call successful!")
                    print(f"Friction type: {result.get('friction_type')}")
                    print(f"Solutions count: {len(result.get('solutions', []))}")
                    print(f"Bobo message: {result.get('bobo_message', 'No message')[:100]}...")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ API call failed: {response.status}")
                    print(f"Error: {error_text}")
                    return False
                    
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing friction helper API...")
    success = asyncio.run(test_friction_api())
    
    if success:
        print("\n✅ The friction helper API is working correctly!")
        print("The frontend fix should resolve the 422 error.")
    else:
        print("\n❌ There may be additional issues with the backend.")
        print("Check if the backend server is running and the habit exists.")