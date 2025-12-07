import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as fc from 'fast-check'
import LoginForm from './LoginForm'
import { AuthProvider } from '../contexts/AuthContext'
import { api } from '../services/api'
import * as storage from '../utils/storage'

// Mock the API module
vi.mock('../services/api', () => ({
  api: {
    login: vi.fn(),
    getMe: vi.fn()
  }
}))

// Mock storage utilities
vi.mock('../utils/storage', () => ({
  setToken: vi.fn(),
  getToken: vi.fn(),
  setUser: vi.fn(),
  getUser: vi.fn(),
  clearAuthData: vi.fn(),
  getDeviceId: vi.fn(() => 'test-device-id')
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storage.getToken.mockReturnValue(null)
    storage.getUser.mockReturnValue(null)
  })

  const renderLoginForm = (props = {}) => {
    return render(
      <AuthProvider>
        <LoginForm {...props} />
      </AuthProvider>
    )
  }

  // Test form renders correctly
  // Requirements: 2.1, 2.4
  describe('Form Rendering', () => {
    it('should render email input field', () => {
      renderLoginForm()
      
      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toBeInTheDocument()
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('name', 'email')
    })

    it('should render password input field', () => {
      renderLoginForm()
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      expect(passwordInput).toBeInTheDocument()
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('name', 'password')
    })

    it('should render submit button', () => {
      renderLoginForm()
      
      const submitButton = screen.getByRole('button', { name: /log in/i })
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('should render password visibility toggle button', () => {
      renderLoginForm()
      
      const toggleButton = screen.getByRole('button', { name: /show password/i })
      expect(toggleButton).toBeInTheDocument()
    })

    it('should render signup link when onSwitchToSignup is provided', () => {
      const onSwitchToSignup = vi.fn()
      renderLoginForm({ onSwitchToSignup })
      
      const signupLink = screen.getByRole('button', { name: /sign up/i })
      expect(signupLink).toBeInTheDocument()
    })

    it('should not render signup link when onSwitchToSignup is not provided', () => {
      renderLoginForm()
      
      const signupLink = screen.queryByRole('button', { name: /sign up/i })
      expect(signupLink).not.toBeInTheDocument()
    })
  })

  // Test validation works
  // Requirements: 2.1, 2.4
  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      renderLoginForm()
      
      const submitButton = screen.getByRole('button', { name: /log in/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })
    })

    it('should show error when email format is invalid', async () => {
      renderLoginForm()
      
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      
      // Type invalid email and valid password
      await userEvent.clear(emailInput)
      await userEvent.type(emailInput, 'invalid-email')
      await userEvent.type(passwordInput, 'password123')
      
      // Get the form and submit it
      const form = emailInput.closest('form')
      fireEvent.submit(form)
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })
    })

    it('should show error when password is empty', async () => {
      renderLoginForm()
      
      const emailInput = screen.getByLabelText(/email/i)
      await userEvent.type(emailInput, 'test@example.com')
      
      const submitButton = screen.getByRole('button', { name: /log in/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })

    it('should show error when password is too short', async () => {
      renderLoginForm()
      
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, '12345')
      
      const submitButton = screen.getByRole('button', { name: /log in/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
      })
    })

    it('should clear validation error when user types in field', async () => {
      renderLoginForm()
      
      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /log in/i })
      
      // Trigger validation error
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })
      
      // Type in email field
      await userEvent.type(emailInput, 'test@example.com')
      
      // Error should be cleared
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument()
    })

    it('should not submit form when validation fails', async () => {
      renderLoginForm()
      
      const submitButton = screen.getByRole('button', { name: /log in/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })
      
      expect(api.login).not.toHaveBeenCalled()
    })
  })

  // Test submission calls login method
  // Requirements: 2.1, 2.4
  describe('Form Submission', () => {
    it('should call login method with correct credentials', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token',
        user_type: 'authenticated'
      }
      
      api.login.mockResolvedValue(mockResponse)
      
      renderLoginForm()
      
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const submitButton = screen.getByRole('button', { name: /log in/i })
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'password123')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(api.login).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('should call onSuccess callback after successful login', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token',
        user_type: 'authenticated'
      }
      
      api.login.mockResolvedValue(mockResponse)
      
      const onSuccess = vi.fn()
      renderLoginForm({ onSuccess })
      
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const submitButton = screen.getByRole('button', { name: /log in/i })
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'password123')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('should show loading state during submission', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token',
        user_type: 'authenticated'
      }
      
      // Delay the response to see loading state
      api.login.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      )
      
      renderLoginForm()
      
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const submitButton = screen.getByRole('button', { name: /log in/i })
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'password123')
      fireEvent.click(submitButton)
      
      // Check for loading text
      expect(screen.getByText(/logging in/i)).toBeInTheDocument()
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText(/logging in/i)).not.toBeInTheDocument()
      })
    })

    it('should disable form inputs during submission', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token',
        user_type: 'authenticated'
      }
      
      api.login.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      )
      
      renderLoginForm()
      
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const submitButton = screen.getByRole('button', { name: /log in/i })
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'password123')
      fireEvent.click(submitButton)
      
      // Inputs should be disabled
      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
      expect(submitButton).toBeDisabled()
      
      // Wait for completion
      await waitFor(() => {
        expect(emailInput).not.toBeDisabled()
      })
    })
  })

  // Test error display
  // Requirements: 2.1, 2.4
  describe('Error Display', () => {
    it('should display error message when login fails', async () => {
      const errorResponse = {
        response: {
          data: { detail: 'Invalid email or password' }
        }
      }
      
      api.login.mockRejectedValue(errorResponse)
      
      renderLoginForm()
      
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const submitButton = screen.getByRole('button', { name: /log in/i })
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'wrongpassword')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
      })
    })

    it('should clear error message when user starts typing', async () => {
      const errorResponse = {
        response: {
          data: { detail: 'Invalid credentials' }
        }
      }
      
      api.login.mockRejectedValue(errorResponse)
      
      renderLoginForm()
      
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const submitButton = screen.getByRole('button', { name: /log in/i })
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'wrongpassword')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
      
      // Start typing again
      await userEvent.type(passwordInput, 'a')
      
      // Error should be cleared
      expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument()
    })

    it('should display generic error message when no detail is provided', async () => {
      api.login.mockRejectedValue(new Error('Network error'))
      
      renderLoginForm()
      
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const submitButton = screen.getByRole('button', { name: /log in/i })
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'password123')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/unable to connect/i)).toBeInTheDocument()
      })
    })
  })

  // Test password visibility toggle
  describe('Password Visibility', () => {
    it('should toggle password visibility when button is clicked', async () => {
      renderLoginForm()
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      const toggleButton = screen.getByRole('button', { name: /show password/i })
      
      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password')
      
      // Click to show password
      fireEvent.click(toggleButton)
      
      expect(passwordInput).toHaveAttribute('type', 'text')
      expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument()
      
      // Click to hide password again
      fireEvent.click(toggleButton)
      
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument()
    })
  })

  // Test switch to signup
  describe('Switch to Signup', () => {
    it('should call onSwitchToSignup when signup link is clicked', async () => {
      const onSwitchToSignup = vi.fn()
      renderLoginForm({ onSwitchToSignup })
      
      const signupLink = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(signupLink)
      
      expect(onSwitchToSignup).toHaveBeenCalled()
    })

    it('should disable signup link during submission', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token',
        user_type: 'authenticated'
      }
      
      api.login.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      )
      
      const onSwitchToSignup = vi.fn()
      renderLoginForm({ onSwitchToSignup })
      
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const submitButton = screen.getByRole('button', { name: /log in/i })
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'password123')
      fireEvent.click(submitButton)
      
      const signupLink = screen.getByRole('button', { name: /sign up/i })
      expect(signupLink).toBeDisabled()
      
      await waitFor(() => {
        expect(signupLink).not.toBeDisabled()
      })
    })
  })
})


// Feature: auth-ui, Property 3: Invalid credentials display error without state change
// Validates: Requirements 1.4, 2.4
describe('Property 3: Invalid credentials display error without state change', () => {
  it('should display error and maintain unauthenticated state for any invalid credentials', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.stringMatching(/^[a-zA-Z0-9]{6,20}$/),
        fc.string({ minLength: 5, maxLength: 50 }),
        async (email, password, errorMessage) => {
          // Setup - mock API to reject with error
          vi.clearAllMocks()
          storage.getToken.mockReturnValue(null)
          storage.getUser.mockReturnValue(null)
          
          const errorResponse = {
            response: {
              data: { detail: errorMessage }
            }
          }
          
          api.login.mockRejectedValue(errorResponse)
          
          // Create a container for this test
          const container = document.createElement('div')
          document.body.appendChild(container)
          
          // Render component
          const { unmount } = render(
            <AuthProvider>
              <LoginForm />
            </AuthProvider>,
            { container }
          )
          
          try {
            // Get form elements
            const emailInput = screen.getByRole('textbox', { name: /email/i })
            const passwordInput = screen.getByLabelText(/^password$/i)
            const form = emailInput.closest('form')
            
            // Submit with invalid credentials
            await userEvent.type(emailInput, email)
            await userEvent.type(passwordInput, password)
            fireEvent.submit(form)
            
            // Wait for error to appear
            await waitFor(() => {
              expect(screen.getByText(errorMessage)).toBeInTheDocument()
            }, { timeout: 2000 })
            
            // Verify no tokens were stored (state remains unauthenticated)
            expect(storage.setToken).not.toHaveBeenCalled()
            expect(storage.setUser).not.toHaveBeenCalled()
            
            // Verify API was called with the credentials
            expect(api.login).toHaveBeenCalledWith(email, password)
          } finally {
            // Clean up
            unmount()
            document.body.removeChild(container)
          }
        }
      ),
      { numRuns: 10 }
    )
  }, 60000)

  it('should not store tokens for any failed authentication attempt', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.stringMatching(/^[a-zA-Z0-9]{6,20}$/),
        async (email, password) => {
          // Setup - mock API to reject
          vi.clearAllMocks()
          storage.getToken.mockReturnValue(null)
          storage.getUser.mockReturnValue(null)
          
          api.login.mockRejectedValue(new Error('Authentication failed'))
          
          // Create a container for this test
          const container = document.createElement('div')
          document.body.appendChild(container)
          
          // Render component
          const { unmount } = render(
            <AuthProvider>
              <LoginForm />
            </AuthProvider>,
            { container }
          )
          
          try {
            // Get form elements
            const emailInput = screen.getByRole('textbox', { name: /email/i })
            const passwordInput = screen.getByLabelText(/^password$/i)
            const form = emailInput.closest('form')
            
            // Submit with credentials
            await userEvent.type(emailInput, email)
            await userEvent.type(passwordInput, password)
            fireEvent.submit(form)
            
            // Wait for error state
            await waitFor(() => {
              expect(api.login).toHaveBeenCalled()
            }, { timeout: 2000 })
            
            // Verify no authentication data was stored
            expect(storage.setToken).not.toHaveBeenCalled()
            expect(storage.setUser).not.toHaveBeenCalled()
          } finally {
            // Clean up
            unmount()
            document.body.removeChild(container)
          }
        }
      ),
      { numRuns: 10 }
    )
  }, 60000)
})
