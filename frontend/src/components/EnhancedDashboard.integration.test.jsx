import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import EnhancedDashboard from './EnhancedDashboard'
import { api } from '../services/api'
import { BoboProvider } from '../contexts/BoboContext'

// Mock the API
vi.mock('../services/api', () => ({
  api: {
    getDashboardData: vi.fn(),
    getTodayStats: vi.fn(),
    createCompletion: vi.fn(),
    deleteCompletion: vi.fn(),
    isHabitCompleted: vi.fn(),
    checkAchievements: vi.fn()
  }
}))

// Mock timezone utilities
vi.mock('../utils/timezone', () => ({
  getTodayDayName: () => 'Mon',
  getTodayDate: () => '2024-01-01'
}))

// Mock UI components to avoid complex rendering
vi.mock('./ui/NumberTicker', () => ({
  NumberTicker: ({ value }) => <span data-testid="number-ticker">{value}</span>
}))

vi.mock('./ui/Confetti', () => ({
  Confetti: () => <div data-testid="confetti" />
}))

vi.mock('./ui/ShimmerButton', () => ({
  ShimmerButton: ({ children, onClick, className }) => (
    <button onClick={onClick} className={className} data-testid="shimmer-button">
      {children}
    </button>
  )
}))

vi.mock('./ui/BlurFade', () => ({
  BlurFade: ({ children }) => <div>{children}</div>
}))

vi.mock('./ui/CircularProgress', () => ({
  CircularProgress: ({ value }) => <div data-testid="circular-progress">{value}%</div>
}))

vi.mock('./ui/DotPattern', () => ({
  DotPattern: () => <div data-testid="dot-pattern" />
}))

vi.mock('./RobotMascot', () => ({
  default: () => <div data-testid="robot-mascot" />
}))

vi.mock('./AchievementNotification', () => ({
  default: () => <div data-testid="achievement-notification" />
}))

vi.mock('./HabitForm', () => ({
  default: ({ onSubmit, onCancel }) => (
    <div data-testid="habit-form">
      <button onClick={() => onSubmit({ name: 'Test Habit' })}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}))

vi.mock('./HabitCompletionModal', () => ({
  default: ({ habit, onSubmit, onCancel, isVisible }) => 
    isVisible ? (
      <div data-testid="completion-modal">
        <button onClick={() => onSubmit({ mood_before: 'good' })}>Complete</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null
}))

const mockHabits = [
  {
    id: 1,
    name: 'Morning Exercise',
    category: 'Health',
    difficulty: 'medium',
    habit_type: 'atomic',
    priority: 1,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    times_of_day: ['morning']
  },
  {
    id: 2,
    name: 'Read Book',
    category: 'Learning',
    difficulty: 'easy',
    habit_type: 'big',
    estimated_duration: 30,
    priority: 2,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    times_of_day: ['night']
  }
]

const mockLogs = []

const MockWrapper = ({ children }) => (
  <MemoryRouter>
    <BoboProvider>
      {children}
    </BoboProvider>
  </MemoryRouter>
)

describe('EnhancedDashboard Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful API responses
    api.getDashboardData.mockResolvedValue({
      habits: mockHabits,
      completions: mockLogs,
      stats: {
        habits_today: 2,
        completed_today: 0,
        success_rate_today: 0,
        time_remaining: 30,
        data_source: 'database',
        is_stored: true
      },
      timestamp: '2024-01-01T00:00:00.000Z'
    })
    
    api.getTodayStats.mockResolvedValue({
      habits_today: 2,
      completed_today: 0,
      success_rate_today: 0,
      time_remaining: 30
    })
    
    api.createCompletion.mockResolvedValue({
      id: 1,
      habit_id: 1,
      completed_date: '2024-01-01',
      time_of_day_id: 1
    })
    
    api.isHabitCompleted.mockReturnValue(false)
    api.checkAchievements.mockResolvedValue([])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should load dashboard data with enhanced API format', async () => {
    render(
      <MockWrapper>
        <EnhancedDashboard 
          habits={mockHabits} 
          logs={mockLogs} 
          onRefresh={vi.fn()}
        />
      </MockWrapper>
    )

    // Wait for dashboard data to load
    await waitFor(() => {
      expect(api.getDashboardData).toHaveBeenCalled()
    })

    // Verify stats are displayed
    expect(screen.getByText('2')).toBeInTheDocument() // habits_today
    expect(screen.getAllByText('0')).toHaveLength(2) // completed_today and success_rate_today
    expect(screen.getByText('30')).toBeInTheDocument() // time_remaining
  })



  it('should handle API fallback gracefully', async () => {
    // Mock enhanced API failure
    api.getDashboardData.mockRejectedValue(new Error('Enhanced API failed'))
    
    render(
      <MockWrapper>
        <EnhancedDashboard 
          habits={mockHabits} 
          logs={mockLogs} 
          onRefresh={vi.fn()}
        />
      </MockWrapper>
    )

    await waitFor(() => {
      expect(api.getDashboardData).toHaveBeenCalled()
      expect(api.getTodayStats).toHaveBeenCalled()
    })

    // Should still display stats even with fallback
    expect(screen.getByText('2')).toBeInTheDocument() // habits_today
  })

  it('should refresh statistics after habit completion', async () => {
    const mockOnRefresh = vi.fn()
    
    render(
      <MockWrapper>
        <EnhancedDashboard 
          habits={mockHabits} 
          logs={mockLogs} 
          onRefresh={mockOnRefresh}
        />
      </MockWrapper>
    )

    // Wait for initial load
    await waitFor(() => {
      expect(api.getDashboardData).toHaveBeenCalledTimes(1)
    })

    // Find and click a completion button
    const completeButtons = screen.getAllByText('Complete')
    fireEvent.click(completeButtons[0])

    // Verify completion was created and stats refreshed
    await waitFor(() => {
      expect(api.createCompletion).toHaveBeenCalled()
      expect(api.getDashboardData).toHaveBeenCalledTimes(2) // Initial + refresh
    })
  })

  it('should load statistics successfully', async () => {
    render(
      <MockWrapper>
        <EnhancedDashboard 
          habits={mockHabits} 
          logs={mockLogs} 
          onRefresh={vi.fn()}
        />
      </MockWrapper>
    )

    // Wait for statistics to load
    await waitFor(() => {
      expect(api.getDashboardData).toHaveBeenCalled()
    })

    // Should display the statistics
    expect(screen.getByText('2')).toBeInTheDocument() // habits_today
    expect(screen.getAllByText('0')).toHaveLength(2) // completed_today and success_rate_today
    expect(screen.getByText('30')).toBeInTheDocument() // time_remaining
  })

  it('should handle timezone-aware statistics correctly', async () => {
    render(
      <MockWrapper>
        <EnhancedDashboard 
          habits={mockHabits} 
          logs={mockLogs} 
          onRefresh={vi.fn()}
        />
      </MockWrapper>
    )

    await waitFor(() => {
      expect(api.getDashboardData).toHaveBeenCalled()
    })

    // Verify that the API was called (timezone offset is calculated internally)
    expect(api.getDashboardData).toHaveBeenCalledWith()
  })
})