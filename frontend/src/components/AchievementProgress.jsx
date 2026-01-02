import { useState, useEffect } from 'react'
import { CircularProgress } from './ui/CircularProgress'
import { api } from '../services/api'
import AchievementNotification from './AchievementNotification'
import JourneyAchievementProgress from './JourneyAchievementProgress'

export default function AchievementProgress() {
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unlockingAchievement, setUnlockingAchievement] = useState(null)
  const [achievementResult, setAchievementResult] = useState(null)
  const [claimedStatus, setClaimedStatus] = useState({
    daily: false,
    weekly: false,
    monthly: false
  })

  useEffect(() => {
    loadProgress()
    loadClaimedStatus()

    // Listen for journey achievement unlocks to refresh progress
    const handleJourneyAchievement = () => {
      loadProgress()
      loadClaimedStatus()
    }

    window.addEventListener('journeyAchievementUnlocked', handleJourneyAchievement)
    
    return () => {
      window.removeEventListener('journeyAchievementUnlocked', handleJourneyAchievement)
    }
  }, [])

  const loadProgress = async () => {
    try {
      setLoading(true)
      const data = await api.getAchievementProgress()
      setProgress(data)
    } catch (error) {
      console.error('Failed to load achievement progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadClaimedStatus = async () => {
    try {
      // Check claimed status for each achievement type
      const [dailyClaimed, weeklyClaimed, monthlyClaimed] = await Promise.all([
        api.checkRewardClaimed('daily_perfect'),
        api.checkRewardClaimed('weekly_perfect'), 
        api.checkRewardClaimed('monthly_perfect')
      ])
      
      setClaimedStatus({
        daily: dailyClaimed,
        weekly: weeklyClaimed,
        monthly: monthlyClaimed
      })
    } catch (error) {
      console.error('Failed to load claimed status:', error)
    }
  }

  const handleUnlockAchievement = async (type) => {
    // Prevent clicking if already claimed for this period
    if (claimedStatus[type]) {
      return
    }

    try {
      setUnlockingAchievement(type)
      
      let result
      if (type === 'daily') {
        result = await api.unlockDailyAchievement()
      } else if (type === 'weekly') {
        result = await api.unlockWeeklyAchievement()
      } else if (type === 'monthly') {
        result = await api.unlockMonthlyAchievement()
      }
      
      if (result.success) {
        setAchievementResult(result.achievement)
        
        // Mark as claimed in local state
        setClaimedStatus(prev => ({
          ...prev,
          [type]: true
        }))
        
        // Refresh progress after unlocking
        await loadProgress()
      }
    } catch (error) {
      console.error(`Failed to unlock ${type} achievement:`, error)
      
      // If error might be due to already claimed, refresh claimed status
      if (error.response?.status === 400) {
        await loadClaimedStatus()
        alert(`This ${type} reward has already been claimed for this period!`)
      } else {
        alert(`Failed to unlock ${type} achievement. Make sure you have 100% completion!`)
      }
    } finally {
      setUnlockingAchievement(null)
    }
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-light/20 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-light/20 rounded"></div>
            <div className="h-20 bg-light/20 rounded"></div>
            <div className="h-20 bg-light/20 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!progress) return null

  const achievements = [
    {
      type: 'daily',
      icon: '⭐',
      title: 'Perfect Day',
      description: 'Complete all today\'s habits',
      progress: progress.daily_progress,
      reward: 'New dance'
    },
    {
      type: 'weekly',
      icon: '🏆',
      title: 'Perfect Week',
      description: 'Complete all this week\'s habits',
      progress: progress.weekly_progress,
      reward: 'Hat + costume'
    },
    {
      type: 'monthly',
      icon: '👑',
      title: 'Perfect Month',
      description: 'Complete all this month\'s habits',
      progress: progress.monthly_progress,
      reward: 'New color + theme'
    }
  ]

  return (
    <>
      {/* Achievement Notification */}
      {achievementResult && (
        <AchievementNotification 
          achievement={achievementResult}
          onClose={() => setAchievementResult(null)}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-3xl font-bold text-light">Rewards & Achievements</h2>
            <button
              onClick={() => {
                loadProgress()
                loadClaimedStatus()
              }}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-light/10 transition-colors disabled:opacity-50"
              title="Refresh progress"
            >
              <svg 
                className={`w-5 h-5 text-light/60 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </button>
          </div>
          <p className="text-light/60">Complete perfect streaks to unlock amazing rewards for Bobo!</p>
        </div>

        {/* Achievement Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {achievements.map((achievement) => {
            const isComplete = achievement.progress.percentage >= 100
            const isClaimed = claimedStatus[achievement.type]
            const isUnlocking = unlockingAchievement === achievement.type
            const isClickable = isComplete && !isClaimed && !isUnlocking
            
            return (
              <div 
                key={achievement.type}
                onClick={isClickable ? () => handleUnlockAchievement(achievement.type) : undefined}
                className={`
                  glass rounded-2xl p-6 border transition-all duration-300 hover:scale-105
                  ${isClickable 
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 cursor-pointer hover:shadow-xl' 
                    : isClaimed
                      ? 'border-green-500/50 bg-green-500/10 cursor-not-allowed opacity-75'
                      : 'border-light/20 hover:border-light/30'
                  }
                  ${isUnlocking ? 'animate-pulse' : ''}
                `}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">{achievement.icon}</div>
                  {isClaimed ? (
                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      ✓ Claimed
                    </div>
                  ) : isComplete ? (
                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      Ready!
                    </div>
                  ) : null}
                </div>

                {/* Progress Circle */}
                <div className="flex justify-center mb-4">
                  <CircularProgress 
                    value={achievement.progress.percentage} 
                    size={80}
                    strokeWidth={6}
                    textSize="text-lg"
                  />
                </div>

                {/* Info */}
                <div className="text-center mb-4">
                  <h4 className="font-bold text-light text-lg mb-1">{achievement.title}</h4>
                  <p className="text-sm text-light/60 mb-2">{achievement.description}</p>
                  
                  {/* Stats */}
                  <div className="text-xs text-light/60">
                    {achievement.progress.completed} / {achievement.progress.total} completed
                  </div>
                </div>

                {/* Reward */}
                <div className="bg-light/5 rounded-lg p-3 text-center">
                  <div className="text-xs text-light/60 mb-1">Reward</div>
                  <div className="text-sm font-semibold text-[var(--color-accent)]">
                    🎁 {achievement.reward}
                  </div>
                </div>

                {/* Status Messages */}
                {isClaimed ? (
                  <div className="mt-3 text-center">
                    <div className="text-xs text-green-400 font-semibold">
                      Reward claimed! 🎉
                    </div>
                  </div>
                ) : isComplete && !isUnlocking ? (
                  <div className="mt-3 text-center">
                    <div className="text-xs text-green-400 font-semibold animate-pulse">
                      Click to unlock! ✨
                    </div>
                  </div>
                ) : isUnlocking ? (
                  <div className="mt-3 text-center">
                    <div className="text-xs text-[var(--color-accent)] font-semibold">
                      Unlocking reward...
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        {/* Stats Summary */}
        <div className="glass rounded-2xl p-6 border border-light/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-light mb-1">Your Journey</h3>
              <p className="text-sm text-light/60">Keep building those perfect streaks!</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-light">{progress?.total_completions || 0}</div>
              <div className="text-xs text-light/60">Total Completions</div>
            </div>
          </div>
        </div>

        {/* Journey Achievements Section */}
        <div className="mt-8">
          <JourneyAchievementProgress />
        </div>
      </div>
    </>
  )
}
