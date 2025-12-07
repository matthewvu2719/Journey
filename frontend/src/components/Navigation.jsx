import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from './AuthModal'
import ThemeSelector from './ThemeSelector'

export default function Navigation({ show, currentSection, onNavigate }) {
  const { user, isAuthenticated, isGuest, logout } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalView, setAuthModalView] = useState('login')

  const sections = [
    { id: 'hero', label: 'Home' },
    { id: 'journey', label: 'Journey' },
    { id: 'habits', label: 'Habits' },
    { id: 'timetable', label: 'Schedule' },
    { id: 'analytics', label: 'Insights' },
  ]

  const handleLoginClick = () => {
    setAuthModalView('login')
    setShowAuthModal(true)
  }

  const handleSignupClick = () => {
    setAuthModalView('signup')
    setShowAuthModal(true)
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <>
      <nav className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'
      }`}>
        <div className="glass rounded-full px-6 py-3 flex items-center gap-2">
          {sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => onNavigate(section.id)}
              className={`px-4 py-2 rounded-full font-mono text-sm transition-all ${
                currentSection === section.id
                  ? 'bg-light text-dark'
                  : 'text-light/60 hover:text-light hover:bg-light/10'
              }`}
            >
              {section.label}
            </button>
          ))}

          {/* Theme Selector */}
          <div className="ml-2 pl-2 border-l border-light/20">
            <ThemeSelector />
          </div>

          {/* Auth Status Display */}
          <div className="ml-2 pl-2 border-l border-light/20 flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Display user email or guest badge */}
                {isGuest ? (
                  <span 
                    className="px-3 py-1.5 rounded-full bg-accent/20 text-accent text-xs font-mono"
                    data-testid="guest-badge"
                  >
                    Guest Mode
                  </span>
                ) : (
                  <span 
                    className="px-3 py-1.5 text-light/80 text-sm font-mono"
                    data-testid="user-email"
                  >
                    {user?.email}
                  </span>
                )}
                
                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-full text-sm text-light/60 hover:text-light 
                    hover:bg-light/10 transition-all"
                  data-testid="logout-button"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Login and Signup buttons */}
                <button
                  onClick={handleLoginClick}
                  className="px-4 py-2 rounded-full text-sm text-light/60 hover:text-light 
                    hover:bg-light/10 transition-all"
                  data-testid="login-button"
                >
                  Login
                </button>
                <button
                  onClick={handleSignupClick}
                  className="px-4 py-2 rounded-full text-sm bg-accent text-dark 
                    hover:bg-accent/90 transition-all"
                  data-testid="signup-button"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialView={authModalView}
      />
    </>
  )
}
