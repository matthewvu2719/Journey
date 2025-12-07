import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

/**
 * LoginForm component for user authentication
 * @param {Object} props
 * @param {Function} props.onSuccess - Callback after successful login
 * @param {Function} props.onSwitchToSignup - Callback to switch to signup form
 */
export default function LoginForm({ onSuccess, onSwitchToSignup }) {
  const { login, loading, error, clearError } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  const [validationErrors, setValidationErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Validate email format
   */
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate form fields
   */
  const validateForm = () => {
    const errors = {}
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    
    // Clear auth error when user starts typing
    if (error) {
      clearError()
    }
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Clear previous errors
    clearError()
    
    // Validate form
    if (!validateForm()) {
      return
    }
    
    try {
      setIsSubmitting(true)
      await login(formData.email, formData.password)
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      // Error is handled by AuthContext
      console.error('Login failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Login form">
      {/* Screen reader announcement for form status */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isSubmitting && 'Logging in, please wait'}
        {error && `Login error: ${error}`}
      </div>

      <div className="space-y-4">
        {/* Email Input */}
        <div>
          <label 
            htmlFor="login-email" 
            className="block text-sm font-medium text-light/80 mb-2"
          >
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-3 bg-dark border rounded-lg font-mono text-sm
              transition-all duration-200 focus:outline-none focus:ring-2
              ${validationErrors.email 
                ? 'border-red-500 focus:ring-red-500/50' 
                : 'border-light/20 focus:ring-light/50 focus:border-light/40'
              }
              text-light placeholder-light/40`}
            placeholder="your@email.com"
            disabled={isSubmitting || loading}
            aria-invalid={!!validationErrors.email}
            aria-describedby={validationErrors.email ? 'login-email-error' : undefined}
            aria-required="true"
          />
          {validationErrors.email && (
            <p id="login-email-error" className="mt-2 text-sm text-red-400" role="alert">
              {validationErrors.email}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <label 
            htmlFor="login-password" 
            className="block text-sm font-medium text-light/80 mb-2"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-dark border rounded-lg font-mono text-sm
                transition-all duration-200 focus:outline-none focus:ring-2 pr-12
                ${validationErrors.password 
                  ? 'border-red-500 focus:ring-red-500/50' 
                  : 'border-light/20 focus:ring-light/50 focus:border-light/40'
                }
                text-light placeholder-light/40`}
              placeholder="••••••••"
              disabled={isSubmitting || loading}
              aria-invalid={!!validationErrors.password}
              aria-describedby={validationErrors.password ? 'login-password-error' : undefined}
              aria-required="true"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-light/60 
                hover:text-light transition-colors p-1 rounded focus:outline-none 
                focus:ring-2 focus:ring-light/50"
              disabled={isSubmitting || loading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {validationErrors.password && (
            <p id="login-password-error" className="mt-2 text-sm text-red-400" role="alert">
              {validationErrors.password}
            </p>
          )}
        </div>
      </div>

      {/* Auth Error Display */}
      {error && (
        <div 
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || loading}
        className="w-full px-6 py-3 bg-light text-dark font-medium rounded-lg
          transition-all duration-200 hover:bg-light/90 disabled:opacity-50 
          disabled:cursor-not-allowed focus:outline-none focus:ring-2 
          focus:ring-light/50 focus:ring-offset-2 focus:ring-offset-dark"
        aria-label={isSubmitting || loading ? 'Logging in, please wait' : 'Log in to your account'}
      >
        {isSubmitting || loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" 
                stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Logging in...
          </span>
        ) : (
          'Log In'
        )}
      </button>

      {/* Switch to Signup */}
      {onSwitchToSignup && (
        <div className="text-center">
          <p className="text-sm text-light/60">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-light hover:underline font-medium focus:outline-none 
                focus:ring-2 focus:ring-light/50 rounded px-1"
              disabled={isSubmitting || loading}
              aria-label="Switch to sign up form"
            >
              Sign up
            </button>
          </p>
        </div>
      )}
    </form>
  )
}
