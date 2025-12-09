# Voice Services Package

This package contains all the core services for the voice call system.

## Services

### 1. TTS Service (`tts_service.py`)

**Text-to-Speech using Hugging Face**

Converts Bobo's text responses into natural-sounding speech.

```python
from voice_services.tts_service import get_tts_service

tts = get_tts_service()
audio_bytes = tts.text_to_speech("Hello! I'm Bobo.")
```

**Features:**
- Uses `microsoft/speecht5_tts` model
- Generates 16kHz WAV audio
- Singleton pattern for efficiency
- GPU support (auto-detected)

**Configuration:**
- No configuration needed
- Models auto-download on first use (~500MB)
- Uses CPU by default, GPU if available

---

### 2. STT Service (`stt_service.py`)

**Speech-to-Text using Whisper**

Transcribes user's speech into text.

```python
from voice_services.stt_service import get_stt_service

stt = get_stt_service()
text = stt.speech_to_text(audio_bytes)
```

**Features:**
- Uses `openai/whisper-base` model
- Supports multiple audio formats
- Optimized for English
- Fast transcription (<1 second)

**Configuration:**
- No configuration needed
- Models auto-download on first use (~150MB)
- Can upgrade to `whisper-large-v3` for better accuracy

---

### 3. WebRTC Service (`webrtc_service.py`)

**Browser-based voice calls**

Manages WebRTC sessions and audio streaming.

```python
from voice_services.webrtc_service import get_webrtc_service

webrtc = get_webrtc_service()
session_id = webrtc.create_session(user_id)
```

**Features:**
- WebSocket-based signaling
- Real-time audio streaming
- Session management
- Transcript storage

**Usage:**
1. Create session
2. Connect WebSocket
3. Stream audio
4. End session

---

### 4. Twilio Service (`twilio_service.py`)

**Phone call integration**

Handles real phone calls via Twilio.

```python
from voice_services.twilio_service import get_twilio_service

twilio = get_twilio_service()
call_sid = twilio.make_call(
    to_number="+1234567890",
    user_id="user123"
)
```

**Features:**
- Outbound call initiation
- TwiML generation
- Call status tracking
- Webhook handling

**Configuration:**
Required environment variables:
```env
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Optional:** System works without Twilio (WebRTC only)

---

### 5. Call Scheduler (`call_scheduler.py`)

**Scheduled call management**

Schedules and executes calls at specified times.

```python
from voice_services.call_scheduler import get_call_scheduler

scheduler = get_call_scheduler(db_client)
scheduler.schedule_call(
    user_id="user123",
    call_method="webrtc",
    scheduled_time=datetime(2024, 12, 9, 9, 0)
)
```

**Features:**
- One-time scheduling
- Recurring schedules (cron-based)
- Notification sending (WebRTC)
- Call initiation (Twilio)

**Scheduling Examples:**

```python
# One-time call
scheduler.schedule_call(
    user_id="user123",
    call_method="webrtc",
    scheduled_time=datetime(2024, 12, 9, 9, 0),
    call_purpose="check_in"
)

# Recurring calls (Mon, Wed, Fri at 9 AM)
scheduler.schedule_recurring_call(
    user_id="user123",
    call_method="webrtc",
    days_of_week=['mon', 'wed', 'fri'],
    time_of_day='09:00',
    call_purpose="habit_reminder"
)
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Call Scheduler                   │
│  (Manages timing and execution)         │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌─────────┐      ┌─────────┐
│ WebRTC  │      │ Twilio  │
│ Service │      │ Service │
└────┬────┘      └────┬────┘
     │                │
     └────────┬───────┘
              ▼
      ┌───────────────┐
      │  TTS Service  │
      │  STT Service  │
      └───────────────┘
```

## Singleton Pattern

All services use the singleton pattern for efficiency:

```python
# First call initializes
tts = get_tts_service()  # Loads models

# Subsequent calls reuse instance
tts = get_tts_service()  # Instant
```

## Error Handling

All services include error handling:

```python
try:
    audio = tts.text_to_speech("Hello")
except Exception as e:
    print(f"TTS error: {e}")
    # Fallback to Web Speech API
```

## Performance

### TTS
- First call: ~2 seconds (model loading)
- Subsequent calls: <1 second
- GPU: 3-5x faster

### STT
- First call: ~1 second (model loading)
- Subsequent calls: <500ms
- GPU: 2-3x faster

### WebRTC
- Session creation: <100ms
- Audio streaming: Real-time
- Latency: <200ms

### Twilio
- Call initiation: ~1 second
- Audio quality: High (phone network)
- Latency: ~300ms

## Testing

Test individual services:

```python
# Test TTS
from voice_services.tts_service import get_tts_service
tts = get_tts_service()
audio = tts.text_to_speech("Test")
with open("test.wav", "wb") as f:
    f.write(audio)

# Test STT
from voice_services.stt_service import get_stt_service
stt = get_stt_service()
text = stt.speech_to_text_file("test.wav")
print(text)

# Test WebRTC
from voice_services.webrtc_service import get_webrtc_service
webrtc = get_webrtc_service()
session_id = webrtc.create_session("test_user")
print(f"Session: {session_id}")

# Test Twilio
from voice_services.twilio_service import get_twilio_service
twilio = get_twilio_service()
print(f"Enabled: {twilio.enabled}")
```

Or run the complete test suite:

```bash
python test_voice_system.py
```

## Customization

### Change TTS Voice

Edit `tts_service.py`:

```python
# Use different speaker embedding
embeddings_dataset = load_dataset("Matthijs/cmu-arctic-xvectors", split="validation")
self.speaker_embeddings = torch.tensor(embeddings_dataset[1234]["xvector"])
```

### Upgrade STT Model

Edit `stt_service.py`:

```python
# Use larger model for better accuracy
self.processor = WhisperProcessor.from_pretrained("openai/whisper-large-v3")
self.model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-large-v3")
```

### Adjust Scheduling

Edit `call_scheduler.py`:

```python
# Change default call duration limit
MAX_CALL_DURATION = 300  # 5 minutes

# Change retry logic
MAX_RETRIES = 3
RETRY_DELAY = 60  # seconds
```

## Dependencies

```
transformers>=4.36.0
torch>=2.1.0
soundfile>=0.12.1
librosa>=0.10.1
twilio>=8.10.0
apscheduler>=3.10.4
websockets>=12.0
aiortc>=1.6.0
```

## Environment Variables

```env
# Optional: Twilio (for phone calls)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Required: API base URL (for Twilio callbacks)
API_BASE_URL=http://localhost:8000
```

## Troubleshooting

### Models not loading
- Check internet connection
- Ensure sufficient disk space (~1GB)
- Check Hugging Face Hub status

### WebSocket errors
- Verify backend is running
- Check firewall settings
- Ensure WebSocket support in proxy

### Twilio errors
- Verify credentials in `.env`
- Check Twilio account balance
- Verify phone number format

### Performance issues
- Use GPU if available
- Reduce model size (whisper-base vs large)
- Implement caching
- Use async operations

## Support

For issues with voice services:
1. Check service logs
2. Run test suite
3. Verify dependencies
4. Check environment variables
5. Review documentation

## License

Part of Journey - Personal Habit Coach application.
