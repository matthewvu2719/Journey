import React, { useState, useEffect } from 'react';
import RobotMascot from './RobotMascot';
import { api } from '../services/api';

const HabitRescheduleView = ({ 
  habit, 
  suggestedTime, 
  energyPatterns, 
  onComplete, 
  onCancel 
}) => {
  const [selectedTime, setSelectedTime] = useState(suggestedTime || '');
  const [selectedDays, setSelectedDays] = useState(habit.days || []);
  const [energyData, setEnergyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customTime, setCustomTime] = useState('');

  useEffect(() => {
    loadEnergyPatterns();
  }, []);

  const loadEnergyPatterns = async () => {
    try {
      setLoading(true);
      // Try to get user's energy patterns
      const patterns = await api.getUserEnergyPatterns();
      setEnergyData(patterns);
      
      // If no suggested time provided, use the optimal time from patterns
      if (!suggestedTime && patterns.optimal_times?.length > 0) {
        setSelectedTime(patterns.optimal_times[0].time);
      }
    } catch (error) {
      console.error('Error loading energy patterns:', error);
      // Use fallback data
      setEnergyData({
        optimal_times: [
          { time: '07:00', energy_level: 0.9, label: 'Morning Peak' },
          { time: '14:00', energy_level: 0.7, label: 'Afternoon Focus' },
          { time: '19:00', energy_level: 0.6, label: 'Evening Wind-down' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = [
    { time: '06:00', label: 'Early Morning', icon: '🌅', energy: 'high' },
    { time: '07:00', label: 'Morning', icon: '🌅', energy: 'high' },
    { time: '08:00', label: 'Morning', icon: '🌅', energy: 'high' },
    { time: '09:00', label: 'Late Morning', icon: '☀️', energy: 'high' },
    { time: '10:00', label: 'Late Morning', icon: '☀️', energy: 'high' },
    { time: '11:00', label: 'Pre-noon', icon: '☀️', energy: 'medium' },
    { time: '12:00', label: 'Noon', icon: '☀️', energy: 'medium' },
    { time: '13:00', label: 'Early Afternoon', icon: '🌤️', energy: 'medium' },
    { time: '14:00', label: 'Afternoon', icon: '🌤️', energy: 'medium' },
    { time: '15:00', label: 'Afternoon', icon: '🌤️', energy: 'medium' },
    { time: '16:00', label: 'Late Afternoon', icon: '🌤️', energy: 'low' },
    { time: '17:00', label: 'Late Afternoon', icon: '🌤️', energy: 'low' },
    { time: '18:00', label: 'Early Evening', icon: '🌆', energy: 'low' },
    { time: '19:00', label: 'Evening', icon: '🌙', energy: 'low' },
    { time: '20:00', label: 'Evening', icon: '🌙', energy: 'low' },
    { time: '21:00', label: 'Late Evening', icon: '🌙', energy: 'low' }
  ];

  const daysOfWeek = [
    { key: 'monday', label: 'Mon', full: 'Monday' },
    { key: 'tuesday', label: 'Tue', full: 'Tuesday' },
    { key: 'wednesday', label: 'Wed', full: 'Wednesday' },
    { key: 'thursday', label: 'Thu', full: 'Thursday' },
    { key: 'friday', label: 'Fri', full: 'Friday' },
    { key: 'saturday', label: 'Sat', full: 'Saturday' },
    { key: 'sunday', label: 'Sun', full: 'Sunday' }
  ];

  const getEnergyLevel = (time) => {
    if (!energyData?.optimal_times) return 'medium';
    
    const pattern = energyData.optimal_times.find(p => p.time === time);
    if (pattern) {
      if (pattern.energy_level >= 0.8) return 'high';
      if (pattern.energy_level >= 0.6) return 'medium';
      return 'low';
    }
    
    // Fallback based on general patterns
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 6 && hour <= 10) return 'high';
    if (hour >= 11 && hour <= 15) return 'medium';
    return 'low';
  };

  const getEnergyColor = (level) => {
    switch (level) {
      case 'high': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      default: return 'text-light/60 bg-light/10 border-light/20';
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setCustomTime('');
  };

  const handleCustomTimeChange = (e) => {
    setCustomTime(e.target.value);
    setSelectedTime('');
  };

  const handleDayToggle = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleReschedule = () => {
    const finalTime = customTime || selectedTime;
    
    if (onComplete) {
      onComplete({
        type: 'habit_rescheduled',
        originalTime: habit.time,
        newTime: finalTime,
        originalDays: habit.days,
        newDays: selectedDays,
        energyOptimized: energyData?.optimal_times?.some(p => p.time === finalTime),
        rescheduledAt: new Date().toISOString(),
        obstacleOvercome: true, // Mark obstacle as overcome when habit is rescheduled
        executionData: {
          habitRescheduled: true,
          obstacleOvercome: true,
          timeChanged: habit.time !== finalTime,
          daysChanged: JSON.stringify(habit.days) !== JSON.stringify(selectedDays),
          energyOptimized: energyData?.optimal_times?.some(p => p.time === finalTime)
        }
      });
    }
  };

  const isOptimalTime = (time) => {
    return energyData?.optimal_times?.some(p => p.time === time && p.energy_level >= 0.7);
  };

  if (loading) {
    return (
      <div className="habit-reschedule-view p-6 text-center">
        <div className="mb-8">
          <RobotMascot 
            size="lg" 
            emotion="friendly" 
            animate={true}
          />
          <div className="mt-4">
            <div className="bg-light/10 rounded-2xl p-4 relative inline-block">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-light/10 rotate-45"></div>
              <p className="text-light">
                🔍 Analyzing your energy patterns to find the perfect time...
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin w-8 h-8 border-2 border-light/20 border-t-purple-500 rounded-full"></div>
          <p className="text-light/70">Loading optimal schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="habit-reschedule-view p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-light mb-2 flex items-center justify-center gap-2">
          ⏰ Reschedule for Success
        </h3>
        <p className="text-sm text-light/60">
          Find the optimal time for: <strong>{habit.name}</strong>
        </p>
      </div>

      {/* Bobo Guidance */}
      <div className="bobo-guidance flex items-start gap-4 mb-8">
        <div className="flex-shrink-0">
          <RobotMascot 
            size="lg" 
            emotion="friendly" 
            animate={true}
          />
        </div>
        
        <div className="flex-1">
          <div className="bg-light/10 rounded-2xl p-4 relative">
            <div className="absolute -top-2 left-8 w-4 h-4 bg-light/10 rotate-45"></div>
            <div className="text-light">
              🎯 Based on your energy patterns, I've identified the best times for you to tackle this habit. 
              Green times are when you typically have the most energy!
            </div>
          </div>
        </div>
      </div>

      {/* Current Schedule */}
      <div className="current-schedule bg-light/5 rounded-xl p-4 border border-light/10">
        <h4 className="font-medium text-light mb-2">📅 Current Schedule:</h4>
        <div className="flex items-center gap-4 text-sm text-light/70">
          <span>⏰ {habit.time || 'No time set'}</span>
          <span>📆 {habit.days?.join(', ') || 'No days set'}</span>
        </div>
      </div>

      {/* Time Selection */}
      <div className="time-selection">
        <h4 className="font-medium text-light mb-4 flex items-center gap-2">
          ⏰ Choose New Time
          {energyData?.optimal_times && (
            <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
              Based on your energy patterns
            </span>
          )}
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {timeSlots.map((slot) => {
            const energyLevel = getEnergyLevel(slot.time);
            const isSelected = selectedTime === slot.time;
            const isOptimal = isOptimalTime(slot.time);
            
            return (
              <button
                key={slot.time}
                onClick={() => handleTimeSelect(slot.time)}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200 text-left relative
                  ${isSelected 
                    ? 'border-purple-500 bg-purple-500/20 scale-105' 
                    : `border-light/20 hover:border-light/40 ${getEnergyColor(energyLevel)}`
                  }
                `}
              >
                {isOptimal && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                )}
                
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{slot.icon}</span>
                  <span className="font-medium text-sm">{slot.time}</span>
                </div>
                <div className="text-xs opacity-80">{slot.label}</div>
                
                {energyLevel === 'high' && (
                  <div className="text-xs text-green-400 mt-1">⚡ High Energy</div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Custom Time Input */}
        <div className="custom-time bg-light/5 rounded-lg p-3 border border-light/10">
          <label className="block text-sm text-light/80 mb-2">Or enter custom time:</label>
          <input
            type="time"
            value={customTime}
            onChange={handleCustomTimeChange}
            className="bg-darker border border-light/20 rounded px-3 py-2 text-light focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Days Selection */}
      <div className="days-selection">
        <h4 className="font-medium text-light mb-4">📅 Select Days</h4>
        
        <div className="flex flex-wrap gap-2">
          {daysOfWeek.map((day) => {
            const isSelected = selectedDays.includes(day.key);
            
            return (
              <button
                key={day.key}
                onClick={() => handleDayToggle(day.key)}
                className={`
                  px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium
                  ${isSelected 
                    ? 'border-purple-500 bg-purple-500/20 text-purple-300' 
                    : 'border-light/20 text-light/70 hover:border-light/40 hover:text-light'
                  }
                `}
              >
                {day.label}
              </button>
            );
          })}
        </div>
        
        <div className="mt-2 text-xs text-light/60">
          Selected: {selectedDays.length > 0 ? selectedDays.join(', ') : 'None'}
        </div>
      </div>

      {/* Energy Insights */}
      {energyData?.optimal_times && (
        <div className="energy-insights bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
          <h5 className="font-medium text-blue-300 mb-3">📊 Your Energy Patterns:</h5>
          <div className="space-y-2">
            {energyData.optimal_times.slice(0, 3).map((pattern, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-blue-300/80">
                  {pattern.time} - {pattern.label}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-light/10 rounded-full h-2">
                    <div 
                      className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pattern.energy_level * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-blue-300/60 text-xs">
                    {Math.round(pattern.energy_level * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {(selectedTime || customTime) && selectedDays.length > 0 && (
        <div className="schedule-preview bg-green-500/10 rounded-xl p-4 border border-green-500/20">
          <h5 className="font-medium text-green-300 mb-2">📋 New Schedule Preview:</h5>
          <div className="text-sm text-green-300/80">
            <p>⏰ <strong>{customTime || selectedTime}</strong> on <strong>{selectedDays.join(', ')}</strong></p>
            {isOptimalTime(customTime || selectedTime) && (
              <p className="text-green-400 mt-1">✨ This is during your high-energy time!</p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-light/10 text-light rounded-lg hover:bg-light/20 transition-colors"
        >
          ← Back to Solutions
        </button>
        
        <button
          onClick={handleReschedule}
          disabled={!(selectedTime || customTime) || selectedDays.length === 0}
          className={`
            px-8 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg
            ${(selectedTime || customTime) && selectedDays.length > 0
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
              : 'bg-light/10 text-light/50 cursor-not-allowed'
            }
          `}
        >
          🚀 Reschedule Habit
        </button>
      </div>
    </div>
  );
};

export default HabitRescheduleView;