"""
Feature Engineering for ML Models
Phase 5: Machine Learning Models
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging
import sys
import os

# Add parent directory to path to import success_calculator
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from success_calculator import success_calculator

logger = logging.getLogger(__name__)


class FeatureExtractor:
    """
    Extract features from habit data for ML models
    """
    
    def __init__(self):
        # Category mappings
        self.category_map = {
            'fitness': 0, 'health': 1, 'learning': 2,
            'work': 3, 'personal': 4, 'social': 5, 'other': 6
        }
        
        # Time of day mappings
        self.time_of_day_map = {
            'morning': 0, 'afternoon': 1, 'evening': 2, 'night': 3, 'any': 4
        }
        
        # Difficulty mappings
        self.difficulty_map = {
            'easy': 0, 'medium': 1, 'hard': 2
        }
    
    def extract_habit_features(self, habit: Dict[str, Any]) -> Dict[str, float]:
        """
        Extract features from a single habit
        
        Args:
            habit: Habit dictionary with properties
            
        Returns:
            Dictionary of numerical features
        """
        features = {}
        
        # Basic features
        features['frequency'] = habit.get('target_frequency', 3)
        features['duration'] = habit.get('estimated_duration', 30)
        features['priority'] = habit.get('priority', 5)
        
        # Categorical features (encoded)
        category = habit.get('category', 'other')
        features['category'] = self.category_map.get(category, 6)
        
        time_of_day = habit.get('preferred_time_of_day', 'any')
        features['time_of_day'] = self.time_of_day_map.get(time_of_day, 4)
        
        difficulty = habit.get('difficulty', 'medium')
        features['difficulty'] = self.difficulty_map.get(difficulty, 1)
        
        # Derived features
        features['weekly_minutes'] = features['frequency'] * features['duration']
        features['is_daily'] = 1.0 if features['frequency'] >= 7 else 0.0
        features['is_long'] = 1.0 if features['duration'] > 45 else 0.0
        
        # Habit type
        habit_type = habit.get('habit_type', 'big')
        features['is_atomic'] = 1.0 if habit_type == 'atomic' else 0.0
        
        return features
    
    def extract_temporal_features(self, timestamp: datetime) -> Dict[str, float]:
        """
        Extract temporal features from a timestamp
        
        Args:
            timestamp: Datetime object
            
        Returns:
            Dictionary of temporal features
        """
        features = {}
        
        # Day of week (0 = Monday, 6 = Sunday)
        features['day_of_week'] = float(timestamp.weekday())
        features['is_weekend'] = 1.0 if timestamp.weekday() >= 5 else 0.0
        
        # Hour of day
        features['hour'] = float(timestamp.hour)
        features['is_morning'] = 1.0 if 6 <= timestamp.hour < 12 else 0.0
        features['is_afternoon'] = 1.0 if 12 <= timestamp.hour < 17 else 0.0
        features['is_evening'] = 1.0 if 17 <= timestamp.hour < 22 else 0.0
        
        # Month and season
        features['month'] = float(timestamp.month)
        season = (timestamp.month % 12 + 3) // 3  # 1=Winter, 2=Spring, 3=Summer, 4=Fall
        features['season'] = float(season)
        
        return features
    
    def extract_user_features(self, user_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Extract features about the user
        
        Args:
            user_data: User information and statistics
            
        Returns:
            Dictionary of user features
        """
        features = {}
        
        # User statistics
        features['total_habits'] = float(user_data.get('total_habits', 0))
        features['active_habits'] = float(user_data.get('active_habits', 0))
        features['total_logs'] = float(user_data.get('total_logs', 0))
        
        # Success metrics
        features['overall_success_rate'] = user_data.get('overall_success_rate', 0.5)
        features['streak_days'] = float(user_data.get('current_streak', 0))
        
        # Time-based metrics
        features['avg_completion_time'] = user_data.get('avg_completion_time', 30.0)
        features['total_weekly_commitment'] = user_data.get('total_weekly_minutes', 0.0)
        
        # Engagement metrics
        features['days_since_signup'] = float(user_data.get('days_since_signup', 1))
        features['days_since_last_log'] = float(user_data.get('days_since_last_log', 0))
        
        return features
    
    def extract_log_features(self, logs: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Extract features from habit logs
        
        Args:
            logs: List of habit log entries
            
        Returns:
            Dictionary of log-based features
        """
        features = {}
        
        if not logs:
            # Default values for no logs
            features['log_count'] = 0.0
            features['success_rate'] = 0.5
            features['avg_actual_duration'] = 30.0
            features['consistency_score'] = 0.0
            return features
        
        # Basic counts
        features['log_count'] = float(len(logs))
        
        # Success rate (calculate using success calculator)
        successful_count = sum(1 for log in logs if success_calculator.calculate_success(log))
        features['success_rate'] = successful_count / len(logs) if logs else 0.5
        
        # Weighted success rate (utility-based)
        total_utility = sum(success_calculator.calculate_success_utility(log) for log in logs)
        features['weighted_success_rate'] = (total_utility / (len(logs) * 2.0)) if logs else 0.5
        
        # Average utility per completion
        features['avg_utility'] = (total_utility / len(logs)) if logs else 1.0
        
        # Duration analysis
        durations = [log.get('actual_duration', 0) for log in logs if log.get('actual_duration')]
        if durations:
            features['avg_actual_duration'] = np.mean(durations)
            features['std_actual_duration'] = np.std(durations)
            features['max_actual_duration'] = np.max(durations)
            features['min_actual_duration'] = np.min(durations)
        else:
            features['avg_actual_duration'] = 30.0
            features['std_actual_duration'] = 0.0
            features['max_actual_duration'] = 30.0
            features['min_actual_duration'] = 30.0
        
        # Consistency (how regular are the logs)
        if len(logs) > 1:
            log_dates = [datetime.fromisoformat(log['completed_at'].replace('Z', '+00:00')) 
                        for log in logs if log.get('completed_at')]
            if len(log_dates) > 1:
                log_dates.sort()
                gaps = [(log_dates[i+1] - log_dates[i]).days for i in range(len(log_dates)-1)]
                features['avg_gap_days'] = np.mean(gaps) if gaps else 7.0
                features['std_gap_days'] = np.std(gaps) if gaps else 0.0
                features['consistency_score'] = 1.0 / (1.0 + features['std_gap_days'])
            else:
                features['avg_gap_days'] = 7.0
                features['std_gap_days'] = 0.0
                features['consistency_score'] = 0.5
        else:
            features['avg_gap_days'] = 7.0
            features['std_gap_days'] = 0.0
            features['consistency_score'] = 0.5
        
        # Recent performance (last 7 logs)
        recent_logs = logs[-7:] if len(logs) > 7 else logs
        recent_successful = sum(1 for log in recent_logs if success_calculator.calculate_success(log))
        features['recent_success_rate'] = recent_successful / len(recent_logs) if recent_logs else 0.5
        
        # Recent utility (quality of recent completions)
        recent_utility = sum(success_calculator.calculate_success_utility(log) for log in recent_logs)
        features['recent_avg_utility'] = (recent_utility / len(recent_logs)) if recent_logs else 1.0
        
        return features
    
    def create_training_dataframe(self, 
                                 habits: List[Dict[str, Any]], 
                                 logs: List[Dict[str, Any]],
                                 user_data: Dict[str, Any]) -> pd.DataFrame:
        """
        Create a pandas DataFrame for model training
        
        Args:
            habits: List of habits
            logs: List of all logs
            user_data: User information
            
        Returns:
            DataFrame with all features
        """
        rows = []
        
        for habit in habits:
            # Get logs for this habit
            habit_logs = [log for log in logs if log.get('habit_id') == habit.get('id')]
            
            # Extract features
            habit_features = self.extract_habit_features(habit)
            log_features = self.extract_log_features(habit_logs)
            user_features = self.extract_user_features(user_data)
            
            # Combine all features
            row = {**habit_features, **log_features, **user_features}
            row['habit_id'] = habit.get('id')
            row['habit_name'] = habit.get('name')
            
            rows.append(row)
        
        return pd.DataFrame(rows)
    
    def normalize_features(self, df: pd.DataFrame, feature_cols: List[str]) -> pd.DataFrame:
        """
        Normalize numerical features to 0-1 range
        
        Args:
            df: DataFrame with features
            feature_cols: List of columns to normalize
            
        Returns:
            DataFrame with normalized features
        """
        df_normalized = df.copy()
        
        for col in feature_cols:
            if col in df.columns:
                min_val = df[col].min()
                max_val = df[col].max()
                
                if max_val > min_val:
                    df_normalized[col] = (df[col] - min_val) / (max_val - min_val)
                else:
                    df_normalized[col] = 0.5  # Default to middle if no variance
        
        return df_normalized


# Global instance
feature_extractor = FeatureExtractor()
