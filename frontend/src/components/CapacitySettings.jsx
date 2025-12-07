import { useState, useEffect } from 'react';
import api from '../services/api';

export default function CapacitySettings() {
  const [capacities, setCapacities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const days = [
    { key: 'Mon', label: 'Monday' },
    { key: 'Tue', label: 'Tuesday' },
    { key: 'Wed', label: 'Wednesday' },
    { key: 'Thu', label: 'Thursday' },
    { key: 'Fri', label: 'Friday' },
    { key: 'Sat', label: 'Saturday' },
    { key: 'Sun', label: 'Sunday' }
  ];

  useEffect(() => {
    fetchCapacities();
  }, []);

  const fetchCapacities = async () => {
    try {
      const data = await api.get('/capacity');
      setCapacities(data);
    } catch (error) {
      console.error('Failed to fetch capacities:', error);
      setMessage('Failed to load capacities');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (day, value) => {
    setCapacities(prev => ({
      ...prev,
      [day]: parseInt(value) || 0
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      await api.put('/capacity', { capacities });
      setMessage('✅ Time budgets saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save capacities:', error);
      setMessage('❌ Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getTotalWeekly = () => {
    if (!capacities) return 0;
    return Object.values(capacities).reduce((sum, val) => sum + val, 0);
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8">
        <div className="text-center text-light/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-light mb-2">Daily Time Budget</h2>
        <p className="text-light/60">
          Set how much time you have available for habits each day
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('✅') 
            ? 'bg-green-500/20 text-green-300' 
            : 'bg-red-500/20 text-red-300'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4 mb-6">
        {days.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-4">
            <label className="w-32 text-light font-medium">{label}</label>
            
            <input
              type="range"
              min="0"
              max="480"
              step="15"
              value={capacities[key] || 0}
              onChange={(e) => handleChange(key, e.target.value)}
              className="flex-1 h-2 bg-light/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            
            <input
              type="number"
              min="0"
              max="1440"
              value={capacities[key] || 0}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-20 px-3 py-2 bg-light/5 border border-light/10 rounded-lg text-light text-center"
            />
            
            <span className="w-24 text-light/60 text-sm">
              {formatTime(capacities[key] || 0)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-light/10">
        <div className="text-light/60">
          <span className="text-sm">Total weekly capacity:</span>
          <span className="ml-2 text-lg font-bold text-light">
            {formatTime(getTotalWeekly())}
          </span>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="mt-6 p-4 bg-light/5 rounded-lg">
        <h3 className="text-sm font-semibold text-light mb-2">💡 Tips:</h3>
        <ul className="text-sm text-light/60 space-y-1">
          <li>• Set realistic time budgets based on your daily schedule</li>
          <li>• Weekends typically have more available time</li>
          <li>• The agent will warn you if you're overcommitting</li>
          <li>• You can adjust these anytime as your schedule changes</li>
        </ul>
      </div>
    </div>
  );
}
