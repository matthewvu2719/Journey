import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { createContext } from 'react'
import PublicRoute from './PublicRoute'

// Mock the entire AuthContext module
const mockAuthContext = createContext(null)

vi.mock('../contexts/AuthContext', () => {
  const actual = vi.importActual('../contexts/AuthContext')
  return {
    ...actual,
    useAuth: () => {
      const context = mockAuthContext._currentValue
      if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
      }
      return context
    }
  }
})

// Helper to create a mock AuthContext
const MockAuthProvider = ({ isAuthenticated, loading, children }) => {
  const mockContext = {
    user: isAuthenticated ? { user_id: '123', email: 'test@example.com', user_type: 'authenticated' } : null,
    token: isAuthenticated ? 'mock-token' : null,
    loading,
    error: null,
    isAuthenticated,
    isGuest: false,
    login: vi.fn(),
    signup: vi.fn(),
    guestLogin: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
    initializeAuth: vi.fn()
  }

  mockAuthContext._currentValue = mockContext

  return <>{children}</>
}

describe('PublicRoute', () => {
  let originalLocation

  beforeEach(() => {
    // Store original location
    originalLocation = window.location
    // Mock window.location
    delete window.location
    window.location = { href: '' }
  })

  afterEach(() => {
    // Restore original location
    window.location = originalLocation
    vi.clearAllMocks()
  })

  describe('Unit Tests', () => {
    it('should redirect to /dashboard by default when authenticated', () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <MockAuthProvider isAuthenticated={true} loading={false}>
            <Routes>
              <Route path="/login" element={
                <PublicRoute>
                  <div data-testid="public-content">Login Page</div>
                </PublicRoute>
              } />
              <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
            </Routes>
          </MockAuthProvider>
        </MemoryRouter>
      )

      expect(screen.queryByTestId('public-content')).toBeNull()
      expect(screen.getByTestId('dashboard-page')).toBeTruthy()
    })

    it('should redirect to custom path when authenticated', () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <MockAuthProvider isAuthenticated={true} loading={false}>
            <Routes>
              <Route path="/login" element={
                <PublicRoute redirectTo="/custom-dashboard">
                  <div data-testid="public-content">Login Page</div>
                </PublicRoute>
              } />
              <Route path="/custom-dashboard" element={<div data-testid="custom-dashboard-page">Custom Dashboard</div>} />
            </Routes>
          </MockAuthProvider>
        </MemoryRouter>
      )

      expect(screen.queryByTestId('public-content')).toBeNull()
      expect(screen.getByTestId('custom-dashboard-page')).toBeTruthy()
    })

    it('should allow access when not authenticated', () => {
      render(
        <MemoryRouter>
          <MockAuthProvider isAuthenticated={false} loading={false}>
            <PublicRoute>
              <div data-testid="public-content">Login Page</div>
            </PublicRoute>
          </MockAuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByTestId('public-content')).toBeTruthy()
      expect(screen.getByText('Login Page')).toBeTruthy()
    })

    it('should show loading state while checking auth', () => {
      render(
        <MemoryRouter>
          <MockAuthProvider isAuthenticated={false} loading={true}>
            <PublicRoute>
              <div data-testid="public-content">Login Page</div>
            </PublicRoute>
          </MockAuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText('Loading...')).toBeTruthy()
      expect(screen.queryByTestId('public-content')).toBeNull()
    })

    it('should not redirect while loading even if authenticated', () => {
      render(
        <MemoryRouter>
          <MockAuthProvider isAuthenticated={true} loading={true}>
            <PublicRoute>
              <div data-testid="public-content">Login Page</div>
            </PublicRoute>
          </MockAuthProvider>
        </MemoryRouter>
      )

      // Should show loading, not redirect
      expect(screen.getByText('Loading...')).toBeTruthy()
      expect(screen.queryByTestId('public-content')).toBeNull()
    })
  })
})
