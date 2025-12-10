import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'
import { 
  setToken, 
  getToken, 
  setUser, 
  getUser, 
  clearAuthData,
  getDeviceId 
} from '../utils/storage'
import { handleError } from '../utils/errorHandler'

const AuthContext = createContext(null)

/**
 * AuthProvider component that manages authentication state
 */
export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null)
  const [token, setTokenState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Derived state
  const isAuthenticated = !!user && !!token
  const isGuest = user?.user_type === 'guest'

  /**
   * Initialize authentication on mount
   * Check for stored token and restore session
   */
  useEffect(() => {
    initializeAuth()
  }, [])

  /**
   * Initialize auth by checking for stored token
   */
  const initializeAuth = async () => {
    try {
      setLoading(true)
      const storedToken = getToken()
      const storedUser = getUser()

      if (storedToken && storedUser) {
        // Restore token and user from storage
        setTokenState(storedToken)
        setUserState(storedUser)
        
        // Verify token is still valid by fetching user info with timeout
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
          
          const userData = await api.getMe()
          clearTimeout(timeoutId)
          setUserState(userData)
          setUser(userData)
        } catch (err) {
          // Token is invalid or request timed out, clear auth data
          if (err.name === 'AbortError') {
            console.warn('Auth verification timed out - using stored user data')
          } else {
            handleError(err, 'initializeAuth')
            clearAuthData()
            setTokenState(null)
            setUserState(null)
          }
        }
      }
    } catch (err) {
      const { message } = handleError(err, 'initializeAuth')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   */
  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.login(email, password)
      
      // Store token and user
      setToken(response.access_token)
      setUser(response)
      setTokenState(response.access_token)
      setUserState(response)
      
      return response
    } catch (err) {
      const { message } = handleError(err, 'login')
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sign up with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} name - User name (optional)
   */
  const signup = async (email, password, name = null) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.signup(email, password, name)
      
      // Store token and user
      setToken(response.access_token)
      setUser(response)
      setTokenState(response.access_token)
      setUserState(response)
      
      return response
    } catch (err) {
      const { message } = handleError(err, 'signup')
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Login as guest with device ID
   * @param {string} deviceId - Device identifier (optional, will be generated if not provided)
   */
  const guestLogin = async (deviceId = null) => {
    try {
      setLoading(true)
      setError(null)
      
      const id = deviceId || getDeviceId()
      const response = await api.guestLogin(id)
      
      // Store token and user
      setToken(response.access_token)
      setUser(response)
      setTokenState(response.access_token)
      setUserState(response)
      
      return response
    } catch (err) {
      const { message } = handleError(err, 'guestLogin')
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Logout and clear authentication data
   */
  const logout = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Call logout endpoint if available
      try {
        await api.logout()
      } catch (err) {
        // Logout endpoint might not exist or fail, continue anyway
        handleError(err, 'logout')
      }
      
      // Clear all auth data
      clearAuthData()
      setTokenState(null)
      setUserState(null)
    } catch (err) {
      const { message } = handleError(err, 'logout')
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Clear error message
   */
  const clearError = () => {
    setError(null)
  }

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isGuest,
    login,
    signup,
    guestLogin,
    logout,
    clearError,
    initializeAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Custom hook to use auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
