import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { BoboProvider } from './contexts/BoboContext'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'

/**
 * Root redirect component that checks authentication
 */
const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth()
  
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
  
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
}

/**
 * Main App component with authentication routing
 * Wraps the app with AuthProvider and sets up route configuration
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BoboProvider>
          <Routes>
            {/* Root route - redirect based on auth status */}
            <Route path="/" element={<RootRedirect />} />
            
            {/* Public routes - redirect to dashboard if authenticated */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            
            {/* Protected routes - require authentication */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BoboProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
