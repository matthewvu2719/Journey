# Voice Call System - Integration Checklist

Use this checklist to integrate the voice call system into your Journey app.

## ✅ Backend Setup

### 1. Dependencies
- [ ] Run `pip install -r requirements.txt`
- [ ] Verify installations:
  - [ ] `twilio`
  - [ ] `apscheduler`
  - [ ] `websockets`
  - [ ] `aiortc`
  - [ ] `soundfile`
  - [ ] `librosa`
  - [ ] `transformers` (Hugging Face)

### 2. Database
- [ ] Run `voice-call-schema.sql` in your database
- [ ] Verify tables created:
  - [ ] `call_preferences`
  - [ ] `scheduled_calls`
  - [ ] `call_logs`
- [ ] Test database connection

### 3. Environment Variables
- [ ] Update `.env` with voice call section
- [ ] (Optional) Add Twilio credentials:
  - [ ] `TWILIO_ACCOUNT_SID`
  - [ ] `TWILIO_AUTH_TOKEN`
  - [ ] `TWILIO_PHONE_NUMBER`
- [ ] Set `API_BASE_URL`

### 4. Backend Code
- [ ] Voice services created in `backend/voice_services/`
- [ ] `voice_agent.py` created
- [ ] `voice_routes.py` created
- [ ] Routes imported in `main.py`
- [ ] Test backend starts without errors

### 5. Testing
- [ ] Run `python test_voice_system.py`
- [ ] All tests pass (or Twilio skipped if not configured)
- [ ] Play `test_tts_output.wav` to hear Bobo's voice
- [ ] Test API endpoints with curl/Postman

## ✅ Frontend Setup

### 1. Components
- [ ] `VoiceCallSettings.jsx` created
- [ ] `WebRTCCall.jsx` created
- [ ] `VoiceCallButton.jsx` created
- [ ] Components compile without errors

### 2. Dependencies
- [ ] No new npm packages needed (uses native APIs)
- [ ] Verify browser supports:
  - [ ] WebRTC
  - [ ] WebSockets
  - [ ] Web Audio API
  - [ ] MediaRecorder API

### 3. Integration
- [ ] Import components where needed
- [ ] Pass `userId` prop correctly
- [ ] Test component rendering

## ✅ Feature Testing

### WebRTC Calls
- [ ] User can open call settings
- [ ] User can select "Web Call" method
- [ ] User can set preferred times
- [ ] User can save preferences
- [ ] User can start a manual call
- [ ] Call interface appears
- [ ] Microphone permission requested
- [ ] User can speak and hear response
- [ ] Transcript displays correctly
- [ ] User can end call
- [ ] Call log saved to database

### Twilio Calls (if configured)
- [ ] User can select "Phone Call" method
- [ ] User can enter phone number
- [ ] User can save preferences
- [ ] Scheduled call initiates phone call
- [ ] User receives call on phone
- [ ] Bobo speaks greeting
- [ ] User can respond
- [ ] Conversation flows naturally
- [ ] Call ends properly
- [ ] Call log saved with Twilio SID

### Scheduling
- [ ] User can schedule one-time call
- [ ] User can schedule recurring calls
- [ ] User can view scheduled calls
- [ ] User can cancel scheduled calls
- [ ] Scheduled calls execute at correct time
- [ ] Notifications sent for WebRTC calls

### Call History
- [ ] User can view call history
- [ ] Transcripts display correctly
- [ ] Call duration shown
- [ ] Call outcome recorded

## ✅ User Experience

### Settings Page
- [ ] Clear explanation of call methods
- [ ] Visual distinction between free/premium
- [ ] Phone number validation
- [ ] Preferred times easy to configure
- [ ] Save button works
- [ ] Success/error messages shown

### Call Interface
- [ ] Clean, intuitive design
- [ ] Clear call status indicators
- [ ] Transcript easy to read
- [ ] Controls accessible
- [ ] Mute button works
- [ ] End call button works
- [ ] Loading states shown

### Notifications
- [ ] Push notifications sent (if configured)
- [ ] Notification text clear
- [ ] Tapping notification opens call
- [ ] Notification dismissed after call

## ✅ Performance

### Backend
- [ ] TTS generates audio in <2 seconds
- [ ] STT transcribes in <1 second
- [ ] AI response in <3 seconds
- [ ] WebSocket connections stable
- [ ] No memory leaks
- [ ] Handles multiple concurrent calls

### Frontend
- [ ] Components load quickly
- [ ] Audio playback smooth
- [ ] No UI freezing
- [ ] WebSocket reconnects on disconnect
- [ ] Graceful error handling

## ✅ Security

### Backend
- [ ] User authentication required
- [ ] Phone numbers encrypted
- [ ] Transcripts private to user
- [ ] Rate limiting on call scheduling
- [ ] Input validation on all endpoints
- [ ] CORS configured correctly

### Frontend
- [ ] Microphone permission requested
- [ ] User consent for calls
- [ ] Secure WebSocket (WSS in production)
- [ ] No sensitive data in logs
- [ ] XSS protection

## ✅ Production Readiness

### Configuration
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] SSL certificates configured (for WSS)
- [ ] Twilio webhooks configured (if using)
- [ ] Error tracking set up (Sentry, etc.)

### Monitoring
- [ ] Call logs being saved
- [ ] Error logs being captured
- [ ] Performance metrics tracked
- [ ] User feedback mechanism

### Documentation
- [ ] User guide created
- [ ] API documentation updated
- [ ] Troubleshooting guide available
- [ ] Support contact provided

### Deployment
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Database updated
- [ ] Environment variables set in production
- [ ] Health checks passing
- [ ] Smoke tests run

## ✅ Optional Enhancements

### Push Notifications
- [ ] Firebase Cloud Messaging configured
- [ ] Service worker registered
- [ ] Notification permissions requested
- [ ] Notifications sent for scheduled calls

### Analytics
- [ ] Track call frequency
- [ ] Track call duration
- [ ] Track user engagement
- [ ] Track conversation topics
- [ ] Track call outcomes

### Customization
- [ ] Multiple Bobo voices
- [ ] Custom greetings
- [ ] Personalized conversation style
- [ ] User-defined call purposes

### Advanced Features
- [ ] Emotion detection
- [ ] Multi-language support
- [ ] Video calls
- [ ] Group calls
- [ ] Call recording playback

## 📊 Success Criteria

The voice call system is successfully integrated when:

- ✅ Users can configure call preferences
- ✅ Users can schedule calls (one-time and recurring)
- ✅ WebRTC calls work without external services
- ✅ Twilio calls work (if configured)
- ✅ Conversations are natural and helpful
- ✅ Call history is saved and accessible
- ✅ System is stable and performant
- ✅ Users report positive experience

## 🐛 Common Issues

### Issue: Models downloading slowly
**Solution**: First run downloads ~1GB. Subsequent runs are instant.

### Issue: WebSocket connection failed
**Solution**: Check backend is running, verify URL, check CORS.

### Issue: Microphone not working
**Solution**: Grant permissions, check browser settings, try Chrome.

### Issue: Twilio calls not working
**Solution**: Verify credentials, check phone format, check Twilio dashboard.

### Issue: AI responses slow
**Solution**: Use GPU if available, reduce max_tokens, cache responses.

## 📞 Support

If you encounter issues:

1. Check this checklist
2. Review error logs
3. Run `python test_voice_system.py`
4. Check documentation files
5. Test with `/voice/test/*` endpoints

## 🎉 Completion

Once all items are checked:

- [ ] System is fully integrated
- [ ] All tests pass
- [ ] Documentation complete
- [ ] Ready for user testing
- [ ] Ready for production deployment

**Congratulations!** Your voice call system is ready. 🚀
