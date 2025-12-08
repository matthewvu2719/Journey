import { useState, useEffect } from 'react'
import { api } from '../services/api'
import HabitForm from './HabitForm'
import { NumberTicker } from './ui/NumberTicker'
import { Confetti } from './ui/Confetti'
import { ShimmerButton } from './ui/ShimmerButton'
import { BlurFade } from './ui/BlurFade'
import { CircularProgress } from './ui/CircularProgress'
import { DotPattern } from './ui/DotPattern'
import RobotMascot from './RobotMascot'
import AchievementNotification from './AchievementNotification'
import { useBobo } from '../contexts/BoboContext'

export default function EnhancedDashboard({ habits, logs, onRefresh }) {
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
  const [completionData, setCompletionData] = useState({
    mood_before: 'good',
    mood_after: 'great',
    energy_level_before: 'high',
    energy_level_after: 'high',
    actual_duration: 0
  })

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
      setStats({
        total_logs: logs.length,
        total_habits: habits.length,
        logs_this_week: logs.length  // Simplified - logs are today's completions
      })
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    }
  }

  // Check if a specific habit instance is completed
  const isCompleted = (habitId, timeOfDay) => {
    const today = new Date().toISOString().split('T')[0]
    const timeOfDayId = timeOfDayMap[timeOfDay]
    return api.isHabitCompleted(habitId, today, timeOfDayId, logs)
  }

  const handleStartCompletion = async (habitId, timeOfDay) => {
    const habit = habits.find(h => h.id === habitId)
    
    // Check if already completed - if so, undo it
    if (isCompleted(habitId, timeOfDay)) {
      await handleUndoCompletion(habitId, timeOfDay)
      return
    }
    
    // For atomic habits, complete immediately
    if (habit.habit_type === 'atomic') {
      await handleQuickComplete(habitId, timeOfDay)
      return
    }
    
    // For big habits, show the form
    setCompletingHabit(habit)
    setCompletingTimeOfDay(timeOfDay)
    setCompletionData({
      mood_before: 'good',
      mood_after: 'great',
      energy_level_before: 'high',
      energy_level_after: 'high',
      actual_duration: habit?.estimated_duration || 0
    })
  }

  const handleUndoCompletion = async (habitId, timeOfDay) => {
    try {
      const today = new Date().toISOString().split('T')[0]
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
    } catch (error) {
      console.error('Failed to undo completion:', error)
      alert('Failed to undo completion. Please try again.')
    }
  }

  const handleQuickComplete = async (habitId, timeOfDay) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      await api.createCompletion({
        habit_id: habitId,
        completed_date: today,
        time_of_day_id: timeOfDayMap[timeOfDay]
      })
      
      // Check for achievements
      await checkAchievements(today)
      
      // Show celebration with random dance
      const habit = habits.find(h => h.id === habitId)
      const messages = [
        `Amazing! You completed "${habit?.name}"! 🎉`,
        `Great job on "${habit?.name}"! Keep it up! 💪`,
        `Woohoo! "${habit?.name}" is done! You're on fire! 🔥`,
        `Fantastic! Another win with "${habit?.name}"! ⭐`
      ]
      setCelebrationMessage(messages[Math.floor(Math.random() * messages.length)])
      
      // Pick random dance from unlocked dances, or use default
      const equippedItems = getEquippedItems()
      const unlockedDances = equippedItems?.dances || []
      const randomDance = unlockedDances.length > 0 
        ? unlockedDances[Math.floor(Math.random() * unlockedDances.length)]
        : true // Default dance
      setCelebrationDance(randomDance)
      
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
      
      setShowConfetti(Date.now()) // Trigger confetti!
      onRefresh()
    } catch (error) {
      console.error('Failed to complete habit:', error)
      alert('Failed to complete habit. Please try again.')
    }
  }

  const handleSubmitCompletion = async () => {
    try {
      // Check if already completed before submitting
      if (isCompleted(completingHabit.id, completingTimeOfDay)) {
        alert('This habit is already completed for this time slot!')
        setCompletingHabit(null)
        setCompletingTimeOfDay(null)
        onRefresh()
        return
      }
      
      const today = new Date().toISOString().split('T')[0]
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
      
      await api.createCompletion(completionPayload)
      
      // Check for achievements
      await checkAchievements(today)
      
      // Show celebration with random dance
      const messages = [
        `Incredible! You completed "${completingHabit.name}"! 🎉`,
        `You're crushing it! "${completingHabit.name}" is done! 💪`,
        `Outstanding work on "${completingHabit.name}"! 🌟`,
        `Yes! Another "${completingHabit.name}" in the books! 🚀`
      ]
      setCelebrationMessage(messages[Math.floor(Math.random() * messages.length)])
      
      // Pick random dance from unlocked dances, or use default
      const equippedItems = getEquippedItems()
      const unlockedDances = equippedItems?.dances || []
      const randomDance = unlockedDances.length > 0 
        ? unlockedDances[Math.floor(Math.random() * unlockedDances.length)]
        : true // Default dance
      setCelebrationDance(randomDance)
      
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
      await api.createHabit({ ...habitData, user_id: 'default_user' })
      setShowHabitForm(false)
      onRefresh()
    } catch (error) {
      console.error('Failed to create habit:', error)
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

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-light mb-2">Habits Overview</h2>
          <p className="text-light/60">Manage and track your habits</p>
        </div>
        <button
          onClick={() => setShowHabitForm(!showHabitForm)}
          className="px-6 py-2 bg-light text-dark rounded-lg hover:bg-light/90 transition font-semibold"
        >
          {showHabitForm ? 'Cancel' : 'Add Habit'}
        </button>
      </div>

      {showHabitForm && (
        <HabitForm
          onSubmit={handleCreateHabit}
          onCancel={() => setShowHabitForm(false)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <BlurFade delay={0}>
          <div className="glass rounded-xl p-6">
            <div className="text-3xl font-bold text-light">
              <NumberTicker value={habits.length} />
            </div>
            <div className="text-light/60 text-sm">Active Habits</div>
          </div>
        </BlurFade>
        
        <BlurFade delay={0.1}>
          <div className="glass rounded-xl p-6">
            <div className="text-3xl font-bold text-light">
              <NumberTicker value={logs.length} />
            </div>
            <div className="text-light/60 text-sm">Total Completions</div>
          </div>
        </BlurFade>
        
        <BlurFade delay={0.2}>
          <div className="glass rounded-xl p-6">
            <div className="text-3xl font-bold text-light">
              <NumberTicker value={stats?.logs_this_week || 0} />
            </div>
            <div className="text-light/60 text-sm">This Week</div>
          </div>
        </BlurFade>

        <BlurFade delay={0.3}>
          <div className="glass rounded-xl p-6 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-light">
                <NumberTicker value={habits.length > 0 ? Math.round((logs.length / (habits.length * 7)) * 100) : 0} />%
              </div>
              <div className="text-light/60 text-sm">Success Rate</div>
            </div>
            <CircularProgress 
              value={habits.length > 0 ? (logs.length / (habits.length * 7)) * 100 : 0} 
              size={60}
              strokeWidth={4}
            />
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
              const today = new Date().toLocaleDateString('en-US', { weekday: 'short' })
              
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
                          
                          {/* Completion Form - Only for Big Habits */}
                          {completingHabit?.id === habit.id && completingTimeOfDay === timeOfDay && habit.habit_type === 'big' && (
                          <div className="px-3 pb-3 space-y-2 border-t border-light/10 pt-3">
                            <h4 className="font-semibold text-light text-xs mb-2">Log Completion</h4>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-light/70 mb-1">Mood Before</label>
                                <select
                                  value={completionData.mood_before}
                                  onChange={(e) => setCompletionData({...completionData, mood_before: e.target.value})}
                                  className="w-full px-2 py-1 bg-light/10 border border-light/20 rounded text-light text-xs"
                                >
                                  <option value="poor">😞</option>
                                  <option value="okay">😐</option>
                                  <option value="good">🙂</option>
                                  <option value="great">😄</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-xs text-light/70 mb-1">Mood After</label>
                                <select
                                  value={completionData.mood_after}
                                  onChange={(e) => setCompletionData({...completionData, mood_after: e.target.value})}
                                  className="w-full px-2 py-1 bg-light/10 border border-light/20 rounded text-light text-xs"
                                >
                                  <option value="poor">😞</option>
                                  <option value="okay">😐</option>
                                  <option value="good">🙂</option>
                                  <option value="great">😄</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-light/70 mb-1">Energy Before</label>
                                <select
                                  value={completionData.energy_level_before}
                                  onChange={(e) => setCompletionData({...completionData, energy_level_before: e.target.value})}
                                  className="w-full px-2 py-1 bg-light/10 border border-light/20 rounded text-light text-xs"
                                >
                                  <option value="low">🔋</option>
                                  <option value="medium">🔋🔋</option>
                                  <option value="high">🔋🔋🔋</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-xs text-light/70 mb-1">Energy After</label>
                                <select
                                  value={completionData.energy_level_after}
                                  onChange={(e) => setCompletionData({...completionData, energy_level_after: e.target.value})}
                                  className="w-full px-2 py-1 bg-light/10 border border-light/20 rounded text-light text-xs"
                                >
                                  <option value="low">🔋</option>
                                  <option value="medium">🔋🔋</option>
                                  <option value="high">🔋🔋🔋</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs text-light/70 mb-1">Duration (min)</label>
                              <input
                                type="number"
                                min="1"
                                value={completionData.actual_duration}
                                onChange={(e) => setCompletionData({...completionData, actual_duration: parseInt(e.target.value)})}
                                className="w-full px-2 py-1 bg-light/10 border border-light/20 rounded text-light text-xs"
                              />
                            </div>

                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={handleSubmitCompletion}
                                className="flex-1 py-1.5 bg-light text-dark rounded hover:bg-light/90 transition font-semibold text-xs"
                              >
                                Submit
                              </button>
                              <button
                                onClick={() => setCompletingHabit(null)}
                                className="py-1.5 px-3 bg-light/10 text-light rounded hover:bg-light/20 transition font-semibold text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                          )}
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
