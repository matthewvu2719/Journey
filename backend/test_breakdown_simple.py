#!/usr/bin/env python3
"""
Simple test for habit breakdown system
"""

import os
import sys

def test_breakdown_system():
    """Test the breakdown system in mock mode"""
    print("🧪 Testing Habit Breakdown System (Mock Mode)...")
    
    # Create a mock database client
    from database import SupabaseClient
    
    # Create instance and force mock mode
    db = SupabaseClient()
    db.client = None
    db.mock_mode = True
    db._init_mock_data()
    
    print("✓ Database initialized in mock mode")
    
    # Create a test habit
    habit_data = {
        'user_id': 'test_user',
        'name': 'Test Habit',
        'description': 'Test habit for breakdown',
        'category': 'Test',
        'priority': 5,
        'difficulty': 3,
        'estimated_duration': 30
    }
    
    habit = db.create_habit(habit_data)
    habit_id = habit['id']
    print(f"✓ Created test habit: {habit_id}")
    
    # Test breakdown creation
    subtasks = ['Step 1', 'Step 2', 'Step 3']
    breakdown = db.create_habit_breakdown(
        habit_id=habit_id,
        subtasks=subtasks,
        user_id='test_user'
    )
    
    session_id = breakdown['breakdown_session_id']
    print(f"✓ Created breakdown: {session_id}")
    
    # Verify breakdown response
    assert breakdown['original_habit_id'] == habit_id
    assert len(breakdown['subtask_ids']) == 3
    assert breakdown['can_rollback'] == True
    print("✓ Breakdown response validated")
    
    # Test getting subtasks
    subtasks_result = db.get_habit_subtasks(habit_id)
    assert len(subtasks_result) == 3
    print(f"✓ Retrieved {len(subtasks_result)} subtasks")
    
    # Verify subtask properties
    for i, subtask in enumerate(subtasks_result):
        assert subtask['name'] == subtasks[i]
        assert subtask['breakdown_order'] == i + 1
        assert subtask['estimated_duration'] == 15
        assert subtask['is_completed'] == False
    print("✓ Subtask properties validated")
    
    # Test getting breakdown info
    breakdown_info = db.get_habit_breakdown(session_id)
    assert breakdown_info is not None
    assert breakdown_info['breakdown_session_id'] == session_id
    assert breakdown_info['original_habit_id'] == habit_id
    assert len(breakdown_info['subtask_ids']) == 3
    print("✓ Breakdown info retrieved and validated")
    
    # Test getting breakdown subtasks directly
    breakdown_subtasks = db.get_breakdown_subtasks(session_id)
    assert len(breakdown_subtasks) == 3
    print("✓ Breakdown subtasks retrieved")
    
    # Test rollback
    success = db.rollback_habit_breakdown(session_id)
    assert success == True
    print("✓ Rollback successful")
    
    # Verify rollback effects
    remaining_subtasks = db.get_habit_subtasks(habit_id)
    assert len(remaining_subtasks) == 0
    print("✓ Subtasks no longer accessible after rollback")
    
    # Verify original habit is restored
    restored_habit = db.get_habit(habit_id)
    assert restored_habit['is_active'] == True
    print("✓ Original habit restored")
    
    # Verify breakdown shows as rolled back
    breakdown_info_after = db.get_habit_breakdown(session_id)
    assert breakdown_info_after['can_rollback'] == False
    print("✓ Breakdown marked as rolled back")
    
    print("\n🎉 All tests passed! The breakdown system is working correctly.")

if __name__ == "__main__":
    test_breakdown_system()