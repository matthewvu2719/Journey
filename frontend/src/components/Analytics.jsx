import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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
    return <div className="text-center py-12">Loading analytics...</div>
  }

  if (!analytics) {
    return <div className="text-center py-12 text-gray-500">No analytics data available</div>
  }

  const difficultyData = Object.entries(analytics.success_by_difficulty).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    completions: value
  }))

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">📊 Analytics & Insights</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="text-sm opacity-90">Completion Rate</div>
          <div className="text-3xl font-bold mt-2">{analytics.average_completion_rate}%</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="text-sm opacity-90">Total Completions</div>
          <div className="text-3xl font-bold mt-2">{analytics.total_completions}</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="text-sm opacity-90">Best Time</div>
          <div className="text-2xl font-bold mt-2">{analytics.best_time_of_day}</div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="text-sm opacity-90">Best Energy</div>
          <div className="text-2xl font-bold mt-2">{analytics.best_energy_level}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completion Trend */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">7-Day Trend</h3>
          {analytics.completion_trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.completion_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="completions" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No trend data yet
            </div>
          )}
        </div>

        {/* Success by Difficulty */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Success by Difficulty</h3>
          {difficultyData.some(d => d.completions > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={difficultyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completions" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No completion data yet
            </div>
          )}
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🤖 AI Insights</h3>
        <div className="space-y-2">
          {analytics.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-3 bg-white p-4 rounded-lg">
              <div className="text-2xl">💡</div>
              <p className="text-gray-700">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
