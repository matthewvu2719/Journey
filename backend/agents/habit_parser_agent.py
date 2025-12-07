"""
Habit Parser Agent - Natural Language Processing for Habit Creation
Phase 4: AI Agents Architecture
"""
import re
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

from .base_agent import MCPAgent, AgentCapabilities, AgentTools

logger = logging.getLogger(__name__)


class HabitParserAgent(MCPAgent):
    """
    Agent specialized in parsing natural language to create habits and understand user intent
    """
    
    def __init__(self):
        capabilities = [
            AgentCapabilities.HABIT_PARSING,
            AgentCapabilities.INTENT_RECOGNITION,
            AgentCapabilities.TEXT_ANALYSIS,
            AgentCapabilities.CONVERSATION
        ]
        
        tools = [
            AgentTools.ANALYZE_TEXT,
            AgentTools.EXTRACT_INTENT,
            AgentTools.CREATE_HABIT,
            AgentTools.GENERATE_RESPONSE
        ]
        
        super().__init__("HabitParser", capabilities, tools)
        
        # Frequency patterns
        self.frequency_patterns = {
            r'daily|every day|each day': {'type': 'daily', 'count': 1},
            r'(\d+)\s*times?\s*(?:a|per)\s*week': {'type': 'weekly', 'extract_count': True},
            r'(\d+)\s*times?\s*(?:a|per)\s*day': {'type': 'daily', 'extract_count': True},
            r'weekly|once\s*(?:a|per)\s*week': {'type': 'weekly', 'count': 1},
            r'twice\s*(?:a|per)\s*week': {'type': 'weekly', 'count': 2},
            r'three\s*times\s*(?:a|per)\s*week': {'type': 'weekly', 'count': 3},
            r'weekdays?|monday\s*to\s*friday': {'type': 'weekdays', 'count': 5},
            r'weekends?|saturday\s*and\s*sunday': {'type': 'weekends', 'count': 2}
        }
        
        # Duration patterns
        self.duration_patterns = {
            r'(\d+)\s*minutes?': 'minutes',
            r'(\d+)\s*hours?': 'hours',
            r'(\d+)\s*mins?': 'minutes',
            r'(\d+)\s*hrs?': 'hours',
            r'half\s*an?\s*hour|30\s*minutes?': {'value': 30, 'unit': 'minutes'},
            r'an?\s*hour': {'value': 1, 'unit': 'hours'},
            r'quarter\s*hour|15\s*minutes?': {'value': 15, 'unit': 'minutes'}
        }
        
        # Time preference patterns
        self.time_patterns = {
            r'morning|am|early': 'morning',
            r'afternoon|pm|midday|noon': 'afternoon',
            r'evening|night|late': 'evening',
            r'after\s*work|end\s*of\s*day': 'evening',
            r'before\s*work|start\s*of\s*day': 'morning',
            r'lunch\s*time|lunch\s*break': 'afternoon'
        }
        
        # Activity categories
        self.activity_categories = {
            'exercise': ['run', 'jog', 'gym', 'workout', 'exercise', 'fitness', 'yoga', 'pilates', 'swim', 'bike', 'walk'],
            'health': ['meditate', 'meditation', 'sleep', 'water', 'vitamins', 'stretch', 'breathe'],
            'learning': ['read', 'study', 'learn', 'practice', 'course', 'book', 'language'],
            'work': ['code', 'write', 'email', 'meeting', 'project', 'task', 'review'],
            'personal': ['journal', 'diary', 'call', 'family', 'friends', 'hobby', 'music']
        }

    async def process_request(self, request: Dict[str, Any], user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process natural language request to create habits or understand intent
        """
        try:
            text = request.get('text', '')
            intent = request.get('intent', 'conversation')
            
            self.add_to_history({
                'type': 'request',
                'text': text,
                'intent': intent
            })
            
            if intent == 'create_habit':
                return await self._parse_habit_creation(text, user_context)
            elif intent == 'conversation':
                return await self._handle_conversation(text, user_context)
            else:
                return await self._analyze_general_text(text, user_context)
                
        except Exception as e:
            logger.error(f"HabitParser error: {e}")
            return self.format_error(f"Failed to process request: {str(e)}")
    
    async def _parse_habit_creation(self, text: str, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse natural language text to extract habit parameters
        """
        # Extract habit components
        activity = self._extract_activity(text)
        frequency = self._extract_frequency(text)
        duration = self._extract_duration(text)
        time_preference = self._extract_time_preference(text)
        category = self._determine_category(activity)
        
        # Create habit data structure
        habit_data = {
            'name': activity or 'New Habit',
            'description': text,
            'category': category,
            'frequency_type': frequency.get('type', 'weekly'),
            'frequency_count': frequency.get('count', 1),
            'estimated_duration': duration.get('minutes', 30),
            'time_of_day': time_preference,
            'priority': 5,
            'is_active': True
        }
        
        # Generate response
        response_text = self._generate_habit_confirmation(habit_data, text)
        
        actions = [{
            'type': 'create_habit',
            'data': habit_data,
            'confirmation_required': True
        }]
        
        suggestions = [
            "Would you like to adjust the frequency or duration?",
            "Should I schedule this habit at specific times?",
            "Would you like to set reminders for this habit?"
        ]
        
        return self.format_response(
            content=response_text,
            actions=actions,
            suggestions=suggestions,
            metadata={
                'parsed_components': {
                    'activity': activity,
                    'frequency': frequency,
                    'duration': duration,
                    'time_preference': time_preference,
                    'category': category
                }
            }
        )

    def _extract_activity(self, text: str) -> str:
        """Extract the main activity/habit name from text"""
        text_lower = text.lower()
        
        # Look for common activity verbs
        activity_verbs = ['run', 'exercise', 'meditate', 'read', 'write', 'study', 'practice', 'work out', 'go to gym']
        
        for verb in activity_verbs:
            if verb in text_lower:
                pattern = rf'\b{re.escape(verb)}\b[\w\s]*'
                match = re.search(pattern, text_lower)
                if match:
                    activity = match.group().strip()
                    return ' '.join(word.capitalize() for word in activity.split())
        
        # Fallback: look for "I want to [activity]"
        want_pattern = r'i\s+want\s+to\s+([\w\s]+?)(?:\s+\d+|\s+for|\s+in|\s+at|$)'
        match = re.search(want_pattern, text_lower)
        if match:
            activity = match.group(1).strip()
            return ' '.join(word.capitalize() for word in activity.split())
        
        return "New Habit"
    
    def _extract_frequency(self, text: str) -> Dict[str, Any]:
        """Extract frequency information from text"""
        text_lower = text.lower()
        
        for pattern, freq_data in self.frequency_patterns.items():
            match = re.search(pattern, text_lower)
            if match:
                if freq_data.get('extract_count') and match.groups():
                    count = int(match.group(1))
                    return {'type': freq_data['type'], 'count': count}
                else:
                    return freq_data.copy()
        
        return {'type': 'weekly', 'count': 3}
    
    def _extract_duration(self, text: str) -> Dict[str, Any]:
        """Extract duration information from text"""
        text_lower = text.lower()
        
        for pattern, unit in self.duration_patterns.items():
            match = re.search(pattern, text_lower)
            if match:
                if isinstance(unit, dict):
                    minutes = unit['value']
                    if unit['unit'] == 'hours':
                        minutes *= 60
                    return {'minutes': minutes, 'text': match.group()}
                else:
                    value = int(match.group(1))
                    minutes = value if unit == 'minutes' else value * 60
                    return {'minutes': minutes, 'text': match.group()}
        
        return {'minutes': 30, 'text': 'default'}
    
    def _extract_time_preference(self, text: str) -> str:
        """Extract time of day preference from text"""
        text_lower = text.lower()
        
        for pattern, time_pref in self.time_patterns.items():
            if re.search(pattern, text_lower):
                return time_pref
        
        return 'any'
    
    def _determine_category(self, activity: str) -> str:
        """Determine category based on activity"""
        if not activity:
            return 'personal'
        
        activity_lower = activity.lower()
        
        for category, keywords in self.activity_categories.items():
            if any(keyword in activity_lower for keyword in keywords):
                return category
        
        return 'personal'

    def _generate_habit_confirmation(self, habit_data: Dict[str, Any], original_text: str) -> str:
        """Generate a confirmation message for the parsed habit"""
        name = habit_data['name']
        frequency = habit_data['frequency_count']
        freq_type = habit_data['frequency_type']
        duration = habit_data['estimated_duration']
        time_pref = habit_data['time_of_day']
        
        # Build frequency text
        if freq_type == 'daily':
            freq_text = "daily" if frequency == 1 else f"{frequency} times per day"
        elif freq_type == 'weekly':
            freq_text = "weekly" if frequency == 1 else f"{frequency} times per week"
        else:
            freq_text = f"{frequency} times per {freq_type}"
        
        # Build time text
        time_text = f" in the {time_pref}" if time_pref != 'any' else ""
        
        # Build duration text
        if duration >= 60:
            hours = duration // 60
            mins = duration % 60
            if mins == 0:
                duration_text = f"{hours} hour{'s' if hours > 1 else ''}"
            else:
                duration_text = f"{hours}h {mins}m"
        else:
            duration_text = f"{duration} minutes"
        
        return (f"I understand you want to {name.lower()} {freq_text}{time_text} "
                f"for {duration_text}. Should I create this habit for you?")
    
    async def _handle_conversation(self, text: str, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle general conversation"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['hello', 'hi', 'hey']):
            return self.format_response(
                "Hello! I'm here to help you create and manage your habits. "
                "You can tell me about a habit you'd like to start, and I'll help you set it up.",
                suggestions=[
                    "I want to start exercising 3 times a week",
                    "Help me create a daily meditation habit",
                    "I'd like to read for 30 minutes every day"
                ]
            )
        
        elif any(word in text_lower for word in ['help', 'what can you do']):
            return self.format_response(
                "I can help you create habits from natural language descriptions. "
                "Just tell me what you want to do, how often, and for how long. "
                "For example: 'I want to run 3 times a week for 30 minutes in the morning'",
                suggestions=[
                    "Create a new habit",
                    "Show me my current habits",
                    "Help me schedule my day"
                ]
            )
        
        else:
            # Try to parse as potential habit creation
            return await self._parse_habit_creation(text, user_context)
    
    async def _analyze_general_text(self, text: str, user_context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze text for general insights"""
        activity = self._extract_activity(text)
        frequency = self._extract_frequency(text)
        duration = self._extract_duration(text)
        
        analysis = {
            'contains_habit_info': bool(activity and activity != "New Habit"),
            'activity': activity,
            'frequency': frequency,
            'duration': duration,
            'sentiment': 'positive'
        }
        
        if analysis['contains_habit_info']:
            return self.format_response(
                f"I detected you might want to create a habit related to {activity.lower()}. "
                "Would you like me to help you set this up?",
                suggestions=[
                    "Yes, create this habit",
                    "Let me provide more details",
                    "Show me similar habits"
                ],
                metadata={'analysis': analysis}
            )
        else:
            return self.format_response(
                "I'm here to help you create and manage habits. "
                "What would you like to work on?",
                suggestions=[
                    "Create a new habit",
                    "Show my progress",
                    "Help me schedule better"
                ]
            )
