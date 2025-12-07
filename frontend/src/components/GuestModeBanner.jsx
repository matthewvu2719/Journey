import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from './AuthModal'

/**
 * GuestModeBanner component that displays when user is in guest mode
 * Shows a banner with option to convert to a registered account
 */
export default function GuestModeBanner() {
  const { isGuest, user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  // Don't show banner if not in guest mode or if dismissed
  if (!isGuest || isDismissed) {
    return null
  }

  const handleCreateAccount = () => {
    setShowAuthModal(true)
  }

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  return (
    <>
      <div 
        className="fixed top-0 left-0 right-0 z-40 bg-light backdrop-blur-sm 
          border-b border-light shadow-lg"
        data-testid="guest-mode-banner"
        role="banner"
        aria-label="Guest mode notification"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Banner Message */}
          <div className="flex items-center gap-3 flex-1">
            <svg 
              className="w-5 h-5 text-dark flex-shrink-0" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <p className="text-sm md:text-base text-dark font-medium">
              You're using <span className="font-bold">Guest Mode</span>. 
              <span className="hidden sm:inline"> Your data won't be saved permanently.</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateAccount}
              className="px-4 py-2 bg-dark text-light font-medium rounded-lg 
                transition-all duration-200 hover:bg-darker focus:outline-none 
                focus:ring-2 focus:ring-dark focus:ring-offset-2 focus:ring-offset-light
                text-sm whitespace-nowrap"
              data-testid="create-account-button"
              aria-label="Create account to save your data"
            >
              Create Account
            </button>
            
            <button
              onClick={handleDismiss}
              className="p-2 text-dark/60 hover:text-dark transition-colors 
                focus:outline-none focus:ring-2 focus:ring-dark focus:ring-offset-2 
                focus:ring-offset-light rounded"
              aria-label="Dismiss guest mode banner"
              title="Dismiss banner"
              data-testid="dismiss-banner-button"
            >
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
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Auth Modal for conversion - opens to signup by default */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialView="signup"
      />
    </>
  )
}
