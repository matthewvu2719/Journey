"""
Quick test script for Phase 1 & 2 implementation
Run this to verify all endpoints are working
"""
import requests
import json
from datetime import datetime, time

BASE_URL = "http://localhost:8000"

def print_response(title, response):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)
    print(f"Status: {response.status_code}")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)

def test_phase_1_2():
    """Test all Phase 1 & 2 endpoints"""
    
    print("\n🚀 Testing Phase 1 & 2 Implementation\n")
    
    # Test 1: Health Check
    print("\n📋 Test 1: Health Check")
    response = requests.get(f"{BASE_URL}/health")
    print_response("Health Check", response)
    
    # Test 2: Guest Login
    print("\n📋 Test 2: Guest Login")
    response = requests.post(
        f"{BASE_URL}/api/auth/guest",
        json={"device_id": "test-device-123"}
    )
    print_response("Guest Login", response)
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test 3: Create Atomic Habit
        print("\n📋 Test 3: Create Atomic Habit")
        response = requests.post(
            f"{BASE_URL}/api/habits",
            headers=headers,
            json={
                "name": "Drink Water",
                "description": "Stay hydrated",
                "habit_type": "atomic",
                "priority": 7,
                "difficulty": "easy",
                "category": "health",
                "target_frequency": 7,
                "preferred_time_of_day": "morning"
            }
        )
        print_response("Create Atomic Habit", response)
        
        # Test 4: Create Big Habit
        print("\n📋 Test 4: Create Big Habit")
        response = requests.post(
            f"{BASE_URL}/api/habits",
            headers=headers,
            json={
                "name": "Morning Run",
                "description": "30 minute jog",
                "habit_type": "big",
                "estimated_duration": 30,
                "priority": 8,
                "difficulty": "medium",
                "category": "fitness",
                "target_frequency": 5,
                "preferred_time_of_day": "morning",
                "color": "#ef4444"
            }
        )
        print_response("Create Big Habit", response)
        habit_id = response.json().get("id") if response.status_code == 200 else None
        
        # Test 5: Get All Habits
        print("\n📋 Test 5: Get All Habits")
        response = requests.get(f"{BASE_URL}/api/habits", headers=headers)
        print_response("Get All Habits", response)
        
        # Test 6: Create Fixed Event
        print("\n📋 Test 6: Create Fixed Event")
        response = requests.post(
            f"{BASE_URL}/api/fixed-events",
            headers=headers,
            json={
                "title": "Math Class",
                "description": "Calculus lecture",
                "day_of_week": 1,  # Tuesday
                "start_time": "09:00:00",
                "end_time": "10:30:00",
                "color": "#3b82f6"
            }
        )
        print_response("Create Fixed Event", response)
        
        # Test 7: Get Fixed Events
        print("\n📋 Test 7: Get Fixed Events")
        response = requests.get(f"{BASE_URL}/api/fixed-events", headers=headers)
        print_response("Get Fixed Events", response)
        
        # Test 8: Generate Timetable
        print("\n📋 Test 8: Generate Timetable")
        response = requests.post(
            f"{BASE_URL}/api/timetable/generate",
            headers=headers,
            json={"user_id": "guest_test-device-123"}
        )
        print_response("Generate Timetable", response)
        
        # Test 9: Get Weekly Schedule
        print("\n📋 Test 9: Get Weekly Schedule")
        response = requests.get(f"{BASE_URL}/api/timetable/weekly", headers=headers)
        print_response("Get Weekly Schedule", response)
        
        # Test 10: Start Timer
        if habit_id:
            print("\n📋 Test 10: Start Timer")
            response = requests.post(
                f"{BASE_URL}/api/timer/start",
                headers=headers,
                json={
                    "habit_id": habit_id,
                    "mood_before": "good",
                    "energy_level": "high",
                    "notes": "Feeling motivated!"
                }
            )
            print_response("Start Timer", response)
            
            if response.status_code == 200:
                log_id = response.json()["log_id"]
                
                # Test 11: Stop Timer
                print("\n📋 Test 11: Stop Timer")
                import time
                time.sleep(2)  # Simulate some time passing
                
                response = requests.post(
                    f"{BASE_URL}/api/timer/stop",
                    headers=headers,
                    json={
                        "log_id": log_id,
                        "mood_after": "great",
                        "notes": "Completed successfully!",
                        "is_successful": True
                    }
                )
                print_response("Stop Timer", response)
        
        # Test 12: Get Analytics
        print("\n📋 Test 12: Get Analytics")
        response = requests.get(f"{BASE_URL}/api/analytics", headers=headers)
        print_response("Get Analytics", response)
        
        # Test 13: Chat with AI
        print("\n📋 Test 13: Chat with AI")
        response = requests.post(
            f"{BASE_URL}/api/chat",
            headers=headers,
            json={
                "message": "When should I schedule my workout?",
                "user_id": "guest_test-device-123"
            }
        )
        print_response("Chat with AI", response)
    
    print("\n\n✅ Phase 1 & 2 Testing Complete!")
    print("\nIf all tests passed, Phase 1 & 2 backend is working correctly! 🎉")

if __name__ == "__main__":
    try:
        test_phase_1_2()
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to backend")
        print("Make sure the backend is running:")
        print("  docker-compose up")
        print("  OR")
        print("  cd backend && python main.py")
    except Exception as e:
        print(f"\n❌ Error: {e}")
