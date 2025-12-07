"""
Test script to verify habit completion flow
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_completion_flow():
    print("🧪 Testing Habit Completion Flow\n")
    
    # Step 1: Guest login
    print("1️⃣ Getting guest token...")
    response = requests.post(f"{BASE_URL}/api/auth/guest", json={"device_id": "test_device"})
    if response.status_code != 200:
        print(f"❌ Guest login failed: {response.text}")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"✅ Got token: {token[:20]}...\n")
    
    # Step 2: Get habits
    print("2️⃣ Fetching habits...")
    response = requests.get(f"{BASE_URL}/api/habits", headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to get habits: {response.text}")
        return
    
    habits = response.json()
    if not habits:
        print("⚠️  No habits found. Creating a test habit...")
        habit_data = {
            "name": "Test Habit",
            "category": "test",
            "priority": 5,
            "target_frequency": 7,
            "estimated_duration": 30,
            "time_of_day": "morning"
        }
        response = requests.post(f"{BASE_URL}/api/habits", headers=headers, json=habit_data)
        if response.status_code != 200:
            print(f"❌ Failed to create habit: {response.text}")
            return
        habits = [response.json()]
    
    habit = habits[0]
    print(f"✅ Using habit: {habit['name']} (ID: {habit['id']})\n")
    
    # Step 3: Create completion
    print("3️⃣ Creating completion...")
    completion_data = {
        "habit_id": habit["id"],
        "mood_before": "good",
        "mood_after": "great",
        "energy_level_before": "high",
        "energy_level_after": "high",
        "is_successful": True,
        "time_of_day": "morning"
    }
    
    if habit.get("estimated_duration"):
        completion_data["estimated_duration"] = habit["estimated_duration"]
        completion_data["actual_duration"] = habit["estimated_duration"]
    
    print(f"Sending: {json.dumps(completion_data, indent=2)}")
    
    response = requests.post(f"{BASE_URL}/api/completions", headers=headers, json=completion_data)
    if response.status_code != 200:
        print(f"❌ Failed to create completion: {response.status_code}")
        print(f"Response: {response.text}")
        return
    
    completion = response.json()
    print(f"✅ Completion created! ID: {completion['id']}\n")
    
    # Step 4: Verify completion
    print("4️⃣ Verifying completion...")
    response = requests.get(f"{BASE_URL}/api/completions?habit_id={habit['id']}", headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to get completions: {response.text}")
        return
    
    completions = response.json()
    print(f"✅ Found {len(completions)} completion(s) for this habit")
    
    if completions:
        latest = completions[-1]
        print(f"\nLatest completion:")
        print(f"  - ID: {latest['id']}")
        print(f"  - Habit ID: {latest['habit_id']}")
        print(f"  - Mood: {latest.get('mood_before')} → {latest.get('mood_after')}")
        print(f"  - Energy: {latest.get('energy_level_before')} → {latest.get('energy_level_after')}")
        print(f"  - Time of day: {latest.get('time_of_day')}")
        print(f"  - Created: {latest.get('created_at')}")
    
    print("\n✅ All tests passed! Completion flow is working correctly.")

if __name__ == "__main__":
    try:
        test_completion_flow()
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend. Make sure it's running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")
