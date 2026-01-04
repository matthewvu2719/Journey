import { useState, useEffect } from 'react'
import SubtasksPanel from './SubtasksPanel'

export default function HabitDetailsView({ habit, timeOfDay, logs = [] }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (habit) {
      // Brief loading state for UI consistency
      setLoading(false)
    }
  }, [habit])

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'text-green-400 bg-green-500/20',
      medium: 'text-yellow-400 bg-yellow-500/20', 
      hard: 'text-red-400 bg-red-500/20'
    }
    return colors[difficulty] || colors.medium
  }

  const getTypeIcon = (type) => {
    if (type === 'atomic') return '⚡'
    if (type === 'big') return '💪'
    return '📋'
  }

  const getDifficultyIcon = (difficulty) => {
    if (difficulty === 'easy') return '🌟'
    if (difficulty === 'medium') return '⚡'
    if (difficulty === 'hard') return '💪'
    return '⚡'
  }

  return (
    <div className="space-y-6">
      
      {/* Description */}
      {habit.description && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/20">
          <h4 className="text-lg font-semibold text-light mb-2 flex items-center gap-2">
            📝 Description
          </h4>
          <p className="text-light/80 leading-relaxed">{habit.description}</p>
        </div>
      )}

      {/* Habit Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Type & Difficulty */}
        <div className="bg-light/5 rounded-xl p-4 border border-light/10">
          <div className="space-y-3">
            <div>
              <span className="text-light/60 text-sm">Type</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl">{getTypeIcon(habit.habit_type)}</span>
                <span className="font-medium text-light capitalize">
                  {habit.habit_type || 'Standard'}
                </span>
              </div>
            </div>
            
            <div>
              <span className="text-light/60 text-sm">Difficulty</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl">{getDifficultyIcon(habit.difficulty)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getDifficultyColor(habit.difficulty)}`}>
                  {habit.difficulty || 'Medium'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Priority & Duration */}
        <div className="bg-light/5 rounded-xl p-4 border border-light/10">
          <div className="space-y-3">
            <div>
              <span className="text-light/60 text-sm">Priority</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex">
                  {[...Array(10)].map((_, i) => (
                    <span 
                      key={i} 
                      className={`text-xs ${i < (habit.priority || 5) ? 'text-yellow-400' : 'text-light/20'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-light font-medium">{habit.priority || 5}/10</span>
              </div>
            </div>
            
            {habit.estimated_duration && (
              <div>
                <span className="text-light/60 text-sm">Duration</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl">⏱️</span>
                  <span className="font-medium text-light">
                    {habit.estimated_duration} minutes
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Information */}
      {(habit.days || habit.times_of_day) && (
        <div className="bg-light/5 rounded-xl p-4 border border-light/10">
          <h4 className="text-lg font-semibold text-light mb-3 flex items-center gap-2">
            📅 Schedule
          </h4>
          
          {habit.days && habit.days.length > 0 && (
            <div className="mb-3">
              <span className="text-light/60 text-sm">Days:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {habit.days.map(day => (
                  <span key={day} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
                    {day}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {habit.times_of_day && habit.times_of_day.length > 0 && (
            <div>
              <span className="text-light/60 text-sm">Times:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {habit.times_of_day.map(time => (
                  <span key={time} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium capitalize">
                    {time === 'morning' && '🌅 Morning'}
                    {time === 'noon' && '☀️ Noon'}
                    {time === 'afternoon' && '🌤️ Afternoon'}
                    {time === 'night' && '🌙 Night'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subtasks Panel */}
      <SubtasksPanel habitId={habit.id} />

      {/* Loading State */}
      {loading && (
        <div className="bg-light/5 rounded-xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-light/20 border-t-light rounded-full mx-auto mb-3"></div>
          <p className="text-light/60">Loading habit details...</p>
        </div>
      )}
    </div>
  )
}