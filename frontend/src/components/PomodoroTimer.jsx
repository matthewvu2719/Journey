import React, { useState, useEffect, useRef } from 'react';
import RobotMascot from './RobotMascot';

const PomodoroTimer = ({ duration = 25, habit, onComplete, onCancel }) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert minutes to seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [phase, setPhase] = useState('ready'); // 'ready' | 'running' | 'paused' | 'completed'
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            setPhase('completed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const totalSeconds = duration * 60;
    return ((totalSeconds - timeLeft) / totalSeconds) * 100;
  };

  const handleStart = () => {
    setIsRunning(true);
    setPhase('running');
  };

  const handlePause = () => {
    setIsRunning(false);
    setPhase('paused');
  };

  const handleResume = () => {
    setIsRunning(true);
    setPhase('running');
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
    setIsCompleted(false);
    setPhase('ready');
  };

  const handleComplete = (habitCompleted = false) => {
    if (onComplete) {
      onComplete({
        type: 'pomodoro_completed',
        duration: duration,
        timeSpent: duration * 60 - timeLeft,
        habitCompleted: habitCompleted,
        obstacleOvercome: true, // Mark obstacle as overcome when pomodoro is completed
        completedAt: new Date().toISOString(),
        executionData: {
          pomodoroCompleted: true,
          habitCompleted: habitCompleted,
          obstacleOvercome: true,
          timeSpent: (duration * 60) - timeLeft,
          fullDuration: duration * 60
        }
      });
    }
  };

  const getBoboEmotion = () => {
    if (isCompleted) return 'excited';
    if (isRunning) return 'focused';
    if (phase === 'paused') return 'friendly';
    return 'friendly';
  };

  const getBoboMessage = () => {
    if (isCompleted) {
      return "🎉 Amazing! You completed your focus session! Did you manage to work on your habit during this time?";
    }
    if (isRunning) {
      return `🍅 Stay focused! ${formatTime(timeLeft)} remaining. You've got this!`;
    }
    if (phase === 'paused') {
      return "⏸️ Taking a quick break? That's okay! Resume when you're ready.";
    }
    return `🍅 Ready for a ${duration}-minute focus session? I'll be here to keep you motivated!`;
  };

  return (
    <div className="pomodoro-timer p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-light mb-2 flex items-center justify-center gap-2">
          🍅 Focus Session
        </h3>
        <p className="text-sm text-light/60">
          {duration} minutes of focused work on: <strong>{habit.name}</strong>
        </p>
      </div>

      {/* Bobo Encouragement */}
      <div className="bobo-encouragement flex items-start gap-4 mb-8">
        <div className="flex-shrink-0">
          <RobotMascot 
            size="lg" 
            emotion={getBoboEmotion()}
            animate={true}
            dance={isCompleted}
          />
        </div>
        
        <div className="flex-1">
          <div className="bg-light/10 rounded-2xl p-4 relative">
            <div className="absolute -top-2 left-8 w-4 h-4 bg-light/10 rotate-45"></div>
            <div className="text-light">
              {getBoboMessage()}
            </div>
          </div>
        </div>
      </div>

      {/* Timer Display */}
      <div className="timer-display text-center">
        <div className="relative inline-block">
          {/* Circular Progress */}
          <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={isCompleted ? "#10B981" : "#8B5CF6"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
              className="transition-all duration-1000 ease-in-out"
            />
          </svg>
          
          {/* Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-light mb-1">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-light/60">
              {isCompleted ? 'Completed!' : phase === 'running' ? 'Focus Time' : 'Ready'}
            </div>
          </div>
        </div>
      </div>

      {/* Timer Controls */}
      {!isCompleted && (
        <div className="timer-controls flex gap-4 justify-center">
          {phase === 'ready' && (
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🚀 Start Focus Session
            </button>
          )}
          
          {phase === 'running' && (
            <>
              <button
                onClick={handlePause}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
              >
                ⏸️ Pause
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                🔄 Reset
              </button>
            </>
          )}
          
          {phase === 'paused' && (
            <>
              <button
                onClick={handleResume}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                ▶️ Resume
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                🔄 Reset
              </button>
            </>
          )}
        </div>
      )}

      {/* Completion Actions */}
      {isCompleted && (
        <div className="completion-actions space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-green-300 mb-2">Focus Session Complete!</h4>
            <p className="text-green-300/80 mb-4">
              Great job staying focused for {duration} minutes!
            </p>
          </div>
          
          <div className="bg-light/5 rounded-xl p-4 border border-light/10">
            <p className="text-light/80 text-center mb-4">
              Did you manage to work on "<strong>{habit.name}</strong>" during this focus session?
            </p>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleComplete(true)}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                ✅ Yes, I completed it!
              </button>
              <button
                onClick={() => handleComplete(false)}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                📝 I made progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex gap-4 justify-center mt-8">
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-light/10 text-light rounded-lg hover:bg-light/20 transition-colors"
        >
          ← Back to Solutions
        </button>
        
        {!isCompleted && (
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-light/10 text-light rounded-lg hover:bg-light/20 transition-colors"
          >
            🔄 Reset Timer
          </button>
        )}
      </div>

      {/* Focus Tips */}
      {phase === 'ready' && (
        <div className="focus-tips bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 mt-6">
          <h5 className="font-medium text-blue-300 mb-2">🎯 Focus Session Tips:</h5>
          <ul className="text-sm text-blue-300/80 space-y-1">
            <li>• Put your phone in another room or on silent</li>
            <li>• Close unnecessary browser tabs and applications</li>
            <li>• Have water and any materials you need ready</li>
            <li>• Focus solely on "{habit.name}" during this time</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;