import { useState, useEffect } from 'react'
import Hero from '../components/Hero'
import Journey from '../components/Journey'
import WeeklySchedule from '../components/WeeklySchedule'
import ScheduleCalls from '../components/ScheduleCalls'
import AnalyticsInsights from '../components/AnalyticsInsights'
import FloatingChat from '../components/FloatingChat'
import GuestModeBanner from '../components/GuestModeBanner'
import EnhancedDashboard from '../components/EnhancedDashboard'
import ThemeSelector from '../components/ThemeSelector'
import CompanionSelector from '../components/CompanionSelector'
import { api } from '../services/api'

function Dashboard() {
  const [currentSection, setCurrentSection] = useState('habits')
  const [showMainApp, setShowMainApp] = useState(true)
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

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
        await api.createHabit({ ...action.data, user_id: 'default_user' })
        loadData()
      }
      // Add more action handlers as needed
    } catch (error) {
      console.error('Failed to execute action:', error)
    }
  }

  const handleExplore = () => {
    setShowMainApp(true)
    // Smooth scroll to main app section
    setTimeout(() => {
      document.getElementById('main-app')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <div className="min-h-screen bg-theme-bg">
      {/* Guest Mode Banner */}
      <GuestModeBanner />

      {/* Floating AI Agent Chat Widget */}
      <FloatingChat habits={habits} logs={logs} onAction={handleAgentAction} />

      {/* Floating Theme Selector */}
      <div className="fixed bottom-24 left-6 z-40">
        <ThemeSelector />
      </div>

      {/* Hero Section */}
      <section className="min-h-screen">
        <Hero onExplore={handleExplore} />
      </section>

      {/* Journey Section */}
      <section className="min-h-screen">
        <Journey 
          onContinue={handleExplore}
          habitsCount={habits.length}
          completionsCount={logs.length}
        />
      </section>

      {/* Companion Selector Section */}
      <section className="py-20 px-6">
        <CompanionSelector />
      </section>

      {/* Main App Section */}
      {showMainApp && (
        <section id="main-app" className="min-h-screen">
          {/* Sticky Navigation Bar */}
          <div className="bg-theme-bg bg-opacity-80 backdrop-blur-sm border-b border-light/10 sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-6">
              <div className="flex items-center justify-center gap-2 h-16">
                <button
                  onClick={() => setCurrentSection('habits')}
                  className={`px-6 py-2 font-semibold transition rounded-lg ${
                    currentSection === 'habits'
                      ? 'bg-light text-dark'
                      : 'text-light/70 hover:bg-light/10'
                  }`}
                >
                  Habits
                </button>
                <button
                  onClick={() => setCurrentSection('schedule')}
                  className={`px-6 py-2 font-semibold transition rounded-lg ${
                    currentSection === 'schedule'
                      ? 'bg-light text-dark'
                      : 'text-light/70 hover:bg-light/10'
                  }`}
                >
                  Schedule
                </button>
                <button
                  onClick={() => setCurrentSection('calls')}
                  className={`px-6 py-2 font-semibold transition rounded-lg ${
                    currentSection === 'calls'
                      ? 'bg-light text-dark'
                      : 'text-light/70 hover:bg-light/10'
                  }`}
                >
                  Calls
                </button>
                <button
                  onClick={() => setCurrentSection('insights')}
                  className={`px-6 py-2 font-semibold transition rounded-lg ${
                    currentSection === 'insights'
                      ? 'bg-light text-dark'
                      : 'text-light/70 hover:bg-light/10'
                  }`}
                >
                  Insights
                </button>
              </div>
            </div>
          </div>

          {/* Content Panel - Centered */}
          <div className="max-w-5xl mx-auto px-6 py-8 min-h-[calc(100vh-4rem)]">
            {currentSection === 'habits' && (
              <EnhancedDashboard 
                habits={habits}
                logs={logs}
                onRefresh={loadData}
              />
            )}

            {currentSection === 'schedule' && (
              <WeeklySchedule habits={habits} completions={logs} />
            )}

            {currentSection === 'calls' && (
              <ScheduleCalls />
            )}

            {currentSection === 'insights' && (
              <AnalyticsInsights 
                habits={habits}
                logs={logs}
                onRefresh={loadData}
              />
            )}
          </div>

          {/* Footer */}
          <footer className="border-t border-light/10 py-12 px-6">
            <div className="max-w-5xl mx-auto text-center">
              <p className="text-light/60 font-mono text-sm">
                Built with intention • Powered by AI • Designed for growth
              </p>
              <p className="text-light/40 font-mono text-xs mt-2">
                © 2024 Personal Habit Coach
              </p>
            </div>
          </footer>
        </section>
      )}
    </div>
  )
}

export default Dashboard
