import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react';

const WebRTCCall = ({ userId, onEnd }) => {
  const [callState, setCallState] = useState('connecting'); // connecting, active, ending
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  
  const wsRef = useRef(null);
  const sessionIdRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    startCall();
    return () => {
      endCall();
    };
  }, []);

  const startCall = async () => {
    try {
      // Start call session
      const response = await fetch(`http://localhost:8000/voice/webrtc/start/${userId}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      sessionIdRef.current = data.session_id;
      
      // Add greeting to transcript
      setTranscript([{ speaker: 'bobo', text: data.greeting }]);
      
      // Speak greeting
      await speakText(data.greeting);
      
      // Connect WebSocket
      connectWebSocket(data.session_id);
      
      // Start listening
      await startListening();
      
      setCallState('active');
    } catch (error) {
      console.error('Error starting call:', error);
      alert('Failed to start call');
      onEnd();
    }
  };

  const connectWebSocket = (sessionId) => {
    const ws = new WebSocket(`ws://localhost:8000/voice/webrtc/ws/${sessionId}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'response') {
        // Bobo responded
        setTranscript(prev => [...prev, { speaker: 'bobo', text: data.text }]);
        
        // Play audio
        const audioBytes = hexToBytes(data.audio);
        await playAudio(audioBytes);
        
        // Resume listening
        startListening();
      } else if (data.type === 'goodbye') {
        // Call ending
        setTranscript(prev => [...prev, { speaker: 'bobo', text: data.text }]);
        const audioBytes = hexToBytes(data.audio);
        await playAudio(audioBytes);
        
        setTimeout(() => {
          endCall();
        }, 2000);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket closed');
    };
    
    wsRef.current = ws;
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioBytes = await audioBlob.arrayBuffer();
        
        // Send to server
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'audio',
            audio: bytesToHex(new Uint8Array(audioBytes))
          }));
        }
        
        audioChunksRef.current = [];
      };
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Record for 5 seconds, then stop
      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setCurrentSpeaker(null);
        }
      }, 5000);
      
      setCurrentSpeaker('user');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Please allow microphone access');
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
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'end' }));
      wsRef.current.close();
    }
    
    // End session
    if (sessionIdRef.current) {
      await fetch(`http://localhost:8000/voice/webrtc/end/${sessionIdRef.current}`, {
        method: 'POST'
      });
    }
    
    onEnd();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Implement actual muting logic
  };

  // Helper functions
  const bytesToHex = (bytes) => {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const hexToBytes = (hex) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        {/* Call Status */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
            <Phone className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {callState === 'connecting' && 'Connecting...'}
            {callState === 'active' && 'Call with Bobo'}
            {callState === 'ending' && 'Ending call...'}
          </h2>
          {currentSpeaker && (
            <p className="text-sm text-gray-600">
              {currentSpeaker === 'user' ? '🎤 You are speaking...' : '🤖 Bobo is speaking...'}
            </p>
          )}
        </div>

        {/* Transcript */}
        <div className="mb-6 max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-4">
          {transcript.map((msg, index) => (
            <div
              key={index}
              className={`mb-3 ${msg.speaker === 'bobo' ? 'text-left' : 'text-right'}`}
            >
              <div
                className={`inline-block px-4 py-2 rounded-lg ${
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
          ))}
        </div>

        {/* Call Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full ${
              isMuted ? 'bg-red-500' : 'bg-gray-200'
            } hover:opacity-80 transition-opacity`}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-gray-700" />
            )}
          </button>
          
          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Tip */}
        <p className="text-xs text-center text-gray-500 mt-6">
          Speak naturally. Bobo will respond after you finish talking.
        </p>
      </div>
    </div>
  );
};

export default WebRTCCall;
