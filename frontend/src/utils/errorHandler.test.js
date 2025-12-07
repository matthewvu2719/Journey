import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  ErrorCategory, 
  categorizeError, 
  getErrorMessage, 
  logError, 
  handleError 
} from './errorHandler'

describe('Error Handler Utilities', () => {
  // Requirements: 8.1, 8.2, 8.3, 8.4
  
  describe('categorizeError', () => {
    it('should categorize network errors with ERR_NETWORK code', () => {
      const error = new Error('Network Error')
      error.code = 'ERR_NETWORK'
      
      expect(categorizeError(error)).toBe(ErrorCategory.NETWORK)
    })

    it('should categorize network errors with no response', () => {
      const error = new Error('Connection refused')
      
      expect(categorizeError(error)).toBe(ErrorCategory.NETWORK)
    })

    it('should categorize 401 errors as auth errors', () => {
      const error = {
        response: {
          status: 401,
          data: { detail: 'Unauthorized' }
        }
      }
      
      expect(categorizeError(error)).toBe(ErrorCategory.AUTH)
    })

    it('should categorize 403 errors as auth errors', () => {
      const error = {
        response: {
          status: 403,
          data: { detail: 'Forbidden' }
        }
      }
      
      expect(categorizeError(error)).toBe(ErrorCategory.AUTH)
    })

    it('should categorize 400 errors as validation errors', () => {
      const error = {
        response: {
          status: 400,
          data: { detail: 'Bad request' }
        }
      }
      
      expect(categorizeError(error)).toBe(ErrorCategory.VALIDATION)
    })

    it('should categorize 422 errors as validation errors', () => {
      const error = {
        response: {
          status: 422,
          data: { detail: 'Validation failed' }
        }
      }
      
      expect(categorizeError(error)).toBe(ErrorCategory.VALIDATION)
    })

    it('should categorize 500 errors as server errors', () => {
      const error = {
        response: {
          status: 500,
          data: { detail: 'Internal server error' }
        }
      }
      
      expect(categorizeError(error)).toBe(ErrorCategory.SERVER)
    })

    it('should categorize 503 errors as server errors', () => {
      const error = {
        response: {
          status: 503,
          data: { detail: 'Service unavailable' }
        }
      }
      
      expect(categorizeError(error)).toBe(ErrorCategory.SERVER)
    })

    it('should categorize unknown errors', () => {
      const error = {
        response: {
          status: 418,
          data: { detail: "I'm a teapot" }
        }
      }
      
      expect(categorizeError(error)).toBe(ErrorCategory.UNKNOWN)
    })
  })

  describe('getErrorMessage', () => {
    // Requirement 8.1: Network error messages
    it('should display network error message for network failures', () => {
      const error = new Error('Network Error')
      error.code = 'ERR_NETWORK'
      
      const message = getErrorMessage(error)
      
      expect(message).toBe('Unable to connect. Please check your internet connection.')
    })

    // Requirement 8.2: Invalid credentials error
    it('should display invalid credentials error for login context', () => {
      const error = {
        response: {
          status: 401,
          data: {}
        }
      }
      
      const message = getErrorMessage(error, 'login')
      
      expect(message).toBe('Invalid email or password. Please try again.')
    })

    it('should use specific error message when available for auth errors', () => {
      const error = {
        response: {
          status: 401,
          data: { detail: 'Account locked' }
        }
      }
      
      const message = getErrorMessage(error, 'login')
      
      expect(message).toBe('Account locked')
    })

    it('should display appropriate error for signup context', () => {
      const error = {
        response: {
          status: 401,
          data: {}
        }
      }
      
      const message = getErrorMessage(error, 'signup')
      
      expect(message).toBe('Unable to create account. Please check your information.')
    })

    // Requirement 8.3: Server error message
    it('should display server error message for 500+ errors', () => {
      const error = {
        response: {
          status: 500,
          data: { detail: 'Database connection failed' }
        }
      }
      
      const message = getErrorMessage(error)
      
      expect(message).toBe('Something went wrong. Please try again later.')
    })

    it('should use specific message for validation errors', () => {
      const error = {
        response: {
          status: 400,
          data: { detail: 'Email format is invalid' }
        }
      }
      
      const message = getErrorMessage(error)
      
      expect(message).toBe('Email format is invalid')
    })

    it('should handle errors with message field', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Custom error message' }
        }
      }
      
      const message = getErrorMessage(error)
      
      expect(message).toBe('Custom error message')
    })

    it('should handle errors with error field', () => {
      const error = {
        response: {
          status: 400,
          data: { error: 'Another error format' }
        }
      }
      
      const message = getErrorMessage(error)
      
      expect(message).toBe('Another error format')
    })
  })

  describe('logError', () => {
    let consoleErrorSpy

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleErrorSpy.mockRestore()
    })

    // Requirement 8.5: Console logging for all errors
    it('should log error details to console', () => {
      const error = {
        message: 'Test error',
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: { detail: 'Invalid input' }
        },
        stack: 'Error stack trace'
      }
      
      logError(error, 'test context')
      
      expect(consoleErrorSpy).toHaveBeenCalled()
      const loggedData = consoleErrorSpy.mock.calls[0][1]
      expect(loggedData.category).toBe(ErrorCategory.VALIDATION)
      expect(loggedData.message).toBe('Test error')
      expect(loggedData.status).toBe(400)
      expect(loggedData.data).toEqual({ detail: 'Invalid input' })
    })

    it('should log network errors', () => {
      const error = new Error('Network Error')
      error.code = 'ERR_NETWORK'
      
      logError(error, 'network test')
      
      expect(consoleErrorSpy).toHaveBeenCalled()
      const loggedData = consoleErrorSpy.mock.calls[0][1]
      expect(loggedData.category).toBe(ErrorCategory.NETWORK)
    })

    it('should include timestamp in log', () => {
      const error = new Error('Test')
      
      logError(error, 'timestamp test')
      
      expect(consoleErrorSpy).toHaveBeenCalled()
      const logMessage = consoleErrorSpy.mock.calls[0][0]
      expect(logMessage).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('handleError', () => {
    let consoleErrorSpy

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleErrorSpy.mockRestore()
    })

    // Requirement 8.4: Error clearing before new operations (tested via returning new error)
    it('should return category and message for network errors', () => {
      const error = new Error('Network Error')
      error.code = 'ERR_NETWORK'
      
      const result = handleError(error, 'test')
      
      expect(result.category).toBe(ErrorCategory.NETWORK)
      expect(result.message).toBe('Unable to connect. Please check your internet connection.')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should return category and message for auth errors', () => {
      const error = {
        response: {
          status: 401,
          data: { detail: 'Invalid credentials' }
        }
      }
      
      const result = handleError(error, 'login')
      
      expect(result.category).toBe(ErrorCategory.AUTH)
      expect(result.message).toBe('Invalid credentials')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should return category and message for server errors', () => {
      const error = {
        response: {
          status: 500,
          data: {}
        }
      }
      
      const result = handleError(error, 'api call')
      
      expect(result.category).toBe(ErrorCategory.SERVER)
      expect(result.message).toBe('Something went wrong. Please try again later.')
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should log error when handling', () => {
      const error = new Error('Test error')
      
      handleError(error, 'test context')
      
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
})
