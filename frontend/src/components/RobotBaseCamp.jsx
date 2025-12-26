import { useState, useEffect } from 'react'
import RobotMascot from './RobotMascot'
import { useBobo } from '../contexts/BoboContext'

export default function RobotBaseCamp({ 
  navigation = [], 
  onNavigate = () => {}, 
  className = '',
  showBobo = true,
  boboEmotion = 'sparkly_happy'
}) {
  const [animationPhase, setAnimationPhase] = useState(0)
  const { getEquippedItems } = useBobo()
  const equippedItems = getEquippedItems()

  // Cycle through animation phases
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`relative w-full min-h-screen overflow-hidden ${className}`}>
      {/* Main SVG Base Camp */}
      <svg 
        viewBox="0 0 1200 800" 
        className="absolute inset-0 w-full h-full"
        style={{ minHeight: '100vh' }}
      >
        {/* Definitions for gradients and filters */}
        <defs>
          {/* Theme-based gradients */}
          <linearGradient id="baseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-background-darker)" />
            <stop offset="50%" stopColor="var(--color-background)" />
            <stop offset="100%" stopColor="var(--color-background-darker)" />
          </linearGradient>
          
          <linearGradient id="panelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-glass)" />
            <stop offset="100%" stopColor="var(--color-border)" />
          </linearGradient>
          
          <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.8" />
            <stop offset="50%" stopColor="var(--color-accent-hover)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.8" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Pulse animation */}
          <filter id="pulse">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background Base Structure */}
        <rect width="1200" height="800" fill="url(#baseGradient)" />
        
        {/* Grid Pattern Background */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-border)" strokeWidth="0.5" opacity="0.3"/>
        </pattern>
        <rect width="1200" height="800" fill="url(#grid)" />

        {/* Main Base Platform */}
        <g id="basePlatform">
          {/* Platform Base */}
          <ellipse cx="600" cy="700" rx="500" ry="80" fill="var(--color-background-darker)" opacity="0.8" />
          <ellipse cx="600" cy="695" rx="480" ry="75" fill="url(#panelGradient)" />
          
          {/* Platform Details */}
          <rect x="200" y="680" width="800" height="40" rx="20" fill="var(--color-glass)" opacity="0.6" />
          <rect x="220" y="685" width="760" height="30" rx="15" fill="var(--color-border)" opacity="0.4" />
          
          {/* Platform Lights */}
          <circle cx="250" cy="700" r="8" fill="var(--color-accent)" opacity="0.8" filter="url(#glow)">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="350" cy="700" r="8" fill="var(--color-accent)" opacity="0.6" filter="url(#glow)">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="850" cy="700" r="8" fill="var(--color-accent)" opacity="0.7" filter="url(#glow)">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="950" cy="700" r="8" fill="var(--color-accent)" opacity="0.9" filter="url(#glow)">
            <animate attributeName="opacity" values="0.9;1;0.9" dur="2.2s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Central Command Tower */}
        <g id="commandTower">
          {/* Tower Base */}
          <rect x="550" y="500" width="100" height="200" rx="10" fill="var(--color-background-darker)" opacity="0.9" />
          <rect x="555" y="505" width="90" height="190" rx="8" fill="url(#panelGradient)" />
          
          {/* Tower Top */}
          <polygon points="575,500 625,500 640,480 560,480" fill="var(--color-glass)" opacity="0.8" />
          <rect x="570" y="480" width="60" height="25" rx="5" fill="var(--color-border)" opacity="0.6" />
          
          {/* Communication Array */}
          <line x1="600" y1="480" x2="600" y2="450" stroke="var(--color-accent)" strokeWidth="3" />
          <circle cx="600" cy="450" r="8" fill="var(--color-accent)" filter="url(#pulse)">
            <animate attributeName="r" values="8;12;8" dur="3s" repeatCount="indefinite" />
          </circle>
          
          {/* Tower Windows */}
          <rect x="570" y="520" width="15" height="20" rx="2" fill="var(--color-accent)" opacity="0.6" />
          <rect x="615" y="520" width="15" height="20" rx="2" fill="var(--color-accent)" opacity="0.8" />
          <rect x="570" y="560" width="15" height="20" rx="2" fill="var(--color-accent)" opacity="0.7" />
          <rect x="615" y="560" width="15" height="20" rx="2" fill="var(--color-accent)" opacity="0.5" />
        </g>

        {/* Left Side Structures */}
        <g id="leftStructures">
          {/* Storage Pods */}
          <ellipse cx="200" cy="600" rx="60" ry="40" fill="var(--color-background-darker)" opacity="0.8" />
          <ellipse cx="200" cy="595" rx="55" ry="35" fill="url(#panelGradient)" />
          <rect x="180" y="580" width="40" height="8" rx="4" fill="var(--color-accent)" opacity="0.6" />
          
          <ellipse cx="150" cy="650" rx="45" ry="30" fill="var(--color-background-darker)" opacity="0.8" />
          <ellipse cx="150" cy="647" rx="40" ry="27" fill="url(#panelGradient)" />
          
          {/* Energy Conduits */}
          <path d="M 260 600 Q 300 580 350 590 Q 400 600 450 580" 
                stroke="url(#energyGradient)" strokeWidth="4" fill="none" opacity="0.8">
            <animate attributeName="stroke-dasharray" values="0,100;50,50;100,0" dur="4s" repeatCount="indefinite" />
          </path>
        </g>

        {/* Right Side Structures */}
        <g id="rightStructures">
          {/* Research Lab */}
          <rect x="900" y="550" width="120" height="150" rx="15" fill="var(--color-background-darker)" opacity="0.9" />
          <rect x="905" y="555" width="110" height="140" rx="12" fill="url(#panelGradient)" />
          
          {/* Lab Windows */}
          <rect x="920" y="570" width="25" height="30" rx="3" fill="var(--color-accent)" opacity="0.4" />
          <rect x="955" y="570" width="25" height="30" rx="3" fill="var(--color-accent)" opacity="0.6" />
          <rect x="990" y="570" width="25" height="30" rx="3" fill="var(--color-accent)" opacity="0.5" />
          
          {/* Lab Equipment */}
          <circle cx="960" cy="630" r="20" fill="var(--color-glass)" opacity="0.7" />
          <circle cx="960" cy="630" r="15" fill="var(--color-accent)" opacity="0.3">
            <animateTransform attributeName="transform" type="rotate" values="0 960 630;360 960 630" dur="8s" repeatCount="indefinite" />
          </circle>
          
          {/* Antenna Array */}
          <line x1="1050" y1="550" x2="1080" y2="520" stroke="var(--color-accent)" strokeWidth="2" />
          <line x1="1050" y1="550" x2="1070" y2="510" stroke="var(--color-accent)" strokeWidth="2" />
          <line x1="1050" y1="550" x2="1090" y2="530" stroke="var(--color-accent)" strokeWidth="2" />
        </g>

        {/* Navigation Panel Area */}
        <g id="navigationPanel">
          {/* Main Nav Panel */}
          <rect x="100" y="100" width="1000" height="80" rx="40" fill="var(--color-glass)" opacity="0.8" />
          <rect x="105" y="105" width="990" height="70" rx="35" fill="url(#panelGradient)" />
          
          {/* Nav Panel Lights */}
          <circle cx="150" cy="140" r="6" fill="var(--color-accent)" opacity="0.8" />
          <circle cx="180" cy="140" r="6" fill="var(--color-accent)" opacity="0.6" />
          <circle cx="210" cy="140" r="6" fill="var(--color-accent)" opacity="0.7" />
          
          {/* Status Indicators */}
          <rect x="1000" y="125" width="80" height="30" rx="15" fill="var(--color-background-darker)" opacity="0.8" />
          <circle cx="1020" cy="140" r="8" fill="var(--color-accent)" filter="url(#glow)">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="1060" cy="140" r="8" fill="var(--color-accent)" opacity="0.8" />
        </g>

        {/* Floating Energy Orbs */}
        <g id="energyOrbs">
          <circle cx="300" cy="300" r="12" fill="var(--color-accent)" opacity="0.6" filter="url(#glow)">
            <animateTransform attributeName="transform" type="translate" values="0,0;20,-10;0,0" dur="6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
          </circle>
          
          <circle cx="800" cy="250" r="8" fill="var(--color-accent)" opacity="0.4" filter="url(#glow)">
            <animateTransform attributeName="transform" type="translate" values="0,0;-15,15;0,0" dur="8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4s" repeatCount="indefinite" />
          </circle>
          
          <circle cx="1000" cy="350" r="10" fill="var(--color-accent)" opacity="0.5" filter="url(#glow)">
            <animateTransform attributeName="transform" type="translate" values="0,0;10,20;0,0" dur="7s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.9;0.5" dur="3.5s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Holographic Display Areas */}
        <g id="holoDisplays">
          {/* Left Display */}
          <rect x="80" y="300" width="150" height="100" rx="10" fill="var(--color-accent)" opacity="0.1" />
          <rect x="85" y="305" width="140" height="90" rx="8" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.6">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="4s" repeatCount="indefinite" />
          </rect>
          
          {/* Right Display */}
          <rect x="970" y="300" width="150" height="100" rx="10" fill="var(--color-accent)" opacity="0.1" />
          <rect x="975" y="305" width="140" height="90" rx="8" fill="none" stroke="var(--color-accent)" strokeWidth="1" opacity="0.6">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
          </rect>
        </g>

        {/* Atmospheric Effects */}
        <g id="atmosphere">
          {/* Floating Particles */}
          <circle cx="400" cy="200" r="2" fill="var(--color-accent)" opacity="0.3">
            <animateTransform attributeName="transform" type="translate" values="0,0;50,-30;100,0" dur="15s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="5s" repeatCount="indefinite" />
          </circle>
          
          <circle cx="700" cy="180" r="1.5" fill="var(--color-accent)" opacity="0.4">
            <animateTransform attributeName="transform" type="translate" values="0,0;-40,20;-80,0" dur="12s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.7;0.4" dur="4s" repeatCount="indefinite" />
          </circle>
          
          <circle cx="500" cy="150" r="1" fill="var(--color-accent)" opacity="0.5">
            <animateTransform attributeName="transform" type="translate" values="0,0;30,40;60,0" dur="10s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.9;0.5" dur="3s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>

      {/* Navigation Overlay */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center gap-6 px-8 py-4 bg-[var(--color-glass)] backdrop-blur-xl rounded-full border border-[var(--color-border)]">
          {navigation.map((item, index) => (
            <button
              key={index}
              onClick={() => onNavigate(item)}
              className="px-4 py-2 text-[var(--color-foreground)] hover:text-[var(--color-accent)] transition-colors duration-300 font-medium"
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bobo Idle Area */}
      {showBobo && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10">
          <div className="relative">
            {/* Bobo Platform */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-[var(--color-glass)] rounded-full blur-sm opacity-60" />
            
            {/* Bobo Character */}
            <RobotMascot 
              size="lg" 
              emotion={boboEmotion}
              color={equippedItems.color?.svg_data || null}
              hat={equippedItems.hat ? { svg: equippedItems.hat.svg_data } : null}
              costume={equippedItems.costume ? { svg: equippedItems.costume.svg_data } : null}
              dance={equippedItems.dance?.animation_data || false}
              animate={true} 
            />
          </div>
        </div>
      )}

      {/* Status Display */}
      <div className="absolute top-6 right-6 z-20">
        <div className="flex items-center gap-3 px-4 py-2 bg-[var(--color-glass)] backdrop-blur-xl rounded-full border border-[var(--color-border)]">
          <div className="w-3 h-3 bg-[var(--color-accent)] rounded-full animate-pulse" />
          <span className="text-sm text-[var(--color-foreground)] font-mono">BASE CAMP ONLINE</span>
        </div>
      </div>

      {/* Theme-based CSS animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 5px var(--color-accent)); }
          50% { filter: brightness(1.2) drop-shadow(0 0 15px var(--color-accent)); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}