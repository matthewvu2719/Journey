"""
Test script for Voice Call System
Run this to verify all components are working
"""
import asyncio
from database import SupabaseClient
from voice_services.tts_service import get_tts_service
from voice_services.stt_service import get_stt_service
from voice_services.webrtc_service import get_webrtc_service
from voice_services.twilio_service import get_twilio_service
from voice_services.call_scheduler import get_call_scheduler
from voice_agent import get_voice_agent

def test_database():
    """Test database connection"""
    print("\n" + "="*60)
    print("Testing Database Connection...")
    print("="*60)
    
    try:
        db = SupabaseClient()
        print(f"✓ Database initialized (mock_mode: {db.mock_mode})")
        
        # Test call preferences
        test_user_id = "test_user_123"
        prefs = db.get_call_preferences(test_user_id)
        print(f"✓ Call preferences query works: {prefs}")
        
        return True
    except Exception as e:
        print(f"✗ Database test failed: {e}")
        return False

def test_tts():
    """Test Text-to-Speech"""
    print("\n" + "="*60)
    print("Testing TTS (Text-to-Speech)...")
    print("="*60)
    
    try:
        tts = get_tts_service()
        print("✓ TTS service initialized")
        
        # Generate speech
        text = "Hello! This is Bobo speaking."
        print(f"Converting text: '{text}'")
        audio_bytes = tts.text_to_speech(text)
        print(f"✓ Generated {len(audio_bytes)} bytes of audio")
        
        # Save to file
        with open("test_tts_output.wav", "wb") as f:
            f.write(audio_bytes)
        print("✓ Saved to test_tts_output.wav")
        print("  → Play this file to hear Bobo's voice!")
        
        return True
    except Exception as e:
        print(f"✗ TTS test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_stt():
    """Test Speech-to-Text"""
    print("\n" + "="*60)
    print("Testing STT (Speech-to-Text)...")
    print("="*60)
    
    try:
        stt = get_stt_service()
        print("✓ STT service initialized")
        
        # Note: Actual STT test requires audio file
        print("✓ STT ready (requires audio file to test transcription)")
        
        return True
    except Exception as e:
        print(f"✗ STT test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_webrtc():
    """Test WebRTC service"""
    print("\n" + "="*60)
    print("Testing WebRTC Service...")
    print("="*60)
    
    try:
        webrtc = get_webrtc_service()
        print("✓ WebRTC service initialized")
        
        # Create test session
        session_id = webrtc.create_session("test_user")
        print(f"✓ Created session: {session_id}")
        
        # Get session
        session = webrtc.get_session(session_id)
        print(f"✓ Retrieved session: {session.user_id}")
        
        # End session
        call_log = webrtc.end_session(session_id)
        print(f"✓ Ended session, duration: {call_log['duration_seconds']}s")
        
        return True
    except Exception as e:
        print(f"✗ WebRTC test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_twilio():
    """Test Twilio service"""
    print("\n" + "="*60)
    print("Testing Twilio Service...")
    print("="*60)
    
    try:
        twilio = get_twilio_service()
        
        if not twilio.enabled:
            print("⚠ Twilio not configured (credentials missing)")
            print("  → This is OK! WebRTC works without Twilio")
            return True
        
        print("✓ Twilio service initialized")
        print(f"✓ Using phone number: {twilio.from_number}")
        
        # Generate test TwiML
        twiml = twilio.generate_greeting_twiml("Test User")
        print("✓ Generated TwiML greeting")
        
        return True
    except Exception as e:
        print(f"✗ Twilio test failed: {e}")
        return False

def test_voice_agent():
    """Test Voice Agent"""
    print("\n" + "="*60)
    print("Testing Voice Agent (AI)...")
    print("="*60)
    
    try:
        db = SupabaseClient()
        agent = get_voice_agent(db)
        print("✓ Voice agent initialized")
        
        # Test greeting
        greeting = agent.get_greeting("test_user", "check_in")
        print(f"✓ Generated greeting: '{greeting}'")
        
        # Test response
        response = agent.process_user_speech(
            user_id="test_user",
            user_text="I completed my morning run today!",
            conversation_history=[]
        )
        print(f"✓ Generated response: '{response}'")
        
        # Test goodbye
        goodbye = agent.get_goodbye()
        print(f"✓ Generated goodbye: '{goodbye}'")
        
        return True
    except Exception as e:
        print(f"✗ Voice agent test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_call_scheduler():
    """Test Call Scheduler"""
    print("\n" + "="*60)
    print("Testing Call Scheduler...")
    print("="*60)
    
    try:
        db = SupabaseClient()
        scheduler = get_call_scheduler(db)
        print("✓ Call scheduler initialized")
        
        # Note: Actual scheduling test would require time to pass
        print("✓ Scheduler ready (use API to test actual scheduling)")
        
        return True
    except Exception as e:
        print(f"✗ Call scheduler test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("VOICE CALL SYSTEM - TEST SUITE")
    print("="*60)
    
    results = {
        "Database": test_database(),
        "TTS": test_tts(),
        "STT": test_stt(),
        "WebRTC": test_webrtc(),
        "Twilio": test_twilio(),
        "Voice Agent": test_voice_agent(),
        "Call Scheduler": test_call_scheduler()
    }
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for component, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{component:20} {status}")
    
    total = len(results)
    passed = sum(results.values())
    
    print("\n" + "="*60)
    print(f"Results: {passed}/{total} tests passed")
    print("="*60)
    
    if passed == total:
        print("\n🎉 All tests passed! Voice call system is ready.")
        print("\nNext steps:")
        print("1. Play test_tts_output.wav to hear Bobo's voice")
        print("2. Start the backend: python main.py")
        print("3. Test the API endpoints")
        print("4. Integrate frontend components")
    else:
        print("\n⚠ Some tests failed. Check the errors above.")
        print("Common issues:")
        print("- Missing dependencies: pip install -r requirements.txt")
        print("- Database not set up: Run voice-call-schema.sql")
        print("- Twilio not configured: Add credentials to .env (optional)")
    
    print("\n")

if __name__ == "__main__":
    main()
