# Voice Call System Documentation

## Overview

The Journey app now includes a **Voice Call System** that allows Bobo (your AI habit companion) to have voice conversations with users. The system supports two methods:

1. **WebRTC (Free)** - Browser-based voice calls with push notifications
2. **Twilio (Premium)** - Real phone calls to user's phone number

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Call Scheduler Service                      │
│  (APScheduler - checks scheduled calls)                 │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ User Settings │
         │ call_method?  │
         └───────┬───────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│   WebRTC     │   │    Twilio    │
│  (Free)      │   │   (Paid)     │
└──────┬───────┘   └──────┬───────┘
       │                  │
       └────────┬─────────┘
                ▼
    ┌─────────────────────┐
    │  Shared TTS/STT     │
    │  (Hugging Face)     │
    └─────────┬───────────┘
              ▼
    ┌─────────────────────┐
    │  Voice Agent (AI)   │
    │  (Groq + Context)   │
    └─────────────────────┘
```

## Tech Stack

### Backend (Python)
- **TTS**: `microsoft/speecht5_tts` (Hugging Face)
- **STT**: `openai/whisper-base` (Hugging Face)
- **WebRTC**: `aiortc` + WebSockets
- **Twilio**: `twilio` SDK
- **Scheduling**: `APScheduler`
- **AI**: Groq API (llama-3.1-70b-versatile)

### Frontend (React)
- **WebRTC**: Native WebRTC APIs
- **Audio**: Web Audio API
- **UI**: React + Tailwind CSS

## Database Schema

### Tables Created

1. **call_preferences** - User's call settings
   - `user_id` (UUID, FK to users)
   - `call_method` (webrtc | twilio)
   - `phone_number` (for Twilio)
   - `allow_calls` (boolean)
   - `preferred_times` (JSONB array)

2. **scheduled_calls** - Scheduled call entries
   - `id` (serial)
   - `user_id` (UUID, FK)
   - `call_method` (webrtc | twilio)
   - `scheduled_time` (timestamp)
   - `call_purpose` (check_in | habit_reminder | motivation)
   - `status` (pending | in_progress | completed | failed | cancelled)
   - `call_sid` (Twilio SID)

3. **call_logs** - Call history
   - `id` (serial)
   - `user_id` (UUID, FK)
   - `call_method` (webrtc | twilio)
   - `duration_seconds` (integer)
   - `transcript` (JSONB)
   - `call_outcome` (completed | no_answer | busy | failed)

## Setup Instructions

### 1. Install Dependencies

```bash
cd journey/backend
pip install -r requirements.txt
```

New packages added:
- `twilio==8.10.0`
- `apscheduler==3.10.4`
- `redis==5.0.1`
- `websockets==12.0`
- `aiortc==1.6.0`
- `soundfile==0.12.1`
- `librosa==0.10.1`

### 2. Database Setup

Run the SQL schema:

```bash
psql -U your_user -d your_database -f voice-call-schema.sql
```

Or in Supabase SQL Editor, paste contents of `voice-call-schema.sql`

### 3. Environment Variables

Update `.env` file:

```env
# Voice Call System
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
API_BASE_URL=http://localhost:8000

# Optional: Firebase for push notifications
FCM_SERVER_KEY=your_fcm_key_here
```

**Note**: Twilio credentials are optional. System works with WebRTC only if not provided.

### 4. Get Twilio Credentials (Optional)

1. Sign up at [twilio.com](https://www.twilio.com)
2. Get $15 free trial credit
3. Get a phone number
4. Copy Account SID, Auth Token, and Phone Number to `.env`

### 5. Start Backend

```bash
cd journey/backend
python main.py
```

The voice routes will be available at `/voice/*`

## API Endpoints

### Call Preferences

```
GET  /voice/preferences/{user_id}
POST /voice/preferences/{user_id}
```

### Schedule Calls

```
POST /voice/schedule/{user_id}
POST /voice/schedule/recurring/{user_id}
GET  /voice/scheduled/{user_id}
DELETE /voice/scheduled/{call_id}
```

### WebRTC

```
POST /voice/webrtc/start/{user_id}
WS   /voice/webrtc/ws/{session_id}
POST /voice/webrtc/end/{session_id}
```

### Twilio

```
POST /voice/twilio/answer
POST /voice/twilio/process
POST /voice/twilio/status
```

### Call History

```
GET /voice/history/{user_id}
```

## Frontend Components

### 1. VoiceCallSettings.jsx

User interface for configuring call preferences:
- Choose call method (WebRTC or Twilio)
- Set phone number (for Twilio)
- Enable/disable calls
- Set preferred call times

```jsx
import VoiceCallSettings from './components/VoiceCallSettings';

<VoiceCallSettings userId={currentUser.id} />
```

### 2. WebRTCCall.jsx

In-app voice call interface:
- Real-time audio streaming
- Live transcript
- Call controls (mute, end)

```jsx
import WebRTCCall from './components/WebRTCCall';

{showCall && (
  <WebRTCCall 
    userId={currentUser.id} 
    onEnd={() => setShowCall(false)} 
  />
)}
```

## Usage Examples

### Schedule a One-Time Call

```javascript
const response = await fetch(`http://localhost:8000/voice/schedule/${userId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    call_method: 'webrtc',
    scheduled_time: '2024-12-09T09:00:00',
    call_purpose: 'check_in'
  })
});
```

### Schedule Recurring Calls

```javascript
const response = await fetch(`http://localhost:8000/voice/schedule/recurring/${userId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    call_method: 'webrtc',
    days_of_week: ['mon', 'wed', 'fri'],
    time_of_day: '09:00',
    call_purpose: 'habit_reminder'
  })
});
```

### Start Manual WebRTC Call

```javascript
const response = await fetch(`http://localhost:8000/voice/webrtc/start/${userId}`, {
  method: 'POST'
});
const { session_id, greeting } = await response.json();

// Connect WebSocket
const ws = new WebSocket(`ws://localhost:8000/voice/webrtc/ws/${session_id}`);
```

## How It Works

### WebRTC Flow

1. **User opens app** → Sees notification "Bobo wants to talk!"
2. **User taps notification** → Opens WebRTC call interface
3. **Call starts** → Bobo greets user with TTS
4. **User speaks** → Audio captured, sent to server
5. **Server processes** → STT → AI response → TTS
6. **Bobo responds** → Audio played back to user
7. **Conversation continues** → Back and forth until goodbye
8. **Call ends** → Transcript saved to database

### Twilio Flow

1. **Scheduled time arrives** → Server initiates Twilio call
2. **User's phone rings** → User answers
3. **Bobo speaks** → TwiML + Twilio TTS
4. **User speaks** → Twilio STT → Server
5. **Server processes** → AI response → TwiML
6. **Bobo responds** → Twilio speaks response
7. **Conversation continues** → Until goodbye
8. **Call ends** → Transcript saved, Twilio charges applied

## Voice Agent Behavior

The Voice Agent (`voice_agent.py`) handles conversation logic:

- **Context-aware**: Knows user's habits and progress
- **Concise**: Keeps responses short (1-3 sentences)
- **Encouraging**: Positive and motivational tone
- **Natural**: Conversational, not robotic
- **Smart ending**: Detects when to end call (goodbye phrases or 10 turns)

Example conversation:
```
Bobo: "Hi there! It's Bobo. I wanted to check in on your 5 habits today. How are things going?"
User: "Pretty good! I completed my morning run."
Bobo: "That's wonderful to hear! Keep up the great work. What about your other habits?"
User: "Still working on them."
Bobo: "You've got this! Remember, every small step counts. Talk to you soon!"
```

## Cost Breakdown

| Feature | Free Tier | Cost After Free |
|---------|-----------|-----------------|
| WebRTC Calls | ✅ Unlimited | ✅ Always free |
| Push Notifications | ✅ Unlimited (FCM) | ✅ Always free |
| Twilio Phone Calls | $15 trial credit (~1000 mins) | ~$0.013/min |
| Hugging Face TTS/STT | ✅ Free (self-hosted) | ✅ Always free |
| Groq AI | ✅ Free tier | Pay-as-you-go |

**Recommendation**: Start with WebRTC (100% free), add Twilio as premium feature later.

## Testing

### Test TTS

```bash
curl -X POST "http://localhost:8000/voice/test/tts?text=Hello%20from%20Bobo" \
  --output test.wav
```

### Test WebRTC Call

1. Open frontend
2. Navigate to Voice Settings
3. Click "Test Call" button
4. Speak into microphone
5. Hear Bobo's response

### Test Twilio (with credentials)

```bash
curl -X POST "http://localhost:8000/voice/schedule/test_user" \
  -H "Content-Type: application/json" \
  -d '{
    "call_method": "twilio",
    "scheduled_time": "2024-12-09T10:00:00",
    "phone_number": "+1234567890"
  }'
```

## Troubleshooting

### Issue: "Microphone access denied"
**Solution**: Grant microphone permissions in browser settings

### Issue: "Twilio calls not working"
**Solution**: 
1. Check Twilio credentials in `.env`
2. Verify phone number format (+1234567890)
3. Check Twilio account balance

### Issue: "TTS/STT models not loading"
**Solution**: 
1. Ensure sufficient RAM (4GB+ recommended)
2. Models download on first use (may take time)
3. Check internet connection

### Issue: "WebSocket connection failed"
**Solution**:
1. Ensure backend is running
2. Check CORS settings
3. Verify WebSocket URL

## Future Enhancements

- [ ] Emotion detection from voice
- [ ] Multi-language support
- [ ] Voice customization (different Bobo voices)
- [ ] Call recording playback
- [ ] Group calls (multiple users)
- [ ] Video calls with Bobo avatar
- [ ] Integration with calendar apps
- [ ] Smart call timing (ML-based optimal times)

## Security Considerations

- ✅ User consent required for calls
- ✅ Phone numbers encrypted in database
- ✅ Call transcripts private to user
- ✅ WebRTC uses secure WebSocket (WSS in production)
- ✅ Twilio uses HTTPS for all requests
- ⚠️ Add rate limiting for call scheduling
- ⚠️ Implement call duration limits
- ⚠️ Add abuse detection

## Support

For issues or questions:
1. Check this documentation
2. Review error logs in backend console
3. Test with `/voice/test/*` endpoints
4. Check Twilio dashboard for call logs

## License

Part of Journey - Personal Habit Coach application.
