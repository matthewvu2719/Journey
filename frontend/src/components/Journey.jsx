import { useState, useEffect } from 'react'
import RobotMascot from './RobotMascot'
import { useBobo } from '../contexts/BoboContext'
import { api } from '../services/api'

export default function Journey({ onContinue, habitsCount, completionsCount }) {
  const [isVisible, setIsVisible] = useState(false)
  const [stats, setStats] = useState(null)
  const { getEquippedItems } = useBobo()
  const equippedItems = getEquippedItems()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    const element = document.getElementById('journey')
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const statsData = await api.getLogStats()
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  return (
    <div id="journey" className="relative flex items-center justify-center px-6 py-20">
      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Narrative text - Bobo speaking */}
        <div className={`space-y-8 mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-display font-bold leading-tight">
            I'm here to help you
            <br />
            <span className="gradient-text">reach your goals</span>
          </h2>
          
          <p className="text-xl text-light/80 leading-relaxed max-w-3xl">
            Every great achievement starts with a single habit. 
            I'll be with you every step of the way, helping you build routines that transform your life—one day at a time.
          </p>
        </div>

        {/* Meet Your Companion */}
        <div className={`glass rounded-3xl p-8 mb-12 transition-all duration-1000 delay-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <RobotMascot 
                size="xl" 
                emotion="excited"
                color={equippedItems.color?.svg_data || null}
                hat={equippedItems.hat ? { svg: equippedItems.hat.svg_data } : null}
                costume={equippedItems.costume ? { svg: equippedItems.costume.svg_data } : null}
                dance={equippedItems.dance?.animation_data || false}
                animate={true} 
              />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-3xl font-bold mb-4 text-[var(--color-foreground)]">
                I'll be your companion along our journey
              </h3>
              <p className="text-lg text-[var(--color-foreground-secondary)] mb-6">
                I'm your personal habit coach, cheerleader, and accountability partner all in one. Here's how I'll support you:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--color-glass)] rounded-xl p-4">
                  <div className="text-2xl mb-2">💬</div>
                  <h4 className="font-bold text-sm mb-1 text-[var(--color-foreground)]">We Can Chat Anytime</h4>
                  <p className="text-xs text-[var(--color-foreground-secondary)]">
                    Ask me questions, get advice, and receive personalized tips whenever you need
                  </p>
                </div>
                <div className="bg-[var(--color-glass)] rounded-xl p-4">
                  <div className="text-2xl mb-2">🎉</div>
                  <h4 className="font-bold text-sm mb-1 text-[var(--color-foreground)]">We Celebrate Together</h4>
                  <p className="text-xs text-[var(--color-foreground-secondary)]">
                    I'll give you instant encouragement when you complete habits
                  </p>
                </div>
                <div className="bg-[var(--color-glass)] rounded-xl p-4">
                  <div className="text-2xl mb-2">📞</div>
                  <h4 className="font-bold text-sm mb-1 text-[var(--color-foreground)]">We Can Call</h4>
                  <p className="text-xs text-[var(--color-foreground-secondary)]">
                    Schedule check-in calls with me to stay on track with your goals
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 transition-all duration-1000 delay-400 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300 text-center">
            <div className="text-4xl mb-4">🔥</div>
            <div className="text-5xl font-bold mb-2 text-[var(--color-accent)]">
              {stats?.current_streak || 0}
            </div>
            <h3 className="text-xl font-bold mb-2 text-[var(--color-foreground)]">Current Streak</h3>
            <p className="text-sm text-[var(--color-foreground-secondary)]">
              Keep the momentum going with your daily habit streak
            </p>
          </div>

          <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300 text-center">
            <div className="text-4xl mb-4">✅</div>
            <div className="text-5xl font-bold mb-2 text-[var(--color-accent)]">
              {completionsCount || 0}
            </div>
            <h3 className="text-xl font-bold mb-2 text-[var(--color-foreground)]">Total Completions</h3>
            <p className="text-sm text-[var(--color-foreground-secondary)]">
              Track all the habits you've completed on your journey
            </p>
          </div>

          <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300 text-center">
            <div className="text-4xl mb-4">📈</div>
            <div className="text-5xl font-bold mb-2 text-[var(--color-accent)]">
              {habitsCount > 0 ? Math.round((completionsCount / (habitsCount * 7)) * 100) : 0}%
            </div>
            <h3 className="text-xl font-bold mb-2 text-[var(--color-foreground)]">Success Rate</h3>
            <p className="text-sm text-[var(--color-foreground-secondary)]">
              See how consistently you're achieving your goals
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className={`text-center transition-all duration-1000 delay-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <button
            onClick={onContinue}
            className="group px-10 py-4 bg-light text-dark font-bold text-lg rounded-full hover-lift inline-flex items-center gap-3"
          >
            <span>Let's get started together</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
