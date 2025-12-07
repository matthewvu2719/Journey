import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../contexts/AuthContext'
import GuestModeBanner from './GuestModeBanner'
import * as fc from 'fast-check'
import * as storage from '../utils/storage'
import { api } from '../services/api'

// Mock the API module
vi.mock('../services/api', () => ({
  api: {
    login: vi.fn(),
    signup: vi.fn(),
    guestLogin: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn()
  }
}))

// Mock storage utilities
vi.mock('../utils/storage', () => ({
  setToken: vi.fn(),
  getToken: vi.fn(),
  setUser: vi.fn(),
  getUser: vi.fn(),
  clearAuthData: vi.fn(),
  getDeviceId: vi.fn(() => 'test-device-id')
}))

// Mock AuthModal component to avoid rendering complexity
vi.mock('./AuthModal', () => ({
  default: ({ isOpen, onClose, initialView }) => (
    isOpen ? (
      <div data-testid="auth-modal" data-initial-view={initialView}>
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null
  )
}))

describe('GuestModeBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storage.getToken.mockReturnValue(null)
    storage.getUser.mockReturnValue(null)
  })

  afterEach(() => {
    cleanup()
  })

  // Feature: auth-ui, Property 8: Guest mode displays appropriate UI
  // Validates: Requirements 3.3, 6.2
  describe('Property 8: Guest mode displays appropriate UI', () => {
    it('should display banner for any guest user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: null }),
          async (userId, token, deviceId) => {
            // Setup - create guest user
            vi.clearAllMocks()
            
            const guestUser = {
              user_id: userId,
              email: null,
              user_type: 'guest',
              access_token: token
            }
            
            storage.getToken.mockReturnValue(token)
            storage.getUser.mockReturnValue(guestUser)
            storage.getDeviceId.mockReturnValue(deviceId || 'test-device-id')
            api.getMe.mockResolvedValue(guestUser)
            
            // Render component wrapped in AuthProvider
            const { unmount } = render(
              <AuthProvider>
                <GuestModeBanner />
              </AuthProvider>
            )
            
            // Wait for auth initialization
            await waitFor(() => {
              const banner = screen.queryByTestId('guest-mode-banner')
              return banner !== null
            }, { timeout: 3000 })
            
            // Verify banner is displayed
            const banner = screen.getByTestId('guest-mode-banner')
            expect(banner).toBeInTheDocument()
            
            // Verify banner contains guest mode text
            expect(banner.textContent).toMatch(/Guest Mode/i)
            
            // Verify "Create Account" button is present
            const createAccountButton = screen.getByTestId('create-account-button')
            expect(createAccountButton).toBeInTheDocument()
            expect(createAccountButton.textContent).toMatch(/Create Account/i)
            
            // Cleanup
            unmount()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should NOT display banner for any authenticated user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.string({ minLength: 10, maxLength: 50 }),
          async (userId, email, token) => {
            // Setup - create authenticated user
            vi.clearAllMocks()
            
            const authenticatedUser = {
              user_id: userId,
              email: email,
              user_type: 'authenticated',
              access_token: token
            }
            
            storage.getToken.mockReturnValue(token)
            storage.getUser.mockReturnValue(authenticatedUser)
            api.getMe.mockResolvedValue(authenticatedUser)
            
            // Render component wrapped in AuthProvider
            const { unmount } = render(
              <AuthProvider>
                <GuestModeBanner />
              </AuthProvider>
            )
            
            // Wait for auth initialization
            await waitFor(() => {
              return storage.getToken.mock.calls.length > 0
            }, { timeout: 3000 })
            
            // Give a moment for any potential rendering
            await new Promise(resolve => setTimeout(resolve, 50))
            
            // Verify banner is NOT displayed
            const banner = screen.queryByTestId('guest-mode-banner')
            expect(banner).not.toBeInTheDocument()
            
            // Cleanup
            unmount()
          }
        ),
        { numRuns: 50 }
      )
    }, 10000)

    it('should NOT display banner for any unauthenticated user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            // Setup - no user
            vi.clearAllMocks()
            storage.getToken.mockReturnValue(null)
            storage.getUser.mockReturnValue(null)
            
            // Render component wrapped in AuthProvider
            const { unmount } = render(
              <AuthProvider>
                <GuestModeBanner />
              </AuthProvider>
            )
            
            // Wait for auth initialization
            await waitFor(() => {
              return storage.getToken.mock.calls.length > 0
            }, { timeout: 3000 })
            
            // Give a moment for any potential rendering
            await new Promise(resolve => setTimeout(resolve, 50))
            
            // Verify banner is NOT displayed
            const banner = screen.queryByTestId('guest-mode-banner')
            expect(banner).not.toBeInTheDocument()
            
            // Cleanup
            unmount()
          }
        ),
        { numRuns: 30 }
      )
    }, 10000)

    it('should open signup modal when Create Account is clicked for any guest user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 10, maxLength: 50 }),
          async (userId, token) => {
            // Setup - create guest user
            vi.clearAllMocks()
            
            const guestUser = {
              user_id: userId,
              email: null,
              user_type: 'guest',
              access_token: token
            }
            
            storage.getToken.mockReturnValue(token)
            storage.getUser.mockReturnValue(guestUser)
            api.getMe.mockResolvedValue(guestUser)
            
            // Render component
            const { unmount } = render(
              <AuthProvider>
                <GuestModeBanner />
              </AuthProvider>
            )
            
            // Wait for banner to appear
            await waitFor(() => {
              return screen.queryByTestId('guest-mode-banner') !== null
            }, { timeout: 3000 })
            
            // Click "Create Account" button
            const createAccountButton = screen.getByTestId('create-account-button')
            await userEvent.click(createAccountButton)
            
            // Verify modal opens with signup view
            await waitFor(() => {
              const modal = screen.queryByTestId('auth-modal')
              return modal !== null
            })
            
            const modal = screen.getByTestId('auth-modal')
            expect(modal).toBeInTheDocument()
            expect(modal.getAttribute('data-initial-view')).toBe('signup')
            
            // Cleanup
            unmount()
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should hide banner when dismissed for any guest user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 10, maxLength: 50 }),
          async (userId, token) => {
            // Setup - create guest user
            vi.clearAllMocks()
            
            const guestUser = {
              user_id: userId,
              email: null,
              user_type: 'guest',
              access_token: token
            }
            
            storage.getToken.mockReturnValue(token)
            storage.getUser.mockReturnValue(guestUser)
            api.getMe.mockResolvedValue(guestUser)
            
            // Render component
            const { unmount } = render(
              <AuthProvider>
                <GuestModeBanner />
              </AuthProvider>
            )
            
            // Wait for banner to appear
            await waitFor(() => {
              return screen.queryByTestId('guest-mode-banner') !== null
            }, { timeout: 3000 })
            
            // Verify banner is visible
            let banner = screen.getByTestId('guest-mode-banner')
            expect(banner).toBeInTheDocument()
            
            // Click dismiss button
            const dismissButton = screen.getByTestId('dismiss-banner-button')
            await userEvent.click(dismissButton)
            
            // Verify banner is hidden
            await waitFor(() => {
              banner = screen.queryByTestId('guest-mode-banner')
              return banner === null
            })
            
            expect(banner).not.toBeInTheDocument()
            
            // Cleanup
            unmount()
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  // Unit Tests
  describe('Unit Tests', () => {
    beforeEach(() => {
      // Extra cleanup before each unit test
      cleanup()
    })

    it('should render banner when user is in guest mode', async () => {
      const guestUser = {
        user_id: 'guest-123',
        email: null,
        user_type: 'guest',
        access_token: 'guest-token'
      }
      
      storage.getToken.mockReturnValue('guest-token')
      storage.getUser.mockReturnValue(guestUser)
      api.getMe.mockResolvedValue(guestUser)
      
      render(
        <AuthProvider>
          <GuestModeBanner />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(screen.queryByTestId('guest-mode-banner')).toBeInTheDocument()
      })
      
      expect(screen.getByText(/Guest Mode/i)).toBeInTheDocument()
      expect(screen.getByTestId('create-account-button')).toBeInTheDocument()
    })

    it('should not render banner when user is authenticated', async () => {
      const authenticatedUser = {
        user_id: 'user-123',
        email: 'test@example.com',
        user_type: 'authenticated',
        access_token: 'auth-token'
      }
      
      storage.getToken.mockReturnValue('auth-token')
      storage.getUser.mockReturnValue(authenticatedUser)
      api.getMe.mockResolvedValue(authenticatedUser)
      
      render(
        <AuthProvider>
          <GuestModeBanner />
        </AuthProvider>
      )
      
      await waitFor(() => {
        return storage.getToken.mock.calls.length > 0
      })
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(screen.queryByTestId('guest-mode-banner')).not.toBeInTheDocument()
    })

    it('should not render banner when user is not authenticated', async () => {
      storage.getToken.mockReturnValue(null)
      storage.getUser.mockReturnValue(null)
      
      render(
        <AuthProvider>
          <GuestModeBanner />
        </AuthProvider>
      )
      
      await waitFor(() => {
        return storage.getToken.mock.calls.length > 0
      })
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(screen.queryByTestId('guest-mode-banner')).not.toBeInTheDocument()
    })

    it('should open auth modal when Create Account button is clicked', async () => {
      const guestUser = {
        user_id: 'guest-123',
        email: null,
        user_type: 'guest',
        access_token: 'guest-token'
      }
      
      storage.getToken.mockReturnValue('guest-token')
      storage.getUser.mockReturnValue(guestUser)
      api.getMe.mockResolvedValue(guestUser)
      
      render(
        <AuthProvider>
          <GuestModeBanner />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(screen.queryByTestId('guest-mode-banner')).toBeInTheDocument()
      })
      
      const createAccountButton = screen.getByTestId('create-account-button')
      await userEvent.click(createAccountButton)
      
      await waitFor(() => {
        expect(screen.queryByTestId('auth-modal')).toBeInTheDocument()
      })
      
      const modal = screen.getByTestId('auth-modal')
      expect(modal.getAttribute('data-initial-view')).toBe('signup')
    })

    it('should hide banner when dismiss button is clicked', async () => {
      const guestUser = {
        user_id: 'guest-123',
        email: null,
        user_type: 'guest',
        access_token: 'guest-token'
      }
      
      storage.getToken.mockReturnValue('guest-token')
      storage.getUser.mockReturnValue(guestUser)
      api.getMe.mockResolvedValue(guestUser)
      
      render(
        <AuthProvider>
          <GuestModeBanner />
        </AuthProvider>
      )
      
      await waitFor(() => {
        expect(screen.queryByTestId('guest-mode-banner')).toBeInTheDocument()
      })
      
      const dismissButton = screen.getByTestId('dismiss-banner-button')
      await userEvent.click(dismissButton)
      
      await waitFor(() => {
        expect(screen.queryByTestId('guest-mode-banner')).not.toBeInTheDocument()
      })
    })
  })
})
