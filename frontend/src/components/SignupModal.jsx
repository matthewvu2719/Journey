import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function SignupModal({ isOpen, onClose }) {
  const { signup } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      
      // Success - close modal
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: '', email: '', password: '', confirmPassword: '' })
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark/95 backdrop-blur-sm border border-light/20 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-light/10">
          <h2 className="text-xl font-bold text-light">Create Account</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-light/60 hover:text-light transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
          <div className="text-center pt-4 border-t border-light/10">
            <p className="text-sm text-light/60">
              Already have an account?{' '}
              <a
                href="/login"
                className="text-light hover:text-light/80 font-medium transition-colors"
              >
                Sign In
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}