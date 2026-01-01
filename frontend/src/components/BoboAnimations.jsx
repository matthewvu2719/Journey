import React, { useState, useEffect, useRef } from 'react';
import RobotMascot from './RobotMascot';

const BoboAnimations = ({ 
  size = 'lg',
  emotion = 'friendly',
  animate = true,
  context = 'idle', // 'idle', 'slide-in', 'problem-solving', 'celebrating', 'thinking', 'helping'
  particleTrail = false,
  glowEffect = false,
  soundEnabled = false,
  className = '',
  ...props 
}) => {
  const [animationState, setAnimationState] = useState('idle');
  const [particles, setParticles] = useState([]);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [soundPlaying, setSoundPlaying] = useState(null);
  const containerRef = useRef(null);
  const particleIdRef = useRef(0);

  // Context-aware animation mapping
  const contextAnimations = {
    'idle': {
      dance: false,
      emotion: 'friendly',
      glow: false,
      particles: false,
      sound: null
    },
    'slide-in': {
      dance: {
        movements: {
          arms: { speed: 60, amplitude: 15, pattern: 'wave' },
          head: { speed: 80, amplitude: 3, pattern: 'bob' },
          hands: { speed: 70, amplitude: 10, pattern: 'wiggle' }
        }
      },
      emotion: 'excited',
      glow: true,
      particles: true,
      sound: 'slide'
    },
    'problem-solving': {
      dance: {
        movements: {
          arms: { speed: 100, amplitude: 8, pattern: 'pump' },
          head: { speed: 120, amplitude: 2, pattern: 'nod' },
          hands: { speed: 90, amplitude: 5, pattern: 'point' }
        }
      },
      emotion: 'focused',
      glow: true,
      particles: false,
      sound: 'thinking'
    },
    'celebrating': {
      dance: {
        movements: {
          arms: { speed: 40, amplitude: 30, pattern: 'swing' },
          head: { speed: 60, amplitude: 8, pattern: 'bob' },
          hands: { speed: 50, amplitude: 20, pattern: 'clap' }
        }
      },
      emotion: 'celebrating',
      glow: true,
      particles: true,
      sound: 'celebration'
    },
    'thinking': {
      dance: {
        movements: {
          arms: { speed: 150, amplitude: 5, pattern: 'still' },
          head: { speed: 200, amplitude: 3, pattern: 'tilt' },
          hands: { speed: 180, amplitude: 3, pattern: 'wiggle' }
        }
      },
      emotion: 'focused',
      glow: true,
      particles: false,
      sound: null
    },
    'helping': {
      dance: {
        movements: {
          arms: { speed: 80, amplitude: 12, pattern: 'wave' },
          head: { speed: 100, amplitude: 4, pattern: 'nod' },
          hands: { speed: 90, amplitude: 8, pattern: 'point' }
        }
      },
      emotion: 'friendly',
      glow: false,
      particles: false,
      sound: 'helper'
    }
  };

  // Update animation state based on context
  useEffect(() => {
    if (context && contextAnimations[context]) {
      setAnimationState(context);
    }
  }, [context]);

  // Particle system
  useEffect(() => {
    if (!particleTrail && !contextAnimations[animationState]?.particles) return;

    const createParticle = () => {
      const particle = {
        id: particleIdRef.current++,
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        size: 2 + Math.random() * 4,
        color: `hsl(${Math.random() * 60 + 280}, 70%, 60%)` // Purple-pink range
      };
      return particle;
    };

    const updateParticles = () => {
      setParticles(prev => {
        const updated = prev
          .map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            life: particle.life - particle.decay,
            vy: particle.vy + 0.05 // Gravity effect
          }))
          .filter(particle => particle.life > 0 && particle.y < 120);

        // Add new particles
        if (updated.length < 15 && Math.random() < 0.3) {
          updated.push(createParticle());
        }

        return updated;
      });
    };

    const particleInterval = setInterval(updateParticles, 50);
    return () => clearInterval(particleInterval);
  }, [particleTrail, animationState]);

  // Glow effect
  useEffect(() => {
    if (!glowEffect && !contextAnimations[animationState]?.glow) {
      setGlowIntensity(0);
      return;
    }

    let glowDirection = 1;
    const updateGlow = () => {
      setGlowIntensity(prev => {
        const newIntensity = prev + (glowDirection * 0.05);
        if (newIntensity >= 1) glowDirection = -1;
        if (newIntensity <= 0.3) glowDirection = 1;
        return Math.max(0.3, Math.min(1, newIntensity));
      });
    };

    const glowInterval = setInterval(updateGlow, 100);
    return () => clearInterval(glowInterval);
  }, [glowEffect, animationState]);

  // Sound effects (placeholder - would integrate with actual audio system)
  useEffect(() => {
    if (!soundEnabled) return;

    const currentAnimation = contextAnimations[animationState];
    if (currentAnimation?.sound && currentAnimation.sound !== soundPlaying) {
      setSoundPlaying(currentAnimation.sound);
      
      // Simulate sound playing (in real implementation, would play actual audio)
      console.log(`🔊 Playing sound: ${currentAnimation.sound}`);
      
      // Reset sound state after duration
      setTimeout(() => setSoundPlaying(null), 2000);
    }
  }, [soundEnabled, animationState, soundPlaying]);

  // Get current animation configuration
  const currentConfig = contextAnimations[animationState] || contextAnimations.idle;

  // Slide-in animation styles
  const getSlideInStyles = () => {
    if (animationState === 'slide-in') {
      return {
        animation: 'slideInFromRight 0.8s ease-out forwards',
        transform: 'translateX(100%)'
      };
    }
    return {};
  };

  // Problem-solving pulse effect
  const getProblemSolvingStyles = () => {
    if (animationState === 'problem-solving') {
      return {
        animation: 'problemSolvingPulse 1.5s ease-in-out infinite'
      };
    }
    return {};
  };

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        ...getSlideInStyles(),
        ...getProblemSolvingStyles()
      }}
    >
      {/* Glow Effect */}
      {(glowEffect || currentConfig.glow) && (
        <div 
          className="absolute inset-0 rounded-full blur-xl pointer-events-none"
          style={{
            background: `radial-gradient(circle, rgba(139, 92, 246, ${glowIntensity * 0.4}) 0%, transparent 70%)`,
            transform: 'scale(1.5)',
            zIndex: -1
          }}
        />
      )}

      {/* Particle Trail */}
      {(particleTrail || currentConfig.particles) && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map(particle => (
            <div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                opacity: particle.life,
                transform: `scale(${particle.life})`,
                transition: 'all 0.05s linear'
              }}
            />
          ))}
        </div>
      )}

      {/* Enhanced Robot Mascot */}
      <div className="relative z-10">
        <RobotMascot
          size={size}
          emotion={currentConfig.emotion}
          animate={animate}
          dance={currentConfig.dance}
          {...props}
        />
      </div>

      {/* Context-specific overlays */}
      {animationState === 'thinking' && (
        <div className="absolute -top-2 -right-2 z-20">
          <div className="thinking-bubbles">
            <div className="bubble bubble-1">💭</div>
            <div className="bubble bubble-2">🤔</div>
            <div className="bubble bubble-3">💡</div>
          </div>
        </div>
      )}

      {animationState === 'celebrating' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="celebration-confetti">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  left: `${20 + i * 10}%`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Enhanced CSS Animations */}
      <style jsx>{`
        @keyframes slideInFromRight {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          60% {
            transform: translateX(-5%);
            opacity: 1;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes problemSolvingPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .thinking-bubbles {
          position: relative;
        }

        .bubble {
          position: absolute;
          font-size: 1.2rem;
          animation: bubbleFloat 2s ease-in-out infinite;
        }

        .bubble-1 {
          top: 0;
          right: 0;
          animation-delay: 0s;
        }

        .bubble-2 {
          top: -10px;
          right: 15px;
          animation-delay: 0.5s;
        }

        .bubble-3 {
          top: -20px;
          right: 30px;
          animation-delay: 1s;
        }

        @keyframes bubbleFloat {
          0%, 100% {
            transform: translateY(0) scale(0.8);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-10px) scale(1);
            opacity: 1;
          }
        }

        .celebration-confetti {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
        }

        .confetti-piece {
          position: absolute;
          width: 8px;
          height: 8px;
          background: linear-gradient(45deg, #ff6b9d, #c44569, #f8b500, #40739e);
          animation: confettiFall 3s linear infinite;
        }

        @keyframes confettiFall {
          0% {
            transform: translateY(-100%) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(200%) rotate(360deg);
            opacity: 0;
          }
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .thinking-bubbles .bubble {
            font-size: 1rem;
          }
          
          .confetti-piece {
            width: 6px;
            height: 6px;
          }
          
          @keyframes slideInFromRight {
            0% {
              transform: translateX(50%);
              opacity: 0;
            }
            100% {
              transform: translateX(0);
              opacity: 1;
            }
          }
        }

        /* Reduced motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .bubble,
          .confetti-piece {
            animation: none;
          }
          
          @keyframes slideInFromRight {
            0% {
              opacity: 0;
            }
            100% {
              opacity: 1;
            }
          }
          
          @keyframes problemSolvingPulse {
            0%, 100% {
              transform: scale(1);
            }
          }
        }
      `}</style>
    </div>
  );
};

export default BoboAnimations;