import { useEffect, useState } from 'react'
import RobotMascot from './RobotMascot'
import { Confetti } from './ui/Confetti'
import { useBobo } from '../contexts/BoboContext'

export default function AchievementNotification({ achievement, onClose }) {
  const { getEquippedItems } = useBobo()
  const [isVisible, setIsVisible] = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [celebrationDance, setCelebrationDance] = useState(true) // Use default celebration dance

  useEffect(() => {
    if (achievement) {
      setIsVisible(true)
      setConfettiTrigger(Date.now())
      
      // Use default celebration dance
      setCelebrationDance(true)
      
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
      // Dispatch event to refresh wardrobe
      window.dispatchEvent(new CustomEvent('achievementUnlocked'));
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
            <p className="text-lg font-medium italic">
              "{achievement.reward}"
            </p>
          </div>
        )
      
      case 'dance_emotion':
        return (
          <div className="text-center">
            <div className="text-4xl mb-3">💃✨</div>
            <p className="text-lg font-bold mb-2">
              {achievement.reward.dance.name}
            </p>
            <p className="text-sm opacity-70 mb-2">
              {achievement.reward.dance.description}
            </p>
            <p className="text-lg font-bold mb-2">
              {achievement.reward.emotion.name}
            </p>
            <p className="text-sm opacity-70">
              {achievement.reward.emotion.description}
            </p>
          </div>
        )
      
      case 'hat_costume':
        return (
          <div className="text-center">
            <div className="text-4xl mb-3">🎩👔</div>
            <p className="text-lg font-bold mb-2">
              {achievement.reward.hat.name}
            </p>
            <p className="text-sm opacity-70 mb-2">
              {achievement.reward.hat.description}
            </p>
            <p className="text-lg font-bold mb-2">
              {achievement.reward.costume.name}
            </p>
            <p className="text-sm opacity-70">
              {achievement.reward.costume.description}
            </p>
          </div>
        )
      
      case 'theme':
        return (
          <div className="text-center">
            <div className="text-4xl mb-3">🎨</div>
            <p className="text-lg font-bold mb-2">
              {achievement.reward.name}
            </p>
            <p className="text-sm opacity-70">
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
        <div 
          className={`relative rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all duration-500 ${
            isVisible ? 'scale-100 translate-y-0' : 'scale-75 translate-y-10'
          }`}
          style={{
            backgroundColor: 'var(--color-background)',
            border: '2px solid var(--color-accent)'
          }}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: 'var(--color-glass)',
              color: 'var(--color-foreground)'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Achievement Header */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-3 animate-bounce">
              {getAchievementIcon()}
            </div>
            <h2 
              className="text-3xl font-bold mb-2"
              style={{ color: 'var(--color-foreground)' }}
            >
              Achievement Unlocked!
            </h2>
            <p className="text-xl font-semibold text-[var(--color-accent)]">
              {achievement.achievement_name}
            </p>
          </div>

          {/* Bobo Celebration */}
          <div className="flex justify-center mb-6">
            {(() => {
              const equippedItems = getEquippedItems()
              return (
                <RobotMascot 
                  size="lg" 
                  emotion="celebrating"
                  color={equippedItems.color?.svg_data || null}
                  hat={equippedItems.hat ? { svg: equippedItems.hat.svg_data } : null}
                  costume={equippedItems.costume ? { svg: equippedItems.costume.svg_data } : null}
                  animate={true} 
                  dance={celebrationDance?.animation_data || celebrationDance}
                />
              )
            })()}
          </div>

          {/* Reward Display */}
          <div 
            className="rounded-2xl p-6 mb-6"
            style={{
              backgroundColor: 'var(--color-glass)',
              border: '1px solid var(--color-border)'
            }}
          >
            <div style={{ color: 'var(--color-foreground)' }}>
              {getRewardDisplay()}
            </div>
          </div>

          {/* Message */}
          <p 
            className="text-center font-medium"
            style={{ color: 'var(--color-foreground-secondary)' }}
          >
            {achievement.message}
          </p>

          {/* Continue Button */}
          <button
            onClick={handleClose}
            className="w-full mt-6 py-3 font-bold rounded-full hover:scale-105 transition-transform"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-background)'
            }}
          >
            Awesome! 🎉
          </button>
        </div>
      </div>
    </>
  )
}
