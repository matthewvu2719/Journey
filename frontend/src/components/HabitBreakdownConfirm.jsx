import React, { useState } from 'react';
import RobotMascot from './RobotMascot';
import { api } from '../services/api';

// Helper function to generate default subtasks based on habit
function generateDefaultSubtasks(habit) {
  // Generate smart default subtasks based on habit name and type
  const habitName = habit.name.toLowerCase();
  
  if (habitName.includes('exercise') || habitName.includes('workout')) {
    return [
      'Put on workout clothes',
      'Do 5-minute warm-up',
      'Complete main exercise routine',
      'Cool down and stretch'
    ];
  }
  
  if (habitName.includes('read') || habitName.includes('book')) {
    return [
      'Find a quiet reading spot',
      'Open book to current page',
      'Read for 10 minutes',
      'Mark progress and close book'
    ];
  }
  
  if (habitName.includes('meditat')) {
    return [
      'Find comfortable sitting position',
      'Set timer for meditation',
      'Focus on breathing',
      'Reflect on the session'
    ];
  }
  
  if (habitName.includes('write') || habitName.includes('journal')) {
    return [
      'Open journal or writing app',
      'Write one paragraph',
      'Review what you wrote',
      'Save and close'
    ];
  }
  
  // Generic breakdown
  return [
    `Prepare for ${habit.name}`,
    `Start ${habit.name} (5 minutes)`,
    `Continue ${habit.name}`,
    `Complete and review ${habit.name}`
  ];
}

const HabitBreakdownConfirm = ({ 
  habit, 
  subtasks = [], 
  onComplete, 
  onCancel 
}) => {
  // Normalize subtasks - they can be strings or objects with title/name
  const normalizeSubtasks = (tasks) => {
    if (!tasks || tasks.length === 0) return generateDefaultSubtasks(habit);
    return tasks.map(task => {
      if (typeof task === 'string') return task;
      return task.title || task.name || 'Step';
    });
  };

  const [editableSubtasks, setEditableSubtasks] = useState(
    normalizeSubtasks(subtasks)
  );
  const [newSubtask, setNewSubtask] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  const handleSubtaskEdit = (index, newValue) => {
    const updated = [...editableSubtasks];
    updated[index] = newValue;
    setEditableSubtasks(updated);
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setEditableSubtasks([...editableSubtasks, newSubtask.trim()]);
      setNewSubtask('');
    }
  };

  const handleRemoveSubtask = (index) => {
    setEditableSubtasks(editableSubtasks.filter((_, i) => i !== index));
  };

  const handleMoveSubtask = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= editableSubtasks.length) return;
    
    const updated = [...editableSubtasks];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setEditableSubtasks(updated);
  };

  const handleConfirmBreakdown = async () => {
    if (editableSubtasks.length === 0) return;
    
    setIsCreating(true);
    setError(null);
    
    try {
      // Call the API to create the breakdown
      const breakdown = await api.createHabitBreakdown(
        habit.id,
        editableSubtasks,
        false // Don't preserve original by default
      );
      
      if (onComplete) {
        onComplete({
          type: 'habit_breakdown',
          originalHabit: habit,
          subtasks: editableSubtasks,
          totalSteps: editableSubtasks.length,
          estimatedTimePerStep: Math.ceil((habit.duration || 30) / editableSubtasks.length),
          createdAt: new Date().toISOString(),
          breakdownSessionId: breakdown.breakdown_session_id,
          //subtaskIds: breakdown.subtask_ids,
          canRollback: breakdown.can_rollback,
          obstacleOvercome: true, // Mark obstacle as overcome when breakdown is created
          executionData: {
            breakdownCreated: true,
            obstacleOvercome: true,
            subtaskCount: editableSubtasks.length,
            breakdownSessionId: breakdown.breakdown_session_id
          }
        });
      }
    } catch (error) {
      console.error('Error creating habit breakdown:', error);
      setError('Failed to create habit breakdown. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const getTotalEstimatedTime = () => {
    return Math.ceil((habit.duration || 30) / editableSubtasks.length);
  };

  return (
    <div className="habit-breakdown-confirm p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-light mb-2 flex items-center justify-center gap-2">
          🧩 Break Down Your Habit
        </h3>
        <p className="text-sm text-light/60">
          Split "<strong>{habit.name}</strong>" into smaller, manageable steps
        </p>
      </div>

      {/* Bobo Guidance */}
      <div className="bobo-guidance flex items-start gap-4 mb-8">
        <div className="flex-shrink-0">
          <RobotMascot 
            size="lg" 
            emotion="friendly" 
            animate={true}
          />
        </div>
        
        <div className="flex-1">
          <div className="bg-light/10 rounded-2xl p-4 relative">
            <div className="absolute -top-2 left-8 w-4 h-4 bg-light/10 rotate-45"></div>
            <div className="text-light">
              🎯 Breaking habits into smaller steps makes them much easier to start! 
              Each step should take about {getTotalEstimatedTime()} minutes. 
              You can edit these steps to match your preferences.
            </div>
          </div>
        </div>
      </div>

      {/* Original Habit Info */}
      <div className="original-habit bg-light/5 rounded-xl p-4 border border-light/10">
        <h4 className="font-medium text-light mb-2">📋 Original Habit:</h4>
        <div className="flex items-center gap-4 text-sm text-light/70">
          <span>📝 {habit.name}</span>
          <span>⏱️ {habit.duration || 30} minutes</span>
          <span>📅 {habit.days?.join(', ') || 'Daily'}</span>
        </div>
      </div>

      {/* Subtasks List */}
      <div className="subtasks-section">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-light">🧩 Breakdown Steps:</h4>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            {isEditing ? '✓ Done Editing' : '✏️ Edit Steps'}
          </button>
        </div>
        
        <div className="space-y-3">
          {editableSubtasks.map((subtask, index) => (
            <div
              key={index}
              className="subtask-item bg-light/5 rounded-lg p-4 border border-light/10 group"
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full flex-shrink-0 mt-1">
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={subtask}
                      onChange={(e) => handleSubtaskEdit(index, e.target.value)}
                      className="w-full bg-darker border border-light/20 rounded px-3 py-2 text-light focus:border-purple-500 focus:outline-none"
                    />
                  ) : (
                    <p className="text-light">{subtask}</p>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2 text-xs text-light/60">
                    <span>⏱️ ~{getTotalEstimatedTime()} min</span>
                    <span>•</span>
                    <span>Step {index + 1} of {editableSubtasks.length}</span>
                  </div>
                </div>
                
                {isEditing && (
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleMoveSubtask(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-light/60 hover:text-light disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveSubtask(index, 'down')}
                      disabled={index === editableSubtasks.length - 1}
                      className="p-1 text-light/60 hover:text-light disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleRemoveSubtask(index)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Add New Subtask */}
        {isEditing && (
          <div className="add-subtask mt-4 p-4 border-2 border-dashed border-light/20 rounded-lg">
            <div className="flex gap-3">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add a new step..."
                className="flex-1 bg-darker border border-light/20 rounded px-3 py-2 text-light focus:border-purple-500 focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
              />
              <button
                onClick={handleAddSubtask}
                disabled={!newSubtask.trim()}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Breakdown Benefits */}
      <div className="breakdown-benefits bg-green-500/10 rounded-xl p-4 border border-green-500/20">
        <h5 className="font-medium text-green-300 mb-3">✨ Benefits of Breaking Down:</h5>
        <ul className="text-sm text-green-300/80 space-y-1">
          <li>• Each step takes only ~{getTotalEstimatedTime()} minutes</li>
          <li>• Easier to start when you only focus on step 1</li>
          <li>• Clear progress tracking through each step</li>
          <li>• Can stop after any step and still feel accomplished</li>
          <li>• Builds momentum as you complete each piece</li>
        </ul>
      </div>

      {/* Implementation Preview */}
      <div className="implementation-preview bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
        <h5 className="font-medium text-blue-300 mb-3">🚀 How This Will Work:</h5>
        <div className="text-sm text-blue-300/80 space-y-2">
          <p>1. Your original habit "{habit.name}" will be replaced with these {editableSubtasks.length} smaller habits</p>
          <p>2. Each step becomes a separate, trackable habit</p>
          <p>3. You can complete them all at once or spread throughout the day</p>
          <p>4. Progress is tracked for each individual step</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error bg-red-500/10 rounded-xl p-4 border border-red-500/20">
          <div className="flex items-start gap-3">
            <span className="text-red-400 text-lg">❌</span>
            <div className="text-sm text-red-300/80">
              <strong>Error:</strong> {error}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={onCancel}
          disabled={isCreating}
          className="px-6 py-2 bg-light/10 text-light rounded-lg hover:bg-light/20 transition-colors disabled:opacity-50"
        >
          ← Back to Solutions
        </button>
        
        <button
          onClick={handleConfirmBreakdown}
          disabled={editableSubtasks.length === 0 || isCreating}
          className={`
            px-8 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg
            ${editableSubtasks.length > 0 && !isCreating
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
              : 'bg-light/10 text-light/50 cursor-not-allowed'
            }
          `}
        >
          {isCreating ? (
            <>
              <div className="inline-block animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full mr-2"></div>
              Creating Breakdown...
            </>
          ) : (
            <>🧩 Break Down Habit ({editableSubtasks.length} steps)</>
          )}
        </button>
      </div>

      {/* Warning */}
      <div className="warning bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
        <div className="flex items-start gap-3">
          <span className="text-yellow-400 text-lg">⚠️</span>
          <div className="text-sm text-yellow-300/80">
            <strong>Note:</strong> This will replace your current habit with {editableSubtasks.length} separate habits. 
            You can always merge them back together later if needed.
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitBreakdownConfirm;