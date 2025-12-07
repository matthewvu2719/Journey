import { useEffect, useState } from 'react'
import RobotMascot from './RobotMascot'
import { Confetti } from './ui/Confetti'

export default function AchievementNotification({ achievement, onClose }) {
  const [isVisible, setIsVisible] = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(0)

  useEffect(() => {
    if (achievement) {
      setIsVisible(true)
      setConfettiTrigger(Date.now())
      
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose()
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [achievement])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      if (onClose) onClose()
    }, 300)
  }

  if (!achievement) return null

  const getRewardDisplay = () => {
    switch (achievement.reward_type) {
      case 'motivational_sentence':
        return (
          <div className="text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-lg font-medium text-gray-800 italic">
              "{achievement.reward}"
            </p>
          </div>
        )
      
      case 'dance_emotion':
        return (
          <div className="text-center">
            <div className="text-4xl mb-3">💃✨</div>
            <p className="text-lg font-bold text-gray-800 mb-2">
              {achievement.reward.dance.name}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              {achievement.reward.dance.description}
            </p>
            <p className="text-lg font-bold text-gray-800 mb-2">
              {achievement.reward.emotion.name}
            </p>
            <p className="text-sm text-gray-600">
              {achievement.reward.emotion.description}
            </p>
          </div>
        )
      
      case 'hat_costume':
        return (
          <div className="text-center">
            <div className="text-4xl mb-3">🎩👔</div>
            <p className="text-lg font-bold text-gray-800 mb-2">
              {achievement.reward.hat.name}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              {achievement.reward.hat.description}
            </p>
            <p className="text-lg font-bold text-gray-800 mb-2">
              {achievement.reward.costume.name}
            </p>
            <p className="text-sm text-gray-600">
              {achievement.reward.costume.description}
            </p>
          </div>
        )
      
      case 'theme':
        return (
          <div className="text-center">
            <div className="text-4xl mb-3">🎨</div>
            <p className="text-lg font-bold text-gray-800 mb-2">
              {achievement.reward.name}
            </p>
            <p className="text-sm text-gray-600">
              {achievement.reward.description}
            </p>
          </div>
        )
      
      default:
        return null
    }
  }

  const getAchievementIcon = () => {
    switch (achievement.achievement_type) {
      case 'any_completion':
        return '🎯'
      case 'daily_perfect':
        return '⭐'
      case 'weekly_perfect':
        return '🏆'
      case 'monthly_perfect':
        return '👑'
      default:
        return '🎉'
    }
  }

  return (
    <>
      <Confetti trigger={confettiTrigger} />
      
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        {/* Notification Card */}
        <div className={`relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all duration-500 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-75 translate-y-10'
        }`}>
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Achievement Header */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-3 animate-bounce">
              {getAchievementIcon()}
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Achievement Unlocked!
            </h2>
            <p className="text-xl font-semibold text-[var(--color-accent)]">
              {achievement.achievement_name}
            </p>
          </div>

          {/* Bobo Celebration */}
          <div className="flex justify-center mb-6">
            <RobotMascot 
              size="lg" 
              emotion="happy" 
              animate={true} 
              dance={true}
            />
          </div>

          {/* Reward Display */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 mb-6">
            {getRewardDisplay()}
          </div>

          {/* Message */}
          <p className="text-center text-gray-700 font-medium">
            {achievement.message}
          </p>

          {/* Continue Button */}
          <button
            onClick={handleClose}
            className="w-full mt-6 py-3 bg-[var(--color-accent)] text-white font-bold rounded-full hover:scale-105 transition-transform"
          >
            Awesome! 🎉
          </button>
        </div>
      </div>
    </>
  )
}
