import { useState } from 'react'
import AchievementNotification from './AchievementNotification'

export default function JourneyAchievementTest() {
  const [currentAchievement, setCurrentAchievement] = useState(null)

  const testAchievements = [
    {
      achievement_type: 'obstacle_navigator',
      achievement_name: 'Obstacle Navigator',
      reward_type: 'journey_badge',
      reward: {
        id: 'navigator',
        name: 'Journey Navigator',
        description: 'First obstacle overcome',
        icon: '🧭'
      },
      message: '🧭 Journey Navigator badge unlocked! First obstacle overcome 🧭',
      bobo_message: "🎉 Wow! You just earned your first Journey Badge! You're becoming a true obstacle navigator! 🧭✨"
    },
    {
      achievement_type: 'distraction_master',
      achievement_name: 'Distraction Detour Master',
      reward_type: 'special_hat',
      reward: {
        id: 'navigator_cap',
        name: 'Navigator Cap',
        description: 'For overcoming distraction detours',
        icon: '🧭'
      },
      message: '🎩 Navigator Cap unlocked! For overcoming distraction detours 🧭',
      bobo_message: "🏆 AMAZING! You've mastered those obstacles and earned the Navigator Cap! You look so cool! 🧭"
    },
    {
      achievement_type: 'energy_warrior',
      achievement_name: 'Energy Valley Warrior',
      reward_type: 'special_costume',
      reward: {
        id: 'energy_armor',
        name: 'Energy Armor',
        description: 'Protects and amplifies your energy',
        icon: '⚡'
      },
      message: '👘 Energy Armor unlocked! Protects and amplifies your energy ⚡',
      bobo_message: "⚡ WOW! You're now an Energy Valley Warrior with the Energy Armor! So powerful! ⚡"
    },
    {
      achievement_type: 'maze_solver',
      achievement_name: 'Maze Mountain Solver',
      reward_type: 'special_color',
      reward: {
        id: 'emerald',
        name: 'Emerald',
        description: 'Precious green',
        hex: '#50C878'
      },
      message: '🎨 Special Emerald color unlocked! Precious green',
      bobo_message: "🧩 BRILLIANT! You solved those maze mountains and unlocked the special Emerald color! So smart! ✨"
    },
    {
      achievement_type: 'memory_keeper',
      achievement_name: 'Memory Fog Keeper',
      reward_type: 'special_dance',
      reward: {
        id: 'obstacle_victory',
        name: 'Obstacle Victory Dance',
        description: 'Triumphant celebration of overcoming challenges'
      },
      message: '💃 Obstacle Victory Dance unlocked! Triumphant celebration of overcoming challenges',
      bobo_message: "🧠 FANTASTIC! You cleared all that memory fog and earned the Obstacle Victory Dance! Let's dance! 💃"
    },
    {
      achievement_type: 'journey_champion',
      achievement_name: 'Journey Champion',
      reward_type: 'champion_theme',
      reward: {
        id: 'journey_champion',
        name: 'Journey Champion',
        description: 'Ultimate theme for obstacle masters',
        colors: ['gold', 'platinum', 'diamond'],
        effects: ['sparkles', 'glow', 'victory_aura']
      },
      message: '👑 Journey Champion Theme unlocked! You are the ultimate obstacle master!',
      bobo_message: "🏆 OH WOW! You're now a JOURNEY CHAMPION! This special theme shows everyone how amazing you are! 👑✨"
    },
    {
      achievement_type: 'persistence_legend',
      achievement_name: 'Persistence Legend',
      reward_type: 'legend_title',
      reward: {
        id: 'persistence_legend',
        name: 'Persistence Legend',
        description: 'Legendary persistence through all obstacles',
        title_text: 'The Unstoppable',
        special_effects: ['legend_glow', 'persistence_aura']
      },
      message: '🌟 Persistence Legend title unlocked! You are truly unstoppable!',
      bobo_message: "⭐ INCREDIBLE! You're now a PERSISTENCE LEGEND! Nothing can stop you on your journey! You're my hero! 🦸"
    }
  ]

  const testAchievement = (index) => {
    setCurrentAchievement(testAchievements[index])
  }

  return (
    <>
      {/* Achievement Notification */}
      {currentAchievement && (
        <AchievementNotification 
          achievement={currentAchievement}
          onClose={() => setCurrentAchievement(null)}
        />
      )}

      <div className="glass rounded-2xl p-6 border border-light/20">
        <h3 className="text-lg font-bold text-light mb-4">Journey Achievement Test</h3>
        <p className="text-sm text-light/60 mb-4">
          Test the journey achievement notification system with different reward types.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {testAchievements.map((achievement, index) => (
            <button
              key={index}
              onClick={() => testAchievement(index)}
              className="p-3 bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 rounded-lg transition-colors text-left"
            >
              <div className="text-sm font-semibold text-light mb-1">
                {achievement.achievement_name}
              </div>
              <div className="text-xs text-light/60">
                {achievement.reward_type}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}