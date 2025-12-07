import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getDeviceId } from '../utils/storage'

/**
 * GuestModeButton component for quick guest access
 * @param {Object} props
 * @param {Function} props.onSuccess - Callback after successful guest login
 */
export default function GuestModeButton({ onSuccess }) {
  const { guestLogin, loading, error, clearError } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Handle guest login
   */
  const handleGuestLogin = async () => {
    try {
      setIsSubmitting(true)
      clearError()
      
      // Generate or retrieve device ID
      const deviceId = getDeviceId()
      
      // Call guest login
      await guestLogin(deviceId)
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      // Error is handled by AuthContext
      console.error('Guest login failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Screen reader announcement for guest login status */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isSubmitting && 'Creating guest session, please wait'}
        {error && `Guest login error: ${error}`}
      </div>

      <button
        type="button"
        onClick={handleGuestLogin}
        disabled={isSubmitting || loading}
        className="w-full px-6 py-3 bg-dark border-2 border-light/30 text-light font-medium 
          rounded-lg transition-all duration-200 hover:bg-light/5 hover:border-light/50
          disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 
          focus:ring-light/50 focus:ring-offset-2 focus:ring-offset-dark"
        aria-label={isSubmitting || loading ? 'Creating guest session, please wait' : 'Try as Guest'}
      >
        {isSubmitting || loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
                fill="none" 
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
              />
            </svg>
            Creating Guest Session...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
              />
            </svg>
            Try as Guest
          </span>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div 
          className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}
