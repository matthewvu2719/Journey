"""
Scheduling Agent - ML-Driven Habit Recommendations
Phase 4: AI Agents Architecture
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
from collections import defaultdict
import logging

from .base_agent import MCPAgent, AgentCapabilities, AgentTools

logger = logging.getLogger(__name__)


class SchedulingAgent(MCPAgent):
    """
    Agent specialized in ML-driven habit scheduling recommendations
    Analyzes historical completion data to suggest optimal times and conditions
    """
    
    def __init__(self):
        capabilities = [
            AgentCapabilities.RECOMMENDATIONS,
            AgentCapabilities.ANALYTICS,
            AgentCapabilities.TIME_MANAGEMENT
        ]
        
        tools = [
            AgentTools.ANALYZE_PATTERNS,
            AgentTools.GET_RECOMMENDATIONS
        ]
        
        super().__init__("ML Scheduler", capabilities, tools)
    
    async def process_request(self, request: Dict[str, Any], user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process ML-driven scheduling recommendations
        """
        try:
            text = request.get('text', '')
            
            self.add_to_history({
                'type': 'request',
                'text': text
            })
            
            # Analyze historical data and provide recommendations
            recommendations = await self._analyze_and_recommend(user_context)
            
            return self.format_response(
                self._format_recommendations_text(recommendations),
                data=recommendations
            )
                
        except Exception as e:
            logger.error(f"ML Scheduler error: {e}")
            return self.format_error(f"Failed to analyze habits: {str(e)}")
    
    async def _analyze_and_recommend(self, user_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Analyze historical completion data and generate ML-driven recommendations
        """
        habits = user_context.get('habits', [])
        completions = user_context.get('completions', [])
        
        if not habits:
            return []
        
        recommendations = []
        
        for habit in habits:
            habit_completions = [c for c in completions if c.get('habit_id') == habit.get('id')]
            
            if len(habit_completions) < 3:
                # Not enough data for ML analysis
                continue
            
            analysis = self._analyze_habit_performance(habit, habit_completions)
            
            if analysis['has_insights']:
                recommendations.append({
                    'habit_id': habit.get('id'),
                    'habit_name': habit.get('name'),
                    'insights': analysis
                })
        
        return recommendations
    
    def _analyze_habit_performance(self, habit: Dict[str, Any], completions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze completion patterns for a single habit
        """
        # Group by time of day
        time_stats = defaultdict(lambda: {'count': 0, 'mood_improvements': [], 'energy_improvements': [], 'durations': []})
        
        for completion in completions:
            time_of_day = completion.get('time_of_day', 'unknown')
            
            # Mood improvement
            mood_before = self._mood_to_score(completion.get('mood_before'))
            mood_after = self._mood_to_score(completion.get('mood_after'))
            if mood_before and mood_after:
                time_stats[time_of_day]['mood_improvements'].append(mood_after - mood_before)
            
            # Energy improvement
            energy_before = self._energy_to_score(completion.get('energy_level_before'))
            energy_after = self._energy_to_score(completion.get('energy_level_after'))
            if energy_before and energy_after:
                time_stats[time_of_day]['energy_improvements'].append(energy_after - energy_before)
            
            # Duration accuracy
            estimated = completion.get('estimated_duration')
            actual = completion.get('actual_duration')
            if estimated and actual:
                time_stats[time_of_day]['durations'].append({
                    'estimated': estimated,
                    'actual': actual,
                    'diff': actual - estimated
                })
            
            time_stats[time_of_day]['count'] += 1
        
        # Find best time of day
        best_time = None
        best_score = -999
        
        for time_of_day, stats in time_stats.items():
            if stats['count'] < 2:
                continue
            
            # Calculate average improvements
            avg_mood_improvement = sum(stats['mood_improvements']) / len(stats['mood_improvements']) if stats['mood_improvements'] else 0
            avg_energy_improvement = sum(stats['energy_improvements']) / len(stats['energy_improvements']) if stats['energy_improvements'] else 0
            
            # Combined score
            score = avg_mood_improvement + avg_energy_improvement
            
            if score > best_score:
                best_score = score
                best_time = time_of_day
        
        # Duration analysis
        all_durations = [d for stats in time_stats.values() for d in stats['durations']]
        avg_duration_diff = sum(d['diff'] for d in all_durations) / len(all_durations) if all_durations else 0
        
        # Build insights
        insights = {
            'has_insights': best_time is not None,
            'best_time_of_day': best_time,
            'best_time_score': best_score,
            'avg_mood_improvement': sum(stats['mood_improvements']) / len(stats['mood_improvements']) if time_stats[best_time]['mood_improvements'] else 0 if best_time else 0,
            'avg_energy_improvement': sum(stats['energy_improvements']) / len(stats['energy_improvements']) if time_stats[best_time]['energy_improvements'] else 0 if best_time else 0,
            'duration_accuracy': {
                'avg_diff_minutes': round(avg_duration_diff, 1),
                'tends_to': 'overestimate' if avg_duration_diff < 0 else 'underestimate' if avg_duration_diff > 0 else 'accurate'
            },
            'sample_size': len(completions)
        }
        
        return insights
    
    def _mood_to_score(self, mood: Optional[str]) -> Optional[int]:
        """Convert mood to numeric score"""
        mood_map = {'poor': 1, 'okay': 2, 'good': 3, 'great': 4}
        return mood_map.get(mood) if mood else None
    
    def _energy_to_score(self, energy: Optional[str]) -> Optional[int]:
        """Convert energy to numeric score"""
        energy_map = {'low': 1, 'medium': 2, 'high': 3}
        return energy_map.get(energy) if energy else None
    
    def _format_recommendations_text(self, recommendations: List[Dict[str, Any]]) -> str:
        """Format recommendations as readable text"""
        if not recommendations:
            return "Not enough completion data yet to provide ML-driven recommendations. Complete your habits a few more times!"
        
        text_parts = ["📊 ML-Driven Scheduling Insights:\n"]
        
        for rec in recommendations:
            habit_name = rec['habit_name']
            insights = rec['insights']
            
            text_parts.append(f"\n🎯 {habit_name}:")
            
            if insights['best_time_of_day']:
                emoji = {'morning': '🌅', 'noon': '☀️', 'afternoon': '🌤️', 'night': '🌙'}.get(insights['best_time_of_day'], '⏰')
                text_parts.append(f"  {emoji} Best time: {insights['best_time_of_day'].title()}")
                
                if insights['avg_mood_improvement'] > 0:
                    text_parts.append(f"  😊 Mood improves by {insights['avg_mood_improvement']:.1f} points")
                
                if insights['avg_energy_improvement'] > 0:
                    text_parts.append(f"  ⚡ Energy improves by {insights['avg_energy_improvement']:.1f} points")
            
            duration = insights['duration_accuracy']
            if abs(duration['avg_diff_minutes']) > 5:
                text_parts.append(f"  ⏱️ You {duration['tends_to']} duration by ~{abs(duration['avg_diff_minutes']):.0f} min")
            
            text_parts.append(f"  📈 Based on {insights['sample_size']} completions")
        
        return "\n".join(text_parts)
