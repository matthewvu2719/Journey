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
  
  // Add timeout for auth loading to prevent infinite loading
  if (loading) {
    setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout - proceeding to login')
      }
    }, 3000)
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-white/60 font-mono text-sm">Loading...</p>
        </div>
      </div>
    )
  }
  
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
}

/**
 * Main App component with authentication routing
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
            
            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BoboProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
