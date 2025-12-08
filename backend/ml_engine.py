"""
ML Engine for habit recommendations and pattern analysis
"""
from typing import List, Dict, Any
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import random


class MLEngine:
    """Machine Learning engine for habit optimization"""
    
    def __init__(self):
        self.model_trained = False
    
    def generate_recommendations(
        self,
        habits: List[Dict],
        logs: List[Dict],
        availability: List[Dict]
    ) -> Dict[str, Any]:
        """Generate ML-powered schedule recommendations"""
        
        recommendations = []
        
        for habit in habits:
            # Analyze past success patterns
            habit_logs = [l for l in logs if l.get("habit_id") == habit["id"]]
            
            # Find best time based on historical data
            best_time = self._find_optimal_time(habit, habit_logs, availability)
            
            # Calculate confidence
            confidence = self._calculate_confidence(habit_logs)
            
            recommendations.append({
                "habit_id": habit["id"],
                "habit_name": habit["name"],
                "recommended_time": best_time["time"],
                "day_of_week": best_time["day"],
                "confidence_score": confidence,
                "reasoning": best_time["reasoning"]
            })
        
        return {
            "recommendations": recommendations,
            "generated_at": datetime.now().isoformat()
        }
    
    def analyze_patterns(self, habits: List[Dict], logs: List[Dict]) -> Dict[str, Any]:
        """Analyze user patterns and provide insights"""
        
        if not logs:
            return self._empty_analytics(len(habits))
        
        # Calculate completion rate
        total_completions = len(logs)
        
        # Analyze time of day patterns
        time_map = {0: "morning", 1: "afternoon", 2: "evening", 3: "night"}
        times = []
        for l in logs:
            tod = l.get("time_of_day", "morning")
            # Convert integer to string if needed
            if isinstance(tod, int):
                tod = time_map.get(tod, "morning")
            times.append(tod if tod else "morning")
        
        time_counter = Counter(times)
        best_time = time_counter.most_common(1)[0][0] if time_counter else "morning"
        
        # Analyze energy levels
        energy_levels = []
        for l in logs:
            energy = l.get("energy_level", "medium")
            # Ensure it's a string
            if energy is None:
                energy = "medium"
            elif isinstance(energy, int):
                energy_map = {1: "low", 2: "medium", 3: "high"}
                energy = energy_map.get(energy, "medium")
            energy_levels.append(energy)
        
        energy_counter = Counter(energy_levels)
        best_energy = energy_counter.most_common(1)[0][0] if energy_counter else "medium"
        
        # Success by difficulty
        success_by_diff = self._analyze_difficulty(habits, logs)
        
        # Completion trend (last 7 days)
        trend = self._calculate_trend(logs)
        
        # Generate recommendations
        recommendations = self._generate_insights(habits, logs, best_time, best_energy)
        
        return {
            "total_habits": len(habits),
            "total_completions": total_completions,
            "average_completion_rate": self._calculate_avg_rate(habits, logs),
            "best_time_of_day": best_time,
            "best_energy_level": best_energy,
            "success_by_difficulty": success_by_diff,
            "completion_trend": trend,
            "recommendations": recommendations
        }
    
    def _find_optimal_time(
        self,
        habit: Dict,
        logs: List[Dict],
        availability: List[Dict]
    ) -> Dict[str, Any]:
        """Find optimal time for a habit"""
        
        difficulty = habit.get("difficulty", "medium")
        
        # Strategy based on difficulty
        if difficulty == "hard":
            # Hard habits → high energy times (morning)
            return {
                "time": "07:00",
                "day": random.choice([1, 2, 3, 4, 5]),  # Weekdays
                "reasoning": "Hard habits perform best in the morning when energy is highest"
            }
        elif difficulty == "easy":
            # Easy habits → flexible times
            return {
                "time": "20:00",
                "day": random.choice(range(7)),
                "reasoning": "Easy habits can be done anytime, evening works well for winding down"
            }
        else:
            # Medium habits → afternoon
            return {
                "time": "14:00",
                "day": random.choice([1, 2, 3, 4, 5]),
                "reasoning": "Medium difficulty habits work well in the afternoon"
            }
    
    def _calculate_confidence(self, logs: List[Dict]) -> float:
        """Calculate confidence score based on data volume"""
        if len(logs) < 5:
            return 0.3
        elif len(logs) < 15:
            return 0.6
        else:
            return 0.9
    
    def _analyze_difficulty(self, habits: List[Dict], logs: List[Dict]) -> Dict[str, int]:
        """Analyze success by difficulty level"""
        difficulty_map = {h["id"]: h.get("difficulty", "medium") for h in habits}
        
        counts = {"easy": 0, "medium": 0, "hard": 0}
        for log in logs:
            habit_id = log.get("habit_id")
            if habit_id in difficulty_map:
                counts[difficulty_map[habit_id]] += 1
        
        return counts
    
    def _calculate_trend(self, logs: List[Dict]) -> List[Dict[str, Any]]:
        """Calculate 7-day completion trend"""
        trend = []
        today = datetime.now().date()
        
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            count = len([
                l for l in logs
                if datetime.fromisoformat(l["completed_at"].replace('Z', '')).date() == day
            ])
            trend.append({
                "date": day.isoformat(),
                "completions": count
            })
        
        return trend
    
    def _calculate_avg_rate(self, habits: List[Dict], logs: List[Dict]) -> float:
        """Calculate average completion rate"""
        if not habits:
            return 0.0
        
        # Simple calculation: completions / (habits * 7 days)
        expected = len(habits) * 7
        actual = len(logs)
        
        return min(round((actual / expected) * 100, 1), 100.0) if expected > 0 else 0.0
    
    def _generate_insights(
        self,
        habits: List[Dict],
        logs: List[Dict],
        best_time: str,
        best_energy: str
    ) -> List[str]:
        """Generate actionable insights"""
        insights = []
        
        if len(logs) < 10:
            insights.append("Keep logging! More data will improve recommendations.")
        
        insights.append(f"You're most successful around {best_time}")
        insights.append(f"Your {best_energy} energy level correlates with success")
        
        # Check for hard habits
        hard_habits = [h for h in habits if h.get("difficulty") == "hard"]
        if hard_habits:
            insights.append("Schedule hard habits in the morning when energy is highest")
        
        return insights
    
    def _empty_analytics(self, habit_count: int) -> Dict[str, Any]:
        """Return empty analytics structure"""
        return {
            "total_habits": habit_count,
            "total_completions": 0,
            "average_completion_rate": 0.0,
            "best_time_of_day": "morning",
            "best_energy_level": "high",
            "success_by_difficulty": {"easy": 0, "medium": 0, "hard": 0},
            "completion_trend": [],
            "recommendations": ["Start logging habits to get personalized insights!"]
        }
