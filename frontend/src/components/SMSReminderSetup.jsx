import React, { useState, useEffect } from 'react';
import RobotMascot from './RobotMascot';
import { api } from '../services/api';

const SMSReminderSetup = ({ habit, onComplete, onCancel }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [reminderTimes, setReminderTimes] = useState([
    { time: '08:00', enabled: true, label: 'Morning' },
    { time: '12:00', enabled: false, label: 'Noon' },
    { time: '18:00', enabled: false, label: 'Evening' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('phone'); // 'phone' | 'times' | 'confirm'

  // Load user's phone number if available
  useEffect(() => {
    const loadUserPhone = async () => {
      try {
        const prefs = await api.getUserPreferences();
        if (prefs?.phone_number) {
          setPhoneNumber(prefs.phone_number);
        }
      } catch (err) {
        console.log('Could not load user preferences');
      }
    };
    loadUserPhone();
  }, []);

  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as US phone number
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const toggleReminderTime = (index) => {
    setReminderTimes(prev => prev.map((item, i) => 
      i === index ? { ...item, enabled: !item.enabled } : item
    ));
  };

  const updateReminderTime = (index, newTime) => {
    setReminderTimes(prev => prev.map((item, i) => 
      i === index ? { ...item, time: newTime } : item
    ));
  };

  const addCustomTime = () => {
    setReminderTimes(prev => [...prev, { time: '15:00', enabled: true, label: 'Custom' }]);
  };

  const removeTime = (index) => {
    setReminderTimes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Get enabled times
      const enabledTimes = reminderTimes
        .filter(t => t.enabled)
        .map(t => t.time);

      if (enabledTimes.length === 0) {
        setError('Please select at least one reminder time');
        setIsSubmitting(false);
        return;
      }

      // Clean phone number (remove formatting)
      const cleanPhone = '+1' + phoneNumber.replace(/\D/g, '');

      // Call API to set up SMS reminders
      await api.setupSMSReminders({
        phone_number: cleanPhone,
        reminder_times: enabledTimes,
        habit_id: habit?.id // Optional - if null, reminds about all habits
      });

      onComplete({
        type: 'sms_reminder_set',
        phoneNumber: phoneNumber,
        reminderTimes: enabledTimes,
        message: `SMS reminders scheduled for ${enabledTimes.join(', ')}`,
        obstacleOvercome: true
      });
    } catch (err) {
      console.error('Error setting up SMS reminders:', err);
      setError(err.message || 'Failed to set up SMS reminders. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPhoneValid = phoneNumber.replace(/\D/g, '').length === 10;

  return (
    <div className="sms-reminder-setup p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-light mb-2 flex items-center justify-center gap-2">
          📱 Set Up SMS Reminders
        </h3>
        <p className="text-sm text-light/60">
          Bobo will text you daily reminders about your habits
        </p>
      </div>

      {/* Bobo Helper */}
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-shrink-0">
          <RobotMascot 
            size="md" 
            emotion="helpful" 
            animate={true}
          />
        </div>
        <div className="flex-1">
          <div className="bg-light/10 rounded-2xl p-4 relative">
            <div className="absolute -top-2 left-8 w-4 h-4 bg-light/10 rotate-45"></div>
            <p className="text-light text-sm">
              {step === 'phone' && "I'll send you friendly text reminders so you never forget your habits! First, let me know your phone number. 📲"}
              {step === 'times' && "Great! Now choose when you'd like me to send reminders. I'll text you a summary of your habits for the day! ⏰"}
              {step === 'confirm' && "Perfect! Here's a preview of what I'll send you. Ready to activate? 🚀"}
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Phone Number */}
      {step === 'phone' && (
        <div className="space-y-4">
          <div className="bg-light/5 rounded-xl p-6 border border-light/10">
            <label className="block text-light/80 text-sm font-medium mb-2">
              Your Phone Number (US)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-light/60 text-lg">+1</span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="(555) 123-4567"
                className="flex-1 bg-light/10 border border-light/20 rounded-lg px-4 py-3 text-light text-lg placeholder-light/40 focus:outline-none focus:border-purple-500"
                maxLength={14}
              />
            </div>
            <p className="text-light/50 text-xs mt-2">
              Standard SMS rates may apply. We'll never share your number.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-light/10 text-light rounded-lg hover:bg-light/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setStep('times')}
              disabled={!isPhoneValid}
              className={`px-8 py-2 rounded-lg font-medium transition-all ${
                isPhoneValid
                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                  : 'bg-light/10 text-light/40 cursor-not-allowed'
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Reminder Times */}
      {step === 'times' && (
        <div className="space-y-4">
          <div className="bg-light/5 rounded-xl p-6 border border-light/10">
            <label className="block text-light/80 text-sm font-medium mb-4">
              When should I remind you?
            </label>
            
            <div className="space-y-3">
              {reminderTimes.map((item, index) => (
                <div key={index} className="flex items-center gap-3 bg-light/5 rounded-lg p-3">
                  <button
                    onClick={() => toggleReminderTime(index)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      item.enabled 
                        ? 'bg-purple-500 border-purple-500' 
                        : 'border-light/30 hover:border-light/50'
                    }`}
                  >
                    {item.enabled && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  
                  <span className="text-light/60 text-sm w-20">{item.label}</span>
                  
                  <input
                    type="time"
                    value={item.time}
                    onChange={(e) => updateReminderTime(index, e.target.value)}
                    className="bg-light/10 border border-light/20 rounded px-3 py-1 text-light focus:outline-none focus:border-purple-500"
                  />
                  
                  {index >= 3 && (
                    <button
                      onClick={() => removeTime(index)}
                      className="text-red-400 hover:text-red-300 ml-auto"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addCustomTime}
              className="mt-3 text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
            >
              + Add another time
            </button>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setStep('phone')}
              className="px-6 py-2 bg-light/10 text-light rounded-lg hover:bg-light/20 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep('confirm')}
              disabled={!reminderTimes.some(t => t.enabled)}
              className={`px-8 py-2 rounded-lg font-medium transition-all ${
                reminderTimes.some(t => t.enabled)
                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                  : 'bg-light/10 text-light/40 cursor-not-allowed'
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="bg-light/5 rounded-xl p-6 border border-light/10">
            <h4 className="text-light font-medium mb-4">Preview Message</h4>
            
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-lg">
                  🤖
                </div>
                <div className="flex-1">
                  <p className="text-green-300 text-sm font-medium mb-1">Bobo</p>
                  <p className="text-light/80 text-sm">
                    Hey! 👋 It's Bobo! Here are your habits for today:
                    <br /><br />
                    🌅 Morning: {habit?.name || 'Your habits'}
                    <br /><br />
                    You've got this! 💪 Reply STOP to unsubscribe.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-light/60">
              <p>📱 Phone: +1 {phoneNumber}</p>
              <p>⏰ Times: {reminderTimes.filter(t => t.enabled).map(t => t.time).join(', ')}</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setStep('times')}
              className="px-6 py-2 bg-light/10 text-light rounded-lg hover:bg-light/20 transition-colors"
              disabled={isSubmitting}
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Setting up...
                </span>
              ) : (
                '✓ Activate SMS Reminders'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSReminderSetup;
