import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'

/**
 * Timer component for real-time habit tracking
 * Tracks start/stop times, mood before/after, and actual duration
 */
export default function Timer({ habit, onComplete, onCancel }) {
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [moodBefore, setMoodBefore] = useState(null)
  const [moodAfter, setMoodAfter] = useState(null)
  const [energyLevel, setEnergyLevel] = useState(null)
  const [timerSession, setTimerSession] = useState(null)
  const [showMoodSelection, setShowMoodSelection] = useState(false)
  const intervalRef = useRef(null)

  const moods = [
    { value: 'great', emoji: '😄', label: 'Great' },
    { value: 'good', emoji: '🙂', label: 'Good' },
    { value: 'okay', emoji: '😐', label: 'Okay' },
    { value: 'bad', emoji: '😞', label: 'Bad' },
    { value: 'terrible', emoji: '😢', label: 'Terrible' }
  ]

  const energyLevels = [
    { value: 'high', emoji: '⚡', label: 'High' },
    { value: 'medium', emoji: '🔋', label: 'Medium' },
    { value: 'low', emoji: '🪫', label: 'Low' }
  ]

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = async () => {
    if (!moodBefore || !energyLevel) {
      setShowMoodSelection(true)
      return
    }

    try {
      const response = await api.startTimer({
        habit_id: habit.id,
        mood_before: moodBefore,
        energy_level: energyLevel
      })
      
      setTimerSession(response)
      setIsRunning(true)
      setShowMoodSelection(false)
    } catch (error) {
      console.error('Failed to start timer:', error)
      alert('Failed to start timer. Please try again.')
    }
  }

  const handleStop = async () => {
    if (!moodAfter) {
      alert('Please select your mood after completing the habit')
      return
    }

    try {
      setIsRunning(false)
      
      const response = await api.stopTimer({
        log_id: timerSession.log_id,
        mood_after: moodAfter,
        is_successful: true
      })
      
      if (onComplete) {
        onComplete(response)
      }
    } catch (error) {
      console.error('Failed to stop timer:', error)
      alert('Failed to stop timer. Please try again.')
    }
  }

  const handleCancel = () => {
    setIsRunning(false)
    setElapsedSeconds(0)
    setMoodBefore(null)
    setMoodAfter(null)
    setEnergyLevel(null)
    setTimerSession(null)
    setShowMoodSelection(false)
    
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <div className="glass rounded-3xl p-8 max-w-md mx-auto">
      {/* Habit Info */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">{habit.name}</h2>
        {habit.estimated_duration && (
          <p className="text-light/60 text-sm">
            Estimated: {habit.estimated_duration} minutes
          </p>
        )}
      </div>

      {/* Timer Display */}
      <div className="text-center mb-8">
        <div className="text-6xl font-mono font-bold mb-4 gradient-text">
          {formatTime(elapsedSeconds)}
        </div>
        {habit.estimated_duration && elapsedSeconds > 0 && (
          <div className="text-sm text-light/60">
            {Math.round((elapsedSeconds / 60 / habit.estimated_duration) * 100)}% of estimated time
          </div>
        )}
      </div>

      {/* Mood Selection (Before Start) */}
      {!isRunning && !timerSession && (
        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-medium mb-3">How are you feeling?</label>
            <div className="grid grid-cols-5 gap-2">
              {moods.map(mood => (
                <button
                  key={mood.value}
                  onClick={() => setMoodBefore(mood.value)}
                  className={`p-3 rounded-xl transition-all ${
                    moodBefore === mood.value
                      ? 'bg-light text-dark scale-110'
                      : 'bg-light/10 hover:bg-light/20'
                  }`}
                  title={mood.label}
                >
                  <div className="text-2xl">{mood.emoji}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Energy level?</label>
            <div className="grid grid-cols-3 gap-3">
              {energyLevels.map(level => (
                <button
                  key={level.value}
                  onClick={() => setEnergyLevel(level.value)}
                  className={`p-4 rounded-xl transition-all ${
                    energyLevel === level.value
                      ? 'bg-light text-dark'
                      : 'bg-light/10 hover:bg-light/20'
                  }`}
                >
                  <div className="text-3xl mb-1">{level.emoji}</div>
                  <div className="text-xs font-medium">{level.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mood Selection (After Stop) */}
      {!isRunning && timerSession && !moodAfter && (
        <div className="mb-8">
          <label className="block text-sm font-medium mb-3">How do you feel now?</label>
          <div className="grid grid-cols-5 gap-2">
            {moods.map(mood => (
              <button
                key={mood.value}
                onClick={() => setMoodAfter(mood.value)}
                className={`p-3 rounded-xl transition-all ${
                  moodAfter === mood.value
                    ? 'bg-light text-dark scale-110'
                    : 'bg-light/10 hover:bg-light/20'
                }`}
                title={mood.label}
              >
                <div className="text-2xl">{mood.emoji}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!isRunning && !timerSession && (
          <>
            <button
              onClick={handleStart}
              disabled={!moodBefore || !energyLevel}
              className="flex-1 px-6 py-4 bg-light text-dark font-bold rounded-full 
                hover:scale-105 transition-transform disabled:opacity-50 
                disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Start Timer
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-4 bg-light/10 text-light font-medium rounded-full 
                hover:bg-light/20 transition-colors"
            >
              Cancel
            </button>
          </>
        )}

        {isRunning && (
          <button
            onClick={() => {
              setIsRunning(false)
            }}
            className="flex-1 px-6 py-4 bg-red-500 text-white font-bold rounded-full 
              hover:bg-red-600 transition-colors"
          >
            Stop Timer
          </button>
        )}

        {!isRunning && timerSession && (
          <>
            <button
              onClick={handleStop}
              disabled={!moodAfter}
              className="flex-1 px-6 py-4 bg-light text-dark font-bold rounded-full 
                hover:scale-105 transition-transform disabled:opacity-50 
                disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Complete
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-4 bg-light/10 text-light font-medium rounded-full 
                hover:bg-light/20 transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Progress Indicator */}
      {isRunning && habit.estimated_duration && (
        <div className="mt-6">
          <div className="h-2 bg-light/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-light/50 to-light transition-all duration-1000"
              style={{
                width: `${Math.min((elapsedSeconds / 60 / habit.estimated_duration) * 100, 100)}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
