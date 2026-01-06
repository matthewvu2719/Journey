import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import SignupModal from './SignupModal'

export default function UserMenu() {
  const { user, isGuest, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleLogin = () => {
    setIsOpen(false)
    navigate('/login')
  }

  const handleSignup = () => {
    setIsOpen(false)
    setShowSignupModal(true)
  }

  // Get display name
  const displayName = isGuest ? 'Guest' : user?.email?.split('@')[0] || 'User'

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* User Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-light/10 hover:bg-light/20 transition-colors border border-light/20"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-semibold">
            {displayName[0].toUpperCase()}
          </div>
          <span className="text-light text-sm font-medium hidden sm:block">
            {displayName}
          </span>
          <svg
            className={`w-4 h-4 text-light transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 glass rounded-lg border border-light/20 shadow-lg overflow-hidden z-50">
            <div className="p-2">
              {/* User Info */}
              <div className="px-3 py-2 border-b border-light/10 mb-2">
                <div className="text-xs text-light/60">
                  {isGuest ? 'Guest Mode' : 'Signed in as'}
                </div>
                <div className="text-sm text-light font-medium truncate">
                  {isGuest ? 'Guest User' : user?.email}
                </div>
              </div>

              {/* Menu Items */}
              {isGuest ? (
                <>
                  <button
                    onClick={handleLogin}
                    className="w-full text-left px-3 py-2 text-sm text-light hover:bg-[var(--color-accent)]/20 rounded transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Log In
                  </button>
                  <button
                    onClick={handleSignup}
                    className="w-full text-left px-3 py-2 text-sm text-light hover:bg-[var(--color-accent)]/20 rounded transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Sign Up
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-light hover:bg-red-500/20 rounded transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log Out
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Signup Modal */}
      {showSignupModal && (
        <SignupModal onClose={() => setShowSignupModal(false)} />
      )}
    </>
  )
}
