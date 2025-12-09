import React, { useState } from 'react';
import { Phone, Settings } from 'lucide-react';
import WebRTCCall from './WebRTCCall';
import VoiceCallSettings from './VoiceCallSettings';

/**
 * Simple button to initiate voice calls with Bobo
 * Can be added anywhere in your app
 */
const VoiceCallButton = ({ userId }) => {
  const [showCall, setShowCall] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const startCall = () => {
    setShowCall(true);
  };

  return (
    <>
      {/* Call Button */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2">
        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="p-3 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors"
          title="Voice Call Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Call Button */}
        <button
          onClick={startCall}
          className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all animate-pulse"
          title="Call Bobo"
        >
          <Phone className="w-6 h-6" />
        </button>
      </div>

      {/* Call Interface */}
      {showCall && (
        <WebRTCCall 
          userId={userId} 
          onEnd={() => setShowCall(false)} 
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
