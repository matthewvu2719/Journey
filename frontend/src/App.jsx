import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { BoboProvider } from './contexts/BoboContext'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import Landing from './pages/Landing'
import MainPage from './pages/MainPage'
import Login from './pages/Login'
import Signup from './pages/Signup'

/**
 * Root redirect component that checks authentication
 */
const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth()
  
  // Add timeout for auth loading to prevent infinite loading
  if (loading) {
    setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout - proceeding to landing')
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
  
  return <Navigate to={isAuthenticated ? "/main" : "/"} replace />
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
            {/* Root route - Landing page for unauthenticated users */}
            <Route path="/" element={<Landing />} />
            
            {/* Public routes - redirect to main if authenticated */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              } 
            />
            
            {/* Protected routes - require authentication */}
            <Route 
              path="/main" 
              element={
                <ProtectedRoute>
                  <MainPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Legacy dashboard route - redirect to main */}
            <Route path="/dashboard" element={<Navigate to="/main" replace />} />
            
            {/* Catch all - redirect to root */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BoboProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
