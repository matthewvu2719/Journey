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
    },
    {
      id: 'persistence_legend',
      icon: '⭐',
      title: 'Persistence Legend',
      description: 'Maintain 30-day success streak',
      unlocked: achievement_progress.legend_progress === '30/30',
      progress: (obstacle_stats.current_success_streak / 30) * 100,
      requirement: achievement_progress.legend_progress,
      reward: 'Legend Title'
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
            <h2 className="text-3xl font-bold text-light">Journey Achievements</h2>
            <button
              onClick={loadJourneyProgress}
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
          <p className="text-light/60">Overcome obstacles on your journey to unlock special rewards!</p>
        </div>

        {/* Journey Level & Experience */}
        <div className="glass rounded-2xl p-6 border border-light/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-light">Journey Level {journey_level}</h3>
              <p className="text-sm text-light/60">Experience: {journey_experience} XP</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-accent)]">
                {obstacle_stats.total_obstacles_overcome}
              </div>
              <div className="text-xs text-light/60">Obstacles Overcome</div>
            </div>
          </div>
          
          {/* Experience Progress Bar */}
          <div className="w-full bg-light/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent)]/80 h-2 rounded-full transition-all duration-500"
              style={{ width: `${journeyProgress.progress_to_next_level}%` }}
            ></div>
          </div>
          <div className="text-xs text-light/60 mt-1 text-center">
            {Math.round(journeyProgress.progress_to_next_level)}% to next level
          </div>
        </div>

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

        {/* Obstacle Stats Summary */}
        <div className="glass rounded-2xl p-6 border border-light/20">
          <h3 className="text-lg font-bold text-light mb-4">Obstacle Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-light">{obstacle_stats.distraction_detours_overcome}</div>
              <div className="text-xs text-light/60">Distraction Detours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-light">{obstacle_stats.energy_valleys_overcome}</div>
              <div className="text-xs text-light/60">Energy Valleys</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-light">{obstacle_stats.maze_mountains_overcome}</div>
              <div className="text-xs text-light/60">Maze Mountains</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-light">{obstacle_stats.memory_fogs_overcome}</div>
              <div className="text-xs text-light/60">Memory Fogs</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-light/10">
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-light/60">Current Streak: </span>
                <span className="font-semibold text-light">{obstacle_stats.current_success_streak} days</span>
              </div>
              <div>
                <span className="text-light/60">Best Streak: </span>
                <span className="font-semibold text-light">{obstacle_stats.longest_success_streak} days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Button for Development */}
        <div className="glass rounded-2xl p-4 border border-light/20">
          <h4 className="text-sm font-bold text-light mb-2">Test Journey Achievements</h4>
          <button
            onClick={() => checkJourneyAchievements()}
            className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent)]/80 transition-colors text-sm"
          >
            Check for New Achievements
          </button>
        </div>
      </div>
    </>
  )
}