import React, { useState, useEffect } from 'react';

const SolutionCard = ({ solution, isSelected, onSelect, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Stagger the animation based on delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getActionIcon = (actionType) => {
    const icons = {
      environment: '🏠',
      technology: '📱',
      mindset: '🧠',
      pomodoro: '🍅',
      reschedule: '⏰',
      reduce: '⚡',
      breakdown: '🧩',
      reminder: '🔔',
      visual_cue: '👁️',
      habit_stack: '🔗',
      energy_boost: '💪',
      minimum_version: '🎯'
    };
    return icons[actionType] || '💡';
  };

  const getActionLabel = (actionType) => {
    const labels = {
      environment: 'Environment Change',
      technology: 'Tech Solution',
      mindset: 'Mindset Shift',
      pomodoro: 'Focus Session',
      reschedule: 'Reschedule',
      reduce: 'Simplify',
      breakdown: 'Break Down',
      reminder: 'Set Reminder',
      visual_cue: 'Visual Trigger',
      habit_stack: 'Link to Habit',
      energy_boost: 'Energy Boost',
      minimum_version: 'Minimum Version'
    };
    return labels[actionType] || 'Solution';
  };

  const getConfidenceColor = (score) => {
    if (score >= 0.8) return 'text-green-400 bg-green-500/20';
    if (score >= 0.6) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-orange-400 bg-orange-500/20';
  };

  const getConfidenceLabel = (score) => {
    if (score >= 0.8) return 'High Confidence';
    if (score >= 0.6) return 'Medium Confidence';
    return 'Worth Trying';
  };

  return (
    <div
      className={`
        solution-card relative cursor-pointer p-6 rounded-xl border-2 transition-all duration-300 transform
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        ${isSelected 
          ? 'border-purple-500 bg-gradient-to-br from-purple-500/20 to-pink-500/20 scale-105 shadow-xl' 
          : 'border-light/20 bg-light/5 hover:border-purple-400/50 hover:bg-light/10 hover:scale-102 hover:shadow-lg'
        }
      `}
      onClick={onSelect}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center animate-pulse">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl">
            {getActionIcon(solution.action_type)}
          </div>
          
          <div>
            <h4 className={`font-bold text-lg transition-colors duration-200 ${
              isSelected ? 'text-purple-300' : 'text-light'
            }`}>
              {solution.title}
            </h4>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              isSelected ? 'bg-purple-400/20 text-purple-200' : 'bg-light/10 text-light/60'
            }`}>
              {getActionLabel(solution.action_type)}
            </span>
          </div>
        </div>

        {/* Confidence Score */}
        {solution.confidence_score && (
          <div className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceColor(solution.confidence_score)}`}>
            {getConfidenceLabel(solution.confidence_score)}
          </div>
        )}
      </div>

      {/* Description */}
      <p className={`text-sm leading-relaxed mb-4 transition-colors duration-200 ${
        isSelected ? 'text-purple-200' : 'text-light/70'
      }`}>
        {solution.description}
      </p>

      {/* Action Data Preview */}
      {solution.action_data && (
        <div className="bg-light/5 rounded-lg p-3 border border-light/10">
          <div className="text-xs text-light/60 mb-1">Action Details:</div>
          <div className="text-sm text-light/80">
            {solution.action_type === 'pomodoro' && solution.action_data.duration && (
              <span>🍅 {solution.action_data.duration} minute focus session</span>
            )}
            {solution.action_type === 'reschedule' && solution.action_data.suggested_time && (
              <span>⏰ Best time: {solution.action_data.suggested_time}</span>
            )}
            {solution.action_type === 'reduce' && solution.action_data.reduction && (
              <span>⚡ Reduce by {Math.round(solution.action_data.reduction * 100)}%</span>
            )}
            {solution.action_type === 'breakdown' && solution.action_data.subtasks && (
              <div>
                <span>🧩 {solution.action_data.subtasks.length} smaller steps</span>
                <div className="mt-1 text-xs text-light/60">
                  {solution.action_data.subtasks.slice(0, 2).map((subtask, idx) => (
                    <div key={idx}>• {subtask}</div>
                  ))}
                  {solution.action_data.subtasks.length > 2 && (
                    <div>• ... and {solution.action_data.subtasks.length - 2} more</div>
                  )}
                </div>
              </div>
            )}
            {!['pomodoro', 'reschedule', 'reduce', 'breakdown'].includes(solution.action_type) && (
              <span>💡 Ready to implement</span>
            )}
          </div>
        </div>
      )}

      {/* Hover Effect Overlay */}
      <div className={`
        absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 transition-opacity duration-300
        ${!isSelected ? 'hover:opacity-5' : ''}
      `} />

      {/* Journey-themed decorative elements */}
      {isSelected && (
        <div className="absolute bottom-2 right-2 opacity-20">
          <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default SolutionCard;