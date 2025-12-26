import { useState, useEffect } from 'react';
import { Phone, Globe, Clock, Bell } from 'lucide-react';
import voiceApi from '../services/voiceApi';

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
      const data = await voiceApi.getPreferences(userId);
      setPreferences(data);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    // Validate phone number if Twilio is selected
    if (preferences.call_method === 'twilio' && !preferences.phone_number) {
      alert('Please enter a phone number for phone calls');
      return;
    }

    setSaving(true);
    try {
      await voiceApi.savePreferences(userId, preferences);
      alert('✓ Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert(`Failed to save: ${error.message}`);
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
    <div className="max-w-2xl mx-auto p-8 glass rounded-2xl">


      {/* Call Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3 text-light/80">How Should I Reach You?</label>
        <div className="grid grid-cols-2 gap-4">
          {/* WebRTC Option */}
          <button
            onClick={() => setPreferences(prev => ({ ...prev, call_method: 'webrtc' }))}
            className={`p-6 border-2 rounded-xl transition-all duration-200 ${
              preferences.call_method === 'webrtc'
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 shadow-lg'
                : 'border-[var(--color-border)] bg-[var(--color-glass)] hover:border-[var(--color-accent)]/50'
            }`}
          >
            <Globe className={`w-8 h-8 mx-auto mb-2 ${preferences.call_method === 'webrtc' ? 'text-[var(--color-accent)]' : 'text-[var(--color-foreground-secondary)]'}`} />
            <div className="font-semibold text-[var(--color-foreground)]">Web Chat</div>
            <div className="text-xs text-[var(--color-foreground-secondary)] mt-1">Free • Right here!</div>
          </button>

          {/* Twilio Option */}
          <button
            onClick={() => setPreferences(prev => ({ ...prev, call_method: 'twilio' }))}
            className={`p-6 border-2 rounded-xl transition-all duration-200 ${
              preferences.call_method === 'twilio'
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 shadow-lg'
                : 'border-[var(--color-border)] bg-[var(--color-glass)] hover:border-[var(--color-accent)]/50'
            }`}
          >
            <Phone className={`w-8 h-8 mx-auto mb-2 ${preferences.call_method === 'twilio' ? 'text-[var(--color-accent)]' : 'text-[var(--color-foreground-secondary)]'}`} />
            <div className="font-semibold text-[var(--color-foreground)]">Phone Call</div>
            <div className="text-xs text-[var(--color-foreground-secondary)] mt-1">Premium • I'll call you!</div>
          </button>
        </div>
      </div>

      {/* Phone Number (for Twilio) */}
      {preferences.call_method === 'twilio' && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-[var(--color-foreground)]/80">Your Phone Number</label>
          <input
            type="tel"
            value={preferences.phone_number}
            onChange={(e) => setPreferences(prev => ({ ...prev, phone_number: e.target.value }))}
            placeholder="+1234567890"
            className="w-full px-4 py-3 bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg 
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 
              focus:border-[var(--color-accent)]/40 text-[var(--color-foreground)] 
              placeholder-[var(--color-foreground-secondary)]"
          />
          <p className="text-xs text-[var(--color-foreground-secondary)] mt-2">Don't forget your country code! (like +1 for US)</p>
        </div>
      )}

      {/* Allow Calls Toggle */}
      <div className="mb-6 flex items-center justify-between p-4 bg-[var(--color-glass)] border border-[var(--color-border)] rounded-xl">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[var(--color-foreground-secondary)]" />
          <span className="font-medium text-[var(--color-foreground)]">Yes, I want Bobo to call me!</span>
        </div>
        <button
          onClick={() => setPreferences(prev => ({ ...prev, allow_calls: !prev.allow_calls }))}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
            preferences.allow_calls ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-foreground-secondary)]/30'
          }`}
        >
          <div
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
              preferences.allow_calls ? 'transform translate-x-6' : ''
            }`}
          />
        </button>
      </div>

      {/* Preferred Times */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium flex items-center gap-2 text-[var(--color-foreground)]/80">
            <Clock className="w-4 h-4" />
            When Should I Call You?
          </label>
          <button
            onClick={addPreferredTime}
            className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 font-medium transition-colors"
          >
            + Add Another Time
          </button>
        </div>

        {preferences.preferred_times.length === 0 ? (
          <p className="text-sm text-[var(--color-foreground-secondary)] text-center py-6 bg-[var(--color-glass)] rounded-lg border border-[var(--color-border)]">
            No specific times yet? That's okay! I can call you anytime!
          </p>
        ) : (
          <div className="space-y-3">
            {preferences.preferred_times.map((time, index) => (
              <div key={index} className="flex gap-2 items-center">
                <select
                  value={time.day}
                  onChange={(e) => updatePreferredTime(index, 'day', e.target.value)}
                  className="flex-1 px-4 py-3 bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg 
                    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 
                    focus:border-[var(--color-accent)]/40 text-[var(--color-foreground)]"
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
                  className="flex-1 px-4 py-3 bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg 
                    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 
                    focus:border-[var(--color-accent)]/40 text-[var(--color-foreground)]"
                />
                <button
                  onClick={() => removePreferredTime(index)}
                  className="px-3 py-3 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-[var(--color-border)]"
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
        className="w-full py-3 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 
          disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl 
          transition-all duration-200"
      >
        {saving ? 'Saving Your Preferences...' : 'Save My Chat Settings'}
      </button>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded-xl">
        <p className="text-sm text-[var(--color-foreground)]">
          <strong>Here's how it works:</strong> I'll {preferences.call_method === 'webrtc' ? 'send you a fun notification' : 'give you a friendly phone call'} at your favorite times to chat about your awesome habits and cheer you on!
        </p>
      </div>
    </div>
  );
};

export default VoiceCallSettings;
