import { useMemo } from 'react'
import { getTodayDayName } from '../utils/timezone'

/**
 * Hook to calculate stats instantly from local state
 * Provides immediate updates without waiting for backend
 */
export const useInstantStats = (habits, baseStats, isCompleted) => {
  const instantStats = useMemo(() => {
    if (!baseStats) return null

    const today = getTodayDayName()
    let totalInstances = 0
    let completedInstances = 0
    let timeRemaining = 0

    habits.forEach(habit => {
      const habitDays = habit.days || []
      const habitTimes = habit.times_of_day || []
      
      // Check if habit is scheduled for today
      if (habitDays.length === 0 || habitDays.includes(today)) {
        // If no times specified, default to one instance
        const timesToCheck = habitTimes.length > 0 ? habitTimes : ['morning']
        
        timesToCheck.forEach(timeOfDay => {
          totalInstances++
          
          // Map time names to IDs for checking completion
          const timeOfDayMap = {
            'morning': 1,
            'noon': 2,
            'afternoon': 3,
            'night': 4
          }
          
          const timeOfDayId = timeOfDayMap[timeOfDay]
          
          if (isCompleted(habit.id, timeOfDayId)) {
            completedInstances++
          } else {
            // Only add duration for big habits with estimated_duration set
            if (habit.habit_type === 'big' && habit.estimated_duration) {
              timeRemaining += habit.estimated_duration
            }
          }
        })
      }
    })

    const successRate = totalInstances > 0 ? Math.round((completedInstances / totalInstances) * 100) : 0

    return {
      ...baseStats,
      habits_today: totalInstances,
      completed_today: completedInstances,
      success_rate_today: successRate,
      time_remaining: timeRemaining
    }
  }, [habits, baseStats, isCompleted])

  return instantStats
}