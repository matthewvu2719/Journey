import React, { useState, useEffect } from 'react';
import { Phone, Settings } from 'lucide-react';
import WebRTCCall from './WebRTCCall';
import VoiceCallSettings from './VoiceCallSettings';
import voiceApi from '../services/voiceApi';

/**
 * Simple button to initiate voice calls with Bobo
 * Can be added anywhere in your app
 */
const VoiceCallButton = ({ userId }) => {
  const [showCall, setShowCall] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      const data = await voiceApi.getPreferences(userId);
      setPreferences(data);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const [showCallPopup, setShowCallPopup] = useState(false);

  const handleCallButtonClick = () => {
    setShowCallPopup(true);
  };

  const startCall = async () => {
    if (!preferences) {
      alert('Please configure your call preferences first');
      setShowSettings(true);
      setShowCallPopup(false);
      return;
    }

    if (!preferences.allow_calls) {
      alert('Voice calls are disabled. Enable them in settings.');
      setShowSettings(true);
      setShowCallPopup(false);
      return;
    }

    if (preferences.call_method === 'twilio') {
      alert('Phone calls must be scheduled. Please set up your preferred times in settings.');
      setShowSettings(true);
      setShowCallPopup(false);
      return;
    }

    // Start WebRTC call - keep popup open
    setShowCall(true);
  };

  const endCall = () => {
    setShowCall(false);
    setShowCallPopup(false);
  };

  return (
    <>
      {/* Call Button - Stacked above Bobo mascot */}
      <div className="fixed bottom-[140px] right-6 z-40">
        {/* Call Button */}
        <button
          onClick={handleCallButtonClick}
          className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all animate-pulse"
          title="Call Bobo"
        >
          <Phone className="w-6 h-6" />
        </button>
      </div>

      {/* Call Popup - Shows initial state or active call */}
      {showCallPopup && !showCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-[var(--color-border)]" style={{background: 'var(--color-background)'}}>
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center" style={{background: 'var(--color-accent)', opacity: 0.9}}>
                <Phone className="w-12 h-12" style={{color: 'var(--color-background)'}} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{color: 'var(--color-foreground)'}}>Call Bobo</h2>
              <p className="mb-6" style={{color: 'var(--color-foreground-secondary)'}}>
                Start a voice conversation with your AI habit coach
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCallPopup(false)}
                  className="flex-1 px-6 py-3 rounded-lg transition font-semibold hover:opacity-80"
                  style={{background: 'var(--color-glass)', color: 'var(--color-foreground)', border: '1px solid var(--color-border)'}}
                >
                  Cancel
                </button>
                <button
                  onClick={startCall}
                  className="flex-1 px-6 py-3 rounded-lg transition font-semibold hover:opacity-90"
                  style={{background: 'var(--color-accent)', color: 'var(--color-background)'}}
                >
                  Call Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Interface - Replaces popup when call starts */}
      {showCall && (
        <WebRTCCall 
          userId={userId} 
          onEnd={endCall} 
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Voice Call Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <VoiceCallSettings userId={userId} />
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceCallButton;
