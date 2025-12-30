#!/usr/bin/env python3
"""
Test script for Bobo's Groq AI integration
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

from intelligent_chatbot import get_intelligent_chatbot
from database import SupabaseClient

def test_bobo_groq():
    """Test Bobo's Groq AI integration"""
    
    print("🤖 Testing Bobo's Groq AI Integration")
    print("=" * 50)
    
    # Check if Groq API key is set
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        print("❌ GROQ_API_KEY not found in environment variables")
        print("Please add GROQ_API_KEY to your .env file")
        return False
    
    print(f"✅ Groq API Key found: {groq_key[:10]}...")
    
    # Initialize database and chatbot
    try:
        db = SupabaseClient()
        chatbot = get_intelligent_chatbot(db)
        
        if not chatbot:
            print("❌ Failed to initialize chatbot")
            return False
            
        print("✅ Chatbot initialized successfully")
        
        if not chatbot.ai_enabled:
            print("❌ Groq AI not enabled in chatbot")
            return False
            
        print("✅ Groq AI enabled in chatbot")
        
    except Exception as e:
        print(f"❌ Error initializing: {e}")
        return False
    
    # Test conversations
    test_messages = [
        "Hi Bobo!",
        "How many habits do I have?",
        "I want to start running",
        "Show me my habits",
        "How am I doing today?"
    ]
    
    print("\n🗣️ Testing Conversations:")
    print("-" * 30)
    
    # Mock user context
    user_context = {
        'habits': [
            {'id': 1, 'name': 'Morning Run', 'category': 'fitness', 'estimated_duration': 30},
            {'id': 2, 'name': 'Reading', 'category': 'learning', 'estimated_duration': None}
        ],
        'logs': [
            {'id': 1, 'habit_id': 1, 'is_successful': True},
            {'id': 2, 'habit_id': 2, 'is_successful': True}
        ],
        'user_id': 'test_user'
    }
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n{i}. User: {message}")
        
        try:
            result = chatbot.process_message(message, user_context)
            response = result.get('response', 'No response')
            action = result.get('action')
            
            print(f"   Bobo: {response}")
            
            if action:
                print(f"   Action: {action}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False
    
    print("\n" + "=" * 50)
    print("✅ All tests passed! Bobo is ready to chat with Groq AI!")
    return True

async def test_friction_helper_integration():
    """Test friction helper integration as part of Task 2.2"""
    
    print("\n🎯 Testing Friction Helper Integration (Task 2.2)")
    print("=" * 60)
    
    try:
        db = SupabaseClient()
        chatbot = get_intelligent_chatbot(db)
        
        if not chatbot or not chatbot.ai_enabled:
            print("❌ Groq AI not properly initialized for friction helper")
            return False
        
        # Test habit and context
        test_habit = {
            'id': 1,
            'name': 'Daily Exercise',
            'category': 'fitness',
            'estimated_duration': 30,
            'difficulty': 'medium'
        }
        
        test_context = {
            'recent_completions_count': 15,
            'most_successful_energy': 'high',
            'most_successful_time': 'morning',
            'energy_patterns': {'high': 10, 'medium': 5}
        }
        
        # Test each friction type
        friction_types = ["distraction", "low-energy", "complexity", "forgetfulness"]
        
        for friction_type in friction_types:
            print(f"\n🔍 Testing {friction_type} friction solutions...")
            
            result = await chatbot.get_friction_solutions(
                habit=test_habit,
                friction_type=friction_type,
                user_context=test_context,
                additional_context=f"Having trouble with {friction_type}"
            )
            
            # Validate response structure
            if not all(key in result for key in ['bobo_message', 'solutions']):
                print(f"   ❌ Invalid response structure for {friction_type}")
                return False
            
            print(f"   ✅ {friction_type.title()} solutions generated successfully")
            print(f"   ✅ Bobo message: {result['bobo_message'][:80]}...")
            print(f"   ✅ Solutions count: {len(result['solutions'])}")
        
        print("\n✅ All friction helper tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Friction helper test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    import asyncio
    
    # Run basic Groq tests
    basic_success = test_bobo_groq()
    
    # Run friction helper tests
    friction_success = asyncio.run(test_friction_helper_integration())
    
    overall_success = basic_success and friction_success
    
    if overall_success:
        print("\n🎉 ALL TESTS PASSED!")
        print("✅ Basic Groq AI Integration - COMPLETE")
        print("✅ Friction Helper Integration - COMPLETE") 
        print("🚀 Task 2.2: Groq AI Integration is FULLY IMPLEMENTED!")
    else:
        print("\n❌ Some tests failed!")
    
    sys.exit(0 if overall_success else 1)