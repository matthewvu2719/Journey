import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoginForm from '../components/LoginForm'
import SignupForm from '../components/SignupForm'
import GuestModeButton from '../components/GuestModeButton'

/**
 * Login page component
 * Displays authentication UI for login/signup
 */
function Login() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [currentView, setCurrentView] = useState('login')

  // Redirect to main page if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/main', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSuccess = () => {
    // Redirect to main page after successful authentication
    navigate('/main', { replace: true })
  }

  const switchToSignup = () => {
    setCurrentView('signup')
  }

  const switchToLogin = () => {
    setCurrentView('login')
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-darker border border-light/20 rounded-2xl shadow-2xl p-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-light mb-2">
          {currentView === 'login' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-light/60 mb-8">
          {currentView === 'login' 
            ? 'Log in to continue your habit journey' 
            : 'Start building better habits today'}
        </p>

        {/* Forms */}
        <div className="space-y-6">
          {currentView === 'login' ? (
            <div className="animate-fadeIn">
              <LoginForm 
                onSuccess={handleSuccess}
                onSwitchToSignup={switchToSignup}
              />
            </div>
          ) : (
            <div className="animate-fadeIn">
              <SignupForm 
                onSuccess={handleSuccess}
                onSwitchToLogin={switchToLogin}
              />
            </div>
          )}

          {/* Divider */}
          <div className="relative">
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
  )
}

export default Login
