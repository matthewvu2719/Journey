"""
Machine Learning Package (Phase 5)
Advanced ML models for habit prediction and recommendation
"""
from .feature_engineering import FeatureExtractor, feature_extractor
from .duration_predictor import DurationPredictor, duration_predictor
from .difficulty_estimator import DifficultyEstimator, difficulty_estimator
from .time_budget_predictor import TimeBudgetPredictor, time_budget_predictor
from .recommendation_engine import RecommendationEngine, recommendation_engine

__all__ = [
    'FeatureExtractor',
    'feature_extractor',
    'DurationPredictor',
    'duration_predictor',
    'DifficultyEstimator',
    'difficulty_estimator',
    'TimeBudgetPredictor',
    'time_budget_predictor',
    'RecommendationEngine',
    'recommendation_engine'
]
