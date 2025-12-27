import { useEffect, useRef } from 'react'
import { useBobo } from '../contexts/BoboContext'
import RobotMascot from './RobotMascot'

export default function RobotBaseCamp({ 
  navigation = [], 
  onNavigate = () => {}, 
  onObjectClick = () => {},
  className = '',
  showBobo = true,
  boboEmotion = 'sparkly_happy'
}) {
  const { getEquippedItems } = useBobo()
  const equippedItems = getEquippedItems()
  const boboAIRef = useRef(null)

  // Interactive object functions
  const openHabitsSection = () => {
    console.log('Opening Habits Section - Today\'s Objective')
    onObjectClick('habits')
  }

  const openScheduleSection = () => {
    console.log('Opening Schedule Section - Mission Roadmap')
    onObjectClick('schedule')
  }

  const openCallSection = () => {
    console.log('Opening Call Section - Communication Station')
    onObjectClick('calls')
  }

  const openBoboSection = () => {
    console.log('Opening Bobo Section - Holo-Fit Mirror')
    onObjectClick('bobo')
  }

  const openInsightsSection = () => {
    console.log('Opening Insights Section - Data Core')
    onObjectClick('insights')
  }

  const openBadgesSection = () => {
    console.log('Opening Badges Section - Honor Badges')
    onObjectClick('rewards')
  }

  // Realistic Bobo Behavior System
  useEffect(() => {
    class BoboAI {
      constructor() {
        this.bobo = document.getElementById('boboCharacter');
        
        if (!this.bobo) return;
        
        this.currentX = 650;
        this.currentY = 650;
        this.isWalking = false;
        this.isIdling = true;
        
        // Ground-based positions for wasteland exploration
        this.positions = [
          { x: 250, y: 650 },
          { x: 400, y: 650 },
          { x: 550, y: 650 },
          { x: 700, y: 650 },
          { x: 850, y: 650 },
          { x: 350, y: 680 },
          { x: 500, y: 680 },
          { x: 650, y: 680 },
          { x: 800, y: 680 }
        ];
        
        this.startBehavior();
      }
      
      startBehavior() {
        this.scheduleNextAction();
      }
      
      scheduleNextAction() {
        if (this.isWalking) return;
        
        // Random idle time between 3-8 seconds
        const idleTime = Math.random() * 5000 + 3000;
        
        setTimeout(() => {
          if (Math.random() > 0.3) { // 70% chance to walk
            this.startWalking();
          } else {
            this.scheduleNextAction(); // Continue idling
          }
        }, idleTime);
      }
      
      startWalking() {
        if (this.isWalking || !this.bobo) return;
        
        this.isWalking = true;
        this.isIdling = false;
        
        // Choose random destination
        const availablePositions = this.positions.filter(pos => 
          Math.abs(pos.x - this.currentX) > 50 || Math.abs(pos.y - this.currentY) > 20
        );
        
        if (availablePositions.length === 0) {
          this.isWalking = false;
          this.isIdling = true;
          this.scheduleNextAction();
          return;
        }
        
        const destination = availablePositions[Math.floor(Math.random() * availablePositions.length)];
        const distance = Math.sqrt(Math.pow(destination.x - this.currentX, 2) + Math.pow(destination.y - this.currentY, 2));
        const walkTime = (distance / 100) * 1000; // Adjust speed
        
        // Move to destination using CSS transform
        this.bobo.style.transition = `left ${walkTime}ms linear, top ${walkTime}ms linear`;
        this.bobo.style.left = `${destination.x}px`;
        this.bobo.style.top = `${destination.y}px`;
        
        this.currentX = destination.x;
        this.currentY = destination.y;
        
        // Stop walking after reaching destination
        setTimeout(() => {
          this.isWalking = false;
          this.isIdling = true;
          this.scheduleNextAction();
        }, walkTime);
      }
    }
    
    // Initialize Bobo AI with a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      boboAIRef.current = new BoboAI();
    }, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, [])

  // Add hover effect styles for interactive objects
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .interactive-object {
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .interactive-object:hover {
        filter: brightness(1.2) drop-shadow(0 0 20px var(--color-accent));
      }
      
      .object-label {
        font-family: 'Segoe UI', monospace;
        font-size: 14px;
        font-weight: bold;
        fill: var(--color-accent);
        text-anchor: middle;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .object-label.theme-text {
        fill: var(--color-accent) !important;
      }
      
      .interactive-object:hover .object-label {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [])

  return (
    <div className={`relative w-full min-h-screen overflow-hidden ${className}`}>
      {/* Post-Apocalyptic Wasteland Base Camp SVG */}
      <svg 
        viewBox="0 0 1200 800" 
        className="absolute inset-0 w-full h-full"
        style={{ minHeight: '100vh' }}
      >
        {/* Definitions for gradients and filters */}
        <defs>
          {/* Themed Sky Gradient */}
          <linearGradient id="wastelandSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-background-darker)" />
            <stop offset="30%" stopColor="var(--color-background)" />
            <stop offset="70%" stopColor="var(--color-accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity="0.1" />
          </linearGradient>
          
          {/* Ground Gradient */}
          <linearGradient id="wastelandGround" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-background)" />
            <stop offset="50%" stopColor="var(--color-background-darker)" />
            <stop offset="100%" stopColor="var(--color-background)" stopOpacity="0.8" />
          </linearGradient>
          
          {/* Walker Body Gradient */}
          <linearGradient id="walkerMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A4A4A" />
            <stop offset="30%" stopColor="#6B6B6B" />
            <stop offset="70%" stopColor="#5A5A5A" />
            <stop offset="100%" stopColor="#3A3A3A" />
          </linearGradient>
          
          {/* Rust Effect */}
          <linearGradient id="rustEffect" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B4513" />
            <stop offset="50%" stopColor="#CD853F" />
            <stop offset="100%" stopColor="#A0522D" />
          </linearGradient>
          
          {/* Interactive Object Glows */}
          <filter id="wastelandGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Dust Pattern */}
          <pattern id="dustPattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1" fill="var(--color-accent)" opacity="0.2"/>
            <circle cx="5" cy="15" r="0.5" fill="var(--color-foreground)" opacity="0.3"/>
            <circle cx="15" cy="5" r="0.8" fill="var(--color-accent)" opacity="0.1"/>
          </pattern>
          
          {/* Object-specific gradients */}
          <linearGradient id="terminalGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FF41" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#32CD32" stopOpacity="1" />
            <stop offset="100%" stopColor="#00FF41" stopOpacity="0.8" />
          </linearGradient>
          
          <linearGradient id="radioGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FF8E53" stopOpacity="1" />
            <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.8" />
          </linearGradient>
          
          <linearGradient id="dataGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00BFFF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#1E90FF" stopOpacity="1" />
            <stop offset="100%" stopColor="#00BFFF" stopOpacity="0.8" />
          </linearGradient>
          
          <linearGradient id="workbenchGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FFA500" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0.8" />
          </linearGradient>
          
          <linearGradient id="commGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9370DB" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#BA55D3" stopOpacity="1" />
            <stop offset="100%" stopColor="#9370DB" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Wasteland Sky Background */}
        <rect width="1200" height="500" fill="url(#wastelandSky)" />
        
        {/* Celestial Elements - Stars, Planets, and Atmospheric Effects */}
        <g id="celestialElements">
          {/* Distant Stars */}
          <g id="stars" opacity="0.8">
            <circle cx="100" cy="80" r="1" fill="var(--color-foreground)" opacity="0.9">
              <animate attributeName="opacity" values="0.9;0.4;0.9" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="250" cy="120" r="0.8" fill="var(--color-accent)" opacity="0.7">
              <animate attributeName="opacity" values="0.7;0.3;0.7" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="400" cy="60" r="1.2" fill="var(--color-foreground)" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.5;0.8" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="550" cy="140" r="0.9" fill="var(--color-accent)" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="700" cy="90" r="1.1" fill="var(--color-foreground)" opacity="0.9">
              <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="850" cy="110" r="0.7" fill="var(--color-accent)" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.1;0.5" dur="4.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="1000" cy="70" r="1.3" fill="var(--color-foreground)" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.3;0.8" dur="3.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="1150" cy="130" r="0.8" fill="var(--color-accent)" opacity="0.7">
              <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.9s" repeatCount="indefinite" />
            </circle>
            
            {/* Additional smaller stars */}
            <circle cx="180" cy="50" r="0.5" fill="var(--color-foreground)" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.1;0.6" dur="5s" repeatCount="indefinite" />
            </circle>
            <circle cx="320" cy="160" r="0.6" fill="var(--color-accent)" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="480" cy="40" r="0.4" fill="var(--color-foreground)" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.9;0.5" dur="4.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="620" cy="170" r="0.7" fill="var(--color-accent)" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3.3s" repeatCount="indefinite" />
            </circle>
            <circle cx="780" cy="45" r="0.5" fill="var(--color-foreground)" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2.7s" repeatCount="indefinite" />
            </circle>
            <circle cx="920" cy="155" r="0.6" fill="var(--color-accent)" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.1;0.6" dur="4.1s" repeatCount="indefinite" />
            </circle>
            <circle cx="1080" cy="35" r="0.4" fill="var(--color-foreground)" opacity="0.7">
              <animate attributeName="opacity" values="0.7;0.3;0.7" dur="3.6s" repeatCount="indefinite" />
            </circle>
          </g>
          
          {/* Distant Planets */}
          <g id="planets" opacity="0.6">
            {/* Large distant planet */}
            <circle cx="150" cy="150" r="25" fill="var(--color-background-darker)" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.6;0.4" dur="8s" repeatCount="indefinite" />
            </circle>
            <circle cx="145" cy="145" r="20" fill="var(--color-accent)" opacity="0.3" />
            
            {/* Medium planet */}
            <circle cx="950" cy="100" r="15" fill="var(--color-background)" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.7;0.5" dur="6s" repeatCount="indefinite" />
            </circle>
            <circle cx="948" cy="98" r="12" fill="var(--color-accent)" opacity="0.3" />
            
            {/* Small distant planet */}
            <circle cx="1100" cy="180" r="8" fill="var(--color-foreground)" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.5;0.3" dur="10s" repeatCount="indefinite" />
            </circle>
          </g>
          
          {/* Floating Atmospheric Particles */}
          <g id="floatingParticles">
            {/* Large floating particles */}
            <circle cx="200" cy="200" r="3" fill="var(--color-accent)" opacity="0.4">
              <animateTransform attributeName="transform" type="translate" values="0,0;50,-30;100,-60" dur="25s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.8;0.1;0.4" dur="25s" repeatCount="indefinite" />
            </circle>
            <circle cx="400" cy="180" r="2.5" fill="var(--color-foreground)" opacity="0.5">
              <animateTransform attributeName="transform" type="translate" values="0,0;-40,-25;-80,-50" dur="20s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.9;0.2;0.5" dur="20s" repeatCount="indefinite" />
            </circle>
            <circle cx="600" cy="220" r="4" fill="var(--color-accent)" opacity="0.3">
              <animateTransform attributeName="transform" type="translate" values="0,0;30,-40;60,-80" dur="30s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.7;0.1;0.3" dur="30s" repeatCount="indefinite" />
            </circle>
            <circle cx="800" cy="160" r="2" fill="var(--color-foreground)" opacity="0.6">
              <animateTransform attributeName="transform" type="translate" values="0,0;-60,-20;-120,-40" dur="18s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;1;0.2;0.6" dur="18s" repeatCount="indefinite" />
            </circle>
            <circle cx="1000" cy="240" r="3.5" fill="var(--color-accent)" opacity="0.4">
              <animateTransform attributeName="transform" type="translate" values="0,0;45,-35;90,-70" dur="28s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.8;0.1;0.4" dur="28s" repeatCount="indefinite" />
            </circle>
            
            {/* Medium floating particles */}
            <circle cx="150" cy="300" r="1.5" fill="#A68B5B" opacity="0.5">
              <animateTransform attributeName="transform" type="translate" values="0,0;70,-15;140,-30" dur="22s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.9;0.1;0.5" dur="22s" repeatCount="indefinite" />
            </circle>
            <circle cx="350" cy="280" r="2" fill="#8B7355" opacity="0.4">
              <animateTransform attributeName="transform" type="translate" values="0,0;-35,-25;-70,-50" dur="24s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.8;0.1;0.4" dur="24s" repeatCount="indefinite" />
            </circle>
            <circle cx="550" cy="320" r="1.8" fill="#A68B5B" opacity="0.6">
              <animateTransform attributeName="transform" type="translate" values="0,0;25,-30;50,-60" dur="26s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;1;0.2;0.6" dur="26s" repeatCount="indefinite" />
            </circle>
            <circle cx="750" cy="290" r="1.2" fill="#8B7355" opacity="0.3">
              <animateTransform attributeName="transform" type="translate" values="0,0;-50,-20;-100,-40" dur="21s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.7;0.1;0.3" dur="21s" repeatCount="indefinite" />
            </circle>
            <circle cx="950" cy="310" r="2.2" fill="#A68B5B" opacity="0.5">
              <animateTransform attributeName="transform" type="translate" values="0,0;40,-28;80,-56" dur="27s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.9;0.1;0.5" dur="27s" repeatCount="indefinite" />
            </circle>
            
            {/* Small floating particles */}
            <circle cx="80" cy="250" r="1" fill="#F4E4BC" opacity="0.4">
              <animateTransform attributeName="transform" type="translate" values="0,0;90,-10;180,-20" dur="35s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.8;0.1;0.4" dur="35s" repeatCount="indefinite" />
            </circle>
            <circle cx="280" cy="350" r="0.8" fill="#D4AF37" opacity="0.6">
              <animateTransform attributeName="transform" type="translate" values="0,0;-25,-35;-50,-70" dur="19s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;1;0.2;0.6" dur="19s" repeatCount="indefinite" />
            </circle>
            <circle cx="480" cy="270" r="1.3" fill="#F4E4BC" opacity="0.3">
              <animateTransform attributeName="transform" type="translate" values="0,0;55,-22;110,-44" dur="32s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.7;0.1;0.3" dur="32s" repeatCount="indefinite" />
            </circle>
            <circle cx="680" cy="330" r="0.9" fill="#D4AF37" opacity="0.5">
              <animateTransform attributeName="transform" type="translate" values="0,0;-40,-18;-80,-36" dur="23s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.9;0.1;0.5" dur="23s" repeatCount="indefinite" />
            </circle>
            <circle cx="880" cy="260" r="1.1" fill="#F4E4BC" opacity="0.4">
              <animateTransform attributeName="transform" type="translate" values="0,0;35,-32;70,-64" dur="29s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.8;0.1;0.4" dur="29s" repeatCount="indefinite" />
            </circle>
            <circle cx="1080" cy="340" r="0.7" fill="#D4AF37" opacity="0.6">
              <animateTransform attributeName="transform" type="translate" values="0,0;-65,-12;-130,-24" dur="33s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;1;0.2;0.6" dur="33s" repeatCount="indefinite" />
            </circle>
          </g>
          
          {/* Atmospheric Light Hues */}
          <g id="atmosphericLights" opacity="0.3">
            {/* Aurora-like light streaks */}
            <ellipse cx="300" cy="100" rx="80" ry="15" fill="#00FFFF" opacity="0.2">
              <animate attributeName="opacity" values="0.2;0.5;0.2" dur="12s" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="rotate" values="0 300 100;10 300 100;0 300 100" dur="15s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="700" cy="80" rx="60" ry="12" fill="#FF69B4" opacity="0.15">
              <animate attributeName="opacity" values="0.15;0.4;0.15" dur="10s" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="rotate" values="0 700 80;-8 700 80;0 700 80" dur="18s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="1000" cy="120" rx="70" ry="18" fill="#32CD32" opacity="0.18">
              <animate attributeName="opacity" values="0.18;0.45;0.18" dur="14s" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="rotate" values="0 1000 120;12 1000 120;0 1000 120" dur="20s" repeatCount="indefinite" />
            </ellipse>
            
            {/* Soft light halos */}
            <circle cx="150" cy="200" r="40" fill="#FFD700" opacity="0.1">
              <animate attributeName="opacity" values="0.1;0.3;0.1" dur="8s" repeatCount="indefinite" />
              <animate attributeName="r" values="40;50;40" dur="8s" repeatCount="indefinite" />
            </circle>
            <circle cx="500" cy="150" r="35" fill="#9370DB" opacity="0.12">
              <animate attributeName="opacity" values="0.12;0.35;0.12" dur="11s" repeatCount="indefinite" />
              <animate attributeName="r" values="35;45;35" dur="11s" repeatCount="indefinite" />
            </circle>
            <circle cx="850" cy="180" r="45" fill="#FF6347" opacity="0.08">
              <animate attributeName="opacity" values="0.08;0.25;0.08" dur="9s" repeatCount="indefinite" />
              <animate attributeName="r" values="45;55;45" dur="9s" repeatCount="indefinite" />
            </circle>
            
            {/* Nebula-like clouds */}
            <ellipse cx="400" cy="250" rx="120" ry="40" fill="#4169E1" opacity="0.05">
              <animate attributeName="opacity" values="0.05;0.2;0.05" dur="16s" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="scale" values="1;1.2;1" dur="20s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="800" cy="300" rx="100" ry="35" fill="#8A2BE2" opacity="0.06">
              <animate attributeName="opacity" values="0.06;0.22;0.06" dur="18s" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="scale" values="1;1.15;1" dur="22s" repeatCount="indefinite" />
            </ellipse>
          </g>
        </g>
        
        {/* Atmospheric Haze */}
        <rect width="1200" height="500" fill="url(#dustPattern)" opacity="0.3" />
        
        {/* Distant Mountains/Ruins with Forest */}
        <g id="distantTerrain" opacity="0.6">
          <polygon points="0,400 200,350 400,380 600,340 800,370 1000,330 1200,360 1200,500 0,500" fill="#6B5B47" />
          <polygon points="100,380 300,330 500,360 700,320 900,350 1100,310 1200,340 1200,500 0,500" fill="#5A4A37" opacity="0.7" />
        </g>
        
        {/* Forest Background */}
        <g id="forestBackground" opacity="0.7">
          {/* Tree Layer 1 - Far Background */}
          <g opacity="0.4">
            {/* Large Background Trees */}
            <ellipse cx="50" cy="420" rx="15" ry="40" fill="#2D4A2D" />
            <ellipse cx="120" cy="400" rx="20" ry="50" fill="#3A5A3A" />
            <ellipse cx="180" cy="430" rx="12" ry="35" fill="#2D4A2D" />
            <ellipse cx="250" cy="410" rx="18" ry="45" fill="#3A5A3A" />
            <ellipse cx="320" cy="440" rx="14" ry="38" fill="#2D4A2D" />
            <ellipse cx="380" cy="420" rx="16" ry="42" fill="#3A5A3A" />
            <ellipse cx="450" cy="400" rx="22" ry="55" fill="#2D4A2D" />
            <ellipse cx="520" cy="435" rx="13" ry="36" fill="#3A5A3A" />
            <ellipse cx="580" cy="415" rx="17" ry="44" fill="#2D4A2D" />
            <ellipse cx="650" cy="425" rx="19" ry="48" fill="#3A5A3A" />
            <ellipse cx="720" cy="405" rx="15" ry="40" fill="#2D4A2D" />
            <ellipse cx="780" cy="440" rx="21" ry="52" fill="#3A5A3A" />
            <ellipse cx="850" cy="420" rx="14" ry="37" fill="#2D4A2D" />
            <ellipse cx="920" cy="410" rx="18" ry="46" fill="#3A5A3A" />
            <ellipse cx="980" cy="430" rx="16" ry="41" fill="#2D4A2D" />
            <ellipse cx="1050" cy="415" rx="20" ry="49" fill="#3A5A3A" />
            <ellipse cx="1120" cy="435" rx="13" ry="34" fill="#2D4A2D" />
            <ellipse cx="1180" cy="425" rx="17" ry="43" fill="#3A5A3A" />
          </g>
          
          {/* Tree Layer 2 - Mid Background */}
          <g opacity="0.6">
            {/* Medium Trees */}
            <ellipse cx="80" cy="450" rx="12" ry="30" fill="#4A6B4A" />
            <ellipse cx="140" cy="460" rx="15" ry="35" fill="#5A7A5A" />
            <ellipse cx="200" cy="445" rx="10" ry="28" fill="#4A6B4A" />
            <ellipse cx="280" cy="470" rx="14" ry="32" fill="#5A7A5A" />
            <ellipse cx="340" cy="455" rx="11" ry="29" fill="#4A6B4A" />
            <ellipse cx="420" cy="465" rx="16" ry="36" fill="#5A7A5A" />
            <ellipse cx="480" cy="450" rx="13" ry="31" fill="#4A6B4A" />
            <ellipse cx="560" cy="475" rx="12" ry="30" fill="#5A7A5A" />
            <ellipse cx="620" cy="460" rx="15" ry="34" fill="#4A6B4A" />
            <ellipse cx="680" cy="445" rx="11" ry="28" fill="#5A7A5A" />
            <ellipse cx="750" cy="470" rx="14" ry="33" fill="#4A6B4A" />
            <ellipse cx="810" cy="455" rx="13" ry="31" fill="#5A7A5A" />
            <ellipse cx="880" cy="465" rx="12" ry="29" fill="#4A6B4A" />
            <ellipse cx="940" cy="450" rx="16" ry="35" fill="#5A7A5A" />
            <ellipse cx="1000" cy="475" rx="10" ry="27" fill="#4A6B4A" />
            <ellipse cx="1080" cy="460" rx="14" ry="32" fill="#5A7A5A" />
            <ellipse cx="1140" cy="445" rx="12" ry="30" fill="#4A6B4A" />
          </g>
          
          {/* Tree Layer 3 - Foreground Trees */}
          <g opacity="0.8">
            {/* Closer, More Detailed Trees */}
            <g transform="translate(60, 480)">
              <ellipse cx="0" cy="0" rx="8" ry="20" fill="#6B8B6B" />
              <rect x="-2" y="15" width="4" height="15" fill="#8B4513" />
            </g>
            <g transform="translate(160, 485)">
              <ellipse cx="0" cy="0" rx="10" ry="25" fill="#7A9A7A" />
              <rect x="-2" y="20" width="4" height="15" fill="#8B4513" />
            </g>
            <g transform="translate(260, 475)">
              <ellipse cx="0" cy="0" rx="7" ry="18" fill="#6B8B6B" />
              <rect x="-1.5" y="13" width="3" height="12" fill="#8B4513" />
            </g>
            <g transform="translate(360, 490)">
              <ellipse cx="0" cy="0" rx="11" ry="28" fill="#7A9A7A" />
              <rect x="-2.5" y="22" width="5" height="18" fill="#8B4513" />
            </g>
            <g transform="translate(460, 480)">
              <ellipse cx="0" cy="0" rx="9" ry="22" fill="#6B8B6B" />
              <rect x="-2" y="17" width="4" height="15" fill="#8B4513" />
            </g>
            <g transform="translate(560, 485)">
              <ellipse cx="0" cy="0" rx="8" ry="20" fill="#7A9A7A" />
              <rect x="-1.5" y="15" width="3" height="12" fill="#8B4513" />
            </g>
            <g transform="translate(660, 475)">
              <ellipse cx="0" cy="0" rx="12" ry="30" fill="#6B8B6B" />
              <rect x="-2.5" y="24" width="5" height="20" fill="#8B4513" />
            </g>
            <g transform="translate(760, 490)">
              <ellipse cx="0" cy="0" rx="7" ry="18" fill="#7A9A7A" />
              <rect x="-1.5" y="13" width="3" height="12" fill="#8B4513" />
            </g>
            <g transform="translate(860, 480)">
              <ellipse cx="0" cy="0" rx="10" ry="25" fill="#6B8B6B" />
              <rect x="-2" y="20" width="4" height="15" fill="#8B4513" />
            </g>
            <g transform="translate(960, 485)">
              <ellipse cx="0" cy="0" rx="9" ry="22" fill="#7A9A7A" />
              <rect x="-2" y="17" width="4" height="15" fill="#8B4513" />
            </g>
            <g transform="translate(1060, 475)">
              <ellipse cx="0" cy="0" rx="8" ry="20" fill="#6B8B6B" />
              <rect x="-1.5" y="15" width="3" height="12" fill="#8B4513" />
            </g>
            <g transform="translate(1160, 490)">
              <ellipse cx="0" cy="0" rx="11" ry="28" fill="#7A9A7A" />
              <rect x="-2.5" y="22" width="5" height="18" fill="#8B4513" />
            </g>
          </g>
          
          {/* Scattered Bushes and Undergrowth */}
          <g opacity="0.5">
            <ellipse cx="30" cy="495" rx="6" ry="8" fill="#4A6B4A" />
            <ellipse cx="110" cy="498" rx="8" ry="10" fill="#5A7A5A" />
            <ellipse cx="190" cy="492" rx="5" ry="7" fill="#4A6B4A" />
            <ellipse cx="270" cy="497" rx="7" ry="9" fill="#5A7A5A" />
            <ellipse cx="350" cy="494" rx="6" ry="8" fill="#4A6B4A" />
            <ellipse cx="430" cy="499" rx="9" ry="11" fill="#5A7A5A" />
            <ellipse cx="510" cy="493" rx="5" ry="7" fill="#4A6B4A" />
            <ellipse cx="590" cy="496" rx="7" ry="9" fill="#5A7A5A" />
            <ellipse cx="670" cy="491" rx="6" ry="8" fill="#4A6B4A" />
            <ellipse cx="750" cy="498" rx="8" ry="10" fill="#5A7A5A" />
            <ellipse cx="830" cy="494" rx="5" ry="7" fill="#4A6B4A" />
            <ellipse cx="910" cy="497" rx="7" ry="9" fill="#5A7A5A" />
            <ellipse cx="990" cy="495" rx="6" ry="8" fill="#4A6B4A" />
            <ellipse cx="1070" cy="492" rx="8" ry="10" fill="#5A7A5A" />
            <ellipse cx="1150" cy="496" rx="5" ry="7" fill="#4A6B4A" />
          </g>
          
          {/* Dead/Bare Trees for Post-Apocalyptic Feel */}
          <g opacity="0.6">
            <g transform="translate(100, 470)">
              <line x1="0" y1="0" x2="0" y2="25" stroke="#654321" strokeWidth="2" />
              <line x1="0" y1="5" x2="-8" y2="0" stroke="#654321" strokeWidth="1" />
              <line x1="0" y1="10" x2="6" y2="5" stroke="#654321" strokeWidth="1" />
              <line x1="0" y1="15" x2="-5" y2="10" stroke="#654321" strokeWidth="1" />
            </g>
            <g transform="translate(300, 465)">
              <line x1="0" y1="0" x2="0" y2="30" stroke="#654321" strokeWidth="2.5" />
              <line x1="0" y1="8" x2="-10" y2="2" stroke="#654321" strokeWidth="1" />
              <line x1="0" y1="12" x2="8" y2="7" stroke="#654321" strokeWidth="1" />
              <line x1="0" y1="18" x2="-6" y2="12" stroke="#654321" strokeWidth="1" />
              <line x1="0" y1="22" x2="7" y2="17" stroke="#654321" strokeWidth="1" />
            </g>
            <g transform="translate(500, 475)">
              <line x1="0" y1="0" x2="0" y2="20" stroke="#654321" strokeWidth="1.5" />
              <line x1="0" y1="6" x2="-6" y2="2" stroke="#654321" strokeWidth="1" />
              <line x1="0" y1="12" x2="5" y2="8" stroke="#654321" strokeWidth="1" />
            </g>
            <g transform="translate(700, 468)">
              <line x1="0" y1="0" x2="0" y2="28" stroke="#654321" strokeWidth="2" />
              <line x1="0" y1="7" x2="-9" y2="1" stroke="#654321" strokeWidth="1" />
              <line x1="0" y1="14" x2="7" y2="9" stroke="#654321" strokeWidth="1" />
              <line x1="0" y1="20" x2="-5" y2="15" stroke="#654321" strokeWidth="1" />
            </g>
            <g transform="translate(900, 472)">
              <line x1="0" y1="0" x2="0" y2="22" stroke="#654321" strokeWidth="2" />
              <line x1="0" y1="5" x2="-7" y2="0" stroke="#654321" strokeWidth="1" />
              <line x1="0" y1="11" x2="6" y2="6" stroke="#654321" strokeWidth="1" />
              <line x1="0" y1="16" x2="-4" y2="12" stroke="#654321" strokeWidth="1" />
            </g>
            <g transform="translate(1100, 466)">
              <line x1="0" y1="0" x2="0" y2="26" stroke="#654321" strokeWidth="2.5" />
              <line x1="0" y1="6" x2="-8" y2="1" stroke="#654321" strokeWidth="1" />
              <line x1="0" y1="13" x2="9" y2="8" stroke="#654321" strokeWidth="1" />
              <line x1="0" y1="19" x2="-6" y2="14" stroke="#654321" strokeWidth="1" />
            </g>
          </g>
        </g>
        
        {/* Ground/Wasteland Floor */}
        <rect x="0" y="500" width="1200" height="300" fill="url(#wastelandGround)" />
        
        {/* Ground Texture and Debris */}
        <g id="groundDetails">
          {/* Scattered Rocks - Bigger with DEB887 shades */}
          <ellipse cx="150" cy="720" rx="40" ry="15" fill="#DEB887" opacity="0.8" />
          <ellipse cx="850" cy="730" rx="50" ry="18" fill="#D2B48C" opacity="0.9" />
          <ellipse cx="1050" cy="750" rx="38" ry="14" fill="#DEB887" opacity="0.6" />
          <ellipse cx="250" cy="710" rx="32" ry="10" fill="#E6C79A" opacity="0.8" />
          <ellipse cx="950" cy="745" rx="42" ry="13" fill="#DEB887" opacity="0.9" />
          
          {/* Dust Patches - Bigger with DEB887 shades */}
          <ellipse cx="400" cy="680" rx="90" ry="30" fill="#DEB887" opacity="0.3" />
          <ellipse cx="800" cy="700" rx="110" ry="35" fill="#E6C79A" opacity="0.2" />
          <ellipse cx="200" cy="690" rx="75" ry="25" fill="#D2B48C" opacity="0.4" />
          <ellipse cx="1000" cy="685" rx="95" ry="32" fill="#DEB887" opacity="0.3" />
        </g>

        {/* Massive Mechanical Walker Base */}
        <g id="mechanicalWalker" transform="translate(0, 0)">
          {/* Main Walker Body */}
          <g id="walkerBody" transform="translate(600, 350)">
            {/* Main Hull */}
            <rect x="-200" y="-50" width="400" height="150" rx="20" fill="url(#walkerMetal)" />
            <rect x="-190" y="-40" width="380" height="130" rx="15" fill="url(#rustEffect)" opacity="0.2" />
            
            {/* Hull Details */}
            <rect x="-180" y="-30" width="360" height="20" rx="10" fill="#3A3A3A" />
            <rect x="-180" y="20" width="360" height="15" rx="7" fill="#3A3A3A" />
            <rect x="-180" y="50" width="360" height="15" rx="7" fill="#3A3A3A" />
            
            {/* Rivets */}
            <g fill="#2A2A2A">
              <circle cx="-170" cy="-20" r="3" />
              <circle cx="-120" cy="-20" r="3" />
              <circle cx="-70" cy="-20" r="3" />
              <circle cx="-20" cy="-20" r="3" />
              <circle cx="30" cy="-20" r="3" />
              <circle cx="80" cy="-20" r="3" />
              <circle cx="130" cy="-20" r="3" />
              <circle cx="170" cy="-20" r="3" />
            </g>
            
            {/* Command Tower */}
            <rect x="-60" y="-100" width="120" height="50" rx="10" fill="url(#walkerMetal)" />
            <rect x="-50" y="-90" width="100" height="30" rx="5" fill="#4A4A4A" />
            
            {/* Windows */}
            <rect x="-40" y="-85" width="25" height="15" rx="2" fill="#87CEEB" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.9;0.6" dur="4s" repeatCount="indefinite" />
            </rect>
            <rect x="-10" y="-85" width="25" height="15" rx="2" fill="#87CEEB" opacity="0.7">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="3.5s" repeatCount="indefinite" />
            </rect>
            <rect x="20" y="-85" width="25" height="15" rx="2" fill="#87CEEB" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.8;0.5" dur="4.2s" repeatCount="indefinite" />
            </rect>
            
            {/* Exhaust Pipes */}
            <rect x="-220" y="0" width="20" height="60" rx="10" fill="#3A3A3A" />
            <rect x="200" y="0" width="20" height="60" rx="10" fill="#3A3A3A" />
            
            {/* Smoke from exhausts */}
            <g opacity="0.4">
              <circle cx="-210" cy="-10" r="8" fill="#D3D3D3">
                <animateTransform attributeName="transform" type="translate" values="0,0;-10,-30;-20,-60" dur="6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.1;0" dur="6s" repeatCount="indefinite" />
              </circle>
              <circle cx="210" cy="-10" r="8" fill="#D3D3D3">
                <animateTransform attributeName="transform" type="translate" values="0,0;10,-30;20,-60" dur="6.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.1;0" dur="6.5s" repeatCount="indefinite" />
              </circle>
            </g>
            
            {/* Leg Connection Points */}
            <rect x="-190" y="90" width="30" height="20" rx="10" fill="url(#walkerMetal)" />
            <rect x="-90" y="90" width="30" height="20" rx="10" fill="url(#walkerMetal)" />
            <rect x="60" y="90" width="30" height="20" rx="10" fill="url(#walkerMetal)" />
            <rect x="160" y="90" width="30" height="20" rx="10" fill="url(#walkerMetal)" />
          </g>
          
          {/* Walker Legs - Connected to Body */}
          <g id="walkerLegs">
            {/* Front Left Leg - Connected to body */}
            <g transform="translate(410, 440)">
              <rect x="-15" y="0" width="30" height="120" rx="15" fill="url(#walkerMetal)" />
              <rect x="-12" y="5" width="24" height="110" rx="12" fill="url(#rustEffect)" opacity="0.3" />
              <ellipse cx="0" cy="120" rx="25" ry="15" fill="#2A2A2A" />
              <rect x="-20" y="115" width="40" height="20" rx="10" fill="url(#walkerMetal)" />
              {/* Hydraulics */}
              <rect x="-8" y="20" width="16" height="80" rx="8" fill="#5A5A5A" />
              <circle cx="0" cy="30" r="6" fill="#FFD700" opacity="0.8">
                <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite" />
              </circle>
              {/* Connection to body */}
              <rect x="-10" y="-10" width="20" height="15" rx="5" fill="url(#walkerMetal)" />
            </g>
            
            {/* Front Right Leg - Connected to body */}
            <g transform="translate(790, 440)">
              <rect x="-15" y="0" width="30" height="120" rx="15" fill="url(#walkerMetal)" />
              <rect x="-12" y="5" width="24" height="110" rx="12" fill="url(#rustEffect)" opacity="0.3" />
              <ellipse cx="0" cy="120" rx="25" ry="15" fill="#2A2A2A" />
              <rect x="-20" y="115" width="40" height="20" rx="10" fill="url(#walkerMetal)" />
              {/* Hydraulics */}
              <rect x="-8" y="20" width="16" height="80" rx="8" fill="#5A5A5A" />
              <circle cx="0" cy="30" r="6" fill="#FFD700" opacity="0.8">
                <animate attributeName="opacity" values="0.8;1;0.8" dur="3.2s" repeatCount="indefinite" />
              </circle>
              {/* Connection to body */}
              <rect x="-10" y="-10" width="20" height="15" rx="5" fill="url(#walkerMetal)" />
            </g>
            
            {/* Back Left Leg - Connected to body */}
            <g transform="translate(510, 440)">
              <rect x="-12" y="0" width="24" height="100" rx="12" fill="url(#walkerMetal)" />
              <rect x="-10" y="5" width="20" height="90" rx="10" fill="url(#rustEffect)" opacity="0.3" />
              <ellipse cx="0" cy="100" rx="20" ry="12" fill="#2A2A2A" />
              <rect x="-15" y="95" width="30" height="15" rx="7" fill="url(#walkerMetal)" />
              {/* Connection to body */}
              <rect x="-8" y="-10" width="16" height="15" rx="4" fill="url(#walkerMetal)" />
            </g>
            
            {/* Back Right Leg - Connected to body */}
            <g transform="translate(690, 440)">
              <rect x="-12" y="0" width="24" height="100" rx="12" fill="url(#walkerMetal)" />
              <rect x="-10" y="5" width="20" height="90" rx="10" fill="url(#rustEffect)" opacity="0.3" />
              <ellipse cx="0" cy="100" rx="20" ry="12" fill="#2A2A2A" />
              <rect x="-15" y="95" width="30" height="15" rx="7" fill="url(#walkerMetal)" />
              {/* Connection to body */}
              <rect x="-8" y="-10" width="16" height="15" rx="4" fill="url(#walkerMetal)" />
            </g>
          </g>
        </g>

        {/* Interactive Objects on Ground */}
        
        {/* Terminal Station - Today's Objectives (Habits) */}
        <g id="terminalStation" className="interactive-object cursor-pointer" onClick={openHabitsSection}>
          <g transform="translate(200, 600)">
            {/* Terminal Base */}
            <rect x="-30" y="0" width="60" height="80" rx="5" fill="url(#walkerMetal)" />
            <rect x="-25" y="5" width="50" height="70" rx="3" fill="#2A2A2A" />
            
            {/* Screen */}
            <rect x="-20" y="15" width="40" height="30" rx="2" fill="#000000" />
            <rect x="-18" y="17" width="36" height="26" rx="1" fill="url(#terminalGlow)" opacity="0.8" filter="url(#wastelandGlow)">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
            </rect>
            
            {/* Screen Text Lines */}
            <g opacity="0.9">
              <rect x="-15" y="20" width="30" height="2" fill="#00FF41" />
              <rect x="-15" y="25" width="25" height="2" fill="#32CD32" />
              <rect x="-15" y="30" width="28" height="2" fill="#00FF41" />
              <rect x="-15" y="35" width="20" height="2" fill="#32CD32" />
            </g>
            
            {/* Keyboard */}
            <rect x="-20" y="50" width="40" height="15" rx="2" fill="#3A3A3A" />
            <g fill="#5A5A5A">
              <rect x="-18" y="52" width="4" height="3" rx="1" />
              <rect x="-12" y="52" width="4" height="3" rx="1" />
              <rect x="-6" y="52" width="4" height="3" rx="1" />
              <rect x="0" y="52" width="4" height="3" rx="1" />
              <rect x="6" y="52" width="4" height="3" rx="1" />
              <rect x="12" y="52" width="4" height="3" rx="1" />
            </g>
            
            {/* Power Indicator */}
            <circle cx="15" cy="10" r="3" fill="#00FF41" opacity="0.8">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </g>
          
          <text x="200" y="720" textAnchor="middle" fill="#00FF41" fontSize="14" fontWeight="bold" className="object-label">
            TODAY'S OBJECTIVES
          </text>
        </g>

        {/* Radio Tower - Communication Station (Calls) - 2x Bigger */}
        <g id="radioTower" className="interactive-object cursor-pointer" onClick={openCallSection}>
          <g transform="translate(600, 175) scale(1.0)">
            {/* Tower Base */}
            <rect x="-15" y="20" width="30" height="60" rx="5" fill="url(#walkerMetal)" />
            <rect x="-12" y="25" width="24" height="50" rx="3" fill="#3A3A3A" />
            
            {/* Antenna Mast */}
            <rect x="-2" y="-40" width="4" height="60" fill="#5A5A5A" />
            
            {/* Antenna Elements */}
            <line x1="-20" y1="-30" x2="20" y2="-30" stroke="#6B6B6B" strokeWidth="2" />
            <line x1="-15" y1="-20" x2="15" y2="-20" stroke="#6B6B6B" strokeWidth="2" />
            <line x1="-10" y1="-10" x2="10" y2="-10" stroke="#6B6B6B" strokeWidth="2" />
            
            {/* Radio Equipment */}
            <rect x="-10" y="30" width="20" height="25" rx="3" fill="#4A4A4A" />
            <rect x="-8" y="35" width="16" height="8" rx="1" fill="url(#radioGlow)" opacity="0.7">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" />
            </rect>
            
            {/* Control Knobs */}
            <circle cx="-5" cy="50" r="2" fill="#FFD700" />
            <circle cx="0" cy="50" r="2" fill="#FF6B35" />
            <circle cx="5" cy="50" r="2" fill="#FFD700" />
            
            {/* Signal Waves */}
            <g opacity="0.6">
              <circle cx="0" cy="-35" r="25" fill="none" stroke="#FF6B35" strokeWidth="1">
                <animate attributeName="r" values="25;35;25" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy="-35" r="35" fill="none" stroke="#FF8E53" strokeWidth="1">
                <animate attributeName="r" values="35;45;35" dur="3.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3.5s" repeatCount="indefinite" />
              </circle>
            </g>
          </g>
          
          <text x="600" y="295" textAnchor="middle" fill="#FF6B35" fontSize="14" fontWeight="bold" className="object-label">
            COMM STATION
          </text>
        </g>

        {/* Data Processing Unit - Mission Roadmap (Schedule) */}
        <g id="dataProcessor" className="interactive-object cursor-pointer" onClick={openScheduleSection}>
          <g transform="translate(1000, 600)">
            {/* Main Unit */}
            <rect x="-40" y="0" width="80" height="60" rx="8" fill="url(#walkerMetal)" />
            <rect x="-35" y="5" width="70" height="50" rx="5" fill="#2A2A2A" />
            
            {/* Data Screens */}
            <rect x="-30" y="15" width="25" height="15" rx="2" fill="url(#dataGlow)" opacity="0.8" filter="url(#wastelandGlow)">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
            </rect>
            <rect x="-2" y="15" width="25" height="15" rx="2" fill="url(#dataGlow)" opacity="0.6" filter="url(#wastelandGlow)">
              <animate attributeName="opacity" values="0.6;0.9;0.6" dur="2.3s" repeatCount="indefinite" />
            </rect>
            
            {/* Data Flow Indicators */}
            <g opacity="0.8">
              <rect x="-25" y="18" width="15" height="1" fill="#00BFFF">
                <animate attributeName="width" values="15;20;15" dur="1.5s" repeatCount="indefinite" />
              </rect>
              <rect x="-25" y="21" width="12" height="1" fill="#1E90FF">
                <animate attributeName="width" values="12;18;12" dur="1.8s" repeatCount="indefinite" />
              </rect>
              <rect x="-25" y="24" width="18" height="1" fill="#00BFFF">
                <animate attributeName="width" values="18;22;18" dur="1.3s" repeatCount="indefinite" />
              </rect>
              
              <rect x="3" y="18" width="15" height="1" fill="#00BFFF">
                <animate attributeName="width" values="15;20;15" dur="1.7s" repeatCount="indefinite" />
              </rect>
              <rect x="3" y="21" width="12" height="1" fill="#1E90FF">
                <animate attributeName="width" values="12;18;12" dur="1.4s" repeatCount="indefinite" />
              </rect>
              <rect x="3" y="24" width="18" height="1" fill="#00BFFF">
                <animate attributeName="width" values="18;22;18" dur="1.9s" repeatCount="indefinite" />
              </rect>
            </g>
            
            {/* Processing Lights */}
            <circle cx="-20" cy="40" r="3" fill="#00BFFF" opacity="0.8">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx="-10" cy="40" r="3" fill="#1E90FF" opacity="0.6">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="40" r="3" fill="#00BFFF" opacity="0.9">
              <animate attributeName="opacity" values="0.9;1;0.9" dur="0.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="10" cy="40" r="3" fill="#1E90FF" opacity="0.7">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="1.1s" repeatCount="indefinite" />
            </circle>
            <circle cx="20" cy="40" r="3" fill="#00BFFF" opacity="0.5">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="1.3s" repeatCount="indefinite" />
            </circle>
          </g>
          
          <text x="1000" y="720" textAnchor="middle" fill="#00BFFF" fontSize="14" fontWeight="bold" className="object-label">
            MISSION ROADMAP
          </text>
        </g>

        {/* Workbench - Bobo Customization - 2x Bigger */}
        <g id="workbench" className="interactive-object cursor-pointer" onClick={openBoboSection}>
          <g transform="translate(1050, 450) scale(2)">
            {/* Workbench Table */}
            <rect x="-50" y="0" width="100" height="40" rx="5" fill="url(#walkerMetal)" />
            <rect x="-45" y="5" width="90" height="30" rx="3" fill="#4A4A4A" />
            
            {/* Tools and Parts */}
            <rect x="-40" y="-5" width="8" height="15" rx="2" fill="#FFD700" />
            <rect x="-25" y="-3" width="12" height="10" rx="1" fill="#FFA500" />
            <circle cx="-10" cy="2" r="4" fill="#FFD700" opacity="0.8">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite" />
            </circle>
            <rect x="5" y="-2" width="15" height="8" rx="2" fill="#FF8C00" />
            <rect x="25" y="-4" width="10" height="12" rx="2" fill="#FFD700" />
            
            {/* Holographic Display */}
            <rect x="-20" y="10" width="40" height="20" rx="3" fill="url(#workbenchGlow)" opacity="0.6" filter="url(#wastelandGlow)">
              <animate attributeName="opacity" values="0.6;0.9;0.6" dur="4s" repeatCount="indefinite" />
            </rect>
          </g>
          
          <text x="1050" y="570" textAnchor="middle" fill="#FFD700" fontSize="14" fontWeight="bold" className="object-label">
            HOLO-FIT STATION
          </text>
        </g>

        {/* Analytics Core - Data Insights */}
        <g id="analyticsCore" className="interactive-object cursor-pointer" onClick={openInsightsSection}>
          <g transform="translate(400, 610)">
            {/* Core Housing */}
            <rect x="-25" y="0" width="50" height="50" rx="25" fill="url(#walkerMetal)" />
            <rect x="-20" y="5" width="40" height="40" rx="20" fill="#2A2A2A" />
            
            {/* Rotating Core */}
            <g transform="translate(0, 25)">
              <circle r="15" fill="url(#commGlow)" opacity="0.8" filter="url(#wastelandGlow)">
                <animateTransform attributeName="transform" type="rotate" values="0;360" dur="8s" repeatCount="indefinite" />
              </circle>
              <rect x="-10" y="-2" width="20" height="4" fill="#9370DB" opacity="0.9">
                <animateTransform attributeName="transform" type="rotate" values="0;360" dur="8s" repeatCount="indefinite" />
              </rect>
              <rect x="-2" y="-10" width="4" height="20" fill="#BA55D3" opacity="0.9">
                <animateTransform attributeName="transform" type="rotate" values="0;360" dur="8s" repeatCount="indefinite" />
              </rect>
            </g>
            
            {/* Data Streams */}
            <g opacity="0.7">
              <line x1="-30" y1="25" x2="-25" y2="25" stroke="#9370DB" strokeWidth="2">
                <animate attributeName="stroke-dasharray" values="0,10;5,5;10,0" dur="2s" repeatCount="indefinite" />
              </line>
              <line x1="25" y1="25" x2="30" y2="25" stroke="#BA55D3" strokeWidth="2">
                <animate attributeName="stroke-dasharray" values="0,10;5,5;10,0" dur="2.2s" repeatCount="indefinite" />
              </line>
              <line x1="0" y1="-5" x2="0" y2="-10" stroke="#9370DB" strokeWidth="2">
                <animate attributeName="stroke-dasharray" values="0,10;5,5;10,0" dur="1.8s" repeatCount="indefinite" />
              </line>
              <line x1="0" y1="55" x2="0" y2="60" stroke="#BA55D3" strokeWidth="2">
                <animate attributeName="stroke-dasharray" values="0,10;5,5;10,0" dur="2.1s" repeatCount="indefinite" />
              </line>
            </g>
          </g>
          
          <text x="400" y="720" textAnchor="middle" fill="#9370DB" fontSize="14" fontWeight="bold" className="object-label">
            DATA CORE
          </text>
        </g>

        {/* Achievement Display - Honor Badges */}
        <g id="achievementDisplay" className="interactive-object cursor-pointer" onClick={openBadgesSection}>
          <g transform="translate(600, 620)">
            {/* Display Pedestal */}
            <rect x="-20" y="20" width="40" height="40" rx="5" fill="url(#walkerMetal)" />
            <rect x="-15" y="25" width="30" height="30" rx="3" fill="#3A3A3A" />
            
            {/* Holographic Badge Display */}
            <g transform="translate(0, 10)">
              <circle r="18" fill="url(#workbenchGlow)" opacity="0.3" filter="url(#wastelandGlow)">
                <animate attributeName="opacity" values="0.3;0.6;0.3" dur="4s" repeatCount="indefinite" />
              </circle>
              
              {/* Floating Badges */}
              <g transform="translate(0, 0)">
                <polygon points="0,-8 6,0 0,8 -6,0" fill="#FFD700" opacity="0.8">
                  <animateTransform attributeName="transform" type="rotate" values="0;360" dur="10s" repeatCount="indefinite" />
                </polygon>
                <animateTransform attributeName="transform" type="translate" values="0,0;3,-5;0,0" dur="6s" repeatCount="indefinite" />
              </g>
              
              <g transform="translate(8, 5)">
                <circle r="4" fill="#FFA500" opacity="0.7">
                  <animateTransform attributeName="transform" type="rotate" values="0;360" dur="8s" repeatCount="indefinite" />
                </circle>
                <animateTransform attributeName="transform" type="translate" values="8,5;5,2;8,5" dur="7s" repeatCount="indefinite" />
              </g>
              
              <g transform="translate(-8, 5)">
                <rect x="-3" y="-3" width="6" height="6" rx="1" fill="#FFD700" opacity="0.6">
                  <animateTransform attributeName="transform" type="rotate" values="0;360" dur="12s" repeatCount="indefinite" />
                </rect>
                <animateTransform attributeName="transform" type="translate" values="-8,5;-5,2;-8,5" dur="8s" repeatCount="indefinite" />
              </g>
            </g>
            
            {/* Base Lights */}
            <circle cx="-10" cy="45" r="2" fill="#FFD700" opacity="0.8">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="45" r="2" fill="#FFA500" opacity="0.9">
              <animate attributeName="opacity" values="0.9;1;0.9" dur="2.3s" repeatCount="indefinite" />
            </circle>
            <circle cx="10" cy="45" r="2" fill="#FFD700" opacity="0.7">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="1.8s" repeatCount="indefinite" />
            </circle>
          </g>
          
          <text x="600" y="720" textAnchor="middle" fill="#FFD700" fontSize="14" fontWeight="bold" className="object-label">
            HONOR BADGES
          </text>
        </g>

        {/* Campfire - Atmospheric Element */}
        <g id="campfire">
          <g transform="translate(500, 650) scale(2)">
            {/* Fire Pit Base */}
            <ellipse cx="0" cy="15" rx="25" ry="8" fill="#4A4A4A" />
            <ellipse cx="0" cy="12" rx="20" ry="6" fill="#2A2A2A" />
            
            {/* Stones around fire pit */}
            <ellipse cx="-18" cy="12" rx="4" ry="3" fill="#6B6B6B" />
            <ellipse cx="-12" cy="18" rx="3" ry="2" fill="#5A5A5A" />
            <ellipse cx="15" cy="14" rx="4" ry="3" fill="#6B6B6B" />
            <ellipse cx="8" cy="19" rx="3" ry="2" fill="#5A5A5A" />
            <ellipse cx="0" cy="20" rx="3" ry="2" fill="#6B6B6B" />
            <ellipse cx="-8" cy="8" rx="3" ry="2" fill="#5A5A5A" />
            <ellipse cx="12" cy="8" rx="3" ry="2" fill="#6B6B6B" />
            
            {/* Logs/Wood */}
            <rect x="-15" y="8" width="30" height="4" rx="2" fill="#8B4513" transform="rotate(15)" />
            <rect x="-12" y="6" width="24" height="3" rx="1.5" fill="#A0522D" transform="rotate(-20)" />
            <rect x="-18" y="10" width="36" height="3" rx="1.5" fill="#8B4513" transform="rotate(45)" />
            <rect x="-10" y="4" width="20" height="2" rx="1" fill="#A0522D" transform="rotate(-35)" />
            
            {/* Fire Flames */}
            <g opacity="0.9">
              {/* Main flame */}
              <ellipse cx="0" cy="-5" rx="8" ry="20" fill="var(--color-accent)" opacity="0.8">
                <animate attributeName="ry" values="20;25;18;22;20" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;1;0.7;0.9;0.8" dur="2s" repeatCount="indefinite" />
                <animateTransform attributeName="transform" type="rotate" values="0;3;-2;1;0" dur="2s" repeatCount="indefinite" />
              </ellipse>
              
              {/* Secondary flames */}
              <ellipse cx="-6" cy="-2" rx="5" ry="15" fill="var(--color-accent)" opacity="0.7">
                <animate attributeName="ry" values="15;18;14;16;15" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0.9;0.6;0.8;0.7" dur="1.8s" repeatCount="indefinite" />
                <animateTransform attributeName="transform" type="rotate" values="0;-2;3;-1;0" dur="1.8s" repeatCount="indefinite" />
              </ellipse>
              
              <ellipse cx="5" cy="-3" rx="4" ry="12" fill="var(--color-accent)" opacity="0.6">
                <animate attributeName="ry" values="12;16;11;14;12" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.8;0.5;0.7;0.6" dur="2.2s" repeatCount="indefinite" />
                <animateTransform attributeName="transform" type="rotate" values="0;2;-3;1;0" dur="2.2s" repeatCount="indefinite" />
              </ellipse>
              
              {/* Inner hot core */}
              <ellipse cx="0" cy="0" rx="4" ry="8" fill="var(--color-foreground)" opacity="0.9">
                <animate attributeName="ry" values="8;12;7;10;8" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;1;0.8;0.95;0.9" dur="1.5s" repeatCount="indefinite" />
              </ellipse>
              
              {/* Small dancing flames */}
              <ellipse cx="-3" cy="-8" rx="2" ry="6" fill="var(--color-foreground)" opacity="0.8">
                <animate attributeName="ry" values="6;9;5;7;6" dur="1.3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;1;0.6;0.9;0.8" dur="1.3s" repeatCount="indefinite" />
                <animateTransform attributeName="transform" type="rotate" values="0;-4;2;-1;0" dur="1.3s" repeatCount="indefinite" />
              </ellipse>
              
              <ellipse cx="4" cy="-6" rx="2" ry="5" fill="var(--color-foreground)" opacity="0.7">
                <animate attributeName="ry" values="5;8;4;6;5" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0.9;0.5;0.8;0.7" dur="1.6s" repeatCount="indefinite" />
                <animateTransform attributeName="transform" type="rotate" values="0;3;-2;1;0" dur="1.6s" repeatCount="indefinite" />
              </ellipse>
            </g>
            
            {/* Smoke */}
            <g opacity="0.4">
              <circle cx="0" cy="-25" r="3" fill="var(--color-foreground)" opacity="0.6">
                <animateTransform attributeName="transform" type="translate" values="0,0;-2,-15;-5,-30" dur="4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.3;0" dur="4s" repeatCount="indefinite" />
                <animate attributeName="r" values="3;5;7" dur="4s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy="-20" r="2" fill="var(--color-foreground)" opacity="0.5">
                <animateTransform attributeName="transform" type="translate" values="0,0;3,-18;6,-36" dur="4.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.2;0" dur="4.5s" repeatCount="indefinite" />
                <animate attributeName="r" values="2;4;6" dur="4.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy="-22" r="2.5" fill="var(--color-foreground)" opacity="0.4">
                <animateTransform attributeName="transform" type="translate" values="0,0;-1,-20;-3,-40" dur="5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.1;0" dur="5s" repeatCount="indefinite" />
                <animate attributeName="r" values="2.5;4.5;6.5" dur="5s" repeatCount="indefinite" />
              </circle>
            </g>
            
            {/* Sparks and Embers */}
            <g opacity="0.8">
              <circle cx="2" cy="-15" r="1" fill="var(--color-accent)" opacity="0.9">
                <animateTransform attributeName="transform" type="translate" values="0,0;8,-12;16,-24" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0.5;0" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="-3" cy="-12" r="0.8" fill="var(--color-accent)" opacity="0.8">
                <animateTransform attributeName="transform" type="translate" values="0,0;-6,-10;-12,-20" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.4;0" dur="2.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="1" cy="-18" r="0.6" fill="var(--color-foreground)" opacity="0.7">
                <animateTransform attributeName="transform" type="translate" values="0,0;4,-8;8,-16" dur="2.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0.3;0" dur="2.8s" repeatCount="indefinite" />
              </circle>
              <circle cx="-2" cy="-16" r="0.7" fill="var(--color-accent)" opacity="0.6">
                <animateTransform attributeName="transform" type="translate" values="0,0;-5,-9;-10,-18" dur="3.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.2;0" dur="3.2s" repeatCount="indefinite" />
              </circle>
            </g>
            
            {/* Warm glow around campfire */}
            <circle cx="0" cy="0" r="40" fill="var(--color-accent)" opacity="0.1">
              <animate attributeName="opacity" values="0.1;0.2;0.08;0.15;0.1" dur="3s" repeatCount="indefinite" />
              <animate attributeName="r" values="40;45;38;42;40" dur="3s" repeatCount="indefinite" />
            </circle>
          </g>
        </g>

        {/* Atmospheric Effects */}
        <g id="atmosphericEffects">
          {/* Dust Particles */}
          <circle cx="300" cy="400" r="2" fill="var(--color-accent)" opacity="0.4">
            <animateTransform attributeName="transform" type="translate" values="0,0;100,-50;200,-100" dur="20s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.1;0" dur="20s" repeatCount="indefinite" />
          </circle>
          
          <circle cx="800" cy="350" r="1.5" fill="var(--color-foreground)" opacity="0.5">
            <animateTransform attributeName="transform" type="translate" values="0,0;-80,-30;-160,-60" dur="18s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.1;0" dur="18s" repeatCount="indefinite" />
          </circle>
          
          <circle cx="500" cy="380" r="1" fill="var(--color-accent)" opacity="0.3">
            <animateTransform attributeName="transform" type="translate" values="0,0;60,-40;120,-80" dur="15s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.1;0" dur="15s" repeatCount="indefinite" />
          </circle>
          
          {/* Heat Shimmer Lines */}
          <g opacity="0.2">
            <path d="M 0 500 Q 200 495 400 500 Q 600 505 800 500 Q 1000 495 1200 500" 
                  stroke="var(--color-accent)" strokeWidth="1" fill="none">
              <animate attributeName="d" 
                       values="M 0 500 Q 200 495 400 500 Q 600 505 800 500 Q 1000 495 1200 500;
                               M 0 500 Q 200 505 400 500 Q 600 495 800 500 Q 1000 505 1200 500;
                               M 0 500 Q 200 495 400 500 Q 600 505 800 500 Q 1000 495 1200 500" 
                       dur="8s" repeatCount="indefinite" />
            </path>
            <path d="M 0 520 Q 300 515 600 520 Q 900 525 1200 520" 
                  stroke="var(--color-foreground)" strokeWidth="1" fill="none">
              <animate attributeName="d" 
                       values="M 0 520 Q 300 515 600 520 Q 900 525 1200 520;
                               M 0 520 Q 300 525 600 520 Q 900 515 1200 520;
                               M 0 520 Q 300 515 600 520 Q 900 525 1200 520" 
                       dur="10s" repeatCount="indefinite" />
            </path>
          </g>
        </g>

        {/* Dangerous Environmental Hazards */}
        <g id="environmentalHazards">
          {/* Radiation Storms */}
          <g id="radiationStorms" opacity="0.4">
            {/* Green radiation clouds */}
            <ellipse cx="300" cy="300" rx="80" ry="30" fill="#32CD32" opacity="0.2">
              <animate attributeName="opacity" values="0.2;0.6;0.2" dur="6s" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="translate" values="0,0;50,-20;100,-40" dur="15s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="800" cy="250" rx="60" ry="25" fill="#00FF00" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur="8s" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="translate" values="0,0;-40,-15;-80,-30" dur="18s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="1100" cy="350" rx="70" ry="20" fill="#7FFF00" opacity="0.25">
              <animate attributeName="opacity" values="0.25;0.5;0.25" dur="7s" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="translate" values="0,0;-30,-25;-60,-50" dur="20s" repeatCount="indefinite" />
            </ellipse>
          </g>
          
          {/* Energy Lightning Strikes */}
          <g id="energyLightning" opacity="0.8">
            <g opacity="0">
              <path d="M 150 50 L 140 150 L 160 200 L 145 280 L 155 350" stroke="#00FFFF" strokeWidth="3" fill="none">
                <animate attributeName="opacity" values="0;1;0;0;0" dur="8s" repeatCount="indefinite" />
              </path>
              <path d="M 140 150 L 120 180 L 135 220" stroke="#00FFFF" strokeWidth="2" fill="none">
                <animate attributeName="opacity" values="0;1;0;0;0" dur="8s" repeatCount="indefinite" />
              </path>
            </g>
            <g opacity="0">
              <path d="M 950 40 L 960 120 L 940 180 L 955 250 L 945 320" stroke="#FF00FF" strokeWidth="3" fill="none">
                <animate attributeName="opacity" values="0;0;0;1;0" dur="12s" repeatCount="indefinite" />
              </path>
              <path d="M 960 120 L 980 140 L 965 170" stroke="#FF00FF" strokeWidth="2" fill="none">
                <animate attributeName="opacity" values="0;0;0;1;0" dur="12s" repeatCount="indefinite" />
              </path>
            </g>
            <g opacity="0">
              <path d="M 600 30 L 590 140 L 610 200 L 595 280 L 605 360" stroke="#FFFF00" strokeWidth="4" fill="none">
                <animate attributeName="opacity" values="0;0;1;0;0" dur="10s" repeatCount="indefinite" />
              </path>
              <path d="M 590 140 L 570 160 L 585 190" stroke="#FFFF00" strokeWidth="2" fill="none">
                <animate attributeName="opacity" values="0;0;1;0;0" dur="10s" repeatCount="indefinite" />
              </path>
            </g>
          </g>
          
          {/* Toxic Gas Vents */}
          <g id="toxicVents">
            <g transform="translate(250, 650)">
              <ellipse cx="0" cy="0" rx="15" ry="5" fill="#654321" />
              <g opacity="0.6">
                <circle cx="0" cy="-10" r="8" fill="#9ACD32" opacity="0.4">
                  <animateTransform attributeName="transform" type="translate" values="0,0;-5,-30;-10,-60" dur="4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.1;0" dur="4s" repeatCount="indefinite" />
                </circle>
                <circle cx="0" cy="-5" r="6" fill="#ADFF2F" opacity="0.5">
                  <animateTransform attributeName="transform" type="translate" values="0,0;3,-25;6,-50" dur="3.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0.1;0" dur="3.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="0" cy="-8" r="7" fill="#9ACD32" opacity="0.3">
                  <animateTransform attributeName="transform" type="translate" values="0,0;-2,-35;-4,-70" dur="4.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.1;0" dur="4.5s" repeatCount="indefinite" />
                </circle>
              </g>
            </g>
            <g transform="translate(750, 670)">
              <ellipse cx="0" cy="0" rx="12" ry="4" fill="#654321" />
              <g opacity="0.5">
                <circle cx="0" cy="-8" r="6" fill="#9ACD32" opacity="0.4">
                  <animateTransform attributeName="transform" type="translate" values="0,0;4,-20;8,-40" dur="3.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.1;0" dur="3.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="0" cy="-6" r="5" fill="#ADFF2F" opacity="0.6">
                  <animateTransform attributeName="transform" type="translate" values="0,0;-3,-25;-6,-50" dur="4.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.1;0" dur="4.2s" repeatCount="indefinite" />
                </circle>
              </g>
            </g>
            <g transform="translate(1050, 660)">
              <ellipse cx="0" cy="0" rx="18" ry="6" fill="#654321" />
              <g opacity="0.7">
                <circle cx="0" cy="-12" r="10" fill="#9ACD32" opacity="0.3">
                  <animateTransform attributeName="transform" type="translate" values="0,0;-6,-28;-12,-56" dur="4.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.1;0" dur="4.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="0" cy="-8" r="7" fill="#ADFF2F" opacity="0.5">
                  <animateTransform attributeName="transform" type="translate" values="0,0;5,-22;10,-44" dur="4.1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0.1;0" dur="4.1s" repeatCount="indefinite" />
                </circle>
              </g>
            </g>
          </g>
          
          {/* Acid Rain Effects */}
          <g id="acidRain" opacity="0.3">
            <line x1="80" y1="0" x2="75" y2="100" stroke="#9ACD32" strokeWidth="1" opacity="0.6">
              <animateTransform attributeName="transform" type="translate" values="0,0;0,500" dur="3s" repeatCount="indefinite" />
            </line>
            <line x1="220" y1="0" x2="215" y2="120" stroke="#ADFF2F" strokeWidth="1" opacity="0.5">
              <animateTransform attributeName="transform" type="translate" values="0,0;0,500" dur="3.5s" repeatCount="indefinite" />
            </line>
            <line x1="380" y1="0" x2="375" y2="90" stroke="#9ACD32" strokeWidth="1" opacity="0.7">
              <animateTransform attributeName="transform" type="translate" values="0,0;0,500" dur="2.8s" repeatCount="indefinite" />
            </line>
            <line x1="520" y1="0" x2="515" y2="110" stroke="#ADFF2F" strokeWidth="1" opacity="0.4">
              <animateTransform attributeName="transform" type="translate" values="0,0;0,500" dur="3.2s" repeatCount="indefinite" />
            </line>
            <line x1="680" y1="0" x2="675" y2="95" stroke="#9ACD32" strokeWidth="1" opacity="0.6">
              <animateTransform attributeName="transform" type="translate" values="0,0;0,500" dur="3.1s" repeatCount="indefinite" />
            </line>
            <line x1="820" y1="0" x2="815" y2="105" stroke="#ADFF2F" strokeWidth="1" opacity="0.5">
              <animateTransform attributeName="transform" type="translate" values="0,0;0,500" dur="2.9s" repeatCount="indefinite" />
            </line>
            <line x1="980" y1="0" x2="975" y2="85" stroke="#9ACD32" strokeWidth="1" opacity="0.8">
              <animateTransform attributeName="transform" type="translate" values="0,0;0,500" dur="3.4s" repeatCount="indefinite" />
            </line>
            <line x1="1120" y1="0" x2="1115" y2="115" stroke="#ADFF2F" strokeWidth="1" opacity="0.3">
              <animateTransform attributeName="transform" type="translate" values="0,0;0,500" dur="3.6s" repeatCount="indefinite" />
            </line>
          </g>
        </g>

      </svg>

      {/* Bobo Character with Equipped Items */}
      {showBobo && (
        <div 
          id="boboCharacter" 
          className="absolute z-10 transition-transform duration-1000 ease-linear"
          style={{ 
            left: '650px', 
            top: '650px',
            transform: 'translate(-50%, -50%)'
          }}
        >
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
      )}

      {/* Interactive object hover effects */}
      <style jsx>{`
        .interactive-object {
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .interactive-object:hover {
          filter: brightness(1.2) drop-shadow(0 0 20px var(--color-accent));
        }
        
        .object-label {
          font-family: 'Segoe UI', monospace;
          font-size: 14px;
          font-weight: bold;
          text-anchor: middle;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .object-label.theme-text {
          fill: var(--color-accent) !important;
        }
        
        .interactive-object:hover .object-label {
          opacity: 1;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}