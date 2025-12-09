# Voice Call System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies (2 min)

```bash
cd journey/backend
pip install -r requirements.txt
```

This installs:
- Twilio SDK
- APScheduler (for scheduling)
- WebRTC libraries
- Audio processing (soundfile, librosa)
- Hugging Face transformers (TTS/STT)

### Step 2: Setup Database (1 min)

**Option A: Supabase (Recommended)**
1. Open Supabase SQL Editor
2. Copy contents of `voice-call-schema.sql`
3. Run the SQL

**Option B: Local PostgreSQL**
```bash
psql -U your_user -d your_database -f voice-call-schema.sql
```

### Step 3: Configure Environment (1 min)

Your `.env` file already has the voice call section. 

**For WebRTC only (FREE):**
- No additional configuration needed! ✅

**For Twilio phone calls (OPTIONAL):**
1. Sign up at [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Get $15 free credit
3. Get a phone number
4. Add to `.env`:
```env
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### Step 4: Start Backend (30 sec)

```bash
cd journey/backend
python main.py
```

You should see:
```
✓ Connected to Supabase
🎤 Initializing TTS on cpu
✓ TTS initialized
🎧 Initializing STT on cpu
✓ STT initialized
✓ WebRTC Service initialized
✓ Voice Agent initialized
✓ Call Scheduler initialized
```

### Step 5: Test It! (30 sec)

**Test TTS (Text-to-Speech):**
```bash
curl -X POST "http://localhost:8000/voice/test/tts?text=Hello%20I%20am%20Bobo" \
  --output test.wav

# Play the audio
# Windows: start test.wav
# Mac: open test.wav
# Linux: aplay test.wav
```

**Test in Frontend:**
1. Start frontend: `cd journey/frontend && npm run dev`
2. Add `VoiceCallSettings` component to your dashboard
3. Configure your preferences
4. Click "Test Call"

## 📱 Using the System

### For Users

**1. Configure Call Preferences**
- Go to Settings → Voice Calls
- Choose: Web Call (free) or Phone Call (premium)
- Set preferred times
- Save preferences

**2. Schedule Calls**
- One-time: Pick date & time
- Recurring: Select days (Mon, Wed, Fri) and time (9:00 AM)

**3. Receive Calls**
- **WebRTC**: Get notification → Tap → Talk in app
- **Twilio**: Phone rings → Answer → Talk with Bobo

### For Developers

**Add to Your Dashboard:**

```jsx
import VoiceCallSettings from './components/VoiceCallSettings';
import WebRTCCall from './components/WebRTCCall';

function Dashboard() {
  const [showCall, setShowCall] = useState(false);
  
  return (
    <div>
      {/* Settings */}
      <VoiceCallSettings userId={user.id} />
      
      {/* Call Interface */}
      {showCall && (
        <WebRTCCall 
          userId={user.id} 
          onEnd={() => setShowCall(false)} 
        />
      )}
      
      {/* Manual Call Button */}
      <button onClick={() => setShowCall(true)}>
        📞 Call Bobo Now
      </button>
    </div>
  );
}
```

**Schedule a Call Programmatically:**

```javascript
// One-time call
await fetch(`http://localhost:8000/voice/schedule/${userId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    call_method: 'webrtc',
    scheduled_time: '2024-12-09T09:00:00',
    call_purpose: 'check_in'
  })
});

// Recurring calls (Mon, Wed, Fri at 9 AM)
await fetch(`http://localhost:8000/voice/schedule/recurring/${userId}`, {
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

## 🎯 Common Use Cases

### 1. Morning Check-In
```javascript
// Schedule Bobo to call every morning at 8 AM
{
  call_method: 'webrtc',
  days_of_week: ['mon', 'tue', 'wed', 'thu', 'fri'],
  time_of_day: '08:00',
  call_purpose: 'check_in'
}
```

### 2. Evening Reminder
```javascript
// Remind user about evening habits
{
  call_method: 'webrtc',
  days_of_week: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  time_of_day: '20:00',
  call_purpose: 'habit_reminder'
}
```

### 3. Weekend Motivation
```javascript
// Motivational call on weekends
{
  call_method: 'webrtc',
  days_of_week: ['sat', 'sun'],
  time_of_day: '10:00',
  call_purpose: 'motivation'
}
```

## 🔧 Customization

### Change Bobo's Voice

Edit `voice_services/tts_service.py`:

```python
# Use different speaker embedding
embeddings_dataset = load_dataset("Matthijs/cmu-arctic-xvectors", split="validation")
self.speaker_embeddings = torch.tensor(embeddings_dataset[1234]["xvector"])  # Try different indices
```

### Adjust Conversation Length

Edit `voice_agent.py`:

```python
def should_end_conversation(self, user_text: str, turn_count: int) -> bool:
    # End after 5 turns instead of 10
    if turn_count >= 5:
        return True
```

### Change AI Model

Edit `voice_agent.py`:

```python
response = self.groq_client.chat.completions.create(
    model="llama-3.3-70b-versatile",  # Try different models
    messages=messages,
    temperature=0.7,  # Adjust creativity (0.0-1.0)
    max_tokens=150  # Adjust response length
)
```

## 📊 Monitoring

### Check Call Logs

```javascript
const response = await fetch(`http://localhost:8000/voice/history/${userId}`);
const { call_logs } = await response.json();

console.log(call_logs);
// [{
//   id: 1,
//   user_id: "...",
//   call_method: "webrtc",
//   duration_seconds: 120,
//   transcript: [...],
//   call_outcome: "completed"
// }]
```

### View Scheduled Calls

```javascript
const response = await fetch(`http://localhost:8000/voice/scheduled/${userId}`);
const { scheduled_calls } = await response.json();

console.log(scheduled_calls);
// [{
//   id: 1,
//   scheduled_time: "2024-12-09T09:00:00",
//   status: "pending",
//   call_method: "webrtc"
// }]
```

## ❓ FAQ

**Q: Do I need Twilio to use voice calls?**
A: No! WebRTC works completely free without Twilio.

**Q: How much does Twilio cost?**
A: $15 free trial, then ~$0.013/minute for calls.

**Q: Can users choose between web and phone calls?**
A: Yes! They set their preference in VoiceCallSettings.

**Q: How long do calls last?**
A: Typically 1-3 minutes. Automatically ends after 10 conversation turns.

**Q: Is the conversation private?**
A: Yes. Transcripts are stored per-user and not shared.

**Q: Can I disable voice calls?**
A: Yes. Users can toggle "Allow Bobo to call me" in settings.

**Q: What if user doesn't answer?**
A: WebRTC: Notification expires. Twilio: Marked as "no_answer" in logs.

**Q: Can I test without a real phone?**
A: Yes! Use WebRTC in browser. No phone needed.

## 🐛 Troubleshooting

**Models downloading slowly?**
- First run downloads ~1GB of models
- Subsequent runs are instant
- Use GPU for faster inference (optional)

**WebSocket connection failed?**
- Check backend is running
- Verify URL: `ws://localhost:8000/voice/webrtc/ws/{session_id}`
- Check browser console for errors

**Microphone not working?**
- Grant permissions in browser
- Check browser settings
- Try different browser (Chrome recommended)

**Twilio calls not working?**
- Verify credentials in `.env`
- Check Twilio dashboard for errors
- Ensure phone number format: +1234567890

## 🎉 You're Ready!

The voice call system is now set up. Users can:
- ✅ Configure call preferences
- ✅ Schedule calls (one-time or recurring)
- ✅ Have voice conversations with Bobo
- ✅ View call history

Next steps:
- Add push notifications (Firebase)
- Customize Bobo's personality
- Add more call purposes
- Implement call analytics

For detailed documentation, see `VOICE_CALL_SYSTEM.md`
