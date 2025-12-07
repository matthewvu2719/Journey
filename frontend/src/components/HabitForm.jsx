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
    }
  }

  const toggleTimeOfDay = (timeName) => {
    const currentTimes = formData.times_of_day || []
    if (currentTimes.includes(timeName)) {
      setFormData({...formData, times_of_day: currentTimes.filter(t => t !== timeName)})
    } else {
      setFormData({...formData, times_of_day: [...currentTimes, timeName]})
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
      <h3 className="text-2xl font-bold text-light mb-4">
        {initialData ? 'Edit Habit' : 'Add Habit'}
      </h3>

      <div>
        <label className="block text-sm font-medium text-light/80 mb-1">
          Habit Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full px-4 py-2 bg-light/10 border border-light/20 rounded-lg focus:ring-2 focus:ring-light/50 text-light placeholder-light/40"
          placeholder="e.g., Morning Meditation"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-light/80 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="w-full px-4 py-2 bg-light/10 border border-light/20 rounded-lg focus:ring-2 focus:ring-light/50 text-light placeholder-light/40"
          rows="2"
          placeholder="Optional details..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-light/80 mb-1">
          Habit Type
        </label>
        <select
          value={formData.habit_type}
          onChange={(e) => setFormData({...formData, habit_type: e.target.value})}
          className="w-full px-4 py-2 bg-light/10 border border-light/20 rounded-lg focus:ring-2 focus:ring-light/50 text-light"
        >
          <option value="atomic">Atomic Habit</option>
          <option value="big">Big Habit</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-light/80 mb-1">
          Category
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
          className="w-full px-4 py-2 bg-light/10 border border-light/20 rounded-lg focus:ring-2 focus:ring-light/50 text-light"
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

      <div>
        <label className="block text-sm font-medium text-light/80 mb-2">
          Schedule Days *
        </label>
        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map(day => (
            <button
              key={day.id}
              type="button"
              onClick={() => toggleDay(day.name)}
              className={`py-2 px-1 rounded-lg text-sm font-semibold transition ${
                (formData.days || []).includes(day.name)
                  ? 'bg-light text-dark'
                  : 'bg-light/10 text-light/60 hover:bg-light/20'
              }`}
              title={day.label}
            >
              {day.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-light/50 mt-1">Select one or more days</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-light/80 mb-2">
          Preferred Times of Day
        </label>
        <div className="grid grid-cols-4 gap-2">
          {timesOfDay.map(time => (
            <button
              key={time.id}
              type="button"
              onClick={() => toggleTimeOfDay(time.name)}
              className={`py-2 px-3 rounded-lg text-sm font-semibold transition ${
                (formData.times_of_day || []).includes(time.name)
                  ? 'bg-light text-dark'
                  : 'bg-light/10 text-light/60 hover:bg-light/20'
              }`}
            >
              {time.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-light/50 mt-1">Select one or more times (optional)</p>
      </div>

      {formData.habit_type === 'big' && (
        <div>
          <label className="block text-sm font-medium text-light/80 mb-1">
            Estimated Duration (minutes)
          </label>
          <input
            type="number"
            min="5"
            max="240"
            value={formData.estimated_duration || ''}
            onChange={(e) => setFormData({...formData, estimated_duration: parseInt(e.target.value) || 30})}
            className="w-full px-4 py-2 bg-light/10 border border-light/20 rounded-lg focus:ring-2 focus:ring-light/50 text-light"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-light/80 mb-1">
            Difficulty
          </label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
            className="w-full px-4 py-2 bg-light/10 border border-light/20 rounded-lg focus:ring-2 focus:ring-light/50 text-light"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-light/80 mb-1">
            Priority (1-10)
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={formData.priority || ''}
            onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 5})}
            className="w-full px-4 py-2 bg-light/10 border border-light/20 rounded-lg focus:ring-2 focus:ring-light/50 text-light"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 py-3 bg-light text-dark rounded-lg hover:bg-light/90 transition font-semibold"
        >
          {initialData ? 'Update Habit' : 'Add Habit'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-light/10 text-light rounded-lg hover:bg-light/20 transition font-semibold"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
