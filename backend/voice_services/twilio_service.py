"""
Twilio Service for phone calls
Handles outbound calls and TwiML responses
"""
import os
from typing import Optional, Dict
from datetime import datetime
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather
from dotenv import load_dotenv

load_dotenv()

class TwilioService:
    """Manages Twilio phone calls"""
    
    def __init__(self):
        # Load Twilio credentials
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = os.getenv("TWILIO_PHONE_NUMBER")
        
        if not account_sid or not auth_token:
            print("⚠️  Twilio credentials not found - phone calls disabled")
            self.client = None
            self.enabled = False
        else:
            self.client = Client(account_sid, auth_token)
            self.enabled = True
            print("✓ Twilio Service initialized")
        
        self.active_calls: Dict[str, Dict] = {}
    
    def make_call(
        self,
        to_number: str,
        user_id: str,
        call_purpose: str = "check_in",
        callback_url: str = None
    ) -> Optional[str]:
        """
        Initiate an outbound call
        
        Args:
            to_number: Phone number to call
            user_id: User ID
            call_purpose: Purpose of call
            callback_url: URL for TwiML instructions
        
        Returns:
            Call SID or None if failed
        """
        if not self.enabled:
            print("⚠️  Twilio not enabled")
            return None
        
        try:
            # Create call
            call = self.client.calls.create(
                to=to_number,
                from_=self.from_number,
                url=callback_url or f"{os.getenv('API_BASE_URL')}/voice/twilio/answer",
                status_callback=f"{os.getenv('API_BASE_URL')}/voice/twilio/status",
                status_callback_event=['initiated', 'ringing', 'answered', 'completed'],
                method='POST'
            )
            
            # Track call
            self.active_calls[call.sid] = {
                "user_id": user_id,
                "call_purpose": call_purpose,
                "started_at": datetime.now(),
                "to_number": to_number
            }
            
            print(f"📞 Initiated call {call.sid} to {to_number}")
            return call.sid
        
        except Exception as e:
            print(f"❌ Error making call: {e}")
            return None
    
    def generate_greeting_twiml(self, user_name: str = "there") -> str:
        """
        Generate TwiML for initial greeting
        
        Returns:
            TwiML XML string
        """
        response = VoiceResponse()
        
        # Greeting
        response.say(
            f"Hello {user_name}! This is Bobo, your habit companion. "
            "I'm calling to check in on your progress today.",
            voice='Polly.Joanna'
        )
        
        # Gather user response
        gather = Gather(
            input='speech',
            action='/voice/twilio/process',
            method='POST',
            speech_timeout='auto',
            language='en-US'
        )
        gather.say(
            "How are you doing with your habits today? Please speak after the tone.",
            voice='Polly.Joanna'
        )
        response.append(gather)
        
        # Fallback if no input
        response.say(
            "I didn't hear anything. Goodbye!",
            voice='Polly.Joanna'
        )
        
        return str(response)
    
    def generate_response_twiml(self, bobo_message: str, continue_conversation: bool = True) -> str:
        """
        Generate TwiML for Bobo's response
        
        Args:
            bobo_message: What Bobo should say
            continue_conversation: Whether to gather more input
        
        Returns:
            TwiML XML string
        """
        response = VoiceResponse()
        
        if continue_conversation:
            gather = Gather(
                input='speech',
                action='/voice/twilio/process',
                method='POST',
                speech_timeout='auto',
                language='en-US'
            )
            gather.say(bobo_message, voice='Polly.Joanna')
            response.append(gather)
        else:
            response.say(bobo_message, voice='Polly.Joanna')
            response.hangup()
        
        return str(response)
    
    def get_call_info(self, call_sid: str) -> Optional[Dict]:
        """Get information about a call"""
        if not self.enabled:
            return None
        
        try:
            call = self.client.calls(call_sid).fetch()
            return {
                "sid": call.sid,
                "status": call.status,
                "duration": call.duration,
                "from": call.from_,
                "to": call.to,
                "start_time": call.start_time,
                "end_time": call.end_time
            }
        except Exception as e:
            print(f"Error fetching call info: {e}")
            return None
    
    def end_call(self, call_sid: str) -> bool:
        """End an active call"""
        if not self.enabled:
            return False
        
        try:
            self.client.calls(call_sid).update(status='completed')
            
            # Remove from active calls
            if call_sid in self.active_calls:
                del self.active_calls[call_sid]
            
            print(f"📞 Ended call {call_sid}")
            return True
        except Exception as e:
            print(f"Error ending call: {e}")
            return False


# Singleton instance
_twilio_service: Optional[TwilioService] = None

def get_twilio_service() -> TwilioService:
    """Get or create Twilio service singleton"""
    global _twilio_service
    if _twilio_service is None:
        _twilio_service = TwilioService()
    return _twilio_service
