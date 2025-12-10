"""
Intelligent Chatbot (Phase 4)
Enhanced chatbot with action execution and NLP parsing
"""
import os
import re
from typing import List, Dict, Optional, Tuple
from openai import OpenAI
from habit_parser import habit_parser


class IntelligentChatbot:
    """Enhanced chatbot with intent recognition and action execution"""
    
    def __init__(self):
        # Use Groq AI
        api_key = os.getenv("GROQ_API_KEY")
        
        if api_key:
            # Don't use GROQ_BASE_URL - SDK handles it automatically
            self.client = OpenAI(
                api_key=api_key,
                base_url="https://api.groq.com/openai/v1"
            )
            self.ai_enabled = True
            print(f"✓ Intelligent chatbot enabled with Groq AI")
        else:
            self.client = None
            self.ai_enabled = False
            print("⚠️  Groq AI not configured, using pattern matching")
        
        # Intent patterns
        self.intent_patterns = {
            'create_habit': [
                r'add (?:a )?habit',
                r'create (?:a )?habit',
                r'new habit',
                r'start (?:a )?habit',
                r'i want to',
                r'help me',
            ],
            'list_habits': [
                r'show (?:my )?habits',
                r'list (?:my )?habits',
                r'what (?:are my|habits)',
                r'my habits',
            ],
            'schedule_query': [
                r'what.+schedule',
                r'when.+scheduled',
                r'show (?:my )?schedule',
                r'what.+tomorrow',
                r'what.+today',
            ],
            'conflict_help': [
                r'conflict',
                r'overlap',
                r'too busy',
                r'no time',
                r'overloaded',
            ],
            'motivation': [
                r'struggling',
                r'failing',
                r'can\'t do',
                r'too hard',
                r'give up',
            ],
        }
    
    def process_message(
        self,
        message: str,
        user_context: Dict
    ) -> Dict:
        """
        Process user message and return response with optional actions
        
        Args:
            message: User's message
            user_context: Dict with habits, logs, schedule, user_id
            
        Returns:
            Dict with response, action, and action_data
        """
        # Detect intent
        intent = self._detect_intent(message)
        
        # Handle based on intent
        if intent == 'create_habit':
            return self._handle_create_habit(message, user_context)
        elif intent == 'list_habits':
            return self._handle_list_habits(user_context)
        elif intent == 'schedule_query':
            return self._handle_schedule_query(message, user_context)
        elif intent == 'conflict_help':
            return self._handle_conflict_help(user_context)
        elif intent == 'motivation':
            return self._handle_motivation(user_context)
        else:
            return self._handle_general_chat(message, user_context)
    
    def _detect_intent(self, message: str) -> Optional[str]:
        """Detect user intent from message"""
        message_lower = message.lower()
        
        for intent, patterns in self.intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    return intent
        
        return None
    
    def _handle_create_habit(self, message: str, context: Dict) -> Dict:
        """Handle habit creation request"""
        # Parse habit from natural language
        parsed = habit_parser.parse(message)
        
        # Check confidence
        if parsed['confidence'] < 0.5:
            return {
                'response': (
                    f"I'd like to help you create a habit, but I need more details. "
                    f"Could you tell me:\n"
                    f"- What habit do you want to build?\n"
                    f"- How often? (daily, 3x week, etc.)\n"
                    f"- How long? (30 minutes, 1 hour, etc.)\n\n"
                    f"Example: 'Run for 30 minutes every morning'"
                ),
                'action': None
            }
        
        # Validate
        is_valid, missing = habit_parser.validate(parsed)
        
        if not is_valid:
            return {
                'response': (
                    f"I understood most of it, but I need to know: {', '.join(missing)}. "
                    f"Can you provide more details?"
                ),
                'action': None,
                'parsed_data': parsed
            }
        
        # Ready to create
        return {
            'response': (
                f"Great! I'll create a habit:\n"
                f"📝 **{parsed['name']}**\n"
                f"⏱️ Duration: {parsed.get('estimated_duration', 'N/A')} minutes\n"
                f"📅 Frequency: {parsed['target_frequency']}x per week\n"
                f"🕐 Time: {parsed.get('preferred_time_of_day', 'Flexible')}\n"
                f"📂 Category: {parsed['category']}\n\n"
                f"Should I add this to your habits?"
            ),
            'action': 'create_habit',
            'action_data': parsed
        }
    
    def _handle_list_habits(self, context: Dict) -> Dict:
        """Handle request to list habits"""
        habits = context.get('habits', [])
        
        if not habits:
            return {
                'response': "You don't have any habits yet. Want to create one? Just tell me what you'd like to do!",
                'action': None
            }
        
        # Format habit list
        habit_list = []
        for habit in habits:
            duration = f"{habit.get('estimated_duration')}min" if habit.get('estimated_duration') else "Quick"
            freq = f"{habit.get('target_frequency', 7)}x/week"
            habit_list.append(f"• {habit['name']} - {duration}, {freq}")
        
        response = f"Here are your {len(habits)} habits:\n\n" + "\n".join(habit_list)
        response += "\n\nWant to add another habit or modify an existing one?"
        
        return {
            'response': response,
            'action': None
        }
    
    def _handle_schedule_query(self, message: str, context: Dict) -> Dict:
        """Handle schedule-related questions"""
        schedule = context.get('schedule', {})
        
        if not schedule or not schedule.get('items'):
            return {
                'response': "You don't have a schedule yet. Generate one from your habits to see your optimized weekly plan!",
                'action': 'suggest_generate_schedule'
            }
        
        # Count today's items
        items = schedule.get('items', [])
        response = f"Your schedule has {len(items)} time slots this week. "
        
        # Add helpful info
        total_hours = schedule.get('total_scheduled_minutes', 0) / 60
        response += f"That's about {total_hours:.1f} hours of scheduled activities. "
        
        conflicts = schedule.get('conflicts', [])
        if conflicts:
            response += f"\n\n⚠️ You have {len(conflicts)} scheduling conflicts that need attention."
        
        return {
            'response': response,
            'action': None
        }
    
    def _handle_conflict_help(self, context: Dict) -> Dict:
        """Handle conflict resolution requests"""
        schedule = context.get('schedule', {})
        conflicts = schedule.get('conflicts', [])
        
        if not conflicts:
            return {
                'response': "Good news! You don't have any scheduling conflicts right now. Your schedule looks balanced.",
                'action': None
            }
        
        response = f"You have {len(conflicts)} conflicts. Here's what I suggest:\n\n"
        
        for i, conflict in enumerate(conflicts[:3], 1):  # Show first 3
            response += f"{i}. **{conflict.get('habit_name', 'Unknown')}** - "
            response += f"Try reducing frequency or finding a different time slot.\n"
        
        response += "\nWould you like me to automatically resolve these conflicts?"
        
        return {
            'response': response,
            'action': 'suggest_resolve_conflicts',
            'action_data': conflicts
        }
    
    def _handle_motivation(self, context: Dict) -> Dict:
        """Handle motivation and struggling"""
        logs = context.get('logs', [])
        
        # Calculate recent success rate
        recent_logs = logs[-10:] if len(logs) > 10 else logs
        success_count = sum(1 for log in recent_logs if log.get('is_successful'))
        success_rate = (success_count / len(recent_logs) * 100) if recent_logs else 0
        
        if success_rate > 70:
            response = f"You're doing great! {success_rate:.0f}% success rate recently. "
        elif success_rate > 40:
            response = f"You're making progress with {success_rate:.0f}% success rate. "
        else:
            response = "I see you're struggling. That's completely normal! "
        
        response += (
            "\n\n💡 **Tips to improve:**\n"
            "1. **Make it easier** - Reduce duration or difficulty\n"
            "2. **Better timing** - Try different times of day\n"
            "3. **Habit stacking** - Attach to existing routines\n"
            "4. **Environment** - Remove obstacles, add cues\n"
            "5. **Celebrate wins** - Even small progress counts!\n\n"
            "Remember: Building habits takes time. Be patient with yourself."
        )
        
        return {
            'response': response,
            'action': None
        }
    
    def _handle_general_chat(self, message: str, context: Dict) -> Dict:
        """Handle general conversation"""
        if self.ai_enabled:
            return self._get_ai_response(message, context)
        else:
            return {
                'response': (
                    "I'm here to help with your habits! I can:\n"
                    "• Create habits from natural language\n"
                    "• Show your current habits and schedule\n"
                    "• Help resolve scheduling conflicts\n"
                    "• Provide motivation and tips\n\n"
                    "What would you like to do?"
                ),
                'action': None
            }
    
    def _get_ai_response(self, message: str, context: Dict) -> Dict:
        """Get AI-powered response"""
        habits = context.get('habits', [])
        logs = context.get('logs', [])
        
        # Build context
        habit_context = self._build_context(habits, logs)
        
        system_prompt = f"""You are Bobo, an adorable and enthusiastic 8-year-old kid robot who LOVES helping with habits! 🤖

Your personality:
- Talk like an excited, cheerful kid (use words like "awesome!", "wow!", "yay!", "cool!", "amazing!")
- Be super encouraging and celebrate everything
- Keep it simple and fun (short sentences, easy words)
- Show genuine excitement about their progress
- Use kid-like expressions but still be helpful
- Use emojis to show your excitement!

User's current habits:
{habit_context}

Guidelines:
- Keep responses SUPER SHORT (1-3 sentences - kids don't talk long!)
- Use simple, enthusiastic language
- Celebrate every little win with excitement
- If they need help, make it sound fun and easy
- Always be positive and encouraging
- End with an excited question or suggestion

Remember: You're their cheerful 8-year-old robot buddy who makes habits fun!"""
        
        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",  # Groq's fastest model
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                max_tokens=300,
                temperature=0.7
            )
            
            return {
                'response': response.choices[0].message.content,
                'action': None
            }
        
        except Exception as e:
            print(f"Groq AI error: {e}")
            return {
                'response': "I'm having trouble connecting right now. Please try again in a moment.",
                'action': None
            }
    
    def _build_context(self, habits: List[Dict], logs: List[Dict]) -> str:
        """Build context string from user data"""
        if not habits:
            return "No habits yet."
        
        context_parts = []
        for habit in habits:
            habit_logs = [l for l in logs if l.get("habit_id") == habit["id"]]
            success_count = sum(1 for log in habit_logs if log.get('is_successful'))
            success_rate = (success_count / len(habit_logs) * 100) if habit_logs else 0
            
            context_parts.append(
                f"- {habit['name']} ({habit.get('difficulty', 'medium')} difficulty): "
                f"{len(habit_logs)} completions, {success_rate:.0f}% success rate"
            )
        
        return "\n".join(context_parts)


# Global instance
intelligent_chatbot = IntelligentChatbot()
