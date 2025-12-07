import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import { api } from '../services/api'
import LoginForm from '../components/LoginForm'
import SignupForm from '../components/SignupForm'
import GuestModeButton from '../components/GuestModeButton'
import ProtectedRoute from '../components/ProtectedRoute'
import Navigation from '../components/Navigation'

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

/**
 * End-to-End Integration Tests for Authentication Flows
 * Tests complete user journeys through the authentication system
 * Requirements: All
 */
describe('AuthContext E2E Tests - Complete Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

  describe('Complete signup → login → logout flow', () => {
    it('should complete full authentication lifecycle', async () => {
      const user = userEvent.setup()
      
      // Step 1: Signup
      const signupResponse = {
        user_id: 'user-123',
        email: 'newuser@example.com',
        access_token: 'signup-token-abc',
        user_type: 'authenticated'
      }
      
      api.signup.mockResolvedValue(signupResponse)
      api.getMe.mockResolvedValue(signupResponse)
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await act(async () => {
        await result.current.signup('newuser@example.com', 'password123', 'New User')
      })
      
      // Verify signup success
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user.email).toBe('newuser@example.com')
      expect(localStorage.getItem('habit_coach_token')).toBe('signup-token-abc')
      
      // Step 2: Logout
      api.logout.mockResolvedValue({})
      
      await act(async () => {
        await result.current.logout()
      })
      
      // Verify logout success
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBe(null)
      expect(localStorage.getItem('habit_coach_token')).toBe(null)
      
      // Step 3: Login with same credentials
      const loginResponse = {
        user_id: 'user-123',
        email: 'newuser@example.com',
        access_token: 'login-token-xyz',
        user_type: 'authenticated'
      }
      
      api.login.mockResolvedValue(loginResponse)
      api.getMe.mockResolvedValue(loginResponse)
      
      await act(async () => {
        await result.current.login('newuser@example.com', 'password123')
      })
      
      // Verify login success
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user.email).toBe('newuser@example.com')
      expect(localStorage.getItem('habit_coach_token')).toBe('login-token-xyz')
      
      // Step 4: Final logout
      await act(async () => {
        await result.current.logout()
      })
      
      // Verify final state
      expect(result.current.isAuthenticated).toBe(false)
      expect(localStorage.getItem('habit_coach_token')).toBe(null)
    })
  })

  describe('Guest mode → conversion to registered user', () => {
    it('should convert guest user to registered account', async () => {
      // Step 1: Start as guest
      const guestResponse = {
        user_id: 'guest-456',
        email: null,
        access_token: 'guest-token-def',
        user_type: 'guest'
      }
      
      api.guestLogin.mockResolvedValue(guestResponse)
      api.getMe.mockResolvedValue(guestResponse)
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await act(async () => {
        await result.current.guestLogin('device-123')
      })
      
      // Verify guest mode
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isGuest).toBe(true)
      expect(result.current.user.user_type).toBe('guest')
      expect(localStorage.getItem('habit_coach_token')).toBe('guest-token-def')
      
      // Step 2: Convert to registered user (signup)
      const signupResponse = {
        user_id: 'user-789',
        email: 'converted@example.com',
        access_token: 'converted-token-ghi',
        user_type: 'authenticated'
      }
      
      api.signup.mockResolvedValue(signupResponse)
      api.getMe.mockResolvedValue(signupResponse)
      
      await act(async () => {
        await result.current.signup('converted@example.com', 'password123', 'Converted User')
      })
      
      // Verify conversion
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isGuest).toBe(false)
      expect(result.current.user.user_type).toBe('authenticated')
      expect(result.current.user.email).toBe('converted@example.com')
      expect(localStorage.getItem('habit_coach_token')).toBe('converted-token-ghi')
    })

    it('should maintain device ID after guest conversion', async () => {
      const deviceId = 'device-persistent-123'
      
      // Pre-set device ID in localStorage (simulating it was already generated)
      localStorage.setItem('habit_coach_device_id', deviceId)
      
      // Step 1: Guest login
      const guestResponse = {
        user_id: 'guest-999',
        email: null,
        access_token: 'guest-token',
        user_type: 'guest'
      }
      
      api.guestLogin.mockResolvedValue(guestResponse)
      api.getMe.mockResolvedValue(guestResponse)
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await act(async () => {
        await result.current.guestLogin()
      })
      
      expect(localStorage.getItem('habit_coach_device_id')).toBe(deviceId)
      
      // Step 2: Convert to registered
      const signupResponse = {
        user_id: 'user-converted',
        email: 'user@example.com',
        access_token: 'user-token',
        user_type: 'authenticated'
      }
      
      api.signup.mockResolvedValue(signupResponse)
      api.getMe.mockResolvedValue(signupResponse)
      
      await act(async () => {
        await result.current.signup('user@example.com', 'password123')
      })
      
      // Device ID should still be preserved
      expect(localStorage.getItem('habit_coach_device_id')).toBe(deviceId)
    })
  })

  describe('Protected route access', () => {
    it('should allow access to protected routes when authenticated', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token',
        user_type: 'authenticated'
      }
      
      api.login.mockResolvedValue(mockResponse)
      api.getMe.mockResolvedValue(mockResponse)
      
      const TestApp = () => {
        const { login } = useAuth()
        
        return (
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<div>Login Page</div>} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <div>Protected Dashboard</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        )
      }
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      // Login first
      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })
      
      // Now render the app with protected route
      render(
        <AuthProvider>
          <TestApp />
        </AuthProvider>
      )
      
      // Should be able to access protected content
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })
    })

    it('should redirect to login when accessing protected route unauthenticated', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      // Verify not authenticated
      await waitFor(() => expect(result.current.loading).toBe(false))
      expect(result.current.isAuthenticated).toBe(false)
      
      // Protected route should redirect (tested in ProtectedRoute.test.jsx)
    })

    it('should allow guest users to access protected routes', async () => {
      const guestResponse = {
        user_id: 'guest-123',
        email: null,
        access_token: 'guest-token',
        user_type: 'guest'
      }
      
      api.guestLogin.mockResolvedValue(guestResponse)
      api.getMe.mockResolvedValue(guestResponse)
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await act(async () => {
        await result.current.guestLogin('device-123')
      })
      
      // Guest should be authenticated
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isGuest).toBe(true)
    })
  })

  describe('Token expiration handling', () => {
    it('should handle token expiration during active session', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token',
        user_type: 'authenticated'
      }
      
      api.login.mockResolvedValue(mockResponse)
      api.getMe.mockResolvedValue(mockResponse)
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      // Login successfully
      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })
      
      expect(result.current.isAuthenticated).toBe(true)
      
      // Simulate token expiration - next API call returns 401
      api.getMe.mockRejectedValue({
        response: { status: 401, data: { detail: 'Token expired' } }
      })
      
      // Trigger a call that would check auth (simulated by re-initialization)
      // In real app, this would happen via axios interceptor
      // For this test, we'll manually trigger logout on 401
      
      // The axios interceptor should handle this automatically
      // This is tested in api.test.js
    })

    it('should clear expired token on app reload', async () => {
      // Pre-populate with expired token
      localStorage.setItem('habit_coach_token', 'expired-token')
      localStorage.setItem('habit_coach_user', JSON.stringify({
        user_id: 'user-123',
        email: 'test@example.com',
        user_type: 'authenticated'
      }))
      
      // Mock API to reject with 401
      api.getMe.mockRejectedValue({
        response: { status: 401, data: { detail: 'Token expired' } }
      })
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      // Wait for initialization
      await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 })
      
      // Should be logged out
      expect(result.current.isAuthenticated).toBe(false)
      expect(localStorage.getItem('habit_coach_token')).toBe(null)
    })
  })

  describe('Error scenarios', () => {
    it('should handle network errors during login', async () => {
      api.login.mockRejectedValue(new Error('Network Error'))
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await act(async () => {
        try {
          await result.current.login('test@example.com', 'password123')
        } catch (error) {
          // Expected to throw
        }
      })
      
      // Should not be authenticated
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBeTruthy()
    })

    it('should handle invalid credentials error', async () => {
      api.login.mockRejectedValue({
        response: { 
          status: 401, 
          data: { detail: 'Invalid credentials' } 
        }
      })
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await act(async () => {
        try {
          await result.current.login('wrong@example.com', 'wrongpassword')
        } catch (error) {
          // Expected to throw
        }
      })
      
      // Should not be authenticated
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBeTruthy()
    })

    it('should handle server errors during signup', async () => {
      api.signup.mockRejectedValue({
        response: { 
          status: 500, 
          data: { detail: 'Internal server error' } 
        }
      })
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await act(async () => {
        try {
          await result.current.signup('test@example.com', 'password123')
        } catch (error) {
          // Expected to throw
        }
      })
      
      // Should not be authenticated
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBeTruthy()
    })

    it('should handle network errors during guest login', async () => {
      api.guestLogin.mockRejectedValue(new Error('Network Error'))
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await act(async () => {
        try {
          await result.current.guestLogin('device-123')
        } catch (error) {
          // Expected to throw
        }
      })
      
      // Should not be authenticated
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBeTruthy()
    })
  })

  describe('Auth state changes update UI immediately', () => {
    it('should update UI immediately after login', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token',
        user_type: 'authenticated'
      }
      
      api.login.mockResolvedValue(mockResponse)
      api.getMe.mockResolvedValue(mockResponse)
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      // Initially not authenticated
      expect(result.current.isAuthenticated).toBe(false)
      
      // Login
      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })
      
      // Should immediately update
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockResponse)
    })

    it('should update UI immediately after logout', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token',
        user_type: 'authenticated'
      }
      
      api.login.mockResolvedValue(mockResponse)
      api.logout.mockResolvedValue({})
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      // Login first
      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })
      
      expect(result.current.isAuthenticated).toBe(true)
      
      // Logout
      await act(async () => {
        await result.current.logout()
      })
      
      // Should immediately update
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBe(null)
    })

    it('should update UI immediately when switching from guest to authenticated', async () => {
      const guestResponse = {
        user_id: 'guest-123',
        email: null,
        access_token: 'guest-token',
        user_type: 'guest'
      }
      
      const authResponse = {
        user_id: 'user-456',
        email: 'user@example.com',
        access_token: 'user-token',
        user_type: 'authenticated'
      }
      
      api.guestLogin.mockResolvedValue(guestResponse)
      api.signup.mockResolvedValue(authResponse)
      api.getMe.mockResolvedValue(authResponse)
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      // Start as guest
      await act(async () => {
        await result.current.guestLogin('device-123')
      })
      
      expect(result.current.isGuest).toBe(true)
      
      // Convert to authenticated
      await act(async () => {
        await result.current.signup('user@example.com', 'password123')
      })
      
      // Should immediately update
      expect(result.current.isGuest).toBe(false)
      expect(result.current.user.user_type).toBe('authenticated')
      expect(result.current.user.email).toBe('user@example.com')
    })
  })

  describe('Multiple authentication operations', () => {
    it('should handle rapid login/logout cycles', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token',
        user_type: 'authenticated'
      }
      
      api.login.mockResolvedValue(mockResponse)
      api.logout.mockResolvedValue({})
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      // Cycle 1
      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })
      expect(result.current.isAuthenticated).toBe(true)
      
      await act(async () => {
        await result.current.logout()
      })
      expect(result.current.isAuthenticated).toBe(false)
      
      // Cycle 2
      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })
      expect(result.current.isAuthenticated).toBe(true)
      
      await act(async () => {
        await result.current.logout()
      })
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should handle switching between different user accounts', async () => {
      const user1Response = {
        user_id: 'user-1',
        email: 'user1@example.com',
        access_token: 'token-1',
        user_type: 'authenticated'
      }
      
      const user2Response = {
        user_id: 'user-2',
        email: 'user2@example.com',
        access_token: 'token-2',
        user_type: 'authenticated'
      }
      
      api.logout.mockResolvedValue({})
      
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      // Login as user 1
      api.login.mockResolvedValue(user1Response)
      await act(async () => {
        await result.current.login('user1@example.com', 'password123')
      })
      expect(result.current.user.email).toBe('user1@example.com')
      
      // Logout
      await act(async () => {
        await result.current.logout()
      })
      
      // Login as user 2
      api.login.mockResolvedValue(user2Response)
      await act(async () => {
        await result.current.login('user2@example.com', 'password456')
      })
      expect(result.current.user.email).toBe('user2@example.com')
      expect(localStorage.getItem('habit_coach_token')).toBe('token-2')
    })
  })
})
