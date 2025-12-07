"""
Duration Predictor - Predicts realistic habit durations
Phase 5: Machine Learning Models
"""
import numpy as np
import joblib
import os
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import logging

try:
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error, r2_score
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logging.warning("scikit-learn not available. Install with: pip install scikit-learn")

from .feature_engineering import feature_extractor

logger = logging.getLogger(__name__)


class DurationPredictor:
    """
    Predicts realistic duration for habits based on historical data
    """
    
    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.is_trained = False
        self.model_path = model_path or "models/duration_predictor.joblib"
        self.feature_names = [
            'frequency', 'duration', 'category', 'time_of_day',
            'difficulty', 'weekly_minutes', 'is_daily', 'is_long',
            'day_of_week', 'is_weekend', 'hour'
        ]
        
        # Try to load existing model
        self._load_model()
    
    def _load_model(self):
        """Load trained model from disk"""
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                self.is_trained = True
                logger.info(f"Loaded duration predictor model from {self.model_path}")
            except Exception as e:
                logger.error(f"Failed to load model: {e}")
                self.model = None
                self.is_trained = False
    
    def train(self, habits: List[Dict[str, Any]], logs: List[Dict[str, Any]], 
              user_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Train the duration prediction model
        
        Args:
            habits: List of habit dictionaries
            logs: List of log dictionaries with actual_duration
            user_data: User statistics
            
        Returns:
            Training metrics (MAE, R2 score)
        """
        if not SKLEARN_AVAILABLE:
            logger.error("scikit-learn not available")
            return {'error': 'sklearn not installed'}
        
        # Prepare training data
        X, y = self._prepare_training_data(habits, logs, user_data)
        
        if len(X) < 10:
            logger.warning("Not enough training data (need at least 10 samples)")
            return {'error': 'insufficient_data', 'samples': len(X)}
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Train model
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train, y_train)
        self.is_trained = True
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        # Save model
        self._save_model()
        
        metrics = {
            'mae': float(mae),
            'r2_score': float(r2),
            'train_samples': len(X_train),
            'test_samples': len(X_test),
            'trained_at': datetime.now().isoformat()
        }
        
        logger.info(f"Duration predictor trained: MAE={mae:.2f}, R2={r2:.3f}")
        
        return metrics
    
    def _prepare_training_data(self, habits: List[Dict[str, Any]], 
                               logs: List[Dict[str, Any]],
                               user_data: Dict[str, Any]) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare training data from habits and logs
        
        Returns:
            X: Feature matrix
            y: Target values (actual durations)
        """
        X_list = []
        y_list = []
        
        for habit in habits:
            # Get logs for this habit with actual duration
            habit_logs = [
                log for log in logs 
                if log.get('habit_id') == habit.get('id') 
                and log.get('actual_duration') is not None
            ]
            
            for log in habit_logs:
                # Extract features
                habit_features = feature_extractor.extract_habit_features(habit)
                
                # Add temporal features from log
                if log.get('completed_at'):
                    try:
                        timestamp = datetime.fromisoformat(log['completed_at'].replace('Z', '+00:00'))
                        temporal_features = feature_extractor.extract_temporal_features(timestamp)
                    except:
                        temporal_features = {
                            'day_of_week': 0.0,
                            'is_weekend': 0.0,
                            'hour': 12.0
                        }
                else:
                    temporal_features = {
                        'day_of_week': 0.0,
                        'is_weekend': 0.0,
                        'hour': 12.0
                    }
                
                # Combine features
                features = {**habit_features, **temporal_features}
                
                # Extract feature vector
                feature_vector = [features.get(name, 0.0) for name in self.feature_names]
                X_list.append(feature_vector)
                
                # Target is actual duration
                y_list.append(log['actual_duration'])
        
        return np.array(X_list), np.array(y_list)
    
    def predict(self, habit: Dict[str, Any], 
                timestamp: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Predict realistic duration for a habit
        
        Args:
            habit: Habit dictionary
            timestamp: When the habit will be performed (default: now)
            
        Returns:
            Prediction with confidence and suggestion
        """
        if not self.is_trained:
            # Fallback: return planned duration with low confidence
            planned = habit.get('estimated_duration', 30)
            return {
                'predicted_duration': planned,
                'planned_duration': planned,
                'difference': 0,
                'confidence': 0.3,
                'suggestion': 'Not enough data for accurate prediction',
                'model_trained': False
            }
        
        # Extract features
        habit_features = feature_extractor.extract_habit_features(habit)
        
        if timestamp is None:
            timestamp = datetime.now()
        temporal_features = feature_extractor.extract_temporal_features(timestamp)
        
        # Combine features
        features = {**habit_features, **temporal_features}
        feature_vector = np.array([[features.get(name, 0.0) for name in self.feature_names]])
        
        # Predict
        predicted = self.model.predict(feature_vector)[0]
        planned = habit.get('estimated_duration', 30)
        difference = predicted - planned
        
        # Calculate confidence (based on feature importance and prediction variance)
        confidence = min(0.95, 0.6 + (0.35 * (1.0 / (1.0 + abs(difference) / 10))))
        
        # Generate suggestion
        if abs(difference) < 5:
            suggestion = "Your time estimate looks accurate"
        elif difference > 0:
            suggestion = f"Consider adding {int(difference)} extra minutes"
        else:
            suggestion = f"You might finish {int(abs(difference))} minutes early"
        
        return {
            'predicted_duration': int(predicted),
            'planned_duration': planned,
            'difference': int(difference),
            'confidence': round(confidence, 2),
            'suggestion': suggestion,
            'model_trained': True
        }
    
    def batch_predict(self, habits: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Predict durations for multiple habits
        
        Args:
            habits: List of habit dictionaries
            
        Returns:
            List of predictions
        """
        return [self.predict(habit) for habit in habits]
    
    def _save_model(self):
        """Save trained model to disk"""
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump(self.model, self.model_path)
            logger.info(f"Saved duration predictor model to {self.model_path}")
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
    
    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance scores
        
        Returns:
            Dictionary of feature names and importance scores
        """
        if not self.is_trained or self.model is None:
            return {}
        
        importances = self.model.feature_importances_
        return {
            name: float(importance) 
            for name, importance in zip(self.feature_names, importances)
        }
    
    def evaluate_accuracy(self, habits: List[Dict[str, Any]], 
                         logs: List[Dict[str, Any]],
                         user_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Evaluate model accuracy on new data
        
        Returns:
            Evaluation metrics
        """
        if not self.is_trained:
            return {'error': 'model_not_trained'}
        
        X, y = self._prepare_training_data(habits, logs, user_data)
        
        if len(X) == 0:
            return {'error': 'no_data'}
        
        y_pred = self.model.predict(X)
        mae = mean_absolute_error(y, y_pred)
        r2 = r2_score(y, y_pred)
        
        # Calculate percentage within 20% of actual
        within_20_percent = np.sum(np.abs(y_pred - y) / y < 0.2) / len(y)
        
        return {
            'mae': float(mae),
            'r2_score': float(r2),
            'within_20_percent': float(within_20_percent),
            'samples': len(X)
        }


# Global instance
duration_predictor = DurationPredictor()
