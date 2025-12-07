"""
Recommendation Engine - Personalized habit suggestions
Phase 5: Machine Learning Models
"""
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

from .feature_engineering import feature_extractor

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """
    Generates personalized habit recommendations based on user patterns
    """
    
    def __init__(self):
        # Popular habits by category
        self.habit_templates = {
            'fitness': [
                {'name': 'Morning Run', 'duration': 30, 'frequency': 3, 'time': 'morning'},
                {'name': 'Evening Walk', 'duration': 20, 'frequency': 5, 'time': 'evening'},
                {'name': 'Gym Workout', 'duration': 45, 'frequency': 3, 'time': 'afternoon'},
                {'name': 'Yoga Session', 'duration': 30, 'frequency': 3, 'time': 'morning'},
            ],
            'health': [
                {'name': 'Morning Meditation', 'duration': 15, 'frequency': 7, 'time': 'morning'},
                {'name': 'Evening Stretching', 'duration': 10, 'frequency': 7, 'time': 'evening'},
                {'name': 'Hydration Check', 'duration': 2, 'frequency': 7, 'time': 'any'},
            ],
            'learning': [
                {'name': 'Reading', 'duration': 30, 'frequency': 5, 'time': 'evening'},
                {'name': 'Language Practice', 'duration': 20, 'frequency': 5, 'time': 'morning'},
                {'name': 'Online Course', 'duration': 45, 'frequency': 3, 'time': 'afternoon'},
            ],
            'personal': [
                {'name': 'Journaling', 'duration': 15, 'frequency': 7, 'time': 'evening'},
                {'name': 'Planning Tomorrow', 'duration': 10, 'frequency': 7, 'time': 'evening'},
                {'name': 'Gratitude Practice', 'duration': 5, 'frequency': 7, 'time': 'morning'},
            ]
        }
    
    def generate_recommendations(self, user_data: Dict[str, Any],
                                habits: List[Dict[str, Any]],
                                logs: List[Dict[str, Any]],
                                limit: int = 5) -> List[Dict[str, Any]]:
        """
        Generate personalized habit recommendations
        
        Args:
            user_data: User statistics
            habits: Current habits
            logs: Historical logs
            limit: Maximum recommendations to return
            
        Returns:
            List of recommended habits with reasoning
        """
        recommendations = []
        
        # Analyze user patterns
        patterns = self._analyze_user_patterns(habits, logs)
        
        # Get successful categories
        successful_categories = patterns['successful_categories']
        best_time = patterns['best_time_of_day']
        
        # Generate recommendations based on successful patterns
        for category in successful_categories[:2]:  # Top 2 categories
            if category in self.habit_templates:
                for template in self.habit_templates[category]:
                    # Skip if user already has similar habit
                    if self._has_similar_habit(template, habits):
                        continue
                    
                    # Calculate success probability
                    success_prob = self._calculate_success_probability(
                        template, patterns, user_data
                    )
                    
                    # Generate reason
                    reason = self._generate_reason(template, patterns, category)
                    
                    recommendations.append({
                        'habit_name': template['name'],
                        'category': category,
                        'suggested_frequency': template['frequency'],
                        'suggested_duration': template['duration'],
                        'suggested_time': template.get('time', best_time),
                        'success_probability': round(success_prob, 2),
                        'reason': reason,
                        'priority': success_prob
                    })
        
        # Add complementary habits
        complementary = self._suggest_complementary_habits(habits, patterns)
        recommendations.extend(complementary)
        
        # Sort by success probability and return top N
        recommendations.sort(key=lambda x: x['priority'], reverse=True)
        return recommendations[:limit]
    
    def _analyze_user_patterns(self, habits: List[Dict[str, Any]],
                               logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze user's success patterns"""
        category_success = {}
        time_success = {}
        
        for habit in habits:
            habit_logs = [log for log in logs if log.get('habit_id') == habit.get('id')]
            
            if not habit_logs:
                continue
            
            # Calculate success rate
            successful = sum(1 for log in habit_logs if log.get('is_successful', False))
            success_rate = successful / len(habit_logs)
            
            # Track by category
            category = habit.get('category', 'other')
            if category not in category_success:
                category_success[category] = []
            category_success[category].append(success_rate)
            
            # Track by time of day
            time_of_day = habit.get('preferred_time_of_day', 'any')
            if time_of_day not in time_success:
                time_success[time_of_day] = []
            time_success[time_of_day].append(success_rate)
        
        # Calculate averages
        category_avg = {cat: np.mean(rates) for cat, rates in category_success.items()}
        time_avg = {time: np.mean(rates) for time, rates in time_success.items()}
        
        # Sort by success
        successful_categories = sorted(category_avg.keys(), key=lambda x: category_avg[x], reverse=True)
        best_time = max(time_avg.keys(), key=lambda x: time_avg[x]) if time_avg else 'morning'
        
        return {
            'successful_categories': successful_categories,
            'category_success_rates': category_avg,
            'best_time_of_day': best_time,
            'time_success_rates': time_avg
        }
    
    def _has_similar_habit(self, template: Dict[str, Any], habits: List[Dict[str, Any]]) -> bool:
        """Check if user already has a similar habit"""
        template_name_lower = template['name'].lower()
        
        for habit in habits:
            habit_name_lower = habit.get('name', '').lower()
            
            # Check for keyword overlap
            template_words = set(template_name_lower.split())
            habit_words = set(habit_name_lower.split())
            
            if len(template_words & habit_words) >= 1:
                return True
        
        return False
    
    def _calculate_success_probability(self, template: Dict[str, Any],
                                      patterns: Dict[str, Any],
                                      user_data: Dict[str, Any]) -> float:
        """Calculate probability of success for a habit"""
        base_prob = 0.6
        
        # Adjust based on user's overall success rate
        overall_success = user_data.get('overall_success_rate', 0.7)
        base_prob += (overall_success - 0.7) * 0.3
        
        # Adjust based on time of day match
        if template.get('time') == patterns['best_time_of_day']:
            base_prob += 0.1
        
        # Adjust based on frequency (lower frequency = higher success)
        if template['frequency'] <= 3:
            base_prob += 0.1
        elif template['frequency'] >= 6:
            base_prob -= 0.1
        
        # Adjust based on duration (shorter = higher success)
        if template['duration'] <= 15:
            base_prob += 0.1
        elif template['duration'] >= 45:
            base_prob -= 0.1
        
        return min(0.95, max(0.3, base_prob))
    
    def _generate_reason(self, template: Dict[str, Any],
                        patterns: Dict[str, Any],
                        category: str) -> str:
        """Generate explanation for recommendation"""
        reasons = []
        
        # Category success
        if category in patterns['category_success_rates']:
            success_rate = patterns['category_success_rates'][category]
            if success_rate > 0.7:
                reasons.append(f"You're successful with {category} habits")
        
        # Time of day match
        if template.get('time') == patterns['best_time_of_day']:
            reasons.append(f"Matches your best time ({patterns['best_time_of_day']})")
        
        # Difficulty
        if template['duration'] <= 20 and template['frequency'] <= 3:
            reasons.append("Easy to start and maintain")
        
        return reasons[0] if reasons else "Popular habit that complements your routine"
    
    def _suggest_complementary_habits(self, habits: List[Dict[str, Any]],
                                     patterns: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Suggest habits that complement existing ones"""
        complementary = []
        
        # If user has exercise, suggest recovery
        has_exercise = any(h.get('category') == 'fitness' for h in habits)
        if has_exercise:
            complementary.append({
                'habit_name': 'Post-Workout Stretching',
                'category': 'health',
                'suggested_frequency': 3,
                'suggested_duration': 10,
                'suggested_time': 'afternoon',
                'success_probability': 0.75,
                'reason': 'Complements your exercise routine',
                'priority': 0.75
            })
        
        # If user has morning habits, suggest evening wind-down
        has_morning = any(h.get('preferred_time_of_day') == 'morning' for h in habits)
        if has_morning and len(habits) < 5:
            complementary.append({
                'habit_name': 'Evening Reflection',
                'category': 'personal',
                'suggested_frequency': 7,
                'suggested_duration': 5,
                'suggested_time': 'evening',
                'success_probability': 0.80,
                'reason': 'Balance your morning routine',
                'priority': 0.80
            })
        
        return complementary
    
    def suggest_rescheduling(self, habits: List[Dict[str, Any]],
                            logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Suggest rescheduling for struggling habits
        
        Returns:
            List of rescheduling suggestions
        """
        suggestions = []
        
        for habit in habits:
            habit_logs = [log for log in logs if log.get('habit_id') == habit.get('id')]
            
            if len(habit_logs) < 5:
                continue
            
            # Calculate success rate
            successful = sum(1 for log in habit_logs if log.get('is_successful', False))
            success_rate = successful / len(habit_logs)
            
            if success_rate < 0.5:  # Struggling habit
                current_time = habit.get('preferred_time_of_day', 'any')
                
                # Suggest different time
                if current_time == 'morning':
                    new_time = 'evening'
                    reason = "Try evening when you might have more energy"
                elif current_time == 'evening':
                    new_time = 'morning'
                    reason = "Morning habits often have higher success rates"
                else:
                    new_time = 'morning'
                    reason = "Set a specific time for better consistency"
                
                suggestions.append({
                    'habit_id': habit.get('id'),
                    'habit_name': habit.get('name'),
                    'current_success_rate': round(success_rate, 2),
                    'suggestion_type': 'reschedule_time',
                    'current_time': current_time,
                    'suggested_time': new_time,
                    'reason': reason
                })
        
        return suggestions


# Global instance
recommendation_engine = RecommendationEngine()
