import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import { api } from '../services/api'
import * as storage from '../utils/storage'
import * as fc from 'fast-check'

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

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storage.getToken.mockReturnValue(null)
    storage.getUser.mockReturnValue(null)
  })

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

  // Feature: auth-ui, Property 1: Successful authentication stores token
  // Validates: Requirements 1.3, 2.3, 3.2, 5.1
  describe('Property 1: Successful authentication stores token', () => {
    it('should store token for any valid login credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 20 }),
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.uuid(),
          async (email, password, token, userId) => {
            // Setup
            vi.clearAllMocks()
            storage.getToken.mockReturnValue(null)
            storage.getUser.mockReturnValue(null)
            
            const mockResponse = {
              user_id: userId,
              email: email,
              access_token: token,
              user_type: 'authenticated'
            }
            
            api.login.mockResolvedValue(mockResponse)
            
            // Execute
            const { result } = renderHook(() => useAuth(), { wrapper })
            
            await act(async () => {
              await result.current.login(email, password)
            })
            
            // Verify token is stored
            expect(storage.setToken).toHaveBeenCalledWith(token)
            expect(storage.setUser).toHaveBeenCalledWith(mockResponse)
            expect(result.current.token).toBe(token)
            expect(result.current.user).toEqual(mockResponse)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should store token for any valid signup credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 20 }),
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.uuid(),
          async (email, password, name, token, userId) => {
            // Setup
            vi.clearAllMocks()
            storage.getToken.mockReturnValue(null)
            storage.getUser.mockReturnValue(null)
            
            const mockResponse = {
              user_id: userId,
              email: email,
              access_token: token,
              user_type: 'authenticated'
            }
            
            api.signup.mockResolvedValue(mockResponse)
            
            // Execute
            const { result } = renderHook(() => useAuth(), { wrapper })
            
            await act(async () => {
              await result.current.signup(email, password, name)
            })
            
            // Verify token is stored
            expect(storage.setToken).toHaveBeenCalledWith(token)
            expect(storage.setUser).toHaveBeenCalledWith(mockResponse)
            expect(result.current.token).toBe(token)
            expect(result.current.user).toEqual(mockResponse)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should store token for any guest login', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: null }),
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.uuid(),
          async (deviceId, token, userId) => {
            // Setup
            vi.clearAllMocks()
            storage.getToken.mockReturnValue(null)
            storage.getUser.mockReturnValue(null)
            storage.getDeviceId.mockReturnValue(deviceId || 'test-device-id')
            
            const mockResponse = {
              user_id: userId,
              email: null,
              access_token: token,
              user_type: 'guest'
            }
            
            api.guestLogin.mockResolvedValue(mockResponse)
            
            // Execute
            const { result } = renderHook(() => useAuth(), { wrapper })
            
            await act(async () => {
              await result.current.guestLogin(deviceId)
            })
            
            // Verify token is stored
            expect(storage.setToken).toHaveBeenCalledWith(token)
            expect(storage.setUser).toHaveBeenCalledWith(mockResponse)
            expect(result.current.token).toBe(token)
            expect(result.current.user).toEqual(mockResponse)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})

  // Feature: auth-ui, Property 4: Session restoration on app load
  // Validates: Requirements 5.2, 5.3
  describe('Property 4: Session restoration on app load', () => {
    it('should restore session for any valid stored token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.uuid(),
          fc.emailAddress(),
          fc.constantFrom('authenticated', 'guest'),
          async (token, userId, email, userType) => {
            // Setup - simulate stored token and user
            vi.clearAllMocks()
            
            const storedUser = {
              user_id: userId,
              email: userType === 'authenticated' ? email : null,
              user_type: userType
            }
            
            storage.getToken.mockReturnValue(token)
            storage.getUser.mockReturnValue(storedUser)
            
            const updatedUser = {
              ...storedUser,
              last_login: new Date().toISOString()
            }
            
            api.getMe.mockResolvedValue(updatedUser)
            
            // Execute - render hook which triggers initializeAuth
            const testWrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
            const { result } = renderHook(() => useAuth(), { wrapper: testWrapper })
            
            // Wait for initialization to complete
            await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 })
            
            // Verify session is restored
            expect(result.current.token).toBe(token)
            expect(result.current.user).toEqual(updatedUser)
            expect(result.current.isAuthenticated).toBe(true)
            expect(api.getMe).toHaveBeenCalled()
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should clear session for any invalid stored token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.uuid(),
          fc.emailAddress(),
          async (token, userId, email) => {
            // Setup - simulate stored token but API returns 401
            vi.clearAllMocks()
            
            const storedUser = {
              user_id: userId,
              email: email,
              user_type: 'authenticated'
            }
            
            storage.getToken.mockReturnValue(token)
            storage.getUser.mockReturnValue(storedUser)
            
            // Simulate invalid token
            api.getMe.mockRejectedValue({
              response: { status: 401 }
            })
            
            // Execute
            const testWrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
            const { result } = renderHook(() => useAuth(), { wrapper: testWrapper })
            
            // Wait for initialization to complete
            await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 })
            
            // Verify session is cleared
            expect(storage.clearAuthData).toHaveBeenCalled()
            expect(result.current.token).toBe(null)
            expect(result.current.user).toBe(null)
            expect(result.current.isAuthenticated).toBe(false)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  // Feature: auth-ui, Property 5: Invalid token triggers logout
  // Validates: Requirements 5.4, 7.3
  describe('Property 5: Invalid token triggers logout', () => {
    it('should clear auth state when API returns 401 during session restoration', async () => {
      // This property is already tested in Property 4's second test
      // Testing that invalid tokens during initialization trigger logout
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.uuid(),
          async (invalidToken, userId) => {
            vi.clearAllMocks()
            
            const storedUser = {
              user_id: userId,
              email: 'test@example.com',
              user_type: 'authenticated'
            }
            
            storage.getToken.mockReturnValue(invalidToken)
            storage.getUser.mockReturnValue(storedUser)
            api.getMe.mockRejectedValue({ response: { status: 401 } })
            
            const testWrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
            const { result } = renderHook(() => useAuth(), { wrapper: testWrapper })
            
            await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 })
            
            // Verify logout behavior
            expect(storage.clearAuthData).toHaveBeenCalled()
            expect(result.current.isAuthenticated).toBe(false)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  // Feature: auth-ui, Property 6: Logout clears all auth data
  // Validates: Requirements 4.2, 4.3, 4.4
  describe('Property 6: Logout clears all auth data', () => {
    it('should clear all auth data for any authenticated user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 20 }),
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.uuid(),
          async (email, password, token, userId) => {
            // Setup - login first
            vi.clearAllMocks()
            storage.getToken.mockReturnValue(null)
            storage.getUser.mockReturnValue(null)
            
            const mockResponse = {
              user_id: userId,
              email: email,
              access_token: token,
              user_type: 'authenticated'
            }
            
            api.login.mockResolvedValue(mockResponse)
            api.logout.mockResolvedValue({})
            
            const testWrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
            const { result } = renderHook(() => useAuth(), { wrapper: testWrapper })
            
            // Login
            await act(async () => {
              await result.current.login(email, password)
            })
            
            // Verify logged in
            expect(result.current.isAuthenticated).toBe(true)
            
            // Logout
            await act(async () => {
              await result.current.logout()
            })
            
            // Verify all auth data is cleared
            expect(storage.clearAuthData).toHaveBeenCalled()
            expect(result.current.token).toBe(null)
            expect(result.current.user).toBe(null)
            expect(result.current.isAuthenticated).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should clear all auth data for any guest user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: null }),
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.uuid(),
          async (deviceId, token, userId) => {
            // Setup - guest login first
            vi.clearAllMocks()
            storage.getToken.mockReturnValue(null)
            storage.getUser.mockReturnValue(null)
            storage.getDeviceId.mockReturnValue(deviceId || 'test-device-id')
            
            const mockResponse = {
              user_id: userId,
              email: null,
              access_token: token,
              user_type: 'guest'
            }
            
            api.guestLogin.mockResolvedValue(mockResponse)
            api.logout.mockResolvedValue({})
            
            const testWrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
            const { result } = renderHook(() => useAuth(), { wrapper: testWrapper })
            
            // Guest login
            await act(async () => {
              await result.current.guestLogin(deviceId)
            })
            
            // Verify logged in as guest
            expect(result.current.isAuthenticated).toBe(true)
            expect(result.current.isGuest).toBe(true)
            
            // Logout
            await act(async () => {
              await result.current.logout()
            })
            
            // Verify all auth data is cleared
            expect(storage.clearAuthData).toHaveBeenCalled()
            expect(result.current.token).toBe(null)
            expect(result.current.user).toBe(null)
            expect(result.current.isAuthenticated).toBe(false)
            expect(result.current.isGuest).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: auth-ui, Property 10: Error messages are cleared before new operations
  // Validates: Requirements 8.4
  describe('Property 10: Error messages are cleared before new operations', () => {
    it('should clear previous error before any new authentication operation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 20 }),
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 20 }),
          async (email1, password1, email2, password2) => {
            // Setup - first operation fails
            vi.clearAllMocks()
            storage.getToken.mockReturnValue(null)
            storage.getUser.mockReturnValue(null)
            
            const firstError = {
              response: {
                status: 401,
                data: { detail: 'Invalid credentials' }
              }
            }
            
            const secondSuccess = {
              user_id: 'user-123',
              email: email2,
              access_token: 'valid-token',
              user_type: 'authenticated'
            }
            
            api.login
              .mockRejectedValueOnce(firstError)
              .mockResolvedValueOnce(secondSuccess)
            
            const testWrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
            const { result } = renderHook(() => useAuth(), { wrapper: testWrapper })
            
            // First operation fails
            await act(async () => {
              try {
                await result.current.login(email1, password1)
              } catch (err) {
                // Expected to fail
              }
            })
            
            // Verify error is set
            expect(result.current.error).toBeTruthy()
            const firstErrorMessage = result.current.error
            
            // Second operation succeeds
            await act(async () => {
              await result.current.login(email2, password2)
            })
            
            // Verify error is cleared (no error on success)
            expect(result.current.error).toBe(null)
            expect(result.current.isAuthenticated).toBe(true)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should clear error when starting signup after failed login', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 20 }),
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 20 }),
          async (loginEmail, loginPassword, signupEmail, signupPassword) => {
            vi.clearAllMocks()
            storage.getToken.mockReturnValue(null)
            storage.getUser.mockReturnValue(null)
            
            const loginError = {
              response: {
                status: 401,
                data: { detail: 'Invalid credentials' }
              }
            }
            
            const signupSuccess = {
              user_id: 'user-456',
              email: signupEmail,
              access_token: 'new-token',
              user_type: 'authenticated'
            }
            
            api.login.mockRejectedValue(loginError)
            api.signup.mockResolvedValue(signupSuccess)
            
            const testWrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
            const { result } = renderHook(() => useAuth(), { wrapper: testWrapper })
            
            // Login fails
            await act(async () => {
              try {
                await result.current.login(loginEmail, loginPassword)
              } catch (err) {
                // Expected
              }
            })
            
            expect(result.current.error).toBeTruthy()
            
            // Signup succeeds and clears error
            await act(async () => {
              await result.current.signup(signupEmail, signupPassword)
            })
            
            expect(result.current.error).toBe(null)
            expect(result.current.isAuthenticated).toBe(true)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should clear error when starting guest login after failed regular login', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 20 }),
          fc.string({ minLength: 5, maxLength: 50 }),
          async (email, password, deviceId) => {
            vi.clearAllMocks()
            storage.getToken.mockReturnValue(null)
            storage.getUser.mockReturnValue(null)
            storage.getDeviceId.mockReturnValue(deviceId)
            
            const loginError = {
              response: {
                status: 401,
                data: { detail: 'Invalid credentials' }
              }
            }
            
            const guestSuccess = {
              user_id: 'guest-789',
              email: null,
              access_token: 'guest-token',
              user_type: 'guest'
            }
            
            api.login.mockRejectedValue(loginError)
            api.guestLogin.mockResolvedValue(guestSuccess)
            
            const testWrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
            const { result } = renderHook(() => useAuth(), { wrapper: testWrapper })
            
            // Login fails
            await act(async () => {
              try {
                await result.current.login(email, password)
              } catch (err) {
                // Expected
              }
            })
            
            expect(result.current.error).toBeTruthy()
            
            // Guest login succeeds and clears error
            await act(async () => {
              await result.current.guestLogin(deviceId)
            })
            
            expect(result.current.error).toBe(null)
            expect(result.current.isAuthenticated).toBe(true)
            expect(result.current.isGuest).toBe(true)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  // Feature: auth-ui, Property 11: Network errors display appropriate messages
  // Validates: Requirements 8.1
  describe('Property 11: Network errors display appropriate messages', () => {
    it('should display network error message for any network failure during login', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 20 }),
          async (email, password) => {
            vi.clearAllMocks()
            storage.getToken.mockReturnValue(null)
            storage.getUser.mockReturnValue(null)
            
            // Simulate network error (no response)
            const networkError = new Error('Network Error')
            networkError.code = 'ERR_NETWORK'
            
            api.login.mockRejectedValue(networkError)
            
            const testWrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
            const { result } = renderHook(() => useAuth(), { wrapper: testWrapper })
            
            await act(async () => {
              try {
                await result.current.login(email, password)
              } catch (err) {
                // Expected to fail
              }
            })
            
            // Verify network error message is displayed
            expect(result.current.error).toBe('Unable to connect. Please check your internet connection.')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should display network error message for any network failure during signup', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 20 }),
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          async (email, password, name) => {
            vi.clearAllMocks()
            storage.getToken.mockReturnValue(null)
            storage.getUser.mockReturnValue(null)
            
            // Simulate network error (no response)
            const networkError = new Error('Network Error')
            networkError.code = 'ERR_NETWORK'
            
            api.signup.mockRejectedValue(networkError)
            
            const testWrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
            const { result } = renderHook(() => useAuth(), { wrapper: testWrapper })
            
            await act(async () => {
              try {
                await result.current.signup(email, password, name)
              } catch (err) {
                // Expected to fail
              }
            })
            
            // Verify network error message is displayed
            expect(result.current.error).toBe('Unable to connect. Please check your internet connection.')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should display network error message for any network failure during guest login', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: null }),
          async (deviceId) => {
            vi.clearAllMocks()
            storage.getToken.mockReturnValue(null)
            storage.getUser.mockReturnValue(null)
            storage.getDeviceId.mockReturnValue(deviceId || 'test-device-id')
            
            // Simulate network error (no response)
            const networkError = new Error('Network Error')
            networkError.code = 'ERR_NETWORK'
            
            api.guestLogin.mockRejectedValue(networkError)
            
            const testWrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
            const { result } = renderHook(() => useAuth(), { wrapper: testWrapper })
            
            await act(async () => {
              try {
                await result.current.guestLogin(deviceId)
              } catch (err) {
                // Expected to fail
              }
            })
            
            // Verify network error message is displayed
            expect(result.current.error).toBe('Unable to connect. Please check your internet connection.')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Unit Tests for AuthContext methods
  // Requirements: 1.2, 2.2, 3.1, 4.1
  describe('Unit Tests', () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    
    describe('login', () => {
      it('should successfully login with valid credentials', async () => {
        const mockResponse = {
          user_id: 'user-123',
          email: 'test@example.com',
          access_token: 'valid-token',
          user_type: 'authenticated'
        }
        
        api.login.mockResolvedValue(mockResponse)
        
        const { result } = renderHook(() => useAuth(), { wrapper })
        
        await act(async () => {
          await result.current.login('test@example.com', 'password123')
        })
        
        expect(api.login).toHaveBeenCalledWith('test@example.com', 'password123')
        expect(storage.setToken).toHaveBeenCalledWith('valid-token')
        expect(storage.setUser).toHaveBeenCalledWith(mockResponse)
        expect(result.current.user).toEqual(mockResponse)
        expect(result.current.token).toBe('valid-token')
        expect(result.current.isAuthenticated).toBe(true)
      })

      it('should handle login errors', async () => {
        const errorResponse = {
          response: {
            data: { detail: 'Invalid credentials' }
          }
        }
        
        api.login.mockRejectedValue(errorResponse)
        
        const { result } = renderHook(() => useAuth(), { wrapper })
        
        await act(async () => {
          try {
            await result.current.login('test@example.com', 'wrongpassword')
          } catch (err) {
            // Expected to throw
          }
        })
        
        expect(result.current.error).toBe('Invalid credentials')
        expect(result.current.isAuthenticated).toBe(false)
      })
    })

    describe('signup', () => {
      it('should successfully signup with valid credentials', async () => {
        const mockResponse = {
          user_id: 'user-456',
          email: 'newuser@example.com',
          access_token: 'new-token',
          user_type: 'authenticated'
        }
        
        api.signup.mockResolvedValue(mockResponse)
        
        const { result } = renderHook(() => useAuth(), { wrapper })
        
        await act(async () => {
          await result.current.signup('newuser@example.com', 'password123', 'New User')
        })
        
        expect(api.signup).toHaveBeenCalledWith('newuser@example.com', 'password123', 'New User')
        expect(storage.setToken).toHaveBeenCalledWith('new-token')
        expect(storage.setUser).toHaveBeenCalledWith(mockResponse)
        expect(result.current.user).toEqual(mockResponse)
        expect(result.current.token).toBe('new-token')
        expect(result.current.isAuthenticated).toBe(true)
      })

      it('should handle signup errors', async () => {
        const errorResponse = {
          response: {
            data: { detail: 'Email already exists' }
          }
        }
        
        api.signup.mockRejectedValue(errorResponse)
        
        const { result } = renderHook(() => useAuth(), { wrapper })
        
        await act(async () => {
          try {
            await result.current.signup('existing@example.com', 'password123')
          } catch (err) {
            // Expected to throw
          }
        })
        
        expect(result.current.error).toBe('Email already exists')
        expect(result.current.isAuthenticated).toBe(false)
      })
    })

    describe('guestLogin', () => {
      it('should successfully login as guest', async () => {
        const mockResponse = {
          user_id: 'guest-789',
          email: null,
          access_token: 'guest-token',
          user_type: 'guest'
        }
        
        storage.getDeviceId.mockReturnValue('device-123')
        api.guestLogin.mockResolvedValue(mockResponse)
        
        const { result } = renderHook(() => useAuth(), { wrapper })
        
        await act(async () => {
          await result.current.guestLogin()
        })
        
        expect(api.guestLogin).toHaveBeenCalledWith('device-123')
        expect(storage.setToken).toHaveBeenCalledWith('guest-token')
        expect(storage.setUser).toHaveBeenCalledWith(mockResponse)
        expect(result.current.user).toEqual(mockResponse)
        expect(result.current.token).toBe('guest-token')
        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.isGuest).toBe(true)
      })

      it('should handle guest login errors', async () => {
        const errorResponse = {
          response: {
            data: { detail: 'Guest login failed' }
          }
        }
        
        api.guestLogin.mockRejectedValue(errorResponse)
        
        const { result } = renderHook(() => useAuth(), { wrapper })
        
        await act(async () => {
          try {
            await result.current.guestLogin('device-123')
          } catch (err) {
            // Expected to throw
          }
        })
        
        expect(result.current.error).toBe('Guest login failed')
        expect(result.current.isAuthenticated).toBe(false)
      })
    })

    describe('logout', () => {
      it('should successfully logout', async () => {
        // First login
        const mockLoginResponse = {
          user_id: 'user-123',
          email: 'test@example.com',
          access_token: 'valid-token',
          user_type: 'authenticated'
        }
        
        api.login.mockResolvedValue(mockLoginResponse)
        api.logout.mockResolvedValue({})
        
        const { result } = renderHook(() => useAuth(), { wrapper })
        
        await act(async () => {
          await result.current.login('test@example.com', 'password123')
        })
        
        expect(result.current.isAuthenticated).toBe(true)
        
        // Then logout
        await act(async () => {
          await result.current.logout()
        })
        
        expect(api.logout).toHaveBeenCalled()
        expect(storage.clearAuthData).toHaveBeenCalled()
        expect(result.current.user).toBe(null)
        expect(result.current.token).toBe(null)
        expect(result.current.isAuthenticated).toBe(false)
      })

      it('should clear auth data even if logout API fails', async () => {
        // First login
        const mockLoginResponse = {
          user_id: 'user-123',
          email: 'test@example.com',
          access_token: 'valid-token',
          user_type: 'authenticated'
        }
        
        api.login.mockResolvedValue(mockLoginResponse)
        api.logout.mockRejectedValue(new Error('Network error'))
        
        const { result } = renderHook(() => useAuth(), { wrapper })
        
        await act(async () => {
          await result.current.login('test@example.com', 'password123')
        })
        
        expect(result.current.isAuthenticated).toBe(true)
        
        // Logout should still clear local data
        await act(async () => {
          await result.current.logout()
        })
        
        expect(storage.clearAuthData).toHaveBeenCalled()
        expect(result.current.user).toBe(null)
        expect(result.current.token).toBe(null)
        expect(result.current.isAuthenticated).toBe(false)
      })
    })

    describe('error handling', () => {
      it('should clear error when clearError is called', async () => {
        const errorResponse = {
          response: {
            data: { detail: 'Some error' }
          }
        }
        
        api.login.mockRejectedValue(errorResponse)
        
        const { result } = renderHook(() => useAuth(), { wrapper })
        
        await act(async () => {
          try {
            await result.current.login('test@example.com', 'wrongpassword')
          } catch (err) {
            // Expected to throw
          }
        })
        
        expect(result.current.error).toBe('Some error')
        
        act(() => {
          result.current.clearError()
        })
        
        expect(result.current.error).toBe(null)
      })
    })
  })
