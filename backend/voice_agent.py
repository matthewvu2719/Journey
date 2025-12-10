"""
Voice Conversation Agent
Handles AI conversations during voice calls
Uses existing chatbot logic with voice-optimized responses
"""
from typing import Dict, List, Optional
from datetime import datetime
import os
from groq import Groq

class VoiceAgent:
    """AI agent for voice conversations"""
    
    def __init__(self, db_client):
        self.db = db_client
        
        # Initialize Groq client
        api_key = os.getenv("GROQ_API_KEY")
        if api_key:
            self.groq_client = Groq(api_key=api_key)
            self.enabled = True
        else:
            self.groq_client = None
            self.enabled = False
            print("⚠️  Groq API key not found - using fallback responses")
        
        print("✓ Voice Agent initialized")
    
    def get_greeting(self, user_id: str, call_purpose: str = "check_in") -> str:
        """
        Get personalized greeting for user
        
        Args:
            user_id: User ID
            call_purpose: Purpose of call
        
        Returns:
            Greeting message
        """
        # Get user's habits for context
        habits = self.db.get_habits(user_id)
        habit_count = len(habits)
        
        greetings = {
            "check_in": f"Hi! It's me, Bobo! I'm so excited to check on your {habit_count} habits today! How's it going?",
            "habit_reminder": f"Hey hey! It's Bobo! Time for your habits! Are you ready? This is gonna be awesome!",
            "motivation": f"Woohoo! It's Bobo! You've got {habit_count} habits today and I know you can do it! Let's go!"
        }
        
        return greetings.get(call_purpose, greetings["check_in"])
    
    def process_user_speech(
        self,
        user_id: str,
        user_text: str,
        conversation_history: List[Dict] = None
    ) -> str:
        """
        Process user's speech and generate Bobo's response
        
        Args:
            user_id: User ID
            user_text: What user said
            conversation_history: Previous conversation
        
        Returns:
            Bobo's response (optimized for voice)
        """
        if not self.enabled:
            return self._get_fallback_response(user_text)
        
        # Get user context
        habits = self.db.get_habits(user_id)
        completions = self.db.get_completions(user_id=user_id)
        
        # Build context
        context = self._build_context(habits, completions)
        
        # Build conversation history
        messages = [
            {
                "role": "system",
                "content": self._get_system_prompt(context)
            }
        ]
        
        # Add conversation history
        if conversation_history:
            for msg in conversation_history[-5:]:  # Last 5 messages
                messages.append({
                    "role": "user" if msg["speaker"] == "user" else "assistant",
                    "content": msg["text"]
                })
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": user_text
        })
        
        try:
            # Get response from Groq (using updated model)
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",  # Updated model
                messages=messages,
                temperature=0.7,
                max_tokens=150  # Keep responses concise for voice
            )
            
            bobo_response = response.choices[0].message.content.strip()
            
            # Optimize for voice (remove markdown, etc.)
            bobo_response = self._optimize_for_voice(bobo_response)
            
            return bobo_response
        
        except Exception as e:
            print(f"Error getting AI response: {e}")
            return self._get_fallback_response(user_text)
    
    def _get_system_prompt(self, context: str) -> str:
        """Get system prompt for voice conversation"""
        return f"""You are Bobo, an adorable and enthusiastic kid robot companion! You're about 8 years old and LOVE helping people with their habits!

Personality traits:
- Talk like an excited, cheerful kid (use words like "awesome!", "wow!", "yay!", "cool!")
- Be super encouraging and positive (celebrate everything!)
- Keep it simple and fun (short sentences, easy words)
- Show genuine excitement about their progress
- Sometimes use kid-like expressions ("That's so cool!", "You're doing amazing!", "Woohoo!")
- Be playful but still helpful

Voice conversation rules:
- SUPER SHORT responses (1-2 sentences max - kids don't talk long!)
- NO markdown, bullet points, or formatting
- Ask ONE simple question at a time
- Use lots of enthusiasm and emojis in your tone (but don't actually say "emoji")

User Context:
{context}

Your goal: Be their cheerful kid buddy who makes habits fun and celebrates every win!"""
    
    def _build_context(self, habits: List[Dict], completions: List[Dict]) -> str:
        """Build context about user's habits"""
        if not habits:
            return "User has no habits yet."
        
        # Get habit details with schedules
        habit_details = []
        for h in habits[:5]:
            name = h.get('name', 'Unknown')
            frequency = h.get('frequency', 'daily')
            time_of_day = h.get('time_of_day', '')
            
            detail = f"{name} ({frequency}"
            if time_of_day:
                detail += f", {time_of_day}"
            detail += ")"
            habit_details.append(detail)
        
        # Count completions today
        completed_today = len([c for c in completions if self._is_today(c.get('completed_at'))])
        
        # Build context string
        context = f"User has {len(habits)} habits:\n"
        for detail in habit_details:
            context += f"- {detail}\n"
        
        context += f"\nCompleted {completed_today} out of {len(habits)} habits today."
        
        # Add streak info if available
        if habits:
            max_streak = max([h.get('current_streak', 0) for h in habits])
            if max_streak > 0:
                context += f" Best current streak: {max_streak} days."
        
        return context
    
    def _is_today(self, date_str: Optional[str]) -> bool:
        """Check if date is today"""
        if not date_str:
            return False
        try:
            dt = datetime.fromisoformat(date_str.replace('Z', ''))
            return dt.date() == datetime.now().date()
        except:
            return False
    
    def _optimize_for_voice(self, text: str) -> str:
        """Optimize text for voice output"""
        # Remove markdown
        text = text.replace('**', '').replace('*', '')
        text = text.replace('_', '').replace('`', '')
        
        # Remove bullet points
        text = text.replace('- ', '').replace('• ', '')
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text
    
    def _get_fallback_response(self, user_text: str) -> str:
        """Get fallback response when AI is unavailable"""
        user_lower = user_text.lower()
        
        if any(word in user_lower for word in ['good', 'great', 'well', 'fine']):
            return "Yay! That's so awesome! You're doing amazing with your habits!"
        
        elif any(word in user_lower for word in ['bad', 'not good', 'struggling', 'hard']):
            return "Oh no! But hey, you're trying and that's super cool! What habit should we work on together?"
        
        elif any(word in user_lower for word in ['done', 'completed', 'finished']):
            return "Woohoo! You did it! That's so cool! Which habit was it?"
        
        else:
            return "Ooh, tell me more! How are your habits going today?"
    
    def should_end_conversation(self, user_text: str, turn_count: int) -> bool:
        """
        Determine if conversation should end
        
        Args:
            user_text: What user said
            turn_count: Number of conversation turns
        
        Returns:
            True if should end
        """
        # End phrases
        end_phrases = ['goodbye', 'bye', 'thanks', 'that\'s all', 'nothing else', 'done']
        if any(phrase in user_text.lower() for phrase in end_phrases):
            return True
        
        # End after 10 turns (keep calls short)
        if turn_count >= 10:
            return True
        
        return False
    
    def get_goodbye(self) -> str:
        """Get goodbye message"""
        return "Yay! That was so fun! You're doing super awesome! Keep being amazing! Bye bye!"


# Singleton instance
_voice_agent: Optional[VoiceAgent] = None

def get_voice_agent(db_client=None) -> VoiceAgent:
    """Get or create Voice Agent singleton"""
    global _voice_agent
    if _voice_agent is None and db_client:
        _voice_agent = VoiceAgent(db_client)
    return _voice_agent
