"""
Difficulty Estimator - Predicts habit difficulty and success probability
Phase 5: Machine Learning Models
"""
import numpy as np
import joblib
import os
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import logging

try:
    from sklearn.ensemble import GradientBoostingClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, classification_report
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

from .feature_engineering import feature_extractor

logger = logging.getLogger(__name__)


class DifficultyEstimator:
    """
    Estimates habit difficulty and predicts success probability
    """
    
    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.is_trained = False
        self.model_path = model_path or "models/difficulty_estimator.joblib"
        self.feature_names = [
            'frequency', 'duration', 'category', 'time_of_day',
            'weekly_minutes', 'is_daily', 'is_long', 'is_atomic',
            'total_habits', 'total_weekly_commitment', 'overall_success_rate'
        ]
        
        # Difficulty thresholds
        self.difficulty_levels = {
            'easy': (0.0, 0.3),
            'medium': (0.3, 0.6),
            'hard': (0.6, 0.8),
            'very_hard': (0.8, 1.0)
        }
        
        self._load_model()
    
    def _load_model(self):
        """Load trained model from disk"""
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                self.is_trained = True
                logger.info(f"Loaded difficulty estimator from {self.model_path}")
            except Exception as e:
                logger.error(f"Failed to load model: {e}")
    
    def train(self, habits: List[Dict[str, Any]], logs: List[Dict[str, Any]],
              user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Train the difficulty estimation model
        
        Args:
            habits: List of habits
            logs: List of logs with success indicators
            user_data: User statistics
            
        Returns:
            Training metrics
        """
        if not SKLEARN_AVAILABLE:
            return {'error': 'sklearn not installed'}
        
        X, y = self._prepare_training_data(habits, logs, user_data)
        
        if len(X) < 10:
            return {'error': 'insufficient_data', 'samples': len(X)}
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y if len(np.unique(y)) > 1 else None
        )
        
        # Train model
        self.model = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        
        self.model.fit(X_train, y_train)
        self.is_trained = True
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        self._save_model()
        
        return {
            'accuracy': float(accuracy),
            'train_samples': len(X_train),
            'test_samples': len(X_test),
            'trained_at': datetime.now().isoformat()
        }
    
    def _prepare_training_data(self, habits: List[Dict[str, Any]],
                               logs: List[Dict[str, Any]],
                               user_data: Dict[str, Any]) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare training data"""
        X_list = []
        y_list = []
        
        for habit in habits:
            habit_logs = [log for log in logs if log.get('habit_id') == habit.get('id')]
            
            if len(habit_logs) < 3:  # Need minimum logs to assess difficulty
                continue
            
            # Calculate success rate
            successful = sum(1 for log in habit_logs if log.get('is_successful', False))
            success_rate = successful / len(habit_logs)
            
            # Extract features
            habit_features = feature_extractor.extract_habit_features(habit)
            user_features = feature_extractor.extract_user_features(user_data)
            
            features = {**habit_features, **user_features}
            feature_vector = [features.get(name, 0.0) for name in self.feature_names]
            X_list.append(feature_vector)
            
            # Label: 1 if success_rate > 0.6 (easy), 0 if <= 0.6 (hard)
            y_list.append(1 if success_rate > 0.6 else 0)
        
        return np.array(X_list), np.array(y_list)
    
    def estimate(self, habit: Dict[str, Any], user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Estimate difficulty for a habit
        
        Args:
            habit: Habit dictionary
            user_data: User statistics
            
        Returns:
            Difficulty estimation with suggestions
        """
        # Calculate rule-based difficulty score
        rule_based_score = self._calculate_rule_based_difficulty(habit, user_data)
        
        if not self.is_trained:
            return self._format_difficulty_result(
                rule_based_score, 
                confidence=0.5,
                model_trained=False
            )
        
        # Extract features
        habit_features = feature_extractor.extract_habit_features(habit)
        user_features = feature_extractor.extract_user_features(user_data)
        
        features = {**habit_features, **user_features}
        feature_vector = np.array([[features.get(name, 0.0) for name in self.feature_names]])
        
        # Predict
        prediction = self.model.predict(feature_vector)[0]
        probability = self.model.predict_proba(feature_vector)[0]
        
        # Combine rule-based and ML prediction
        ml_score = 1.0 - probability[1]  # Probability of being hard
        combined_score = 0.6 * ml_score + 0.4 * rule_based_score
        
        return self._format_difficulty_result(
            combined_score,
            confidence=0.8,
            model_trained=True
        )
    
    def _calculate_rule_based_difficulty(self, habit: Dict[str, Any], 
                                        user_data: Dict[str, Any]) -> float:
        """
        Calculate difficulty using rule-based heuristics
        
        Returns:
            Difficulty score (0-1)
        """
        score = 0.0
        
        # Frequency factor (daily is harder)
        frequency = habit.get('target_frequency', 3)
        if frequency >= 7:
            score += 0.3
        elif frequency >= 5:
            score += 0.2
        elif frequency >= 3:
            score += 0.1
        
        # Duration factor (longer is harder)
        duration = habit.get('estimated_duration', 30)
        if duration > 60:
            score += 0.3
        elif duration > 45:
            score += 0.2
        elif duration > 30:
            score += 0.1
        
        # Time of day factor
        time_of_day = habit.get('preferred_time_of_day', 'any')
        if time_of_day == 'morning':
            score += 0.05  # Morning habits slightly harder
        elif time_of_day == 'evening':
            score += 0.1  # Evening habits harder (tired)
        
        # Current load factor
        total_commitment = user_data.get('total_weekly_minutes', 0)
        if total_commitment > 600:  # > 10 hours/week
            score += 0.2
        elif total_commitment > 420:  # > 7 hours/week
            score += 0.1
        
        # User's overall success rate
        overall_success = user_data.get('overall_success_rate', 0.7)
        if overall_success < 0.5:
            score += 0.15
        elif overall_success < 0.7:
            score += 0.05
        
        return min(1.0, score)
    
    def _format_difficulty_result(self, score: float, confidence: float,
                                  model_trained: bool) -> Dict[str, Any]:
        """Format difficulty estimation result"""
        # Determine difficulty level
        difficulty_level = 'easy'
        for level, (min_score, max_score) in self.difficulty_levels.items():
            if min_score <= score < max_score:
                difficulty_level = level
                break
        
        # Calculate success probability
        success_probability = 1.0 - score
        
        # Generate suggestions
        suggestions = self._generate_suggestions(score, difficulty_level)
        
        return {
            'difficulty_score': round(score, 2),
            'difficulty_level': difficulty_level,
            'success_probability': round(success_probability, 2),
            'confidence': confidence,
            'suggestions': suggestions,
            'model_trained': model_trained
        }
    
    def _generate_suggestions(self, score: float, level: str) -> List[str]:
        """Generate suggestions to make habit easier"""
        suggestions = []
        
        if score < 0.3:
            suggestions.append("This habit looks achievable! Start now.")
        elif score < 0.6:
            suggestions.append("Consider starting with a lower frequency")
            suggestions.append("Try habit stacking with an existing routine")
        elif score < 0.8:
            suggestions.append("This might be challenging. Start with 10 minutes instead")
            suggestions.append("Reduce frequency to 2-3 times per week")
            suggestions.append("Choose your best time of day")
        else:
            suggestions.append("This habit is very ambitious. Consider:")
            suggestions.append("- Start with 5-10 minutes")
            suggestions.append("- Try once or twice per week first")
            suggestions.append("- Break it into smaller habits")
            suggestions.append("- Build up gradually over weeks")
        
        return suggestions
    
    def _save_model(self):
        """Save model to disk"""
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump(self.model, self.model_path)
            logger.info(f"Saved difficulty estimator to {self.model_path}")
        except Exception as e:
            logger.error(f"Failed to save model: {e}")


# Global instance
difficulty_estimator = DifficultyEstimator()
