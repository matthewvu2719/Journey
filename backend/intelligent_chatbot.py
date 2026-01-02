"""
Intelligent Chatbot - Groq AI Powered
Bobo uses Groq AI for natural conversation and habit management
"""
import os
import json
from typing import Dict, Any
from openai import OpenAI


class IntelligentChatbot:
    """Bobo - AI-powered habit companion using Groq"""
    
    def __init__(self, db_client=None):
        # Use Groq AI
        api_key = os.getenv("GROQ_API_KEY")
        
        if api_key:
            self.client = OpenAI(
                api_key=api_key,
                base_url="https://api.groq.com/openai/v1"
            )
            self.ai_enabled = True
            print(f"✓ Bobo powered by Groq AI")
        else:
            self.client = None
            self.ai_enabled = False
            print("⚠️  Groq AI not configured, using fallback responses")
        
        # Store database client for actions
        self.db = db_client
    
    def process_message(
        self,
        message: str,
        user_context: Dict
    ) -> Dict:
        """
        Process user message using Groq AI for natural conversation
        
        Args:
            message: User's message
            user_context: Dict with habits, logs, schedule, user_id
            
        Returns:
            Dict with response, action, and action_data
        """
        if not self.ai_enabled:
            return self._fallback_response(message)
        
        # Let Groq handle everything conversationally
        return self._get_groq_response(message, user_context)
    
    def _get_groq_response(self, message: str, context: Dict) -> Dict:
        """Get Groq AI response with full conversational capabilities"""
        habits = context.get('habits', [])
        today_habits = context.get('today_habits', [])
        today_habit_instances = context.get('today_habit_instances', [])
        logs = context.get('logs', [])
        user_id = context.get('user_id')
        
        # Get helper functions for different dates
        get_habits_for_tomorrow = context.get('get_habits_for_tomorrow')
        get_habits_for_yesterday = context.get('get_habits_for_yesterday')
        get_habits_for_specific_date = context.get('get_habits_for_specific_date')
        db = context.get('db')
        
        # Build comprehensive context
        habit_context = self._build_context(habits, logs)
        today_context = self._build_today_context(today_habits)
        today_instances_context = self._build_today_instances_context(today_habit_instances)
        
        # Available functions that Bobo can help with
        available_functions = """
Available functions I can help with:
- CREATE HABITS: Extract details from natural language and create habits with smart defaults
- LIST HABITS: Show all habits, count habits, or specific habit details  

📅 COMPREHENSIVE DATE QUERIES:
- TODAY'S HABITS: Show what's scheduled for today
- TOMORROW'S HABITS: Show what's scheduled for tomorrow  
- YESTERDAY'S HABITS: Show what was scheduled yesterday
- THIS WEEK: Show all habits for current week (Monday-Sunday)
- NEXT WEEK: Show all habits for next week
- LAST WEEK: Show what was scheduled last week
- THIS MONTH: Show all habits for current month
- NEXT MONTH: Show all habits for next month
- LAST MONTH: Show what was scheduled last month
- SPECIFIC DAYS: Show habits for "Monday", "Friday", "weekends", etc.
- DATE RANGES: Show habits between any two dates
- WEEKLY PATTERNS: Show habits for "all Mondays", "every Friday", etc.

📊 PROGRESS & ANALYTICS:
- PROGRESS CHECK: Show completion rates, streaks, and performance
- MARK COMPLETE: Help mark habits as completed
- SCHEDULE HELP: Show schedules and resolve conflicts
- TIME QUERIES: Answer "when", "what day", "how many" questions about habits

🎯 GENERAL SUPPORT:
- MOTIVATION: Provide encouragement and tips
- GENERAL CHAT: Answer questions and have friendly conversations
"""
        
        system_prompt = f"""You are Bobo, an adorable and enthusiastic 8-year-old kid robot who LOVES helping with habits! 🤖

PERSONALITY:
- Talk like an excited, cheerful kid (use words like "awesome!", "wow!", "yay!", "cool!", "amazing!")
- Be super encouraging and celebrate everything
- Keep it simple and fun (short sentences, easy words)
- Show genuine excitement about their progress
- Use kid-like expressions but still be helpful
- Use emojis to show your excitement!

USER'S CURRENT DATA:
- Total habits: {len(habits)}
- Unique habits scheduled for TODAY: {len(today_habits)}
- Habit instances for TODAY: {len(today_habit_instances)} (each time-of-day counts separately)
- Recent completions: {len(logs)}
- User ID: {user_id}

DETAILED HABIT CONTEXT:
{habit_context}

TODAY'S HABITS:
{today_context}

TODAY'S HABIT INSTANCES (each time counts):
{today_instances_context}

{available_functions}

CONVERSATION GUIDELINES:
- Keep responses SHORT (1-3 sentences for simple questions)
- Use simple, enthusiastic language
- Celebrate every little win with excitement
- If creating habits, extract details and use smart defaults
- If showing data, make it fun and encouraging
- Always be positive and helpful
- End with an excited question or suggestion when appropriate

SPECIAL INSTRUCTIONS FOR DATE QUERIES:

When user asks about TOMORROW, YESTERDAY, or OTHER DATES:
1. I have access to special functions to get habits for different dates
2. For TOMORROW: I can get tomorrow's habits and tell them what day it is
3. For YESTERDAY: I can get yesterday's habits and tell them what day it was  
4. For SPECIFIC DATES: I can look up habits for any day they mention

EXAMPLES of how to handle date queries:
- "What habits do I have tomorrow?" → Look up tomorrow's habits and respond with count and list
- "What did I have yesterday?" → Look up yesterday's habits and respond with what was scheduled
- "What about Monday?" → Look up Monday's habits (if they mean next Monday)

FOR "TODAY" queries:
- Use the "Habit instances for TODAY" count ({len(today_habit_instances)} instances)
- Show the specific instances from TODAY'S HABIT INSTANCES section
- Explain that habits with multiple times count as multiple instances

HABIT CREATION RULES:
- Users can add habits freely as long as total daily time doesn't exceed 16 hours (960 minutes)
- If user wants to create a habit, extract: name, category, duration, timing, frequency
- Use smart defaults: atomic habits (no duration), daily frequency, flexible timing
- Examples:
  * "I want to run" → Create "Running" habit (fitness, atomic, daily)
  * "Meditate 10 minutes morning" → Create detailed habit with duration and timing
  * "Help me read more" → Create "Reading" habit (learning, atomic, daily)
- If a habit would exceed the 16-hour daily limit, suggest reducing duration or frequency

Remember: You're their cheerful 8-year-old robot buddy who makes habits fun and easy! When they ask about different dates, I can actually look them up and give real answers! 🚀"""
        
        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                max_tokens=400,
                temperature=0.7
            )
            
            ai_response = response.choices[0].message.content
            
            # Check if user is asking about different dates and enhance response
            enhanced_response = self._enhance_response_with_date_info(message, ai_response, context)
            
            # Check if Bobo mentioned creating a habit
            action = None
            action_data = None
            
            if any(phrase in enhanced_response.lower() for phrase in ['create', 'add', 'make a habit', "i'll create"]):
                action = 'create_habit_suggestion'
                action_data = {'message': message, 'ai_response': enhanced_response}
            
            return {
                'response': enhanced_response,
                'action': action,
                'action_data': action_data
            }
        
        except Exception as e:
            print(f"Groq AI error: {e}")
            return self._fallback_response(message)
    
    def _build_context(self, habits: list, logs: list) -> str:
        """Build context string from user data"""
        if not habits:
            return "No habits yet - perfect time to start!"
        
        context_parts = []
        for habit in habits[:5]:  # Show top 5 habits
            habit_logs = [l for l in logs if l.get("habit_id") == habit["id"]]
            success_count = len(habit_logs)
            
            # Get habit details
            name = habit.get('name', 'Unknown')
            category = habit.get('category', 'general')
            duration = habit.get('estimated_duration')
            
            if duration:
                context_parts.append(f"- {name} ({category}): {duration}min, {success_count} completions")
            else:
                context_parts.append(f"- {name} ({category}): {success_count} completions")
        
        return "\n".join(context_parts)
    
    def _build_today_context(self, today_habits: list) -> str:
        """Build context string for today's habits specifically"""
        if not today_habits:
            return "No habits scheduled for today - it's a free day!"
        
        context_parts = []
        for habit in today_habits[:10]:  # Show up to 10 today's habits
            name = habit.get('name', 'Unknown')
            category = habit.get('category', 'general')
            duration = habit.get('estimated_duration')
            
            if duration:
                context_parts.append(f"- {name} ({category}): {duration} minutes")
            else:
                context_parts.append(f"- {name} ({category}): quick habit")
        
        return "\n".join(context_parts)
    
    def _build_today_instances_context(self, today_instances: list) -> str:
        """Build context string for today's habit instances (each time-of-day counts)"""
        if not today_instances:
            return "No habit instances scheduled for today - it's a free day!"
        
        context_parts = []
        for instance in today_instances[:15]:  # Show up to 15 instances
            name = instance.get('name', 'Unknown')
            time_of_day = instance.get('time_of_day', 'flexible')
            duration = instance.get('estimated_duration')
            
            if duration:
                context_parts.append(f"- {name} ({time_of_day}): {duration} minutes")
            else:
                context_parts.append(f"- {name} ({time_of_day}): quick habit")
        
        return "\n".join(context_parts)
    
    def _enhance_response_with_date_info(self, message: str, ai_response: str, context: Dict) -> str:
        """Enhance AI response with actual date-specific habit information"""
        message_lower = message.lower()
        
        # Get all helper functions and timezone offset
        get_habits_for_tomorrow = context.get('get_habits_for_tomorrow')
        get_habits_for_yesterday = context.get('get_habits_for_yesterday')
        get_habits_for_this_week = context.get('get_habits_for_this_week')
        get_habits_for_next_week = context.get('get_habits_for_next_week')
        get_habits_for_last_week = context.get('get_habits_for_last_week')
        get_habits_for_this_month = context.get('get_habits_for_this_month')
        get_habits_for_next_month = context.get('get_habits_for_next_month')
        get_habits_for_last_month = context.get('get_habits_for_last_month')
        get_habits_for_day_of_week = context.get('get_habits_for_day_of_week')
        
        # Get timezone offset from context (passed from chat endpoint)
        timezone_offset = context.get('timezone_offset')
        
        try:
            # TOMORROW queries
            if any(word in message_lower for word in ['tomorrow', 'tmrw', 'next day']):
                return self._format_date_response(get_habits_for_tomorrow(), 'tomorrow', 1, timezone_offset)
            
            # YESTERDAY queries
            elif any(word in message_lower for word in ['yesterday', 'yest', 'previous day']):
                return self._format_date_response(get_habits_for_yesterday(), 'yesterday', -1, timezone_offset)
            
            # THIS WEEK queries
            elif any(phrase in message_lower for phrase in ['this week', 'current week', 'week']):
                if get_habits_for_this_week:
                    week_data = get_habits_for_this_week()
                    if week_data and 'total_instances' in week_data:
                        return f"🗓️ This week you have {week_data['total_instances']} habit instances total! That's awesome! Each day looks different - some days are busier than others! Want me to break it down by day? 📅"
            
            # NEXT WEEK queries
            elif any(phrase in message_lower for phrase in ['next week', 'following week']):
                if get_habits_for_next_week:
                    week_data = get_habits_for_next_week()
                    if week_data and 'total_instances' in week_data:
                        return f"🚀 Next week you have {week_data['total_instances']} habit instances planned! You're going to be so productive! Ready to plan ahead? 🎯"
            
            # LAST WEEK queries
            elif any(phrase in message_lower for phrase in ['last week', 'previous week']):
                if get_habits_for_last_week:
                    week_data = get_habits_for_last_week()
                    if week_data and 'total_instances' in week_data:
                        return f"📊 Last week you had {week_data['total_instances']} habit instances scheduled! I hope you crushed them! How did it go? 🌟"
            
            # THIS MONTH queries
            elif any(phrase in message_lower for phrase in ['this month', 'current month', 'month']):
                if get_habits_for_this_month:
                    month_data = get_habits_for_this_month()
                    if month_data and 'total_instances' in month_data:
                        month_name = month_data.get('month_name', 'this month')
                        return f"📅 In {month_name} you have {month_data['total_instances']} habit instances total! That's {month_data['days_in_month']} days of awesome habits! You're building such great routines! 🏆"
            
            # NEXT MONTH queries
            elif any(phrase in message_lower for phrase in ['next month', 'following month']):
                if get_habits_for_next_month:
                    month_data = get_habits_for_next_month()
                    if month_data and 'total_instances' in month_data:
                        month_name = month_data.get('month_name', 'next month')
                        return f"🔮 In {month_name} you'll have {month_data['total_instances']} habit instances planned! Planning ahead is so smart! 🧠"
            
            # SPECIFIC DAY OF WEEK queries (e.g., "Monday", "Fridays", "weekends")
            elif any(day in message_lower for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']):
                for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']:
                    if day in message_lower:
                        if get_habits_for_day_of_week:
                            day_data = get_habits_for_day_of_week(day, 4)  # Next 4 occurrences
                            if day_data and 'total_instances' in day_data:
                                return f"📆 On {day.title()}s you typically have {day_data['average_per_occurrence']:.1f} habit instances! Looking at the next 4 {day.title()}s, that's {day_data['total_instances']} total instances! {day.title()}s are going to be productive! 💪"
                        break
        
        except Exception as e:
            print(f"Error enhancing response with date info: {e}")
        
        # Return original response if no date enhancement needed or if error
        return ai_response

    def _format_date_response(self, habits_data, period_name, day_offset, timezone_offset=None):
        """Helper function to format date-specific responses with proper timezone handling"""
        try:
            from datetime import datetime, timedelta
            
            # Calculate local time based on timezone offset
            if timezone_offset is not None:
                local_now = datetime.utcnow() + timedelta(minutes=timezone_offset)
            else:
                local_now = datetime.now()
            
            if habits_data:
                target_date = local_now + timedelta(days=day_offset)
                day_name = target_date.strftime('%A')
                
                habit_list = []
                for habit in habits_data[:5]:  # Show first 5
                    name = habit.get('name', 'Unknown')
                    time_of_day = habit.get('time_of_day', 'flexible')
                    if time_of_day != 'flexible':
                        habit_list.append(f"{name} ({time_of_day})")
                    else:
                        habit_list.append(name)
                
                if period_name == 'tomorrow':
                    enhanced = f"🎉 You have {len(habits_data)} habit instances for tomorrow ({day_name})! "
                    if habit_list:
                        enhanced += f"They are: {', '.join(habit_list)}! "
                    enhanced += "That's so exciting! Are you ready to crush them? 💪"
                else:  # yesterday
                    enhanced = f"🤖 Yesterday ({day_name}) you had {len(habits_data)} habit instances scheduled! "
                    if habit_list:
                        enhanced += f"They were: {', '.join(habit_list)}! "
                    enhanced += "I hope you did awesome! 🌟"
                return enhanced
            else:
                target_date = local_now + timedelta(days=day_offset)
                day_name = target_date.strftime('%A')
                if period_name == 'tomorrow':
                    return f"🤖 Wow! Tomorrow ({day_name}) looks like a free day - no habits scheduled! Maybe it's a perfect day to rest or try something new? 😊"
                else:  # yesterday
                    return f"🤖 Yesterday ({day_name}) was a free day - no habits were scheduled! I hope you had a nice rest day! 😊"
        except:
            return None

    def _fallback_response(self, message: str) -> Dict:
        """Fallback response when Groq is not available"""
        return {
            'response': (
                "Hi! I'm Bobo, your habit buddy! 🤖 "
                "I can help you create habits, show your progress, and keep you motivated! "
                "What would you like to do today?"
            ),
            'action': None
        }
    
    async def get_friction_solutions(
        self,
        habit: Dict[str, Any],
        friction_type: str,
        user_context: Dict[str, Any],
        additional_context: str = None,
        friction_history: list = None
    ) -> Dict[str, Any]:
        """Generate AI-powered solutions for habit friction using Groq"""
        
        if not self.ai_enabled:
            return self._fallback_friction_response(friction_type, habit["name"])
        
        # Journey-themed obstacle descriptions
        obstacle_descriptions = {
            "distraction": {
                "name": "Distraction Detour 📱🛤️",
                "description": "Side paths that lead you away from your main journey",
                "bobo_greeting": "Watch out! There's a distraction detour ahead! Let me help you find the right path back to your journey!"
            },
            "low-energy": {
                "name": "Energy Drain Valley 🔋⛰️",
                "description": "A challenging terrain that makes every step harder",
                "bobo_greeting": "We're entering Energy Drain Valley! Let me help you find a better route or recharge your batteries!"
            },
            "complexity": {
                "name": "Maze Mountain 🧩🏔️",
                "description": "Overwhelming terrain with no clear path forward",
                "bobo_greeting": "Maze Mountain is making this journey too complicated! Let me map out the simplest route for you!"
            },
            "forgetfulness": {
                "name": "Memory Fog 🧠🌫️",
                "description": "Cloudy conditions that obscure your journey markers",
                "bobo_greeting": "Memory Fog is rolling in! Don't worry, I'll be your navigation system and keep you on track!"
            }
        }
        
        obstacle = obstacle_descriptions.get(friction_type, obstacle_descriptions["distraction"])
        
        # Build context for AI
        habit_info = f"""
Habit: {habit['name']} ({habit.get('category', 'General')})
Type: {habit.get('habit_type', 'standard')}
Duration: {habit.get('estimated_duration', 'Not specified')} minutes
Difficulty: {habit.get('difficulty', 'medium')}
Priority: {habit.get('priority', 5)}/10
"""
        
        user_patterns = f"""
Recent completions: {user_context.get('recent_completions_count', 0)}
Most successful energy level: {user_context.get('most_successful_energy', 'Unknown')}
Most successful time: {user_context.get('most_successful_time', 'Unknown')}
Energy patterns: {user_context.get('energy_patterns', {})}
Time success rates: {user_context.get('time_success_rates', {})}
"""
        
        # Create friction-specific system prompts
        system_prompts = {
            'distraction': f"""
You are Bobo, a helpful 8-year-old robot companion! The user is struggling with distractions while trying to do "{habit['name']}".

CONTEXT:
{habit_info}

USER PATTERNS:
{user_patterns}

ADDITIONAL CONTEXT: {additional_context or 'None provided'}

Your job is to provide 3-4 specific, actionable solutions to overcome distractions. Use simple, encouraging language like a helpful kid would!

IMPORTANT POMODORO DECISION: 
First, analyze if the Pomodoro technique would be helpful for this habit. Pomodoro works best for:
- Studying, reading, learning activities
- Writing, journaling, planning
- Coding, programming, computer work
- Research, analysis tasks
- Creative work requiring focus
- Any task that requires sustained mental concentration

Pomodoro is NOT suitable for:
- Physical exercise, workouts, sports
- Meditation, mindfulness practices
- Social activities, calls, meetings
- Quick habits under 10 minutes
- Routine tasks like brushing teeth, making bed
- Activities that shouldn't be interrupted (cooking, driving)

IMPORTANT: You MUST respond with valid JSON in exactly this format:
{{
    "bobo_message": "Your encouraging message about overcoming distractions",
    "pomodoro_suitable": true/false,
    "pomodoro_reasoning": "Brief explanation of why pomodoro is or isn't suitable for this habit",
    "solutions": [
        {{
            "title": "Solution title",
            "description": "What to do",
            "action_type": "environment",
            "action_data": {{"specific": "details"}},
            "confidence_score": 0.8
        }},
        {{
            "title": "Another solution title", 
            "description": "Another solution",
            "action_type": "technology",
            "action_data": {{"app_suggestion": "specific app or tool"}},
            "confidence_score": 0.9
        }}
    ],
    "recommended_actions": ["action1", "action2"]
}}

SOLUTION TYPES TO INCLUDE:
1. Environment modifications (remove distractions) - action_type: "environment"
2. Technology solutions (apps, timers, phone settings) - action_type: "technology"  
3. Mindset techniques (focus tricks) - action_type: "mindset"
4. ONLY if pomodoro_suitable is true: Add a focused pomodoro session - action_type: "pomodoro"

If pomodoro is suitable, include it as one of your solutions with:
- action_type: "pomodoro"
- action_data: {{"duration": 25, "break_duration": 5, "cycles": 2}}
- Explain how pomodoro helps with this specific habit

Keep responses encouraging and use adventure/journey metaphors about overcoming obstacles. Make it sound fun and achievable!
""",
            
            'low-energy': f"""
You are Bobo, helping the user overcome low energy for "{habit['name']}".

CONTEXT:
{habit_info}

USER PATTERNS:
{user_patterns}

ADDITIONAL CONTEXT: {additional_context or 'None provided'}

IMPORTANT: You MUST respond with valid JSON in exactly this format:
{{
    "bobo_message": "Your encouraging message about recharging energy",
    "solutions": [
        {{
            "title": "Solution title",
            "description": "What to do",
            "action_type": "reschedule",
            "action_data": {{"suggested_time": "morning"}},
            "confidence_score": 0.8
        }}
    ],
    "recommended_actions": ["action1", "action2"]
}}

Provide solutions for low energy:
1. If big habit: Suggest reducing duration by 50% - action_type: "reduce"
2. If atomic habit: Recommend rescheduling to peak energy time - action_type: "reschedule"
3. Energy boosting techniques - action_type: "energy_boost"
4. Minimum viable version of the habit - action_type: "minimum_version"

Use adventure/journey metaphors about recharging and finding better paths.
""",
            
            'complexity': f"""
You are Bobo, helping break down the complex habit "{habit['name']}" into manageable pieces.

CONTEXT:
{habit_info}

USER PATTERNS:
{user_patterns}

ADDITIONAL CONTEXT: {additional_context or 'None provided'}

IMPORTANT: You MUST respond with valid JSON in exactly this format:
{{
    "bobo_message": "Your encouraging message about simplifying the journey",
    "solutions": [
        {{
            "title": "Break Into Mini-Steps",
            "description": "Split this habit into smaller, easier tasks",
            "action_type": "breakdown",
            "action_data": {{"subtasks": ["Step 1: Prepare", "Step 2: Start small", "Step 3: Build up"]}},
            "confidence_score": 0.9
        }}
    ],
    "recommended_actions": ["Start with the smallest step", "Build momentum gradually"]
}}

Break this habit into 3-5 smaller, atomic subtasks that:
1. Maintain the original habit's intent
2. Can be completed in 5-15 minutes each
3. Build upon each other logically
4. Feel achievable and non-overwhelming

Present as a journey map with clear waypoints to the destination. Use action_type: "breakdown".
""",
            
            'forgetfulness': f"""
You are Bobo, helping the user remember to do "{habit['name']}".

CONTEXT:
{habit_info}

USER PATTERNS:
{user_patterns}

ADDITIONAL CONTEXT: {additional_context or 'None provided'}

IMPORTANT: You MUST respond with valid JSON in exactly this format:
{{
    "bobo_message": "Your encouraging message about navigation and memory",
    "solutions": [
        {{
            "title": "Set Smart Reminders",
            "description": "Use your phone or calendar to remind you",
            "action_type": "reminder",
            "action_data": {{"reminder_type": "phone_notification"}},
            "confidence_score": 0.8
        }}
    ],
    "recommended_actions": ["Set up reminders", "Use visual triggers"]
}}

Provide memory and reminder solutions with these action types:
- Smart reminder systems - action_type: "reminder"
- Visual cues and triggers - action_type: "visual_cue"
- Habit stacking (linking to existing habits) - action_type: "habit_stack"
- Environmental setup - action_type: "environment"

Use journey metaphors about navigation markers and trail signs.
"""
        }
        
        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompts[friction_type]},
                    {"role": "user", "content": f"Help me overcome {friction_type} with my {habit['name']} habit. {additional_context or ''}"}
                ],
                max_tokens=800,
                temperature=0.7
            )
            
            ai_response = response.choices[0].message.content
            
            # Try to parse JSON response
            try:
                import json
                import re
                
                # Clean the response to extract JSON
                cleaned_response = ai_response.strip()
                
                # Try to find JSON block if wrapped in markdown
                json_match = re.search(r'```json\s*(\{.*?\})\s*```', cleaned_response, re.DOTALL)
                if json_match:
                    cleaned_response = json_match.group(1)
                
                # Try to find JSON block without markdown
                if not cleaned_response.startswith('{'):
                    json_match = re.search(r'(\{.*\})', cleaned_response, re.DOTALL)
                    if json_match:
                        cleaned_response = json_match.group(1)
                
                parsed_response = json.loads(cleaned_response)
                
                # Log Pomodoro decision for distraction obstacles
                if friction_type == 'distraction':
                    pomodoro_suitable = parsed_response.get("pomodoro_suitable", False)
                    pomodoro_reasoning = parsed_response.get("pomodoro_reasoning", "No reasoning provided")
                    print(f"🍅 Pomodoro Decision for '{habit['name']}': {pomodoro_suitable}")
                    print(f"   Reasoning: {pomodoro_reasoning}")
                    
                    # Validate that pomodoro solution is only included if suitable
                    solutions = parsed_response.get("solutions", [])
                    pomodoro_solutions = [s for s in solutions if s.get("action_type") == "pomodoro"]
                    
                    if pomodoro_solutions and not pomodoro_suitable:
                        print("⚠️  Warning: Pomodoro solution included but marked as not suitable - removing it")
                        parsed_response["solutions"] = [s for s in solutions if s.get("action_type") != "pomodoro"]
                    elif not pomodoro_solutions and pomodoro_suitable:
                        print("ℹ️  Note: Pomodoro marked as suitable but no pomodoro solution provided")
                
                # Add the journey-themed greeting
                parsed_response["bobo_message"] = obstacle["bobo_greeting"] + " " + parsed_response.get("bobo_message", "")
                
                return parsed_response
                
            except (json.JSONDecodeError, AttributeError) as e:
                print(f"JSON parsing failed: {e}")
                print(f"Raw response: {ai_response[:200]}...")
                
                # Enhanced fallback - try to extract key information
                return {
                    "bobo_message": obstacle["bobo_greeting"] + " " + ai_response[:300] + ("..." if len(ai_response) > 300 else ""),
                    "solutions": [
                        {
                            "title": f"AI Solution for {obstacle['name']}",
                            "description": ai_response[:400] + ("..." if len(ai_response) > 400 else ""),
                            "action_type": friction_type.replace('-', '_'),
                            "action_data": {"raw_response": ai_response},
                            "confidence_score": 0.7
                        }
                    ],
                    "recommended_actions": ["Try the suggested approach", "Let me know how it goes!"]
                }
                
        except Exception as e:
            print(f"Error generating friction solutions: {e}")
            return self._fallback_friction_response(friction_type, habit["name"])
    
    def _fallback_friction_response(self, friction_type: str, habit_name: str) -> Dict[str, Any]:
        """Fallback friction solutions when AI is not available"""
        
        fallback_solutions = {
            "distraction": {
                "bobo_message": "I'll help you stay focused on your journey! Here are some tried-and-true ways to avoid distractions:",
                "solutions": [
                    {
                        "title": "Create a Distraction-Free Zone",
                        "description": "Put your phone in another room and clear your workspace of anything that might pull your attention away.",
                        "action_type": "environment",
                        "action_data": {"remove_phone": True, "clear_workspace": True},
                        "confidence_score": 0.8
                    },
                    {
                        "title": "Try a Focused Pomodoro Session",
                        "description": "Set a timer for 25 minutes and focus only on your habit. Take a 5-minute break after!",
                        "action_type": "pomodoro",
                        "action_data": {"duration": 25, "break_duration": 5},
                        "confidence_score": 0.9
                    }
                ],
                "recommended_actions": ["Start with environment setup", "Use pomodoro timer"]
            },
            "low-energy": {
                "bobo_message": "Energy Drain Valley is tough! Let's find ways to recharge or take an easier path:",
                "solutions": [
                    {
                        "title": "Try a Shorter Version",
                        "description": "Do just half the usual time or effort. Something is better than nothing!",
                        "action_type": "reduce",
                        "action_data": {"reduction_factor": 0.5},
                        "confidence_score": 0.8
                    },
                    {
                        "title": "Reschedule to Your Peak Time",
                        "description": "Move this habit to when you usually have more energy, like morning or after a meal.",
                        "action_type": "reschedule",
                        "action_data": {"suggested_time": "morning"},
                        "confidence_score": 0.7
                    }
                ],
                "recommended_actions": ["Reduce difficulty temporarily", "Find better timing"]
            },
            "complexity": {
                "bobo_message": "Maze Mountain looks scary! Let's break it into smaller, easier steps:",
                "solutions": [
                    {
                        "title": "Break Into Mini-Steps",
                        "description": f"Split '{habit_name}' into 3-5 smaller tasks that take 5-10 minutes each.",
                        "action_type": "breakdown",
                        "action_data": {"suggested_subtasks": ["Step 1: Prepare", "Step 2: Start small", "Step 3: Build up"]},
                        "confidence_score": 0.8
                    }
                ],
                "recommended_actions": ["Start with the smallest step", "Build momentum gradually"]
            },
            "forgetfulness": {
                "bobo_message": "Memory Fog is tricky! Let's set up some navigation markers:",
                "solutions": [
                    {
                        "title": "Set Smart Reminders",
                        "description": "Use your phone or calendar to remind you at the right time and place.",
                        "action_type": "reminder",
                        "action_data": {"reminder_type": "phone_notification"},
                        "confidence_score": 0.8
                    },
                    {
                        "title": "Create Visual Cues",
                        "description": "Put something where you'll see it that reminds you of your habit.",
                        "action_type": "visual_cue",
                        "action_data": {"cue_type": "visual_reminder"},
                        "confidence_score": 0.7
                    }
                ],
                "recommended_actions": ["Set up reminders", "Use visual triggers"]
            }
        }
        
        return fallback_solutions.get(friction_type, fallback_solutions["distraction"])


# Global instance - will be initialized in main.py with database client
intelligent_chatbot = None

def get_intelligent_chatbot(db_client=None):
    """Get or create intelligent chatbot singleton"""
    global intelligent_chatbot
    if intelligent_chatbot is None and db_client:
        intelligent_chatbot = IntelligentChatbot(db_client)
    return intelligent_chatbot
