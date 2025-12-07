import { useState, useEffect } from 'react'
import { api } from '../services/api'
import CompanionSelector from './CompanionSelector'

export default function HabitExplorer({ habits, onRefresh, loading, onNext }) {
  const [isVisible, setIsVisible] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    habit_type: 'big',
    estimated_duration: 30,
    priority: 5,
    difficulty: 'medium',
    category: 'wellness',
    target_frequency: 5,
    preferred_time_of_day: 'morning',
    color: '#F9F5F2'
  })

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    const element = document.getElementById('habits')
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.createHabit({ ...formData, user_id: 'default_user' })
      setShowForm(false)
      setFormData({
        name: '',
        description: '',
        habit_type: 'big',
        estimated_duration: 30,
        priority: 5,
        difficulty: 'medium',
        category: 'wellness',
        target_frequency: 5,
        preferred_time_of_day: 'morning',
        color: '#F9F5F2'
      })
      onRefresh()
    } catch (error) {
      console.error('Failed to create habit:', error)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Remove this habit from your journey?')) {
      try {
        await api.deleteHabit(id)
        onRefresh()
      } catch (error) {
        console.error('Failed to delete habit:', error)
      }
    }
  }

  const categories = ['all', ...new Set(habits.map(h => h.category))]
  const filteredHabits = selectedCategory === 'all' 
    ? habits 
    : habits.filter(h => h.category === selectedCategory)

  const difficultyIcons = {
    easy: '🌱',
    medium: '⚡',
    hard: '💪'
  }

  return (
    <div className="relative px-6 py-20">
      <div className="max-w-7xl mx-auto">
        {/* Companion Selector */}
        <div className={`mb-20 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <CompanionSelector />
        </div>

        {/* Header */}
        <div className={`mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-display font-bold mb-4">
            Your <span className="gradient-text">Habits</span>
          </h2>
          <p className="text-xl text-light/60 max-w-2xl">
            These are the building blocks of your transformation. 
            Each one is a step toward who you want to become.
          </p>
        </div>

        {/* Category Filter */}
        <div className={`mb-12 transition-all duration-1000 delay-200 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="flex flex-wrap gap-3">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full font-mono text-sm transition-all ${
                  selectedCategory === cat
                    ? 'bg-light text-dark'
                    : 'glass text-light/60 hover:text-light'
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              onClick={() => setShowForm(!showForm)}
              className="ml-auto px-6 py-2 bg-light text-dark rounded-full font-bold hover-lift"
            >
              {showForm ? '✕ Cancel' : '+ New Habit'}
            </button>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="mb-12 glass rounded-3xl p-8 animate-fade-in">
            <h3 className="text-2xl font-bold mb-6">Create New Habit</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-mono text-sm text-light/60 mb-2">Habit Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-dark border border-light/20 rounded-xl text-light focus:border-light/60 transition-colors"
                    placeholder="e.g., Morning Meditation"
                  />
                </div>

                <div>
                  <label className="block font-mono text-sm text-light/60 mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 bg-dark border border-light/20 rounded-xl text-light focus:border-light/60 transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-mono text-sm text-light/60 mb-2">Type</label>
                  <select
                    value={formData.habit_type}
                    onChange={(e) => setFormData({...formData, habit_type: e.target.value})}
                    className="w-full px-4 py-3 bg-dark border border-light/20 rounded-xl text-light focus:border-light/60 transition-colors"
                  >
                    <option value="atomic">Atomic (Quick)</option>
                    <option value="big">Big (Timed)</option>
                  </select>
                </div>

                {formData.habit_type === 'big' && (
                  <div>
                    <label className="block font-mono text-sm text-light/60 mb-2">Duration (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.estimated_duration}
                      onChange={(e) => setFormData({...formData, estimated_duration: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-dark border border-light/20 rounded-xl text-light focus:border-light/60 transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-mono text-sm text-light/60 mb-2">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                    className="w-full px-4 py-3 bg-dark border border-light/20 rounded-xl text-light focus:border-light/60 transition-colors"
                  >
                    <option value="easy">Easy 🌱</option>
                    <option value="medium">Medium ⚡</option>
                    <option value="hard">Hard 💪</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-sm text-light/60 mb-2">Priority (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-dark border border-light/20 rounded-xl text-light focus:border-light/60 transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-mono text-sm text-light/60 mb-2">Times per Week</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={formData.target_frequency}
                    onChange={(e) => setFormData({...formData, target_frequency: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-dark border border-light/20 rounded-xl text-light focus:border-light/60 transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-mono text-sm text-light/60 mb-2">Preferred Time</label>
                  <select
                    value={formData.preferred_time_of_day}
                    onChange={(e) => setFormData({...formData, preferred_time_of_day: e.target.value})}
                    className="w-full px-4 py-3 bg-dark border border-light/20 rounded-xl text-light focus:border-light/60 transition-colors"
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="night">Night</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-sm text-light/60 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-dark border border-light/20 rounded-xl text-light focus:border-light/60 transition-colors"
                  rows="3"
                  placeholder="What does this habit mean to you?"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-light text-dark font-bold rounded-xl hover-lift"
              >
                Create Habit
              </button>
            </form>
          </div>
        )}

        {/* Habits Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-light"></div>
          </div>
        ) : filteredHabits.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 animate-float">🌱</div>
            <p className="text-2xl text-light/60">No habits yet. Start your journey!</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            {filteredHabits.map((habit, index) => (
              <div
                key={habit.id}
                className="glass rounded-3xl p-6 hover-lift group"
                style={{animationDelay: `${index * 100}ms`}}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="text-4xl">{difficultyIcons[habit.difficulty]}</div>
                  <button
                    onClick={() => handleDelete(habit.id)}
                    className="text-light/40 hover:text-light transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <h3 className="text-xl font-bold mb-2">{habit.name}</h3>
                {habit.description && (
                  <p className="text-sm text-light/60 mb-4">{habit.description}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-light/10 rounded-full text-xs font-mono">
                    {habit.category}
                  </span>
                  <span className="px-3 py-1 bg-light/10 rounded-full text-xs font-mono">
                    Priority {habit.priority}
                  </span>
                  <span className="px-3 py-1 bg-light/10 rounded-full text-xs font-mono">
                    {habit.target_frequency}x/week
                  </span>
                  {habit.estimated_duration && (
                    <span className="px-3 py-1 bg-light/10 rounded-full text-xs font-mono">
                      {habit.estimated_duration}min
                    </span>
                  )}
                </div>

                <div className="text-xs font-mono text-light/40">
                  {habit.preferred_time_of_day}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Continue Button */}
        {habits.length > 0 && (
          <div className="text-center">
            <button
              onClick={onNext}
              className="px-10 py-4 bg-light text-dark font-bold text-lg rounded-full hover-lift inline-flex items-center gap-3"
            >
              <span>View Your Schedule</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
