import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * PublicRoute component that prevents authenticated users from accessing public pages
 * Redirects to main page if user is already authenticated
 * Shows loading spinner while checking auth status
 * Used for login and signup pages
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render when not authenticated
 * @param {string} props.redirectTo - Path to redirect to when authenticated (default: '/main')
 */
const PublicRoute = ({ children, redirectTo = '/main' }) => {
  const { isAuthenticated, isGuest, loading } = useAuth()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="mt-4 text-light/60 font-mono text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to main page if authenticated AND not a guest
  // Guests should be able to access login/signup pages
  if (isAuthenticated && !isGuest) {
    return <Navigate to={redirectTo} replace />
  }

  // User is not authenticated or is a guest, render children (login/signup pages)
  return <>{children}</>
}

export default PublicRoute
