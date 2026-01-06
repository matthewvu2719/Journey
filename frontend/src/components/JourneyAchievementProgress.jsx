import { useState, useEffect } from 'react'
import { api } from '../services/api'
import AchievementNotification from './AchievementNotification'

export default function JourneyAchievementProgress() {
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(null)
  const [achievementResult, setAchievementResult] = useState(null)

  useEffect(() => {
    loadAchievementProgress()
    
    // Listen for refresh events from test panel
    const handleRefresh = () => {
      loadAchievementProgress()
    }
    
    window.addEventListener('obstacleAchievementUpdated', handleRefresh)
    
    return () => {
      window.removeEventListener('obstacleAchievementUpdated', handleRefresh)
    }
  }, [])

  const loadAchievementProgress = async () => {
    try {
      setLoading(true)
      const data = await api.getObstacleAchievementProgress()
      setAchievements(data.achievements || [])
    } catch (error) {
      console.error('Failed to load achievement progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async (achievementId) => {
    if (redeeming) return // Prevent double-clicks
    
    try {
      setRedeeming(achievementId)
      const result = await api.redeemObstacleAchievement(achievementId)
      
      if (result.success) {
        // Format achievement for AchievementNotification component
        const formattedAchievement = {
          achievement_type: 'obstacle_achievement', // This will trigger fireworks
          achievement_name: result.reward.name || 'Obstacle Achievement',
          message: result.message,
          reward_type: result.reward.type === 'hat_costume' ? 'hat_costume' : 
                       result.reward.type === 'hat' ? 'special_hat' :
                       result.reward.type === 'costume' ? 'special_costume' : 'journey_badge',
          reward: result.reward
        }
        
        setAchievementResult(formattedAchievement)
        
        // Refresh achievement progress
        await loadAchievementProgress()
        
        // Dispatch event to refresh Bobo wardrobe
        window.dispatchEvent(new CustomEvent('obstacleRewardUnlocked', { 
          detail: { reward: result.reward } 
        }))
      }
    } catch (error) {
      console.error('Failed to redeem achievement:', error)
      alert('Failed to redeem achievement. Please try again.')
    } finally {
      setRedeeming(null)
    }
  }

  const getAchievementIcon = (achievementId) => {
    const icons = {
      'distraction_master': '🎯',
      'energy_warrior': '⚡',
      'maze_solver': '🧩',
      'memory_keeper': '🧠',
      'journey_champion': '👑',
      'obstacle_navigator': '🧭'
    }
    return icons[achievementId] || '🏆'
  }

  const getTierBadge = (tier) => {
    const badges = {
      1: { label: 'Tier I', color: 'bg-gray-500' },
      2: { label: 'Tier II', color: 'bg-blue-500' },
      3: { label: 'Tier III', color: 'bg-purple-500' }
    }
    return badges[tier] || badges[1]
  }

  const getRarityColor = (rarity) => {
    const colors = {
      'common': 'text-gray-400',
      'rare': 'text-blue-400',
      'legendary': 'text-yellow-400'
    }
    return colors[rarity] || 'text-gray-400'
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-light/20 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-light/20 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-light/20 rounded"></div>
              <div className="h-20 bg-light/20 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Achievement Notification with Fireworks */}
      {achievementResult && (
        <AchievementNotification 
          achievement={achievementResult}
          onClose={() => setAchievementResult(null)}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-light">Obstacle Achievements</h3>
          <div className="text-sm text-light/60">
            {achievements.filter(a => a.times_redeemed > 0).length} / {achievements.length} Redeemed
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => {
            const tierBadge = getTierBadge(achievement.current_tier)
            const isRedeemable = achievement.is_redeemable
            const isOneTime = achievement.is_one_time
            const isPermanentlyUnlocked = achievement.status === 'permanently_unlocked'
            const isCompleted = achievement.status === 'completed'
            const isClickable = isRedeemable && !isPermanentlyUnlocked && !isCompleted
            
            return (
              <div 
                key={achievement.achievement_id}
                className={`
                  glass rounded-xl p-4 border transition-all duration-300
                  ${isRedeemable && !isPermanentlyUnlocked && !isCompleted
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 hover:scale-105 cursor-pointer' 
                    : isPermanentlyUnlocked || isCompleted
                      ? 'border-green-500/50 bg-green-500/10 cursor-not-allowed'
                      : 'border-light/20 hover:border-light/30'
                  }
                `}
                onClick={() => isClickable && !redeeming && handleRedeem(achievement.achievement_id)}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl">{getAchievementIcon(achievement.achievement_id)}</div>
                  <div className="flex items-center gap-2">
                    {/* Tier Badge */}
                    {!isOneTime && (
                      <div className={`${tierBadge.color} text-white text-xs px-2 py-1 rounded-full font-semibold`}>
                        {tierBadge.label}
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    {isPermanentlyUnlocked && (
                      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                        ✓ Unlocked
                      </div>
                    )}
                    {isCompleted && (
                      <div className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                        ★ Complete
                      </div>
                    )}
                    {isRedeemable && (
                      <div className="bg-[var(--color-accent)] text-white text-xs px-2 py-1 rounded-full font-semibold animate-pulse">
                        🎁 Ready!
                      </div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="mb-3">
                  <h4 className="font-bold text-light text-sm mb-1">{achievement.name}</h4>
                  <p className="text-xs text-light/60">
                    {isOneTime ? 'One-time achievement' : `Tier ${achievement.current_tier} of 3`}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-light/60 mb-1">
                    <span>Progress</span>
                    <span>{achievement.current_count} / {achievement.current_goal}</span>
                  </div>
                  <div className="w-full bg-light/10 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isPermanentlyUnlocked || isCompleted
                          ? 'bg-green-500' 
                          : isRedeemable
                            ? 'bg-[var(--color-accent)] animate-pulse'
                            : 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent)]/80'
                      }`}
                      style={{ width: `${Math.min(achievement.progress_percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Redemption Info */}
                <div className="bg-light/5 rounded-lg p-2">
                  {isRedeemable ? (
                    <div className="text-center">
                      <div className="text-xs font-semibold text-[var(--color-accent)] mb-1">
                        {redeeming === achievement.achievement_id ? '⏳ Redeeming...' : '🎁 Click to Redeem!'}
                      </div>
                      <div className="text-xs text-light/60">
                        Earn a random reward
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-xs text-light/60 mb-1">
                        Reward
                      </div>
                      <div className="text-xs font-semibold text-light">
                        Random Reward
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Info Box */}
        <div className="glass rounded-xl p-4 border border-light/20">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h4 className="font-semibold text-light text-sm mb-1">How It Works</h4>
              <p className="text-xs text-light/60">
                Overcome obstacles to progress toward achievement goals. When you reach a goal, click the achievement card to redeem it and earn a random reward for Bobo. After redemption, the goal scales up 10x for the next tier!
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}