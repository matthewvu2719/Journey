import { useState, useEffect } from 'react'
import BoboAnimations from './BoboAnimations'
import HabitDetailsView from './HabitDetailsView'
import FrictionTypeSelector from './FrictionTypeSelector'
import FrictionSolutionView from './FrictionSolutionView'
import FrictionActionHandler from './FrictionActionHandler'
import AchievementNotification from './AchievementNotification'
import { useBobo } from '../contexts/BoboContext'
import { api } from '../services/api'

// Speech Bubble Component for Bobo dialogue
const SpeechBubble = ({ children, typing = false }) => (
  <div className="relative bg-light/10 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-light/20 max-w-md">
    <div className={`text-light ${typing ? 'typing-animation' : ''}`}>
      {children}
    </div>
    {/* Speech bubble tail */}
    <div className="absolute bottom-0 left-8 transform translate-y-full">
      <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[12px] border-l-transparent border-r-transparent border-t-light/10"></div>
    </div>
  </div>
)

export default function HabitDetailModal({
  habit,
  timeOfDay,
  logs = [],
  onComplete,
  onHelp,
  onClose,
  isVisible
}) {
  const { getEquippedItems } = useBobo()

  const [modalState, setModalState] = useState('details')
  const [boboAnimation, setBoboAnimation] = useState('slide-in')
  const [showBobo, setShowBobo] = useState(false)
  const [showWelcomeDialogue, setShowWelcomeDialogue] = useState(false)
  const [selectedFrictionType, setSelectedFrictionType] = useState(null)
  const [selectedSolution, setSelectedSolution] = useState(null)
  const [journeyAchievement, setJourneyAchievement] = useState(null)

  useEffect(() => {
    if (isVisible && habit) {
      setModalState('details')
      setShowBobo(false)
      setShowWelcomeDialogue(true) // Show dialogue immediately when modal opens

      setTimeout(() => {
        setBoboAnimation('slide-in')
        setShowBobo(true)

        setTimeout(() => {
          setBoboAnimation('welcome-dance')

          setTimeout(() => {
            setBoboAnimation('idle')
          }, 1200)
        }, 800)
      }, 100)
    }
  }, [isVisible, habit])

  if (!isVisible || !habit) return null

  const equippedItems = getEquippedItems()

  const handleComplete = () => {
    onComplete?.(habit.id, timeOfDay)
    onClose()
  }

  const handleGetHelp = () => {
    setModalState('friction-selection')
    setBoboAnimation('helpful')
  }

  const handleFrictionTypeSelect = (frictionType, frictionData) => {
    if (!frictionType) {
      setModalState('details')
      return
    }

    setSelectedFrictionType({ type: frictionType, data: frictionData })
    setModalState('friction-help')
    setBoboAnimation('problem-solving')
  }

  return (
    <>
      {journeyAchievement && (
        <AchievementNotification
          achievement={journeyAchievement}
          onClose={() => setJourneyAchievement(null)}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-darker border border-light/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-light/20">
            <div>
              <h3 className="text-2xl font-bold text-light">{habit.name}</h3>
              <div className="flex items-center gap-2 mt-1 text-light/60">
                <span>{habit.category}</span>
                {timeOfDay && <span>• {timeOfDay}</span>}
              </div>
            </div>

            <button onClick={onClose} className="p-2 rounded-lg hover:bg-light/10">
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {modalState === 'details' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <HabitDetailsView habit={habit} timeOfDay={timeOfDay} logs={logs} />

                <div className="flex flex-col items-center justify-center space-y-4">
                  {showBobo && (
                    <>
                      <BoboAnimations
                        size="lg"
                        context={boboAnimation}
                        particleTrail
                        glowEffect
                        color={equippedItems.color?.svg_data}
                        hat={equippedItems.hat && { svg: equippedItems.hat.svg_data }}
                        costume={equippedItems.costume && { svg: equippedItems.costume.svg_data }}
                      />
                      
                      {/* Welcome Dialogue */}
                      {showWelcomeDialogue && (
                        <div className="animate-fade-in">
                          <SpeechBubble typing={true}>
                            <p className="text-sm font-medium">
                              I'm always here if you need help with <span className="font-bold text-purple-300">{habit.name}</span>! 🤖
                            </p>
                          </SpeechBubble>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {modalState === 'friction-selection' && (
              <FrictionTypeSelector
                selectedHabit={habit}
                onSelect={handleFrictionTypeSelect}
              />
            )}

            {modalState === 'friction-help' && (
              <FrictionSolutionView
                habit={habit}
                frictionType={selectedFrictionType?.type}
                frictionData={selectedFrictionType?.data}
                onBack={() => setModalState('friction-selection')}
                onSolutionSelect={(solution) => {
                  setSelectedSolution(solution)
                  setModalState('friction-action')
                }}
              />
            )}

            {modalState === 'friction-action' && (
              <FrictionActionHandler
                solution={selectedSolution}
                habit={habit}
                onComplete={async (result) => {
                  if (result.executionData?.obstacleOvercome) {
                    try {
                      const map = {
                        distraction: 'distraction_detour',
                        lowEnergy: 'energy_drain_valley',
                        complexity: 'maze_mountain',
                        forgetfulness: 'memory_fog'
                      }

                      const type = map[selectedFrictionType?.type]
                      if (type) {
                        const res = await api.checkJourneyAchievements(type)
                        if (res.unlocked_achievements?.length) {
                          setJourneyAchievement(res.unlocked_achievements[0])
                        }
                      }
                    } catch (e) {
                      console.error(e)
                    }
                  }

                  if (result.executionData?.habitCompleted) {
                    onComplete?.(habit.id, timeOfDay)
                    onClose()
                  } else {
                    // Go back to habit details instead of closing
                    setModalState('details')
                    setBoboAnimation('celebration')
                    setTimeout(() => setBoboAnimation('idle'), 1500)
                  }
                }}
                onBack={() => setModalState('friction-help')}
                onCancel={() => setModalState('details')}
              />
            )}
          </div>

          {modalState === 'details' && (
            <div className="flex gap-4 p-6 border-t border-light/20">
              <button
                onClick={handleComplete}
                className="flex-1 py-3 bg-green-500 text-white rounded-lg"
              >
                ✓ Complete Habit
              </button>
              <button
                onClick={handleGetHelp}
                className="flex-1 py-3 bg-blue-500 text-white rounded-lg"
              >
                🤖 Get Help
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes typing {
          from { opacity: 0.5; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        .animate-scale-in { animation: scaleIn 0.3s ease-out; }
        .typing-animation { animation: typing 1s ease-in-out infinite alternate; }
      `}</style>
    </>
  )
}
