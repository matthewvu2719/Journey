import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import * as fc from 'fast-check'
import { createContext } from 'react'
import ProtectedRoute from './ProtectedRoute'

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

describe('ProtectedRoute', () => {
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

  describe('Property-Based Tests', () => {
    // Feature: auth-ui, Property 7: Protected routes enforce authentication
    it('Property 7: should enforce authentication for all protected content', () => {
      fc.assert(
        fc.property(
          // Generate random content to protect
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.boolean(),
          (contentText, redirectPath, isAuthenticated) => {
            // Reset location before each test
            window.location.href = ''

            const TestContent = () => <div data-testid="protected-content">{contentText}</div>

            const { unmount } = render(
              <MockAuthProvider isAuthenticated={isAuthenticated} loading={false}>
                <ProtectedRoute redirectTo={redirectPath}>
                  <TestContent />
                </ProtectedRoute>
              </MockAuthProvider>
            )

            if (isAuthenticated) {
              // When authenticated, content should be visible
              const content = screen.queryByTestId('protected-content')
              expect(content).toBeTruthy()
              expect(content?.textContent).toBe(contentText)
              // Should NOT redirect
              expect(window.location.href).toBe('')
            } else {
              // When not authenticated, content should NOT be visible
              const content = screen.queryByTestId('protected-content')
              expect(content).toBeNull()
              // Should redirect to the specified path
              expect(window.location.href).toBe(redirectPath)
            }

            unmount()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('Property 7 (edge case): should show loading state and not redirect while checking auth', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (contentText) => {
            window.location.href = ''

            const TestContent = () => <div data-testid="protected-content">{contentText}</div>

            const { unmount } = render(
              <MockAuthProvider isAuthenticated={false} loading={true}>
                <ProtectedRoute>
                  <TestContent />
                </ProtectedRoute>
              </MockAuthProvider>
            )

            // Should show loading spinner
            expect(screen.getByText('Loading...')).toBeTruthy()
            // Should NOT show protected content
            expect(screen.queryByTestId('protected-content')).toBeNull()
            // Should NOT redirect while loading
            expect(window.location.href).toBe('')

            unmount()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Unit Tests', () => {
    it('should redirect to /login by default when not authenticated', () => {
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <MockAuthProvider isAuthenticated={false} loading={false}>
            <Routes>
              <Route path="/protected" element={
                <ProtectedRoute>
                  <div data-testid="protected-content">Protected Content</div>
                </ProtectedRoute>
              } />
              <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
            </Routes>
          </MockAuthProvider>
        </MemoryRouter>
      )

      expect(screen.queryByTestId('protected-content')).toBeNull()
      expect(screen.getByTestId('login-page')).toBeTruthy()
    })

    it('should redirect to custom path when not authenticated', () => {
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <MockAuthProvider isAuthenticated={false} loading={false}>
            <Routes>
              <Route path="/protected" element={
                <ProtectedRoute redirectTo="/custom-login">
                  <div data-testid="protected-content">Protected Content</div>
                </ProtectedRoute>
              } />
              <Route path="/custom-login" element={<div data-testid="custom-login-page">Custom Login</div>} />
            </Routes>
          </MockAuthProvider>
        </MemoryRouter>
      )

      expect(screen.queryByTestId('protected-content')).toBeNull()
      expect(screen.getByTestId('custom-login-page')).toBeTruthy()
    })

    it('should allow access when authenticated', () => {
      render(
        <MemoryRouter>
          <MockAuthProvider isAuthenticated={true} loading={false}>
            <ProtectedRoute>
              <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>
          </MockAuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByTestId('protected-content')).toBeTruthy()
      expect(screen.getByText('Protected Content')).toBeTruthy()
    })

    it('should show loading state while checking auth', () => {
      render(
        <MemoryRouter>
          <MockAuthProvider isAuthenticated={false} loading={true}>
            <ProtectedRoute>
              <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>
          </MockAuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText('Loading...')).toBeTruthy()
      expect(screen.queryByTestId('protected-content')).toBeNull()
    })

    it('should not redirect while loading even if not authenticated', () => {
      render(
        <MemoryRouter>
          <MockAuthProvider isAuthenticated={false} loading={true}>
            <ProtectedRoute>
              <div data-testid="protected-content">Protected Content</div>
            </ProtectedRoute>
          </MockAuthProvider>
        </MemoryRouter>
      )

      // Should show loading, not redirect
      expect(screen.getByText('Loading...')).toBeTruthy()
      expect(screen.queryByTestId('protected-content')).toBeNull()
    })
  })
})
