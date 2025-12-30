import React from 'react';

const ObstacleCard = ({ 
  obstacleKey,
  icon, 
  emoji,
  name, 
  description, 
  color,
  isSelected, 
  isHovered,
  onClick, 
  onHover, 
  onLeave 
}) => {
  return (
    <div
      className={`
        obstacle-card relative cursor-pointer p-6 rounded-xl border-2 transition-all duration-300 transform
        ${isSelected 
          ? 'border-purple-500 bg-gradient-to-br from-purple-500/20 to-pink-500/20 scale-105 shadow-xl' 
          : isHovered
            ? 'border-purple-400/50 bg-gradient-to-br from-light/5 to-purple-500/10 scale-102 shadow-lg'
            : 'border-light/20 bg-light/5 hover:border-light/30 hover:shadow-md'
        }
      `}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Card Header with Icons */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`
          flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${color} text-white text-xl
          ${isHovered || isSelected ? 'animate-pulse' : ''}
        `}>
          {icon}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`
              font-bold text-lg transition-colors duration-200
              ${isSelected ? 'text-purple-300' : 'text-light'}
            `}>
              {name}
            </h4>
            <span className="text-lg">{emoji}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className={`
        text-sm leading-relaxed transition-colors duration-200
        ${isSelected ? 'text-purple-200' : 'text-light/70'}
      `}>
        {description}
      </p>

      {/* Hover Effect Overlay */}
      <div className={`
        absolute inset-0 rounded-xl bg-gradient-to-br ${color} opacity-0 transition-opacity duration-300
        ${isHovered && !isSelected ? 'opacity-5' : ''}
      `} />

      {/* Journey-themed decorative elements */}
      {isSelected && (
        <div className="absolute bottom-2 right-2 opacity-20">
          <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Animated border for hover state */}
      {isHovered && !isSelected && (
        <div className="absolute inset-0 rounded-xl border-2 border-purple-400/50 animate-pulse" />
      )}
    </div>
  );
};

export default ObstacleCard;