import { useState, useEffect } from 'react'
import { AnimatedGradientText } from './ui/AnimatedGradientText'
import { GridPattern } from './ui/GridPattern'
import { DotPattern } from './ui/DotPattern'
import RobotMascot from './RobotMascot'
import UserProfile from './UserProfile'
import { useBobo } from '../contexts/BoboContext'

export default function Hero({ onExplore, habits = [], completions = [], achievements = [] }) {
  const [isVisible, setIsVisible] = useState(false)
  const [visibleCards, setVisibleCards] = useState([])
  const { getEquippedItems } = useBobo()
  const equippedItems = getEquippedItems()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Motivational quotes for new users (Phase 1)
  const motivationalQuotes = [
    {
      type: 'quote',
      title: 'Small steps matter',
      subtitle: 'Every journey begins with a single step',
      icon: '🌱',
      color: 'from-green-500/20 to-emerald-500/20'
    },
    {
      type: 'quote',
      title: '1% better every day',
      subtitle: 'Compound your progress',
      icon: '📈',
      color: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      type: 'quote',
      title: 'Future you will thank you',
      subtitle: 'Start building today',
      icon: '🌟',
      color: 'from-purple-500/20 to-pink-500/20'
    },
    {
      type: 'quote',
      title: 'Progress over perfection',
      subtitle: 'Consistency is key',
      icon: '🎯',
      color: 'from-orange-500/20 to-red-500/20'
    },
    {
      type: 'quote',
      title: 'You are capable',
      subtitle: 'Believe in your potential',
      icon: '💪',
      color: 'from-yellow-500/20 to-orange-500/20'
    },
    {
      type: 'quote',
      title: 'One day at a time',
      subtitle: 'Focus on today',
      icon: '☀️',
      color: 'from-amber-500/20 to-yellow-500/20'
    }
  ]

  // Calculate user engagement level
  const totalCompletions = completions.length
  const accountAge = habits.length > 0 ? 15 : 0 // Simplified - in real app, calculate from user creation date
  const isEngagedUser = totalCompletions >= 10 || accountAge >= 15

  // Achievement cards for engaged users (Phase 2)
  const achievementCards = [
    // Recent achievements
    ...achievements.slice(0, 3).map(achievement => ({
      type: 'achievement',
      title: achievement.name,
      subtitle: `Unlocked ${new Date(achievement.unlocked_at).toLocaleDateString()}`,
      icon: achievement.icon || '🏆',
      color: 'from-yellow-500/20 to-orange-500/20'
    })),
    // Habit streaks
    habits.length > 0 && {
      type: 'stat',
      title: `${habits.length} Active Habits`,
      subtitle: 'Building consistency',
      icon: '🎯',
      color: 'from-blue-500/20 to-purple-500/20'
    },
    // Completion count
    totalCompletions > 0 && {
      type: 'stat',
      title: `${totalCompletions} Completions`,
      subtitle: 'Keep the momentum!',
      icon: '✨',
      color: 'from-green-500/20 to-teal-500/20'
    },
    // Consistency metric (mock calculation)
    totalCompletions > 10 && {
      type: 'stat',
      title: '12% more consistent',
      subtitle: 'Than last month',
      icon: '📊',
      color: 'from-indigo-500/20 to-blue-500/20'
    }
  ].filter(Boolean)

  // Choose cards based on user phase
  const availableCards = isEngagedUser && achievementCards.length > 0 
    ? achievementCards 
    : motivationalQuotes

  // Random positions for cards
  const cardPositions = [
    { top: '15%', left: '10%' },
    { top: '20%', right: '15%' },
    { bottom: '25%', left: '12%' },
    { bottom: '20%', right: '10%' },
    { top: '40%', left: '8%' },
    { top: '35%', right: '12%' }
  ]

  // Rotate cards every 6 seconds, showing 1-2 at a time
  useEffect(() => {
    const updateCards = () => {
      const numCards = Math.random() > 0.5 ? 2 : 1
      const shuffled = [...availableCards].sort(() => Math.random() - 0.5)
      const selectedCards = shuffled.slice(0, numCards).map((card) => ({
        ...card,
        position: cardPositions[Math.floor(Math.random() * cardPositions.length)],
        id: Math.random()
      }))
      setVisibleCards(selectedCards)
    }

    updateCards()
    const interval = setInterval(updateCards, 6000)
    return () => clearInterval(interval)
  }, [isEngagedUser, availableCards.length])

  return (
    <div className="relative flex items-center justify-center px-6 py-20 min-h-screen overflow-hidden">
      {/* User Profile - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <UserProfile />
      </div>
      {/* Floating Background Cards */}
      <div className="absolute inset-0 pointer-events-none">
        {visibleCards.map((card) => (
          <div
            key={card.id}
            className="absolute animate-fade-in"
            style={card.position}
          >
            {/* Blurred gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} blur-3xl scale-150 opacity-60`} />
            
            {/* Card content - more readable text */}
            <div className="relative glass rounded-3xl p-6 md:p-8 backdrop-blur-3xl border border-light/5 opacity-50 transform scale-125">
              <div className="text-4xl md:text-5xl mb-3">{card.icon}</div>
              <h3 className="text-lg md:text-xl font-bold text-light mb-1">{card.title}</h3>
              <p className="text-sm text-light/70">{card.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Background Patterns */}
      <DotPattern opacity={0.15} />
      <GridPattern opacity={0.1} size={60} />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-accent)]/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--color-accent)]/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[var(--color-accent)]/5 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      {/* Dark overlay to ensure content readability */}
      <div className="absolute inset-0 bg-[var(--color-background)]/60 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Bobo Introduction */}
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex justify-center mb-6">
            <RobotMascot 
              size="lg" 
              emotion="excited"
              color={equippedItems.color?.svg_data || null}
              hat={equippedItems.hat ? { svg: equippedItems.hat.svg_data } : null}
              costume={equippedItems.costume ? { svg: equippedItems.costume.svg_data } : null}
              dance={equippedItems.dance?.animation_data || false}
              animate={true} 
            />
          </div>
          <p className="font-mono text-sm text-light/60 tracking-wider uppercase mb-8">
            Meet Bobo, your journey AI companion
          </p>
        </div>

        {/* Main hero text */}
        <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-hero font-bold mb-6 leading-tight">
            Let me show you
            <br />
            <AnimatedGradientText className="gradient-text">
              where we can go
            </AnimatedGradientText>
          </h1>
        </div>

        {/* Subtitle */}
        <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-xl md:text-2xl text-light/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            I'll help you build habits that stick, track progress that matters,
            <br />
            and guide you to become your best self.
          </p>
        </div>

        {/* CTA Button */}
        <div className={`transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <button
            onClick={onExplore}
            className="group relative px-12 py-5 bg-[var(--color-accent)] text-[var(--color-background)] font-bold text-lg rounded-full hover-lift overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            <span className="relative z-10">Begin Your Journey</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </button>
          <style jsx="true">{`
            @keyframes shimmer {
              100% {
                transform: translateX(100%);
              }
            }
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: scale(0.9);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            .animate-shimmer {
              animation: shimmer 2s infinite;
            }
            .animate-fade-in {
              animation: fadeIn 1s ease-out;
            }
          `}</style>
        </div>



        {/* Scroll indicator */}
        <div className={`mt-8 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex flex-col items-center gap-2 animate-bounce">
            <p className="font-mono text-xs text-[var(--color-foreground)]/40 uppercase tracking-wider">Scroll to explore</p>
            <svg className="w-6 h-6 text-[var(--color-foreground)]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
