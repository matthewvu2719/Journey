import React, { useState, useEffect } from 'react';
import { Phone, Globe, Clock, Bell } from 'lucide-react';

const VoiceCallSettings = ({ userId }) => {
  const [preferences, setPreferences] = useState({
    call_method: 'webrtc',
    phone_number: '',
    allow_calls: true,
    preferred_times: []
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      const response = await fetch(`http://localhost:8000/voice/preferences/${userId}`);
      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch(`http://localhost:8000/voice/preferences/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });
      
      if (response.ok) {
        alert('Preferences saved!');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const addPreferredTime = () => {
    setPreferences(prev => ({
      ...prev,
      preferred_times: [
        ...prev.preferred_times,
        { day: 'monday', time: '09:00' }
      ]
    }));
  };

  const removePreferredTime = (index) => {
    setPreferences(prev => ({
      ...prev,
      preferred_times: prev.preferred_times.filter((_, i) => i !== index)
    }));
  };

  const updatePreferredTime = (index, field, value) => {
    setPreferences(prev => ({
      ...prev,
      preferred_times: prev.preferred_times.map((time, i) => 
        i === index ? { ...time, [field]: value } : time
      )
    }));
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Phone className="w-6 h-6" />
        Voice Call Settings
      </h2>

      {/* Call Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3">Call Method</label>
        <div className="grid grid-cols-2 gap-4">
          {/* WebRTC Option */}
          <button
            onClick={() => setPreferences(prev => ({ ...prev, call_method: 'webrtc' }))}
            className={`p-4 border-2 rounded-lg transition-all ${
              preferences.call_method === 'webrtc'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Globe className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <div className="font-semibold">Web Call</div>
            <div className="text-xs text-gray-600 mt-1">Free • In-app</div>
          </button>

          {/* Twilio Option */}
          <button
            onClick={() => setPreferences(prev => ({ ...prev, call_method: 'twilio' }))}
            className={`p-4 border-2 rounded-lg transition-all ${
              preferences.call_method === 'twilio'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Phone className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <div className="font-semibold">Phone Call</div>
            <div className="text-xs text-gray-600 mt-1">Premium • Real phone</div>
          </button>
        </div>
      </div>

      {/* Phone Number (for Twilio) */}
      {preferences.call_method === 'twilio' && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Phone Number</label>
          <input
            type="tel"
            value={preferences.phone_number}
            onChange={(e) => setPreferences(prev => ({ ...prev, phone_number: e.target.value }))}
            placeholder="+1234567890"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +1 for US)</p>
        </div>
      )}

      {/* Allow Calls Toggle */}
      <div className="mb-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="font-medium">Allow Bobo to call me</span>
        </div>
        <button
          onClick={() => setPreferences(prev => ({ ...prev, allow_calls: !prev.allow_calls }))}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            preferences.allow_calls ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <div
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
              preferences.allow_calls ? 'transform translate-x-6' : ''
            }`}
          />
        </button>
      </div>

      {/* Preferred Times */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Preferred Call Times
          </label>
          <button
            onClick={addPreferredTime}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Add Time
          </button>
        </div>

        {preferences.preferred_times.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No preferred times set. Bobo can call anytime.
          </p>
        ) : (
          <div className="space-y-2">
            {preferences.preferred_times.map((time, index) => (
              <div key={index} className="flex gap-2 items-center">
                <select
                  value={time.day}
                  onChange={(e) => updatePreferredTime(index, 'day', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg"
                >
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
                <input
                  type="time"
                  value={time.time}
                  onChange={(e) => updatePreferredTime(index, 'time', e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <button
                  onClick={() => removePreferredTime(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={savePreferences}
        disabled={saving}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>How it works:</strong> Bobo will {preferences.call_method === 'webrtc' ? 'send you a notification' : 'call your phone'} at your preferred times to check in on your habits and provide motivation.
        </p>
      </div>
    </div>
  );
};

export default VoiceCallSettings;
