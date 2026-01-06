import { useState, useEffect } from 'react'
import { api } from '../services/api'

export default function SubtasksPanel({ habitId }) {
  const [sessions, setSessions] = useState(null) // null = not fetched yet, [] = no sessions
  const [activeSessionIndex, setActiveSessionIndex] = useState(0)
  const [completedSubtasks, setCompletedSubtasks] = useState(new Set())

  useEffect(() => {
    if (habitId) {
      fetchBreakdownSessions()
    }
  }, [habitId])

  const fetchBreakdownSessions = async () => {
    try {
      const response = await api.getHabitBreakdownSessions(habitId)
      const fetchedSessions = response.sessions || []
      setSessions(fetchedSessions)
      
      // Initialize completed state from the first (active) session
      if (fetchedSessions.length > 0) {
        const completed = new Set()
        fetchedSessions[0].subtasks?.forEach(subtask => {
          if (subtask.is_completed) {
            completed.add(subtask.id)
          }
        })
        setCompletedSubtasks(completed)
      }
    } catch (error) {
      console.error('Error fetching breakdown sessions:', error)
      setSessions([])
    }
  }

  const handleSessionChange = (index) => {
    setActiveSessionIndex(index)
    // Reset completed state for the new session
    const completed = new Set()
    sessions[index]?.subtasks?.forEach(subtask => {
      if (subtask.is_completed) {
        completed.add(subtask.id)
      }
    })
    setCompletedSubtasks(completed)
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
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Don't render anything until data is fetched (prevents flash)
  if (sessions === null) {
    return null
  }

  // Don't render if no breakdown sessions exist
  if (sessions.length === 0) {
    return null
  }

  const activeSession = sessions[activeSessionIndex]
  const subtasks = activeSession?.subtasks || []
  const completedCount = completedSubtasks.size
  const totalCount = subtasks.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="bg-light/5 rounded-xl p-4 border border-light/10">
      {/* Header with Approach Toggle */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-semibold text-light flex items-center gap-2">
          🧩 Breakdown Approaches
        </h4>
        <span className="text-sm text-light/60">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Approach Selector (only show if multiple sessions) */}
      {sessions.length > 1 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-light/60">Switch approach:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sessions.map((session, index) => (
              <button
                key={session.breakdown_session_id}
                onClick={() => handleSessionChange(index)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  index === activeSessionIndex
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'bg-light/10 text-light/70 hover:bg-light/20 hover:text-light'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>Approach {index + 1}</span>
                  <span className="opacity-60">({session.subtasks?.length || 0} steps)</span>
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-light/40 mt-2">
            Created: {formatDate(activeSession?.created_at)}
          </p>
        </div>
      )}

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

      {/* Multiple Approaches Info */}
      {sessions.length > 1 && (
        <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <p className="text-purple-300 text-xs">
            💡 You have {sessions.length} different approaches for this habit. 
            Try switching between them to find what works best for you!
          </p>
        </div>
      )}
    </div>
  )
}
