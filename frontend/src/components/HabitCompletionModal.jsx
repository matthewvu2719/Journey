import { useState } from 'react'

export default function HabitCompletionModal({ 
  habit, 
  timeOfDay, 
  onSubmit, 
  onCancel,
  isVisible 
}) {
  const [completionData, setCompletionData] = useState({
    mood_before: 'good',
    mood_after: 'great',
    energy_level_before: 'high',
    energy_level_after: 'high',
    actual_duration: habit?.habit_type === 'atomic' ? 0 : (habit?.estimated_duration || 0)
  })

  const handleSubmit = () => {
    onSubmit(completionData)
  }

  if (!isVisible || !habit) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-darker border border-light/20 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-light">Log Completion</h3>
            <p className="text-light/60">{habit.name}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-light/10 transition-colors focus:outline-none focus:ring-2 focus:ring-light/50"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-light/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Time of day indicator */}
        <div className="mb-6 p-4 bg-dark border border-light/20 rounded-lg">
          <div className="text-sm font-medium text-light/80 flex items-center gap-2">
            {timeOfDay === 'morning' && '🌅 Morning'}
            {timeOfDay === 'noon' && '☀️ Noon'}
            {timeOfDay === 'afternoon' && '🌤️ Afternoon'}
            {timeOfDay === 'night' && '🌙 Night'}
            <span className="text-light/60">• {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Mood tracking */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-light/80 mb-2">Mood Before</label>
              <select
                value={completionData.mood_before}
                onChange={(e) => setCompletionData({...completionData, mood_before: e.target.value})}
                className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light 
                  transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-light/50 focus:border-light/40"
              >
                <option value="poor">😞 Poor</option>
                <option value="okay">😐 Okay</option>
                <option value="good">🙂 Good</option>
                <option value="great">😄 Great</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-light/80 mb-2">Mood After</label>
              <select
                value={completionData.mood_after}
                onChange={(e) => setCompletionData({...completionData, mood_after: e.target.value})}
                className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light 
                  transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-light/50 focus:border-light/40"
              >
                <option value="poor">😞 Poor</option>
                <option value="okay">😐 Okay</option>
                <option value="good">🙂 Good</option>
                <option value="great">😄 Great</option>
              </select>
            </div>
          </div>

          {/* Energy tracking */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-light/80 mb-2">Energy Before</label>
              <select
                value={completionData.energy_level_before}
                onChange={(e) => setCompletionData({...completionData, energy_level_before: e.target.value})}
                className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light 
                  transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-light/50 focus:border-light/40"
              >
                <option value="low">🔋 Low</option>
                <option value="medium">🔋🔋 Medium</option>
                <option value="high">🔋🔋🔋 High</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-light/80 mb-2">Energy After</label>
              <select
                value={completionData.energy_level_after}
                onChange={(e) => setCompletionData({...completionData, energy_level_after: e.target.value})}
                className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light 
                  transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-light/50 focus:border-light/40"
              >
                <option value="low">🔋 Low</option>
                <option value="medium">🔋🔋 Medium</option>
                <option value="high">🔋🔋🔋 High</option>
              </select>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-light/80 mb-2">
              Actual Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              value={completionData.actual_duration}
              onChange={(e) => setCompletionData({...completionData, actual_duration: parseInt(e.target.value)})}
              className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg text-light placeholder-light/40
                transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-light/50 focus:border-light/40"
              placeholder="How long did it take?"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-dark border border-light/20 text-light rounded-lg hover:bg-light/10 
              transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-light/50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 bg-light text-dark rounded-lg hover:bg-light/90 
              transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-light/50 focus:ring-offset-2 focus:ring-offset-darker"
          >
            Complete Habit
          </button>
        </div>
      </div>

      <style jsx="true">{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}