import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import FrictionActionHandler from './FrictionActionHandler';

// Mock the child components
vi.mock('./PomodoroTimer', () => ({
  default: ({ onComplete, onCancel }) => (
    <div data-testid="pomodoro-timer">
      <button onClick={() => onComplete({ type: 'pomodoro_completed', habitCompleted: true })}>
        Complete Pomodoro
      </button>
      <button onClick={onCancel}>Cancel Pomodoro</button>
    </div>
  )
}));

vi.mock('./HabitRescheduleView', () => ({
  default: ({ onComplete, onCancel }) => (
    <div data-testid="reschedule-view">
      <button onClick={() => onComplete({ type: 'habit_rescheduled', newTime: '08:00' })}>
        Complete Reschedule
      </button>
      <button onClick={onCancel}>Cancel Reschedule</button>
    </div>
  )
}));

vi.mock('./HabitBreakdownConfirm', () => ({
  default: ({ onComplete, onCancel }) => (
    <div data-testid="breakdown-confirm">
      <button onClick={() => onComplete({ type: 'habit_breakdown', subtasks: ['Step 1', 'Step 2'] })}>
        Complete Breakdown
      </button>
      <button onClick={onCancel}>Cancel Breakdown</button>
    </div>
  )
}));

vi.mock('./RobotMascot', () => ({
  default: ({ emotion, dance }) => (
    <div data-testid="robot-mascot" data-emotion={emotion} data-dance={dance}>
      Bobo
    </div>
  )
}));

describe('FrictionActionHandler', () => {
  const mockHabit = {
    id: 1,
    name: 'Test Habit',
    duration: 30,
    days: ['monday', 'tuesday']
  };

  const mockOnComplete = vi.fn();
  const mockOnBack = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Pomodoro Timer Action', () => {
    const pomodoroSolution = {
      title: 'Focus Session',
      description: 'Use a pomodoro timer',
      action_type: 'pomodoro',
      action_data: { duration: 25 }
    };

    it('renders pomodoro confirmation state', () => {
      render(
        <FrictionActionHandler
          solution={pomodoroSolution}
          habit={mockHabit}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('🚀 Ready to Take Action')).toBeInTheDocument();
      expect(screen.getByText('Focus Session')).toBeInTheDocument();
      expect(screen.getByText('25 minute focused work session')).toBeInTheDocument();
      expect(screen.getByText('🚀 Let\'s Do This!')).toBeInTheDocument();
    });

    it('transitions to pomodoro timer when action is executed', async () => {
      render(
        <FrictionActionHandler
          solution={pomodoroSolution}
          habit={mockHabit}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('🚀 Let\'s Do This!'));

      await waitFor(() => {
        expect(screen.getByTestId('pomodoro-timer')).toBeInTheDocument();
      });
    });

    it('handles pomodoro completion', async () => {
      render(
        <FrictionActionHandler
          solution={pomodoroSolution}
          habit={mockHabit}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('🚀 Let\'s Do This!'));
      
      await waitFor(() => {
        expect(screen.getByTestId('pomodoro-timer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Complete Pomodoro'));

      await waitFor(() => {
        expect(screen.getByText('🎉 Fantastic! You\'ve successfully implemented the solution.')).toBeInTheDocument();
        expect(screen.getByText('And you completed your habit too! Amazing work!')).toBeInTheDocument();
      });
    });
  });

  describe('Reschedule Action', () => {
    const rescheduleSolution = {
      title: 'Reschedule Habit',
      description: 'Move to optimal time',
      action_type: 'reschedule',
      action_data: { suggested_time: '08:00' }
    };

    it('renders reschedule confirmation state', () => {
      render(
        <FrictionActionHandler
          solution={rescheduleSolution}
          habit={mockHabit}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Reschedule Habit')).toBeInTheDocument();
      expect(screen.getByText('Optimal time: 08:00')).toBeInTheDocument();
    });

    it('transitions to reschedule view when action is executed', async () => {
      render(
        <FrictionActionHandler
          solution={rescheduleSolution}
          habit={mockHabit}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('🚀 Let\'s Do This!'));

      await waitFor(() => {
        expect(screen.getByTestId('reschedule-view')).toBeInTheDocument();
      });
    });
  });

  describe('Breakdown Action', () => {
    const breakdownSolution = {
      title: 'Break Down Habit',
      description: 'Split into smaller steps',
      action_type: 'breakdown',
      action_data: { subtasks: ['Step 1', 'Step 2', 'Step 3'] }
    };

    it('renders breakdown confirmation state', () => {
      render(
        <FrictionActionHandler
          solution={breakdownSolution}
          habit={mockHabit}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Break Down Habit')).toBeInTheDocument();
      expect(screen.getByText('3 smaller steps')).toBeInTheDocument();
    });

    it('transitions to breakdown view when action is executed', async () => {
      render(
        <FrictionActionHandler
          solution={breakdownSolution}
          habit={mockHabit}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('🚀 Let\'s Do This!'));

      await waitFor(() => {
        expect(screen.getByTestId('breakdown-confirm')).toBeInTheDocument();
      });
    });
  });

  describe('Duration Reduction Action', () => {
    const reduceSolution = {
      title: 'Reduce Duration',
      description: 'Make it shorter',
      action_type: 'reduce',
      action_data: { reduction: 0.5 }
    };

    it('renders duration reduction confirmation', () => {
      render(
        <FrictionActionHandler
          solution={reduceSolution}
          habit={mockHabit}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Reduce Duration')).toBeInTheDocument();
      expect(screen.getByText('Reduce by 50%')).toBeInTheDocument();
      expect(screen.getByText('From 30 minutes to 15 minutes')).toBeInTheDocument();
    });

    it('handles duration reduction execution', async () => {
      render(
        <FrictionActionHandler
          solution={reduceSolution}
          habit={mockHabit}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('🚀 Let\'s Do This!'));

      await waitFor(() => {
        expect(screen.getByText('Solution Implemented!')).toBeInTheDocument();
        expect(screen.getByText(/Habit duration reduced from/)).toBeInTheDocument();
      });
    });
  });

  describe('Environment Action', () => {
    const environmentSolution = {
      title: 'Optimize Environment',
      description: 'Remove distractions',
      action_type: 'environment'
    };

    it('handles environment modification execution', async () => {
      render(
        <FrictionActionHandler
          solution={environmentSolution}
          habit={mockHabit}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('🚀 Let\'s Do This!'));

      await waitFor(() => {
        expect(screen.getByText('Solution Implemented!')).toBeInTheDocument();
        expect(screen.getByText('Environment optimized for success:')).toBeInTheDocument();
      });
    });
  });

  describe('Reminder Action', () => {
    const reminderSolution = {
      title: 'Set Reminder',
      description: 'Add notifications',
      action_type: 'reminder'
    };

    it('handles reminder setup execution', async () => {
      render(
        <FrictionActionHandler
          solution={reminderSolution}
          habit={mockHabit}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('🚀 Let\'s Do This!'));

      await waitFor(() => {
        expect(screen.getByText('Solution Implemented!')).toBeInTheDocument();
        expect(screen.getByText(/Reminder configured:/)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    const testSolution = {
      title: 'Test Solution',
      description: 'Test description',
      action_type: 'environment'
    };

    it('calls onBack when back button is clicked', () => {
      render(
        <FrictionActionHandler
          solution={testSolution}
          habit={mockHabit}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('← Choose Different Solution'));
      expect(mockOnBack).toHaveBeenCalled();
    });

    it('calls onComplete when final complete button is clicked', async () => {
      render(
        <FrictionActionHandler
          solution={testSolution}
          habit={mockHabit}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('🚀 Let\'s Do This!'));

      await waitFor(() => {
        expect(screen.getByText('✓ Continue with Habit')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('✓ Continue with Habit'));
      expect(mockOnComplete).toHaveBeenCalledWith({
        solution: testSolution,
        executionData: expect.any(Object),
        habitCompleted: false
      });
    });
  });

  describe('Bobo Integration', () => {
    const testSolution = {
      title: 'Test Solution',
      description: 'Test description',
      action_type: 'environment'
    };

    it('shows appropriate Bobo emotions and messages', () => {
      render(
        <FrictionActionHandler
          solution={testSolution}
          habit={mockHabit}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      const bobo = screen.getByTestId('robot-mascot');
      expect(bobo).toHaveAttribute('data-emotion', 'excited');
      expect(screen.getByText(/Great choice! This solution has helped many adventurers/)).toBeInTheDocument();
    });

    it('shows celebration when action is completed', async () => {
      render(
        <FrictionActionHandler
          solution={testSolution}
          habit={mockHabit}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('🚀 Let\'s Do This!'));

      await waitFor(() => {
        const bobo = screen.getByTestId('robot-mascot');
        expect(bobo).toHaveAttribute('data-dance', 'true');
        expect(screen.getByText(/Fantastic! You've successfully implemented the solution/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing action data gracefully', () => {
      const solutionWithoutData = {
        title: 'Test Solution',
        description: 'Test description',
        action_type: 'pomodoro'
        // No action_data
      };

      render(
        <FrictionActionHandler
          solution={solutionWithoutData}
          habit={mockHabit}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Test Solution')).toBeInTheDocument();
      // Should use default duration for pomodoro
      expect(screen.getByText('25 minute focused work session')).toBeInTheDocument();
    });

    it('handles unknown action types', async () => {
      const unknownSolution = {
        title: 'Unknown Solution',
        description: 'Unknown action type',
        action_type: 'unknown_type'
      };

      render(
        <FrictionActionHandler
          solution={unknownSolution}
          habit={mockHabit}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('🚀 Let\'s Do This!'));

      await waitFor(() => {
        expect(screen.getByText('Solution Implemented!')).toBeInTheDocument();
      });
    });
  });
});