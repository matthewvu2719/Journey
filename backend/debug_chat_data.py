#!/usr/bin/env python3
"""
Debug script to check what data the chatbot is receiving
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

from database import SupabaseClient
from intelligent_chatbot import get_intelligent_chatbot

def debug_chat_data():
    """Debug what data the chatbot receives"""
    
    print("🔍 Debugging Chatbot Data")
    print("=" * 50)
    
    # Initialize database and chatbot
    db = SupabaseClient()
    chatbot = get_intelligent_chatbot(db)
    
    # Test with common user IDs
    test_user_ids = [
        "default_user",  # Default fallback
        "guest",         # Common guest ID
        "test_user",     # Test user
    ]
    
    print("Enter your user ID (or press Enter to test common IDs):")
    user_input = input().strip()
    
    if user_input:
        test_user_ids = [user_input] + test_user_ids
    
    for user_id in test_user_ids:
        print(f"\n🔍 Testing User ID: '{user_id}'")
        print("-" * 30)
        
        try:
            # Get the same data that chat endpoint gets
            habits = db.get_habits(user_id)
            today_habits = db.get_habits_for_today(user_id)
            logs = db.get_completions(user_id=user_id)
            schedule = db.get_schedule(user_id)
            
            print(f"📊 Data Summary:")
            print(f"   Total habits: {len(habits)}")
            print(f"   Today's habits: {len(today_habits)}")
            print(f"   Completions: {len(logs)}")
            print(f"   Database mode: {'Mock' if db.mock_mode else 'Supabase'}")
            
            if habits:
                print(f"\n📝 All Habits:")
                for i, habit in enumerate(habits[:5], 1):  # Show first 5
                    name = habit.get('name', 'Unknown')
                    days = habit.get('days', [])
                    times = habit.get('times_of_day', [])
                    active = habit.get('is_active', True)
                    print(f"   {i}. {name} - Days: {days or 'Daily'} - Times: {times or 'Flexible'} - Active: {active}")
                
                if len(habits) > 5:
                    print(f"   ... and {len(habits) - 5} more")
            
            if today_habits:
                print(f"\n📅 Today's Habits:")
                for i, habit in enumerate(today_habits, 1):
                    name = habit.get('name', 'Unknown')
                    duration = habit.get('estimated_duration')
                    print(f"   {i}. {name} - Duration: {duration or 'Quick'} minutes")
            
            # Test chatbot response
            if chatbot and chatbot.ai_enabled:
                print(f"\n🤖 Testing Bobo's Response:")
                
                user_context = {
                    'habits': habits,
                    'today_habits': today_habits,
                    'logs': logs,
                    'schedule': schedule,
                    'user_id': user_id
                }
                
                test_message = "How many habits do I have today?"
                result = chatbot.process_message(test_message, user_context)
                
                print(f"   Question: {test_message}")
                print(f"   Bobo's Answer: {result.get('response', 'No response')}")
            else:
                print(f"   ⚠️ Chatbot not available (AI disabled or not initialized)")
            
            # If we found data, we can stop testing other user IDs
            if habits:
                print(f"\n✅ Found data for user '{user_id}' - this is likely your correct user ID")
                break
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print(f"\n" + "=" * 50)
    print("🔍 Debug Complete")
    
    if not any(len(db.get_habits(uid)) > 0 for uid in test_user_ids):
        print("\n⚠️ No habits found for any test user ID!")
        print("Possible issues:")
        print("1. Database connection problem")
        print("2. Wrong user ID")
        print("3. Habits not properly saved")
        print("4. Database in mock mode with no data")
        
        print(f"\nDatabase info:")
        print(f"- Mock mode: {db.mock_mode}")
        print(f"- Supabase URL: {os.getenv('SUPABASE_URL', 'Not set')}")
        print(f"- Has Supabase key: {'Yes' if os.getenv('SUPABASE_KEY') else 'No'}")

if __name__ == "__main__":
    debug_chat_data()