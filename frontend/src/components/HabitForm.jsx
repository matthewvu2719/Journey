import { useState } from 'react'

export default function HabitForm({ onSubmit, onCancel, initialData = null }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    habit_type: 'atomic',
    category: 'wellness',
    estimated_duration: 30,
    difficulty: 'medium',
    priority: 5,
    days: [],
    times_of_day: [],
    ...initialData
  })
  
  const [errors, setErrors] = useState({
    days: '',
    times_of_day: ''
  })

  const daysOfWeek = [
    { id: 1, name: 'Mon', label: 'Monday' },
    { id: 2, name: 'Tue', label: 'Tuesday' },
    { id: 3, name: 'Wed', label: 'Wednesday' },
    { id: 4, name: 'Thu', label: 'Thursday' },
    { id: 5, name: 'Fri', label: 'Friday' },
    { id: 6, name: 'Sat', label: 'Saturday' },
    { id: 7, name: 'Sun', label: 'Sunday' }
  ]

  const timesOfDay = [
    { id: 1, name: 'morning', label: 'Morning' },
    { id: 2, name: 'noon', label: 'Noon' },
    { id: 3, name: 'afternoon', label: 'Afternoon' },
    { id: 4, name: 'night', label: 'Night' }
  ]

  const toggleDay = (dayName) => {
    const currentDays = formData.days || []
    if (currentDays.includes(dayName)) {
      setFormData({...formData, days: currentDays.filter(d => d !== dayName)})
    } else {
      setFormData({...formData, days: [...currentDays, dayName]})
      // Clear error when user selects a day
      if (errors.days) setErrors({...errors, days: ''})
    }
  }

  const toggleTimeOfDay = (timeName) => {
    const currentTimes = formData.times_of_day || []
    if (currentTimes.includes(timeName)) {
      setFormData({...formData, times_of_day: currentTimes.filter(t => t !== timeName)})
    } else {
      setFormData({...formData, times_of_day: [...currentTimes, timeName]})
      // Clear error when user selects a time
      if (errors.times_of_day) setErrors({...errors, times_of_day: ''})
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate required fields
    const newErrors = { days: '', times_of_day: '' }
    let hasErrors = false
    
    if (!formData.days || formData.days.length === 0) {
      newErrors.days = 'Please select at least one day for your habit'
      hasErrors = true
    }
    
    if (!formData.times_of_day || formData.times_of_day.length === 0) {
      newErrors.times_of_day = 'Please select at least one time of day'
      hasErrors = true
    }
    
    if (hasErrors) {
      setErrors(newErrors)
      return
    }
    
    // Prepare data for submission
    const submitData = { ...formData }
    
    // For atomic habits, set estimated_duration to null
    if (submitData.habit_type === 'atomic') {
      submitData.estimated_duration = null
    }
    
    await onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl p-8 space-y-6">
      <h3 className="text-3xl font-bold text-[var(--color-foreground)] mb-2">
        {initialData ? 'Edit Habit' : 'Add New Habit'}
      </h3>
      <p className="text-[var(--color-foreground-secondary)] mb-6">
        {initialData ? 'Update your habit details' : 'Create a new habit to track'}
      </p>

      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)]/80 mb-2">
          Habit Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full px-4 py-3 bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg 
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 
            focus:border-[var(--color-accent)]/40 text-[var(--color-foreground)] 
            placeholder-[var(--color-foreground-secondary)]"
          placeholder="e.g., Morning Meditation"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)]/80 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="w-full px-4 py-3 bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg 
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 
            focus:border-[var(--color-accent)]/40 text-[var(--color-foreground)] 
            placeholder-[var(--color-foreground-secondary)] resize-none"
          rows="3"
          placeholder="Optional details about your habit..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)]/80 mb-2">
            Habit Type
          </label>
          <select
            value={formData.habit_type}
            onChange={(e) => setFormData({...formData, habit_type: e.target.value})}
            className="w-full px-4 py-3 bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg 
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 
              focus:border-[var(--color-accent)]/40 text-[var(--color-foreground)]"
          >
            <option value="atomic">Atomic Habit</option>
            <option value="big">Big Habit</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)]/80 mb-2">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="w-full px-4 py-3 bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg 
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 
              focus:border-[var(--color-accent)]/40 text-[var(--color-foreground)]"
          >
            <option value="fitness">Fitness</option>
            <option value="health">Health</option>
            <option value="learning">Learning</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="social">Social</option>
            <option value="wellness">Wellness</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)]/80 mb-2">
          Schedule Days *
        </label>
        <div className={`grid grid-cols-7 gap-2 ${errors.days ? 'ring-2 ring-red-500/50 rounded-lg p-2' : ''}`}>
          {daysOfWeek.map(day => (
            <button
              key={day.id}
              type="button"
              onClick={() => toggleDay(day.name)}
              className={`py-2 px-1 rounded-lg text-sm font-semibold transition-all duration-200 ${
                (formData.days || []).includes(day.name)
                  ? 'bg-[var(--color-accent)] text-white shadow-lg'
                  : 'bg-[var(--color-glass)] text-[var(--color-foreground-secondary)] hover:bg-[var(--color-glass)]/80 border border-[var(--color-border)]'
              }`}
              title={day.label}
            >
              {day.name}
            </button>
          ))}
        </div>
        {errors.days ? (
          <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.days}
          </p>
        ) : (
          <p className="text-xs text-[var(--color-foreground-secondary)] mt-2">Select one or more days</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--color-foreground)]/80 mb-2">
          Preferred Times of Day *
        </label>
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 ${errors.times_of_day ? 'ring-2 ring-red-500/50 rounded-lg p-2' : ''}`}>
          {timesOfDay.map(time => (
            <button
              key={time.id}
              type="button"
              onClick={() => toggleTimeOfDay(time.name)}
              className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                (formData.times_of_day || []).includes(time.name)
                  ? 'bg-[var(--color-accent)] text-white shadow-lg'
                  : 'bg-[var(--color-glass)] text-[var(--color-foreground-secondary)] hover:bg-[var(--color-glass)]/80 border border-[var(--color-border)]'
              }`}
            >
              {time.label}
            </button>
          ))}
        </div>
        {errors.times_of_day ? (
          <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.times_of_day}
          </p>
        ) : (
          <p className="text-xs text-[var(--color-foreground-secondary)] mt-2">Select one or more times</p>
        )}
      </div>

      {formData.habit_type === 'big' && (
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)]/80 mb-2">
            Estimated Duration (minutes)
          </label>
          <input
            type="number"
            min="5"
            max="240"
            value={formData.estimated_duration || ''}
            onChange={(e) => setFormData({...formData, estimated_duration: parseInt(e.target.value) || 30})}
            className="w-full px-4 py-3 bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg 
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 
              focus:border-[var(--color-accent)]/40 text-[var(--color-foreground)]"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)]/80 mb-2">
            Difficulty
          </label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
            className="w-full px-4 py-3 bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg 
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 
              focus:border-[var(--color-accent)]/40 text-[var(--color-foreground)]"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)]/80 mb-2">
            Priority (1-10)
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={formData.priority || ''}
            onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 5})}
            className="w-full px-4 py-3 bg-[var(--color-glass)] border border-[var(--color-border)] rounded-lg 
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 
              focus:border-[var(--color-accent)]/40 text-[var(--color-foreground)]"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-[var(--color-border)] mt-6">
        <button
          type="submit"
          className="flex-1 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
        >
          {initialData ? 'Update Habit' : 'Create Habit'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-[var(--color-glass)] text-[var(--color-foreground)] rounded-lg hover:bg-[var(--color-glass)]/80 transition-all duration-200 font-semibold border border-[var(--color-border)]"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
