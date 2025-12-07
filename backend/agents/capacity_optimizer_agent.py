"""
Capacity Optimizer Agent - Daily Time Budget Management
Phase 4: AI Agents Architecture
"""
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import logging

from .base_agent import MCPAgent, AgentCapabilities, AgentTools

logger = logging.getLogger(__name__)


class CapacityOptimizerAgent(MCPAgent):
    """
    Agent specialized in managing daily time capacity and optimizing habit distribution
    """
    
    def __init__(self):
        capabilities = [
            AgentCapabilities.TIME_MANAGEMENT,
            AgentCapabilities.SCHEDULE_OPTIMIZATION,
            AgentCapabilities.RECOMMENDATIONS
        ]
        
        tools = [
            AgentTools.OPTIMIZE_SCHEDULE,
            AgentTools.GET_HABITS,
            AgentTools.UPDATE_HABIT
        ]
        
        super().__init__("CapacityOptimizer", capabilities, tools)
        
        # Default daily capacities (in minutes)
        self.default_capacities = {
            'Mon': 120,  # 2 hours
            'Tue': 120,
            'Wed': 120,
            'Thu': 120,
            'Fri': 120,
            'Sat': 180,  # 3 hours on weekends
            'Sun': 180
        }
    
    async def process_request(self, request: Dict[str, Any], user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process capacity optimization requests
        """
        try:
            text = request.get('text', '')
            intent = request.get('intent', 'optimize_capacity')
            
            self.add_to_history({
                'type': 'request',
                'text': text,
                'intent': intent
            })
            
            # Get user's daily capacities (or use defaults)
            daily_capacities = user_context.get('daily_capacities', self.default_capacities)
            
            # Analyze current capacity usage
            capacity_analysis = await self._analyze_capacity(user_context, daily_capacities)
            
            # Check for overload
            overloaded_days = capacity_analysis['overloaded_days']
            underutilized_days = capacity_analysis['underutilized_days']
            
            if not overloaded_days and not underutilized_days:
                return self.format_response(
                    "Your schedule looks well-balanced! All days are within capacity.",
                    suggestions=[
                        "View capacity breakdown",
                        "Add a new habit",
                        "Adjust daily capacities"
                    ],
                    metadata=capacity_analysis
                )
            
            # Generate optimization suggestions
            suggestions = await self._generate_optimization_suggestions(
                capacity_analysis, 
                user_context
            )
            
            response_text = self._format_capacity_summary(capacity_analysis, suggestions)
            
            actions = [{
                'type': 'optimize_capacity',
                'data': {
                    'analysis': capacity_analysis,
                    'suggestions': suggestions
                },
                'confirmation_required': True
            }]
            
            return self.format_response(
                content=response_text,
                actions=actions,
                suggestions=[
                    "Apply suggested changes",
                    "Show detailed breakdown",
                    "Adjust my daily capacities"
                ],
                metadata={
                    'overloaded_days': len(overloaded_days),
                    'optimization_suggestions': len(suggestions),
                    'capacity_analysis': capacity_analysis
                }
            )
            
        except Exception as e:
            logger.error(f"CapacityOptimizer error: {e}")
            return self.format_error(f"Failed to optimize capacity: {str(e)}")
    
    async def _analyze_capacity(self, user_context: Dict[str, Any], 
                               daily_capacities: Dict[str, int]) -> Dict[str, Any]:
        """
        Analyze daily capacity usage across the week
        """
        habits = user_context.get('habits', [])
        completions = user_context.get('completions', [])
        
        # Calculate commitment per day
        day_commitments = defaultdict(int)
        day_habits = defaultdict(list)
        
        for habit in habits:
            days = habit.get('days', [])
            duration = habit.get('estimated_duration', 30)
            
            for day in days:
                day_commitments[day] += duration
                day_habits[day].append({
                    'id': habit.get('id'),
                    'name': habit.get('name'),
                    'duration': duration,
                    'priority': habit.get('priority', 5)
                })
        
        # Analyze each day
        day_analysis = {}
        overloaded_days = []
        underutilized_days = []
        balanced_days = []
        
        for day in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']:
            capacity = daily_capacities.get(day, 120)
            commitment = day_commitments.get(day, 0)
            available = capacity - commitment
            utilization = (commitment / capacity * 100) if capacity > 0 else 0
            
            day_info = {
                'day': day,
                'capacity': capacity,
                'commitment': commitment,
                'available': available,
                'utilization': round(utilization, 1),
                'habits': day_habits.get(day, []),
                'habit_count': len(day_habits.get(day, []))
            }
            
            # Categorize
            if commitment > capacity:
                day_info['status'] = 'overloaded'
                day_info['overflow'] = commitment - capacity
                overloaded_days.append(day_info)
            elif utilization < 30:
                day_info['status'] = 'underutilized'
                underutilized_days.append(day_info)
            else:
                day_info['status'] = 'balanced'
                balanced_days.append(day_info)
            
            day_analysis[day] = day_info
        
        # Calculate success rates per day (from completions)
        day_success_rates = self._calculate_day_success_rates(completions, habits)
        
        return {
            'day_analysis': day_analysis,
            'overloaded_days': overloaded_days,
            'underutilized_days': underutilized_days,
            'balanced_days': balanced_days,
            'day_success_rates': day_success_rates,
            'total_weekly_capacity': sum(daily_capacities.values()),
            'total_weekly_commitment': sum(day_commitments.values())
        }
    
    def _calculate_day_success_rates(self, completions: List[Dict[str, Any]], 
                                     habits: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate success rate for each day of week"""
        day_map = {'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6}
        day_stats = defaultdict(lambda: {'total': 0, 'completed': 0})
        
        for completion in completions:
            if completion.get('day_of_week') is not None:
                day_num = completion['day_of_week']
                day_name = [k for k, v in day_map.items() if v == day_num][0] if day_num < 7 else None
                
                if day_name:
                    day_stats[day_name]['total'] += 1
                    day_stats[day_name]['completed'] += 1
        
        # Calculate rates
        success_rates = {}
        for day, stats in day_stats.items():
            success_rates[day] = stats['completed'] / stats['total'] if stats['total'] > 0 else 0.5
        
        return success_rates
    
    async def _generate_optimization_suggestions(self, 
                                                capacity_analysis: Dict[str, Any],
                                                user_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate suggestions to optimize capacity usage
        """
        suggestions = []
        overloaded = capacity_analysis['overloaded_days']
        underutilized = capacity_analysis['underutilized_days']
        day_success_rates = capacity_analysis['day_success_rates']
        
        # For each overloaded day, suggest moving habits
        for overloaded_day in overloaded:
            day_name = overloaded_day['day']
            overflow = overloaded_day['overflow']
            habits = sorted(overloaded_day['habits'], key=lambda h: h.get('priority', 5))
            
            # Find best target days (underutilized + high success rate)
            target_days = []
            for under_day in underutilized:
                target_day_name = under_day['day']
                success_rate = day_success_rates.get(target_day_name, 0.5)
                available = under_day['available']
                
                if available > 0:
                    target_days.append({
                        'day': target_day_name,
                        'available': available,
                        'success_rate': success_rate,
                        'score': available * (1 + success_rate)  # Prioritize by capacity + success
                    })
            
            target_days.sort(key=lambda x: x['score'], reverse=True)
            
            # Suggest moving lower priority habits
            for habit in habits[:2]:  # Move up to 2 habits
                if habit['duration'] <= overflow and target_days:
                    best_target = target_days[0]
                    
                    suggestions.append({
                        'type': 'move_habit',
                        'habit_id': habit['id'],
                        'habit_name': habit['name'],
                        'from_day': day_name,
                        'to_day': best_target['day'],
                        'reason': f"{day_name} is overloaded by {overflow} min. {best_target['day']} has {best_target['available']} min available",
                        'impact': f"Frees {habit['duration']} min on {day_name}",
                        'confidence': 0.8
                    })
                    
                    overflow -= habit['duration']
                    best_target['available'] -= habit['duration']
                    
                    if overflow <= 0:
                        break
        
        # Suggest balancing if habits are clustered
        day_counts = {day: info['habit_count'] for day, info in capacity_analysis['day_analysis'].items()}
        max_count = max(day_counts.values()) if day_counts else 0
        min_count = min(day_counts.values()) if day_counts else 0
        
        if max_count - min_count > 3:  # Significant imbalance
            suggestions.append({
                'type': 'balance_distribution',
                'reason': f"Habits are unevenly distributed (max {max_count} on one day, min {min_count} on another)",
                'suggestion': "Consider spreading habits more evenly across the week",
                'confidence': 0.6
            })
        
        return suggestions
    
    def _format_capacity_summary(self, 
                                capacity_analysis: Dict[str, Any],
                                suggestions: List[Dict[str, Any]]) -> str:
        """
        Format a human-readable capacity summary
        """
        overloaded = capacity_analysis['overloaded_days']
        underutilized = capacity_analysis['underutilized_days']
        
        if not overloaded and not underutilized:
            return "Your schedule is well-balanced across the week!"
        
        parts = ["📊 Weekly Capacity Analysis:\n"]
        
        if overloaded:
            parts.append(f"\n⚠️ Overloaded Days ({len(overloaded)}):")
            for day_info in overloaded:
                parts.append(
                    f"  • {day_info['day']}: {day_info['commitment']} min committed, "
                    f"{day_info['capacity']} min available (over by {day_info['overflow']} min)"
                )
        
        if underutilized:
            parts.append(f"\n✅ Available Capacity ({len(underutilized)}):")
            for day_info in underutilized[:3]:  # Show top 3
                parts.append(
                    f"  • {day_info['day']}: {day_info['available']} min free "
                    f"({day_info['utilization']}% utilized)"
                )
        
        if suggestions:
            parts.append(f"\n💡 Suggestions ({len(suggestions)}):")
            for i, sug in enumerate(suggestions[:3], 1):  # Show top 3
                if sug['type'] == 'move_habit':
                    parts.append(
                        f"  {i}. Move '{sug['habit_name']}' from {sug['from_day']} to {sug['to_day']}"
                    )
                else:
                    parts.append(f"  {i}. {sug.get('suggestion', 'Optimize distribution')}")
        
        return "\n".join(parts)
    
    async def check_new_habit_fit(self, new_habit: Dict[str, Any], 
                                  user_context: Dict[str, Any],
                                  daily_capacities: Dict[str, int]) -> Dict[str, Any]:
        """
        Check if a new habit fits within daily capacities and suggest best days
        """
        days = new_habit.get('days', [])
        duration = new_habit.get('estimated_duration', 30)
        
        # Analyze current capacity
        capacity_analysis = await self._analyze_capacity(user_context, daily_capacities)
        day_analysis = capacity_analysis['day_analysis']
        
        # Check each requested day
        fits = {}
        for day in days:
            day_info = day_analysis.get(day, {})
            available = day_info.get('available', 0)
            fits[day] = {
                'fits': duration <= available,
                'available': available,
                'after_adding': available - duration
            }
        
        all_fit = all(info['fits'] for info in fits.values())
        
        # Suggest alternative days if doesn't fit
        alternative_days = []
        if not all_fit:
            for day, day_info in day_analysis.items():
                if day not in days and day_info['available'] >= duration:
                    alternative_days.append({
                        'day': day,
                        'available': day_info['available'],
                        'utilization': day_info['utilization']
                    })
            
            alternative_days.sort(key=lambda x: x['available'], reverse=True)
        
        return {
            'fits': all_fit,
            'day_fits': fits,
            'alternative_days': alternative_days[:3],
            'recommendation': self._format_fit_recommendation(all_fit, fits, alternative_days, duration)
        }
    
    def _format_fit_recommendation(self, all_fit: bool, fits: Dict[str, Any],
                                   alternatives: List[Dict[str, Any]], duration: int) -> str:
        """Format recommendation for new habit"""
        if all_fit:
            return "✅ This habit fits perfectly in your schedule!"
        
        problem_days = [day for day, info in fits.items() if not info['fits']]
        
        msg = f"⚠️ Not enough time on {', '.join(problem_days)}. "
        
        if alternatives:
            alt_names = [alt['day'] for alt in alternatives[:2]]
            msg += f"Consider {', '.join(alt_names)} instead (more capacity available)."
        else:
            msg += "Consider reducing duration or adjusting your daily capacities."
        
        return msg


# Maintain backward compatibility
ConflictResolverAgent = CapacityOptimizerAgent
