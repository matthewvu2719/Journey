import { useState, useEffect } from 'react'
import { api } from '../services/api'
import Analytics from './Analytics'

export default function AnalyticsInsights({ habits, logs, onRefresh }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadStats()
  }, [habits, logs])

  const loadStats = async () => {
    try {
      const statsData = await api.getLogStats()
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-light">Bobo's Progress Report</h2>
        <p className="text-light/60 mt-1">Hey there! I've been analyzing your awesome habit journey - let me show you how amazing you're doing! 🎉</p>
      </div>

      {/* Analytics Content */}
      <div className="space-y-6">
        <Analytics habits={habits} logs={logs} />
        
        {/* Performance Trends and Success Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-6 border border-[var(--color-border)]">
            <h3 className="text-lg font-bold text-[var(--color-foreground)] mb-4">How You're Crushing It</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-foreground-secondary)]">Your Success Rate</span>
                <span className="font-semibold text-[var(--color-accent)]">
                  {habits.length > 0 ? Math.round((logs.length / (habits.length * 7)) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-foreground-secondary)]">Current Streak 🔥</span>
                <span className="font-semibold text-[var(--color-accent)]">
                  {stats?.current_streak || 0} days
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-foreground-secondary)]">Your Favorite Category</span>
                <span className="font-semibold text-[var(--color-accent)]">
                  {habits[0]?.category || 'Let\'s add some!'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-foreground-secondary)]">Habits We're Building</span>
                <span className="font-semibold text-[var(--color-accent)]">
                  {habits.length}
                </span>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-[var(--color-border)]">
            <h3 className="text-lg font-bold text-[var(--color-foreground)] mb-4">Your Amazing Achievements</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-foreground-secondary)]">Total Wins So Far!</span>
                <span className="font-semibold text-[var(--color-accent)]">{logs.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-foreground-secondary)]">This Week's Victories</span>
                <span className="font-semibold text-[var(--color-accent)]">
                  {stats?.logs_this_week || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-foreground-secondary)]">Best Streak Ever! 🌟</span>
                <span className="font-semibold text-[var(--color-accent)]">
                  {stats?.longest_streak || 0} days
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-foreground-secondary)]">Daily Average Power</span>
                <span className="font-semibold text-[var(--color-accent)]">
                  {habits.length > 0 ? Math.round(logs.length / 7) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
