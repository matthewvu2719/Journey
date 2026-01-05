import React, { useState } from 'react';
import PomodoroTimer from './PomodoroTimer';
import HabitRescheduleView from './HabitRescheduleView';
import HabitBreakdownConfirm from './HabitBreakdownConfirm';
import SMSReminderSetup from './SMSReminderSetup';
import RobotMascot from './RobotMascot';
import { api } from '../services/api';

const FrictionActionHandler = ({ 
  solution, 
  habit, 
  onComplete, 
  onBack, 
  onCancel,
  onHabitUpdate
}) => {
  const [actionState, setActionState] = useState('confirm'); // 'confirm' | 'executing' | 'completed'
  const [executionData, setExecutionData] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleExecuteAction = async () => {
    setActionState('executing');
    
    try {
      switch (solution.action_type) {
        case 'pomodoro':
          // Pomodoro timer will handle its own execution
          break;
        case 'reschedule':
          // Reschedule interface will handle the rescheduling
          break;
        case 'smart_reschedule':
          // Smart reschedule will auto-apply
          await handleSmartReschedule();
          break;
        case 'shorten_duration':
          // Shorten duration will auto-apply
          await handleShortenDuration();
          break;
        case 'sms_reminder':
          // SMS reminder setup will handle its own flow
          break;
        case 'breakdown':
          // Breakdown confirmation will handle the habit splitting
          break;
        case 'reduce':
          await handleDurationReduction();
          break;
        case 'environment':
          await handleEnvironmentChange();
          break;
        case 'reminder':
          await handleReminderSetup();
          break;
        default:
          await handleGenericAction();
      }
    } catch (error) {
      console.error('Error executing solution:', error);
      setActionState('confirm');
    }
  };

  const handleSmartReschedule = async () => {
    setIsApplying(true);
    try {
      const suggestedTime = solution.action_data?.suggested_time || 'morning';
      
      // Call API to update habit schedule
      await api.updateHabitSchedule(habit.id, {
        time_of_day: suggestedTime
      });
      
      setExecutionData({
        type: 'smart_rescheduled',
        suggestedTime: suggestedTime,
        message: `Habit rescheduled to ${suggestedTime} based on your energy patterns`,
        obstacleOvercome: true
      });
      
      setActionState('completed');
    } catch (error) {
      console.error('Error applying smart reschedule:', error);
      setExecutionData({
        type: 'smart_reschedule_failed',
        error: error.message || 'Failed to reschedule habit'
      });
      setActionState('completed');
    } finally {
      setIsApplying(false);
    }
  };

  const handleShortenDuration = async () => {
    setIsApplying(true);
    try {
      const newDuration = solution.action_data?.new_duration || Math.ceil(habit.estimated_duration / 2);
      
      // Call API to update habit duration
      await api.updateHabit(habit.id, {
        estimated_duration: newDuration
      });
      
      setExecutionData({
        type: 'duration_shortened',
        originalDuration: habit.estimated_duration,
        newDuration: newDuration,
        message: `Duration reduced from ${habit.estimated_duration} to ${newDuration} minutes`,
        obstacleOvercome: true
      });
      
      // Trigger refresh to update the view with new habit data
      if (onHabitUpdate) {
        onHabitUpdate();
      }
      
      setActionState('completed');
    } catch (error) {
      console.error('Error shortening duration:', error);
      setExecutionData({
        type: 'shorten_duration_failed',
        error: error.message || 'Failed to update habit duration'
      });
      setActionState('completed');
    } finally {
      setIsApplying(false);
    }
  };

  const handleDurationReduction = async () => {
    // Calculate new duration based on reduction factor
    const reduction = solution.action_data?.reduction || 0.5;
    const newDuration = Math.round(habit.duration * (1 - reduction));
    
    setExecutionData({
      type: 'duration_reduced',
      originalDuration: habit.duration,
      newDuration: newDuration,
      reduction: reduction,
      obstacleOvercome: true
    });
    
    setActionState('completed');
  };

  const handleEnvironmentChange = async () => {
    setExecutionData({
      type: 'environment_modified',
      suggestions: solution.action_data?.suggestions || [
        'Phone placed in another room',
        'Workspace cleared of distractions',
        'Focus music or white noise ready'
      ],
      obstacleOvercome: true
    });
    
    setActionState('completed');
  };

  const handleReminderSetup = async () => {
    setExecutionData({
      type: 'reminder_set',
      reminderType: solution.action_data?.type || 'notification',
      timing: solution.action_data?.timing || '15 minutes before',
      obstacleOvercome: true
    });
    
    setActionState('completed');
  };

  const handleGenericAction = async () => {
    setExecutionData({
      type: 'action_completed',
      message: `${solution.title} has been set up successfully!`,
      obstacleOvercome: true
    });
    
    setActionState('completed');
  };

  const handleActionComplete = (result) => {
    setExecutionData(result);
    setActionState('completed');
  };

  const handleFinalComplete = () => {
    if (onComplete) {
      onComplete({
        solution,
        executionData,
        habitCompleted: executionData?.habitCompleted || false
      });
    }
  };

  // Render specific action interfaces
  if (actionState === 'executing') {
    switch (solution.action_type) {
      case 'pomodoro':
        return (
          <PomodoroTimer
            duration={solution.action_data?.duration || 25}
            habit={habit}
            onComplete={handleActionComplete}
            onCancel={() => setActionState('confirm')}
          />
        );
      
      case 'reschedule':
        return (
          <HabitRescheduleView
            habit={habit}
            suggestedTime={solution.action_data?.suggested_time}
            energyPatterns={solution.action_data?.energy_patterns}
            onComplete={handleActionComplete}
            onCancel={() => setActionState('confirm')}
          />
        );
      
      case 'breakdown':
        return (
          <HabitBreakdownConfirm
            habit={habit}
            subtasks={solution.action_data?.subtasks || []}
            onComplete={handleActionComplete}
            onCancel={() => setActionState('confirm')}
          />
        );
      
      case 'sms_reminder':
        return (
          <SMSReminderSetup
            habit={habit}
            onComplete={handleActionComplete}
            onCancel={() => setActionState('confirm')}
          />
        );
    }
  }

  return (
    <div className="friction-action-handler p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-light mb-2 flex items-center justify-center gap-2">
          🚀 Ready to Take Action
        </h3>
        <p className="text-sm text-light/60">
          Let's implement: {solution.title}
        </p>
      </div>

      {/* Bobo Encouragement */}
      <div className="bobo-encouragement flex items-start gap-4 mb-8">
        <div className="flex-shrink-0">
          <RobotMascot 
            size="lg" 
            emotion="excited" 
            animate={true}
            dance={actionState === 'completed'}
          />
        </div>
        
        <div className="flex-1">
          <div className="bg-light/10 rounded-2xl p-4 relative">
            <div className="absolute -top-2 left-8 w-4 h-4 bg-light/10 rotate-45"></div>
            <div className="text-light">
              {actionState === 'confirm' && (
                <>
                  🎯 Great choice! This solution has helped many adventurers overcome similar obstacles. 
                  Ready to give it a try?
                </>
              )}
              {actionState === 'completed' && (
                <>
                  🎉 Fantastic! You've successfully implemented the solution. 
                  {executionData?.habitCompleted 
                    ? "And you completed your habit too! Amazing work!" 
                    : "Now you're all set to tackle your habit with confidence!"
                  }
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Confirmation */}
      {actionState === 'confirm' && (
        <div className="action-preview bg-light/5 rounded-xl p-6 border border-light/10">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl flex-shrink-0">
              {solution.action_type === 'pomodoro' && '🍅'}
              {solution.action_type === 'reschedule' && '⏰'}
              {solution.action_type === 'smart_reschedule' && '🎯'}
              {solution.action_type === 'shorten_duration' && '⚡'}
              {solution.action_type === 'sms_reminder' && '📱'}
              {solution.action_type === 'breakdown' && '🧩'}
              {solution.action_type === 'reduce' && '⚡'}
              {solution.action_type === 'environment' && '🏠'}
              {solution.action_type === 'reminder' && '🔔'}
              {!['pomodoro', 'reschedule', 'smart_reschedule', 'shorten_duration', 'sms_reminder', 'breakdown', 'reduce', 'environment', 'reminder'].includes(solution.action_type) && '💡'}
            </div>
            
            <div className="flex-1">
              <h4 className="font-bold text-lg text-light mb-2">{solution.title}</h4>
              <p className="text-light/70 mb-4">{solution.description}</p>
              
              {/* Action-specific details */}
              {solution.action_type === 'pomodoro' && (
                <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                  <div className="text-sm text-red-300">
                    🍅 <strong>{solution.action_data?.duration || 25} minute</strong> focused work session
                    <br />
                    <span className="text-red-300/70">
                      Timer will start immediately and guide you through the session
                    </span>
                  </div>
                </div>
              )}
              
              {solution.action_type === 'reschedule' && (
                <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                  <div className="text-sm text-blue-300">
                    ⏰ <strong>Optimal time:</strong> {solution.action_data?.suggested_time || 'Based on your energy patterns'}
                    <br />
                    <span className="text-blue-300/70">
                      We'll help you find the perfect time slot for this habit
                    </span>
                  </div>
                </div>
              )}
              
              {solution.action_type === 'smart_reschedule' && (
                <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                  <div className="text-sm text-purple-300">
                    🎯 <strong>Best time for you:</strong> {solution.action_data?.suggested_time || 'morning'}
                    <br />
                    <span className="text-purple-300/70">
                      Based on your ML-analyzed energy patterns, this is when you perform best.
                      <br />
                      Click to automatically update your habit schedule.
                    </span>
                  </div>
                </div>
              )}
              
              {solution.action_type === 'shorten_duration' && (
                <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                  <div className="text-sm text-yellow-300">
                    ⚡ <strong>Reduce to {solution.action_data?.new_duration || Math.ceil(habit.estimated_duration / 2)} minutes</strong>
                    <br />
                    <span className="text-yellow-300/70">
                      From {habit.estimated_duration} minutes → {solution.action_data?.new_duration || Math.ceil(habit.estimated_duration / 2)} minutes
                      <br />
                      A shorter version is easier to start when energy is low.
                    </span>
                  </div>
                </div>
              )}
              
              {solution.action_type === 'sms_reminder' && (
                <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                  <div className="text-sm text-green-300">
                    📱 <strong>Daily SMS Reminders from Bobo</strong>
                    <br />
                    <span className="text-green-300/70">
                      Set up your phone number and preferred reminder times.
                      <br />
                      Bobo will text you a friendly summary of your habits each day!
                    </span>
                  </div>
                </div>
              )}
              
              {solution.action_type === 'breakdown' && (
                <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                  <div className="text-sm text-green-300">
                    🧩 <strong>{solution.action_data?.subtasks?.length || 3} smaller steps</strong>
                    <br />
                    <span className="text-green-300/70">
                      Break down "{habit.name}" into manageable pieces
                    </span>
                  </div>
                </div>
              )}
              
              {solution.action_type === 'reduce' && (
                <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                  <div className="text-sm text-yellow-300">
                    ⚡ <strong>Reduce by {Math.round((solution.action_data?.reduction || 0.5) * 100)}%</strong>
                    <br />
                    <span className="text-yellow-300/70">
                      From {habit.duration} minutes to {Math.round(habit.duration * (1 - (solution.action_data?.reduction || 0.5)))} minutes
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completion Summary */}
      {actionState === 'completed' && executionData && (
        <div className="completion-summary bg-green-500/10 rounded-xl p-6 border border-green-500/20">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-green-300 mb-2">Solution Implemented!</h4>
          </div>
          
          {executionData.type === 'duration_reduced' && (
            <div className="text-center text-green-300/80">
              <p>Habit duration reduced from <strong>{executionData.originalDuration} minutes</strong> to <strong>{executionData.newDuration} minutes</strong></p>
              <p className="text-sm text-green-300/60 mt-1">This makes it {Math.round(executionData.reduction * 100)}% easier to start!</p>
            </div>
          )}
          
          {executionData.type === 'smart_rescheduled' && (
            <div className="text-center text-green-300/80">
              <p>🎯 Habit rescheduled to <strong>{executionData.suggestedTime}</strong></p>
              <p className="text-sm text-green-300/60 mt-1">Your habit will now appear during your peak energy time!</p>
            </div>
          )}
          
          {executionData.type === 'duration_shortened' && (
            <div className="text-center text-green-300/80">
              <p>⚡ Duration reduced from <strong>{executionData.originalDuration} minutes</strong> to <strong>{executionData.newDuration} minutes</strong></p>
              <p className="text-sm text-green-300/60 mt-1">A shorter habit is easier to start when energy is low!</p>
            </div>
          )}
          
          {(executionData.type === 'smart_reschedule_failed' || executionData.type === 'shorten_duration_failed') && (
            <div className="text-center text-red-300/80">
              <p>❌ {executionData.error}</p>
              <p className="text-sm text-red-300/60 mt-1">Please try again or choose a different solution.</p>
            </div>
          )}
          
          {executionData.type === 'environment_modified' && (
            <div className="text-center text-green-300/80">
              <p className="mb-2">Environment optimized for success:</p>
              <ul className="text-sm text-green-300/60 space-y-1">
                {executionData.suggestions.map((suggestion, idx) => (
                  <li key={idx}>✓ {suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          {executionData.type === 'reminder_set' && (
            <div className="text-center text-green-300/80">
              <p>Reminder configured: <strong>{executionData.reminderType}</strong></p>
              <p className="text-sm text-green-300/60 mt-1">You'll be notified {executionData.timing}</p>
            </div>
          )}
          
          {executionData.type === 'sms_reminder_set' && (
            <div className="text-center text-green-300/80">
              <p>📱 SMS Reminders activated!</p>
              <p className="text-sm text-green-300/60 mt-1">
                Bobo will text you at: <strong>{executionData.reminderTimes?.join(', ')}</strong>
              </p>
              <p className="text-sm text-green-300/60 mt-1">
                Phone: {executionData.phoneNumber}
              </p>
            </div>
          )}
          
          {executionData.habitCompleted && (
            <div className="mt-4 p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <p className="text-purple-300 text-center font-medium">
                🎉 Bonus: You also completed your habit during this process!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        {actionState === 'confirm' && (
          <>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-light/10 text-light rounded-lg hover:bg-light/20 transition-colors"
            >
              ← Choose Different Solution
            </button>
            
            <button
              onClick={handleExecuteAction}
              className="px-8 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🚀 Let's Do This!
            </button>
          </>
        )}
        
        {actionState === 'completed' && (
          <>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-light/10 text-light rounded-lg hover:bg-light/20 transition-colors"
            >
              Try Another Solution
            </button>
            
            <button
              onClick={handleFinalComplete}
              className="px-8 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {executionData?.habitCompleted ? '🎉 Awesome!' : '✓ Continue with Habit'}
            </button>
          </>
        )}
        
        {actionState === 'executing' && (
          <button
            onClick={() => setActionState('confirm')}
            className="px-6 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default FrictionActionHandler;