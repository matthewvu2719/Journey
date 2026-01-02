import { useState, useEffect } from 'react'
import WeeklyCalendarView from './WeeklyCalendarView'
import MonthlyCalendarView from './MonthlyCalendarView'
import YearlyCalendarView from './YearlyCalendarView'
import { dateUtils } from '../utils/dateUtils'
import { api } from '../services/api'

export default function EnhancedSchedule({ habits = [], completions = [], onSectionChange, onRefresh }) {
  const [view, setView] = useState('weekly')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewDate, setViewDate] = useState(new Date()) // What period user is viewing
  const [selectedDate, setSelectedDate] = useState(null) // Date selected from monthly calendar
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Smart scheduling state
  const [energyPatterns, setEnergyPatterns] = useState(null)
  const [scheduleOptimization, setScheduleOptimization] = useState(null)
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(false)
  const [isLoadingOptimization, setIsLoadingOptimization] = useState(false)
  const [selectedHabitsForReschedule, setSelectedHabitsForReschedule] = useState([])
  const [userPreferences, setUserPreferences] = useState({
    preferredTimes: [],
    avoidTimes: [],
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    flexibilityLevel: 'medium' // low, medium, high
  })

  // Load energy patterns and schedule optimization on component mount
  useEffect(() => {
    loadEnergyPatterns()
  }, [])

  // Load energy patterns from API
  const loadEnergyPatterns = async () => {
    try {
      const userId = localStorage.getItem('user_id')
      if (!userId) return

      const response = await api.getEnergyPatterns(userId)
      setEnergyPatterns(response)
      setScheduleOptimization(response.schedule_optimization)
    } catch (error) {
      console.error('Failed to load energy patterns:', error)
    }
  }

  // Generate optimal time suggestions for a habit
  const generateOptimalTimeSuggestions = (habit) => {
    if (!energyPatterns) return []

    const difficulty = habit.difficulty || 'medium'
    const optimalWindows = energyPatterns.optimal_windows || {}
    
    const suggestions = []
    
    // Based on difficulty, suggest optimal times
    if (difficulty === 'hard') {
      const peakTimes = optimalWindows.peak_performance_times || ['morning']
      suggestions.push({
        time: peakTimes[0],
        reason: 'Peak performance time for challenging habits',
        confidence: energyPatterns.confidence_score || 0.5,
        expectedSuccess: 0.85
      })
    } else if (difficulty === 'easy') {
      const lowEnergyPeriods = optimalWindows.low_energy_periods || ['evening']
      suggestions.push({
        time: lowEnergyPeriods[0],
        reason: 'Easy habits work well during lower energy periods',
        confidence: energyPatterns.confidence_score || 0.5,
        expectedSuccess: 0.75
      })
    } else {
      // Medium difficulty - suggest balanced times
      const peakTimes = optimalWindows.peak_performance_times || ['morning', 'afternoon']
      suggestions.push({
        time: peakTimes[1] || 'afternoon',
        reason: 'Balanced time for medium difficulty habits',
        confidence: energyPatterns.confidence_score || 0.5,
        expectedSuccess: 0.80
      })
    }

    return suggestions
  }

  // Detect and resolve schedule conflicts
  const detectScheduleConflicts = (proposedSchedule) => {
    const conflicts = []
    const timeSlots = {}

    // Group habits by time slot
    proposedSchedule.forEach(item => {
      const timeKey = `${item.recommended_time}_${item.recommended_day_pattern?.join(',')}`
      if (!timeSlots[timeKey]) {
        timeSlots[timeKey] = []
      }
      timeSlots[timeKey].push(item)
    })

    // Find conflicts (multiple habits at same time)
    Object.entries(timeSlots).forEach(([timeKey, habitsAtTime]) => {
      if (habitsAtTime.length > 1) {
        conflicts.push({
          timeSlot: timeKey,
          conflictingHabits: habitsAtTime,
          resolution: resolveTimeConflict(habitsAtTime)
        })
      }
    })

    return conflicts
  }

  // Resolve time conflicts by redistributing habits
  const resolveTimeConflict = (conflictingHabits) => {
    // Sort by priority score (highest first)
    const sorted = [...conflictingHabits].sort((a, b) => b.priority_score - a.priority_score)
    
    const resolutions = []
    sorted.forEach((habit, index) => {
      if (index === 0) {
        // Keep highest priority habit at original time
        resolutions.push({
          habit_id: habit.habit_id,
          action: 'keep',
          time: habit.recommended_time,
          reason: 'Highest priority habit keeps optimal time'
        })
      } else {
        // Move others to alternative times
        const alternatives = generateAlternativeTimeSlots(habit)
        resolutions.push({
          habit_id: habit.habit_id,
          action: 'reschedule',
          time: alternatives[0]?.time || 'flexible',
          reason: `Moved to avoid conflict with higher priority habit`,
          alternatives: alternatives
        })
      }
    })

    return resolutions
  }

  // Generate alternative time slots for conflict resolution
  const generateAlternativeTimeSlots = (habit) => {
    if (!energyPatterns) return []

    const timePatterns = energyPatterns.time_energy_patterns || {}
    const alternatives = []

    // Get all available time slots sorted by success rate
    Object.entries(timePatterns).forEach(([time, pattern]) => {
      if (time !== habit.recommended_time) {
        alternatives.push({
          time: time,
          successRate: pattern.success_rate || 0.5,
          energyLevel: pattern.typical_energy_before || 'medium',
          sampleSize: pattern.sample_size || 0
        })
      }
    })

    // Sort by success rate
    alternatives.sort((a, b) => b.successRate - a.successRate)
    return alternatives.slice(0, 3) // Top 3 alternatives
  }

  // Batch reschedule multiple habits
  const batchRescheduleHabits = async (habitIds, targetTimeSlots) => {
    setIsLoadingOptimization(true)
    try {
      const reschedulingResults = []

      for (let i = 0; i < habitIds.length; i++) {
        const habitId = habitIds[i]
        const targetTime = targetTimeSlots[i]
        
        // Call reschedule API for each habit
        const result = await api.rescheduleHabit(habitId, {
          new_time: targetTime.time,
          new_days: targetTime.days,
          reason: 'Batch optimization'
        })
        
        reschedulingResults.push({
          habit_id: habitId,
          success: result.success,
          new_schedule: result.new_schedule
        })
      }

      // Refresh data after batch reschedule
      await loadEnergyPatterns()
      if (onRefresh) await onRefresh()

      return reschedulingResults
    } catch (error) {
      console.error('Batch reschedule failed:', error)
      throw error
    } finally {
      setIsLoadingOptimization(false)
    }
  }

  // Learn and update user preferences based on behavior
  const updateUserPreferences = (action, data) => {
    const newPreferences = { ...userPreferences }

    switch (action) {
      case 'time_accepted':
        // User accepted a time suggestion - learn preference
        if (!newPreferences.preferredTimes.includes(data.time)) {
          newPreferences.preferredTimes.push(data.time)
        }
        break
      
      case 'time_rejected':
        // User rejected a time suggestion - learn avoidance
        if (!newPreferences.avoidTimes.includes(data.time)) {
          newPreferences.avoidTimes.push(data.time)
        }
        break
      
      case 'flexibility_changed':
        newPreferences.flexibilityLevel = data.level
        break
      
      case 'working_days_changed':
        newPreferences.workingDays = data.days
        break
    }

    setUserPreferences(newPreferences)
    
    // Persist preferences to backend
    saveUserPreferences(newPreferences)
  }

  // Save user preferences to backend
  const saveUserPreferences = async (preferences) => {
    try {
      const userId = localStorage.getItem('user_id')
      if (!userId) return

      await api.updateUserPreferences(userId, {
        scheduling_preferences: preferences
      })
    } catch (error) {
      console.error('Failed to save user preferences:', error)
    }
  }

  const views = [
    { id: 'weekly', label: 'Weekly', icon: '📅' },
    { id: 'monthly', label: 'Monthly', icon: '📆' },
    { id: 'yearly', label: 'Yearly', icon: '🗓️' }
  ]
  const getJourneyStartDate = () => {
    if (!habits || habits.length === 0) {
      return new Date() // If no habits, use today as start
    }
    
    const earliestHabit = habits.reduce((earliest, habit) => {
      if (!habit.created_at) return earliest
      const habitDate = new Date(habit.created_at)
      return !earliest || habitDate < earliest ? habitDate : earliest
    }, null)
    
    return earliestHabit || new Date()
  }

  const journeyStartDate = getJourneyStartDate()

  // Auto-advance logic - check for date changes
  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date()
      if (now.getDate() !== currentDate.getDate()) {
        setCurrentDate(now)
        // Auto-advance to current period if user was viewing current period
        if (isViewingCurrentPeriod()) {
          setViewDate(now)
        }
      }
    }
    
    // Check every hour for date changes
    const interval = setInterval(checkDateChange, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [currentDate])

  // Expose reset function for parent component
  useEffect(() => {
    if (onSectionChange) {
      onSectionChange(() => {
        setSelectedDate(null) // Reset selected date when section changes
      })
    }
  }, [onSectionChange])

  // Check if user is viewing the current period (current date is visible in the view)
  // This is independent of selectedDate - only depends on viewDate
  const isViewingCurrentPeriod = () => {
    const today = new Date()
    
    switch (view) {
      case 'weekly':
        // More robust week comparison - check if today falls within the viewed week
        const todayTime = today.getTime()
        const viewWeekStart = dateUtils.getWeekStart(new Date(viewDate))
        const viewWeekEnd = dateUtils.getWeekEnd(new Date(viewDate))
        
        // Normalize times to avoid hour/minute/second differences
        viewWeekStart.setHours(0, 0, 0, 0)
        viewWeekEnd.setHours(23, 59, 59, 999)
        
        const isInCurrentWeek = todayTime >= viewWeekStart.getTime() && todayTime <= viewWeekEnd.getTime()
        
        console.log('[DEBUG] Weekly Current Check:', {
          today: today.toDateString(),
          viewDate: viewDate.toDateString(),
          viewWeekStart: viewWeekStart.toDateString(),
          viewWeekEnd: viewWeekEnd.toDateString(),
          isInCurrentWeek
        })
        
        return isInCurrentWeek
      case 'monthly':
        // Check if today falls within the currently viewed month
        return dateUtils.isCurrentMonth(viewDate)
      case 'yearly':
        // Check if today falls within the currently viewed year
        return dateUtils.isCurrentYear(viewDate)
      default:
        return false
    }
  }



  const minSwipeDistance = 50

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      navigateNext()
    }
    if (isRightSwipe) {
      navigatePrevious()
    }
  }

  const navigatePrevious = () => {
    if (canNavigatePrevious()) {
      const newDate = dateUtils.getPreviousPeriod(viewDate, view)
      setViewDate(newDate)
    }
  }

  const navigateNext = () => {
    const newDate = dateUtils.getNextPeriod(viewDate, view)
    if (dateUtils.canNavigateNext(viewDate, view)) {
      setViewDate(newDate)
    }
  }

  const navigateToCurrent = () => {
    const today = new Date()
    setViewDate(today)
    setSelectedDate(null) // Reset selected date to show current date highlighting
  }

  const canNavigatePrevious = () => {
    if (!journeyStartDate) return true
    
    const previousPeriod = dateUtils.getPreviousPeriod(viewDate, view)
    
    switch (view) {
      case 'weekly':
        const journeyWeekStart = dateUtils.getWeekStart(journeyStartDate)
        const previousWeekStart = dateUtils.getWeekStart(previousPeriod)
        
        // Normalize dates to avoid timezone issues
        journeyWeekStart.setHours(0, 0, 0, 0)
        previousWeekStart.setHours(0, 0, 0, 0)
        
        // Allow navigation if the previous week is at or after the journey start week
        return previousWeekStart.getTime() >= journeyWeekStart.getTime()
        
      case 'monthly':
        const journeyMonthStart = dateUtils.getMonthStart(journeyStartDate)
        const previousMonthStart = dateUtils.getMonthStart(previousPeriod)
        // Allow navigation if the previous month is at or after the journey start month
        return previousMonthStart.getTime() >= journeyMonthStart.getTime()
        
      case 'yearly':
        return previousPeriod.getFullYear() >= journeyStartDate.getFullYear()
        
      default:
        return true
    }
  }

  const canNavigateNext = () => {
    return dateUtils.canNavigateNext(viewDate, view)
  }

  const handleDateClick = (date) => {
    // Navigate to weekly view and show the week containing the clicked date
    setView('weekly')
    setViewDate(new Date(date))
    setSelectedDate(new Date(date)) // Set the selected date for highlighting
  }

  const handleMonthClick = (monthDate) => {
    // Navigate to monthly view for the clicked month
    setView('monthly')
    setViewDate(monthDate)
  }

  const renderWeeklyView = () => {
    return (
      <WeeklyCalendarView 
        habits={habits} 
        completions={completions} 
        viewDate={viewDate}
        selectedDate={selectedDate}
        onDateClick={handleDateClick}
      />
    )
  }

  const renderMonthlyView = () => {
    return (
      <MonthlyCalendarView 
        habits={habits} 
        completions={completions} 
        viewDate={viewDate}
        journeyStartDate={journeyStartDate}
        onDateClick={handleDateClick}
      />
    )
  }

  const renderYearlyView = () => {
    return (
      <YearlyCalendarView 
        habits={habits} 
        completions={completions} 
        viewDate={viewDate}
        journeyStartDate={journeyStartDate}
        onMonthClick={handleMonthClick}
      />
    )
  }

  const handleRefreshSchedule = async () => {
    setIsRefreshing(true)
    try {
      // If parent provides refresh function, use it
      if (onRefresh) {
        await onRefresh()
      } else {
        // Fallback: refresh data directly
        const today = new Date()
        const dayOfWeek = today.getDay()
        const monday = new Date(today)
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
        const startDate = monday.toISOString().split('T')[0]
        
        await api.getCompletions({ start_date: startDate })
      }
      
      // Refresh energy patterns too
      await loadEnergyPatterns()
      
      // Show success feedback briefly
      setTimeout(() => {
        setIsRefreshing(false)
      }, 500)
    } catch (error) {
      console.error('Failed to refresh schedule:', error)
      setIsRefreshing(false)
    }
  }

  // Smart Scheduling Optimization Panel Component
  const OptimizationPanel = () => {
    if (!scheduleOptimization) return null

    const optimizableHabits = scheduleOptimization.optimizable_habits || 0
    const totalHabits = scheduleOptimization.total_habits || 0
    const topRecommendations = scheduleOptimization.top_recommendations || []

    return (
      <div className="bg-darker/50 border border-light/20 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-light flex items-center gap-2">
            🧠 Smart Schedule Optimization
          </h3>
          <button
            onClick={() => setShowOptimizationPanel(false)}
            className="p-1 rounded-lg hover:bg-light/10 text-light/60"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-light/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{optimizableHabits}</div>
            <div className="text-sm text-light/60">Habits can be optimized</div>
          </div>
          <div className="bg-light/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">
              {Math.round((scheduleOptimization.average_success_probability || 0.5) * 100)}%
            </div>
            <div className="text-sm text-light/60">Average success rate</div>
          </div>
          <div className="bg-light/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{totalHabits}</div>
            <div className="text-sm text-light/60">Total habits tracked</div>
          </div>
        </div>

        {topRecommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-light">Top Optimization Opportunities</h4>
            {topRecommendations.slice(0, 3).map((rec, index) => (
              <div key={rec.habit_id} className="bg-light/5 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-light">{rec.habit_name}</span>
                  <span className="text-sm text-green-400">
                    +{rec.reschedule_benefit?.improvement || 0}% success rate
                  </span>
                </div>
                <div className="text-sm text-light/70">
                  Current: {rec.current_time} → Recommended: {rec.recommended_time}
                </div>
                <div className="text-xs text-light/60">{rec.reasoning}</div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleAcceptOptimization(rec)}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => handleRejectOptimization(rec)}
                    className="px-3 py-1 bg-light/20 text-light rounded text-sm hover:bg-light/30"
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleBatchOptimization}
            disabled={isLoadingOptimization}
            className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoadingOptimization ? 'Optimizing...' : 'Apply All Optimizations'}
          </button>
          <button
            onClick={() => setShowOptimizationPanel(false)}
            className="px-4 py-2 bg-light/20 text-light rounded-lg hover:bg-light/30"
          >
            Later
          </button>
        </div>
      </div>
    )
  }

  // Handle accepting a single optimization
  const handleAcceptOptimization = async (recommendation) => {
    try {
      await api.rescheduleHabit(recommendation.habit_id, {
        new_time: recommendation.recommended_time,
        new_days: recommendation.recommended_day_pattern,
        reason: 'Smart optimization accepted'
      })

      // Learn user preference
      updateUserPreferences('time_accepted', { time: recommendation.recommended_time })
      
      // Refresh data
      await loadEnergyPatterns()
      if (onRefresh) await onRefresh()
    } catch (error) {
      console.error('Failed to apply optimization:', error)
    }
  }

  // Handle rejecting a single optimization
  const handleRejectOptimization = (recommendation) => {
    // Learn user preference
    updateUserPreferences('time_rejected', { time: recommendation.recommended_time })
  }

  // Handle batch optimization
  const handleBatchOptimization = async () => {
    if (!scheduleOptimization?.top_recommendations) return

    const recommendations = scheduleOptimization.top_recommendations.filter(
      rec => rec.reschedule_benefit?.improvement > 5 // Only apply significant improvements
    )

    const habitIds = recommendations.map(rec => rec.habit_id)
    const targetTimeSlots = recommendations.map(rec => ({
      time: rec.recommended_time,
      days: rec.recommended_day_pattern
    }))

    try {
      await batchRescheduleHabits(habitIds, targetTimeSlots)
      setShowOptimizationPanel(false)
    } catch (error) {
      console.error('Batch optimization failed:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Smart Optimization Panel */}
      {showOptimizationPanel && <OptimizationPanel />}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold text-light">Schedule</h2>
          <button
            onClick={handleRefreshSchedule}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-light/10 transition-colors disabled:opacity-50"
            title="Refresh schedule data"
          >
            <svg 
              className={`w-5 h-5 text-light/60 ${isRefreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
          {/* Smart Optimization Button */}
          {scheduleOptimization && scheduleOptimization.optimizable_habits > 0 && (
            <button
              onClick={() => setShowOptimizationPanel(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all"
              title="Smart schedule optimization available"
            >
              <span className="text-sm">🧠</span>
              <span className="text-sm font-medium">Optimize ({scheduleOptimization.optimizable_habits})</span>
            </button>
          )}
        </div>
        
        <select
          value={view}
          onChange={(e) => setView(e.target.value)}
          className="px-4 py-2 glass border border-light/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-light"
        >
          {views.map(v => (
            <option key={v.id} value={v.id}>
              {v.icon} {v.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={navigatePrevious}
          disabled={!canNavigatePrevious()}
          className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-background)] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          ← Previous
        </button>
        
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold text-light">
            {dateUtils.getPeriodDisplay(viewDate, view)}
          </div>
          {(() => {
            const isCurrentPeriod = isViewingCurrentPeriod()
            console.log('[DEBUG] Button Render:', {
              view,
              isCurrentPeriod,
              shouldShowButton: !isCurrentPeriod
            })
            return !isCurrentPeriod && (
              <button
                onClick={navigateToCurrent}
                className="px-3 py-1 bg-light text-dark rounded-lg text-sm font-medium hover:bg-light/90 transition-colors"
              >
                Current
              </button>
            )
          })()}
        </div>
        
        <button
          onClick={navigateNext}
          disabled={!canNavigateNext()}
          className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-background)] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          Next →
        </button>
      </div>

      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="touch-pan-y"
      >
        {view === 'weekly' && renderWeeklyView()}
        {view === 'monthly' && renderMonthlyView()}
        {view === 'yearly' && renderYearlyView()}
      </div>
    </div>
  )
}
