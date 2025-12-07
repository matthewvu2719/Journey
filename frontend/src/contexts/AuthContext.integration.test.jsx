import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
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

/**
 * Integration tests for session persistence
 * These tests verify the actual localStorage behavior without mocking storage utilities
 * Requirements: 5.1, 5.4
 */
describe('AuthContext Integration Tests - Session Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

  describe('Token persists after page reload', () => {
    it('should persist token in localStorage after successful login', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token-abc123',
        user_type: 'authenticated'
      }

      api.login.mockResolvedValue(mockResponse)
      api.getMe.mockResolvedValue(mockResponse)

      // First render - login
      const { result: result1, unmount } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result1.current.login('test@example.com', 'password123')
      })

      // Verify token is stored in localStorage
      expect(localStorage.getItem('habit_coach_token')).toBe('valid-token-abc123')
      expect(localStorage.getItem('habit_coach_user')).toBe(JSON.stringify(mockResponse))

      // Unmount to simulate page close
      unmount()

      // Second render - simulate page reload
      const { result: result2 } = renderHook(() => useAuth(), { wrapper })

      // Wait for initialization to complete
      await waitFor(() => expect(result2.current.loading).toBe(false), { timeout: 3000 })

      // Verify session is restored from localStorage
      expect(result2.current.token).toBe('valid-token-abc123')
      expect(result2.current.user).toEqual(mockResponse)
      expect(result2.current.isAuthenticated).toBe(true)
      expect(api.getMe).toHaveBeenCalled()
    })

    it('should persist token in localStorage after successful signup', async () => {
      const mockResponse = {
        user_id: 'user-456',
        email: 'newuser@example.com',
        access_token: 'signup-token-xyz789',
        user_type: 'authenticated'
      }

      api.signup.mockResolvedValue(mockResponse)
      api.getMe.mockResolvedValue(mockResponse)

      // First render - signup
      const { result: result1, unmount } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result1.current.signup('newuser@example.com', 'password123', 'New User')
      })

      // Verify token is stored in localStorage
      expect(localStorage.getItem('habit_coach_token')).toBe('signup-token-xyz789')
      expect(localStorage.getItem('habit_coach_user')).toBe(JSON.stringify(mockResponse))

      // Unmount to simulate page close
      unmount()

      // Second render - simulate page reload
      const { result: result2 } = renderHook(() => useAuth(), { wrapper })

      // Wait for initialization to complete
      await waitFor(() => expect(result2.current.loading).toBe(false), { timeout: 3000 })

      // Verify session is restored from localStorage
      expect(result2.current.token).toBe('signup-token-xyz789')
      expect(result2.current.user).toEqual(mockResponse)
      expect(result2.current.isAuthenticated).toBe(true)
    })

    it('should persist guest token in localStorage after guest login', async () => {
      const mockResponse = {
        user_id: 'guest-789',
        email: null,
        access_token: 'guest-token-def456',
        user_type: 'guest'
      }

      api.guestLogin.mockResolvedValue(mockResponse)
      api.getMe.mockResolvedValue(mockResponse)

      // First render - guest login
      const { result: result1, unmount } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result1.current.guestLogin('device-123')
      })

      // Verify token is stored in localStorage
      expect(localStorage.getItem('habit_coach_token')).toBe('guest-token-def456')
      expect(localStorage.getItem('habit_coach_user')).toBe(JSON.stringify(mockResponse))

      // Unmount to simulate page close
      unmount()

      // Second render - simulate page reload
      const { result: result2 } = renderHook(() => useAuth(), { wrapper })

      // Wait for initialization to complete
      await waitFor(() => expect(result2.current.loading).toBe(false), { timeout: 3000 })

      // Verify guest session is restored from localStorage
      expect(result2.current.token).toBe('guest-token-def456')
      expect(result2.current.user).toEqual(mockResponse)
      expect(result2.current.isAuthenticated).toBe(true)
      expect(result2.current.isGuest).toBe(true)
    })

    it('should maintain device ID across page reloads for guest mode', async () => {
      const deviceId = 'persistent-device-id'
      localStorage.setItem('habit_coach_device_id', deviceId)

      const mockResponse = {
        user_id: 'guest-999',
        email: null,
        access_token: 'guest-token-persistent',
        user_type: 'guest'
      }

      api.guestLogin.mockResolvedValue(mockResponse)
      api.getMe.mockResolvedValue(mockResponse)

      // First render - guest login
      const { result: result1, unmount } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result1.current.guestLogin()
      })

      // Verify device ID is still in localStorage
      expect(localStorage.getItem('habit_coach_device_id')).toBe(deviceId)

      // Unmount
      unmount()

      // Second render - device ID should still be there
      const { result: result2 } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => expect(result2.current.loading).toBe(false), { timeout: 3000 })

      // Device ID should persist
      expect(localStorage.getItem('habit_coach_device_id')).toBe(deviceId)
    })
  })

  describe('Invalid token clears storage', () => {
    it('should clear localStorage when token is invalid on page load', async () => {
      // Pre-populate localStorage with invalid token
      const invalidToken = 'invalid-expired-token'
      const storedUser = {
        user_id: 'user-123',
        email: 'test@example.com',
        user_type: 'authenticated'
      }

      localStorage.setItem('habit_coach_token', invalidToken)
      localStorage.setItem('habit_coach_user', JSON.stringify(storedUser))

      // Mock API to return 401 for invalid token
      api.getMe.mockRejectedValue({
        response: { status: 401, data: { detail: 'Invalid token' } }
      })

      // Render - should attempt to restore session
      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for initialization to complete
      await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 })

      // Verify localStorage is cleared
      expect(localStorage.getItem('habit_coach_token')).toBe(null)
      expect(localStorage.getItem('habit_coach_user')).toBe(null)

      // Verify auth state is cleared
      expect(result.current.token).toBe(null)
      expect(result.current.user).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should clear localStorage when token expires during session', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token-initially',
        user_type: 'authenticated'
      }

      api.login.mockResolvedValue(mockResponse)
      api.getMe.mockResolvedValue(mockResponse)

      // Login successfully
      const { result, unmount } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      // Verify token is stored
      expect(localStorage.getItem('habit_coach_token')).toBe('valid-token-initially')

      // Unmount
      unmount()

      // Now simulate token expiration - API returns 401
      api.getMe.mockRejectedValue({
        response: { status: 401, data: { detail: 'Token expired' } }
      })

      // Reload page
      const { result: result2 } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => expect(result2.current.loading).toBe(false), { timeout: 3000 })

      // Verify localStorage is cleared
      expect(localStorage.getItem('habit_coach_token')).toBe(null)
      expect(localStorage.getItem('habit_coach_user')).toBe(null)

      // Verify auth state is cleared
      expect(result2.current.isAuthenticated).toBe(false)
    })

    it('should clear localStorage for invalid guest token', async () => {
      // Pre-populate localStorage with invalid guest token
      const invalidToken = 'invalid-guest-token'
      const storedUser = {
        user_id: 'guest-123',
        email: null,
        user_type: 'guest'
      }

      localStorage.setItem('habit_coach_token', invalidToken)
      localStorage.setItem('habit_coach_user', JSON.stringify(storedUser))

      // Mock API to return 401
      api.getMe.mockRejectedValue({
        response: { status: 401, data: { detail: 'Invalid token' } }
      })

      // Render
      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 })

      // Verify localStorage is cleared
      expect(localStorage.getItem('habit_coach_token')).toBe(null)
      expect(localStorage.getItem('habit_coach_user')).toBe(null)

      // Verify auth state is cleared
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isGuest).toBe(false)
    })
  })

  describe('Logout clears storage', () => {
    it('should clear localStorage when user logs out', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token',
        user_type: 'authenticated'
      }

      api.login.mockResolvedValue(mockResponse)
      api.logout.mockResolvedValue({})

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Login
      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      // Verify token is stored
      expect(localStorage.getItem('habit_coach_token')).toBe('valid-token')
      expect(localStorage.getItem('habit_coach_user')).toBe(JSON.stringify(mockResponse))

      // Logout
      await act(async () => {
        await result.current.logout()
      })

      // Verify localStorage is cleared
      expect(localStorage.getItem('habit_coach_token')).toBe(null)
      expect(localStorage.getItem('habit_coach_user')).toBe(null)

      // Verify auth state is cleared
      expect(result.current.token).toBe(null)
      expect(result.current.user).toBe(null)
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should clear localStorage when guest user logs out', async () => {
      const mockResponse = {
        user_id: 'guest-789',
        email: null,
        access_token: 'guest-token',
        user_type: 'guest'
      }

      api.guestLogin.mockResolvedValue(mockResponse)
      api.logout.mockResolvedValue({})

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Guest login
      await act(async () => {
        await result.current.guestLogin('device-123')
      })

      // Verify token is stored
      expect(localStorage.getItem('habit_coach_token')).toBe('guest-token')
      expect(localStorage.getItem('habit_coach_user')).toBe(JSON.stringify(mockResponse))

      // Logout
      await act(async () => {
        await result.current.logout()
      })

      // Verify localStorage is cleared
      expect(localStorage.getItem('habit_coach_token')).toBe(null)
      expect(localStorage.getItem('habit_coach_user')).toBe(null)

      // Verify auth state is cleared
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isGuest).toBe(false)
    })

    it('should clear localStorage even if logout API call fails', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token',
        user_type: 'authenticated'
      }

      api.login.mockResolvedValue(mockResponse)
      api.logout.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Login
      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      // Verify token is stored
      expect(localStorage.getItem('habit_coach_token')).toBe('valid-token')

      // Logout (API fails but should still clear local storage)
      await act(async () => {
        await result.current.logout()
      })

      // Verify localStorage is cleared despite API failure
      expect(localStorage.getItem('habit_coach_token')).toBe(null)
      expect(localStorage.getItem('habit_coach_user')).toBe(null)

      // Verify auth state is cleared
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should preserve device ID after logout for future guest sessions', async () => {
      const deviceId = 'persistent-device-123'
      localStorage.setItem('habit_coach_device_id', deviceId)

      const mockResponse = {
        user_id: 'guest-789',
        email: null,
        access_token: 'guest-token',
        user_type: 'guest'
      }

      api.guestLogin.mockResolvedValue(mockResponse)
      api.logout.mockResolvedValue({})

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Guest login
      await act(async () => {
        await result.current.guestLogin()
      })

      // Logout
      await act(async () => {
        await result.current.logout()
      })

      // Verify token and user are cleared
      expect(localStorage.getItem('habit_coach_token')).toBe(null)
      expect(localStorage.getItem('habit_coach_user')).toBe(null)

      // But device ID should be preserved
      expect(localStorage.getItem('habit_coach_device_id')).toBe(deviceId)
    })
  })

  describe('Session restoration edge cases', () => {
    it('should handle corrupted user data in localStorage', async () => {
      // Store invalid JSON in localStorage
      localStorage.setItem('habit_coach_token', 'valid-token')
      localStorage.setItem('habit_coach_user', 'invalid-json-{{{')

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Should handle gracefully and not crash
      await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 })

      // Should not be authenticated due to corrupted data
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should handle missing user data with valid token', async () => {
      // Store token but no user data
      localStorage.setItem('habit_coach_token', 'valid-token')

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 })

      // Should not be authenticated without user data
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should handle missing token with valid user data', async () => {
      // Store user but no token
      const storedUser = {
        user_id: 'user-123',
        email: 'test@example.com',
        user_type: 'authenticated'
      }
      localStorage.setItem('habit_coach_user', JSON.stringify(storedUser))

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 })

      // Should not be authenticated without token
      expect(result.current.isAuthenticated).toBe(false)
    })
  })
})
