import { useState, useEffect } from 'react'
import { getTodayDate } from '../utils/timezone'

/**
 * Hook to manage local completion state for instant UI updates
 * Syncs with actual logs but allows immediate local updates
 */
export const useLocalCompletions = (logs) => {
  const [localCompletions, setLocalCompletions] = useState(new Set())

  // Sync with actual logs when they change
  useEffect(() => {
    const today = getTodayDate()
    const todayCompletions = new Set()
    
    console.log('[LOCAL COMPLETIONS] Syncing with logs:', logs?.length || 0, 'total logs')
    console.log('[LOCAL COMPLETIONS] Today date (local):', today)
    
    if (logs && logs.length > 0) {
      logs.forEach(log => {
        // Match today's completions
        if (log.completed_date === today) {
          const key = `${log.habit_id}_${log.time_of_day_id}`
          todayCompletions.add(key)
          console.log('[LOCAL COMPLETIONS] Found today completion:', key)
        }
      })
    }
    
    console.log('[LOCAL COMPLETIONS] Today completions count:', todayCompletions.size)
    setLocalCompletions(todayCompletions)
  }, [logs])

  const addCompletion = (habitId, timeOfDayId) => {
    const key = `${habitId}_${timeOfDayId}`
    setLocalCompletions(prev => {
      const newSet = new Set(prev)
      newSet.add(key)
      return newSet
    })
    return key
  }

  const removeCompletion = (habitId, timeOfDayId) => {
    const key = `${habitId}_${timeOfDayId}`
    setLocalCompletions(prev => {
      const newSet = new Set(prev)
      newSet.delete(key)
      return newSet
    })
    return key
  }

  const isCompleted = (habitId, timeOfDayId) => {
    const key = `${habitId}_${timeOfDayId}`
    return localCompletions.has(key)
  }

  const revertCompletion = (key) => {
    setLocalCompletions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  return {
    localCompletions,
    addCompletion,
    removeCompletion,
    isCompleted,
    revertCompletion
  }
}