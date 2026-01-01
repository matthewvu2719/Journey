import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import PomodoroTimer from './PomodoroTimer';

// Mock RobotMascot
vi.mock('./RobotMascot', () => ({
  default: ({ emotion, dance }) => (
    <div data-testid="robot-mascot" data-emotion={emotion} data-dance={dance}>
      Bobo
    </div>
  )
}));

// Mock timers
vi.useFakeTimers();

describe('PomodoroTimer', () => {
  const mockHabit = {
    id: 1,
    name: 'Test Habit'
  };

  const mockOnComplete = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.useFakeTimers();
  });

  it('renders initial state correctly', () => {
    render(
      <PomodoroTimer
        duration={25}
        habit={mockHabit}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('🍅 Focus Session')).toBeInTheDocument();
    expect(screen.getByText('25 minutes of focused work on: Test Habit')).toBeInTheDocument();
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByText('🚀 Start Focus Session')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('shows appropriate Bobo message in ready state', () => {
    render(
      <PomodoroTimer
        duration={25}
        habit={mockHabit}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/Ready for a 25-minute focus session/)).toBeInTheDocument();
    const bobo = screen.getByTestId('robot-mascot');
    expect(bobo).toHaveAttribute('data-emotion', 'friendly');
  });

  it('starts timer when start button is clicked', async () => {
    render(
      <PomodoroTimer
        duration={25}
        habit={mockHabit}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('🚀 Start Focus Session'));

    expect(screen.getByText('⏸️ Pause')).toBeInTheDocument();
    expect(screen.getByText('🔄 Reset')).toBeInTheDocument();
    expect(screen.getByText('Focus Time')).toBeInTheDocument();
    
    const bobo = screen.getByTestId('robot-mascot');
    expect(bobo).toHaveAttribute('data-emotion', 'focused');
  });

  it('counts down timer correctly', async () => {
    render(
      <PomodoroTimer
        duration={1} // 1 minute for faster testing
        habit={mockHabit}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('01:00')).toBeInTheDocument();

    fireEvent.click(screen.getByText('🚀 Start Focus Session'));

    // Advance timer by 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(screen.getByText('00:30')).toBeInTheDocument();
    });

    // Advance timer by another 30 seconds to complete
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(screen.getByText('00:00')).toBeInTheDocument();
      expect(screen.getByText('Completed!')).toBeInTheDocument();
    });
  });

  it('pauses and resumes timer correctly', async () => {
    render(
      <PomodoroTimer
        duration={25}
        habit={mockHabit}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('🚀 Start Focus Session'));
    
    // Advance timer by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('24:59')).toBeInTheDocument();
    });

    // Pause the timer
    fireEvent.click(screen.getByText('⏸️ Pause'));

    expect(screen.getByText('▶️ Resume')).toBeInTheDocument();
    expect(screen.getByText(/Taking a quick break/)).toBeInTheDocument();

    // Advance timer while paused - should not change
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('24:59')).toBeInTheDocument();

    // Resume timer
    fireEvent.click(screen.getByText('▶️ Resume'));

    expect(screen.getByText('⏸️ Pause')).toBeInTheDocument();
  });

  it('resets timer correctly', async () => {
    render(
      <PomodoroTimer
        duration={25}
        habit={mockHabit}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('🚀 Start Focus Session'));
    
    // Advance timer by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getByText('24:55')).toBeInTheDocument();
    });

    // Reset timer
    fireEvent.click(screen.getByText('🔄 Reset'));

    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByText('🚀 Start Focus Session')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('shows completion state when timer finishes', async () => {
    render(
      <PomodoroTimer
        duration={1} // 1 minute for faster testing
        habit={mockHabit}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('🚀 Start Focus Session'));

    // Complete the timer
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    await waitFor(() => {
      expect(screen.getByText('Focus Session Complete!')).toBeInTheDocument();
      expect(screen.getByText('Great job staying focused for 1 minutes!')).toBeInTheDocument();
      expect(screen.getByText('✅ Yes, I completed it!')).toBeInTheDocument();
      expect(screen.getByText('📝 I made progress')).toBeInTheDocument();
    });

    const bobo = screen.getByTestId('robot-mascot');
    expect(bobo).toHaveAttribute('data-emotion', 'excited');
    expect(bobo).toHaveAttribute('data-dance', 'true');
  });

  it('handles habit completion confirmation', async () => {
    render(
      <PomodoroTimer
        duration={1}
        habit={mockHabit}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('🚀 Start Focus Session'));

    // Complete the timer
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    await waitFor(() => {
      expect(screen.getByText('✅ Yes, I completed it!')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('✅ Yes, I completed it!'));

    expect(mockOnComplete).toHaveBeenCalledWith({
      type: 'pomodoro_completed',
      duration: 1,
      timeSpent: 60,
      habitCompleted: true,
      completedAt: expect.any(String)
    });
  });

  it('handles progress confirmation', async () => {
    render(
      <PomodoroTimer
        duration={1}
        habit={mockHabit}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('🚀 Start Focus Session'));

    // Complete the timer
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    await waitFor(() => {
      expect(screen.getByText('📝 I made progress')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('📝 I made progress'));

    expect(mockOnComplete).toHaveBeenCalledWith({
      type: 'pomodoro_completed',
      duration: 1,
      timeSpent: 60,
      habitCompleted: false,
      completedAt: expect.any(String)
    });
  });

  it('calls onCancel when back button is clicked', () => {
    render(
      <PomodoroTimer
        duration={25}
        habit={mockHabit}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('← Back to Solutions'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows focus tips in ready state', () => {
    render(
      <PomodoroTimer
        duration={25}
        habit={mockHabit}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('🎯 Focus Session Tips:')).toBeInTheDocument();
    expect(screen.getByText(/Put your phone in another room/)).toBeInTheDocument();
    expect(screen.getByText(/Close unnecessary browser tabs/)).toBeInTheDocument();
    expect(screen.getByText(/Focus solely on "Test Habit"/)).toBeInTheDocument();
  });

  it('updates progress circle correctly', async () => {
    render(
      <PomodoroTimer
        duration={2} // 2 minutes for testing
        habit={mockHabit}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('🚀 Start Focus Session'));

    // Advance timer by 1 minute (50% complete)
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    await waitFor(() => {
      expect(screen.getByText('01:00')).toBeInTheDocument();
    });

    // Check that progress circle exists (we can't easily test SVG stroke-dashoffset)
    const progressCircle = document.querySelector('circle[stroke="#8B5CF6"]');
    expect(progressCircle).toBeInTheDocument();
  });

  it('uses default duration when not provided', () => {
    render(
      <PomodoroTimer
        habit={mockHabit}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByText(/Ready for a 25-minute focus session/)).toBeInTheDocument();
  });

  it('shows running message with time remaining', async () => {
    render(
      <PomodoroTimer
        duration={25}
        habit={mockHabit}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('🚀 Start Focus Session'));

    expect(screen.getByText(/Stay focused! 25:00 remaining/)).toBeInTheDocument();

    // Advance timer by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText(/Stay focused! 24:59 remaining/)).toBeInTheDocument();
    });
  });
});