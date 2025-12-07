import { useState, useEffect } from 'react'
import { api } from '../services/api'

export default function DifficultyIndicator({ habit, userData = {} }) {
  const [difficulty, setDifficulty] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (habit) {
      fetchDifficulty()
    }
  }, [habit])

  const fetchDifficulty = async () => {
    setLoading(true)
    try {
      const result = await api.estimateDifficulty(habit, userData)
      setDifficulty(result)
    } catch (error) {
      console.error('Difficulty estimation error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!difficulty || loading) return null

  const levelColors = {
    easy: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    hard: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    very_hard: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
  }

  const colors = levelColors[difficulty.difficulty_level] || levelColors.medium

  return (
    <div className={`mt-2 p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
      <div className="flex items-start gap-2">
        <span className="text-xl">
          {difficulty.difficulty_level === 'easy' ? '😊' : 
           difficulty.difficulty_level === 'medium' ? '🤔' :
           difficulty.difficulty_level === 'hard' ? '😰' : '🔥'}
        </span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className={`text-sm font-semibold ${colors.text}`}>
              {difficulty.difficulty_level.replace('_', ' ').toUpperCase()} Difficulty
            </p>
            <span className={`text-xs font-semibold ${colors.text}`}>
              {Math.round(difficulty.success_probability * 100)}% success rate
            </span>
          </div>
          
          {difficulty.suggestions && difficulty.suggestions.length > 0 && (
            <div className="mt-2 space-y-1">
              {difficulty.suggestions.map((suggestion, idx) => (
                <p key={idx} className="text-xs text-gray-700">
                  • {suggestion}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
