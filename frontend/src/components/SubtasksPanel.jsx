import { useState, useEffect } from 'react'
import { api } from '../services/api'

export default function SubtasksPanel({ habitId }) {
  const [subtasks, setSubtasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [completedSubtasks, setCompletedSubtasks] = useState(new Set())

  useEffect(() => {
    if (habitId) {
      fetchSubtasks()
    }
  }, [habitId])

  const fetchSubtasks = async () => {
    try {
      setLoading(true)
      const response = await api.getHabitSubtasks(habitId)
      setSubtasks(response.subtasks || [])
      
      // Initialize completed state from database
      const completed = new Set()
      response.subtasks?.forEach(subtask => {
        if (subtask.is_completed) {
          completed.add(subtask.id)
        }
      })
      setCompletedSubtasks(completed)
    } catch (error) {
      console.error('Error fetching subtasks:', error)
      setSubtasks([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubtaskComplete = (subtaskId) => {
    setCompletedSubtasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(subtaskId)) {
        newSet.delete(subtaskId)
      } else {
        newSet.add(subtaskId)
      }
      return newSet
    })
    
    // TODO: Update subtask completion in database
    // This would require a new API endpoint to update subtask completion
  }

  if (loading) {
    return (
      <div className="bg-light/5 rounded-xl p-4 border border-light/10">
        <div className="animate-pulse">
          <div className="h-4 bg-light/10 rounded w-24 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-light/10 rounded w-full"></div>
            <div className="h-3 bg-light/10 rounded w-3/4"></div>
            <div className="h-3 bg-light/10 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!subtasks || subtasks.length === 0) {
    return null // Don't render if no subtasks
  }

  const completedCount = completedSubtasks.size
  const totalCount = subtasks.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="bg-light/5 rounded-xl p-4 border border-light/10">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-semibold text-light flex items-center gap-2">
          📋 Subtasks
        </h4>
        <span className="text-sm text-light/60">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-light/10 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-light/60 mt-1">
          {Math.round(progressPercentage)}% complete
        </p>
      </div>

      {/* Subtasks List */}
      <div className="space-y-2">
        {subtasks.map((subtask, index) => (
          <div 
            key={subtask.id || index}
            className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${
              completedSubtasks.has(subtask.id) 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-light/5 border border-light/10 hover:bg-light/10'
            }`}
          >
            <button
              onClick={() => handleSubtaskComplete(subtask.id)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                completedSubtasks.has(subtask.id)
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-light/30 hover:border-light/50'
              }`}
            >
              {completedSubtasks.has(subtask.id) && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            <div className="flex-1">
              <span 
                className={`text-sm transition-all duration-200 ${
                  completedSubtasks.has(subtask.id) 
                    ? 'text-light/60 line-through' 
                    : 'text-light'
                }`}
              >
                {subtask.name}
              </span>
              {subtask.description && (
                <p className="text-xs text-light/50 mt-1">{subtask.description}</p>
              )}
            </div>
            
            {subtask.estimated_duration && (
              <span className="text-xs text-light/40">
                {subtask.estimated_duration}m
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Completion Message */}
      {completedCount === totalCount && totalCount > 0 && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-400 text-sm font-medium text-center">
            🎉 All subtasks completed! Great job!
          </p>
        </div>
      )}
    </div>
  )
}