import { useState, useEffect } from 'react'

export default function Journey({ onContinue, habitsCount, completionsCount }) {
  const [isVisible, setIsVisible] = useState(false)

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
    <div className="relative flex items-center justify-center px-6 py-20">
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
        <div className={`space-y-8 mb-12 transition-all duration-1000 delay-300 ${
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

          <p className="text-lg text-light/60 leading-relaxed max-w-3xl">
            Our AI analyzes your patterns, optimizes your schedule, and guides you 
            toward sustainable growth. No more guesswork. Just results.
          </p>
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
