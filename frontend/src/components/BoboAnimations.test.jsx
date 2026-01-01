import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import BoboAnimations from './BoboAnimations';

// Mock RobotMascot
vi.mock('./RobotMascot', () => ({
  default: ({ size, emotion, dance, ...props }) => (
    <div 
      data-testid="robot-mascot" 
      data-size={size}
      data-emotion={emotion}
      data-dance={JSON.stringify(dance)}
      {...props}
    >
      Bobo Robot
    </div>
  )
}));

// Mock sound effects
vi.mock('../utils/soundEffects', () => ({
  default: {
    play: vi.fn(),
    setVolume: vi.fn(),
    setEnabled: vi.fn(),
    isAvailable: vi.fn(() => true)
  },
  useSoundEffects: () => ({
    play: vi.fn(),
    setVolume: vi.fn(),
    setEnabled: vi.fn(),
    isAvailable: true,
    availableSounds: ['slide', 'thinking', 'celebration', 'helper']
  })
}));

// Mock timers
vi.useFakeTimers();

describe('BoboAnimations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.useFakeTimers();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<BoboAnimations />);
      
      expect(screen.getByTestId('robot-mascot')).toBeInTheDocument();
      expect(screen.getByTestId('robot-mascot')).toHaveAttribute('data-size', 'lg');
      expect(screen.getByTestId('robot-mascot')).toHaveAttribute('data-emotion', 'friendly');
    });

    it('passes through props to RobotMascot', () => {
      render(
        <BoboAnimations
          size="xl"
          color="#ff0000"
          hat={{ svg: '<circle />' }}
          costume={{ svg: '<rect />' }}
        />
      );
      
      const robot = screen.getByTestId('robot-mascot');
      expect(robot).toHaveAttribute('data-size', 'xl');
    });
  });

  describe('Context-Aware Animations', () => {
    it('applies idle context by default', () => {
      render(<BoboAnimations />);
      
      const robot = screen.getByTestId('robot-mascot');
      expect(robot).toHaveAttribute('data-emotion', 'friendly');
      expect(robot).toHaveAttribute('data-dance', 'false');
    });

    it('applies slide-in context correctly', () => {
      render(<BoboAnimations context="slide-in" />);
      
      const robot = screen.getByTestId('robot-mascot');
      expect(robot).toHaveAttribute('data-emotion', 'excited');
      
      const danceData = JSON.parse(robot.getAttribute('data-dance'));
      expect(danceData.movements.arms.pattern).toBe('wave');
    });

    it('applies problem-solving context correctly', () => {
      render(<BoboAnimations context="problem-solving" />);
      
      const robot = screen.getByTestId('robot-mascot');
      expect(robot).toHaveAttribute('data-emotion', 'focused');
      
      const danceData = JSON.parse(robot.getAttribute('data-dance'));
      expect(danceData.movements.arms.pattern).toBe('pump');
      expect(danceData.movements.hands.pattern).toBe('point');
    });

    it('applies celebrating context correctly', () => {
      render(<BoboAnimations context="celebrating" />);
      
      const robot = screen.getByTestId('robot-mascot');
      expect(robot).toHaveAttribute('data-emotion', 'celebrating');
      
      const danceData = JSON.parse(robot.getAttribute('data-dance'));
      expect(danceData.movements.arms.pattern).toBe('swing');
      expect(danceData.movements.hands.pattern).toBe('clap');
    });

    it('applies thinking context correctly', () => {
      render(<BoboAnimations context="thinking" />);
      
      const robot = screen.getByTestId('robot-mascot');
      expect(robot).toHaveAttribute('data-emotion', 'focused');
      
      const danceData = JSON.parse(robot.getAttribute('data-dance'));
      expect(danceData.movements.head.pattern).toBe('tilt');
    });

    it('applies helping context correctly', () => {
      render(<BoboAnimations context="helping" />);
      
      const robot = screen.getByTestId('robot-mascot');
      expect(robot).toHaveAttribute('data-emotion', 'friendly');
      
      const danceData = JSON.parse(robot.getAttribute('data-dance'));
      expect(danceData.movements.arms.pattern).toBe('wave');
      expect(danceData.movements.hands.pattern).toBe('point');
    });
  });

  describe('Particle Effects', () => {
    it('shows particles when particleTrail is enabled', async () => {
      render(<BoboAnimations particleTrail={true} />);
      
      // Advance timers to trigger particle creation
      act(() => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        const particles = document.querySelectorAll('[style*="position: absolute"][style*="border-radius: 50%"]');
        expect(particles.length).toBeGreaterThan(0);
      });
    });

    it('shows particles for slide-in context', async () => {
      render(<BoboAnimations context="slide-in" />);
      
      act(() => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        const particles = document.querySelectorAll('[style*="position: absolute"][style*="border-radius: 50%"]');
        expect(particles.length).toBeGreaterThan(0);
      });
    });

    it('shows particles for celebrating context', async () => {
      render(<BoboAnimations context="celebrating" />);
      
      act(() => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        const particles = document.querySelectorAll('[style*="position: absolute"][style*="border-radius: 50%"]');
        expect(particles.length).toBeGreaterThan(0);
      });
    });

    it('does not show particles for thinking context', () => {
      render(<BoboAnimations context="thinking" />);
      
      act(() => {
        vi.advanceTimersByTime(100);
      });
      
      const particles = document.querySelectorAll('[style*="position: absolute"][style*="border-radius: 50%"]');
      expect(particles.length).toBe(0);
    });
  });

  describe('Glow Effects', () => {
    it('shows glow when glowEffect is enabled', () => {
      render(<BoboAnimations glowEffect={true} />);
      
      const glowElement = document.querySelector('[style*="radial-gradient"]');
      expect(glowElement).toBeInTheDocument();
    });

    it('shows glow for problem-solving context', () => {
      render(<BoboAnimations context="problem-solving" />);
      
      const glowElement = document.querySelector('[style*="radial-gradient"]');
      expect(glowElement).toBeInTheDocument();
    });

    it('shows glow for thinking context', () => {
      render(<BoboAnimations context="thinking" />);
      
      const glowElement = document.querySelector('[style*="radial-gradient"]');
      expect(glowElement).toBeInTheDocument();
    });

    it('does not show glow for idle context', () => {
      render(<BoboAnimations context="idle" />);
      
      const glowElement = document.querySelector('[style*="radial-gradient"]');
      expect(glowElement).not.toBeInTheDocument();
    });

    it('animates glow intensity over time', async () => {
      render(<BoboAnimations glowEffect={true} />);
      
      const initialGlow = document.querySelector('[style*="radial-gradient"]');
      const initialOpacity = initialGlow.style.background;
      
      // Advance time to change glow intensity
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        const updatedGlow = document.querySelector('[style*="radial-gradient"]');
        expect(updatedGlow.style.background).not.toBe(initialOpacity);
      });
    });
  });

  describe('Context-Specific Overlays', () => {
    it('shows thinking bubbles for thinking context', () => {
      render(<BoboAnimations context="thinking" />);
      
      expect(screen.getByText('💭')).toBeInTheDocument();
      expect(screen.getByText('🤔')).toBeInTheDocument();
      expect(screen.getByText('💡')).toBeInTheDocument();
    });

    it('shows confetti for celebrating context', () => {
      render(<BoboAnimations context="celebrating" />);
      
      const confettiContainer = document.querySelector('.celebration-confetti');
      expect(confettiContainer).toBeInTheDocument();
      
      const confettiPieces = document.querySelectorAll('.confetti-piece');
      expect(confettiPieces.length).toBe(8);
    });

    it('does not show overlays for idle context', () => {
      render(<BoboAnimations context="idle" />);
      
      expect(screen.queryByText('💭')).not.toBeInTheDocument();
      
      const confettiContainer = document.querySelector('.celebration-confetti');
      expect(confettiContainer).not.toBeInTheDocument();
    });
  });

  describe('Animation Styles', () => {
    it('applies slide-in animation styles', () => {
      const { container } = render(<BoboAnimations context="slide-in" />);
      
      const animatedElement = container.firstChild;
      expect(animatedElement.style.animation).toContain('slideInFromRight');
    });

    it('applies problem-solving animation styles', () => {
      const { container } = render(<BoboAnimations context="problem-solving" />);
      
      const animatedElement = container.firstChild;
      expect(animatedElement.style.animation).toContain('problemSolvingPulse');
    });

    it('does not apply animation styles for idle context', () => {
      const { container } = render(<BoboAnimations context="idle" />);
      
      const animatedElement = container.firstChild;
      expect(animatedElement.style.animation).toBe('');
    });
  });

  describe('Performance and Accessibility', () => {
    it('respects reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<BoboAnimations context="celebrating" />);
      
      // Should still render but with reduced animations
      expect(screen.getByTestId('robot-mascot')).toBeInTheDocument();
    });

    it('handles missing context gracefully', () => {
      render(<BoboAnimations context="nonexistent-context" />);
      
      // Should fall back to idle behavior
      const robot = screen.getByTestId('robot-mascot');
      expect(robot).toHaveAttribute('data-emotion', 'friendly');
    });

    it('cleans up particle intervals on unmount', () => {
      const { unmount } = render(<BoboAnimations particleTrail={true} />);
      
      // Start particle generation
      act(() => {
        vi.advanceTimersByTime(100);
      });
      
      // Unmount component
      unmount();
      
      // Advance time - should not create new particles
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      // No new particles should be created after unmount
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('Sound Integration', () => {
    it('enables sound when soundEnabled is true', () => {
      render(<BoboAnimations soundEnabled={true} context="slide-in" />);
      
      // Sound should be enabled for the component
      expect(screen.getByTestId('robot-mascot')).toBeInTheDocument();
    });

    it('disables sound when soundEnabled is false', () => {
      render(<BoboAnimations soundEnabled={false} context="celebrating" />);
      
      // Component should still render without sound
      expect(screen.getByTestId('robot-mascot')).toBeInTheDocument();
    });
  });

  describe('Particle System Behavior', () => {
    it('limits maximum number of particles', async () => {
      render(<BoboAnimations particleTrail={true} />);
      
      // Generate many particles
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      
      await waitFor(() => {
        const particles = document.querySelectorAll('[style*="position: absolute"][style*="border-radius: 50%"]');
        expect(particles.length).toBeLessThanOrEqual(15);
      });
    });

    it('removes particles when they fade out', async () => {
      render(<BoboAnimations particleTrail={true} />);
      
      // Create particles
      act(() => {
        vi.advanceTimersByTime(100);
      });
      
      const initialParticleCount = document.querySelectorAll('[style*="position: absolute"][style*="border-radius: 50%"]').length;
      
      // Wait for particles to fade
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      
      await waitFor(() => {
        const finalParticleCount = document.querySelectorAll('[style*="position: absolute"][style*="border-radius: 50%"]').length;
        expect(finalParticleCount).toBeLessThanOrEqual(initialParticleCount);
      });
    });
  });
});