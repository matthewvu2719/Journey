import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { createContext } from 'react'
import Navigation from './Navigation'
import * as fc from 'fast-check'

// Mock API
vi.mock('../services/api', () => ({
  api: {
    login: vi.fn(),
    signup: vi.fn(),
    guestLogin: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
  }
}))

// Mock AuthContext
const AuthContext = createContext(null)

// Mock useAuth hook
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => children,
}))

// Import after mocking
import { useAuth } from '../contexts/AuthContext'

// Helper to render Navigation with auth context
const renderWithAuth = (component, authState = {}) => {
  const mockAuthContext = {
    user: authState.user || null,
    token: authState.token || null,
    loading: authState.loading || false,
    error: authState.error || null,
    isAuthenticated: authState.isAuthenticated || false,
    isGuest: authState.isGuest || false,
    login: vi.fn(),
    signup: vi.fn(),
    guestLogin: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
    initializeAuth: vi.fn(),
  }

  useAuth.mockReturnValue(mockAuthContext)

  return render(component)
}

describe('Navigation - Property-Based Tests', () => {
  // Feature: auth-ui, Property 9: Auth state updates trigger UI updates
  // Validates: Requirements 6.1, 6.2, 6.3, 6.5
  it('property: auth state changes immediately update UI display', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate different auth states
        fc.record({
          authType: fc.constantFrom('unauthenticated', 'authenticated', 'guest'),
          email: fc.emailAddress(),
          userId: fc.uuid(),
        }),
        async ({ authType, email, userId }) => {
          // Create auth state based on type
          let authState
          if (authType === 'unauthenticated') {
            authState = {
              user: null,
              token: null,
              isAuthenticated: false,
              isGuest: false,
            }
          } else if (authType === 'authenticated') {
            authState = {
              user: { user_id: userId, email, user_type: 'authenticated' },
              token: 'test-token',
              isAuthenticated: true,
              isGuest: false,
            }
          } else {
            // guest
            authState = {
              user: { user_id: userId, email: null, user_type: 'guest' },
              token: 'guest-token',
              isAuthenticated: true,
              isGuest: true,
            }
          }

          // Render with the auth state
          const { container, unmount } = renderWithAuth(
            <Navigation show={true} currentSection="hero" onNavigate={vi.fn()} />,
            authState
          )

          try {
            // Wait for render
            await waitFor(() => {
              expect(container).toBeTruthy()
            })

            // Verify UI matches auth state
            if (authType === 'unauthenticated') {
              // Should show login and signup buttons
              const loginButtons = container.querySelectorAll('[data-testid="login-button"]')
              const signupButtons = container.querySelectorAll('[data-testid="signup-button"]')
              const logoutButtons = container.querySelectorAll('[data-testid="logout-button"]')
              const userEmails = container.querySelectorAll('[data-testid="user-email"]')
              const guestBadges = container.querySelectorAll('[data-testid="guest-badge"]')
              
              expect(loginButtons.length).toBe(1)
              expect(signupButtons.length).toBe(1)
              expect(logoutButtons.length).toBe(0)
              expect(userEmails.length).toBe(0)
              expect(guestBadges.length).toBe(0)
            } else if (authType === 'authenticated') {
              // Should show user email and logout button
              const userEmails = container.querySelectorAll('[data-testid="user-email"]')
              const logoutButtons = container.querySelectorAll('[data-testid="logout-button"]')
              const loginButtons = container.querySelectorAll('[data-testid="login-button"]')
              const signupButtons = container.querySelectorAll('[data-testid="signup-button"]')
              const guestBadges = container.querySelectorAll('[data-testid="guest-badge"]')
              
              expect(userEmails.length).toBe(1)
              expect(userEmails[0].textContent).toBe(email)
              expect(logoutButtons.length).toBe(1)
              expect(loginButtons.length).toBe(0)
              expect(signupButtons.length).toBe(0)
              expect(guestBadges.length).toBe(0)
            } else {
              // guest - should show guest badge and logout button
              const guestBadges = container.querySelectorAll('[data-testid="guest-badge"]')
              const logoutButtons = container.querySelectorAll('[data-testid="logout-button"]')
              const loginButtons = container.querySelectorAll('[data-testid="login-button"]')
              const signupButtons = container.querySelectorAll('[data-testid="signup-button"]')
              const userEmails = container.querySelectorAll('[data-testid="user-email"]')
              
              expect(guestBadges.length).toBe(1)
              expect(guestBadges[0].textContent).toBe('Guest Mode')
              expect(logoutButtons.length).toBe(1)
              expect(loginButtons.length).toBe(0)
              expect(signupButtons.length).toBe(0)
              expect(userEmails.length).toBe(0)
            }
          } finally {
            // Clean up after each iteration
            unmount()
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Navigation - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays email for authenticated users', () => {
    const authState = {
      user: { user_id: '123', email: 'test@example.com', user_type: 'authenticated' },
      token: 'test-token',
      isAuthenticated: true,
      isGuest: false,
    }

    renderWithAuth(
      <Navigation show={true} currentSection="hero" onNavigate={vi.fn()} />,
      authState
    )

    expect(screen.getByTestId('user-email')).toBeTruthy()
    expect(screen.getByTestId('user-email').textContent).toBe('test@example.com')
    expect(screen.getByTestId('logout-button')).toBeTruthy()
  })

  it('displays guest mode badge for guest users', () => {
    const authState = {
      user: { user_id: '123', email: null, user_type: 'guest' },
      token: 'guest-token',
      isAuthenticated: true,
      isGuest: true,
    }

    renderWithAuth(
      <Navigation show={true} currentSection="hero" onNavigate={vi.fn()} />,
      authState
    )

    expect(screen.getByTestId('guest-badge')).toBeTruthy()
    expect(screen.getByTestId('guest-badge').textContent).toBe('Guest Mode')
    expect(screen.getByTestId('logout-button')).toBeTruthy()
  })

  it('displays login/signup buttons for unauthenticated users', () => {
    const authState = {
      user: null,
      token: null,
      isAuthenticated: false,
      isGuest: false,
    }

    renderWithAuth(
      <Navigation show={true} currentSection="hero" onNavigate={vi.fn()} />,
      authState
    )

    expect(screen.getByTestId('login-button')).toBeTruthy()
    expect(screen.getByTestId('signup-button')).toBeTruthy()
    expect(screen.queryByTestId('logout-button')).toBeNull()
  })
})
