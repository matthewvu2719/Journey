import { useState, useEffect } from 'react'
import { CircularProgress } from './ui/CircularProgress'
import { api } from '../services/api'

export default function AchievementProgress() {
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProgress()
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
      reward: 'New dance + emotion'
    },
    {
      type: 'weekly',
      icon: '🏆',
      title: 'Perfect Week',
      description: 'Complete all this week\'s habits',
      progress: progress.weekly_progress,
      reward: 'New hat + costume'
    },
    {
      type: 'monthly',
      icon: '👑',
      title: 'Perfect Month',
      description: 'Complete all this month\'s habits',
      progress: progress.monthly_progress,
      reward: 'New theme'
    }
  ]

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-light">Achievement Progress</h3>
          <p className="text-light/60 text-sm">Keep going to unlock rewards!</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-light">{progress.total_completions}</div>
          <div className="text-xs text-light/60">Total Completions</div>
        </div>
      </div>

      <div className="space-y-4">
        {achievements.map((achievement) => (
          <div 
            key={achievement.type}
            className="bg-light/5 rounded-xl p-4 hover:bg-light/10 transition-colors"
          >
            <div className="flex items-center gap-4">
              {/* Icon & Progress Circle */}
              <div className="flex-shrink-0 relative">
                <CircularProgress 
                  value={achievement.progress.percentage} 
                  size={60}
                  strokeWidth={4}
                />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">
                  {achievement.icon}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-light">{achievement.title}</h4>
                  <span className="text-sm font-semibold text-light/80">
                    {Math.round(achievement.progress.percentage)}%
                  </span>
                </div>
                <p className="text-xs text-light/60 mb-2">{achievement.description}</p>
                
                {/* Progress Bar */}
                <div className="w-full bg-light/20 rounded-full h-2 mb-2">
                  <div 
                    className="bg-[var(--color-accent)] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${achievement.progress.percentage}%` }}
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-light/60">
                    {achievement.progress.completed} / {achievement.progress.total} completed
                  </span>
                  <span className="text-[var(--color-accent)] font-semibold">
                    🎁 {achievement.reward}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Motivational Note */}
      <div className="mt-6 bg-gradient-to-r from-[var(--color-accent)]/20 to-[var(--color-accent)]/10 rounded-xl p-4 border border-[var(--color-accent)]/30">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <p className="text-sm font-semibold text-light mb-1">Pro Tip</p>
            <p className="text-xs text-light/70">
              Complete habits consistently to unlock Bobo's new moves, outfits, and themes!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
