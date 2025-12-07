import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

/**
 * SignupForm component for user registration
 * @param {Object} props
 * @param {Function} props.onSuccess - Callback after successful signup
 * @param {Function} props.onSwitchToLogin - Callback to switch to login form
 */
export default function SignupForm({ onSuccess, onSwitchToLogin }) {
  const { signup, loading, error, clearError } = useAuth()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  const [validationErrors, setValidationErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Validate email format
   */
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Calculate password strength
   * @returns {Object} { strength: 'weak'|'medium'|'strong', score: 0-3 }
   */
  const calculatePasswordStrength = (password) => {
    let score = 0
    
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    
    if (score <= 2) return { strength: 'weak', score }
    if (score <= 3) return { strength: 'medium', score }
    return { strength: 'strong', score }
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
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    } else if (!/[a-zA-Z]/.test(formData.password)) {
      errors.password = 'Password must contain at least one letter'
    } else if (!/\d/.test(formData.password)) {
      errors.password = 'Password must contain at least one number'
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
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
      await signup(formData.email, formData.password, formData.name || null)
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      // Error is handled by AuthContext
      console.error('Signup failed:', err)
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

  /**
   * Toggle confirm password visibility
   */
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(prev => !prev)
  }

  // Get password strength for display
  const passwordStrength = formData.password ? calculatePasswordStrength(formData.password) : null

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Sign up form">
      {/* Screen reader announcement for form status */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isSubmitting && 'Creating account, please wait'}
        {error && `Sign up error: ${error}`}
      </div>

      <div className="space-y-4">
        {/* Name Input (Optional) */}
        <div>
          <label 
            htmlFor="signup-name" 
            className="block text-sm font-medium text-light/80 mb-2"
          >
            Name <span className="text-light/50">(optional)</span>
          </label>
          <input
            id="signup-name"
            name="name"
            type="text"
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-dark border border-light/20 rounded-lg font-mono text-sm
              transition-all duration-200 focus:outline-none focus:ring-2
              focus:ring-light/50 focus:border-light/40
              text-light placeholder-light/40"
            placeholder="Your name"
            disabled={isSubmitting || loading}
            aria-required="false"
          />
        </div>

        {/* Email Input */}
        <div>
          <label 
            htmlFor="signup-email" 
            className="block text-sm font-medium text-light/80 mb-2"
          >
            Email
          </label>
          <input
            id="signup-email"
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
            aria-describedby={validationErrors.email ? 'signup-email-error' : undefined}
            aria-required="true"
          />
          {validationErrors.email && (
            <p id="signup-email-error" className="mt-2 text-sm text-red-400" role="alert">
              {validationErrors.email}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <label 
            htmlFor="signup-password" 
            className="block text-sm font-medium text-light/80 mb-2"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
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
              aria-describedby={validationErrors.password ? 'signup-password-error' : 'signup-password-strength'}
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
            <p id="signup-password-error" className="mt-2 text-sm text-red-400" role="alert">
              {validationErrors.password}
            </p>
          )}
          
          {/* Password Strength Indicator */}
          {passwordStrength && !validationErrors.password && (
            <div id="signup-password-strength" className="mt-2" role="status" aria-live="polite">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-dark rounded-full overflow-hidden" role="progressbar" 
                  aria-valuenow={passwordStrength.score} aria-valuemin="0" aria-valuemax="5"
                  aria-label={`Password strength: ${passwordStrength.strength}`}>
                  <div 
                    className={`h-full transition-all duration-300 ${
                      passwordStrength.strength === 'weak' ? 'w-1/3 bg-red-500' :
                      passwordStrength.strength === 'medium' ? 'w-2/3 bg-yellow-500' :
                      'w-full bg-green-500'
                    }`}
                  />
                </div>
                <span className={`text-xs font-medium ${
                  passwordStrength.strength === 'weak' ? 'text-red-400' :
                  passwordStrength.strength === 'medium' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password Input */}
        <div>
          <label 
            htmlFor="signup-confirmPassword" 
            className="block text-sm font-medium text-light/80 mb-2"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="signup-confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-dark border rounded-lg font-mono text-sm
                transition-all duration-200 focus:outline-none focus:ring-2 pr-12
                ${validationErrors.confirmPassword 
                  ? 'border-red-500 focus:ring-red-500/50' 
                  : 'border-light/20 focus:ring-light/50 focus:border-light/40'
                }
                text-light placeholder-light/40`}
              placeholder="••••••••"
              disabled={isSubmitting || loading}
              aria-invalid={!!validationErrors.confirmPassword}
              aria-describedby={validationErrors.confirmPassword ? 'signup-confirm-password-error' : undefined}
              aria-required="true"
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-light/60 
                hover:text-light transition-colors p-1 rounded focus:outline-none 
                focus:ring-2 focus:ring-light/50"
              disabled={isSubmitting || loading}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              aria-pressed={showConfirmPassword}
              title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? (
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
          {validationErrors.confirmPassword && (
            <p id="signup-confirm-password-error" className="mt-2 text-sm text-red-400" role="alert">
              {validationErrors.confirmPassword}
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
        aria-label={isSubmitting || loading ? 'Creating account, please wait' : 'Create your account'}
      >
        {isSubmitting || loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" 
                stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Creating account...
          </span>
        ) : (
          'Sign Up'
        )}
      </button>

      {/* Switch to Login */}
      {onSwitchToLogin && (
        <div className="text-center">
          <p className="text-sm text-light/60">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-light hover:underline font-medium focus:outline-none 
                focus:ring-2 focus:ring-light/50 rounded px-1"
              disabled={isSubmitting || loading}
              aria-label="Switch to login form"
            >
              Log in
            </button>
          </p>
        </div>
      )}
    </form>
  )
}
