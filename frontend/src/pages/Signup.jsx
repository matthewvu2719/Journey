import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Signup page component
 * Displays signup form for creating new accounts
 */
function Signup() {
  const navigate = useNavigate()
  const { signup, isAuthenticated, logout, isGuest } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Exit guest mode if user is a guest
  useEffect(() => {
    const exitGuestMode = async () => {
      if (isGuest) {
        try {
          await logout()
        } catch (error) {
          console.error('Failed to exit guest mode:', error)
        }
      }
    }
    exitGuestMode()
  }, [isGuest, logout])

  // Redirect to dashboard if already authenticated (and not a guest)
  useEffect(() => {
    if (isAuthenticated && !isGuest) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isGuest, navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      await signup(formData.email, formData.password, formData.name || null)
      
      // Success - redirect to login page
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Signup error:', err)
      
      // Handle different types of errors
      let errorMessage = 'Failed to create account'
      
      if (err.response?.status === 500) {
        errorMessage = 'Authentication service is currently unavailable. You can continue using the app in guest mode from the main page.'
      } else if (err.response?.status === 400 || err.response?.status === 422) {
        const detail = err.response?.data?.detail
        if (typeof detail === 'string') {
          errorMessage = detail
        } else {
          errorMessage = 'Please check your email format and ensure your password is at least 6 characters long.'
        }
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please check your credentials.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSignInClick = () => {
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-darker border border-light/20 rounded-2xl shadow-2xl p-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-light mb-2">
          Create Account
        </h1>
        <p className="text-light/60 mb-8">
          Start building better habits today
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-light/80 mb-2">
              Name (optional)
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-3 bg-light/5 border border-light/20 rounded-lg text-light placeholder-light/40 focus:outline-none focus:border-light/40 focus:bg-light/10 transition-all disabled:opacity-50"
              placeholder="Your name"
            />
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-light/80 mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
              className="w-full px-4 py-3 bg-light/5 border border-light/20 rounded-lg text-light placeholder-light/40 focus:outline-none focus:border-light/40 focus:bg-light/10 transition-all disabled:opacity-50"
              placeholder="your@email.com"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-light/80 mb-2">
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
              className="w-full px-4 py-3 bg-light/5 border border-light/20 rounded-lg text-light placeholder-light/40 focus:outline-none focus:border-light/40 focus:bg-light/10 transition-all disabled:opacity-50"
              placeholder="At least 6 characters"
            />
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-light/80 mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              required
              className="w-full px-4 py-3 bg-light/5 border border-light/20 rounded-lg text-light placeholder-light/40 focus:outline-none focus:border-light/40 focus:bg-light/10 transition-all disabled:opacity-50"
              placeholder="Confirm your password"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-light text-dark font-semibold rounded-lg hover:bg-light/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-dark/20 border-t-dark rounded-full animate-spin"></div>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          {/* Sign In Link */}
          <div className="text-center pt-4 border-t border-light/10 space-y-2">
            <p className="text-sm text-light/60">
              Already have an account?{' '}
              <button
                type="button"
                onClick={handleSignInClick}
                className="text-light hover:text-light/80 font-medium transition-colors underline"
              >
                Sign In
              </button>
            </p>
            
            {/* Guest Mode Fallback */}
            {error && (
              <p className="text-xs text-light/50">
                Or{' '}
                <a
                  href="/"
                  className="text-light/70 hover:text-light font-medium transition-colors underline"
                >
                  continue as guest
                </a>
                {' '}to try the app without an account
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default Signup