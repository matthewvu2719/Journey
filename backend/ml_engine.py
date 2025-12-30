"""
ML Engine for habit recommendations and pattern analysis
Enhanced with energy pattern detection and optimal scheduling
"""
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import random
import statistics


class MLEngine:
    """Machine Learning engine for habit optimization with energy pattern analysis"""
    
    def __init__(self):
        self.model_trained = False
    
    def analyze_energy_patterns(
        self,
        user_id: str,
        completion_logs: List[Dict[str, Any]],
        days_back: int = 30
    ) -> Dict[str, Any]:
        """
        Advanced energy pattern analysis from completion history
        
        Args:
            user_id: User identifier
            completion_logs: List of habit completion logs with energy data
            days_back: Number of days to analyze (default 30)
            
        Returns:
            Comprehensive energy pattern analysis
        """
        if not completion_logs:
            return self._empty_energy_analysis()
        
        # Filter recent logs
        cutoff_date = datetime.now() - timedelta(days=days_back)
        recent_logs = [
            log for log in completion_logs
            if datetime.fromisoformat(log.get('completed_at', '').replace('Z', '')) >= cutoff_date
        ]
        
        if not recent_logs:
            return self._empty_energy_analysis()
        
        # Analyze energy patterns by time of day
        time_energy_patterns = self._analyze_time_energy_correlation(recent_logs)
        
        # Analyze energy patterns by day of week
        day_energy_patterns = self._analyze_day_energy_correlation(recent_logs)
        
        # Detect energy cycles and trends
        energy_trends = self._detect_energy_trends(recent_logs)
        
        # Calculate optimal scheduling windows
        optimal_windows = self._calculate_optimal_windows(time_energy_patterns, day_energy_patterns)
        
        # Generate energy-based recommendations
        recommendations = self._generate_energy_recommendations(
            time_energy_patterns, 
            day_energy_patterns, 
            optimal_windows
        )
        
        return {
            "user_id": user_id,
            "analysis_period_days": days_back,
            "data_points": len(recent_logs),
            "time_energy_patterns": time_energy_patterns,
            "day_energy_patterns": day_energy_patterns,
            "energy_trends": energy_trends,
            "optimal_windows": optimal_windows,
            "recommendations": recommendations,
            "confidence_score": self._calculate_pattern_confidence(recent_logs),
            "generated_at": datetime.now().isoformat()
        }
    
    def generate_optimal_schedule(
        self,
        habits: List[Dict[str, Any]],
        energy_patterns: Dict[str, Any],
        user_preferences: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Generate optimal habit schedule based on energy patterns
        
        Args:
            habits: List of user habits
            energy_patterns: Energy pattern analysis results
            user_preferences: User scheduling preferences
            
        Returns:
            Optimized schedule recommendations
        """
        if not habits:
            return {"schedule": [], "message": "No habits to schedule"}
        
        optimal_windows = energy_patterns.get("optimal_windows", {})
        time_patterns = energy_patterns.get("time_energy_patterns", {})
        
        schedule_recommendations = []
        
        for habit in habits:
            # Get habit characteristics
            difficulty = habit.get("difficulty", "medium")
            duration = habit.get("estimated_duration", 15)
            priority = habit.get("priority", 5)
            current_time = habit.get("time_of_day", "flexible")
            
            # Find optimal time slot based on energy patterns
            optimal_slot = self._find_optimal_time_slot(
                habit, optimal_windows, time_patterns, user_preferences
            )
            
            # Calculate rescheduling benefit
            reschedule_benefit = self._calculate_reschedule_benefit(
                current_time, optimal_slot, time_patterns
            )
            
            recommendation = {
                "habit_id": habit["id"],
                "habit_name": habit["name"],
                "current_time": current_time,
                "recommended_time": optimal_slot["time"],
                "recommended_day_pattern": optimal_slot["days"],
                "energy_level_needed": optimal_slot["energy_level"],
                "success_probability": optimal_slot["success_rate"],
                "reschedule_benefit": reschedule_benefit,
                "reasoning": optimal_slot["reasoning"],
                "priority_score": self._calculate_priority_score(habit, optimal_slot)
            }
            
            schedule_recommendations.append(recommendation)
        
        # Sort by priority score (highest first)
        schedule_recommendations.sort(key=lambda x: x["priority_score"], reverse=True)
        
        return {
            "schedule": schedule_recommendations,
            "optimization_summary": self._generate_schedule_summary(schedule_recommendations),
            "energy_utilization": self._calculate_energy_utilization(schedule_recommendations),
            "generated_at": datetime.now().isoformat()
        }
    
    def suggest_habit_reschedule(
        self,
        habit: Dict[str, Any],
        current_struggles: List[str],
        energy_patterns: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Suggest habit rescheduling based on current struggles and energy patterns
        
        Args:
            habit: Habit to reschedule
            current_struggles: List of current friction types
            energy_patterns: User's energy pattern analysis
            
        Returns:
            Rescheduling suggestions with reasoning
        """
        optimal_windows = energy_patterns.get("optimal_windows", {})
        time_patterns = energy_patterns.get("time_energy_patterns", {})
        
        current_time = habit.get("time_of_day", "flexible")
        difficulty = habit.get("difficulty", "medium")
        
        # Analyze current time slot performance
        current_performance = self._analyze_current_time_performance(
            current_time, time_patterns
        )
        
        # Find better alternatives based on struggles
        alternatives = self._find_reschedule_alternatives(
            habit, current_struggles, optimal_windows, time_patterns
        )
        
        # Calculate impact of rescheduling
        reschedule_impact = self._calculate_reschedule_impact(
            current_performance, alternatives
        )
        
        return {
            "habit_id": habit["id"],
            "habit_name": habit["name"],
            "current_time": current_time,
            "current_performance": current_performance,
            "reschedule_options": alternatives,
            "recommended_option": alternatives[0] if alternatives else None,
            "expected_improvement": reschedule_impact,
            "confidence": energy_patterns.get("confidence_score", 0.5),
            "reasoning": self._generate_reschedule_reasoning(
                habit, current_struggles, alternatives
            )
        }
    
    def _analyze_time_energy_correlation(self, logs: List[Dict]) -> Dict[str, Any]:
        """Analyze correlation between time of day and energy levels"""
        time_energy_data = defaultdict(list)
        time_success_rates = defaultdict(list)
        
        # Map time IDs to names
        time_map = {1: "morning", 2: "noon", 3: "afternoon", 4: "night"}
        
        for log in logs:
            time_id = log.get("time_of_day_id") or log.get("time_of_day", 1)
            if isinstance(time_id, str):
                # Convert string time to ID for consistency
                time_name = time_id.lower()
                time_id = {v: k for k, v in time_map.items()}.get(time_name, 1)
            
            time_name = time_map.get(time_id, "morning")
            
            # Energy levels
            energy_before = log.get("energy_level_before", "medium")
            energy_after = log.get("energy_level_after", "medium")
            
            # Convert numeric energy to string if needed
            energy_map = {1: "low", 2: "medium", 3: "high"}
            if isinstance(energy_before, int):
                energy_before = energy_map.get(energy_before, "medium")
            if isinstance(energy_after, int):
                energy_after = energy_map.get(energy_after, "medium")
            
            time_energy_data[time_name].append({
                "energy_before": energy_before,
                "energy_after": energy_after,
                "success": log.get("is_successful", True)
            })
            
            time_success_rates[time_name].append(1 if log.get("is_successful", True) else 0)
        
        # Calculate patterns for each time period
        patterns = {}
        for time_name, data in time_energy_data.items():
            if not data:
                continue
                
            energy_before_counts = Counter([d["energy_before"] for d in data])
            energy_after_counts = Counter([d["energy_after"] for d in data])
            success_rate = statistics.mean(time_success_rates[time_name])
            
            patterns[time_name] = {
                "sample_size": len(data),
                "success_rate": round(success_rate, 3),
                "typical_energy_before": energy_before_counts.most_common(1)[0][0] if energy_before_counts else "medium",
                "typical_energy_after": energy_after_counts.most_common(1)[0][0] if energy_after_counts else "medium",
                "energy_distribution_before": dict(energy_before_counts),
                "energy_distribution_after": dict(energy_after_counts),
                "energy_gain": self._calculate_energy_gain(data)
            }
        
        return patterns
    
    def _analyze_day_energy_correlation(self, logs: List[Dict]) -> Dict[str, Any]:
        """Analyze correlation between day of week and energy patterns"""
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        day_energy_data = defaultdict(list)
        
        for log in logs:
            completed_at = log.get("completed_at", "")
            if completed_at:
                try:
                    date = datetime.fromisoformat(completed_at.replace('Z', ''))
                    day_name = day_names[date.weekday()]
                    
                    energy_before = log.get("energy_level_before", "medium")
                    if isinstance(energy_before, int):
                        energy_map = {1: "low", 2: "medium", 3: "high"}
                        energy_before = energy_map.get(energy_before, "medium")
                    
                    day_energy_data[day_name].append({
                        "energy_before": energy_before,
                        "success": log.get("is_successful", True)
                    })
                except:
                    continue
        
        # Calculate patterns for each day
        patterns = {}
        for day_name, data in day_energy_data.items():
            if not data:
                continue
                
            energy_counts = Counter([d["energy_before"] for d in data])
            success_rate = statistics.mean([1 if d["success"] else 0 for d in data])
            
            patterns[day_name] = {
                "sample_size": len(data),
                "success_rate": round(success_rate, 3),
                "typical_energy": energy_counts.most_common(1)[0][0] if energy_counts else "medium",
                "energy_distribution": dict(energy_counts)
            }
        
        return patterns
    
    def _detect_energy_trends(self, logs: List[Dict]) -> Dict[str, Any]:
        """Detect energy trends and cycles"""
        if len(logs) < 7:
            return {"trend": "insufficient_data", "message": "Need more data to detect trends"}
        
        # Sort logs by date
        sorted_logs = sorted(logs, key=lambda x: x.get("completed_at", ""))
        
        # Calculate weekly energy averages
        weekly_averages = []
        energy_map = {"low": 1, "medium": 2, "high": 3}
        
        for i in range(0, len(sorted_logs), 7):
            week_logs = sorted_logs[i:i+7]
            week_energies = []
            
            for log in week_logs:
                energy = log.get("energy_level_before", "medium")
                if isinstance(energy, int):
                    energy_val = energy
                else:
                    energy_val = energy_map.get(energy, 2)
                week_energies.append(energy_val)
            
            if week_energies:
                weekly_averages.append(statistics.mean(week_energies))
        
        if len(weekly_averages) < 2:
            return {"trend": "insufficient_data", "message": "Need more weeks of data"}
        
        # Detect trend
        if len(weekly_averages) >= 3:
            recent_avg = statistics.mean(weekly_averages[-2:])
            earlier_avg = statistics.mean(weekly_averages[:-2])
            
            if recent_avg > earlier_avg + 0.2:
                trend = "improving"
            elif recent_avg < earlier_avg - 0.2:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "stable"
        
        return {
            "trend": trend,
            "weekly_averages": weekly_averages,
            "current_level": weekly_averages[-1] if weekly_averages else 2.0,
            "trend_strength": abs(weekly_averages[-1] - weekly_averages[0]) if len(weekly_averages) > 1 else 0
        }
    
    def _calculate_optimal_windows(
        self, 
        time_patterns: Dict[str, Any], 
        day_patterns: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate optimal scheduling windows based on energy patterns"""
        
        # Find best times based on success rates
        time_success_rates = {
            time: data["success_rate"] 
            for time, data in time_patterns.items()
        }
        
        # Find best days based on success rates  
        day_success_rates = {
            day: data["success_rate"]
            for day, data in day_patterns.items()
        }
        
        # Sort by success rate
        best_times = sorted(time_success_rates.items(), key=lambda x: x[1], reverse=True)
        best_days = sorted(day_success_rates.items(), key=lambda x: x[1], reverse=True)
        
        return {
            "peak_performance_times": [time for time, rate in best_times[:2]],
            "peak_performance_days": [day for day, rate in best_days[:3]],
            "high_energy_windows": self._identify_high_energy_windows(time_patterns),
            "low_energy_periods": self._identify_low_energy_periods(time_patterns),
            "recommended_scheduling": {
                "difficult_habits": best_times[0][0] if best_times else "morning",
                "easy_habits": best_times[-1][0] if best_times else "evening",
                "medium_habits": best_times[len(best_times)//2][0] if best_times else "afternoon"
            }
        }
    
    def _identify_high_energy_windows(self, time_patterns: Dict[str, Any]) -> List[str]:
        """Identify time periods with consistently high energy"""
        high_energy_times = []
        
        for time, data in time_patterns.items():
            energy_dist = data.get("energy_distribution_before", {})
            high_energy_ratio = energy_dist.get("high", 0) / max(sum(energy_dist.values()), 1)
            
            if high_energy_ratio > 0.4:  # 40% or more high energy occurrences
                high_energy_times.append(time)
        
        return high_energy_times
    
    def _identify_low_energy_periods(self, time_patterns: Dict[str, Any]) -> List[str]:
        """Identify time periods with consistently low energy"""
        low_energy_times = []
        
        for time, data in time_patterns.items():
            energy_dist = data.get("energy_distribution_before", {})
            low_energy_ratio = energy_dist.get("low", 0) / max(sum(energy_dist.values()), 1)
            
            if low_energy_ratio > 0.4:  # 40% or more low energy occurrences
                low_energy_times.append(time)
        
        return low_energy_times
    
    def _generate_energy_recommendations(
        self,
        time_patterns: Dict[str, Any],
        day_patterns: Dict[str, Any], 
        optimal_windows: Dict[str, Any]
    ) -> List[str]:
        """Generate actionable energy-based recommendations"""
        recommendations = []
        
        # Time-based recommendations
        peak_times = optimal_windows.get("peak_performance_times", [])
        if peak_times:
            recommendations.append(
                f"Schedule your most important habits during {' or '.join(peak_times)} "
                f"when you perform best"
            )
        
        high_energy_windows = optimal_windows.get("high_energy_windows", [])
        if high_energy_windows:
            recommendations.append(
                f"You have high energy during {', '.join(high_energy_windows)} - "
                f"perfect for challenging habits"
            )
        
        low_energy_periods = optimal_windows.get("low_energy_periods", [])
        if low_energy_periods:
            recommendations.append(
                f"Avoid scheduling demanding habits during {', '.join(low_energy_periods)} "
                f"when energy is typically low"
            )
        
        # Day-based recommendations
        best_days = optimal_windows.get("peak_performance_days", [])
        if best_days:
            recommendations.append(
                f"You're most consistent on {', '.join(best_days[:2])} - "
                f"consider front-loading your week"
            )
        
        return recommendations
    
    def _calculate_pattern_confidence(self, logs: List[Dict]) -> float:
        """Calculate confidence in pattern analysis based on data quality"""
        if len(logs) < 7:
            return 0.2
        elif len(logs) < 21:
            return 0.6
        elif len(logs) < 50:
            return 0.8
        else:
            return 0.95
    
    def _find_optimal_time_slot(
        self,
        habit: Dict[str, Any],
        optimal_windows: Dict[str, Any],
        time_patterns: Dict[str, Any],
        user_preferences: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Find optimal time slot for a specific habit"""
        difficulty = habit.get("difficulty", "medium")
        duration = habit.get("estimated_duration", 15)
        
        # Get scheduling recommendations
        scheduling = optimal_windows.get("recommended_scheduling", {})
        
        if difficulty == "hard":
            recommended_time = scheduling.get("difficult_habits", "morning")
            energy_level = "high"
            reasoning = "Difficult habits need high energy and focus"
        elif difficulty == "easy":
            recommended_time = scheduling.get("easy_habits", "evening")
            energy_level = "low"
            reasoning = "Easy habits can be done with lower energy"
        else:
            recommended_time = scheduling.get("medium_habits", "afternoon")
            energy_level = "medium"
            reasoning = "Medium habits work well with moderate energy"
        
        # Get success rate for recommended time
        success_rate = time_patterns.get(recommended_time, {}).get("success_rate", 0.7)
        
        # Determine optimal days (prefer weekdays for consistency)
        peak_days = optimal_windows.get("peak_performance_days", ["Monday", "Tuesday", "Wednesday"])
        
        return {
            "time": recommended_time,
            "days": peak_days[:3],  # Top 3 days
            "energy_level": energy_level,
            "success_rate": success_rate,
            "reasoning": reasoning
        }
    
    def _calculate_reschedule_benefit(
        self,
        current_time: str,
        optimal_slot: Dict[str, Any],
        time_patterns: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate potential benefit of rescheduling"""
        if current_time == "flexible" or current_time == optimal_slot["time"]:
            return {"improvement": 0, "message": "Already optimally scheduled"}
        
        current_success_rate = time_patterns.get(current_time, {}).get("success_rate", 0.5)
        optimal_success_rate = optimal_slot["success_rate"]
        
        improvement = optimal_success_rate - current_success_rate
        
        return {
            "improvement": round(improvement * 100, 1),  # Percentage improvement
            "current_success_rate": round(current_success_rate * 100, 1),
            "optimal_success_rate": round(optimal_success_rate * 100, 1),
            "message": f"Potential {improvement*100:.1f}% improvement in success rate"
        }
    
    def _calculate_priority_score(self, habit: Dict[str, Any], optimal_slot: Dict[str, Any]) -> float:
        """Calculate priority score for scheduling recommendations"""
        base_priority = habit.get("priority", 5)
        success_rate = optimal_slot["success_rate"]
        difficulty_multiplier = {"easy": 1.0, "medium": 1.2, "hard": 1.5}.get(
            habit.get("difficulty", "medium"), 1.0
        )
        
        return base_priority * success_rate * difficulty_multiplier
    
    def _generate_schedule_summary(self, recommendations: List[Dict]) -> Dict[str, Any]:
        """Generate summary of schedule optimization"""
        total_habits = len(recommendations)
        high_benefit = len([r for r in recommendations if r["reschedule_benefit"]["improvement"] > 10])
        avg_success_rate = statistics.mean([r["success_probability"] for r in recommendations])
        
        return {
            "total_habits": total_habits,
            "high_benefit_reschedules": high_benefit,
            "average_success_probability": round(avg_success_rate, 3),
            "optimization_potential": f"{high_benefit}/{total_habits} habits could benefit from rescheduling"
        }
    
    def _calculate_energy_utilization(self, recommendations: List[Dict]) -> Dict[str, Any]:
        """Calculate how well the schedule utilizes energy patterns"""
        time_distribution = Counter([r["recommended_time"] for r in recommendations])
        energy_distribution = Counter([r["energy_level_needed"] for r in recommendations])
        
        return {
            "time_distribution": dict(time_distribution),
            "energy_distribution": dict(energy_distribution),
            "balance_score": self._calculate_balance_score(time_distribution, energy_distribution)
        }
    
    def _calculate_balance_score(self, time_dist: Counter, energy_dist: Counter) -> float:
        """Calculate how balanced the schedule is across time and energy"""
        # Prefer more even distribution across times and energy levels
        time_variance = statistics.variance(time_dist.values()) if len(time_dist) > 1 else 0
        energy_variance = statistics.variance(energy_dist.values()) if len(energy_dist) > 1 else 0
        
        # Lower variance = better balance (scale 0-1)
        balance_score = max(0, 1 - (time_variance + energy_variance) / 10)
        return round(balance_score, 3)
    
    def _analyze_current_time_performance(
        self,
        current_time: str,
        time_patterns: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze performance at current time slot"""
        if current_time == "flexible" or current_time not in time_patterns:
            return {
                "success_rate": 0.5,
                "energy_level": "unknown",
                "sample_size": 0,
                "performance": "unknown"
            }
        
        pattern = time_patterns[current_time]
        success_rate = pattern["success_rate"]
        
        if success_rate >= 0.8:
            performance = "excellent"
        elif success_rate >= 0.6:
            performance = "good"
        elif success_rate >= 0.4:
            performance = "fair"
        else:
            performance = "poor"
        
        return {
            "success_rate": success_rate,
            "energy_level": pattern["typical_energy_before"],
            "sample_size": pattern["sample_size"],
            "performance": performance
        }
    
    def _find_reschedule_alternatives(
        self,
        habit: Dict[str, Any],
        struggles: List[str],
        optimal_windows: Dict[str, Any],
        time_patterns: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Find alternative time slots based on current struggles"""
        alternatives = []
        difficulty = habit.get("difficulty", "medium")
        
        # Map struggles to time preferences
        struggle_preferences = {
            "low-energy": optimal_windows.get("high_energy_windows", ["morning"]),
            "distraction": ["morning", "night"],  # Quieter times
            "complexity": optimal_windows.get("peak_performance_times", ["morning"]),
            "forgetfulness": ["morning"]  # More routine time
        }
        
        # Get preferred times based on struggles
        preferred_times = []
        for struggle in struggles:
            preferred_times.extend(struggle_preferences.get(struggle, ["morning"]))
        
        # Remove duplicates and current time
        current_time = habit.get("time_of_day", "flexible")
        preferred_times = list(set(preferred_times))
        if current_time in preferred_times:
            preferred_times.remove(current_time)
        
        # Evaluate each alternative
        for time in preferred_times:
            if time in time_patterns:
                pattern = time_patterns[time]
                alternatives.append({
                    "time": time,
                    "success_rate": pattern["success_rate"],
                    "energy_level": pattern["typical_energy_before"],
                    "sample_size": pattern["sample_size"],
                    "addresses_struggles": [s for s in struggles if time in struggle_preferences.get(s, [])],
                    "confidence": min(pattern["sample_size"] / 10, 1.0)  # Max confidence at 10+ samples
                })
        
        # Sort by success rate and confidence
        alternatives.sort(key=lambda x: (x["success_rate"], x["confidence"]), reverse=True)
        return alternatives[:3]  # Top 3 alternatives
    
    def _calculate_reschedule_impact(
        self,
        current_performance: Dict[str, Any],
        alternatives: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calculate expected impact of rescheduling"""
        if not alternatives:
            return {"expected_improvement": 0, "confidence": 0, "recommendation": "No better alternatives found"}
        
        best_alternative = alternatives[0]
        current_rate = current_performance["success_rate"]
        new_rate = best_alternative["success_rate"]
        
        improvement = new_rate - current_rate
        confidence = best_alternative["confidence"]
        
        return {
            "expected_improvement": round(improvement * 100, 1),
            "confidence": confidence,
            "recommendation": f"Switch to {best_alternative['time']} for {improvement*100:.1f}% improvement"
        }
    
    def _generate_reschedule_reasoning(
        self,
        habit: Dict[str, Any],
        struggles: List[str],
        alternatives: List[Dict[str, Any]]
    ) -> str:
        """Generate human-readable reasoning for reschedule suggestion"""
        if not alternatives:
            return "No better time slots found based on your patterns"
        
        best_alt = alternatives[0]
        struggle_text = ", ".join(struggles)
        
        reasoning = f"Based on your struggles with {struggle_text}, "
        reasoning += f"moving to {best_alt['time']} could help because "
        
        if "low-energy" in struggles and best_alt["energy_level"] == "high":
            reasoning += "you typically have higher energy then. "
        if "distraction" in struggles and best_alt["time"] in ["morning", "night"]:
            reasoning += "it's usually a quieter, less distracting time. "
        if "complexity" in struggles and best_alt["success_rate"] > 0.7:
            reasoning += "you have a higher success rate during this time. "
        
        reasoning += f"Your success rate at {best_alt['time']} is {best_alt['success_rate']*100:.0f}%."
        
        return reasoning
    
    def _calculate_energy_gain(self, data: List[Dict]) -> float:
        """Calculate average energy gain/loss during habit completion"""
        energy_map = {"low": 1, "medium": 2, "high": 3}
        gains = []
        
        for entry in data:
            before = energy_map.get(entry["energy_before"], 2)
            after = energy_map.get(entry["energy_after"], 2)
            gains.append(after - before)
        
        return round(statistics.mean(gains), 2) if gains else 0.0
    
    def _empty_energy_analysis(self) -> Dict[str, Any]:
        """Return empty energy analysis structure"""
        return {
            "user_id": None,
            "analysis_period_days": 0,
            "data_points": 0,
            "time_energy_patterns": {},
            "day_energy_patterns": {},
            "energy_trends": {"trend": "insufficient_data"},
            "optimal_windows": {
                "peak_performance_times": ["morning"],
                "peak_performance_days": ["Monday", "Tuesday", "Wednesday"],
                "high_energy_windows": ["morning"],
                "low_energy_periods": ["night"]
            },
            "recommendations": ["Start logging habits with energy levels to get personalized insights"],
            "confidence_score": 0.0,
            "generated_at": datetime.now().isoformat()
        }
    
    def generate_recommendations(
        self,
        habits: List[Dict],
        logs: List[Dict],
        availability: List[Dict]
    ) -> Dict[str, Any]:
        """Generate ML-powered schedule recommendations (legacy method)"""
        
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
    
    def generate_recommendations(
        self,
        habits: List[Dict],
        logs: List[Dict],
        availability: List[Dict]
    ) -> Dict[str, Any]:
        """Generate ML-powered schedule recommendations (legacy method)"""
        
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
        """Analyze user patterns and provide insights (legacy method)"""
        
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
        """Find optimal time for a habit (legacy method)"""
        
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
        """Calculate confidence score based on data volume (legacy method)"""
        if len(logs) < 5:
            return 0.3
        elif len(logs) < 15:
            return 0.6
        else:
            return 0.9
    
    def _analyze_difficulty(self, habits: List[Dict], logs: List[Dict]) -> Dict[str, int]:
        """Analyze success by difficulty level (legacy method)"""
        difficulty_map = {h["id"]: h.get("difficulty", "medium") for h in habits}
        
        counts = {"easy": 0, "medium": 0, "hard": 0}
        for log in logs:
            habit_id = log.get("habit_id")
            if habit_id in difficulty_map:
                counts[difficulty_map[habit_id]] += 1
        
        return counts
    
    def _calculate_trend(self, logs: List[Dict]) -> List[Dict[str, Any]]:
        """Calculate 7-day completion trend (legacy method)"""
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
        """Calculate average completion rate (legacy method)"""
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
        """Generate actionable insights (legacy method)"""
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
        """Return empty analytics structure (legacy method)"""
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