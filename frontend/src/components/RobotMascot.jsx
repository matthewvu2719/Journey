import { useState, useEffect } from 'react'

export default function RobotMascot({ 
  size = 'md', 
  emotion = 'happy', 
  animate = true,
  dance = false,
  className = '' 
}) {
  const [blink, setBlink] = useState(false)
  const [bounce, setBounce] = useState(false)
  const [isDancing, setIsDancing] = useState(dance)
  const [armRotation, setArmRotation] = useState(0)

  // Blinking animation
  useEffect(() => {
    if (!animate) return
    const blinkInterval = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 150)
    }, 3000 + Math.random() * 2000)
    return () => clearInterval(blinkInterval)
  }, [animate])

  // Bounce animation
  useEffect(() => {
    if (!animate) return
    const bounceInterval = setInterval(() => {
      setBounce(true)
      setTimeout(() => setBounce(false), 500)
    }, 5000)
    return () => clearInterval(bounceInterval)
  }, [animate])

  // Dance animation
  useEffect(() => {
    if (!dance) return
    setIsDancing(true)
    let rotation = 0
    const danceInterval = setInterval(() => {
      rotation = (rotation + 30) % 360
      setArmRotation(rotation)
    }, 200)
    return () => clearInterval(danceInterval)
  }, [dance])

  const sizes = {
    sm: 'w-12 h-16',
    md: 'w-20 h-28',
    lg: 'w-32 h-44',
    xl: 'w-48 h-64'
  }

  // Only 2 emotions: excited (default) and happy (^^ eyes)
  const isHappyEyes = emotion === 'happy'

  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      <div className={`relative w-full h-full transition-transform duration-300 ${
        bounce ? 'animate-bounce' : ''
      } ${isDancing ? 'animate-wiggle' : ''}`}>
        {/* Robot Body */}
        <svg viewBox="0 0 100 140" className="w-full h-full drop-shadow-lg">
          {/* Body - rounded rectangle */}
          <rect 
            x="20" 
            y="50" 
            width="60" 
            height="70" 
            rx="8" 
            fill="var(--color-accent)" 
            opacity="0.9"
          />
          
          {/* Body panel lines */}
          <line x1="30" y1="70" x2="70" y2="70" stroke="var(--color-background)" strokeWidth="1" opacity="0.3" />
          <line x1="30" y1="85" x2="70" y2="85" stroke="var(--color-background)" strokeWidth="1" opacity="0.3" />
          
          {/* Head - rounded square */}
          <rect 
            x="25" 
            y="15" 
            width="50" 
            height="40" 
            rx="6" 
            fill="var(--color-accent)" 
            opacity="0.95"
          />
          
          {/* Eyes */}
          <g className={`transition-all duration-150 ${blink ? 'opacity-0' : 'opacity-100'}`}>
            {isHappyEyes ? (
              // Happy ^^ eyes
              <>
                <path d="M 34 32 Q 40 28 46 32" stroke="#000000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M 54 32 Q 60 28 66 32" stroke="#000000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </>
            ) : (
              // Default excited eyes (circles)
              <>
                <circle cx="40" cy="32" r="7" fill="#000000" />
                <circle cx="60" cy="32" r="7" fill="#000000" />
                {/* Pupils - white */}
                <circle cx="40" cy="31" r="3" fill="white" />
                <circle cx="60" cy="31" r="3" fill="white" />
                {/* Eye shine */}
                <circle cx="41" cy="30" r="1.5" fill="white" opacity="0.8" />
                <circle cx="61" cy="30" r="1.5" fill="white" opacity="0.8" />
              </>
            )}
          </g>
          
          {/* Mouth - always smiling */}
          <path d="M 35 42 Q 50 48 65 42" stroke="#000000" strokeWidth="2" fill="none" strokeLinecap="round" />
          
          {/* Antenna */}
          <line 
            x1="50" 
            y1="15" 
            x2="50" 
            y2="8" 
            stroke="var(--color-accent)" 
            strokeWidth="2"
          />
          <circle 
            cx="50" 
            cy="6" 
            r="3" 
            fill="var(--color-accent)" 
            className="animate-pulse"
          />
          
          {/* Arms - animated when dancing */}
          <g transform={`rotate(${isDancing ? Math.sin(armRotation * Math.PI / 180) * 20 : 0} 14 60)`}>
            <rect 
              x="10" 
              y="60" 
              width="8" 
              height="25" 
              rx="4" 
              fill="var(--color-accent)" 
              opacity="0.8"
            />
          </g>
          <g transform={`rotate(${isDancing ? -Math.sin(armRotation * Math.PI / 180) * 20 : 0} 86 60)`}>
            <rect 
              x="82" 
              y="60" 
              width="8" 
              height="25" 
              rx="4" 
              fill="var(--color-accent)" 
              opacity="0.8"
            />
          </g>
          
          {/* Hands/Grippers */}
          <circle cx="14" cy="88" r="4" fill="var(--color-accent)" opacity="0.9" />
          <circle cx="86" cy="88" r="4" fill="var(--color-accent)" opacity="0.9" />
          
          {/* Tracks/Wheels */}
          <rect 
            x="22" 
            y="122" 
            width="56" 
            height="12" 
            rx="6" 
            fill="var(--color-foreground)" 
            opacity="0.3"
          />
          <circle cx="32" cy="128" r="4" fill="var(--color-background)" opacity="0.5" />
          <circle cx="50" cy="128" r="4" fill="var(--color-background)" opacity="0.5" />
          <circle cx="68" cy="128" r="4" fill="var(--color-background)" opacity="0.5" />
        </svg>
      </div>
      

      
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
