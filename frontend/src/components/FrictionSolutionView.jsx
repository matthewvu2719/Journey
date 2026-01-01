import React, { useState, useEffect } from 'react';
import RobotMascot from './RobotMascot';
import SolutionCard from './SolutionCard';
import { api } from '../services/api';

const FrictionSolutionView = ({ 
  habit, 
  frictionType, 
  frictionData, 
  onBack, 
  onSolutionSelect 
}) => {
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [boboMessage, setBoboMessage] = useState('');
  const [selectedSolution, setSelectedSolution] = useState(null);
  const [typingComplete, setTypingComplete] = useState(false);

  useEffect(() => {
    if (habit && frictionType) {
      generateSolutions();
    }
  }, [habit, frictionType]);

  // Map frontend friction type keys to backend enum values
  const mapFrictionType = (frontendType) => {
    const mapping = {
      'distraction': 'distraction',
      'lowEnergy': 'low-energy',
      'complexity': 'complexity',
      'forgetfulness': 'forgetfulness'
    };
    return mapping[frontendType] || frontendType;
  };

  const generateSolutions = async () => {
    try {
      setLoading(true);
      setError(null);
      setTypingComplete(false);
      
      // Call the friction helper API
      const response = await api.getFrictionHelp(habit.id, {
        friction_type: mapFrictionType(frictionType),
        additional_context: `User is struggling with ${frictionType} when trying to do ${habit.name}`
      });

      setSolutions(response.solutions || []);
      setBoboMessage(response.bobo_message || frictionData?.boboGreeting || "Let me help you overcome this obstacle!");
      
      // Start typing animation
      setTimeout(() => {
        setTypingComplete(true);
      }, 2000);

    } catch (err) {
      console.error('Error generating friction solutions:', err);
      setError('Failed to generate solutions. Please try again.');
      
      // Fallback solutions
      setSolutions(getFallbackSolutions(frictionType));
      setBoboMessage(frictionData?.boboGreeting || "I'm here to help you overcome this obstacle!");
      setTypingComplete(true);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackSolutions = (type) => {
    // Use mapped type for fallback solutions
    const mappedType = mapFrictionType(type);
    
    const fallbackSolutions = {
      distraction: [
        {
          title: "Remove Distractions",
          description: "Put your phone in another room and close unnecessary browser tabs",
          action_type: "environment",
          confidence_score: 0.8
        },
        {
          title: "Use Focus Timer",
          description: "Try a 25-minute focused session with breaks",
          action_type: "pomodoro",
          action_data: { duration: 25 },
          confidence_score: 0.9
        }
      ],
      'low-energy': [
        {
          title: "Reschedule to Peak Time",
          description: "Move this habit to when you have more energy",
          action_type: "reschedule",
          confidence_score: 0.8
        },
        {
          title: "Try Shorter Version",
          description: "Reduce the duration by half to make it easier",
          action_type: "reduce",
          action_data: { reduction: 0.5 },
          confidence_score: 0.7
        }
      ],
      complexity: [
        {
          title: "Break Into Steps",
          description: "Split this habit into smaller, manageable tasks",
          action_type: "breakdown",
          confidence_score: 0.9
        }
      ],
      forgetfulness: [
        {
          title: "Set Reminders",
          description: "Use phone notifications or calendar alerts",
          action_type: "reminder",
          confidence_score: 0.8
        }
      ]
    };

    return fallbackSolutions[mappedType] || [];
  };

  const handleSolutionSelect = (solution) => {
    setSelectedSolution(solution);
    if (onSolutionSelect) {
      onSolutionSelect(solution);
    }
  };

  const handleTryDifferentApproach = () => {
    generateSolutions();
  };

  if (loading) {
    return (
      <div className="friction-solution-view p-6 text-center">
        <div className="mb-8">
          <RobotMascot 
            size="lg" 
            emotion="excited" 
            animate={true}
            dance={true}
          />
          <div className="mt-4">
            <div className="bg-light/10 rounded-2xl p-4 relative inline-block">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-light/10 rotate-45"></div>
              <p className="text-light">
                🤔 Let me think of the best solutions for you...
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin w-8 h-8 border-2 border-light/20 border-t-purple-500 rounded-full"></div>
          <p className="text-light/70">Generating personalized solutions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="friction-solution-view p-6 text-center">
        <div className="mb-8">
          <RobotMascot 
            size="lg" 
            emotion="friendly" 
            animate={true}
          />
          <div className="mt-4">
            <div className="bg-red-500/10 rounded-2xl p-4 relative inline-block border border-red-500/20">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-500/10 rotate-45 border-r border-b border-red-500/20"></div>
              <p className="text-red-300">
                {error}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleTryDifferentApproach}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            🔄 Try Again
          </button>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-light/10 text-light rounded-lg hover:bg-light/20 transition-colors"
          >
            ← Back to Obstacles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="friction-solution-view p-6 space-y-6">
      {/* Bobo Helper Section */}
      <div className="bobo-helper flex items-start gap-4 mb-8">
        <div className="flex-shrink-0">
          <RobotMascot 
            size="lg" 
            emotion="excited" 
            animate={true}
            dance={false}
          />
        </div>
        
        <div className="flex-1">
          <div className="bg-light/10 rounded-2xl p-4 relative">
            <div className="absolute -top-2 left-8 w-4 h-4 bg-light/10 rotate-45 border-r border-b border-light/20"></div>
            <div className={`text-light ${!typingComplete ? 'typing-animation' : ''}`}>
              {boboMessage}
            </div>
          </div>
        </div>
      </div>

      {/* Solutions Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-light mb-2 flex items-center justify-center gap-2">
          🗺️ Navigation Solutions
          <span className="text-sm font-normal text-light/60">
            for {frictionData?.name}
          </span>
        </h3>
        <p className="text-sm text-light/60">
          Choose a solution that feels right for your current situation
        </p>
      </div>

      {/* Solutions List */}
      {solutions.length > 0 ? (
        <div className="solutions-list space-y-4">
          {solutions.map((solution, index) => (
            <SolutionCard
              key={index}
              solution={solution}
              isSelected={selectedSolution?.title === solution.title}
              onSelect={() => handleSolutionSelect(solution)}
              delay={index * 200} // Stagger animation
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-light/60 mb-4">No solutions generated yet.</p>
          <button
            onClick={handleTryDifferentApproach}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            🔄 Generate Solutions
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-light/10 text-light rounded-lg hover:bg-light/20 transition-colors"
        >
          ← Choose Different Obstacle
        </button>
        
        <button
          onClick={handleTryDifferentApproach}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          🔄 Try Different Approach
        </button>
        
        {selectedSolution && (
          <button
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
            onClick={() => handleSolutionSelect(selectedSolution)}
          >
            🚀 Try This Solution
          </button>
        )}
      </div>
    </div>
  );
};

export default FrictionSolutionView;