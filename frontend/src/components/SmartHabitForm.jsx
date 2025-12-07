import { useState, useEffect } from 'react'
import { api } from '../services/api'
import DurationPrediction from './DurationPrediction'
import DifficultyIndicator from './DifficultyIndicator'

export default function SmartHabitForm({ onSubmit, onCancel, initialData = null }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'wellness',
    target_frequency: 5,
    estimated_duration: 30,
    difficulty: 'medium',
    ...initialData
  })
  const [naturalLanguage, setNaturalLanguage] = useState('')
  const [parsing, setParsing] = useState(false)
  const [showNLP, setShowNLP] = useState(false)

  const handleNLParse = async () => {
    if (!naturalLanguage.trim()) return
    
    setParsing(true)
    try {
      const result = await api.parseHabit(naturalLanguage)
      if (result.success && result.habit) {
        setFormData(prev => ({
          ...prev,
          ...result.habit
        }))
        setShowNLP(false)
        setNaturalLanguage('')
      }
    } catch (error) {
      console.error('Habit parsing error:', error)
    } finally {
      setParsing(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-lg space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-gray-800">
          {initialData ? 'Edit Habit' : 'Create Smart Habit'}
        </h3>
        <button
          type="button"
          onClick={() => setShowNLP(!showNLP)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
        >
          {showNLP ? '📝 Manual Entry' : '🤖 Use AI Parser'}
        </button>
      </div>

      {/* Natural Language Input */}
      {showNLP && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Describe your habit in plain English
          </label>
          <input
            type="text"
            value={naturalLanguage}
            onChange={(e) => setNaturalLanguage(e.target.value)}
            placeholder="e.g., Run for 30 minutes every morning"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleNLParse}
            disabled={parsing || !naturalLanguage.trim()}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold"
          >
            {parsing ? 'Parsing...' : '✨ Parse with AI'}
          </button>
        </div>
      )}

      {/* Manual Form Fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Habit Name *
        </label>
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          rows="2"
          placeholder="Optional details..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Times per Week
          </label>
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Estimated Duration (minutes)
        </label>
        <input
          type="number"
          min="5"
          max="240"
          value={formData.estimated_duration}
          onChange={(e) => setFormData({...formData, estimated_duration: parseInt(e.target.value)})}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        
        {/* AI Duration Prediction */}
        {formData.estimated_duration && (
          <DurationPrediction 
            habit={formData}
            onUpdate={(updates) => setFormData({...formData, ...updates})}
          />
        )}
      </div>

      {/* AI Difficulty Indicator */}
      {formData.name && formData.target_frequency && (
        <DifficultyIndicator habit={formData} />
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition font-semibold"
        >
          {initialData ? 'Update Habit' : 'Create Habit'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
