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
            "check_in": f"Hi there! It's Bobo. I wanted to check in on your {habit_count} habits today. How are things going?",
            "habit_reminder": f"Hey! Just a friendly reminder about your habits. Ready to tackle them?",
            "motivation": f"Hello! I'm calling to give you some motivation. You've got {habit_count} habits to work on. Let's make today great!"
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
            # Get response from Groq
            response = self.groq_client.chat.completions.create(
                model="llama-3.1-70b-versatile",
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
        return f"""You are Bobo, a friendly and encouraging habit-tracking companion robot. 
You're having a VOICE conversation with a user, so keep responses:
- SHORT (1-3 sentences max)
- CONVERSATIONAL (like talking to a friend)
- ENCOURAGING and POSITIVE
- NO markdown, bullet points, or formatting
- Ask ONE question at a time

User Context:
{context}

Your goal: Help them stay motivated and track their habit progress through natural conversation."""
    
    def _build_context(self, habits: List[Dict], completions: List[Dict]) -> str:
        """Build context about user's habits"""
        if not habits:
            return "User has no habits yet."
        
        habit_names = [h['name'] for h in habits[:5]]
        completed_today = len([c for c in completions if self._is_today(c.get('completed_at'))])
        
        context = f"User has {len(habits)} habits: {', '.join(habit_names)}. "
        context += f"Completed {completed_today} habits today."
        
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
            return "That's wonderful to hear! Keep up the great work with your habits."
        
        elif any(word in user_lower for word in ['bad', 'not good', 'struggling', 'hard']):
            return "I understand it can be challenging. Remember, every small step counts. What's one habit you can focus on today?"
        
        elif any(word in user_lower for word in ['done', 'completed', 'finished']):
            return "Awesome! I'm so proud of you. Which habit did you complete?"
        
        else:
            return "I hear you. Tell me more about how your habits are going today."
    
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
        return "Great talking with you! Keep up the amazing work on your habits. Talk to you soon!"


# Singleton instance
_voice_agent: Optional[VoiceAgent] = None

def get_voice_agent(db_client=None) -> VoiceAgent:
    """Get or create Voice Agent singleton"""
    global _voice_agent
    if _voice_agent is None and db_client:
        _voice_agent = VoiceAgent(db_client)
    return _voice_agent
