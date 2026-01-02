#!/usr/bin/env python3
"""
Quick test examples showing Pomodoro intelligence in action
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from intelligent_chatbot import IntelligentChatbot
import asyncio
import json

async def test_pomodoro_examples():
    """Show examples of Pomodoro intelligence"""
    print("🍅 Pomodoro Intelligence Examples")
    print("=" * 50)
    
    chatbot = IntelligentChatbot()
    
    if not chatbot.ai_enabled:
        print("⚠️  Groq AI not available")
        return
    
    # Example 1: Study habit (should get Pomodoro)
    print("\n📚 Example 1: Study Spanish (SHOULD get Pomodoro)")
    print("-" * 40)
    
    study_habit = {
        "name": "Study Spanish",
        "category": "learning",
        "difficulty": "medium",
        "estimated_duration": 30
    }
    
    try:
        result = await chatbot.get_friction_solutions(
            habit=study_habit,
            friction_type="distraction",
            user_context={"recent_completions_count": 5}
        )
        
        print(f"Pomodoro suitable: {result.get('pomodoro_suitable', 'Not specified')}")
        print(f"Reasoning: {result.get('pomodoro_reasoning', 'No reasoning')}")
        
        pomodoro_solutions = [s for s in result.get('solutions', []) if s.get('action_type') == 'pomodoro']
        print(f"Pomodoro solutions found: {len(pomodoro_solutions)}")
        
        if pomodoro_solutions:
            print(f"Pomodoro solution: {pomodoro_solutions[0].get('title', 'No title')}")
        
    except Exception as e:
        print(f"Error: {e}")
    
    # Example 2: Workout habit (should NOT get Pomodoro)
    print("\n🏃 Example 2: Morning Workout (should NOT get Pomodoro)")
    print("-" * 40)
    
    workout_habit = {
        "name": "Morning Workout",
        "category": "fitness", 
        "difficulty": "medium",
        "estimated_duration": 45
    }
    
    try:
        result = await chatbot.get_friction_solutions(
            habit=workout_habit,
            friction_type="distraction",
            user_context={"recent_completions_count": 5}
        )
        
        print(f"Pomodoro suitable: {result.get('pomodoro_suitable', 'Not specified')}")
        print(f"Reasoning: {result.get('pomodoro_reasoning', 'No reasoning')}")
        
        pomodoro_solutions = [s for s in result.get('solutions', []) if s.get('action_type') == 'pomodoro']
        print(f"Pomodoro solutions found: {len(pomodoro_solutions)}")
        
        if pomodoro_solutions:
            print(f"Pomodoro solution: {pomodoro_solutions[0].get('title', 'No title')}")
        else:
            print("✅ Correctly excluded Pomodoro for workout habit")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_pomodoro_examples())