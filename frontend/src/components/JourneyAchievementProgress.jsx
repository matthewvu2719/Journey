import { useState, useEffect } from 'react'
import { api } from '../services/api'
import AchievementNotification from './AchievementNotification'

export default function JourneyAchievementProgress() {
  const [journeyProgress, setJourneyProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [achievementResult, setAchievementResult] = useState(null)

  useEffect(() => {
    loadJourneyProgress()
  }, [])

  const loadJourneyProgress = async () => {
    try {
      setLoading(true)
      const data = await api.getJourneyProgress()
      setJourneyProgress(data)
    } catch (error) {
      console.error('Failed to load journey progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkJourneyAchievements = async (obstacleType = null) => {
    try {
      const result = await api.checkJourneyAchievements(obstacleType)
      
      if (result.unlocked_achievements && result.unlocked_achievements.length > 0) {
        // Show notification for first achievement
        setAchievementResult(result.unlocked_achievements[0])
        
        // Refresh progress
        await loadJourneyProgress()
        
        // Dispatch event to refresh main achievement progress too
        window.dispatchEvent(new CustomEvent('journeyAchievementUnlocked'))
      }
      
      return result
    } catch (error) {
      console.error('Failed to check journey achievements:', error)
      return { unlocked_achievements: [], count: 0 }
    }
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

  if (!journeyProgress) return null

  const { obstacle_stats, achievement_progress, journey_level, journey_experience } = journeyProgress

  const journeyAchievements = [
    {
      id: 'obstacle_navigator',
      icon: '🧭',
      title: 'Obstacle Navigator',
      description: 'Overcome your first obstacle',
      unlocked: achievement_progress.navigator_unlocked,
      progress: obstacle_stats.total_obstacles_overcome >= 1 ? 100 : 0,
      requirement: '1 obstacle overcome',
      reward: 'Journey Badge'
    },
    {
      id: 'distraction_master',
      icon: '🎯',
      title: 'Distraction Master',
      description: 'Master the Distraction Detour',
      unlocked: achievement_progress.distraction_master_progress === '5/5',
      progress: (obstacle_stats.distraction_detours_overcome / 5) * 100,
      requirement: achievement_progress.distraction_master_progress,
      reward: 'Special Hat'
    },
    {
      id: 'energy_warrior',
      icon: '⚡',
      title: 'Energy Warrior',
      description: 'Conquer the Energy Drain Valley',
      unlocked: achievement_progress.energy_warrior_progress === '5/5',
      progress: (obstacle_stats.energy_valleys_overcome / 5) * 100,
      requirement: achievement_progress.energy_warrior_progress,
      reward: 'Special Costume'
    },
    {
      id: 'maze_solver',
      icon: '🧩',
      title: 'Maze Solver',
      description: 'Navigate the Maze Mountain',
      unlocked: achievement_progress.maze_solver_progress === '5/5',
      progress: (obstacle_stats.maze_mountains_overcome / 5) * 100,
      requirement: achievement_progress.maze_solver_progress,
      reward: 'Special Color'
    },
    {
      id: 'memory_keeper',
      icon: '🧠',
      title: 'Memory Keeper',
      description: 'Clear the Memory Fog',
      unlocked: achievement_progress.memory_keeper_progress === '5/5',
      progress: (obstacle_stats.memory_fogs_overcome / 5) * 100,
      requirement: achievement_progress.memory_keeper_progress,
      reward: 'Special Dance'
    },
    {
      id: 'journey_champion',
      icon: '👑',
      title: 'Journey Champion',
      description: 'Ultimate obstacle master',
      unlocked: achievement_progress.champion_progress === '25/25',
      progress: (obstacle_stats.total_obstacles_overcome / 25) * 100,
      requirement: achievement_progress.champion_progress,
      reward: 'Champion Theme'
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
        {/* Achievement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {journeyAchievements.map((achievement) => (
            <div 
              key={achievement.id}
              className={`
                glass rounded-xl p-4 border transition-all duration-300 hover:scale-105
                ${achievement.unlocked 
                  ? 'border-green-500/50 bg-green-500/10' 
                  : achievement.progress >= 100
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                    : 'border-light/20 hover:border-light/30'
                }
              `}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-2xl">{achievement.icon}</div>
                {achievement.unlocked && (
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    ✓ Unlocked
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div className="mb-3">
                <h4 className="font-bold text-light text-sm mb-1">{achievement.title}</h4>
                <p className="text-xs text-light/60 mb-2">{achievement.description}</p>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-light/60 mb-1">
                  <span>Progress</span>
                  <span>{achievement.requirement}</span>
                </div>
                <div className="w-full bg-light/10 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      achievement.unlocked 
                        ? 'bg-green-500' 
                        : 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent)]/80'
                    }`}
                    style={{ width: `${Math.min(achievement.progress, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Reward */}
              <div className="bg-light/5 rounded-lg p-2 text-center">
                <div className="text-xs text-light/60 mb-1">Reward</div>
                <div className="text-xs font-semibold text-[var(--color-accent)]">
                  🎁 {achievement.reward}
                </div>
              </div>
            </div>
          ))}
        </div>


      </div>
    </>
  )
}