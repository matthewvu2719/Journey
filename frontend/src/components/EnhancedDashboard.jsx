import { useState, useEffect } from 'react'
import { api } from '../services/api'
import HabitForm from './HabitForm'
import HabitCompletionModal from './HabitCompletionModal'
import HabitDetailModal from './HabitDetailModal'
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
import { useLocalCompletions } from '../hooks/useLocalCompletions'
import { useInstantStats } from '../hooks/useInstantStats'

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
  const [detailModalHabit, setDetailModalHabit] = useState(null)
  const [detailModalTimeOfDay, setDetailModalTimeOfDay] = useState(null)

  // Use custom hooks for local completion tracking and instant stats
  const { addCompletion, removeCompletion, isCompleted: isLocallyCompleted, revertCompletion } = useLocalCompletions(logs)
  const currentStats = useInstantStats(habits, stats, isLocallyCompleted)



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
    if (completingHabit && completingTimeOfDay) {
      const timeOfDayId = timeOfDayMap[completingTimeOfDay]
      if (isLocallyCompleted(completingHabit.id, timeOfDayId)) {
        setCompletingHabit(null)
        setCompletingTimeOfDay(null)
      }
    }
  }, [isLocallyCompleted, completingHabit, completingTimeOfDay])

  const loadDashboardData = async () => {
    try {
      console.log('[DASHBOARD DEBUG] Loading initial dashboard data')
      
      // Try to use the optimized batch API first
      try {
        const dashboardData = await api.getDashboardData()
        console.log('[DASHBOARD DEBUG] Batch API success:', dashboardData)
        setStats(dashboardData.stats)
        return
      } catch (batchError) {
        console.log('[DASHBOARD DEBUG] Batch API failed:', batchError.message)
      }
      
      // Fallback: Try individual stats API
      try {
        const todayStats = await api.getTodayStats()
        console.log('[DASHBOARD DEBUG] Individual API success:', todayStats)
        setStats(todayStats)
        return
      } catch (apiError) {
        console.log('[DASHBOARD DEBUG] Individual API failed:', apiError.message)
      }
      
      // Final fallback: Set basic stats structure
      setStats({
        habits_today: 0,
        completed_today: 0,
        success_rate_today: 0,
        time_remaining: 0
      })
      
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    }
  }

  // Helper function to check completion by time name (for backward compatibility)
  const isCompletedByTimeName = (habitId, timeOfDayName) => {
    const timeOfDayId = timeOfDayMap[timeOfDayName]
    return isLocallyCompleted(habitId, timeOfDayId)
  }

  const handleStartCompletion = (habitId, timeOfDay) => {
    const habit = habits.find(h => h.id === habitId)
    
    // Check if already completed - if so, undo it
    if (isCompletedByTimeName(habitId, timeOfDay)) {
      handleUndoCompletion(habitId, timeOfDay)
      return
    }
    
    // Show detail modal for all habits now
    setDetailModalHabit(habit)
    setDetailModalTimeOfDay(timeOfDay)
  }

  const handleUndoCompletion = (habitId, timeOfDay) => {
    const timeOfDayId = timeOfDayMap[timeOfDay]
    
    // 1. Update local state immediately for instant UI response
    const key = removeCompletion(habitId, timeOfDayId)
    
    // 2. API call in background (don't await)
    const performUndo = async () => {
      try {
        if (onCompletionDeleted) {
          await onCompletionDeleted(habitId, timeOfDay)
        } else {
          const today = getTodayDate()
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
        // Revert local state on error
        revertCompletion(key)
        alert('Failed to undo completion. Please try again.')
      }
    }
    
    performUndo()
  }

  const handleQuickComplete = (habitId, timeOfDay) => {
    const habit = habits.find(h => h.id === habitId)
    const timeOfDayId = timeOfDayMap[timeOfDay]
    
    // 1. Update local state immediately for instant UI response
    const key = addCompletion(habitId, timeOfDayId)
    
    // 2. Show celebration immediately
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
    
    // Show celebration and confetti immediately
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 3000)
    setShowConfetti(Date.now())
    
    // 3. API call in background (don't await)
    const performCompletion = async () => {
      try {
        const today = getTodayDate()
        const completionData = {
          habit_id: habitId,
          completed_date: today,
          time_of_day_id: timeOfDayId
        }
        
        if (onCompletionCreated) {
          await onCompletionCreated(completionData)
        } else {
          await api.createCompletion(completionData)
          onRefresh()
        }
        
        // Check achievements in background
        checkAchievements(today).catch(error => {
          console.error('Failed to check achievements:', error)
        })
        
      } catch (error) {
        console.error('Failed to create completion:', error)
        // Revert local state on error
        revertCompletion(key)
        alert('Failed to complete habit. Please try again.')
      }
    }
    
    performCompletion()
  }

  const handleSubmitCompletion = (completionData) => {
    const timeOfDayId = timeOfDayMap[completingTimeOfDay]
    
    // Check if already completed before submitting
    if (isLocallyCompleted(completingHabit.id, timeOfDayId)) {
      alert('This habit is already completed for this time slot!')
      setCompletingHabit(null)
      setCompletingTimeOfDay(null)
      return
    }
    
    // 1. Update local state immediately for instant UI response
    const key = addCompletion(completingHabit.id, timeOfDayId)
    
    // 2. Show celebration immediately
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
    
    // Show celebration and confetti immediately
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 3000)
    setShowConfetti(Date.now())
    
    // Close modal immediately for better UX
    setCompletingHabit(null)
    setCompletingTimeOfDay(null)
    
    // 3. API call in background (don't await)
    const performCompletion = async () => {
      try {
        const today = getTodayDate()
        const completionPayload = {
          habit_id: completingHabit.id,
          completed_date: today,
          time_of_day_id: timeOfDayId,
          mood_before: completionData.mood_before,
          mood_after: completionData.mood_after,
          energy_level_before: completionData.energy_level_before,
          energy_level_after: completionData.energy_level_after
        }
        
        const duration = parseInt(completionData.actual_duration)
        if (!isNaN(duration) && duration > 0) {
          completionPayload.actual_duration = duration
        }
        
        if (onCompletionCreated) {
          await onCompletionCreated(completionPayload)
        } else {
          await api.createCompletion(completionPayload)
          onRefresh()
        }
        
        // Check achievements in background
        checkAchievements(today).catch(error => {
          console.error('Failed to check achievements:', error)
        })
        
      } catch (error) {
        console.error('Failed to create completion:', error)
        // Revert local state on error
        revertCompletion(key)
        
        if (error.response?.data?.detail?.includes('already exists')) {
          alert('This habit is already completed for this time slot!')
        } else {
          alert('Failed to log habit. Please try again.')
        }
      }
    }
    
    performCompletion()
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

  const handleDetailModalComplete = (habitId, timeOfDay) => {
    const habit = habits.find(h => h.id === habitId)
    
    // For atomic habits, complete immediately
    if (habit.habit_type === 'atomic') {
      handleQuickComplete(habitId, timeOfDay)
    } else {
      // For big habits, show the completion modal
      setCompletingHabit(habit)
      setCompletingTimeOfDay(timeOfDay)
      // Close detail modal
      setDetailModalHabit(null)
      setDetailModalTimeOfDay(null)
    }
  }

  const handleDetailModalHelp = (habitId, timeOfDay) => {
    // This will be implemented in later phases
    console.log('Help requested for habit:', habitId, 'at', timeOfDay)
    // For now, just close the modal
    setDetailModalHabit(null)
    setDetailModalTimeOfDay(null)
  }

  const handleDetailModalClose = () => {
    setDetailModalHabit(null)
    setDetailModalTimeOfDay(null)
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

      {/* Habit Detail Modal */}
      <HabitDetailModal
        habit={detailModalHabit}
        timeOfDay={detailModalTimeOfDay}
        logs={logs}
        onComplete={handleDetailModalComplete}
        onHelp={handleDetailModalHelp}
        onClose={handleDetailModalClose}
        isVisible={detailModalHabit && detailModalTimeOfDay}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <BlurFade delay={0}>
          <div className="glass rounded-xl p-6">
            <div className="text-3xl font-bold text-light">
              <NumberTicker value={currentStats?.habits_today || 0} />
            </div>
            <div className="text-light/60 text-sm">Habits Today</div>
          </div>
        </BlurFade>
        
        <BlurFade delay={0.1}>
          <div className="glass rounded-xl p-6">
            <div className="text-3xl font-bold text-light">
              <NumberTicker value={currentStats?.completed_today || 0} />
            </div>
            <div className="text-light/60 text-sm">Completed Today</div>
          </div>
        </BlurFade>
        
        <BlurFade delay={0.2}>
          <div className="glass rounded-xl p-6 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-light">
                <NumberTicker value={currentStats?.success_rate_today || 0} />%
              </div>
              <div className="text-light/60 text-sm">Today's Success</div>
            </div>
            <CircularProgress 
              value={currentStats?.success_rate_today || 0} 
              size={60}
              strokeWidth={4}
              textSize="text-sm"
            />
          </div>
        </BlurFade>

        <BlurFade delay={0.3}>
          <div className="glass rounded-xl p-6">
            <div className="text-3xl font-bold text-light">
              <NumberTicker value={currentStats?.time_remaining || 0} />
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
                              {isCompletedByTimeName(habit.id, timeOfDay) && (
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
                                isCompletedByTimeName(habit.id, timeOfDay)
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : 'bg-light text-dark hover:bg-light/90'
                              }`}
                            >
                              {isCompletedByTimeName(habit.id, timeOfDay) ? '✓ Done (click to undo)' : 'View Details'}
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
