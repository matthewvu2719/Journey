import { useState, useEffect } from 'react'
import { AnimatedGradientText } from './ui/AnimatedGradientText'
import { GridPattern } from './ui/GridPattern'
import { DotPattern } from './ui/DotPattern'
import RobotMascot from './RobotMascot'

export default function Hero({ onExplore }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="relative flex items-center justify-center px-6 py-20 min-h-screen">
      {/* Background Patterns */}
      <DotPattern opacity={0.15} />
      <GridPattern opacity={0.1} size={60} />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-accent)]/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--color-accent)]/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[var(--color-accent)]/5 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Bobo Introduction */}
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex justify-center mb-6">
            <RobotMascot size="lg" emotion="excited" animate={true} />
          </div>
          <p className="font-mono text-sm text-light/60 tracking-wider uppercase mb-8">
            Hi! I'm Bobo, your companion
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
          <style jsx>{`
            @keyframes shimmer {
              100% {
                transform: translateX(100%);
              }
            }
            .animate-shimmer {
              animation: shimmer 2s infinite;
            }
          `}</style>
        </div>

        {/* Scroll indicator */}
        <div className={`mt-20 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
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
