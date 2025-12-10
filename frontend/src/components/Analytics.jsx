import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Analytics({ habits, logs }) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [habits, logs])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const data = await api.getAnalytics()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-[var(--color-foreground)]">Loading analytics...</div>
  }

  if (!analytics) {
    return <div className="text-center py-12 text-[var(--color-foreground-secondary)]">No analytics data available</div>
  }

  const difficultyData = Object.entries(analytics.success_by_difficulty).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    completions: value
  }))

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--color-accent)] rounded-xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-90">Completion Rate</div>
          <div className="text-3xl font-bold mt-2">{analytics.average_completion_rate}%</div>
        </div>
        
        <div className="bg-[var(--color-accent)] rounded-xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-90">Total Completions</div>
          <div className="text-3xl font-bold mt-2">{analytics.total_completions}</div>
        </div>
        
        <div className="bg-[var(--color-accent)] rounded-xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-90">Best Time</div>
          <div className="text-2xl font-bold mt-2">{analytics.best_time_of_day}</div>
        </div>
        
        <div className="bg-[var(--color-accent)] rounded-xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-90">Best Energy</div>
          <div className="text-2xl font-bold mt-2">{analytics.best_energy_level}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completion Trend */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-light mb-4">7-Day Trend</h3>
          {analytics.completion_trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.completion_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--color-foreground-secondary)'}} />
                <YAxis tick={{fill: 'var(--color-foreground-secondary)'}} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-foreground)'
                  }}
                />
                <Line type="monotone" dataKey="completions" stroke="var(--color-accent)" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-[var(--color-foreground-secondary)]">
              No trend data yet
            </div>
          )}
        </div>

        {/* Success by Difficulty */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-light mb-4">Success by Difficulty</h3>
          {difficultyData.some(d => d.completions > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={difficultyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{fill: 'var(--color-foreground-secondary)'}} />
                <YAxis tick={{fill: 'var(--color-foreground-secondary)'}} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-foreground)'
                  }}
                />
                <Bar dataKey="completions" fill="var(--color-accent)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-[var(--color-foreground-secondary)]">
              No completion data yet
            </div>
          )}
        </div>
      </div>

      {/* AI Insights */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-bold text-light mb-4">🤖 AI Insights</h3>
        <div className="space-y-2">
          {analytics.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-3 bg-light/5 p-4 rounded-xl hover:bg-light/10 transition-colors">
              <div className="text-2xl">💡</div>
              <p className="text-light">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
