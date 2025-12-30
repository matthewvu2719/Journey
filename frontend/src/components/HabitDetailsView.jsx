import { useState, useEffect } from 'react'
import { api } from '../services/api'
import MLPredictions from './MLPredictions'

export default function HabitDetailsView({ habit, timeOfDay, logs = [] }) {
  const [habitStats, setHabitStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (habit) {
      calculateHabitStats()
    }
  }, [habit, logs])

  const calculateHabitStats = async () => {
    try {
      setLoading(true)
      
      // Calculate stats from logs
      const habitLogs = logs.filter(log => log.habit_id === habit.id)
      
      // Calculate completion streak
      const today = new Date()
      let streak = 0
      let checkDate = new Date(today)
      
      // Check backwards from today to find streak
      while (streak < 30) { // Max check 30 days
        const dateStr = checkDate.toISOString().split('T')[0]
        const dayCompletions = habitLogs.filter(log => log.completed_date === dateStr)
        
        if (dayCompletions.length > 0) {
          streak++
        } else {
          break
        }
        
        checkDate.setDate(checkDate.getDate() - 1)
      }
      
      // Calculate success rate (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentLogs = habitLogs.filter(log => {
        const logDate = new Date(log.completed_date)
        return logDate >= thirtyDaysAgo
      })
      
      // Calculate expected completions based on habit schedule
      const expectedCompletions = calculateExpectedCompletions(habit, thirtyDaysAgo, today)
      const actualCompletions = recentLogs.length
      const successRate = expectedCompletions > 0 ? Math.round((actualCompletions / expectedCompletions) * 100) : 0
      
      // Calculate average duration
      const durationsWithData = recentLogs.filter(log => log.actual_duration && log.actual_duration > 0)
      const avgDuration = durationsWithData.length > 0 
        ? Math.round(durationsWithData.reduce((sum, log) => sum + log.actual_duration, 0) / durationsWithData.length)
        : habit.estimated_duration || 0
      
      // Find best completion time
      const timeStats = {}
      recentLogs.forEach(log => {
        const timeId = log.time_of_day_id
        if (!timeStats[timeId]) {
          timeStats[timeId] = { count: 0, totalDuration: 0 }
        }
        timeStats[timeId].count++
        if (log.actual_duration) {
          timeStats[timeId].totalDuration += log.actual_duration
        }
      })
      
      const bestTime = Object.entries(timeStats).reduce((best, [timeId, stats]) => {
        if (stats.count > (best?.count || 0)) {
          return { timeId: parseInt(timeId), count: stats.count, avgDuration: stats.totalDuration / stats.count }
        }
        return best
      }, null)
      
      setHabitStats({
        streak,
        successRate,
        avgDuration,
        totalCompletions: habitLogs.length,
        recentCompletions: recentLogs.length,
        bestTime,
        expectedCompletions,
        actualCompletions
      })
      
    } catch (error) {
      console.error('Error calculating habit stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateExpectedCompletions = (habit, startDate, endDate) => {
    const days = habit.days || []
    const times = habit.times_of_day || ['morning'] // Default to morning if no times set
    
    if (days.length === 0) {
      // If no specific days, assume daily
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      return daysDiff * times.length
    }
    
    // Count expected completions based on schedule
    let expected = 0
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' })
      if (days.includes(dayName)) {
        expected += times.length
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return expected
  }

  const getTimeOfDayName = (timeId) => {
    const timeMap = {
      1: 'Morning',
      2: 'Noon', 
      3: 'Afternoon',
      4: 'Night'
    }
    return timeMap[timeId] || 'Unknown'
  }

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

      {/* Completion Statistics */}
      {!loading && habitStats && (
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
          <h4 className="text-lg font-semibold text-light mb-3 flex items-center gap-2">
            📊 Performance Stats
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            
            {/* Success Rate */}
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {habitStats.successRate}%
              </div>
              <div className="text-light/60 text-sm">Success Rate</div>
              <div className="text-light/40 text-xs mt-1">
                {habitStats.actualCompletions}/{habitStats.expectedCompletions} (30 days)
              </div>
            </div>

            {/* Current Streak */}
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400 mb-1 flex items-center justify-center gap-1">
                🔥 {habitStats.streak}
              </div>
              <div className="text-light/60 text-sm">Day Streak</div>
              <div className="text-light/40 text-xs mt-1">
                {habitStats.streak > 0 ? 'Keep it up!' : 'Start today!'}
              </div>
            </div>

            {/* Average Duration */}
            {habitStats.avgDuration > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {habitStats.avgDuration}m
                </div>
                <div className="text-light/60 text-sm">Avg Duration</div>
                <div className="text-light/40 text-xs mt-1">
                  vs {habit.estimated_duration || 0}m planned
                </div>
              </div>
            )}

            {/* Best Time */}
            {habitStats.bestTime && (
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400 mb-1">
                  {getTimeOfDayName(habitStats.bestTime.timeId)}
                </div>
                <div className="text-light/60 text-sm">Best Time</div>
                <div className="text-light/40 text-xs mt-1">
                  {habitStats.bestTime.count} completions
                </div>
              </div>
            )}
          </div>

          {/* Total Completions */}
          <div className="mt-4 pt-4 border-t border-light/10 text-center">
            <div className="text-light/60 text-sm">Total Completions</div>
            <div className="text-xl font-bold text-light mt-1">
              {habitStats.totalCompletions}
            </div>
          </div>
        </div>
      )}

      {/* ML Insights */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-4 border border-purple-500/20">
        <h4 className="text-lg font-semibold text-light mb-3 flex items-center gap-2">
          🤖 AI Insights
        </h4>
        
        {/* Use MLPredictions component for habit analysis */}
        <MLPredictions 
          habitData={habit}
          userId="default_user"
        />
        
        {/* Additional AI insights based on stats */}
        {!loading && habitStats && (
          <div className="mt-4 space-y-2 text-sm text-light/70">
            {habitStats.successRate >= 80 && (
              <p className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Excellent consistency! You're mastering this habit.
              </p>
            )}
            
            {habitStats.successRate < 50 && (
              <p className="flex items-center gap-2">
                <span className="text-yellow-400">⚠</span>
                Consider reducing difficulty or adjusting the schedule.
              </p>
            )}
            
            {habitStats.bestTime && (
              <p className="flex items-center gap-2">
                <span className="text-blue-400">💡</span>
                You perform best during {getTimeOfDayName(habitStats.bestTime.timeId).toLowerCase()}.
              </p>
            )}
            
            {habitStats.avgDuration > 0 && habit.estimated_duration && 
             Math.abs(habitStats.avgDuration - habit.estimated_duration) > 5 && (
              <p className="flex items-center gap-2">
                <span className="text-purple-400">📊</span>
                {habitStats.avgDuration > habit.estimated_duration 
                  ? `Taking ${habitStats.avgDuration - habit.estimated_duration}m longer than planned`
                  : `Completing ${habit.estimated_duration - habitStats.avgDuration}m faster than expected`
                }
              </p>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-light/5 rounded-xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-light/20 border-t-light rounded-full mx-auto mb-3"></div>
          <p className="text-light/60">Analyzing habit performance...</p>
        </div>
      )}
    </div>
  )
}