import { useState, useEffect } from 'react'
import { api } from '../services/api'

export default function RecommendationCards({ onCreateHabit }) {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      const result = await api.getMLRecommendations(5)
      setRecommendations(result.recommendations || [])
    } catch (error) {
      console.error('Recommendations error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800">✨ AI Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg text-center">
        <div className="text-4xl mb-2">🤖</div>
        <p className="text-gray-600">
          Complete more habits to get personalized recommendations!
        </p>
      </div>
    )
  }

  const getCategoryEmoji = (category) => {
    const emojis = {
      fitness: '💪',
      health: '🏥',
      learning: '📚',
      work: '💼',
      personal: '🌟',
      social: '👥',
      wellness: '🧘',
      default: '✨'
    }
    return emojis[category] || emojis.default
  }

  const getSuccessColor = (probability) => {
    if (probability >= 0.8) return 'text-green-600'
    if (probability >= 0.6) return 'text-yellow-600'
    return 'text-orange-600'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">✨ AI Recommendations</h3>
        <button
          onClick={fetchRecommendations}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-white to-indigo-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition border border-indigo-100"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getCategoryEmoji(rec.category)}</span>
                <h4 className="font-bold text-gray-800">{rec.habit_name}</h4>
              </div>
              <span className={`text-sm font-semibold ${getSuccessColor(rec.success_probability)}`}>
                {Math.round(rec.success_probability * 100)}%
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📅</span>
                <span>{rec.suggested_frequency}x per week</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>⏱️</span>
                <span>{rec.suggested_duration} minutes</span>
              </div>
              {rec.suggested_time && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>🕐</span>
                  <span className="capitalize">{rec.suggested_time}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-600 italic mb-4">
              "{rec.reason}"
            </p>

            {onCreateHabit && (
              <button
                onClick={() => onCreateHabit({
                  name: rec.habit_name,
                  category: rec.category,
                  target_frequency: rec.suggested_frequency,
                  estimated_duration: rec.suggested_duration,
                  difficulty: rec.success_probability >= 0.8 ? 'easy' : 
                             rec.success_probability >= 0.6 ? 'medium' : 'hard'
                })}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-semibold"
              >
                Add This Habit
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
