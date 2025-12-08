import { useState, useEffect } from 'react'
import RobotMascot from './RobotMascot'
import { useBobo } from '../contexts/BoboContext'

export default function Journey({ onContinue, habitsCount, completionsCount }) {
  const [isVisible, setIsVisible] = useState(false)
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

  return (
    <div id="journey" className="relative flex items-center justify-center px-6 py-20">
      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Stats */}
        <div className={`grid grid-cols-2 gap-8 mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="glass rounded-3xl p-8 text-center hover-lift">
            <div className="text-6xl font-bold mb-2">{habitsCount}</div>
            <div className="font-mono text-sm text-light/60 uppercase tracking-wider">Active Habits</div>
          </div>
          <div className="glass rounded-3xl p-8 text-center hover-lift">
            <div className="text-6xl font-bold mb-2">{completionsCount}</div>
            <div className="font-mono text-sm text-light/60 uppercase tracking-wider">Completions</div>
          </div>
        </div>

        {/* Narrative text */}
        <div className={`space-y-8 mb-16 transition-all duration-1000 delay-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-display font-bold leading-tight">
            Your ticket to
            <br />
            <span className="gradient-text">get there</span>
          </h2>
          
          <p className="text-xl text-light/80 leading-relaxed max-w-3xl">
            Every great achievement starts with a single habit. 
            We're here to help you build the routines that transform your life—one day at a time.
          </p>
        </div>

        {/* Meet Your Companion */}
        <div className={`glass rounded-3xl p-8 mb-12 transition-all duration-1000 delay-400 ${
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
                Meet Bobo, Your AI Companion 🤖
              </h3>
              <p className="text-lg text-[var(--color-foreground-secondary)] mb-6">
                Bobo is more than just an app—he's your personal habit coach, cheerleader, and accountability partner all in one.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--color-glass)] rounded-xl p-4">
                  <div className="text-2xl mb-2">💬</div>
                  <h4 className="font-bold text-sm mb-1 text-[var(--color-foreground)]">Chat Support</h4>
                  <p className="text-xs text-[var(--color-foreground-secondary)]">
                    Ask questions, get advice, and receive personalized tips
                  </p>
                </div>
                <div className="bg-[var(--color-glass)] rounded-xl p-4">
                  <div className="text-2xl mb-2">🎉</div>
                  <h4 className="font-bold text-sm mb-1 text-[var(--color-foreground)]">Celebrations</h4>
                  <p className="text-xs text-[var(--color-foreground-secondary)]">
                    Get instant encouragement when you complete habits
                  </p>
                </div>
                <div className="bg-[var(--color-glass)] rounded-xl p-4">
                  <div className="text-2xl mb-2">📞</div>
                  <h4 className="font-bold text-sm mb-1 text-[var(--color-foreground)]">Call Scheduling</h4>
                  <p className="text-xs text-[var(--color-foreground-secondary)]">
                    Book check-in calls to stay on track with your goals
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 transition-all duration-1000 delay-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2 text-[var(--color-foreground)]">Smart Analytics</h3>
            <p className="text-sm text-[var(--color-foreground-secondary)]">
              Visualize your progress with beautiful charts and insights powered by AI
            </p>
          </div>

          <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-2 text-[var(--color-foreground)]">Personalized Goals</h3>
            <p className="text-sm text-[var(--color-foreground-secondary)]">
              Set meaningful targets and let AI optimize your schedule for success
            </p>
          </div>

          <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold mb-2 text-[var(--color-foreground)]">Celebrate Wins</h3>
            <p className="text-sm text-[var(--color-foreground-secondary)]">
              Track streaks, earn achievements, and celebrate every milestone
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className={`transition-all duration-1000 delay-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <button
            onClick={onContinue}
            className="group px-10 py-4 bg-light text-dark font-bold text-lg rounded-full hover-lift inline-flex items-center gap-3"
          >
            <span>Let's explore your options</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
