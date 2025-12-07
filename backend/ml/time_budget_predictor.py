"""
Time Budget Predictor - Predicts realistic weekly time capacity
Phase 5: Machine Learning Models
"""
import numpy as np
from typing import Dict, List, Any
from datetime import datetime, timedelta
import logging

from .feature_engineering import feature_extractor

logger = logging.getLogger(__name__)


class TimeBudgetPredictor:
    """
    Predicts realistic weekly time capacity and detects overload
    """
    
    def __init__(self):
        self.default_weekday_capacity = 60  # minutes per weekday
        self.default_weekend_capacity = 120  # minutes per weekend day
    
    def predict_weekly_capacity(self, user_data: Dict[str, Any], 
                               logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Predict realistic weekly time capacity
        
        Args:
            user_data: User statistics
            logs: Historical completion logs
            
        Returns:
            Capacity prediction with breakdown
        """
        # Analyze historical completion patterns
        weekday_capacity, weekend_capacity = self._analyze_historical_capacity(logs)
        
        # Calculate total weekly capacity
        total_capacity = (weekday_capacity * 5) + (weekend_capacity * 2)
        
        # Get current commitment
        current_commitment = user_data.get('total_weekly_minutes', 0)
        
        # Detect overload
        overload = current_commitment > total_capacity
        overload_percentage = ((current_commitment - total_capacity) / total_capacity * 100) if overload else 0
        
        # Generate recommendation
        if overload:
            reduction_needed = current_commitment - total_capacity
            recommendation = f"Reduce commitments by {int(reduction_needed)} minutes per week"
        elif current_commitment > total_capacity * 0.8:
            recommendation = "You're near capacity. Avoid adding more habits."
        else:
            available = total_capacity - current_commitment
            recommendation = f"You have {int(available)} minutes available per week"
        
        return {
            'weekly_capacity_minutes': int(total_capacity),
            'current_commitment_minutes': int(current_commitment),
            'available_minutes': int(max(0, total_capacity - current_commitment)),
            'overload': overload,
            'overload_percentage': round(overload_percentage, 1),
            'recommendation': recommendation,
            'breakdown': {
                'weekday_capacity_per_day': int(weekday_capacity),
                'weekend_capacity_per_day': int(weekend_capacity),
                'total_weekday_capacity': int(weekday_capacity * 5),
                'total_weekend_capacity': int(weekend_capacity * 2)
            }
        }
    
    def _analyze_historical_capacity(self, logs: List[Dict[str, Any]]) -> tuple:
        """
        Analyze historical logs to determine realistic capacity
        
        Returns:
            (weekday_capacity, weekend_capacity) in minutes per day
        """
        if not logs or len(logs) < 5:
            return self.default_weekday_capacity, self.default_weekend_capacity
        
        weekday_durations = []
        weekend_durations = []
        
        for log in logs:
            if not log.get('completed_at') or not log.get('actual_duration'):
                continue
            
            try:
                timestamp = datetime.fromisoformat(log['completed_at'].replace('Z', '+00:00'))
                duration = log['actual_duration']
                
                if timestamp.weekday() < 5:  # Weekday
                    weekday_durations.append(duration)
                else:  # Weekend
                    weekend_durations.append(duration)
            except:
                continue
        
        # Calculate average daily capacity
        weekday_capacity = np.mean(weekday_durations) if weekday_durations else self.default_weekday_capacity
        weekend_capacity = np.mean(weekend_durations) if weekend_durations else self.default_weekend_capacity
        
        # Add buffer (people can usually do 20% more than average)
        weekday_capacity *= 1.2
        weekend_capacity *= 1.2
        
        return weekday_capacity, weekend_capacity
    
    def check_habit_fits(self, habit: Dict[str, Any], current_budget: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if a new habit fits within time budget
        
        Args:
            habit: Habit to check
            current_budget: Current time budget from predict_weekly_capacity
            
        Returns:
            Fit analysis
        """
        habit_weekly_minutes = habit.get('target_frequency', 3) * habit.get('estimated_duration', 30)
        available = current_budget.get('available_minutes', 0)
        
        fits = habit_weekly_minutes <= available
        
        if fits:
            new_available = available - habit_weekly_minutes
            message = f"This habit fits! You'll have {int(new_available)} minutes left."
        else:
            overflow = habit_weekly_minutes - available
            message = f"This habit exceeds your capacity by {int(overflow)} minutes."
        
        return {
            'fits': fits,
            'habit_weekly_minutes': int(habit_weekly_minutes),
            'available_minutes': int(available),
            'message': message
        }


# Global instance
time_budget_predictor = TimeBudgetPredictor()
