import { useState, useEffect } from 'react'
import RobotMascot from './RobotMascot'
import HabitDetailsView from './HabitDetailsView'
import FrictionTypeSelector from './FrictionTypeSelector'
import { useBobo } from '../contexts/BoboContext'

export default function HabitDetailModal({ 
  habit, 
  timeOfDay,
  logs = [], // Add logs prop for statistics
  onComplete,
  onHelp,
  onClose,
  isVisible 
}) {
  const { getEquippedItems } = useBobo()
  const [modalState, setModalState] = useState('details') // 'details' | 'complete' | 'friction-selection' | 'friction-help'
  const [boboAnimation, setBoboAnimation] = useState('slide-in')
  const [showBobo, setShowBobo] = useState(false)
  const [selectedFrictionType, setSelectedFrictionType] = useState(null)

  // Reset modal state when habit changes or modal opens
  useEffect(() => {
    if (isVisible && habit) {
      setModalState('details')
      setShowBobo(false)
      
      // Trigger Bobo slide-in animation after a short delay
      setTimeout(() => {
        setBoboAnimation('slide-in')
        setShowBobo(true)
        
        // After slide-in, do welcome dance
        setTimeout(() => {
          setBoboAnimation('welcome-dance')
          
          // After dance, settle into idle
          setTimeout(() => {
            setBoboAnimation('idle')
          }, 1200)
        }, 800)
      }, 100)
    }
  }, [isVisible, habit])

  const handleComplete = () => {
    if (onComplete) {
      onComplete(habit.id, timeOfDay)
    }
    onClose()
  }

  const handleGetHelp = () => {
    setModalState('friction-selection')
    setBoboAnimation('helpful')
  }

  const handleBackToDetails = () => {
    setModalState('details')
    setBoboAnimation('idle')
  }

  const handleFrictionTypeSelect = (frictionType, frictionData) => {
    if (frictionType === null) {
      // User clicked back
      handleBackToDetails()
      return
    }
    
    setSelectedFrictionType({ type: frictionType, data: frictionData })
    setModalState('friction-help')
    setBoboAnimation('problem-solving')
    
    // TODO: In next task, this will trigger AI solution generation
    console.log('Selected friction type:', frictionType, frictionData)
  }

  if (!isVisible || !habit) return null

  const equippedItems = getEquippedItems()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-darker border border-light/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-light/20">
          <div>
            <h3 className="text-2xl font-bold text-light">{habit.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-light/60">{habit.category}</span>
              {timeOfDay && (
                <>
                  <span className="text-light/40">•</span>
                  <span className="text-light/60 flex items-center gap-1">
                    {timeOfDay === 'morning' && '🌅 Morning'}
                    {timeOfDay === 'noon' && '☀️ Noon'}
                    {timeOfDay === 'afternoon' && '🌤️ Afternoon'}
                    {timeOfDay === 'night' && '🌙 Night'}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-light/10 transition-colors focus:outline-none focus:ring-2 focus:ring-light/50"
            aria-label="Close"
          >
            <svg className="w-6 h-6 text-light/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {modalState === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Side - Habit Information */}
              <div>
                <HabitDetailsView 
                  habit={habit} 
                  timeOfDay={timeOfDay}
                  logs={logs}
                />
              </div>

              {/* Right Side - Bobo Helper */}
              <div className="flex flex-col">
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20 flex-1 flex flex-col items-center justify-center">
                  
                  {/* Bobo Avatar with Animation */}
                  {showBobo && (
                    <div className={`transition-all duration-800 ${
                      boboAnimation === 'slide-in' ? 'transform translate-x-0 opacity-100' : ''
                    }`}>
                      <RobotMascot 
                        size="lg" 
                        emotion="friendly" 
                        animate={true}
                        dance={boboAnimation === 'welcome-dance' ? true : false}
                        color={equippedItems.color?.svg_data || null}
                        hat={equippedItems.hat ? { svg: equippedItems.hat.svg_data } : null}
                        costume={equippedItems.costume ? { svg: equippedItems.costume.svg_data } : null}
                      />
                    </div>
                  )}

                  {/* Bobo Speech Bubble */}
                  <div className="mt-4 max-w-sm">
                    <div className="bg-light/10 rounded-2xl p-4 relative">
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-light/10 rotate-45"></div>
                      <p className="text-light text-center">
                        {modalState === 'details' && "Hi there! I'm here to help you with your habit journey. Need assistance overcoming any obstacles? 🚀"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {modalState === 'friction-selection' && (
            <FrictionTypeSelector 
              onSelect={handleFrictionTypeSelect}
              selectedHabit={habit}
            />
          )}

          {modalState === 'friction-help' && (
            <div className="text-center">
              <div className="mb-8">
                <RobotMascot 
                  size="lg" 
                  emotion="excited" 
                  animate={true}
                  dance={true}
                  color={equippedItems.color?.svg_data || null}
                  hat={equippedItems.hat ? { svg: equippedItems.hat.svg_data } : null}
                  costume={equippedItems.costume ? { svg: equippedItems.costume.svg_data } : null}
                />
                <div className="mt-4">
                  <div className="bg-light/10 rounded-2xl p-4 relative inline-block">
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-light/10 rotate-45"></div>
                    <p className="text-light">
                      {selectedFrictionType?.data?.boboGreeting || "Let me help you navigate through this obstacle! 🗺️"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-light/5 rounded-xl p-6 border border-light/20 mb-6">
                <h4 className="text-lg font-semibold text-light mb-2">
                  Selected Obstacle: {selectedFrictionType?.data?.name}
                </h4>
                <p className="text-light/60">
                  {selectedFrictionType?.data?.description}
                </p>
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-yellow-200 text-sm">
                    🚧 AI Solution Generation coming in Task 3.2! 
                    <br />
                    This will connect to the backend friction helper system.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setModalState('friction-selection')}
                  className="px-6 py-2 bg-light/10 text-light rounded-lg hover:bg-light/20 transition-colors"
                >
                  ← Choose Different Obstacle
                </button>
                <button
                  onClick={handleBackToDetails}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Back to Habit Details
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {modalState === 'details' && (
          <div className="flex gap-4 p-6 border-t border-light/20">
            <button
              onClick={handleComplete}
              className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-green-500/50"
            >
              ✓ Complete Habit
            </button>
            <button
              onClick={handleGetHelp}
              className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              🤖 Get Help
            </button>
          </div>
        )}
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