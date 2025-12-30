import React, { useState } from 'react';
import ObstacleCard from './ObstacleCard';
import RobotMascot from './RobotMascot';

// Journey-themed obstacles from the design document
const JourneyObstacles = {
  distraction: {
    name: "Distraction Detour",
    icon: "🛤️",
    emoji: "📱",
    description: "Side paths that lead you away from your main journey",
    boboGreeting: "Watch out! There's a distraction detour ahead! Let me help you find the right path back to your journey!",
    color: "from-orange-400 to-red-500"
  },
  
  lowEnergy: {
    name: "Energy Drain Valley", 
    icon: "⛰️",
    emoji: "🔋",
    description: "A challenging terrain that makes every step harder",
    boboGreeting: "We're entering Energy Drain Valley! Let me help you find a better route or recharge your batteries!",
    color: "from-blue-400 to-purple-500"
  },
  
  complexity: {
    name: "Maze Mountain",
    icon: "🏔️", 
    emoji: "🧩",
    description: "Overwhelming terrain with no clear path forward",
    boboGreeting: "Maze Mountain is making this journey too complicated! Let me map out the simplest route for you!",
    color: "from-green-400 to-teal-500"
  },
  
  forgetfulness: {
    name: "Memory Fog",
    icon: "🌫️",
    emoji: "🧠", 
    description: "Cloudy conditions that obscure your journey markers", 
    boboGreeting: "Memory Fog is rolling in! Don't worry, I'll be your navigation system and keep you on track!",
    color: "from-gray-400 to-slate-500"
  }
};

const SpeechBubble = ({ children, typing = false }) => (
  <div className="relative bg-light/10 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-light/20 max-w-md">
    <div className={`text-light ${typing ? 'typing-animation' : ''}`}>
      {children}
    </div>
    {/* Speech bubble tail */}
    <div className="absolute -bottom-2 left-8 w-4 h-4 bg-light/10 rotate-45 border-r border-b border-light/20"></div>
  </div>
);

const FrictionTypeSelector = ({ onSelect, selectedHabit }) => {
  const [hoveredObstacle, setHoveredObstacle] = useState(null);
  const [selectedObstacle, setSelectedObstacle] = useState(null);

  const handleObstacleSelect = (obstacleKey) => {
    setSelectedObstacle(obstacleKey);
    onSelect(obstacleKey, JourneyObstacles[obstacleKey]);
  };

  return (
    <div className="friction-selector p-6 space-y-6">
      {/* Bobo Guidance Section */}
      <div className="bobo-guidance flex items-start gap-4 mb-8">
        <div className="flex-shrink-0">
          <RobotMascot 
            emotion="happy" 
            animate={true}
            dance={false}
            size="md"
            className="transform hover:scale-105 transition-transform duration-300"
          />
        </div>
        
        <SpeechBubble typing={true}>
          <p className="text-sm font-medium">
            I see you're facing some obstacles on your journey with <span className="font-bold text-purple-300">{selectedHabit?.name}</span>! 
          </p>
          <p className="text-sm mt-2">
            What kind of challenge is blocking your path today? 🗺️
          </p>
        </SpeechBubble>
      </div>

      {/* Obstacle Selection Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-light mb-2">
          🧭 Choose Your Journey Obstacle
        </h3>
        <p className="text-sm text-light/60">
          Select the challenge you're facing so I can help you navigate through it
        </p>
      </div>

      {/* Obstacle Cards Grid */}
      <div className="obstacle-cards grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(JourneyObstacles).map(([key, obstacle]) => (
          <ObstacleCard
            key={key}
            obstacleKey={key}
            icon={obstacle.icon}
            emoji={obstacle.emoji}
            name={obstacle.name}
            description={obstacle.description}
            color={obstacle.color}
            isSelected={selectedObstacle === key}
            isHovered={hoveredObstacle === key}
            onClick={() => handleObstacleSelect(key)}
            onHover={() => setHoveredObstacle(key)}
            onLeave={() => setHoveredObstacle(null)}
          />
        ))}
      </div>



      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <button
          className="px-6 py-2 bg-light/10 hover:bg-light/20 text-light rounded-lg transition-colors duration-200"
          onClick={() => onSelect(null)}
        >
          ← Back to Habit Details
        </button>
        
        {selectedObstacle && (
          <button
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
            onClick={() => handleObstacleSelect(selectedObstacle)}
          >
            Get Help with {JourneyObstacles[selectedObstacle].name} 🚀
          </button>
        )}
      </div>
    </div>
  );
};

export default FrictionTypeSelector;