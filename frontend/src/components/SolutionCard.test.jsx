import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SolutionCard from './SolutionCard';

describe('SolutionCard', () => {
  const mockSolution = {
    title: 'Remove Distractions',
    description: 'Put your phone in another room and close unnecessary browser tabs',
    action_type: 'environment',
    confidence_score: 0.8,
    action_data: {
      specific: 'details'
    }
  };

  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders solution information correctly', () => {
    render(
      <SolutionCard
        solution={mockSolution}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Remove Distractions')).toBeInTheDocument();
    expect(screen.getByText('Put your phone in another room and close unnecessary browser tabs')).toBeInTheDocument();
    expect(screen.getByText('Environment Change')).toBeInTheDocument();
    expect(screen.getByText('High Confidence')).toBeInTheDocument();
  });

  it('shows selection indicator when selected', () => {
    render(
      <SolutionCard
        solution={mockSolution}
        isSelected={true}
        onSelect={mockOnSelect}
      />
    );

    const checkIcon = screen.getByRole('img', { hidden: true }); // SVG check icon
    expect(checkIcon).toBeInTheDocument();
  });

  it('applies selected styles when isSelected is true', () => {
    render(
      <SolutionCard
        solution={mockSolution}
        isSelected={true}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByText('Remove Distractions').closest('.solution-card');
    expect(card).toHaveClass('border-purple-500');
    expect(card).toHaveClass('scale-105');
  });

  it('calls onSelect when clicked', () => {
    render(
      <SolutionCard
        solution={mockSolution}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByText('Remove Distractions').closest('.solution-card');
    fireEvent.click(card);
    
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('displays correct action icon for different action types', () => {
    const pomodoroSolution = {
      ...mockSolution,
      action_type: 'pomodoro'
    };

    render(
      <SolutionCard
        solution={pomodoroSolution}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('🍅')).toBeInTheDocument();
    expect(screen.getByText('Focus Session')).toBeInTheDocument();
  });

  it('displays confidence score with correct styling', () => {
    const lowConfidenceSolution = {
      ...mockSolution,
      confidence_score: 0.5
    };

    render(
      <SolutionCard
        solution={lowConfidenceSolution}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Worth Trying')).toBeInTheDocument();
  });

  it('displays action data for pomodoro type', () => {
    const pomodoroSolution = {
      ...mockSolution,
      action_type: 'pomodoro',
      action_data: {
        duration: 25
      }
    };

    render(
      <SolutionCard
        solution={pomodoroSolution}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('🍅 25 minute focus session')).toBeInTheDocument();
  });

  it('displays action data for reschedule type', () => {
    const rescheduleSolution = {
      ...mockSolution,
      action_type: 'reschedule',
      action_data: {
        suggested_time: 'morning'
      }
    };

    render(
      <SolutionCard
        solution={rescheduleSolution}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('⏰ Best time: morning')).toBeInTheDocument();
  });

  it('displays action data for breakdown type', () => {
    const breakdownSolution = {
      ...mockSolution,
      action_type: 'breakdown',
      action_data: {
        subtasks: ['Step 1: Prepare', 'Step 2: Start small', 'Step 3: Build up']
      }
    };

    render(
      <SolutionCard
        solution={breakdownSolution}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('🧩 3 smaller steps')).toBeInTheDocument();
    expect(screen.getByText('• Step 1: Prepare')).toBeInTheDocument();
    expect(screen.getByText('• Step 2: Start small')).toBeInTheDocument();
  });

  it('displays action data for reduce type', () => {
    const reduceSolution = {
      ...mockSolution,
      action_type: 'reduce',
      action_data: {
        reduction: 0.5
      }
    };

    render(
      <SolutionCard
        solution={reduceSolution}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('⚡ Reduce by 50%')).toBeInTheDocument();
  });

  it('handles missing action_data gracefully', () => {
    const solutionWithoutData = {
      ...mockSolution,
      action_data: undefined
    };

    render(
      <SolutionCard
        solution={solutionWithoutData}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    // Should still render the card without action data section
    expect(screen.getByText('Remove Distractions')).toBeInTheDocument();
  });

  it('handles missing confidence_score gracefully', () => {
    const solutionWithoutScore = {
      ...mockSolution,
      confidence_score: undefined
    };

    render(
      <SolutionCard
        solution={solutionWithoutScore}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    // Should still render the card without confidence score
    expect(screen.getByText('Remove Distractions')).toBeInTheDocument();
    expect(screen.queryByText('High Confidence')).not.toBeInTheDocument();
  });
});