import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import HabitBreakdownConfirm from './HabitBreakdownConfirm';
import { api } from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
  api: {
    createHabitBreakdown: vi.fn()
  }
}));

// Mock RobotMascot
vi.mock('./RobotMascot', () => ({
  default: ({ emotion }) => (
    <div data-testid="robot-mascot" data-emotion={emotion}>
      Bobo
    </div>
  )
}));

describe('HabitBreakdownConfirm', () => {
  const mockHabit = {
    id: 1,
    name: 'Morning Exercise',
    duration: 30,
    category: 'Health',
    days: ['monday', 'tuesday', 'wednesday']
  };

  const mockOnComplete = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with default subtasks for exercise habit', () => {
      render(
        <HabitBreakdownConfirm
          habit={mockHabit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('🧩 Break Down Your Habit')).toBeInTheDocument();
      expect(screen.getByText('Split "Morning Exercise" into smaller, manageable steps')).toBeInTheDocument();
      
      // Should generate exercise-specific subtasks
      expect(screen.getByText('Put on workout clothes')).toBeInTheDocument();
      expect(screen.getByText('Do 5-minute warm-up')).toBeInTheDocument();
      expect(screen.getByText('Complete main exercise routine')).toBeInTheDocument();
      expect(screen.getByText('Cool down and stretch')).toBeInTheDocument();
    });

    it('renders with provided subtasks', () => {
      const customSubtasks = ['Custom Step 1', 'Custom Step 2'];
      
      render(
        <HabitBreakdownConfirm
          habit={mockHabit}
          subtasks={customSubtasks}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Custom Step 1')).toBeInTheDocument();
      expect(screen.getByText('Custom Step 2')).toBeInTheDocument();
    });

    it('shows correct time estimation', () => {
      render(
        <HabitBreakdownConfirm
          habit={mockHabit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // 30 minutes / 4 steps = 8 minutes per step (rounded up)
      expect(screen.getByText('~8 min')).toBeInTheDocument();
    });

    it('displays Bobo with appropriate guidance', () => {
      render(
        <HabitBreakdownConfirm
          habit={mockHabit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('robot-mascot')).toBeInTheDocument();
      expect(screen.getByText(/Breaking habits into smaller steps makes them much easier to start/)).toBeInTheDocument();
    });
  });

  describe('Subtask Generation', () => {
    it('generates reading-specific subtasks', () => {
      const readingHabit = { ...mockHabit, name: 'Daily Reading' };
      
      render(
        <HabitBreakdownConfirm
          habit={readingHabit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Find a quiet reading spot')).toBeInTheDocument();
      expect(screen.getByText('Open book to current page')).toBeInTheDocument();
      expect(screen.getByText('Read for 10 minutes')).toBeInTheDocument();
    });

    it('generates meditation-specific subtasks', () => {
      const meditationHabit = { ...mockHabit, name: 'Morning Meditation' };
      
      render(
        <HabitBreakdownConfirm
          habit={meditationHabit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Find comfortable sitting position')).toBeInTheDocument();
      expect(screen.getByText('Set timer for meditation')).toBeInTheDocument();
      expect(screen.getByText('Focus on breathing')).toBeInTheDocument();
    });

    it('generates writing-specific subtasks', () => {
      const writingHabit = { ...mockHabit, name: 'Journal Writing' };
      
      render(
        <HabitBreakdownConfirm
          habit={writingHabit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Open journal or writing app')).toBeInTheDocument();
      expect(screen.getByText('Write one paragraph')).toBeInTheDocument();
    });

    it('generates generic subtasks for unknown habit types', () => {
      const genericHabit = { ...mockHabit, name: 'Unknown Activity' };
      
      render(
        <HabitBreakdownConfirm
          habit={genericHabit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Prepare for Unknown Activity')).toBeInTheDocument();
      expect(screen.getByText('Start Unknown Activity (5 minutes)')).toBeInTheDocument();
    });
  });

  describe('Editing Functionality', () => {
    it('enables editing mode', () => {
      render(
        <HabitBreakdownConfirm
          habit={mockHabit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('✏️ Edit Steps'));
      
      // Should show input fields for editing
      const inputs = screen.getAllByDisplayValue(/Put on workout clothes|Do 5-minute warm-up/);
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('allows adding new subtasks', () => {
      render(
        <HabitBreakdownConfirm
          habit={mockHabit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('✏️ Edit Steps'));
      
      const addInput = screen.getByPlaceholderText('Add a new step...');
      fireEvent.change(addInput, { target: { value: 'New custom step' } });
      fireEvent.click(screen.getByText('+ Add'));

      expect(screen.getByText('New custom step')).toBeInTheDocument();
    });

    it('allows removing subtasks', () => {
      render(
        <HabitBreakdownConfirm
          habit={mockHabit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('✏️ Edit Steps'));
      
      // Find and click remove button (×)
      const removeButtons = screen.getAllByText('×');
      fireEvent.click(removeButtons[0]);

      // Should have one less subtask
      const stepNumbers = screen.getAllByText(/Step \d+ of/);
      expect(stepNumbers.length).toBe(3); // Originally 4, now 3
    });

    it('allows reordering subtasks', () => {
      render(
        <HabitBreakdownConfirm
          habit={mockHabit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('✏️ Edit Steps'));
      
      // Find move up/down buttons
      const upButtons = screen.getAllByText('↑');
      const downButtons = screen.getAllByText('↓');
      
      expect(upButtons.length).toBeGreaterThan(0);
      expect(downButtons.length).toBeGreaterThan(0);
    });
  });

  describe('API Integration', () => {
    it('calls API when breakdown is confirmed', async () => {
      const mockBreakdownResponse = {
        breakdown_session_id: 'test-session-123',
        subtask_ids: [10, 11, 12, 13],
        can_rollback: true
      };
      
      api.createHabitBreakdown.mockResolvedValue(mockBreakdownResponse);

      render(
        <HabitBreakdownConfirm
          habit={mockHabit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText(/🧩 Break Down Habit/));

      await waitFor(() => {
        expect(api.createHabitBreakdown).toHaveBeenCalledWith(
          1, // habit ID
          [
            'Put on workout clothes',
            'Do 5-minute warm-up',
            'Complete main exercise routine',
            'Cool down and stretch'
          ],
          false // preserve original
        );
      });

      expect(mockOnComplete).toHaveBeenCalledWith({
        type: 'habit_breakdown',
        originalHabit: mockHabit,
        subtasks: expect.any(Array),
        totalSteps: 4,
        estimatedTimePerStep: 8,
        createdAt: expect.any(String),
        breakdownSessionId: 'test-session-123',
        subtaskIds: [10, 11, 12, 13],
        canRollback: true
      });
    });

    it('shows loading state during API call', async () => {
      api.createHabitBreakdown.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <HabitBreakdownConfirm
          habit={mockHabit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText(/🧩 Break Down Habit/));

      expect(screen.getByText('Creating Breakdown...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Creating Breakdown/ })).toBeDisabled();
    });

    it('handles API errors gracefully', async () => {
      api.createHabitBreakdown.mockRejectedValue(new Error('API Error'));

      render(
        <HabitBreakdownConfirm
          habit={mockHabit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText(/🧩 Break Down Habit/));

      await waitFor(() => {
        expect(screen.getByText('Failed to create habit breakdown. Please try again.')).toBeInTheDocument();
      });

      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('disables button when no subtasks', () => {
      render(
        <HabitBreakdownConfirm
          habit={mockHabit}
          subtasks={[]}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const breakdownButton = screen.getByText(/🧩 Break Down Habit/);
      expect(breakdownButton).toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('calls onCancel when back button is clicked', () => {
      render(
        <HabitBreakdownConfirm
          habit={mockHabit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('← Back to Solutions'));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('shows breakdown benefits', () => {
      render(
        <HabitBreakdownConfirm
          habit={mockHabit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('✨ Benefits of Breaking Down:')).toBeInTheDocument();
      expect(screen.getByText(/Each step takes only ~8 minutes/)).toBeInTheDocument();
      expect(screen.getByText(/Easier to start when you only focus on step 1/)).toBeInTheDocument();
    });

    it('shows implementation preview', () => {
      render(
        <HabitBreakdownConfirm
          habit={mockHabit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('🚀 How This Will Work:')).toBeInTheDocument();
      expect(screen.getByText(/Your original habit "Morning Exercise" will be replaced with these 4 smaller habits/)).toBeInTheDocument();
    });

    it('shows warning about replacement', () => {
      render(
        <HabitBreakdownConfirm
          habit={mockHabit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('⚠️')).toBeInTheDocument();
      expect(screen.getByText(/This will replace your current habit with 4 separate habits/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles habit without duration', () => {
      const habitWithoutDuration = { ...mockHabit, duration: undefined };
      
      render(
        <HabitBreakdownConfirm
          habit={habitWithoutDuration}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Should use default 30 minutes
      expect(screen.getByText('~8 min')).toBeInTheDocument(); // 30/4 = 7.5, rounded up to 8
    });

    it('handles very short duration', () => {
      const shortHabit = { ...mockHabit, duration: 8 };
      
      render(
        <HabitBreakdownConfirm
          habit={shortHabit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Should show minimum time per step
      expect(screen.getByText('~2 min')).toBeInTheDocument(); // 8/4 = 2
    });

    it('handles single subtask', () => {
      render(
        <HabitBreakdownConfirm
          habit={mockHabit}
          subtasks={['Only one step']}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Only one step')).toBeInTheDocument();
      expect(screen.getByText(/Break Down Habit \(1 steps\)/)).toBeInTheDocument();
    });
  });
});