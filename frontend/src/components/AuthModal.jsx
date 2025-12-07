import { useState, useEffect, useRef } from 'react'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'
import GuestModeButton from './GuestModeButton'

/**
 * AuthModal component for authentication UI
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {'login' | 'signup'} props.initialView - Initial view to display
 */
export default function AuthModal({ isOpen, onClose, initialView = 'login' }) {
  const [currentView, setCurrentView] = useState(initialView)
  const modalRef = useRef(null)
  const previousFocusRef = useRef(null)
  const closeButtonRef = useRef(null)

  // Update current view when initialView prop changes
  useEffect(() => {
    if (isOpen) {
      setCurrentView(initialView)
    }
  }, [initialView, isOpen])

  // Focus management and keyboard navigation
  useEffect(() => {
    if (isOpen) {
      // Store the element that had focus before modal opened
      previousFocusRef.current = document.activeElement
      
      // Focus the close button when modal opens
      setTimeout(() => {
        if (closeButtonRef.current) {
          closeButtonRef.current.focus()
        }
      }, 100)
      
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      // Restore focus to the element that opened the modal
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus()
      }
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle escape key press and focus trap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return

      // Handle Escape key
      if (e.key === 'Escape') {
        onClose()
        return
      }

      // Handle Tab key for focus trap
      if (e.key === 'Tab') {
        if (!modalRef.current) return

        const focusableElements = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        // If shift+tab on first element, focus last element
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
        // If tab on last element, focus first element
        else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Handle successful authentication
  const handleSuccess = () => {
    if (onClose) {
      onClose()
    }
  }

  // Switch to signup view
  const switchToSignup = () => {
    setCurrentView('signup')
  }

  // Switch to login view
  const switchToLogin = () => {
    setCurrentView('login')
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      aria-describedby="auth-modal-description"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-darker border border-light/20 rounded-2xl 
          shadow-2xl transform transition-all duration-300 ease-out
          max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-4 right-4 text-light/60 hover:text-light 
            transition-colors p-2 rounded-lg hover:bg-light/5 focus:outline-none 
            focus:ring-2 focus:ring-light/50 z-10"
          aria-label="Close modal"
          title="Close modal (Esc)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Content */}
        <div className="p-8">
          {/* Title */}
          <h2 id="auth-modal-title" className="text-2xl font-bold text-light mb-2">
            {currentView === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p id="auth-modal-description" className="text-light/60 mb-8">
            {currentView === 'login' 
              ? 'Log in to continue your habit journey' 
              : 'Start building better habits today'}
          </p>

          {/* Forms with smooth transition */}
          <div className="space-y-6">
            {currentView === 'login' ? (
              <div className="animate-fadeIn" role="region" aria-label="Login form">
                <LoginForm 
                  onSuccess={handleSuccess}
                  onSwitchToSignup={switchToSignup}
                />
              </div>
            ) : (
              <div className="animate-fadeIn" role="region" aria-label="Signup form">
                <SignupForm 
                  onSuccess={handleSuccess}
                  onSwitchToLogin={switchToLogin}
                />
              </div>
            )}

            {/* Divider */}
            <div className="relative" role="separator" aria-label="or">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-light/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-darker text-light/60">or</span>
              </div>
            </div>

            {/* Guest Mode Button */}
            <GuestModeButton onSuccess={handleSuccess} />
          </div>
        </div>
      </div>
    </div>
  )
}
