import { useState, useEffect } from 'react'
import { api } from '../services/api'

export default function TimeBudgetWidget() {
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBudget()
  }, [])

  const fetchBudget = async () => {
    setLoading(true)
    try {
      const result = await api.getTimeBudget()
      setBudget(result)
    } catch (error) {
      console.error('Time budget error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!budget) return null

  const usagePercent = (budget.current_commitment_minutes / budget.weekly_capacity_minutes) * 100
  const isOverloaded = budget.overload

  return (
    <div className={`bg-white rounded-xl p-6 shadow-lg border-2 ${isOverloaded ? 'border-red-300' : 'border-green-300'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">⏰ Weekly Time Budget</h3>
        <button
          onClick={fetchBudget}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">
            {budget.current_commitment_minutes} / {budget.weekly_capacity_minutes} min
          </span>
          <span className={`font-semibold ${isOverloaded ? 'text-red-600' : 'text-green-600'}`}>
            {Math.round(usagePercent)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              isOverloaded ? 'bg-red-500' : usagePercent > 80 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      <div className={`p-3 rounded-lg ${isOverloaded ? 'bg-red-50' : 'bg-green-50'}`}>
        <p className={`text-sm font-semibold ${isOverloaded ? 'text-red-800' : 'text-green-800'}`}>
          {isOverloaded ? '⚠️ Overloaded!' : '✅ On Track'}
        </p>
        <p className="text-xs text-gray-700 mt-1">
          {budget.recommendation}
        </p>
      </div>

      {/* Breakdown */}
      {budget.breakdown && (
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-600 text-xs">Weekday Capacity</p>
            <p className="font-semibold text-gray-800">
              {budget.breakdown.weekday_capacity_per_day} min/day
            </p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-600 text-xs">Weekend Capacity</p>
            <p className="font-semibold text-gray-800">
              {budget.breakdown.weekend_capacity_per_day} min/day
            </p>
          </div>
        </div>
      )}

      {budget.available_minutes > 0 && (
        <div className="mt-3 text-center">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-indigo-600">{budget.available_minutes} minutes</span> available
          </p>
        </div>
      )}
    </div>
  )
}
