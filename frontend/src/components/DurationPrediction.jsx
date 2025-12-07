import { useState, useEffect } from 'react'
import { api } from '../services/api'

export default function DurationPrediction({ habit, onUpdate }) {
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (habit?.estimated_duration) {
      fetchPrediction()
    }
  }, [habit])

  const fetchPrediction = async () => {
    setLoading(true)
    try {
      const result = await api.predictDuration(habit)
      setPrediction(result)
    } catch (error) {
      console.error('Duration prediction error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!prediction || loading) return null

  const difference = prediction.predicted_duration - (habit.estimated_duration || 0)
  const showWarning = Math.abs(difference) > 5

  return (
    <div className={`mt-2 p-3 rounded-lg ${showWarning ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
      <div className="flex items-start gap-2">
        <span className="text-xl">{showWarning ? '⚠️' : '💡'}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">
            AI Prediction: {prediction.predicted_duration} minutes
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {prediction.suggestion}
          </p>
          {prediction.confidence && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-indigo-600 h-1.5 rounded-full"
                  style={{ width: `${prediction.confidence * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {Math.round(prediction.confidence * 100)}% confident
              </span>
            </div>
          )}
          {showWarning && onUpdate && (
            <button
              onClick={() => onUpdate({ estimated_duration: prediction.predicted_duration })}
              className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Apply suggestion →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
