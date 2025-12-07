import { useEffect, useState } from 'react'

export default function MountainJourney() {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (window.scrollY / totalHeight) * 100
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Mountain layers with parallax */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[40%] transition-transform duration-300"
        style={{ transform: `translateY(${scrollProgress * 0.3}%)` }}
      >
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 400">
          {/* Back mountain */}
          <path
            d="M 0 400 L 0 200 Q 200 50, 400 150 T 800 100 L 1200 180 L 1200 400 Z"
            fill="var(--color-accent)"
            opacity="0.05"
          />
          {/* Middle mountain */}
          <path
            d="M 0 400 L 0 280 Q 300 120, 600 200 T 1200 250 L 1200 400 Z"
            fill="var(--color-accent)"
            opacity="0.1"
          />
          {/* Front mountain */}
          <path
            d="M 0 400 L 0 320 Q 400 200, 800 280 L 1200 320 L 1200 400 Z"
            fill="var(--color-accent)"
            opacity="0.15"
          />
        </svg>
      </div>

      {/* Climbing progress indicator */}
      <div 
        className="absolute left-1/2 transition-all duration-500"
        style={{ 
          bottom: `${20 + scrollProgress * 0.6}%`,
          transform: 'translateX(-50%)',
          opacity: scrollProgress > 10 ? 1 : 0
        }}
      >
        <div className="text-4xl animate-bounce">🧗</div>
      </div>

      {/* Achievement flags on peaks */}
      <div 
        className="absolute right-[30%] transition-all duration-500"
        style={{ 
          top: '25%',
          opacity: scrollProgress > 40 ? 1 : 0,
          transform: `scale(${scrollProgress > 40 ? 1 : 0.5})`
        }}
      >
        <div className="text-3xl">🚩</div>
      </div>

      <div 
        className="absolute right-[15%] transition-all duration-500"
        style={{ 
          top: '15%',
          opacity: scrollProgress > 70 ? 1 : 0,
          transform: `scale(${scrollProgress > 70 ? 1 : 0.5})`
        }}
      >
        <div className="text-3xl">🏁</div>
      </div>

      {/* Clouds moving across */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="absolute w-20 h-12 rounded-full bg-[var(--color-foreground)]/5 blur-xl animate-float"
          style={{
            left: `${i * 25}%`,
            top: `${10 + i * 15}%`,
            animationDelay: `${i * 2}s`,
            animationDuration: `${8 + i * 2}s`,
          }}
        />
      ))}

      {/* Stars appearing as you climb */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute transition-all duration-500"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 50}%`,
            opacity: scrollProgress > i * 8 ? 0.6 : 0,
          }}
        >
          <span className="text-[var(--color-accent)]">✨</span>
        </div>
      ))}
    </div>
  )
}
