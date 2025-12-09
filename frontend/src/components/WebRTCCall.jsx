import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react';
import voiceApi from '../services/voiceApi';

const WebRTCCall = ({ userId, onEnd }) => {
  const [callState, setCallState] = useState('connecting'); // connecting, active, ending, error
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [error, setError] = useState(null);
  
  const wsRef = useRef(null);
  const sessionIdRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const isInitializedRef = useRef(false);
  const mediaStreamRef = useRef(null);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    startCall();
    
    // Cleanup function - only clean up resources, don't call onEnd
    return () => {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      // Stop media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  const startCall = async () => {
    try {
      console.log('Starting WebRTC call for user:', userId);
      
      // Start call session
      const data = await voiceApi.startWebRTCCall(userId);
      console.log('Call session started:', data);
      
      sessionIdRef.current = data.session_id;
      
      // Add greeting to transcript
      setTranscript([{ speaker: 'bobo', text: data.greeting }]);
      
      // Play greeting audio (from backend for consistent voice)
      if (data.greeting_audio) {
        const audioBytes = base64ToBytes(data.greeting_audio);
        setCurrentSpeaker('bobo');
        await playAudio(audioBytes);
        setCurrentSpeaker(null);
      } else {
        // Fallback to Web Speech API if no audio provided
        await speakText(data.greeting);
      }
      
      // Connect WebSocket
      connectWebSocket(data.session_id);
      
      // Start listening
      await startListening();
      
      setCallState('active');
    } catch (error) {
      console.error('Error starting call:', error);
      setError(`Failed to start call: ${error.message}`);
      // Don't close the popup - show error in the UI instead
      setCallState('error');
    }
  };

  const connectWebSocket = (sessionId) => {
    const wsUrl = voiceApi.getWebRTCWebSocketUrl(sessionId);
    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('✓ WebSocket connected');
    };
    
    ws.onmessage = async (event) => {
      console.log('WebSocket message received:', event.data);
      const data = JSON.parse(event.data);
      
      if (data.type === 'response') {
        console.log('User said:', data.user_text);
        console.log('Bobo response:', data.text);
        
        // Add user's transcribed text to transcript
        if (data.user_text) {
          setTranscript(prev => [...prev, { speaker: 'user', text: data.user_text }]);
        }
        
        // Add Bobo's response
        setTranscript(prev => [...prev, { speaker: 'bobo', text: data.text }]);
        
        // Play audio (decode from base64)
        const audioBytes = base64ToBytes(data.audio);
        setCurrentSpeaker('bobo');
        await playAudio(audioBytes);
        setCurrentSpeaker(null);
        
        // Resume listening for next user input
        console.log('Resuming listening...');
        startListening();
      } else if (data.type === 'goodbye') {
        console.log('Call ending with goodbye');
        // Call ending
        setTranscript(prev => [...prev, { speaker: 'bobo', text: data.text }]);
        const audioBytes = base64ToBytes(data.audio);
        await playAudio(audioBytes);
        
        setTimeout(() => {
          endCall();
        }, 2000);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection failed');
    };
    
    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
    };
    
    wsRef.current = ws;
  };

  const startListening = async () => {
    try {
      // Reuse existing stream or get a new one
      if (!mediaStreamRef.current) {
        console.log('Requesting microphone access...');
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      const stream = mediaStreamRef.current;
      
      // Use WAV format if supported, otherwise WebM
      const mimeType = MediaRecorder.isTypeSupported('audio/wav') 
        ? 'audio/wav' 
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Convert to base64 for easier transmission
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result.split(',')[1];
          
          console.log('Audio recorded, format:', mimeType, 'size:', base64Audio.length);
          
          // Send to server
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            console.log('Sending audio to server...');
            wsRef.current.send(JSON.stringify({
              type: 'audio',
              audio: base64Audio,
              format: mimeType
            }));
          } else {
            console.error('WebSocket not connected, state:', wsRef.current?.readyState);
            setError('Not connected to server');
          }
        };
        reader.readAsDataURL(audioBlob);
        
        audioChunksRef.current = [];
      };
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Record for 5 seconds, then stop
      console.log('Starting recording...');
      mediaRecorder.start();
      setCurrentSpeaker('user');
      
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          console.log('Stopping recording after 5 seconds');
          mediaRecorder.stop();
          setCurrentSpeaker(null);
        }
      }, 5000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const speakText = async (text) => {
    // Use Web Speech API for TTS (fallback)
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = resolve;
      speechSynthesis.speak(utterance);
    });
  };

  const playAudio = async (audioBytes) => {
    // Play audio from bytes
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(audioBytes.buffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    return new Promise((resolve) => {
      source.onended = resolve;
      source.start();
    });
  };

  const endCall = async () => {
    setCallState('ending');
    
    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'end' }));
      wsRef.current.close();
    }
    
    // End session
    if (sessionIdRef.current) {
      try {
        await voiceApi.endWebRTCCall(sessionIdRef.current);
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }
    
    onEnd();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Implement actual muting logic
  };

  // Helper function to decode base64 to bytes
  const base64ToBytes = (base64) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="glass rounded-2xl p-8 max-w-md w-full shadow-2xl border border-[var(--color-border)]" style={{background: 'var(--color-background)'}}>
        {/* Call Status */}
        <div className="text-center mb-6">
          <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
            callState === 'active' 
              ? 'bg-gradient-to-br from-green-400 to-green-600 animate-pulse' 
              : 'bg-gradient-to-br from-blue-400 to-purple-500 animate-pulse'
          }`}>
            <Phone className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{color: 'var(--color-foreground)'}}>
            {callState === 'connecting' && 'Connecting...'}
            {callState === 'active' && 'Call with Bobo'}
            {callState === 'ending' && 'Ending call...'}
            {callState === 'error' && 'Connection Failed'}
          </h2>
          {currentSpeaker && (
            <p className="text-sm" style={{color: 'var(--color-foreground-secondary)'}}>
              {currentSpeaker === 'user' ? '🎤 You are speaking...' : '🤖 Bobo is speaking...'}
            </p>
          )}
        </div>

        {/* Transcript - Bobo's Script Display */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-2" style={{color: 'var(--color-foreground)'}}>Conversation</h3>
          <div className="max-h-64 overflow-y-auto rounded-lg p-4 space-y-3 border border-[var(--color-border)]" style={{background: 'var(--color-glass)'}}>
            {transcript.length === 0 ? (
              <p className="text-sm text-center py-4" style={{color: 'var(--color-foreground-secondary)', opacity: 0.6}}>
                Waiting for conversation to start...
              </p>
            ) : (
              transcript.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.speaker === 'bobo' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-lg ${
                      msg.speaker === 'bobo'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-purple-100 text-purple-900'
                    }`}
                  >
                    <div className="text-xs font-semibold mb-1">
                      {msg.speaker === 'bobo' ? '🤖 Bobo' : '👤 You'}
                    </div>
                    <div className="text-sm">{msg.text}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Call Controls */}
        {callState !== 'error' && (
          <div className="flex justify-center gap-4 mb-4">
            <button
              onClick={toggleMute}
              disabled={callState !== 'active'}
              className={`p-4 rounded-full ${
                isMuted ? 'bg-red-500' : 'bg-gray-200'
              } hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-gray-700" />
              )}
            </button>
            
            <button
              onClick={endCall}
              disabled={callState === 'ending'}
              className="px-6 py-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center gap-2 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title="End Call"
            >
              <PhoneOff className="w-5 h-5" />
              Hang Up
            </button>
          </div>
        )}

        {/* Tip */}
        <p className="text-xs text-center" style={{color: 'var(--color-foreground-secondary)', opacity: 0.7}}>
          Speak naturally. Bobo will respond after you finish talking.
        </p>

        {/* Error Display */}
        {error && callState === 'error' && (
          <div className="mt-4 p-4 rounded-lg border" style={{background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)'}}>
            <p className="text-sm mb-3" style={{color: '#ef4444'}}>{error}</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setError(null);
                  setCallState('connecting');
                  startCall();
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold text-sm"
              >
                Retry
              </button>
              <button
                onClick={endCall}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebRTCCall;
