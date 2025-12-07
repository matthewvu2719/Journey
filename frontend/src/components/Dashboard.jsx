import { useState, useEffect } from 'react'
import { api } from '../services/api'

export default function Dashboard({ habits, logs, onRefresh }) {
  const [stats, setStats] = useState(null)
  const [recommendations, setRecommendations] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [habits, logs])

  const loadDashboardData = async () => {
    try {
      const [statsData, recsData] = await Promise.all([
        api.getLogStats(),
        api.getRecommendations()
      ])
      setStats(statsData)
      setRecommendations(recsData.recommendations || [])
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    }
  }

  const handleLogHabit = async (habitId) => {
    try {
      await api.createLog({
        habit_id: habitId,
        mood: 'good',
        energy_level: 'high',
        completed_at: new Date().toISOString()
      })
      onRefresh()
    } catch (error) {
      console.error('Failed to log habit:', error)
    }
  }



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-3xl font-bold">{habits.length}</div>
          <div className="text-blue-100">Active Habits</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="text-4xl mb-2">✅</div>
          <div className="text-3xl font-bold">{logs.length}</div>
          <div className="text-green-100">Total Completions</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="text-4xl mb-2">🔥</div>
          <div className="text-3xl font-bold">{stats?.logs_this_week || 0}</div>
          <div className="text-purple-100">This Week</div>
        </div>
      </div>

      {/* Today's Habits */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Today's Habits</h3>
        {habits.length === 0 ? (
          <p className="text-gray-500">No habits yet. Create your first habit!</p>
        ) : (
          <div className="space-y-3">
            {habits.map(habit => (
              <div key={habit.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {habit.difficulty === 'hard' ? '💪' : habit.difficulty === 'medium' ? '⚡' : '🌟'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{habit.name}</div>
                    <div className="text-sm text-gray-500">{habit.category}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleLogHabit(habit.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  ✓ Complete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🤖 AI Recommendations</h3>
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="font-semibold text-indigo-600">{rec.habit_name}</div>
                <div className="text-sm text-gray-600 mt-1">{rec.reasoning}</div>
                <div className="text-xs text-gray-500 mt-2">
                  Recommended: {rec.recommended_time} • Confidence: {(rec.confidence_score * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
