import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FrictionTypeSelector from './FrictionTypeSelector';

// Mock the RobotMascot component
vi.mock('./RobotMascot', () => ({
  default: ({ size, emotion, animate, className }) => (
    <div data-testid="robot-mascot" data-size={size} data-emotion={emotion} data-animate={animate} className={className}>
      Mocked Robot Mascot
    </div>
  )
}));

describe('FrictionTypeSelector', () => {
  const mockOnSelect = vi.fn();
  const mockHabit = {
    id: 1,
    name: 'Morning Meditation',
    category: 'wellness'
  };

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('renders the component with habit name', () => {
    render(<FrictionTypeSelector onSelect={mockOnSelect} selectedHabit={mockHabit} />);
    
    expect(screen.getByText(/Morning Meditation/)).toBeInTheDocument();
    expect(screen.getByText(/Choose Your Journey Obstacle/)).toBeInTheDocument();
  });

  it('displays all four obstacle types', () => {
    render(<FrictionTypeSelector onSelect={mockOnSelect} selectedHabit={mockHabit} />);
    
    expect(screen.getByText('Distraction Detour')).toBeInTheDocument();
    expect(screen.getByText('Energy Drain Valley')).toBeInTheDocument();
    expect(screen.getByText('Maze Mountain')).toBeInTheDocument();
    expect(screen.getByText('Memory Fog')).toBeInTheDocument();
  });

  it('renders the robot mascot with correct props', () => {
    render(<FrictionTypeSelector onSelect={mockOnSelect} selectedHabit={mockHabit} />);
    
    const robotMascot = screen.getByTestId('robot-mascot');
    expect(robotMascot).toHaveAttribute('data-size', 'md');
    expect(robotMascot).toHaveAttribute('data-emotion', 'happy');
    expect(robotMascot).toHaveAttribute('data-animate', 'true');
  });

  it('calls onSelect with null when back button is clicked', () => {
    render(<FrictionTypeSelector onSelect={mockOnSelect} selectedHabit={mockHabit} />);
    
    const backButton = screen.getByText('← Back to Habit Details');
    fireEvent.click(backButton);
    
    expect(mockOnSelect).toHaveBeenCalledWith(null);
  });

  it('selects an obstacle when clicked', () => {
    render(<FrictionTypeSelector onSelect={mockOnSelect} selectedHabit={mockHabit} />);
    
    const distractionCard = screen.getByText('Distraction Detour').closest('.obstacle-card');
    fireEvent.click(distractionCard);
    
    expect(mockOnSelect).toHaveBeenCalledWith('distraction', expect.objectContaining({
      name: 'Distraction Detour',
      icon: '🛤️',
      emoji: '📱'
    }));
  });

  it('shows contextual message when hovering over obstacle', () => {
    render(<FrictionTypeSelector onSelect={mockOnSelect} selectedHabit={mockHabit} />);
    
    const distractionCard = screen.getByText('Distraction Detour').closest('.obstacle-card');
    fireEvent.mouseEnter(distractionCard);
    
    expect(screen.getByText(/Watch out! There's a distraction detour ahead!/)).toBeInTheDocument();
  });

  it('hides contextual message when mouse leaves obstacle', () => {
    render(<FrictionTypeSelector onSelect={mockOnSelect} selectedHabit={mockHabit} />);
    
    const distractionCard = screen.getByText('Distraction Detour').closest('.obstacle-card');
    fireEvent.mouseEnter(distractionCard);
    fireEvent.mouseLeave(distractionCard);
    
    expect(screen.queryByText(/Watch out! There's a distraction detour ahead!/)).not.toBeInTheDocument();
  });

  it('shows help button when obstacle is selected', () => {
    render(<FrictionTypeSelector onSelect={mockOnSelect} selectedHabit={mockHabit} />);
    
    const distractionCard = screen.getByText('Distraction Detour').closest('.obstacle-card');
    fireEvent.click(distractionCard);
    
    expect(screen.getByText(/Get Help with Distraction Detour/)).toBeInTheDocument();
  });

  it('handles missing selectedHabit gracefully', () => {
    render(<FrictionTypeSelector onSelect={mockOnSelect} selectedHabit={null} />);
    
    // Should still render without crashing
    expect(screen.getByText(/Choose Your Journey Obstacle/)).toBeInTheDocument();
  });
});