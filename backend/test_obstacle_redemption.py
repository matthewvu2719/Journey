"""
Test Obstacle Achievement Redemption System
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

# Simple mock database for testing
class MockDatabase:
    def __init__(self):
        self.obstacle_tiers = {}
        self.obstacle_stats = {}
        self.bobo_items = {}
    
    def get_obstacle_achievement_tiers(self, user_id):
        return self.obstacle_tiers.get(user_id, {})
    
    def get_obstacle_achievement_tier(self, user_id, achievement_id):
        return self.obstacle_tiers.get(user_id, {}).get(achievement_id)
    
    def initialize_obstacle_achievement_tier(self, user_id, achievement_id):
        tier_goals = {
            'distraction_master': 5,
            'energy_warrior': 5,
            'maze_solver': 5,
            'memory_keeper': 5,
            'journey_champion': 25,
            'obstacle_navigator': 1
        }
        
        if user_id not in self.obstacle_tiers:
            self.obstacle_tiers[user_id] = {}
        
        self.obstacle_tiers[user_id][achievement_id] = {
            'user_id': user_id,
            'achievement_id': achievement_id,
            'current_tier': 1,
            'current_goal': tier_goals.get(achievement_id, 5),
            'is_redeemable': False,
            'times_redeemed': 0,
            'last_redeemed_at': None
        }
        return True
    
    def update_obstacle_achievement_tier(self, user_id, achievement_id, updates):
        if user_id not in self.obstacle_tiers:
            self.obstacle_tiers[user_id] = {}
        if achievement_id not in self.obstacle_tiers[user_id]:
            self.initialize_obstacle_achievement_tier(user_id, achievement_id)
        
        self.obstacle_tiers[user_id][achievement_id].update(updates)
        return True
    
    def initialize_all_obstacle_tiers(self, user_id):
        achievement_ids = [
            'distraction_master',
            'energy_warrior',
            'maze_solver',
            'memory_keeper',
            'journey_champion',
            'obstacle_navigator'
        ]
        
        for achievement_id in achievement_ids:
            self.initialize_obstacle_achievement_tier(user_id, achievement_id)
        
        return True
    
    def get_obstacle_encounter_stats(self, user_id):
        if user_id in self.obstacle_stats:
            return self.obstacle_stats[user_id]
        return self._get_default_obstacle_stats()
    
    def _get_default_obstacle_stats(self):
        return {
            'total_obstacles_encountered': 0,
            'total_obstacles_overcome': 0,
            'distraction_detours_overcome': 0,
            'energy_valleys_overcome': 0,
            'maze_mountains_overcome': 0,
            'memory_fogs_overcome': 0,
            'current_success_streak': 0,
            'longest_success_streak': 0,
            'journey_level': 1,
            'journey_experience': 0
        }
    
    def get_unlocked_bobo_items(self, user_id, item_type):
        if user_id not in self.bobo_items:
            return []
        return [item for item in self.bobo_items[user_id] if item.get('item_type') == item_type]
    
    def save_bobo_item(self, item_data):
        user_id = item_data['user_id']
        if user_id not in self.bobo_items:
            self.bobo_items[user_id] = []
        self.bobo_items[user_id].append(item_data)
        return True


from achievement_engine import AchievementEngine

def test_tier_initialization():
    """Test initializing achievement tiers"""
    print("\n=== Testing Tier Initialization ===")
    
    db = MockDatabase()
    engine = AchievementEngine(db)
    
    user_id = "test_user_123"
    
    # Initialize all tiers
    db.initialize_all_obstacle_tiers(user_id)
    
    # Get tier data
    tiers = db.get_obstacle_achievement_tiers(user_id)
    
    print(f"Initialized {len(tiers)} achievement tiers")
    for achievement_id, tier_data in tiers.items():
        print(f"  {achievement_id}: Tier {tier_data['current_tier']}, Goal {tier_data['current_goal']}")
    
    assert len(tiers) == 6, "Should have 6 achievements"
    assert tiers['distraction_master']['current_goal'] == 5
    assert tiers['journey_champion']['current_goal'] == 25
    assert tiers['obstacle_navigator']['current_goal'] == 1
    
    print("✓ Tier initialization test passed")


def test_achievement_progress():
    """Test getting achievement progress"""
    print("\n=== Testing Achievement Progress ===")
    
    db = MockDatabase()
    engine = AchievementEngine(db)
    
    user_id = "test_user_123"
    
    # Initialize tiers
    db.initialize_all_obstacle_tiers(user_id)
    
    # Mock some obstacle stats
    db.obstacle_stats[user_id] = {
        'total_obstacles_overcome': 3,
        'distraction_detours_overcome': 3,
        'energy_valleys_overcome': 1,
        'maze_mountains_overcome': 0,
        'memory_fogs_overcome': 0
    }
    
    # Get progress
    progress = engine.get_obstacle_achievement_progress(user_id)
    
    print(f"Got progress for {len(progress)} achievements")
    for achievement in progress:
        print(f"  {achievement['name']}: {achievement['current_count']}/{achievement['current_goal']} "
              f"({achievement['progress_percentage']}%) - {achievement['status']}")
    
    # Check distraction master
    distraction = next(a for a in progress if a['achievement_id'] == 'distraction_master')
    assert distraction['current_count'] == 3
    assert distraction['current_goal'] == 5
    assert distraction['progress_percentage'] == 60.0
    assert distraction['status'] == 'in_progress'
    
    print("✓ Achievement progress test passed")


def test_redemption_flow():
    """Test the full redemption flow"""
    print("\n=== Testing Redemption Flow ===")
    
    db = MockDatabase()
    engine = AchievementEngine(db)
    
    user_id = "test_user_123"
    
    # Initialize tiers
    db.initialize_all_obstacle_tiers(user_id)
    
    # Mock obstacle stats - user has reached goal
    db.obstacle_stats[user_id] = {
        'total_obstacles_overcome': 5,
        'distraction_detours_overcome': 5,
        'energy_valleys_overcome': 0,
        'maze_mountains_overcome': 0,
        'memory_fogs_overcome': 0
    }
    
    # Update redeemability
    engine.update_obstacle_achievement_redeemability(user_id)
    
    # Check if redeemable
    tier_data = db.get_obstacle_achievement_tier(user_id, 'distraction_master')
    print(f"Distraction Master tier data: {tier_data}")
    assert tier_data['is_redeemable'] == True, "Should be redeemable"
    
    # Redeem achievement
    print("\nRedeeming achievement...")
    result = engine.redeem_obstacle_achievement(user_id, 'distraction_master')
    
    print(f"Redemption result: {result}")
    assert result.get('success') == True, "Redemption should succeed"
    assert result.get('new_tier') == 2, "Should advance to tier 2"
    assert result.get('new_goal') == 50, "New goal should be 50"
    
    # Check updated tier data
    updated_tier = db.get_obstacle_achievement_tier(user_id, 'distraction_master')
    print(f"Updated tier data: {updated_tier}")
    assert updated_tier['current_tier'] == 2
    assert updated_tier['current_goal'] == 50
    assert updated_tier['is_redeemable'] == False
    assert updated_tier['times_redeemed'] == 1
    
    print("✓ Redemption flow test passed")


def test_tier_progression():
    """Test progression through all tiers"""
    print("\n=== Testing Tier Progression ===")
    
    db = MockDatabase()
    engine = AchievementEngine(db)
    
    user_id = "test_user_123"
    
    # Initialize tiers
    db.initialize_all_obstacle_tiers(user_id)
    
    # Tier 1 -> Tier 2
    print("\n--- Tier 1 -> Tier 2 ---")
    db.obstacle_stats[user_id] = {'distraction_detours_overcome': 5, 'total_obstacles_overcome': 5}
    engine.update_obstacle_achievement_redeemability(user_id)
    result1 = engine.redeem_obstacle_achievement(user_id, 'distraction_master')
    print(f"Tier 1 redemption: Tier {result1['new_tier']}, Goal {result1['new_goal']}")
    assert result1['new_tier'] == 2 and result1['new_goal'] == 50
    
    # Tier 2 -> Tier 3
    print("\n--- Tier 2 -> Tier 3 ---")
    db.obstacle_stats[user_id] = {'distraction_detours_overcome': 50, 'total_obstacles_overcome': 50}
    engine.update_obstacle_achievement_redeemability(user_id)
    result2 = engine.redeem_obstacle_achievement(user_id, 'distraction_master')
    print(f"Tier 2 redemption: Tier {result2['new_tier']}, Goal {result2['new_goal']}")
    assert result2['new_tier'] == 3 and result2['new_goal'] == 500
    
    # Tier 3 completion
    print("\n--- Tier 3 Completion ---")
    db.obstacle_stats[user_id] = {'distraction_detours_overcome': 500, 'total_obstacles_overcome': 500}
    engine.update_obstacle_achievement_redeemability(user_id)
    result3 = engine.redeem_obstacle_achievement(user_id, 'distraction_master')
    print(f"Tier 3 redemption: Tier {result3['new_tier']}, Goal {result3['new_goal']}")
    assert result3['new_tier'] == 3  # Stays at tier 3
    
    # Check final state
    final_tier = db.get_obstacle_achievement_tier(user_id, 'distraction_master')
    print(f"Final tier data: {final_tier}")
    assert final_tier['times_redeemed'] == 3
    
    print("✓ Tier progression test passed")


def test_obstacle_navigator_one_time():
    """Test Obstacle Navigator one-time achievement"""
    print("\n=== Testing Obstacle Navigator (One-Time) ===")
    
    db = MockDatabase()
    engine = AchievementEngine(db)
    
    user_id = "test_user_123"
    
    # Initialize tiers
    db.initialize_all_obstacle_tiers(user_id)
    
    # User overcomes first obstacle
    db.obstacle_stats[user_id] = {'total_obstacles_overcome': 1}
    engine.update_obstacle_achievement_redeemability(user_id)
    
    # Redeem
    result = engine.redeem_obstacle_achievement(user_id, 'obstacle_navigator')
    print(f"Redemption result: {result}")
    
    # Check it doesn't tier up
    tier_data = db.get_obstacle_achievement_tier(user_id, 'obstacle_navigator')
    print(f"Tier data after redemption: {tier_data}")
    assert tier_data['current_tier'] == 1, "Should stay at tier 1"
    assert tier_data['current_goal'] == 1, "Goal should stay at 1"
    assert tier_data['times_redeemed'] == 1
    
    # Try to redeem again (should fail)
    db.obstacle_stats[user_id] = {'total_obstacles_overcome': 5}
    engine.update_obstacle_achievement_redeemability(user_id)
    
    tier_data = db.get_obstacle_achievement_tier(user_id, 'obstacle_navigator')
    print(f"Tier data after more obstacles: {tier_data}")
    assert tier_data['is_redeemable'] == False, "Should not be redeemable again"
    
    print("✓ Obstacle Navigator one-time test passed")


def test_error_cases():
    """Test error handling"""
    print("\n=== Testing Error Cases ===")
    
    db = MockDatabase()
    engine = AchievementEngine(db)
    
    user_id = "test_user_123"
    
    # Initialize tiers
    db.initialize_all_obstacle_tiers(user_id)
    
    # Try to redeem when not redeemable
    print("\n--- Redeeming when not ready ---")
    result = engine.redeem_obstacle_achievement(user_id, 'distraction_master')
    print(f"Result: {result}")
    assert 'error' in result, "Should return error"
    
    # Try invalid achievement ID
    print("\n--- Invalid achievement ID ---")
    result = engine.redeem_obstacle_achievement(user_id, 'invalid_achievement')
    print(f"Result: {result}")
    assert 'error' in result, "Should return error"
    
    print("✓ Error cases test passed")


if __name__ == "__main__":
    print("=" * 60)
    print("OBSTACLE ACHIEVEMENT REDEMPTION SYSTEM TESTS")
    print("=" * 60)
    
    try:
        test_tier_initialization()
        test_achievement_progress()
        test_redemption_flow()
        test_tier_progression()
        test_obstacle_navigator_one_time()
        test_error_cases()
        
        print("\n" + "=" * 60)
        print("✓ ALL TESTS PASSED!")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
