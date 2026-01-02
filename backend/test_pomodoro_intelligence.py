#!/usr/bin/env python3
"""
Test Intelligent Pomodoro Suggestions
Tests that Groq AI only suggests Pomodoro for appropriate habits
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from intelligent_chatbot import IntelligentChatbot
import asyncio

async def test_pomodoro_intelligence():
    """Test that Pomodoro is only suggested for appropriate habits"""
    print("🍅 Testing Intelligent Pomodoro Suggestions...")
    
    # Initialize chatbot
    chatbot = IntelligentChatbot()
    
    if not chatbot.ai_enabled:
        print("⚠️  Groq AI not available - skipping test")
        return
    
    # Test habits where Pomodoro SHOULD be suggested
    pomodoro_suitable_habits = [
        {
            "name": "Read programming book",
            "category": "learning",
            "difficulty": "medium",
            "estimated_duration": 30,
            "description": "Read and take notes on programming concepts"
        },
        {
            "name": "Study Spanish",
            "category": "education", 
            "difficulty": "medium",
            "estimated_duration": 25,
            "description": "Practice Spanish vocabulary and grammar"
        },
        {
            "name": "Write journal",
            "category": "personal",
            "difficulty": "easy",
            "estimated_duration": 15,
            "description": "Reflect and write daily thoughts"
        },
        {
            "name": "Code side project",
            "category": "work",
            "difficulty": "hard",
            "estimated_duration": 60,
            "description": "Work on personal coding project"
        }
    ]
    
    # Test habits where Pomodoro should NOT be suggested
    pomodoro_unsuitable_habits = [
        {
            "name": "Morning workout",
            "category": "fitness",
            "difficulty": "medium", 
            "estimated_duration": 45,
            "description": "30-minute cardio and strength training"
        },
        {
            "name": "Meditate",
            "category": "wellness",
            "difficulty": "easy",
            "estimated_duration": 10,
            "description": "Mindfulness meditation practice"
        },
        {
            "name": "Brush teeth",
            "category": "hygiene",
            "difficulty": "easy",
            "estimated_duration": 3,
            "description": "Daily dental hygiene"
        },
        {
            "name": "Call mom",
            "category": "social",
            "difficulty": "easy",
            "estimated_duration": 20,
            "description": "Weekly check-in call with family"
        }
    ]
    
    print("\n🧠 Testing habits that SHOULD get Pomodoro suggestions:")
    suitable_results = []
    
    for habit in pomodoro_suitable_habits:
        print(f"\n📚 Testing: {habit['name']}")
        
        try:
            result = await chatbot.get_friction_solutions(
                habit=habit,
                friction_type="distraction",
                user_context={
                    "recent_completions_count": 10,
                    "most_successful_energy": "high",
                    "most_successful_time": "morning"
                }
            )
            
            pomodoro_suitable = result.get("pomodoro_suitable", False)
            pomodoro_reasoning = result.get("pomodoro_reasoning", "No reasoning")
            has_pomodoro_solution = any(
                s.get("action_type") == "pomodoro" 
                for s in result.get("solutions", [])
            )
            
            print(f"   ✅ Pomodoro suitable: {pomodoro_suitable}")
            print(f"   📝 Reasoning: {pomodoro_reasoning}")
            print(f"   🍅 Has pomodoro solution: {has_pomodoro_solution}")
            
            suitable_results.append({
                "habit": habit["name"],
                "suitable": pomodoro_suitable,
                "has_solution": has_pomodoro_solution,
                "reasoning": pomodoro_reasoning
            })
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            suitable_results.append({
                "habit": habit["name"],
                "suitable": False,
                "has_solution": False,
                "error": str(e)
            })
    
    print("\n🏃 Testing habits that should NOT get Pomodoro suggestions:")
    unsuitable_results = []
    
    for habit in pomodoro_unsuitable_habits:
        print(f"\n🚫 Testing: {habit['name']}")
        
        try:
            result = await chatbot.get_friction_solutions(
                habit=habit,
                friction_type="distraction",
                user_context={
                    "recent_completions_count": 10,
                    "most_successful_energy": "high", 
                    "most_successful_time": "morning"
                }
            )
            
            pomodoro_suitable = result.get("pomodoro_suitable", False)
            pomodoro_reasoning = result.get("pomodoro_reasoning", "No reasoning")
            has_pomodoro_solution = any(
                s.get("action_type") == "pomodoro"
                for s in result.get("solutions", [])
            )
            
            print(f"   ❌ Pomodoro suitable: {pomodoro_suitable}")
            print(f"   📝 Reasoning: {pomodoro_reasoning}")
            print(f"   🍅 Has pomodoro solution: {has_pomodoro_solution}")
            
            unsuitable_results.append({
                "habit": habit["name"],
                "suitable": pomodoro_suitable,
                "has_solution": has_pomodoro_solution,
                "reasoning": pomodoro_reasoning
            })
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            unsuitable_results.append({
                "habit": habit["name"],
                "suitable": False,
                "has_solution": False,
                "error": str(e)
            })
    
    # Analyze results
    print("\n📊 Test Results Analysis:")
    
    # Check suitable habits
    suitable_correct = sum(1 for r in suitable_results if r.get("suitable", False))
    suitable_total = len(suitable_results)
    suitable_accuracy = (suitable_correct / suitable_total * 100) if suitable_total > 0 else 0
    
    print(f"\n✅ Suitable Habits (should get Pomodoro):")
    print(f"   Correctly identified: {suitable_correct}/{suitable_total} ({suitable_accuracy:.1f}%)")
    
    for result in suitable_results:
        status = "✅" if result.get("suitable") else "❌"
        print(f"   {status} {result['habit']}: {result.get('reasoning', 'No reasoning')}")
    
    # Check unsuitable habits  
    unsuitable_correct = sum(1 for r in unsuitable_results if not r.get("suitable", True))
    unsuitable_total = len(unsuitable_results)
    unsuitable_accuracy = (unsuitable_correct / unsuitable_total * 100) if unsuitable_total > 0 else 0
    
    print(f"\n❌ Unsuitable Habits (should NOT get Pomodoro):")
    print(f"   Correctly identified: {unsuitable_correct}/{unsuitable_total} ({unsuitable_accuracy:.1f}%)")
    
    for result in unsuitable_results:
        status = "✅" if not result.get("suitable") else "❌"
        print(f"   {status} {result['habit']}: {result.get('reasoning', 'No reasoning')}")
    
    # Overall accuracy
    total_correct = suitable_correct + unsuitable_correct
    total_tests = suitable_total + unsuitable_total
    overall_accuracy = (total_correct / total_tests * 100) if total_tests > 0 else 0
    
    print(f"\n🎯 Overall Accuracy: {total_correct}/{total_tests} ({overall_accuracy:.1f}%)")
    
    # Success criteria
    if overall_accuracy >= 75:
        print("🎉 SUCCESS: Pomodoro intelligence is working well!")
        return True
    else:
        print("⚠️  NEEDS IMPROVEMENT: Pomodoro suggestions need refinement")
        return False

if __name__ == "__main__":
    try:
        result = asyncio.run(test_pomodoro_intelligence())
        if result:
            print("\n✅ Pomodoro Intelligence Test PASSED!")
        else:
            print("\n❌ Pomodoro Intelligence Test FAILED!")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)