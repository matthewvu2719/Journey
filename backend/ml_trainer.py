"""
ML Training Service - Actively trains models from user data
Triggers training on habit completions and periodic retraining
"""
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from ml.difficulty_estimator import difficulty_estimator
from ml.duration_predictor import duration_predictor
from ml.recommendation_engine import recommendation_engine
from success_calculator import success_calculator

logger = logging.getLogger(__name__)


class MLTrainer:
    """
    Manages ML model training and retraining
    """
    
    def __init__(self, db_client):
        self.db = db_client
        self.min_samples_for_training = 10  # Minimum completions needed
        self.retrain_threshold = 5  # Retrain after N new completions
        self.last_training_time = {}  # Track last training per user
        self.completion_count_since_training = {}  # Track new data
        
        logger.info("✓ ML Trainer initialized")
    
    def on_habit_completion(self, user_id: str, completion_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Called when user completes a habit
        Decides whether to trigger model retraining
        
        Args:
            user_id: User ID
            completion_data: Completion details (mood, energy, duration, etc.)
            
        Returns:
            Training status and results
        """
        logger.info(f"📊 Processing completion for user {user_id}")
        
        # Increment completion counter
        if user_id not in self.completion_count_since_training:
            self.completion_count_since_training[user_id] = 0
        self.completion_count_since_training[user_id] += 1
        
        # Get user's total completions
        logs = self.db.get_logs(user_id=user_id)
        total_completions = len(logs)
        
        result = {
            'total_completions': total_completions,
            'new_completions_since_training': self.completion_count_since_training[user_id],
            'training_triggered': False,
            'models_trained': []
        }
        
        # Check if we should train
        should_train = self._should_train(user_id, total_completions)
        
        if should_train:
            logger.info(f"🎓 Triggering ML training for user {user_id}")
            training_results = self.train_user_models(user_id)
            result['training_triggered'] = True
            result['models_trained'] = training_results.get('models_trained', [])
            result['training_results'] = training_results
            
            # Reset counter
            self.completion_count_since_training[user_id] = 0
            self.last_training_time[user_id] = datetime.now()
        else:
            logger.info(f"⏳ Not enough data yet for training (need {self.min_samples_for_training}, have {total_completions})")
        
        return result
    
    def _should_train(self, user_id: str, total_completions: int) -> bool:
        """
        Determine if models should be trained
        
        Criteria:
        1. Minimum samples met (10+ completions)
        2. Either first training OR threshold of new completions reached
        3. Not trained too recently (at least 1 hour ago)
        """
        # Check minimum samples
        if total_completions < self.min_samples_for_training:
            return False
        
        # Check if never trained
        if user_id not in self.last_training_time:
            return True
        
        # Check if enough new completions
        new_completions = self.completion_count_since_training.get(user_id, 0)
        if new_completions < self.retrain_threshold:
            return False
        
        # Check time since last training (avoid training too frequently)
        last_training = self.last_training_time.get(user_id)
        if last_training:
            time_since_training = datetime.now() - last_training
            if time_since_training < timedelta(hours=1):
                logger.info(f"⏰ Skipping training - last trained {time_since_training.total_seconds()/60:.1f} minutes ago")
                return False
        
        return True
    
    def train_user_models(self, user_id: str) -> Dict[str, Any]:
        """
        Train all ML models for a specific user
        
        Args:
            user_id: User ID
            
        Returns:
            Training results for each model
        """
        logger.info(f"🎓 Training ML models for user {user_id}")
        
        # Fetch user data
        habits = self.db.get_habits(user_id)
        logs = self.db.get_logs(user_id=user_id)
        
        # Calculate user statistics
        user_data = self._calculate_user_stats(user_id, habits, logs)
        
        results = {
            'user_id': user_id,
            'trained_at': datetime.now().isoformat(),
            'total_habits': len(habits),
            'total_logs': len(logs),
            'models_trained': [],
            'training_metrics': {}
        }
        
        # Train Difficulty Estimator
        try:
            logger.info("Training Difficulty Estimator...")
            difficulty_metrics = difficulty_estimator.train(habits, logs, user_data)
            
            if 'error' not in difficulty_metrics:
                results['models_trained'].append('difficulty_estimator')
                results['training_metrics']['difficulty_estimator'] = difficulty_metrics
                logger.info(f"✓ Difficulty Estimator trained: {difficulty_metrics}")
            else:
                logger.warning(f"⚠️  Difficulty Estimator training skipped: {difficulty_metrics.get('error')}")
        except Exception as e:
            logger.error(f"❌ Error training Difficulty Estimator: {e}")
        
        # Train Duration Predictor
        try:
            logger.info("Training Duration Predictor...")
            duration_metrics = duration_predictor.train(habits, logs, user_data)
            
            if 'error' not in duration_metrics:
                results['models_trained'].append('duration_predictor')
                results['training_metrics']['duration_predictor'] = duration_metrics
                logger.info(f"✓ Duration Predictor trained: {duration_metrics}")
            else:
                logger.warning(f"⚠️  Duration Predictor training skipped: {duration_metrics.get('error')}")
        except Exception as e:
            logger.error(f"❌ Error training Duration Predictor: {e}")
        
        # Note: Recommendation Engine doesn't need training (uses pattern analysis)
        
        logger.info(f"✅ Training complete for user {user_id}: {len(results['models_trained'])} models trained")
        
        return results
    
    def _calculate_user_stats(self, user_id: str, habits: List[Dict], logs: List[Dict]) -> Dict[str, Any]:
        """Calculate user statistics for ML features"""
        
        # Basic counts
        total_habits = len(habits)
        active_habits = len([h for h in habits if h.get('is_active', True)])
        total_logs = len(logs)
        
        # Success rate with utility weighting
        habits_dict = {h['id']: h for h in habits}
        successful_logs = 0
        total_utility = 0.0
        
        for log in logs:
            habit = habits_dict.get(log.get('habit_id'))
            is_successful = success_calculator.calculate_success(log, habit)
            if is_successful:
                successful_logs += 1
                # Calculate utility (1.0 - 2.0)
                utility = success_calculator.calculate_success_utility(log, habit)
                total_utility += utility
        
        # Basic success rate (binary)
        overall_success_rate = successful_logs / total_logs if total_logs > 0 else 0.5
        
        # Weighted success rate (accounts for quality)
        # Normalize by dividing by max possible utility (2.0 per completion)
        weighted_success_rate = (total_utility / (total_logs * 2.0)) if total_logs > 0 else 0.5
        
        # Time commitment
        total_weekly_minutes = sum(
            h.get('estimated_duration', 30) * h.get('target_frequency', 3)
            for h in habits if h.get('is_active', True)
        )
        
        # Average completion time
        durations = [log.get('actual_duration', 0) for log in logs if log.get('actual_duration')]
        avg_completion_time = sum(durations) / len(durations) if durations else 30.0
        
        # Streak calculation (simplified)
        current_streak = self._calculate_streak(logs)
        
        # Days since signup (estimate from oldest log)
        if logs:
            oldest_log = min(logs, key=lambda x: x.get('completed_at', ''))
            try:
                oldest_date = datetime.fromisoformat(oldest_log['completed_at'].replace('Z', ''))
                days_since_signup = (datetime.now() - oldest_date).days
            except:
                days_since_signup = 1
        else:
            days_since_signup = 1
        
        # Days since last log
        if logs:
            latest_log = max(logs, key=lambda x: x.get('completed_at', ''))
            try:
                latest_date = datetime.fromisoformat(latest_log['completed_at'].replace('Z', ''))
                days_since_last_log = (datetime.now() - latest_date).days
            except:
                days_since_last_log = 0
        else:
            days_since_last_log = 999
        
        return {
            'total_habits': total_habits,
            'active_habits': active_habits,
            'total_logs': total_logs,
            'overall_success_rate': overall_success_rate,
            'weighted_success_rate': weighted_success_rate,  # Quality-adjusted rate
            'current_streak': current_streak,
            'avg_completion_time': avg_completion_time,
            'total_weekly_minutes': total_weekly_minutes,
            'days_since_signup': days_since_signup,
            'days_since_last_log': days_since_last_log
        }
    
    def _calculate_streak(self, logs: List[Dict]) -> int:
        """Calculate current streak of consecutive days with completions"""
        if not logs:
            return 0
        
        # Get unique completion dates
        dates = set()
        for log in logs:
            try:
                date = datetime.fromisoformat(log['completed_at'].replace('Z', '')).date()
                dates.add(date)
            except:
                continue
        
        if not dates:
            return 0
        
        # Sort dates
        sorted_dates = sorted(dates, reverse=True)
        
        # Count consecutive days from today
        streak = 0
        current_date = datetime.now().date()
        
        for date in sorted_dates:
            if date == current_date:
                streak += 1
                current_date -= timedelta(days=1)
            elif date == current_date:
                continue
            else:
                break
        
        return streak
    
    def check_daily_training(self, user_id: str) -> Dict[str, Any]:
        """
        Check if user needs daily retraining
        Called by a daily cron job or scheduler
        
        Args:
            user_id: User ID
            
        Returns:
            Training status
        """
        logger.info(f"🔍 Daily training check for user {user_id}")
        
        # Get completion count
        logs = self.db.get_logs(user_id=user_id)
        
        # Check if user has been inactive
        if logs:
            latest_log = max(logs, key=lambda x: x.get('completed_at', ''))
            try:
                latest_date = datetime.fromisoformat(latest_log['completed_at'].replace('Z', ''))
                days_inactive = (datetime.now() - latest_date).days
                
                if days_inactive > 7:
                    logger.info(f"⚠️  User {user_id} inactive for {days_inactive} days - skipping training")
                    return {
                        'status': 'skipped',
                        'reason': 'user_inactive',
                        'days_inactive': days_inactive
                    }
            except:
                pass
        
        # Check if enough new data since last training
        new_completions = self.completion_count_since_training.get(user_id, 0)
        
        if new_completions >= self.retrain_threshold:
            logger.info(f"🎓 Daily training triggered for user {user_id}")
            training_results = self.train_user_models(user_id)
            self.completion_count_since_training[user_id] = 0
            self.last_training_time[user_id] = datetime.now()
            
            return {
                'status': 'trained',
                'results': training_results
            }
        else:
            logger.info(f"⏳ Not enough new data for daily training ({new_completions}/{self.retrain_threshold})")
            return {
                'status': 'skipped',
                'reason': 'insufficient_new_data',
                'new_completions': new_completions,
                'threshold': self.retrain_threshold
            }
    
    def get_training_status(self, user_id: str) -> Dict[str, Any]:
        """Get current training status for a user"""
        logs = self.db.get_logs(user_id=user_id)
        
        return {
            'user_id': user_id,
            'total_completions': len(logs),
            'new_completions_since_training': self.completion_count_since_training.get(user_id, 0),
            'last_training_time': self.last_training_time.get(user_id).isoformat() if user_id in self.last_training_time else None,
            'min_samples_required': self.min_samples_for_training,
            'retrain_threshold': self.retrain_threshold,
            'models_available': {
                'difficulty_estimator': difficulty_estimator.is_trained,
                'duration_predictor': duration_predictor.is_trained
            }
        }


# Singleton instance (will be initialized in main.py)
_ml_trainer: Optional[MLTrainer] = None

def get_ml_trainer(db_client=None) -> MLTrainer:
    """Get or create ML Trainer singleton"""
    global _ml_trainer
    if _ml_trainer is None and db_client:
        _ml_trainer = MLTrainer(db_client)
    return _ml_trainer
