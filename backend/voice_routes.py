"""
Voice Call API Routes
Handles both WebRTC and Twilio endpoints
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Request, Form
from fastapi.responses import Response
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
import json
import base64

from database import SupabaseClient
from voice_services.tts_service import get_tts_service
from voice_services.stt_service import get_stt_service
from voice_services.webrtc_service import get_webrtc_service
from voice_services.twilio_service import get_twilio_service
from voice_services.call_scheduler import get_call_scheduler
from voice_agent import get_voice_agent

router = APIRouter(prefix="/voice", tags=["voice"])

# Initialize services
db = SupabaseClient()
tts_service = get_tts_service()
stt_service = get_stt_service()
webrtc_service = get_webrtc_service()
twilio_service = get_twilio_service()
voice_agent = get_voice_agent(db)
call_scheduler = get_call_scheduler(db)


# ========================================================================
# PYDANTIC MODELS
# ========================================================================

class CallPreferences(BaseModel):
    call_method: str  # 'webrtc' or 'twilio'
    phone_number: Optional[str] = None
    allow_calls: bool = True
    preferred_times: List[dict] = []

class ScheduleCallRequest(BaseModel):
    call_method: str
    scheduled_time: str  # ISO format
    call_purpose: str = "check_in"
    phone_number: Optional[str] = None

class RecurringCallRequest(BaseModel):
    call_method: str
    days_of_week: List[str]  # ['mon', 'tue', ...]
    time_of_day: str  # 'HH:MM'
    call_purpose: str = "check_in"
    phone_number: Optional[str] = None


# ========================================================================
# CALL PREFERENCES
# ========================================================================

@router.get("/preferences/{user_id}")
async def get_call_preferences(user_id: str):
    """Get user's call preferences"""
    prefs = db.get_call_preferences(user_id)
    
    if not prefs:
        # Return defaults
        return {
            "call_method": "webrtc",
            "phone_number": None,
            "allow_calls": True,
            "preferred_times": []
        }
    
    return prefs

@router.post("/preferences/{user_id}")
async def save_call_preferences(user_id: str, preferences: CallPreferences):
    """Save user's call preferences"""
    # Validate
    if preferences.call_method not in ['webrtc', 'twilio']:
        raise HTTPException(400, "Invalid call_method")
    
    if preferences.call_method == 'twilio' and not preferences.phone_number:
        raise HTTPException(400, "Phone number required for Twilio calls")
    
    # Save
    result = db.save_call_preferences(user_id, preferences.dict())
    return {"success": True, "preferences": result}


# ========================================================================
# SCHEDULE CALLS
# ========================================================================

@router.post("/schedule/{user_id}")
async def schedule_call(user_id: str, request: ScheduleCallRequest):
    """Schedule a one-time call"""
    scheduled_time = datetime.fromisoformat(request.scheduled_time)
    
    result = call_scheduler.schedule_call(
        user_id=user_id,
        call_method=request.call_method,
        scheduled_time=scheduled_time,
        call_purpose=request.call_purpose,
        phone_number=request.phone_number
    )
    
    return {"success": True, "scheduled_call": result}

@router.post("/schedule/recurring/{user_id}")
async def schedule_recurring_call(user_id: str, request: RecurringCallRequest):
    """Schedule recurring calls"""
    result = call_scheduler.schedule_recurring_call(
        user_id=user_id,
        call_method=request.call_method,
        days_of_week=request.days_of_week,
        time_of_day=request.time_of_day,
        call_purpose=request.call_purpose,
        phone_number=request.phone_number
    )
    
    return {"success": True, "recurring_schedule": result}

@router.get("/scheduled/{user_id}")
async def get_scheduled_calls(user_id: str):
    """Get user's scheduled calls"""
    calls = db.get_scheduled_calls(user_id)
    return {"scheduled_calls": calls}

@router.delete("/scheduled/{call_id}")
async def cancel_scheduled_call(call_id: int):
    """Cancel a scheduled call"""
    success = call_scheduler.cancel_call(call_id)
    return {"success": success}


# ========================================================================
# WEBRTC ENDPOINTS
# ========================================================================

@router.post("/webrtc/start/{user_id}")
async def start_webrtc_call(user_id: str):
    """Start a WebRTC call session"""
    session_id = webrtc_service.create_session(user_id)
    
    # Get greeting
    greeting = voice_agent.get_greeting(user_id)
    
    # Generate greeting audio with consistent voice
    greeting_audio = tts_service.text_to_speech(greeting)
    
    return {
        "session_id": session_id,
        "greeting": greeting,
        "greeting_audio": base64.b64encode(greeting_audio).decode()
    }

@router.websocket("/webrtc/ws/{session_id}")
async def webrtc_websocket(websocket: WebSocket, session_id: str):
    """WebSocket for WebRTC signaling and audio"""
    await websocket.accept()
    
    session = webrtc_service.get_session(session_id)
    if not session:
        await websocket.close(code=1008, reason="Invalid session")
        return
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            if msg_type == "audio":
                # User spoke - transcribe and respond
                audio_data = data.get("audio")
                audio_format = data.get("format", "audio/webm")
                
                # Decode base64 audio
                audio_bytes = base64.b64decode(audio_data)
                
                print(f"Received audio: {len(audio_bytes)} bytes, format: {audio_format}")
                
                # Transcribe
                try:
                    user_text = stt_service.speech_to_text(audio_bytes)
                    print(f"📝 Transcribed: '{user_text}' (length: {len(user_text)})")
                    
                    # Check if transcription is too short or empty
                    if not user_text or len(user_text.strip()) < 2:
                        print("⚠️  Transcription too short or empty")
                        print(f"   Audio size: {len(audio_bytes)} bytes")
                        print(f"   Format: {audio_format}")
                        user_text = "[Audio unclear - please speak louder or check microphone]"
                    
                    session.add_transcript("user", user_text)
                except Exception as e:
                    print(f"❌ Transcription error: {e}")
                    import traceback
                    traceback.print_exc()
                    user_text = "[Audio processing failed - please try again]"
                    session.add_transcript("user", user_text)
                
                # Get AI response
                bobo_text = voice_agent.process_user_speech(
                    user_id=session.user_id,
                    user_text=user_text,
                    conversation_history=session.transcript
                )
                session.add_transcript("bobo", bobo_text)
                
                # Convert to speech
                bobo_audio = tts_service.text_to_speech(bobo_text)
                
                # Send back (base64 encoded) with user's transcribed text
                await websocket.send_json({
                    "type": "response",
                    "user_text": user_text,
                    "text": bobo_text,
                    "audio": base64.b64encode(bobo_audio).decode()
                })
                
                # Check if should end
                if voice_agent.should_end_conversation(user_text, len(session.transcript) // 2):
                    goodbye = voice_agent.get_goodbye()
                    goodbye_audio = tts_service.text_to_speech(goodbye)
                    
                    await websocket.send_json({
                        "type": "goodbye",
                        "text": goodbye,
                        "audio": base64.b64encode(goodbye_audio).decode()
                    })
                    break
            
            elif msg_type == "end":
                # User ended call
                break
    
    except WebSocketDisconnect:
        pass
    
    finally:
        # End session and save log
        call_log = webrtc_service.end_session(session_id)
        if call_log:
            db.create_call_log(call_log)

@router.post("/webrtc/end/{session_id}")
async def end_webrtc_call(session_id: str):
    """End a WebRTC call"""
    call_log = webrtc_service.end_session(session_id)
    
    if call_log:
        db.create_call_log(call_log)
        return {"success": True, "call_log": call_log}
    
    return {"success": False}


# ========================================================================
# TWILIO ENDPOINTS
# ========================================================================

@router.post("/twilio/answer")
async def twilio_answer(request: Request):
    """Handle incoming Twilio call (TwiML response)"""
    form_data = await request.form()
    call_sid = form_data.get("CallSid")
    from_number = form_data.get("From")
    
    # Find user by phone number
    # (In production, implement proper user lookup)
    user_name = "there"
    
    # Generate greeting TwiML
    twiml = twilio_service.generate_greeting_twiml(user_name)
    
    return Response(content=twiml, media_type="application/xml")

@router.post("/twilio/process")
async def twilio_process(request: Request):
    """Process user's speech from Twilio call"""
    form_data = await request.form()
    call_sid = form_data.get("CallSid")
    speech_result = form_data.get("SpeechResult", "")
    
    # Get call info
    call_info = twilio_service.active_calls.get(call_sid, {})
    user_id = call_info.get("user_id", "default_user")
    
    # Get conversation history from database
    # (Simplified - in production, maintain session state)
    conversation_history = []
    
    # Get AI response
    bobo_text = voice_agent.process_user_speech(
        user_id=user_id,
        user_text=speech_result,
        conversation_history=conversation_history
    )
    
    # Check if should end
    should_end = voice_agent.should_end_conversation(speech_result, len(conversation_history) // 2)
    
    if should_end:
        bobo_text = voice_agent.get_goodbye()
    
    # Generate TwiML response
    twiml = twilio_service.generate_response_twiml(bobo_text, continue_conversation=not should_end)
    
    return Response(content=twiml, media_type="application/xml")

@router.post("/twilio/status")
async def twilio_status(request: Request):
    """Handle Twilio call status updates"""
    form_data = await request.form()
    call_sid = form_data.get("CallSid")
    call_status = form_data.get("CallStatus")
    call_duration = form_data.get("CallDuration", "0")
    
    print(f"📞 Twilio call {call_sid} status: {call_status}")
    
    # Update scheduled call status
    if call_status == "completed":
        # Find scheduled call by SID
        # (In production, implement proper lookup)
        pass
    
    return {"success": True}


# ========================================================================
# CALL HISTORY
# ========================================================================

@router.get("/history/{user_id}")
async def get_call_history(user_id: str, limit: int = 50):
    """Get user's call history"""
    logs = db.get_call_logs(user_id, limit=limit)
    return {"call_logs": logs}


# ========================================================================
# TEST ENDPOINTS
# ========================================================================

@router.post("/test/tts")
async def test_tts(text: str = "Hello! This is Bobo speaking."):
    """Test TTS service"""
    audio_bytes = tts_service.text_to_speech(text)
    return Response(content=audio_bytes, media_type="audio/wav")

@router.post("/test/stt")
async def test_stt(audio_file: bytes):
    """Test STT service"""
    text = stt_service.speech_to_text(audio_file)
    return {"transcription": text}
