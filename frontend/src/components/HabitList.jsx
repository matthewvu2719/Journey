import { useState, useEffect } from 'react'
import { api } from '../services/api'

export default function HabitExplorer({ habits, onRefresh, loading, onNext }) {
  const [isVisible, setIsVisible] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: 'medium',
    category: 'wellness',
    target_frequency: 5
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.createHabit({ ...formData, user_id: 'default_user' })
      setShowForm(false)
      setFormData({
        name: '',
        description: '',
        difficulty: 'medium',
        category: 'wellness',
        target_frequency: 5
      })
      onRefresh()
    } catch (error) {
      console.error('Failed to create habit:', error)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this habit?')) {
      try {
        await api.deleteHabit(id)
        onRefresh()
      } catch (error) {
        console.error('Failed to delete habit:', error)
      }
    }
  }

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">My Habits</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition"
        >
          {showForm ? '✕ Cancel' : '+ New Habit'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Habit Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Morning Meditation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows="2"
              placeholder="Optional details..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Times/Week</label>
              <input
                type="number"
                min="1"
                max="7"
                value={formData.target_frequency}
                onChange={(e) => setFormData({...formData, target_frequency: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
          >
            Create Habit
          </button>
        </form>
      )}

      {/* Habits List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {habits.map(habit => (
          <div key={habit.id} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800">{habit.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{habit.description}</p>
              </div>
              <button
                onClick={() => handleDelete(habit.id)}
                className="text-red-500 hover:text-red-700 text-xl"
              >
                ×
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyColors[habit.difficulty]}`}>
                {habit.difficulty}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {habit.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                {habit.target_frequency}x/week
              </span>
            </div>
          </div>
        ))}
      </div>

      {habits.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-xl">No habits yet. Create your first one!</p>
        </div>
      )}
    </div>
  )
}
