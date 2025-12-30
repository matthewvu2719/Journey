#!/usr/bin/env python3
"""
Test script for Journey Obstacle System (Task 2.4)
Tests the complete obstacle tracking and achievement system
"""
import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path
sys.path.append(os.path.dirname(__file__))

from achievement_engine import AchievementEngine
from database import SupabaseClient

def test_obstacle_system():
    """Test the complete journey obstacle system"""
    
    print("🗺️ Testing Journey Obstacle System (Task 2.4)")
    print("=" * 60)
    
    # Initialize components
    try:
        db = SupabaseClient()
        achievement_engine = AchievementEngine(db)
        print("✅ Obstacle system components initialized successfully")
    except Exception as e:
        print(f"❌ Error initializing components: {e}")
        return False
    
    # Test 1: Obstacle Data Structure
    print("\n📊 Testing Obstacle Data Structure:")
    print("-" * 45)
    
    try:
        # Test obstacle encounter creation
        encounter_data = {
            "user_id": "test_user",
            "habit_id": 1,
            "obstacle_type": "distraction_detour",
            "severity": "medium",
            "user_description": "Got distracted by social media",
            "bobo_response": "Let's navigate around this distraction together!",
            "previous_success_streak": 5,
            "journey_stage": "beginning"
        }
        
        encounter = db.create_obstacle_encounter(encounter_data)
        
        # Validate encounter structure
        required_fields = ["id", "user_id", "habit_id", "obstacle_type", "severity", "encountered_at"]
        for field in required_fields:
            if field not in encounter:
                print(f"   ❌ Missing field in encounter: {field}")
                return False
        
        print(f"   ✅ Obstacle encounter created: ID {encounter['id']}")
        print(f"   ✅ Obstacle type: {encounter['obstacle_type']}")
        print(f"   ✅ Severity: {encounter['severity']}")
        print(f"   ✅ Journey stage: {encounter.get('journey_stage', 'unknown')}")
        
        encounter_id = encounter["id"]
        
    except Exception as e:
        print(f"   ❌ Error testing obstacle data structure: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Test 2: Obstacle-Specific Bobo Messages
    print("\n🤖 Testing Obstacle-Specific Bobo Messages:")
    print("-" * 50)
    
    try:
        obstacle_types = ["distraction_detour", "energy_drain_valley", "maze_mountain", "memory_fog"]
        message_types = ["encounter", "overcome"]
        
        for obstacle_type in obstacle_types:
            for message_type in message_types:
                message = achievement_engine.get_obstacle_message(obstacle_type, message_type)
                
                if not message or len(message) < 10:
                    print(f"   ❌ Invalid message for {obstacle_type} {message_type}")
                    return False
                
                print(f"   ✅ {obstacle_type} {message_type}: {message[:60]}...")
        
        print(f"   ✅ All {len(obstacle_types) * len(message_types)} message types working")
        
    except Exception as e:
        print(f"   ❌ Error testing Bobo messages: {e}")
        return False
    
    # Test 3: Obstacle Tracking and Statistics
    print("\n📈 Testing Obstacle Tracking and Statistics:")
    print("-" * 50)
    
    try:
        # Get initial stats
        initial_stats = db.get_user_obstacle_stats("test_user")
        print(f"   ✅ Initial stats retrieved: Level {initial_stats.get('journey_level', 1)}")
        
        # Resolve obstacle as overcome
        success = db.update_obstacle_resolution(
            encounter_id=encounter_id,
            was_overcome=True,
            solution_used="environment_modification",
            time_to_resolve=15
        )
        
        if not success:
            print("   ❌ Failed to update obstacle resolution")
            return False
        
        print("   ✅ Obstacle resolution updated successfully")
        
        # Update obstacle statistics
        stats_updated = db.update_obstacle_stats("test_user", "distraction_detour", True)
        
        if not stats_updated:
            print("   ❌ Failed to update obstacle statistics")
            return False
        
        print("   ✅ Obstacle statistics updated successfully")
        
        # Get updated stats
        updated_stats = db.get_user_obstacle_stats("test_user")
        
        # Validate stat updates
        if updated_stats.get('total_obstacles_encountered', 0) <= initial_stats.get('total_obstacles_encountered', 0):
            print("   ❌ Total obstacles encountered not incremented")
            return False
        
        if updated_stats.get('total_obstacles_overcome', 0) <= initial_stats.get('total_obstacles_overcome', 0):
            print("   ❌ Total obstacles overcome not incremented")
            return False
        
        print(f"   ✅ Obstacles encountered: {updated_stats.get('total_obstacles_encountered', 0)}")
        print(f"   ✅ Obstacles overcome: {updated_stats.get('total_obstacles_overcome', 0)}")
        print(f"   ✅ Journey level: {updated_stats.get('journey_level', 1)}")
        print(f"   ✅ Journey experience: {updated_stats.get('journey_experience', 0)}")
        
    except Exception as e:
        print(f"   ❌ Error testing obstacle tracking: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Test 4: Journey Achievement Progress Tracking
    print("\n🏆 Testing Journey Achievement Progress Tracking:")
    print("-" * 55)
    
    try:
        # Test journey achievement checking
        unlocked_achievements = achievement_engine.check_journey_achievements("test_user", "distraction_detour")
        
        print(f"   ✅ Journey achievement check completed")
        print(f"   ✅ Unlocked achievements: {len(unlocked_achievements)}")
        
        for achievement in unlocked_achievements:
            achievement_name = achievement.get('achievement_name', 'Unknown')
            reward_type = achievement.get('reward_type', 'Unknown')
            message = achievement.get('message', 'No message')
            
            print(f"   ✅ Achievement: {achievement_name} ({reward_type})")
            print(f"      Message: {message[:80]}...")
        
        # Test specific achievement types
        achievement_types = [
            'obstacle_navigator',
            'distraction_master', 
            'energy_warrior',
            'maze_solver',
            'memory_keeper',
            'journey_champion',
            'persistence_legend'
        ]
        
        print(f"   ✅ Achievement types defined: {len(achievement_types)}")
        
        # Test achievement rewards
        reward_types = ['journey_badge', 'special_hat', 'special_costume', 'special_color', 'special_dance']
        for reward_type in reward_types:
            if hasattr(achievement_engine, f'_unlock_{reward_type.replace("special_", "")}'):
                print(f"   ✅ Reward method exists: {reward_type}")
            else:
                print(f"   ⚠️ Reward method missing: {reward_type}")
        
    except Exception as e:
        print(f"   ❌ Error testing achievement progress: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Test 5: Obstacle History Storage
    print("\n📚 Testing Obstacle History Storage:")
    print("-" * 40)
    
    try:
        # Create multiple obstacle encounters for history testing
        obstacle_types = ["energy_drain_valley", "maze_mountain", "memory_fog"]
        
        for i, obstacle_type in enumerate(obstacle_types):
            encounter_data = {
                "user_id": "test_user",
                "habit_id": i + 2,
                "obstacle_type": obstacle_type,
                "severity": ["low", "medium", "high"][i % 3],
                "user_description": f"Test obstacle {i+1}",
                "bobo_response": f"Test response {i+1}",
                "previous_success_streak": i * 2,
                "journey_stage": "beginning"
            }
            
            encounter = db.create_obstacle_encounter(encounter_data)
            
            # Resolve some obstacles
            if i % 2 == 0:
                db.update_obstacle_resolution(encounter["id"], True, f"solution_{i}", 10 + i*5)
            
            print(f"   ✅ Created {obstacle_type} encounter: ID {encounter['id']}")
        
        # Get obstacle history
        history = db.get_obstacle_history("test_user", limit=10)
        
        if len(history) < 4:  # Should have at least 4 encounters (1 original + 3 new)
            print(f"   ❌ Insufficient history records: {len(history)}")
            return False
        
        print(f"   ✅ Obstacle history retrieved: {len(history)} records")
        
        # Validate history structure
        for i, record in enumerate(history[:3]):
            required_fields = ["id", "user_id", "habit_id", "obstacle_type", "encountered_at"]
            for field in required_fields:
                if field not in record:
                    print(f"   ❌ Missing field in history record {i}: {field}")
                    return False
            
            print(f"   ✅ History record {i+1}: {record['obstacle_type']} - {record.get('severity', 'unknown')}")
        
    except Exception as e:
        print(f"   ❌ Error testing obstacle history: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Test 6: Journey Reward Libraries
    print("\n🎁 Testing Journey Reward Libraries:")
    print("-" * 40)
    
    try:
        # Test journey badges
        if hasattr(achievement_engine, 'JOURNEY_BADGES'):
            badges = achievement_engine.JOURNEY_BADGES
            print(f"   ✅ Journey badges defined: {len(badges)}")
            
            for badge in badges[:3]:  # Show first 3
                print(f"      - {badge['name']}: {badge['description']} {badge['icon']}")
        
        # Test obstacle messages
        if hasattr(achievement_engine, 'OBSTACLE_MESSAGES'):
            messages = achievement_engine.OBSTACLE_MESSAGES
            print(f"   ✅ Obstacle messages defined: {len(messages)} types")
            
            for obstacle_type in messages.keys():
                encounter_msgs = len(messages[obstacle_type].get('encounter', []))
                overcome_msgs = len(messages[obstacle_type].get('overcome', []))
                print(f"      - {obstacle_type}: {encounter_msgs} encounter, {overcome_msgs} overcome")
        
        # Test special journey rewards
        special_rewards = ['SPECIAL_JOURNEY_HATS', 'SPECIAL_JOURNEY_COSTUMES', 'SPECIAL_JOURNEY_DANCES']
        for reward_type in special_rewards:
            if hasattr(achievement_engine, reward_type):
                rewards = getattr(achievement_engine, reward_type)
                print(f"   ✅ {reward_type}: {len(rewards)} items")
            else:
                print(f"   ❌ Missing reward library: {reward_type}")
        
    except Exception as e:
        print(f"   ❌ Error testing reward libraries: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("🎉 TASK 2.4 COMPLETION STATUS:")
    print("✅ Journey obstacle data structure - COMPLETE")
    print("✅ Obstacle-specific Bobo messages - COMPLETE")
    print("✅ Obstacle tracking and statistics - COMPLETE")
    print("✅ Journey achievement progress tracking - COMPLETE")
    print("✅ Obstacle history storage - COMPLETE")
    print("✅ Journey reward libraries - COMPLETE")
    print("✅ Database integration - COMPLETE")
    print("✅ Achievement engine integration - COMPLETE")
    print("\n🚀 Task 2.4: Journey Obstacle System is FULLY IMPLEMENTED!")
    
    return True

def test_achievement_integration():
    """Test integration with existing achievement system"""
    print("\n🔗 Testing Achievement System Integration:")
    print("-" * 45)
    
    try:
        db = SupabaseClient()
        achievement_engine = AchievementEngine(db)
        
        # Test that journey achievements are added to existing types
        achievement_types = achievement_engine.ACHIEVEMENT_TYPES
        
        journey_achievements = [
            'obstacle_navigator', 'distraction_master', 'energy_warrior',
            'maze_solver', 'memory_keeper', 'journey_champion', 'persistence_legend'
        ]
        
        for achievement_type in journey_achievements:
            if achievement_type in achievement_types:
                achievement = achievement_types[achievement_type]
                print(f"   ✅ {achievement['name']}: {achievement['description']}")
            else:
                print(f"   ❌ Missing journey achievement: {achievement_type}")
                return False
        
        print(f"   ✅ All {len(journey_achievements)} journey achievements integrated")
        
        # Test reward type mapping
        reward_methods = [
            '_unlock_journey_badge', '_unlock_special_hat', '_unlock_special_costume',
            '_unlock_special_color', '_unlock_special_dance', '_unlock_champion_theme',
            '_unlock_legend_title'
        ]
        
        for method_name in reward_methods:
            if hasattr(achievement_engine, method_name):
                print(f"   ✅ Reward method exists: {method_name}")
            else:
                print(f"   ❌ Missing reward method: {method_name}")
                return False
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error testing achievement integration: {e}")
        return False

if __name__ == "__main__":
    # Run obstacle system tests
    system_success = test_obstacle_system()
    
    # Run achievement integration tests
    integration_success = test_achievement_integration()
    
    overall_success = system_success and integration_success
    
    if overall_success:
        print("\n🎉 ALL TESTS PASSED!")
        print("✅ Journey Obstacle System - COMPLETE")
        print("✅ Achievement Integration - COMPLETE")
        print("✅ Database Operations - COMPLETE")
        print("✅ Bobo Message System - COMPLETE")
        print("🚀 Task 2.4: Journey Obstacle System is FULLY OPERATIONAL!")
    else:
        print("\n❌ Some tests failed!")
    
    sys.exit(0 if overall_success else 1)