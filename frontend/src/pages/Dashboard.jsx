import { useState, useEffect } from 'react'
import Hero from '../components/Hero'
import Journey from '../components/Journey'
import EnhancedSchedule from '../components/EnhancedSchedule'
import AnalyticsInsights from '../components/AnalyticsInsights'
import FloatingChat from '../components/FloatingChat'

import EnhancedDashboard from '../components/EnhancedDashboard'
import AchievementProgress from '../components/AchievementProgress'
import AchievementNotification from '../components/AchievementNotification'
import BoboCustomization from '../components/BoboCustomization'
import BoboTestPanel from '../components/BoboTestPanel'
import VoiceCallSettings from '../components/VoiceCallSettings'
import VoiceCallButton from '../components/VoiceCallButton'

import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

function Dashboard() {
  const { user } = useAuth()
  const [currentSection, setCurrentSection] = useState('habits')
  const [showMainApp, setShowMainApp] = useState(true)
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [scheduleResetFn, setScheduleResetFn] = useState(null)
  const [testAchievement, setTestAchievement] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // Get start of current week (Monday)
      const today = new Date()
      const dayOfWeek = today.getDay()
      const monday = new Date(today)
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
      const startDate = monday.toISOString().split('T')[0]
      
      const [habitsData, completionsData] = await Promise.all([
        api.getHabits(),
        api.getCompletions({ start_date: startDate })  // Get this week's completions
      ])
      setHabits(habitsData)
      setLogs(completionsData)  // Now logs are completion records for the week
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAgentAction = async (action) => {
    try {
      if (action.type === 'create_habit') {
        const newHabit = await api.createHabit({ ...action.data, user_id: 'default_user' })
        // Optimistically add the new habit instead of reloading all data
        setHabits(prev => [...prev, newHabit])
      }
      // Add more action handlers as needed
    } catch (error) {
      console.error('Failed to execute action:', error)
      // If creation fails, reload data to ensure consistency
      loadData()
    }
  }

  // Optimized refresh function for habit creation
  const handleHabitCreated = async (habitData) => {
    try {
      const newHabit = await api.createHabit({ ...habitData, user_id: 'default_user' })
      setHabits(prev => [...prev, newHabit])
      return newHabit
    } catch (error) {
      console.error('Failed to create habit:', error)
      throw error
    }
  }

  // Optimized refresh function for completion
  const handleCompletionCreated = async (completionData) => {
    // Optimistic update: add completion immediately with temporary ID
    const optimisticCompletion = {
      ...completionData,
      id: `temp_${Date.now()}`, // Temporary ID
      completed_at: new Date().toISOString()
    }
    
    // Update UI immediately
    setLogs(prev => [...prev, optimisticCompletion])
    
    try {
      // Create completion in background
      const newCompletion = await api.createCompletion(completionData)
      
      // Replace optimistic completion with real one
      setLogs(prev => prev.map(log => 
        log.id === optimisticCompletion.id ? newCompletion : log
      ))
      
      return newCompletion
    } catch (error) {
      // Remove optimistic completion on error
      setLogs(prev => prev.filter(log => log.id !== optimisticCompletion.id))
      console.error('Failed to create completion:', error)
      throw error
    }
  }

  // Optimized refresh function for completion deletion (undo)
  const handleCompletionDeleted = async (habitId, timeOfDay) => {
    const today = new Date().toISOString().split('T')[0]
    const timeOfDayId = timeOfDayMap[timeOfDay]
    
    // Find the completion to delete
    const completion = logs.find(c => 
      c.habit_id === habitId && 
      c.completed_date === today &&
      c.time_of_day_id === timeOfDayId
    )
    
    if (!completion) {
      throw new Error('Completion not found')
    }
    
    // Optimistic update: remove completion immediately
    setLogs(prev => prev.filter(log => log.id !== completion.id))
    
    try {
      // Delete completion in background
      await api.deleteCompletion(completion.id)
      return true
    } catch (error) {
      // Restore completion on error
      setLogs(prev => [...prev, completion])
      console.error('Failed to delete completion:', error)
      throw error
    }
  }

  // Time of day mapping
  const timeOfDayMap = {
    'morning': 1,
    'noon': 2, 
    'afternoon': 3,
    'night': 4
  }

  // Handle section changes and reset schedule selection
  const handleSectionChange = (section) => {
    if (currentSection === 'schedule' && section !== 'schedule' && scheduleResetFn) {
      scheduleResetFn() // Reset selected date when leaving schedule section
    }
    setCurrentSection(section)
  }

  const handleExplore = () => {
    // Smooth scroll to journey section
    setTimeout(() => {
      document.getElementById('journey')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleContinue = () => {
    setShowMainApp(true)
    // Smooth scroll to main app section
    setTimeout(() => {
      document.getElementById('main-app')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <div className="min-h-screen bg-theme-bg">
      {/* Test Achievement Notification */}
      {testAchievement && (
        <AchievementNotification 
          achievement={testAchievement}
          onClose={() => setTestAchievement(null)}
        />
      )}



      {/* Floating AI Agent Chat Widget */}
      <FloatingChat habits={habits} logs={logs} onAction={handleAgentAction} />

      {/* Hero Section */}
      <section className="min-h-screen">
        <Hero 
          onExplore={handleExplore}
          habits={habits}
          completions={logs}
          achievements={[]} 
        />
      </section>

      {/* Journey Section */}
      <section id="journey" className="min-h-screen">
        <Journey 
          onContinue={handleContinue}
          habitsCount={habits.length}
          completionsCount={logs.length}
        />
      </section>

      {/* Main App Section */}
      {showMainApp && (
        <section id="main-app" className="min-h-screen">
          {/* Sticky Navigation Bar */}
          <div className="bg-[var(--color-background)] bg-opacity-80 backdrop-blur-sm border-b border-[var(--color-border)] sticky top-0 z-10">
            <div className="max-w-[1600px] mx-auto px-6">
              <div className="flex items-center justify-center gap-2 h-16">
                <button
                  onClick={() => handleSectionChange('habits')}
                  className={`px-6 py-2 font-semibold transition rounded-lg ${
                    currentSection === 'habits'
                      ? 'bg-[var(--color-accent)] text-[var(--color-background)]'
                      : 'text-[var(--color-foreground-secondary)] hover:bg-[var(--color-glass)]'
                  }`}
                >
                  Habits
                </button>
                <button
                  onClick={() => handleSectionChange('schedule')}
                  className={`px-6 py-2 font-semibold transition rounded-lg ${
                    currentSection === 'schedule'
                      ? 'bg-[var(--color-accent)] text-[var(--color-background)]'
                      : 'text-[var(--color-foreground-secondary)] hover:bg-[var(--color-glass)]'
                  }`}
                >
                  Schedule
                </button>
                <button
                  onClick={() => handleSectionChange('calls')}
                  className={`px-6 py-2 font-semibold transition rounded-lg ${
                    currentSection === 'calls'
                      ? 'bg-[var(--color-accent)] text-[var(--color-background)]'
                      : 'text-[var(--color-foreground-secondary)] hover:bg-[var(--color-glass)]'
                  }`}
                >
                  Calls
                </button>
                <button
                  onClick={() => handleSectionChange('insights')}
                  className={`px-6 py-2 font-semibold transition rounded-lg ${
                    currentSection === 'insights'
                      ? 'bg-[var(--color-accent)] text-[var(--color-background)]'
                      : 'text-[var(--color-foreground-secondary)] hover:bg-[var(--color-glass)]'
                  }`}
                >
                  Insights
                </button>
                <button
                  onClick={() => handleSectionChange('bobo')}
                  className={`px-6 py-2 font-semibold transition rounded-lg ${
                    currentSection === 'bobo'
                      ? 'bg-[var(--color-accent)] text-[var(--color-background)]'
                      : 'text-[var(--color-foreground-secondary)] hover:bg-[var(--color-glass)]'
                  }`}
                >
                  Bobo
                </button>
              </div>
            </div>
          </div>

          {/* Content Panel - Centered */}
          <div className="max-w-[1600px] mx-auto px-6 py-8 min-h-[calc(100vh-4rem)]">
            {currentSection === 'habits' && (
              <EnhancedDashboard 
                habits={habits}
                logs={logs}
                onRefresh={loadData}
                onHabitCreated={handleHabitCreated}
                onCompletionCreated={handleCompletionCreated}
                onCompletionDeleted={handleCompletionDeleted}
              />
            )}

            {currentSection === 'schedule' && (
              <EnhancedSchedule 
                habits={habits} 
                completions={logs} 
                onSectionChange={setScheduleResetFn}
              />
            )}

            {currentSection === 'calls' && (
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h2 className="text-3xl font-bold text-light">AI Voice Call Schedule</h2>
                  <p className="text-light/60 mt-1">Set up automated check-in calls from your AI habit coach</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Voice Call Settings */}
                  <div>
                    <VoiceCallSettings userId={user?.id || 'guest'} />
                  </div>

                  {/* Right: Info & Call History */}
                  <div className="space-y-6">
                    {/* How It Works */}
                    <div className="glass rounded-xl p-6 border border-light/20">
                      <h3 className="text-lg font-bold text-light mb-3">How It Works</h3>
                      <ol className="space-y-2 text-sm text-light/80">
                        <li className="flex items-start">
                          <span className="font-semibold mr-2">1.</span>
                          <span>Choose Web Call (free) or Phone Call (premium)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold mr-2">2.</span>
                          <span>Set your preferred call times</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold mr-2">3.</span>
                          <span>Bobo calls you for natural voice conversations</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold mr-2">4.</span>
                          <span>Get personalized encouragement and habit tracking</span>
                        </li>
                      </ol>
                    </div>

                    {/* Call History */}
                    <div className="glass rounded-xl p-6">
                      <h3 className="text-lg font-bold text-light mb-4">Recent Calls</h3>
                      <p className="text-light/50 text-sm">Call history will appear here after your first call.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentSection === 'insights' && (
              <div className="space-y-8">
                <AnalyticsInsights 
                  habits={habits}
                  logs={logs}
                  onRefresh={loadData}
                />
                <AchievementProgress />
              </div>
            )}

            {currentSection === 'bobo' && (
              <BoboCustomization />
            )}
          </div>

          {/* Footer */}
          <footer className="border-t border-light/10 py-12 px-6">
            <div className="max-w-[1600px] mx-auto text-center">
              <p className="text-light/60 font-mono text-sm">
                Built with intention • Powered by AI • Designed for growth
              </p>
              <p className="text-light/40 font-mono text-xs mt-2">
                © 2024 Personal Habit Coach
              </p>
            </div>
          </footer>

          {/* Floating Voice Call Button */}
          <VoiceCallButton userId={user?.id || 'guest'} />
          
          {/* Achievement Test Floating Button */}
          <BoboTestPanel />
        </section>
      )}
    </div>
  )
}

export default Dashboard
