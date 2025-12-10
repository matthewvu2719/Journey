import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function UserProfile() {
  const { user, isAuthenticated, isGuest, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      setIsDropdownOpen(false)
      // Redirect will be handled by the auth context
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleCreateAccount = async () => {
    try {
      setIsDropdownOpen(false)
      // If user is a guest, logout first to clear guest session
      if (isGuest) {
        await logout()
      }
      // Navigate to signup page
      window.location.href = '/signup'
    } catch (error) {
      console.error('Failed to exit guest mode:', error)
      // Navigate anyway
      window.location.href = '/signup'
    }
  }

  const handleSignIn = async () => {
    try {
      setIsDropdownOpen(false)
      // If user is a guest, logout first to clear guest session
      if (isGuest) {
        await logout()
      }
      // Navigate to login page
      window.location.href = '/login'
    } catch (error) {
      console.error('Failed to exit guest mode:', error)
      // Navigate anyway
      window.location.href = '/login'
    }
  }

  const getUserDisplayName = () => {
    if (!user) return 'Guest'
    if (user.name) return user.name
    if (user.email) return user.email.split('@')[0]
    return isGuest ? 'Guest User' : 'User'
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <a
          href="/login"
          className="px-4 py-2 text-sm font-medium text-light/80 hover:text-light transition-colors"
        >
          Sign In
        </a>
        <a
          href="/login"
          className="px-4 py-2 text-sm font-medium bg-light/10 hover:bg-light/20 text-light rounded-lg transition-all border border-light/20 hover:border-light/30"
        >
          Get Started
        </a>
      </div>
    )
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-light/10 transition-all group"
      >
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
          isGuest 
            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' 
            : 'bg-light/20 text-light border border-light/30'
        }`}>
          {getUserInitials()}
        </div>
        
        {/* User Info */}
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-light">
            {getUserDisplayName()}
          </div>
          {isGuest && (
            <div className="text-xs text-yellow-300/80">
              Guest Mode
            </div>
          )}
          {!isGuest && user?.email && (
            <div className="text-xs text-light/60">
              {user.email}
            </div>
          )}
        </div>

        {/* Dropdown Arrow */}
        <svg 
          className={`w-4 h-4 text-light/60 transition-transform ${
            isDropdownOpen ? 'rotate-180' : ''
          }`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-dark/95 backdrop-blur-sm border border-light/20 rounded-xl shadow-xl z-50">
          {/* User Info Header */}
          <div className="p-4 border-b border-light/10">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                isGuest 
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' 
                  : 'bg-light/20 text-light border border-light/30'
              }`}>
                {getUserInitials()}
              </div>
              <div>
                <div className="font-medium text-light">
                  {getUserDisplayName()}
                </div>
                {user?.email && (
                  <div className="text-sm text-light/60">
                    {user.email}
                  </div>
                )}
                {isGuest && (
                  <div className="text-xs text-yellow-300/80 flex items-center gap-1 mt-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Guest Mode - Data not saved
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {isGuest ? (
              <>
                <button
                  onClick={handleCreateAccount}
                  className="flex items-center gap-3 w-full p-3 text-left text-sm text-light hover:bg-light/10 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Create Account
                </button>
                <button
                  onClick={handleSignIn}
                  className="flex items-center gap-3 w-full p-3 text-left text-sm text-light hover:bg-light/10 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </button>
              </>
            ) : (
              <>
                <button
                  className="flex items-center gap-3 w-full p-3 text-left text-sm text-light hover:bg-light/10 rounded-lg transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile Settings
                </button>
                <button
                  className="flex items-center gap-3 w-full p-3 text-left text-sm text-light hover:bg-light/10 rounded-lg transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Preferences
                </button>
                <div className="border-t border-light/10 my-2"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full p-3 text-left text-sm text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </>
  )
}