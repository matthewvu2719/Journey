import { useState, useEffect } from 'react'
import { api } from '../services/api'
import HabitForm from './HabitForm'
import HabitCompletionModal from './HabitCompletionModal'
import { NumberTicker } from './ui/NumberTicker'
import { Confetti } from './ui/Confetti'
import { ShimmerButton } from './ui/ShimmerButton'
import { BlurFade } from './ui/BlurFade'
import { CircularProgress } from './ui/CircularProgress'
import { DotPattern } from './ui/DotPattern'
import RobotMascot from './RobotMascot'
import AchievementNotification from './AchievementNotification'
import { useBobo } from '../contexts/BoboContext'
import { getTodayDayName, getTodayDate } from '../utils/timezone'

export default function EnhancedDashboard({ habits, logs, onRefresh, onHabitCreated, onCompletionCreated, onCompletionDeleted }) {
  const { getEquippedItems } = useBobo()
  const [stats, setStats] = useState(null)
  const [showHabitForm, setShowHabitForm] = useState(false)
  const [completingHabit, setCompletingHabit] = useState(null)
  const [completingTimeOfDay, setCompletingTimeOfDay] = useState(null)
  const [showConfetti, setShowConfetti] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState('')
  const [celebrationDance, setCelebrationDance] = useState(null)
  const [achievementToShow, setAchievementToShow] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)


  // Map time names to IDs
  const timeOfDayMap = {
    'morning': 1,
    'noon': 2,
    'afternoon': 3,
    'night': 4
  }

  useEffect(() => {
    loadDashboardData()
  }, [habits, logs])

  // Close completion form if the habit becomes completed
  useEffect(() => {
    if (completingHabit && completingTimeOfDay && isCompleted(completingHabit.id, completingTimeOfDay)) {
      setCompletingHabit(null)
      setCompletingTimeOfDay(null)
    }
  }, [logs, completingHabit, completingTimeOfDay])

  const loadDashboardData = async () => {
    try {
      console.log('[DASHBOARD DEBUG] Starting loadDashboardData')
      
      // Try to use the optimized batch API first
      try {
        console.log('[DASHBOARD DEBUG] Trying batch API...')
        const dashboardData = await api.getDashboardData()
        console.log('[DASHBOARD DEBUG] Batch API success:', dashboardData)
        setStats(dashboardData.stats)
        return
      } catch (batchError) {
        console.log('[DASHBOARD DEBUG] Batch API failed:', batchError.message)
      }
      
      // Fallback: Try individual stats API
      try {
        console.log('[DASHBOARD DEBUG] Trying individual stats API...')
        const todayStats = await api.getTodayStats()
        console.log('[DASHBOARD DEBUG] Individual API success:', todayStats)
        setStats(todayStats)
        return
      } catch (apiError) {
        console.log('[DASHBOARD DEBUG] Individual API failed:', apiError.message)
        console.log('[DASHBOARD DEBUG] Falling back to client-side calculation')
      }
      
      // Final fallback: Calculate stats client-side
      const today = getTodayDayName()
      console.log('[DASHBOARD DEBUG] Client-side calculation for day:', today)
      
      // Build list of habit instances (habit × time_of_day combinations) for today
      const habitInstances = []
      let completedInstances = 0
      let timeRemaining = 0
      
      habits.forEach(habit => {
        const habitDays = habit.days || []
        const habitTimes = habit.times_of_day || []
        
        // Check if habit is scheduled for today
        if (habitDays.length === 0 || habitDays.includes(today)) {
          // If no times specified, default to one instance
          const timesToCheck = habitTimes.length > 0 ? habitTimes : ['morning']
          
          // Create an instance for each time of day
          timesToCheck.forEach(timeOfDay => {
            habitInstances.push({
              habitId: habit.id,
              timeOfDay: timeOfDay,
              estimatedDuration: habit.estimated_duration || 0
            })
            
            // Check if this instance is completed
            if (isCompleted(habit.id, timeOfDay)) {
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
      
      const totalInstances = habitInstances.length
      const successRate = totalInstances > 0 ? Math.round((completedInstances / totalInstances) * 100) : 0
      
      const clientStats = {
        habits_today: totalInstances,  // Total habit instances (habit × time combinations)
        completed_today: completedInstances,
        success_rate_today: successRate,
        time_remaining: timeRemaining
      }
      
      console.log('[DASHBOARD DEBUG] Client-side calculated stats:', clientStats)
      setStats(clientStats)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    }
  }

  // Check if a specific habit instance is completed
  const isCompleted = (habitId, timeOfDay) => {
    const today = getTodayDate()
    const timeOfDayId = timeOfDayMap[timeOfDay]
    return api.isHabitCompleted(habitId, today, timeOfDayId, logs)
  }

  const handleStartCompletion = async (habitId, timeOfDay) => {
    const habit = habits.find(h => h.id === habitId)
    
    // Check if already completed - if so, undo it
    if (isCompleted(habitId, timeOfDay)) {
      // Don't await - let it run in background for immediate UI response
      handleUndoCompletion(habitId, timeOfDay).catch(error => {
        console.error('Failed to undo completion:', error)
      })
      return
    }
    
    // For atomic habits, complete immediately
    if (habit.habit_type === 'atomic') {
      await handleQuickComplete(habitId, timeOfDay)
      return
    }
    
    // For big habits, show the modal
    setCompletingHabit(habit)
    setCompletingTimeOfDay(timeOfDay)
  }

  const handleUndoCompletion = async (habitId, timeOfDay) => {
    try {
      if (onCompletionDeleted) {
        // Use optimized handler from parent
        await onCompletionDeleted(habitId, timeOfDay)
      } else {
        // Fallback to old method
        const today = getTodayDate()
        const timeOfDayId = timeOfDayMap[timeOfDay]
        
        // Find the completion to delete
        const completion = logs.find(c => 
          c.habit_id === habitId && 
          c.completed_date === today &&
          c.time_of_day_id === timeOfDayId
        )
        
        if (completion) {
          await api.deleteCompletion(completion.id)
          onRefresh()
        }
      }
    } catch (error) {
      console.error('Failed to undo completion:', error)
      alert('Failed to undo completion. Please try again.')
    }
  }

  const handleQuickComplete = async (habitId, timeOfDay) => {
    try {
      const today = getTodayDate()
      const completionData = {
        habit_id: habitId,
        completed_date: today,
        time_of_day_id: timeOfDayMap[timeOfDay]
      }
      
      // Show celebration immediately for better UX
      const habit = habits.find(h => h.id === habitId)
      const messages = [
        `Amazing! You completed "${habit?.name}"! 🎉`,
        `Great job on "${habit?.name}"! Keep it up! 💪`,
        `Woohoo! "${habit?.name}" is done! You're on fire! 🔥`,
        `Fantastic! Another win with "${habit?.name}"! ⭐`
      ]
      setCelebrationMessage(messages[Math.floor(Math.random() * messages.length)])
      
      // Pick random dance and show immediately
      const equippedItems = getEquippedItems()
      const unlockedDances = equippedItems?.dances || []
      const randomDance = unlockedDances.length > 0 
        ? unlockedDances[Math.floor(Math.random() * unlockedDances.length)]
        : true // Default dance
      setCelebrationDance(randomDance)
      
      // Create completion and check achievements in parallel (non-blocking)
      if (onCompletionCreated) {
        // Use optimized handler from parent
        onCompletionCreated(completionData).catch(error => {
          console.error('Failed to create completion:', error)
        })
      } else {
        // Fallback: create completion in background
        api.createCompletion(completionData).catch(error => {
          console.error('Failed to create completion:', error)
        })
      }
      
      // Check achievements in background (non-blocking)
      checkAchievements(today).catch(error => {
        console.error('Failed to check achievements:', error)
      })
      
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
      
      setShowConfetti(Date.now()) // Trigger confetti!
      onRefresh()
    } catch (error) {
      console.error('Failed to complete habit:', error)
      alert('Failed to complete habit. Please try again.')
    }
  }

  const handleSubmitCompletion = async (completionData) => {
    try {
      // Check if already completed before submitting
      if (isCompleted(completingHabit.id, completingTimeOfDay)) {
        alert('This habit is already completed for this time slot!')
        setCompletingHabit(null)
        setCompletingTimeOfDay(null)
        onRefresh()
        return
      }
      
      const today = getTodayDate()
      const completionPayload = {
        habit_id: completingHabit.id,
        completed_date: today,
        time_of_day_id: timeOfDayMap[completingTimeOfDay],
        mood_before: completionData.mood_before,
        mood_after: completionData.mood_after,
        energy_level_before: completionData.energy_level_before,
        energy_level_after: completionData.energy_level_after
      }
      
      const duration = parseInt(completionData.actual_duration)
      if (!isNaN(duration) && duration > 0) {
        completionPayload.actual_duration = duration
      }
      
      // Show celebration immediately for better UX
      const messages = [
        `Incredible! You completed "${completingHabit.name}"! 🎉`,
        `You're crushing it! "${completingHabit.name}" is done! 💪`,
        `Outstanding work on "${completingHabit.name}"! 🌟`,
        `Yes! Another "${completingHabit.name}" in the books! 🚀`
      ]
      setCelebrationMessage(messages[Math.floor(Math.random() * messages.length)])
      
      // Pick random dance and show immediately
      const equippedItems = getEquippedItems()
      const unlockedDances = equippedItems?.dances || []
      const randomDance = unlockedDances.length > 0 
        ? unlockedDances[Math.floor(Math.random() * unlockedDances.length)]
        : true // Default dance
      setCelebrationDance(randomDance)
      
      // Create completion and check achievements in parallel (non-blocking)
      if (onCompletionCreated) {
        // Use optimized handler from parent
        onCompletionCreated(completionPayload).catch(error => {
          console.error('Failed to create completion:', error)
        })
      } else {
        // Fallback: create completion in background
        api.createCompletion(completionPayload).catch(error => {
          console.error('Failed to create completion:', error)
        })
      }
      
      // Check achievements in background (non-blocking)
      checkAchievements(today).catch(error => {
        console.error('Failed to check achievements:', error)
      })
      
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
      
      setShowConfetti(Date.now()) // Trigger confetti!
      setCompletingHabit(null)
      setCompletingTimeOfDay(null)
      onRefresh()
    } catch (error) {
      console.error('Failed to log habit:', error)
      console.error('Error details:', error.response?.data)
      
      // Check if it's a duplicate completion error
      if (error.response?.data?.detail?.includes('already exists')) {
        alert('This habit is already completed for this time slot!')
        setCompletingHabit(null)
        setCompletingTimeOfDay(null)
        onRefresh() // Refresh to show correct state
      } else {
        alert('Failed to log habit. Please try again.')
      }
    }
  }

  const checkAchievements = async (date) => {
    try {
      const achievements = await api.checkAchievements(date)
      if (achievements && achievements.length > 0) {
        // Show first achievement (you can queue multiple if needed)
        setAchievementToShow(achievements[0])
      }
    } catch (error) {
      console.error('Failed to check achievements:', error)
    }
  }

  const handleCreateHabit = async (habitData) => {
    try {
      if (onHabitCreated) {
        await onHabitCreated(habitData)
      } else {
        await api.createHabit({ ...habitData, user_id: 'default_user' })
        onRefresh()
      }
      setShowHabitForm(false)
    } catch (error) {
      console.error('Failed to create habit:', error)
    }
  }

  const handleRefreshHabits = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
      // Show success feedback briefly
      setTimeout(() => {
        setIsRefreshing(false)
      }, 500)
    } catch (error) {
      console.error('Failed to refresh habits:', error)
      setIsRefreshing(false)
    }
  }



  return (
    <div className="space-y-8 relative">
      {/* Confetti Effect */}
      <Confetti trigger={showConfetti} />
      
      {/* Achievement Notification */}
      {achievementToShow && (
        <AchievementNotification 
          achievement={achievementToShow}
          onClose={() => setAchievementToShow(null)}
        />
      )}
      
      {/* Celebration Popup */}
      {showCelebration && (() => {
        const equippedItems = getEquippedItems()
        return (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce">
            <div 
              className="backdrop-blur-sm rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-4 border-4"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-accent)',
                opacity: 0.98
              }}
            >
              <RobotMascot 
                size="lg" 
                emotion="celebrating" 
                animate={true} 
                dance={celebrationDance?.animation_data || celebrationDance}
                color={equippedItems.color?.svg_data || null}
                hat={equippedItems.hat ? { svg: equippedItems.hat.svg_data } : null}
                costume={equippedItems.costume ? { svg: equippedItems.costume.svg_data } : null}
              />
              <p 
                className="text-2xl font-bold text-center max-w-md"
                style={{ color: 'var(--color-foreground)' }}
              >
                {celebrationMessage}
              </p>
            </div>
          </div>
        )
      })()}
      
      {/* Dot Pattern Background */}
      <DotPattern opacity={0.1} />

      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-3xl font-bold text-light">Habits Overview</h2>
            <button
              onClick={handleRefreshHabits}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-light/10 transition-colors disabled:opacity-50"
              title="Refresh habits data"
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
          </div>
          <p className="text-light/60">Manage and track your habits</p>
        </div>
        <button
          onClick={() => setShowHabitForm(true)}
          className="px-6 py-2 bg-light text-dark rounded-lg hover:bg-light/90 transition font-semibold"
        >
          Add Habit
        </button>
      </div>

      {showHabitForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <button
              onClick={() => setShowHabitForm(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-light/10 hover:bg-light/20 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6 text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <HabitForm
              onSubmit={handleCreateHabit}
              onCancel={() => setShowHabitForm(false)}
            />
          </div>
          <style jsx="true">{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            .animate-fade-in {
              animation: fadeIn 0.2s ease-out;
            }
            .animate-scale-in {
              animation: scaleIn 0.3s ease-out;
            }
          `}</style>
        </div>
      )}

      {/* Habit Completion Modal */}
      <HabitCompletionModal
        habit={completingHabit}
        timeOfDay={completingTimeOfDay}
        onSubmit={handleSubmitCompletion}
        onCancel={() => {
          setCompletingHabit(null)
          setCompletingTimeOfDay(null)
        }}
        isVisible={completingHabit && completingTimeOfDay}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <BlurFade delay={0}>
          <div className="glass rounded-xl p-6">
            <div className="text-3xl font-bold text-light">
              <NumberTicker value={stats?.habits_today || 0} />
            </div>
            <div className="text-light/60 text-sm">Habits Today</div>
          </div>
        </BlurFade>
        
        <BlurFade delay={0.1}>
          <div className="glass rounded-xl p-6">
            <div className="text-3xl font-bold text-light">
              <NumberTicker value={stats?.completed_today || 0} />
            </div>
            <div className="text-light/60 text-sm">Completed Today</div>
          </div>
        </BlurFade>
        
        <BlurFade delay={0.2}>
          <div className="glass rounded-xl p-6 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-light">
                <NumberTicker value={stats?.success_rate_today || 0} />%
              </div>
              <div className="text-light/60 text-sm">Today's Success</div>
            </div>
            <CircularProgress 
              value={stats?.success_rate_today || 0} 
              size={60}
              strokeWidth={4}
            />
          </div>
        </BlurFade>

        <BlurFade delay={0.3}>
          <div className="glass rounded-xl p-6">
            <div className="text-3xl font-bold text-light">
              <NumberTicker value={stats?.time_remaining || 0} />
              <span className="text-lg text-light/60 ml-1">min</span>
            </div>
            <div className="text-light/60 text-sm">Time Remaining</div>
          </div>
        </BlurFade>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-bold text-light mb-4">Today's Habits</h3>
        {habits.length === 0 ? (
          <div className="text-center py-8 text-light/50">
            <p className="text-xl">No habits yet. Create your first habit!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['morning', 'noon', 'afternoon', 'night'].map(timeOfDay => {
              // Get today's day name (Mon, Tue, Wed, etc.)
              const today = getTodayDayName()
              
              // Debug: log what we're checking
              console.log('Today is:', today)
              console.log('Checking time:', timeOfDay)
              console.log('All habits:', habits.map(h => ({ name: h.name, days: h.days, times: h.times_of_day })))
              
              // Filter habits for today AND this time of day
              const timeHabits = habits.filter(h => 
                h.times_of_day && h.times_of_day.includes(timeOfDay) && 
                h.days && h.days.includes(today)
              )
              
              // FALLBACK: Show ALL habits without proper days/times in morning slot
              const noTimeHabits = timeOfDay === 'morning' ? habits.filter(h => 
                !h.days || h.days.length === 0 || !h.times_of_day || h.times_of_day.length === 0
              ) : []
              
              const allHabits = [...timeHabits, ...noTimeHabits]
              
              return (
                <div key={timeOfDay} className="bg-light/5 rounded-xl p-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-light/80 mb-3">
                    {timeOfDay === 'morning' && '🌅 Morning'}
                    {timeOfDay === 'noon' && '☀️ Noon'}
                    {timeOfDay === 'afternoon' && '🌤️ Afternoon'}
                    {timeOfDay === 'night' && '🌙 Night'}
                  </h4>
                  <div className="space-y-2">
                    {allHabits.length === 0 ? (
                      <div className="text-center py-4 text-light/30 text-xs">
                        No habits
                      </div>
                    ) : (
                      allHabits.map(habit => {
                        const difficultyColors = {
                          easy: 'bg-green-500/20 text-green-300',
                          medium: 'bg-yellow-500/20 text-yellow-300',
                          hard: 'bg-red-500/20 text-red-300'
                        }
                        const difficultyColor = difficultyColors[habit.difficulty] || difficultyColors.medium
                        
                        return (
                        <div key={`${habit.id}-${timeOfDay}`} className={`bg-light/10 rounded-lg overflow-hidden transition-all ${
                          completingHabit?.id === habit.id && completingTimeOfDay === timeOfDay ? 'bg-light/15' : ''
                        }`}>
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-xs text-light/60">Priority {habit.priority || 5}</span>
                                {habit.difficulty && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${difficultyColor}`}>
                                    {habit.difficulty}
                                  </span>
                                )}
                                {habit.habit_type === 'atomic' && (
                                  <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded">Atomic</span>
                                )}
                                {habit.habit_type === 'big' && habit.estimated_duration && (
                                  <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">{habit.estimated_duration}m</span>
                                )}
                              </div>
                              {isCompleted(habit.id, timeOfDay) && (
                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="text-sm font-medium text-light mb-1">{habit.name}</div>
                            <div className="text-xs text-light/40 mb-2">{habit.category}</div>
                            <ShimmerButton
                              onClick={() => handleStartCompletion(habit.id, timeOfDay)}
                              className={`w-full py-1.5 rounded text-xs font-semibold transition ${
                                isCompleted(habit.id, timeOfDay)
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : 'bg-light text-dark hover:bg-light/90'
                              }`}
                            >
                              {isCompleted(habit.id, timeOfDay) ? '✓ Done (click to undo)' : 'Complete'}
                            </ShimmerButton>
                          </div>
                        </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
