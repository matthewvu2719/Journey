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

if __name__ == "__main__":
    success = test_bobo_groq()
    sys.exit(0 if success else 1)