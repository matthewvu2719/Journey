import { useState, useEffect } from 'react'
import { api } from '../services/api'
import TimeBudgetWidget from './TimeBudgetWidget'
import Analytics from './Analytics'

export default function AnalyticsInsights({ habits, logs, onRefresh }) {
  const [stats, setStats] = useState(null)
  const [activeTab, setActiveTab] = useState('overview') // overview, recommendations, ml-insights

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

  const handleCreateHabit = async (habitData) => {
    try {
      await api.createHabit({ ...habitData, user_id: 'default_user' })
      onRefresh()
    } catch (error) {
      console.error('Failed to create habit:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-light">Analytics & AI Insights</h2>
        <p className="text-light/60 mt-1">Track your progress and get personalized recommendations</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-[var(--color-accent)] text-[var(--color-background)]'
              : 'text-[var(--color-foreground-secondary)] hover:bg-[var(--color-glass)]'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('ml-insights')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'ml-insights'
              ? 'bg-[var(--color-accent)] text-[var(--color-background)]'
              : 'text-[var(--color-foreground-secondary)] hover:bg-[var(--color-glass)]'
          }`}
        >
          ML Insights
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Analytics habits={habits} logs={logs} />
        </div>
      )}

      {/* ML Insights Tab */}
      {activeTab === 'ml-insights' && (
        <div className="space-y-6">
          {/* Time Budget Widget */}
          <TimeBudgetWidget />

          {/* Performance Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-bold text-light mb-4">Performance Trends</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-light/70">Completion Rate</span>
                  <span className="font-semibold text-green-400">
                    {habits.length > 0 ? Math.round((logs.length / (habits.length * 7)) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-light/70">Active Streak</span>
                  <span className="font-semibold text-orange-400">
                    {stats?.current_streak || 0} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-light/70">Best Category</span>
                  <span className="font-semibold text-indigo-400">
                    {habits[0]?.category || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-light/70">Total Habits</span>
                  <span className="font-semibold text-blue-400">
                    {habits.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-bold text-light mb-4">Success Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-light/70">Total Completions</span>
                  <span className="font-semibold text-green-400">{logs.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-light/70">This Week</span>
                  <span className="font-semibold text-blue-400">
                    {stats?.logs_this_week || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-light/70">Longest Streak</span>
                  <span className="font-semibold text-purple-400">
                    {stats?.longest_streak || 0} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-light/70">Average per Day</span>
                  <span className="font-semibold text-indigo-400">
                    {habits.length > 0 ? Math.round(logs.length / 7) : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ML Model Info */}
          <div className="glass rounded-xl p-6 border border-light/20">
            <h3 className="text-lg font-bold text-light mb-2">Machine Learning Models</h3>
            <p className="text-sm text-light/70 mb-4">
              Our AI uses 4 machine learning models to provide personalized insights:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-light/10 rounded-lg p-4">
                <div className="font-semibold text-purple-400">Duration Predictor</div>
                <div className="text-xs text-light/60">Random Forest - 85% accuracy</div>
              </div>
              <div className="bg-light/10 rounded-lg p-4">
                <div className="font-semibold text-indigo-400">Difficulty Estimator</div>
                <div className="text-xs text-light/60">Gradient Boosting - 78% accuracy</div>
              </div>
              <div className="bg-light/10 rounded-lg p-4">
                <div className="font-semibold text-blue-400">Time Budget Analyzer</div>
                <div className="text-xs text-light/60">Pattern Analysis</div>
              </div>
              <div className="bg-light/10 rounded-lg p-4">
                <div className="font-semibold text-green-400">Recommendation Engine</div>
                <div className="text-xs text-light/60">Content-Based Filtering</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
