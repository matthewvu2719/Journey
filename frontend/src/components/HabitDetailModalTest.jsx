import { useState } from 'react'
import HabitDetailModal from './HabitDetailModal'

export default function HabitDetailModalTest() {
  const [showModal, setShowModal] = useState(false)

  const testHabit = {
    id: 1,
    name: 'Train muay thai',
    category: 'Fitness',
    description: 'Practice muay thai techniques and conditioning',
    duration: 60,
    frequency: 'daily'
  }

  const testLogs = [
    { date: '2024-01-01', completed: true },
    { date: '2024-01-02', completed: false },
    { date: '2024-01-03', completed: true }
  ]

  return (
    <div className="p-6">
      <div className="glass rounded-2xl p-6 border border-light/20">
        <h3 className="text-lg font-bold text-light mb-4">Habit Detail Modal Test</h3>
        <p className="text-sm text-light/60 mb-4">
          Test the habit detail modal with Bobo's welcome dialogue. The dialogue should appear after Bobo finishes his welcome dance.
        </p>
        
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent)]/80 transition-colors"
        >
          Open Habit Detail Modal
        </button>
        
        <div className="mt-4 text-xs text-light/60">
          <p>Expected behavior:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Modal opens with habit details</li>
            <li>Bobo slides in from the side</li>
            <li>Bobo performs welcome dance</li>
            <li>Welcome dialogue appears: "Let me know if you need help! 🤖"</li>
            <li>Dialogue auto-hides after 4 seconds</li>
            <li>Dialogue can be clicked to dismiss early</li>
          </ul>
        </div>
      </div>

      <HabitDetailModal
        habit={testHabit}
        timeOfDay="morning"
        logs={testLogs}
        isVisible={showModal}
        onComplete={(habitId, timeOfDay) => {
          console.log('Habit completed:', habitId, timeOfDay)
          setShowModal(false)
        }}
        onClose={() => setShowModal(false)}
      />
    </div>
  )
}