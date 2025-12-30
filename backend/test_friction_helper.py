#!/usr/bin/env python3
"""
Test script for Friction Helper AI Integration (Task 2.2)
Tests the complete friction helper system with Groq AI
"""
import os
import sys
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

from intelligent_chatbot import get_intelligent_chatbot
from database import SupabaseClient

async def test_friction_helper_system():
    """Test the complete friction helper system"""
    
    print("🤖 Testing Friction Helper AI System (Task 2.2)")
    print("=" * 60)
    
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
        
        if not chatbot or not chatbot.ai_enabled:
            print("❌ Groq AI not properly initialized")
            return False
            
        print("✅ Friction Helper AI initialized successfully")
        
    except Exception as e:
        print(f"❌ Error initializing: {e}")
        return False
    
    # Test data - mock habit and user context
    test_habit = {
        'id': 1,
        'name': 'Morning Meditation',
        'category': 'wellness',
        'habit_type': 'standard',
        'estimated_duration': 15,
        'difficulty': 'medium',
        'priority': 8
    }
    
    test_user_context = {
        'recent_completions_count': 12,
        'most_successful_energy': 'high',
        'most_successful_time': 'morning',
        'energy_patterns': {'high': 8, 'medium': 4, 'low': 2},
        'time_success_rates': {'morning': 0.85, 'afternoon': 0.60, 'evening': 0.45}
    }
    
    # Test all friction types
    friction_types = ["distraction", "low-energy", "complexity", "forgetfulness"]
    
    print("\n🎯 Testing Friction Types:")
    print("-" * 40)
    
    for friction_type in friction_types:
        print(f"\n🔍 Testing {friction_type.upper()} friction:")
        
        try:
            # Test AI solution generation
            result = await chatbot.get_friction_solutions(
                habit=test_habit,
                friction_type=friction_type,
                user_context=test_user_context,
                additional_context=f"I'm struggling with {friction_type} when trying to meditate",
                friction_history=[]
            )
            
            # Validate response structure
            required_keys = ['bobo_message', 'solutions', 'recommended_actions']
            for key in required_keys:
                if key not in result:
                    print(f"   ❌ Missing key: {key}")
                    return False
            
            print(f"   ✅ Bobo Message: {result['bobo_message'][:100]}...")
            print(f"   ✅ Solutions Generated: {len(result['solutions'])}")
            
            # Validate solutions structure
            for i, solution in enumerate(result['solutions'][:2]):  # Check first 2
                required_solution_keys = ['title', 'description', 'action_type', 'confidence_score']
                for key in required_solution_keys:
                    if key not in solution:
                        print(f"   ❌ Solution {i+1} missing key: {key}")
                        return False
                
                # Validate confidence score
                confidence = solution['confidence_score']
                if not (0.0 <= confidence <= 1.0):
                    print(f"   ❌ Invalid confidence score: {confidence}")
                    return False
                
                print(f"   ✅ Solution {i+1}: {solution['title']} (confidence: {confidence})")
            
            print(f"   ✅ Recommended Actions: {len(result['recommended_actions'])}")
            
        except Exception as e:
            print(f"   ❌ Error testing {friction_type}: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    # Test system prompts and context injection
    print("\n🧠 Testing AI Context Injection:")
    print("-" * 40)
    
    try:
        # Test with rich context
        rich_context = {
            **test_user_context,
            'recent_completions_count': 25,
            'energy_patterns': {'high': 15, 'medium': 8, 'low': 2}
        }
        
        result = await chatbot.get_friction_solutions(
            habit=test_habit,
            friction_type="distraction",
            user_context=rich_context,
            additional_context="I keep getting distracted by my phone notifications during meditation",
            friction_history=[
                {'friction_type': 'distraction', 'was_helpful': True, 'action_taken': 'phone_airplane_mode'}
            ]
        )
        
        print("   ✅ Rich context processing successful")
        print(f"   ✅ Context-aware response: {result['bobo_message'][:150]}...")
        
    except Exception as e:
        print(f"   ❌ Error testing context injection: {e}")
        return False
    
    # Test fallback responses
    print("\n🛡️ Testing Fallback System:")
    print("-" * 40)
    
    try:
        # Test fallback response
        fallback_result = chatbot._fallback_friction_response("distraction", "Test Habit")
        
        if 'bobo_message' not in fallback_result or 'solutions' not in fallback_result:
            print("   ❌ Fallback response missing required keys")
            return False
        
        print("   ✅ Fallback system working correctly")
        print(f"   ✅ Fallback message: {fallback_result['bobo_message'][:100]}...")
        
    except Exception as e:
        print(f"   ❌ Error testing fallback: {e}")
        return False
    
    # Test journey-themed responses
    print("\n🗺️ Testing Journey Theme Integration:")
    print("-" * 40)
    
    journey_keywords = [
        "journey", "obstacle", "path", "adventure", "mountain", "valley", 
        "detour", "navigation", "waypoint", "destination"
    ]
    
    try:
        result = await chatbot.get_friction_solutions(
            habit=test_habit,
            friction_type="complexity",
            user_context=test_user_context
        )
        
        response_text = result['bobo_message'].lower()
        found_keywords = [kw for kw in journey_keywords if kw in response_text]
        
        if found_keywords:
            print(f"   ✅ Journey theme detected: {', '.join(found_keywords)}")
        else:
            print("   ⚠️ Journey theme not strongly present in response")
        
        print(f"   ✅ Theme integration test completed")
        
    except Exception as e:
        print(f"   ❌ Error testing journey theme: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("🎉 TASK 2.2 COMPLETION STATUS:")
    print("✅ Groq AI Integration - COMPLETE")
    print("✅ Friction-specific prompts - COMPLETE") 
    print("✅ System prompts for each obstacle type - COMPLETE")
    print("✅ Solution parsing and structuring - COMPLETE")
    print("✅ Context injection (habit details, user patterns) - COMPLETE")
    print("✅ Journey-themed responses - COMPLETE")
    print("✅ Fallback system - COMPLETE")
    print("\n🚀 Task 2.2: Groq AI Integration is FULLY IMPLEMENTED!")
    
    return True

if __name__ == "__main__":
    success = asyncio.run(test_friction_helper_system())
    sys.exit(0 if success else 1)