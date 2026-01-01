import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FrictionSolutionView from './FrictionSolutionView';
import { api } from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
  api: {
    getFrictionHelp: vi.fn()
  }
}));

// Mock the RobotMascot component
vi.mock('./RobotMascot', () => ({
  default: ({ size, emotion, animate, dance }) => (
    <div data-testid="robot-mascot" data-size={size} data-emotion={emotion} data-animate={animate} data-dance={dance}>
      Mocked Robot Mascot
    </div>
  )
}));

// Mock the SolutionCard component
vi.mock('./SolutionCard', () => ({
  default: ({ solution, isSelected, onSelect, delay }) => (
    <div 
      data-testid="solution-card" 
      data-selected={isSelected}
      data-delay={delay}
      onClick={onSelect}
    >
      <h4>{solution.title}</h4>
      <p>{solution.description}</p>
      <span>{solution.action_type}</span>
    </div>
  )
}));

describe('FrictionSolutionView', () => {
  const mockHabit = {
    id: 1,
    name: 'Morning Meditation',
    category: 'wellness'
  };

  const mockFrictionData = {
    name: 'Distraction Detour',
    boboGreeting: 'Watch out! There\'s a distraction detour ahead!'
  };

  const mockOnBack = vi.fn();
  const mockOnSolutionSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    api.getFrictionHelp.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <FrictionSolutionView
        habit={mockHabit}
        frictionType="distraction"
        frictionData={mockFrictionData}
        onBack={mockOnBack}
        onSolutionSelect={mockOnSolutionSelect}
      />
    );

    expect(screen.getByText('🤔 Let me think of the best solutions for you...')).toBeInTheDocument();
    expect(screen.getByText('Generating personalized solutions...')).toBeInTheDocument();
  });

  it('renders solutions when API call succeeds', async () => {
    const mockResponse = {
      solutions: [
        {
          title: 'Remove Distractions',
          description: 'Put your phone in another room',
          action_type: 'environment',
          confidence_score: 0.8
        },
        {
          title: 'Use Focus Timer',
          description: 'Try a 25-minute focused session',
          action_type: 'pomodoro',
          confidence_score: 0.9
        }
      ],
      bobo_message: 'I found some great solutions for you!'
    };

    api.getFrictionHelp.mockResolvedValue(mockResponse);

    render(
      <FrictionSolutionView
        habit={mockHabit}
        frictionType="distraction"
        frictionData={mockFrictionData}
        onBack={mockOnBack}
        onSolutionSelect={mockOnSolutionSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('I found some great solutions for you!')).toBeInTheDocument();
    });

    expect(screen.getByText('Remove Distractions')).toBeInTheDocument();
    expect(screen.getByText('Use Focus Timer')).toBeInTheDocument();
  });

  it('renders error state when API call fails', async () => {
    api.getFrictionHelp.mockRejectedValue(new Error('API Error'));

    render(
      <FrictionSolutionView
        habit={mockHabit}
        frictionType="distraction"
        frictionData={mockFrictionData}
        onBack={mockOnBack}
        onSolutionSelect={mockOnSolutionSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to generate solutions. Please try again.')).toBeInTheDocument();
    });

    expect(screen.getByText('🔄 Try Again')).toBeInTheDocument();
    expect(screen.getByText('← Back to Obstacles')).toBeInTheDocument();
  });

  it('renders fallback solutions when API fails', async () => {
    api.getFrictionHelp.mockRejectedValue(new Error('API Error'));

    render(
      <FrictionSolutionView
        habit={mockHabit}
        frictionType="distraction"
        frictionData={mockFrictionData}
        onBack={mockOnBack}
        onSolutionSelect={mockOnSolutionSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Remove Distractions')).toBeInTheDocument();
    });

    expect(screen.getByText('Use Focus Timer')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    api.getFrictionHelp.mockResolvedValue({
      solutions: [],
      bobo_message: 'Test message'
    });

    render(
      <FrictionSolutionView
        habit={mockHabit}
        frictionType="distraction"
        frictionData={mockFrictionData}
        onBack={mockOnBack}
        onSolutionSelect={mockOnSolutionSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('← Choose Different Obstacle')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('← Choose Different Obstacle'));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('calls onSolutionSelect when solution is selected', async () => {
    const mockSolution = {
      title: 'Remove Distractions',
      description: 'Put your phone in another room',
      action_type: 'environment',
      confidence_score: 0.8
    };

    api.getFrictionHelp.mockResolvedValue({
      solutions: [mockSolution],
      bobo_message: 'Test message'
    });

    render(
      <FrictionSolutionView
        habit={mockHabit}
        frictionType="distraction"
        frictionData={mockFrictionData}
        onBack={mockOnBack}
        onSolutionSelect={mockOnSolutionSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('solution-card')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('solution-card'));
    expect(mockOnSolutionSelect).toHaveBeenCalledWith(mockSolution);
  });

  it('regenerates solutions when "Try Different Approach" is clicked', async () => {
    api.getFrictionHelp.mockResolvedValue({
      solutions: [],
      bobo_message: 'Test message'
    });

    render(
      <FrictionSolutionView
        habit={mockHabit}
        frictionType="distraction"
        frictionData={mockFrictionData}
        onBack={mockOnBack}
        onSolutionSelect={mockOnSolutionSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('🔄 Try Different Approach')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('🔄 Try Different Approach'));
    
    // Should call API again
    expect(api.getFrictionHelp).toHaveBeenCalledTimes(2);
  });

  it('calls API with correct parameters', async () => {
    api.getFrictionHelp.mockResolvedValue({
      solutions: [],
      bobo_message: 'Test message'
    });

    render(
      <FrictionSolutionView
        habit={mockHabit}
        frictionType="distraction"
        frictionData={mockFrictionData}
        onBack={mockOnBack}
        onSolutionSelect={mockOnSolutionSelect}
      />
    );

    await waitFor(() => {
      expect(api.getFrictionHelp).toHaveBeenCalledWith(1, {
        friction_type: 'distraction',
        additional_context: 'User is struggling with distraction when trying to do Morning Meditation'
      });
    });
  });

  it('maps frontend friction types to backend enum values', async () => {
    const mockResponse = {
      solutions: [{ title: 'Test Solution', description: 'Test', action_type: 'pomodoro', confidence_score: 0.8 }],
      bobo_message: 'Test message'
    };
    
    api.getFrictionHelp.mockResolvedValue(mockResponse);

    render(
      <FrictionSolutionView
        habit={mockHabit}
        frictionType="lowEnergy"
        frictionData={mockFrictionData}
        onBack={mockOnBack}
        onSolutionSelect={mockOnSolutionSelect}
      />
    );

    await waitFor(() => {
      expect(api.getFrictionHelp).toHaveBeenCalledWith(1, {
        friction_type: 'low-energy', // Should map lowEnergy to low-energy
        additional_context: 'User is struggling with lowEnergy when trying to do Morning Meditation'
      });
    });
  });
});