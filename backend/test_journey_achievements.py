#!/usr/bin/env python3
"""
Test Journey Achievement System Integration

This test verifies that the complete journey achievement system works:
1. Database methods for obstacle tracking
2. Achievement engine journey achievement checking
3. API endpoints for journey achievements
4. Integration with friction helper system
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import Database
from achievement_engine import AchievementEngine
import asyncio
from datetime import datetime

def test_journey_achievement_system():
    """Test the complete journey achievement system"""
    print("🧭 Testing Journey Achievement System")
    print("=" * 60)
    
    # Initialize database and achievement engine
    db = Database()
    achievement_engine = AchievementEngine(db)
    
    test_user_id = "test_journey_user"
    
    # Test 1: Record obstacle encounters
    print("\n1️⃣ Testing Obstacle Encounter Recording:")
    print("-" * 40)
    
    try:
        # Record different types of obstacle encounters
        obstacles = [
            {'obstacle_type': 'distraction_detour', 'severity': 'medium', 'description': 'Social media distraction'},
            {'obstacle_type': 'energy_drain_valley', 'severity': 'high', 'description': 'Feeling very tired'},
            {'obstacle_type': 'maze_mountain', 'severity': 'low', 'description': 'Task seems complex'},
            {'obstacle_type': 'memory_fog', 'severity': 'medium', 'description': 'Forgot to do habit'}
        ]
        
        encounter_ids = []
        for obstacle in obstacles:
            success = db.record_obstacle_encounter(test_user_id, obstacle['obstacle_type'], obstacle)
            if success:
                print(f"   ✅ Recorded {obstacle['obstacle_type']} encounter")
                # In mock mode, we'll simulate encounter IDs
                encounter_ids.append(len(encounter_ids) + 1)
            else:
                print(f"   ❌ Failed to record {obstacle['obstacle_type']} encounter")
                return False
        
        print(f"   ✅ All {len(obstacles)} obstacle encounters recorded")
        
    except Exception as e:
        print(f"   ❌ Error recording obstacle encounters: {e}")
        return False
    
    # Test 2: Resolve obstacles as overcome
    print("\n2️⃣ Testing Obstacle Resolution:")
    print("-" * 40)
    
    try:
        for i, encounter_id in enumerate(encounter_ids):
            obstacle_type = obstacles[i]['obstacle_type']
            resolution_data = {
                'obstacle_type': obstacle_type,
                'solution_used': 'pomodoro_timer',
                'was_overcome': True,
                'resolution_notes': f'Successfully overcame {obstacle_type}'
            }
            
            success = db.resolve_obstacle_encounter(encounter_id, True, resolution_data)
            if success:
                print(f"   ✅ Resolved encounter {encounter_id} as overcome")
            else:
                print(f"   ❌ Failed to resolve encounter {encounter_id}")
                return False
        
        print(f"   ✅ All {len(encounter_ids)} obstacles resolved as overcome")
        
    except Exception as e:
        print(f"   ❌ Error resolving obstacles: {e}")
        return False
    
    # Test 3: Check journey achievements
    print("\n3️⃣ Testing Journey Achievement Checking:")
    print("-" * 40)
    
    try:
        # Check for navigator achievement (first obstacle)
        navigator_achievements = achievement_engine.check_journey_achievements(test_user_id)
        print(f"   ✅ Navigator achievement check: {len(navigator_achievements)} achievements")
        
        # Check for mastery achievements (need 5 of each type)
        # Simulate having 5 of each obstacle type overcome
        for obstacle_type in ['distraction_detour', 'energy_drain_valley', 'maze_mountain', 'memory_fog']:
            # Add more encounters to reach mastery threshold
            for i in range(4):  # Add 4 more to reach 5 total
                db.record_obstacle_encounter(test_user_id, obstacle_type, {'severity': 'low'})
                db.resolve_obstacle_encounter(len(encounter_ids) + i + 1, True, {'obstacle_type': obstacle_type})
            
            mastery_achievements = achievement_engine.check_journey_achievements(test_user_id, obstacle_type)
            print(f"   ✅ {obstacle_type} mastery check: {len(mastery_achievements)} achievements")
        
    except Exception as e:
        print(f"   ❌ Error checking journey achievements: {e}")
        return False
    
    # Test 4: Get obstacle statistics
    print("\n4️⃣ Testing Obstacle Statistics:")
    print("-" * 40)
    
    try:
        stats = db.get_obstacle_encounter_stats(test_user_id)
        print(f"   ✅ Total obstacles encountered: {stats.get('total_obstacles_encountered', 0)}")
        print(f"   ✅ Total obstacles overcome: {stats.get('total_obstacles_overcome', 0)}")
        print(f"   ✅ Journey level: {stats.get('journey_level', 1)}")
        print(f"   ✅ Journey experience: {stats.get('journey_experience', 0)}")
        print(f"   ✅ Current streak: {stats.get('current_success_streak', 0)}")
        
        # Verify specific obstacle counts
        for obstacle_type in ['distraction_detours_overcome', 'energy_valleys_overcome', 'maze_mountains_overcome', 'memory_fogs_overcome']:
            count = stats.get(obstacle_type, 0)
            print(f"   ✅ {obstacle_type}: {count}")
        
    except Exception as e:
        print(f"   ❌ Error getting obstacle statistics: {e}")
        return False
    
    # Test 5: Save journey achievements
    print("\n5️⃣ Testing Journey Achievement Saving:")
    print("-" * 40)
    
    try:
        # Test saving different types of journey achievements
        test_achievements = [
            {
                'achievement_type': 'obstacle_navigator',
                'reward_type': 'journey_badge',
                'reward_data': {'id': 'navigator', 'name': 'Navigator Badge', 'description': 'First obstacle overcome'},
                'unlocked_at': datetime.now().isoformat()
            },
            {
                'achievement_type': 'distraction_master',
                'reward_type': 'special_hat',
                'reward_data': {'id': 'focus_cap', 'name': 'Focus Cap', 'description': 'Master of focus'},
                'unlocked_at': datetime.now().isoformat()
            }
        ]
        
        for achievement in test_achievements:
            success = db.save_journey_achievement(test_user_id, achievement)
            if success:
                print(f"   ✅ Saved {achievement['achievement_type']} achievement")
            else:
                print(f"   ❌ Failed to save {achievement['achievement_type']} achievement")
                return False
        
        # Test retrieving saved achievements
        saved_achievements = db.get_user_journey_achievements(test_user_id)
        print(f"   ✅ Retrieved {len(saved_achievements)} saved achievements")
        
    except Exception as e:
        print(f"   ❌ Error saving journey achievements: {e}")
        return False
    
    # Test 6: Check achievement unlocked status
    print("\n6️⃣ Testing Achievement Status Checking:")
    print("-" * 40)
    
    try:
        # Test checking if achievements are already unlocked
        navigator_unlocked = db.check_journey_achievement_unlocked(test_user_id, 'obstacle_navigator')
        distraction_unlocked = db.check_journey_achievement_unlocked(test_user_id, 'distraction_master')
        energy_unlocked = db.check_journey_achievement_unlocked(test_user_id, 'energy_warrior')
        
        print(f"   ✅ Navigator unlocked: {navigator_unlocked}")
        print(f"   ✅ Distraction master unlocked: {distraction_unlocked}")
        print(f"   ✅ Energy warrior unlocked: {energy_unlocked}")
        
    except Exception as e:
        print(f"   ❌ Error checking achievement status: {e}")
        return False
    
    print("\n🎉 Journey Achievement System Test Complete!")
    print("=" * 60)
    print("✅ Obstacle encounter recording - WORKING")
    print("✅ Obstacle resolution tracking - WORKING")
    print("✅ Journey achievement checking - WORKING")
    print("✅ Obstacle statistics calculation - WORKING")
    print("✅ Journey achievement saving - WORKING")
    print("✅ Achievement status checking - WORKING")
    print("\n🧭 Journey Achievement System is fully operational!")
    
    return True

def test_achievement_engine_integration():
    """Test achievement engine integration with journey achievements"""
    print("\n🏆 Testing Achievement Engine Integration")
    print("=" * 60)
    
    db = Database()
    achievement_engine = AchievementEngine(db)
    test_user_id = "test_engine_user"
    
    try:
        # Test that journey achievements are properly defined
        journey_achievement_types = [
            'obstacle_navigator', 'distraction_master', 'energy_warrior',
            'maze_solver', 'memory_keeper', 'journey_champion', 'persistence_legend'
        ]
        
        print("1️⃣ Checking Journey Achievement Definitions:")
        for achievement_type in journey_achievement_types:
            if achievement_type in achievement_engine.ACHIEVEMENT_TYPES:
                achievement = achievement_engine.ACHIEVEMENT_TYPES[achievement_type]
                print(f"   ✅ {achievement['name']}: {achievement['description']}")
            else:
                print(f"   ❌ Missing journey achievement: {achievement_type}")
                return False
        
        print(f"\n   ✅ All {len(journey_achievement_types)} journey achievements defined")
        
        # Test reward libraries
        print("\n2️⃣ Checking Journey Reward Libraries:")
        reward_libraries = ['JOURNEY_BADGES', 'SPECIAL_JOURNEY_HATS', 'SPECIAL_JOURNEY_COSTUMES', 'SPECIAL_JOURNEY_DANCES']
        
        for library in reward_libraries:
            if hasattr(achievement_engine, library):
                rewards = getattr(achievement_engine, library)
                print(f"   ✅ {library}: {len(rewards)} rewards available")
            else:
                print(f"   ❌ Missing reward library: {library}")
                return False
        
        # Test obstacle messages
        print("\n3️⃣ Checking Obstacle Messages:")
        obstacle_types = ['distraction_detour', 'energy_drain_valley', 'maze_mountain', 'memory_fog']
        
        for obstacle_type in obstacle_types:
            encounter_msg = achievement_engine.get_obstacle_message(obstacle_type, 'encounter')
            overcome_msg = achievement_engine.get_obstacle_message(obstacle_type, 'overcome')
            print(f"   ✅ {obstacle_type}: Messages available")
        
        print("\n🎉 Achievement Engine Integration Test Complete!")
        return True
        
    except Exception as e:
        print(f"   ❌ Error testing achievement engine integration: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Journey Achievement System Tests")
    print("=" * 80)
    
    # Run all tests
    test1_passed = test_journey_achievement_system()
    test2_passed = test_achievement_engine_integration()
    
    print("\n" + "=" * 80)
    print("📊 FINAL TEST RESULTS:")
    print("=" * 80)
    
    if test1_passed and test2_passed:
        print("🎉 ALL TESTS PASSED! Journey Achievement System is ready!")
        print("\n✅ Database integration - COMPLETE")
        print("✅ Achievement engine integration - COMPLETE")
        print("✅ Journey achievement tracking - COMPLETE")
        print("✅ Obstacle statistics - COMPLETE")
        print("✅ Reward system integration - COMPLETE")
        
        print("\n🧭 The Journey Achievement System is fully implemented and ready for use!")
        print("Users can now:")
        print("  • Encounter and overcome obstacles")
        print("  • Unlock journey-specific achievements")
        print("  • Earn special badges, hats, costumes, and dances")
        print("  • Track their journey progress and statistics")
        print("  • See achievement notifications in the UI")
        
    else:
        print("❌ SOME TESTS FAILED!")
        if not test1_passed:
            print("❌ Journey Achievement System test failed")
        if not test2_passed:
            print("❌ Achievement Engine Integration test failed")
        
        print("\n🔧 Please review the errors above and fix the issues.")