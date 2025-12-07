/**
 * Error categorization and handling utilities
 */

/**
 * Error categories
 */
export const ErrorCategory = {
  NETWORK: 'network',
  AUTH: 'auth',
  SERVER: 'server',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown'
}

/**
 * Categorize an error based on its properties
 * @param {Error} error - The error object
 * @returns {string} Error category
 */
export const categorizeError = (error) => {
  // Network errors (no response from server)
  if (!error.response && (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error'))) {
    return ErrorCategory.NETWORK
  }
  
  // No response at all (timeout, connection refused, etc.)
  if (!error.response) {
    return ErrorCategory.NETWORK
  }
  
  const status = error.response?.status
  
  // Authentication errors (401, 403)
  if (status === 401 || status === 403) {
    return ErrorCategory.AUTH
  }
  
  // Validation errors (400, 422)
  if (status === 400 || status === 422) {
    return ErrorCategory.VALIDATION
  }
  
  // Server errors (500+)
  if (status >= 500) {
    return ErrorCategory.SERVER
  }
  
  return ErrorCategory.UNKNOWN
}

/**
 * Get user-friendly error message based on error category and details
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred (e.g., 'login', 'signup')
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, context = '') => {
  const category = categorizeError(error)
  
  // Try to get specific error message from response
  const specificMessage = error.response?.data?.detail || 
                         error.response?.data?.message ||
                         error.response?.data?.error
  
  switch (category) {
    case ErrorCategory.NETWORK:
      return 'Unable to connect. Please check your internet connection.'
    
    case ErrorCategory.AUTH:
      // Use specific message if available, otherwise generic
      if (specificMessage) {
        return specificMessage
      }
      if (context === 'login') {
        return 'Invalid email or password. Please try again.'
      }
      if (context === 'signup') {
        return 'Unable to create account. Please check your information.'
      }
      return 'Authentication failed. Please try again.'
    
    case ErrorCategory.VALIDATION:
      // Use specific message for validation errors
      return specificMessage || 'Please check your input and try again.'
    
    case ErrorCategory.SERVER:
      return 'Something went wrong. Please try again later.'
    
    default:
      return specificMessage || 'An unexpected error occurred. Please try again.'
  }
}

/**
 * Log error details to console for debugging
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred
 */
export const logError = (error, context = '') => {
  const category = categorizeError(error)
  const timestamp = new Date().toISOString()
  
  console.error(`[${timestamp}] Error in ${context || 'unknown context'}:`, {
    category,
    message: error.message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    stack: error.stack
  })
}

/**
 * Handle error with categorization, logging, and user message
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred
 * @returns {Object} { category, message }
 */
export const handleError = (error, context = '') => {
  // Log error for debugging
  logError(error, context)
  
  // Get user-friendly message
  const message = getErrorMessage(error, context)
  const category = categorizeError(error)
  
  return { category, message }
}
