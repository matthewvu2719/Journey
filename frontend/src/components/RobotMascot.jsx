import { useState, useEffect } from 'react'

export default function RobotMascot({ 
  size = 'md', 
  emotion = 'happy', 
  animate = true,
  dance = false,
  hat = null,
  costume = null,
  color = null,
  className = '' 
}) {
  const [blink, setBlink] = useState(false)
  const [bounce, setBounce] = useState(false)
  const [isDancing, setIsDancing] = useState(dance)
  const [armRotation, setArmRotation] = useState(0)
  const [headRotation, setHeadRotation] = useState(0)
  const [handRotation, setHandRotation] = useState(0)

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

  // Dance animation - handle both boolean and object with keyframes
  useEffect(() => {
    const isDanceActive = dance === true || (typeof dance === 'object' && dance !== null)
    setIsDancing(isDanceActive)
    
    if (!isDanceActive) {
      setArmRotation(0)
      setHeadRotation(0)
      setHandRotation(0)
      return
    }
    
    // Get movement settings from dance data
    const movements = typeof dance === 'object' ? dance.movements : null
    const arms = movements?.arms || { speed: 50, amplitude: 20, pattern: 'wave' }
    const head = movements?.head || { speed: 100, amplitude: 5, pattern: 'nod' }
    const hands = movements?.hands || { speed: 80, amplitude: 15, pattern: 'wiggle' }
    
    // Animate arms
    let armRot = 0
    const armInterval = setInterval(() => {
      armRot = (armRot + 10) % 360
      if (arms.pattern === 'still') setArmRotation(0)
      else if (arms.pattern === 'pump') setArmRotation(Math.abs(Math.sin(armRot * Math.PI / 180)) * arms.amplitude)
      else if (arms.pattern === 'swing') setArmRotation(Math.cos(armRot * Math.PI / 180) * arms.amplitude)
      else setArmRotation(armRot)
    }, arms.speed)
    
    // Animate head
    let headRot = 0
    const headInterval = setInterval(() => {
      headRot = (headRot + 10) % 360
      if (head.pattern === 'still') setHeadRotation(0)
      else if (head.pattern === 'nod') setHeadRotation(Math.sin(headRot * Math.PI / 180) * head.amplitude)
      else if (head.pattern === 'shake') setHeadRotation(Math.cos(headRot * Math.PI / 180) * head.amplitude)
      else if (head.pattern === 'tilt') setHeadRotation(Math.sin(headRot * Math.PI / 180) * head.amplitude)
      else if (head.pattern === 'bob') setHeadRotation(Math.abs(Math.sin(headRot * Math.PI / 180)) * head.amplitude)
      else setHeadRotation(0)
    }, head.speed)
    
    // Animate hands
    let handRot = 0
    const handInterval = setInterval(() => {
      handRot = (handRot + 15) % 360
      if (hands.pattern === 'still') setHandRotation(0)
      else if (hands.pattern === 'wiggle') setHandRotation(Math.sin(handRot * Math.PI / 180) * hands.amplitude)
      else if (hands.pattern === 'wave') setHandRotation(Math.cos(handRot * Math.PI / 180) * hands.amplitude)
      else if (hands.pattern === 'clap') setHandRotation(Math.abs(Math.sin(handRot * Math.PI / 180)) * hands.amplitude)
      else if (hands.pattern === 'point') setHandRotation(Math.sin(handRot * Math.PI / 180) * hands.amplitude)
      else setHandRotation(0)
    }, hands.speed)
    
    return () => {
      clearInterval(armInterval)
      clearInterval(headInterval)
      clearInterval(handInterval)
      setArmRotation(0)
      setHeadRotation(0)
      setHandRotation(0)
    }
  }, [dance])

  const sizes = {
    sm: 'w-12 h-16',
    md: 'w-20 h-28',
    lg: 'w-32 h-44',
    xl: 'w-48 h-64'
  }

  const isCelebratingEyes = emotion === 'celebrating' || emotion === 'happy'

  // Hat rendering
  const renderHat = (hatType) => {
    const hats = {
      party_hat: (
        <g transform="translate(50, 10)">
          <path d="M 0 5 L -10 -10 L 10 -10 Z" fill="#FF6B9D" stroke="#FF1744" strokeWidth="1"/>
          <circle cx="0" cy="-12" r="3" fill="#FFD700"/>
          <line x1="-7" y1="0" x2="7" y2="0" stroke="#FFD700" strokeWidth="2"/>
        </g>
      ),
      crown: (
        <g transform="translate(50, 12)">
          <rect x="-15" y="0" width="30" height="6" fill="#FFD700" stroke="#FFA000" strokeWidth="1"/>
          <path d="M -15 0 L -12 -8 L -9 0 M -6 0 L -3 -10 L 0 0 M 3 0 L 6 -8 L 9 0" fill="#FFD700" stroke="#FFA000" strokeWidth="1"/>
          <circle cx="-3" cy="-8" r="2" fill="#E91E63"/>
          <circle cx="6" cy="-6" r="2" fill="#2196F3"/>
        </g>
      ),
      cap: (
        <g transform="translate(50, 12)">
          <ellipse cx="0" cy="5" rx="20" ry="4" fill="#2196F3" opacity="0.8"/>
          <ellipse cx="0" cy="0" rx="15" ry="8" fill="#2196F3"/>
          <circle cx="0" cy="-2" r="2" fill="#1976D2"/>
        </g>
      ),
      halo: (
        <g transform="translate(50, 0)">
          <ellipse cx="0" cy="0" rx="18" ry="4" fill="none" stroke="#FFD700" strokeWidth="3" opacity="0.8"/>
          <ellipse cx="0" cy="0" rx="20" ry="5" fill="#FFD700" opacity="0.2"/>
        </g>
      )
    }
    return hats[hatType] || null
  }

  // Costume rendering
  const renderCostume = (costumeType, layer) => {
    const costumes = {
      cape: {
        layer: 'behind',
        svg: (
          <g transform="translate(50, 55)">
            <path d="M -8 0 Q -15 20 -12 40 L -8 40 Q -10 20 -6 0 Z" fill="#F44336" opacity="0.9"/>
            <path d="M 8 0 Q 15 20 12 40 L 8 40 Q 10 20 6 0 Z" fill="#D32F2F" opacity="0.9"/>
            <line x1="-8" y1="0" x2="8" y2="0" stroke="#C62828" strokeWidth="2"/>
          </g>
        )
      },
      bow_tie: {
        layer: 'front',
        svg: (
          <g transform="translate(50, 56)">
            <path d="M -10 0 Q -15 -3 -15 0 Q -15 3 -10 0 Z" fill="#2196F3"/>
            <path d="M 10 0 Q 15 -3 15 0 Q 15 3 10 0 Z" fill="#2196F3"/>
            <rect x="-3" y="-2" width="6" height="4" fill="#1976D2" rx="1"/>
          </g>
        )
      },
      scarf: {
        layer: 'front',
        svg: (
          <g transform="translate(50, 54)">
            <ellipse cx="0" cy="0" rx="12" ry="4" fill="#FF9800" stroke="#F57C00" strokeWidth="1"/>
            <rect x="-14" y="2" width="4" height="15" fill="#FF9800" rx="2"/>
            <rect x="10" y="2" width="4" height="12" fill="#FF9800" rx="2"/>
          </g>
        )
      },
      wings: {
        layer: 'behind',
        svg: (
          <g transform="translate(50, 70)">
            <ellipse cx="-15" cy="0" rx="12" ry="20" fill="#E1F5FE" stroke="#81D4FA" strokeWidth="1" opacity="0.8" transform="rotate(-20 -15 0)"/>
            <ellipse cx="15" cy="0" rx="12" ry="20" fill="#E1F5FE" stroke="#81D4FA" strokeWidth="1" opacity="0.8" transform="rotate(20 15 0)"/>
          </g>
        )
      }
    }
    
    const costumeData = costumes[costumeType]
    if (costumeData && costumeData.layer === layer) {
      return costumeData.svg
    }
    return null
  }

  // Render custom hat SVG if provided
  const renderCustomHat = () => {
    if (hat && typeof hat === 'object' && hat.svg) {
      return <g dangerouslySetInnerHTML={{ __html: hat.svg }} />
    }
    return null
  }

  // Render custom costume SVG if provided
  const renderCustomCostume = (layer) => {
    if (costume && typeof costume === 'object' && costume.svg) {
      // Check if costume should render on this layer (behind or front)
      // For now, render all custom costumes in front
      if (layer === 'front') {
        return <g dangerouslySetInnerHTML={{ __html: costume.svg }} />
      }
    }
    return null
  }

  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      <div className={`relative w-full h-full transition-transform duration-300 ${
        bounce ? 'animate-bounce' : ''
      } ${isDancing ? 'dancing-bobo' : ''}`}>
        {/* Robot Body */}
        <svg viewBox="0 0 100 140" className="w-full h-full drop-shadow-lg">
          {/* Body - rounded rectangle */}
          <rect 
            x="20" 
            y="50" 
            width="60" 
            height="70" 
            rx="8" 
            fill={color || "var(--color-accent)"} 
            opacity="0.9"
          />
          
          {/* Body panel lines */}
          <line x1="30" y1="70" x2="70" y2="70" stroke="var(--color-background)" strokeWidth="1" opacity="0.3" />
          <line x1="30" y1="85" x2="70" y2="85" stroke="var(--color-background)" strokeWidth="1" opacity="0.3" />
          
          {/* Head - rounded square with rotation */}
          <g transform={`rotate(${headRotation} 50 35)`}>
            <rect 
              x="25" 
              y="15" 
              width="50" 
              height="40" 
              rx="6" 
              fill={color || "var(--color-accent)"} 
              opacity="0.95"
            />
          
          {/* Eyes and Mouth - built-in emotions */}
          <>
              <g className={`transition-all duration-150 ${blink ? 'opacity-0' : 'opacity-100'}`}>
                {isCelebratingEyes ? (
                  // Celebrating ^^ eyes (happy/celebrating)
                  <>
                    <path d="M 34 32 Q 40 28 46 32" stroke="#000000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M 54 32 Q 60 28 66 32" stroke="#000000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  </>
                ) : (
                  // Default excited eyes (circles) - used for "excited" and default
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
            </>
          </g>
          
          {/* Antenna - hide if wearing hat */}
          {!hat && (
            <>
              <line 
                x1="50" 
                y1="15" 
                x2="50" 
                y2="8" 
                stroke={color || "var(--color-accent)"} 
                strokeWidth="2"
              />
              <circle 
                cx="50" 
                cy="6" 
                r="3" 
                fill={color || "var(--color-accent)"} 
                className="animate-pulse"
              />
            </>
          )}
          
          {/* Hat - custom or built-in */}
          {hat && (typeof hat === 'object' && hat.svg ? renderCustomHat() : renderHat(hat))}
          
          {/* Costume (behind layer) - custom or built-in */}
          {costume && (typeof costume === 'object' && costume.svg ? renderCustomCostume('behind') : renderCostume(costume, 'behind'))}
          
          {/* Arms - animated when dancing */}
          <g transform={`rotate(${isDancing ? Math.sin(armRotation * Math.PI / 180) * 20 : 0} 14 60)`}>
            <rect 
              x="10" 
              y="60" 
              width="8" 
              height="25" 
              rx="4" 
              fill={color || "var(--color-accent)"} 
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
              fill={color || "var(--color-accent)"} 
              opacity="0.8"
            />
          </g>
          
          {/* Hands/Grippers with movement */}
          <circle 
            cx={14 + Math.sin(handRotation * Math.PI / 180) * 2} 
            cy={88 + Math.cos(handRotation * Math.PI / 180) * 2} 
            r="4" 
            fill={color || "var(--color-accent)"} 
            opacity="0.9" 
          />
          <circle 
            cx={86 - Math.sin(handRotation * Math.PI / 180) * 2} 
            cy={88 + Math.cos(handRotation * Math.PI / 180) * 2} 
            r="4" 
            fill={color || "var(--color-accent)"} 
            opacity="0.9" 
          />
          
          {/* Costume (front layer) - custom or built-in */}
          {costume && (typeof costume === 'object' && costume.svg ? renderCustomCostume('front') : renderCostume(costume, 'front'))}
          
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
        /* Dynamic dance animation from database */
        ${isDancing && typeof dance === 'object' && dance?.keyframes ? `
          @keyframes customDance {
            ${Object.entries(dance.keyframes).map(([key, value]) => `
              ${key} { ${value} }
            `).join('')}
          }
          .dancing-bobo {
            animation: customDance ${dance.duration || 800}ms ${dance.timing || 'ease-in-out'} infinite;
          }
        ` : `
          /* Default wiggle animation */
          @keyframes wiggle {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-5deg); }
            75% { transform: rotate(5deg); }
          }
          .dancing-bobo {
            animation: wiggle 600ms ease-in-out infinite;
          }
        `}
      `}</style>
    </div>
  )
}
