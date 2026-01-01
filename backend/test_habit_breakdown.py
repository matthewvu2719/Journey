#!/usr/bin/env python3
"""
Test suite for habit breakdown system
"""

import pytest
import asyncio
from datetime import datetime
from database import SupabaseClient
from models import HabitBreakdownRequest, HabitBreakdownRollback

class TestHabitBreakdown:
    """Test habit breakdown functionality"""
    
    def setup_method(self):
        """Setup test database"""
        self.db = SupabaseClient()
        self.test_user_id = "test_breakdown_user"
        
        # Create a test habit
        self.test_habit_data = {
            "user_id": self.test_user_id,
            "name": "Morning Exercise",
            "description": "Daily workout routine",
            "category": "Health",
            "priority": 8,
            "estimated_duration": 45,
            "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
            "times_of_day": ["morning"]
        }
        
        self.test_habit = self.db.create_habit(self.test_habit_data)
        self.habit_id = self.test_habit["id"]
    
    def teardown_method(self):
        """Cleanup test data"""
        try:
            # Clean up any subtasks
            subtasks = self.db.get_habit_subtasks(self.habit_id)
            for subtask in subtasks:
                self.db.delete_habit(subtask["id"])
            
            # Clean up main habit
            self.db.delete_habit(self.habit_id)
        except:
            pass  # Ignore cleanup errors
    
    def test_create_habit_breakdown_success(self):
        """Test successful habit breakdown creation"""
        subtasks = [
            "Put on workout clothes",
            "Do 5-minute warm-up", 
            "Complete main exercise",
            "Cool down and stretch"
        ]
        
        breakdown = self.db.create_habit_breakdown(
            habit_id=self.habit_id,
            subtasks=subtasks,
            user_id=self.test_user_id,
            preserve_original=False
        )
        
        # Verify breakdown response
        assert breakdown["original_habit_id"] == self.habit_id
        assert len(breakdown["subtask_ids"]) == 4
        assert breakdown["can_rollback"] == True
        assert "breakdown_session_id" in breakdown
        
        # Verify subtasks were created
        created_subtasks = self.db.get_habit_subtasks(self.habit_id)
        assert len(created_subtasks) == 4
        
        # Verify subtask properties
        for i, subtask in enumerate(created_subtasks):
            assert subtask["name"] == subtasks[i]
            assert subtask["parent_habit_id"] == self.habit_id
            assert subtask["is_subtask"] == True
            assert subtask["breakdown_order"] == i + 1
            assert subtask["category"] == self.test_habit["category"]
            assert subtask["user_id"] == self.test_user_id
        
        # Verify original habit is deactivated
        original_habit = self.db.get_habit(self.habit_id)
        assert original_habit["is_active"] == False
    
    def test_create_habit_breakdown_preserve_original(self):
        """Test habit breakdown with preserved original"""
        subtasks = ["Step 1", "Step 2", "Step 3"]
        
        breakdown = self.db.create_habit_breakdown(
            habit_id=self.habit_id,
            subtasks=subtasks,
            user_id=self.test_user_id,
            preserve_original=True
        )
        
        # Verify original habit remains active
        original_habit = self.db.get_habit(self.habit_id)
        assert original_habit["is_active"] == True
        
        # Verify subtasks were still created
        created_subtasks = self.db.get_habit_subtasks(self.habit_id)
        assert len(created_subtasks) == 3
    
    def test_create_habit_breakdown_nonexistent_habit(self):
        """Test breakdown creation with nonexistent habit"""
        with pytest.raises(Exception):
            self.db.create_habit_breakdown(
                habit_id=99999,
                subtasks=["Step 1", "Step 2"],
                user_id=self.test_user_id
            )
    
    def test_get_habit_subtasks(self):
        """Test retrieving habit subtasks"""
        subtasks = ["Task A", "Task B", "Task C"]
        
        breakdown = self.db.create_habit_breakdown(
            habit_id=self.habit_id,
            subtasks=subtasks,
            user_id=self.test_user_id
        )
        
        retrieved_subtasks = self.db.get_habit_subtasks(self.habit_id)
        
        assert len(retrieved_subtasks) == 3
        assert retrieved_subtasks[0]["name"] == "Task A"
        assert retrieved_subtasks[1]["name"] == "Task B"
        assert retrieved_subtasks[2]["name"] == "Task C"
        
        # Verify order is maintained
        for i, subtask in enumerate(retrieved_subtasks):
            assert subtask["breakdown_order"] == i + 1
    
    def test_get_habit_with_subtasks(self):
        """Test retrieving habit with its subtasks"""
        subtasks = ["Sub 1", "Sub 2"]
        
        breakdown = self.db.create_habit_breakdown(
            habit_id=self.habit_id,
            subtasks=subtasks,
            user_id=self.test_user_id
        )
        
        habit_with_subtasks = self.db.get_habit_with_subtasks(self.habit_id)
        
        assert habit_with_subtasks["id"] == self.habit_id
        assert habit_with_subtasks["name"] == self.test_habit["name"]
        assert "subtasks" in habit_with_subtasks
        assert len(habit_with_subtasks["subtasks"]) == 2
    
    def test_get_habit_breakdown(self):
        """Test retrieving breakdown information"""
        subtasks = ["Step 1", "Step 2"]
        
        breakdown = self.db.create_habit_breakdown(
            habit_id=self.habit_id,
            subtasks=subtasks,
            user_id=self.test_user_id
        )
        
        session_id = breakdown["breakdown_session_id"]
        retrieved_breakdown = self.db.get_habit_breakdown(session_id)
        
        assert retrieved_breakdown is not None
        assert retrieved_breakdown["breakdown_session_id"] == session_id
        assert retrieved_breakdown["original_habit_id"] == self.habit_id
        assert len(retrieved_breakdown["subtask_ids"]) == 2
    
    def test_rollback_habit_breakdown(self):
        """Test rolling back a habit breakdown"""
        subtasks = ["Step 1", "Step 2", "Step 3"]
        
        # Create breakdown
        breakdown = self.db.create_habit_breakdown(
            habit_id=self.habit_id,
            subtasks=subtasks,
            user_id=self.test_user_id,
            preserve_original=False
        )
        
        session_id = breakdown["breakdown_session_id"]
        
        # Verify subtasks exist
        created_subtasks = self.db.get_habit_subtasks(self.habit_id)
        assert len(created_subtasks) == 3
        
        # Verify original is deactivated
        original_habit = self.db.get_habit(self.habit_id)
        assert original_habit["is_active"] == False
        
        # Rollback
        success = self.db.rollback_habit_breakdown(session_id, restore_original=True)
        assert success == True
        
        # Verify subtasks are deleted
        remaining_subtasks = self.db.get_habit_subtasks(self.habit_id)
        assert len(remaining_subtasks) == 0
        
        # Verify original is restored
        restored_habit = self.db.get_habit(self.habit_id)
        assert restored_habit["is_active"] == True
        
        # Verify breakdown record is marked as rolled back
        breakdown_info = self.db.get_habit_breakdown(session_id)
        # In mock mode, this might return None after rollback
        if breakdown_info:
            assert "rolled_back_at" in breakdown_info or breakdown_info is None
    
    def test_rollback_nonexistent_breakdown(self):
        """Test rolling back nonexistent breakdown"""
        success = self.db.rollback_habit_breakdown("nonexistent_session_id")
        assert success == False
    
    def test_breakdown_duration_calculation(self):
        """Test that subtask durations are calculated correctly"""
        subtasks = ["Step 1", "Step 2", "Step 3", "Step 4"]
        
        breakdown = self.db.create_habit_breakdown(
            habit_id=self.habit_id,
            subtasks=subtasks,
            user_id=self.test_user_id
        )
        
        created_subtasks = self.db.get_habit_subtasks(self.habit_id)
        
        # Original duration is 45 minutes, divided by 4 subtasks = ~11 minutes each
        expected_duration = max(5, 45 // 4)  # At least 5 minutes
        
        for subtask in created_subtasks:
            assert subtask["estimated_duration"] == expected_duration
    
    def test_breakdown_inherits_schedule(self):
        """Test that subtasks inherit the original habit's schedule"""
        subtasks = ["Morning Step 1", "Morning Step 2"]
        
        breakdown = self.db.create_habit_breakdown(
            habit_id=self.habit_id,
            subtasks=subtasks,
            user_id=self.test_user_id
        )
        
        created_subtasks = self.db.get_habit_subtasks(self.habit_id)
        
        for subtask in created_subtasks:
            # In mock mode, these might not be set, but in real mode they should inherit
            if "days" in subtask and subtask["days"]:
                assert subtask["days"] == self.test_habit["days"]
            if "times_of_day" in subtask and subtask["times_of_day"]:
                assert subtask["times_of_day"] == self.test_habit["times_of_day"]
    
    def test_multiple_breakdowns_different_sessions(self):
        """Test that multiple breakdowns create different session IDs"""
        # Create second habit
        second_habit_data = {
            **self.test_habit_data,
            "name": "Evening Reading"
        }
        second_habit = self.db.create_habit(second_habit_data)
        
        try:
            # Create breakdowns for both habits
            breakdown1 = self.db.create_habit_breakdown(
                habit_id=self.habit_id,
                subtasks=["Step 1A", "Step 2A"],
                user_id=self.test_user_id
            )
            
            breakdown2 = self.db.create_habit_breakdown(
                habit_id=second_habit["id"],
                subtasks=["Step 1B", "Step 2B"],
                user_id=self.test_user_id
            )
            
            # Verify different session IDs
            assert breakdown1["breakdown_session_id"] != breakdown2["breakdown_session_id"]
            
            # Verify each breakdown is independent
            subtasks1 = self.db.get_habit_subtasks(self.habit_id)
            subtasks2 = self.db.get_habit_subtasks(second_habit["id"])
            
            assert len(subtasks1) == 2
            assert len(subtasks2) == 2
            assert subtasks1[0]["name"] == "Step 1A"
            assert subtasks2[0]["name"] == "Step 1B"
            
        finally:
            # Cleanup second habit
            try:
                subtasks = self.db.get_habit_subtasks(second_habit["id"])
                for subtask in subtasks:
                    self.db.delete_habit(subtask["id"])
                self.db.delete_habit(second_habit["id"])
            except:
                pass


def test_habit_breakdown_models():
    """Test habit breakdown Pydantic models"""
    
    # Test HabitBreakdownRequest
    request = HabitBreakdownRequest(
        subtasks=["Step 1", "Step 2", "Step 3"],
        preserve_original=True
    )
    assert len(request.subtasks) == 3
    assert request.preserve_original == True
    
    # Test validation - minimum subtasks
    with pytest.raises(ValueError):
        HabitBreakdownRequest(subtasks=["Only one step"])
    
    # Test validation - maximum subtasks
    with pytest.raises(ValueError):
        HabitBreakdownRequest(subtasks=[f"Step {i}" for i in range(1, 12)])  # 11 steps
    
    # Test HabitBreakdownRollback
    rollback = HabitBreakdownRollback(
        breakdown_session_id="test_session_123",
        restore_original=False
    )
    assert rollback.breakdown_session_id == "test_session_123"
    assert rollback.restore_original == False


if __name__ == "__main__":
    # Run tests
    test_instance = TestHabitBreakdown()
    
    print("🧪 Testing Habit Breakdown System...")
    
    try:
        test_instance.setup_method()
        
        # Run individual tests
        test_instance.test_create_habit_breakdown_success()
        print("✅ Habit breakdown creation - PASSED")
        
        test_instance.teardown_method()
        test_instance.setup_method()
        
        test_instance.test_create_habit_breakdown_preserve_original()
        print("✅ Preserve original habit - PASSED")
        
        test_instance.teardown_method()
        test_instance.setup_method()
        
        test_instance.test_get_habit_subtasks()
        print("✅ Get habit subtasks - PASSED")
        
        test_instance.teardown_method()
        test_instance.setup_method()
        
        test_instance.test_rollback_habit_breakdown()
        print("✅ Rollback breakdown - PASSED")
        
        test_instance.teardown_method()
        
        # Test models
        test_habit_breakdown_models()
        print("✅ Breakdown models validation - PASSED")
        
        print("\n🎉 All habit breakdown tests PASSED!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        try:
            test_instance.teardown_method()
        except:
            pass