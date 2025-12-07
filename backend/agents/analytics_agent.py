"""
Analytics Agent - Progress Analysis and Insights
Phase 4: AI Agents Architecture
"""
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging

from .base_agent import MCPAgent, AgentCapabilities, AgentTools

logger = logging.getLogger(__name__)


class AnalyticsAgent(MCPAgent):
    """
    Agent specialized in analyzing user progress and generating insights
    """
    
    def __init__(self):
        capabilities = [
            AgentCapabilities.PROGRESS_ANALYSIS,
            AgentCapabilities.PATTERN_RECOGNITION,
            AgentCapabilities.RECOMMENDATIONS,
            AgentCapabilities.INSIGHTS_GENERATION
        ]
        
        tools = [
            AgentTools.CALCULATE_STATS,
            AgentTools.IDENTIFY_PATTERNS,
            AgentTools.GENERATE_INSIGHTS,
            AgentTools.GET_HABITS
        ]
        
        super().__init__("Analytics", capabilities, tools)
    
    async def process_request(self, request: Dict[str, Any], user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process analytics and insights requests
        """
        try:
            text = request.get('text', '')
            intent = request.get('intent', 'analytics')
            
            self.add_to_history({
                'type': 'request',
                'text': text,
                'intent': intent
            })
            
            if 'progress' in text.lower() or 'how am i doing' in text.lower():
                return await self._generate_progress_report(user_context)
            elif 'insights' in text.lower() or 'suggestions' in text.lower():
                return await self._generate_insights(user_context)
            elif 'patterns' in text.lower():
                return await self._analyze_patterns(user_context)
            else:
                return await self._general_analytics(user_context)
                
        except Exception as e:
            logger.error(f"Analytics error: {e}")
            return self.format_error(f"Failed to generate analytics: {str(e)}")
    
    async def _generate_progress_report(self, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a progress report for the user
        """
        habits = user_context.get('current_habits', [])
        
        if not habits:
            return self.format_response(
                "You haven't created any habits yet. Start by adding your first habit!",
                suggestions=[
                    "Create a new habit",
                    "Import habits from schedule",
                    "Browse habit suggestions"
                ]
            )
        
        # Calculate basic stats (placeholder)
        total_habits = len(habits)
        active_habits = len([h for h in habits if h.get('is_active', True)])
        
        report = (
            f"You have {total_habits} habit{'s' if total_habits > 1 else ''}, "
            f"with {active_habits} currently active. "
            "Keep up the great work!"
        )
        
        return self.format_response(
            content=report,
            suggestions=[
                "Show detailed statistics",
                "View habit completion rates",
                "Get personalized recommendations"
            ],
            metadata={
                'total_habits': total_habits,
                'active_habits': active_habits
            }
        )
    
    async def _generate_insights(self, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate personalized insights and recommendations
        """
        insights = []
        
        # Placeholder insights
        insights.append("Your morning habits have a higher completion rate than evening ones.")
        insights.append("Consider adding buffer time between consecutive habits.")
        insights.append("You're most consistent with habits scheduled for weekdays.")
        
        response_text = "Here are some insights based on your habit data:\\n\\n"
        for i, insight in enumerate(insights, 1):
            response_text += f"{i}. {insight}\\n"
        
        return self.format_response(
            content=response_text,
            suggestions=[
                "Optimize based on insights",
                "Show more details",
                "Adjust my schedule"
            ],
            metadata={'insights': insights}
        )
    
    async def _analyze_patterns(self, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze patterns in user behavior
        """
        return self.format_response(
            "I'm analyzing your habit patterns to identify trends and opportunities for improvement.",
            suggestions=[
                "Show completion patterns",
                "Identify best times",
                "Find improvement areas"
            ]
        )
    
    async def _general_analytics(self, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Provide general analytics information
        """
        return self.format_response(
            "I can provide insights about your habits, progress, and patterns. What would you like to know?",
            suggestions=[
                "Show my progress",
                "Generate insights",
                "Analyze patterns"
            ]
        )
