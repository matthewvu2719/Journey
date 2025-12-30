import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ObstacleCard from './ObstacleCard';

describe('ObstacleCard', () => {
  const mockProps = {
    obstacleKey: 'distraction',
    icon: '🛤️',
    emoji: '📱',
    name: 'Distraction Detour',
    description: 'Side paths that lead you away from your main journey',
    color: 'from-orange-400 to-red-500',
    isSelected: false,
    isHovered: false,
    onClick: vi.fn(),
    onHover: vi.fn(),
    onLeave: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the obstacle card with correct content', () => {
    render(<ObstacleCard {...mockProps} />);
    
    expect(screen.getByText('Distraction Detour')).toBeInTheDocument();
    expect(screen.getByText('Side paths that lead you away from your main journey')).toBeInTheDocument();
    expect(screen.getByText('🛤️')).toBeInTheDocument();
    expect(screen.getByText('📱')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    render(<ObstacleCard {...mockProps} />);
    
    const card = screen.getByText('Distraction Detour').closest('.obstacle-card');
    fireEvent.click(card);
    
    expect(mockProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onHover when mouse enters', () => {
    render(<ObstacleCard {...mockProps} />);
    
    const card = screen.getByText('Distraction Detour').closest('.obstacle-card');
    fireEvent.mouseEnter(card);
    
    expect(mockProps.onHover).toHaveBeenCalledTimes(1);
  });

  it('calls onLeave when mouse leaves', () => {
    render(<ObstacleCard {...mockProps} />);
    
    const card = screen.getByText('Distraction Detour').closest('.obstacle-card');
    fireEvent.mouseLeave(card);
    
    expect(mockProps.onLeave).toHaveBeenCalledTimes(1);
  });

  it('shows selection indicator when selected', () => {
    render(<ObstacleCard {...mockProps} isSelected={true} />);
    
    const checkIcon = screen.getByRole('img', { hidden: true }); // SVG check icon
    expect(checkIcon).toBeInTheDocument();
  });

  it('applies selected styles when isSelected is true', () => {
    render(<ObstacleCard {...mockProps} isSelected={true} />);
    
    const card = screen.getByText('Distraction Detour').closest('.obstacle-card');
    expect(card).toHaveClass('border-purple-500');
    expect(card).toHaveClass('scale-105');
  });

  it('applies hover styles when isHovered is true', () => {
    render(<ObstacleCard {...mockProps} isHovered={true} />);
    
    const card = screen.getByText('Distraction Detour').closest('.obstacle-card');
    expect(card).toHaveClass('border-purple-400/50');
    expect(card).toHaveClass('scale-102');
  });

  it('applies default styles when neither selected nor hovered', () => {
    render(<ObstacleCard {...mockProps} />);
    
    const card = screen.getByText('Distraction Detour').closest('.obstacle-card');
    expect(card).toHaveClass('border-light/20');
    expect(card).toHaveClass('bg-light/5');
  });

  it('shows animated border when hovered but not selected', () => {
    render(<ObstacleCard {...mockProps} isHovered={true} isSelected={false} />);
    
    const animatedBorder = screen.getByText('Distraction Detour').closest('.obstacle-card').querySelector('.animate-pulse');
    expect(animatedBorder).toBeInTheDocument();
  });

  it('does not show animated border when selected', () => {
    render(<ObstacleCard {...mockProps} isHovered={true} isSelected={true} />);
    
    const card = screen.getByText('Distraction Detour').closest('.obstacle-card');
    const animatedBorder = card.querySelector('.animate-pulse');
    expect(animatedBorder).not.toBeInTheDocument();
  });

  it('applies gradient color to icon container', () => {
    render(<ObstacleCard {...mockProps} />);
    
    const iconContainer = screen.getByText('🛤️').closest('div');
    expect(iconContainer).toHaveClass('from-orange-400');
    expect(iconContainer).toHaveClass('to-red-500');
  });
});