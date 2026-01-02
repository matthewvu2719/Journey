#!/usr/bin/env python3
"""
Test Journey Achievement Integration
Tests the integration between journey achievements and the main achievement system
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from achievement_engine import AchievementEngine
from database import SupabaseClient
import json

def test_journey_achievement_integration():
    """Test journey achievement integration with main achievement system"""
    
    print("🧪 Testing Journey Achievement Integration...")
    
    # Initialize components
    db = SupabaseClient()
    achievement_engine = AchievementEngine(db)
    
    # Test user ID
    test_user_id = "test_journey_user_123"
    
    print(f"\n1. Testing journey achievement checking for user: {test_user_id}")
    
    # Test checking journey achievements (should return empty list for new user)
    unlocked = achievement_engine.check_journey_achievements(test_user_id)
    print(f"   Initial journey achievements: {len(unlocked)} unlocked")
    
    # Test getting obstacle stats
    print("\n2. Testing obstacle stats retrieval...")
    try:
        obstacle_stats = achievement_engine._get_obstacle_stats(test_user_id)
        print(f"   Obstacle stats retrieved: {obstacle_stats}")
    except Exception as e:
        print(f"   Error getting obstacle stats: {e}")
    
    # Test journey badge unlocking
    print("\n3. Testing journey badge unlocking...")
    try:
        badge_reward = achievement_engine._unlock_journey_badge(test_user_id, 'navigator')
        if badge_reward:
            print(f"   Journey badge unlocked: {badge_reward['achievement_name']}")
            print(f"   Reward type: {badge_reward['reward_type']}")
            print(f"   Message: {badge_reward['message']}")
            if 'bobo_message' in badge_reward:
                print(f"   Bobo message: {badge_reward['bobo_message']}")
        else:
            print("   No badge reward returned")
    except Exception as e:
        print(f"   Error unlocking journey badge: {e}")
    
    # Test obstacle message retrieval
    print("\n4. Testing obstacle message retrieval...")
    try:
        encounter_msg = achievement_engine.get_obstacle_message('distraction_detour', 'encounter')
        overcome_msg = achievement_engine.get_obstacle_message('distraction_detour', 'overcome')
        print(f"   Encounter message: {encounter_msg}")
        print(f"   Overcome message: {overcome_msg}")
    except Exception as e:
        print(f"   Error getting obstacle messages: {e}")
    
    # Test achievement type constants
    print("\n5. Testing achievement type constants...")
    journey_achievements = [
        'obstacle_navigator',
        'distraction_master', 
        'energy_warrior',
        'maze_solver',
        'memory_keeper',
        'journey_champion',
        'persistence_legend'
    ]
    
    for achievement_type in journey_achievements:
        if achievement_type in achievement_engine.ACHIEVEMENT_TYPES:
            achievement_info = achievement_engine.ACHIEVEMENT_TYPES[achievement_type]
            print(f"   ✓ {achievement_type}: {achievement_info['name']}")
        else:
            print(f"   ✗ Missing achievement type: {achievement_type}")
    
    # Test reward libraries
    print("\n6. Testing journey reward libraries...")
    print(f"   Journey badges: {len(achievement_engine.JOURNEY_BADGES)} available")
    print(f"   Special hats: {len(achievement_engine.SPECIAL_JOURNEY_HATS)} available")
    print(f"   Special costumes: {len(achievement_engine.SPECIAL_JOURNEY_COSTUMES)} available")
    print(f"   Special dances: {len(achievement_engine.SPECIAL_JOURNEY_DANCES)} available")
    print(f"   Obstacle messages: {len(achievement_engine.OBSTACLE_MESSAGES)} obstacle types")
    
    print("\n✅ Journey Achievement Integration Test Complete!")
    return True

if __name__ == "__main__":
    try:
        test_journey_achievement_integration()
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()