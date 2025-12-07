import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignupForm from './SignupForm'
import { AuthProvider } from '../contexts/AuthContext'
import { api } from '../services/api'
import * as storage from '../utils/storage'

// Mock the API module
vi.mock('../services/api', () => ({
  api: {
    signup: vi.fn(),
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

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storage.getToken.mockReturnValue(null)
    storage.getUser.mockReturnValue(null)
  })

  const renderSignupForm = (props = {}) => {
    return render(
      <AuthProvider>
        <SignupForm {...props} />
      </AuthProvider>
    )
  }

  // Test form renders correctly
  // Requirements: 1.1, 1.4
  describe('Form Rendering', () => {
    it('should render name input field', () => {
      renderSignupForm()
      
      const nameInput = screen.getByLabelText(/name/i)
      expect(nameInput).toBeInTheDocument()
      expect(nameInput).toHaveAttribute('type', 'text')
      expect(nameInput).toHaveAttribute('name', 'name')
    })

    it('should render email input field', () => {
      renderSignupForm()
      
      const emailInput = screen.getByLabelText(/^email$/i)
      expect(emailInput).toBeInTheDocument()
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('name', 'email')
    })

    it('should render password input field', () => {
      renderSignupForm()
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      expect(passwordInput).toBeInTheDocument()
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('name', 'password')
    })

    it('should render confirm password input field', () => {
      renderSignupForm()
      
      const confirmPasswordInput = document.getElementById('signup-confirmPassword')
      expect(confirmPasswordInput).toBeInTheDocument()
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('name', 'confirmPassword')
    })

    it('should render submit button', () => {
      renderSignupForm()
      
      const submitButton = screen.getByRole('button', { name: /sign up|create your account/i })
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('should render password visibility toggle buttons', () => {
      renderSignupForm()
      
      const passwordToggle = screen.getByRole('button', { name: /^show password$/i })
      const confirmPasswordToggle = screen.getByRole('button', { name: /show confirm password/i })
      expect(passwordToggle).toBeInTheDocument()
      expect(confirmPasswordToggle).toBeInTheDocument()
    })

    it('should render login link when onSwitchToLogin is provided', () => {
      const onSwitchToLogin = vi.fn()
      renderSignupForm({ onSwitchToLogin })
      
      const loginLink = screen.getByRole('button', { name: /switch to login form/i })
      expect(loginLink).toBeInTheDocument()
    })

    it('should not render login link when onSwitchToLogin is not provided', () => {
      renderSignupForm()
      
      const loginLink = screen.queryByRole('button', { name: /switch to login form/i })
      expect(loginLink).not.toBeInTheDocument()
    })
  })

  // Test validation works
  // Requirements: 1.1, 1.4
  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      renderSignupForm()
      
      const submitButton = screen.getByRole('button', { name: /sign up|create your account/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })
    })

    it('should show error when email format is invalid', async () => {
      renderSignupForm()
      
      const emailInput = screen.getByRole('textbox', { name: /^email$/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = document.getElementById('signup-confirmPassword')
      
      await userEvent.type(emailInput, 'invalid-email')
      await userEvent.type(passwordInput, 'Password123')
      await userEvent.type(confirmPasswordInput, 'Password123')
      
      const form = emailInput.closest('form')
      fireEvent.submit(form)
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })
    })

    it('should show error when password is empty', async () => {
      renderSignupForm()
      
      const emailInput = screen.getByRole('textbox', { name: /^email$/i })
      await userEvent.type(emailInput, 'test@example.com')
      
      const submitButton = screen.getByRole('button', { name: /sign up|create your account/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })

    it('should show error when password is too short', async () => {
      renderSignupForm()
      
      const emailInput = screen.getByRole('textbox', { name: /^email$/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'Pass1')
      
      const submitButton = screen.getByRole('button', { name: /sign up|create your account/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })

    it('should show error when password has no letters', async () => {
      renderSignupForm()
      
      const emailInput = screen.getByRole('textbox', { name: /^email$/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, '12345678')
      
      const submitButton = screen.getByRole('button', { name: /sign up|create your account/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one letter/i)).toBeInTheDocument()
      })
    })

    it('should show error when password has no numbers', async () => {
      renderSignupForm()
      
      const emailInput = screen.getByRole('textbox', { name: /^email$/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'Password')
      
      const submitButton = screen.getByRole('button', { name: /sign up|create your account/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one number/i)).toBeInTheDocument()
      })
    })

    it('should show error when confirm password is empty', async () => {
      renderSignupForm()
      
      const emailInput = screen.getByRole('textbox', { name: /^email$/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'Password123')
      
      const submitButton = screen.getByRole('button', { name: /sign up|create your account/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument()
      })
    })

    it('should show error when passwords do not match', async () => {
      renderSignupForm()
      
      const emailInput = screen.getByRole('textbox', { name: /^email$/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = document.getElementById('signup-confirmPassword')
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'Password123')
      await userEvent.type(confirmPasswordInput, 'Password456')
      
      const submitButton = screen.getByRole('button', { name: /sign up|create your account/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    it('should clear validation error when user types in field', async () => {
      renderSignupForm()
      
      const emailInput = screen.getByRole('textbox', { name: /^email$/i })
      const submitButton = screen.getByRole('button', { name: /sign up|create your account/i })
      
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
      renderSignupForm()
      
      const submitButton = screen.getByRole('button', { name: /sign up|create your account/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })
      
      expect(api.signup).not.toHaveBeenCalled()
    })
  })

  // Test password strength indicator
  // Requirements: 1.1, 1.4
  describe('Password Strength Indicator', () => {
    it('should not show strength indicator when password is empty', () => {
      renderSignupForm()
      
      expect(screen.queryByText(/weak/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/medium/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/strong/i)).not.toBeInTheDocument()
    })

    it('should show weak strength for short password with only letters and numbers', async () => {
      renderSignupForm()
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      await userEvent.type(passwordInput, 'pass123')
      
      await waitFor(() => {
        expect(screen.getByText(/weak/i)).toBeInTheDocument()
      })
    })

    it('should show medium strength for longer password with letters and numbers', async () => {
      renderSignupForm()
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      await userEvent.type(passwordInput, 'Password123')
      
      await waitFor(() => {
        expect(screen.getByText(/medium/i)).toBeInTheDocument()
      })
    })

    it('should show strong strength for complex password', async () => {
      renderSignupForm()
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      await userEvent.type(passwordInput, 'P@ssw0rd123!')
      
      await waitFor(() => {
        expect(screen.getByText(/strong/i)).toBeInTheDocument()
      })
    })

    it('should hide strength indicator when validation error is shown', async () => {
      renderSignupForm()
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      await userEvent.type(passwordInput, 'short')
      
      const submitButton = screen.getByRole('button', { name: /sign up|create your account/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
      
      // Strength indicator should not be visible when there's a validation error
      expect(screen.queryByText(/weak/i)).not.toBeInTheDocument()
    })
  })

  // Test submission calls signup method
  // Requirements: 1.1, 1.4
  describe('Form Submission', () => {
    it('should call signup method with correct credentials', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token',
        user_type: 'authenticated'
      }
      
      api.signup.mockResolvedValue(mockResponse)
      
      renderSignupForm()
      
      const emailInput = screen.getByRole('textbox', { name: /^email$/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = document.getElementById('signup-confirmPassword')
      const submitButton = screen.getByRole('button', { name: /sign up|create your account/i })
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'Password123')
      await userEvent.type(confirmPasswordInput, 'Password123')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(api.signup).toHaveBeenCalledWith('test@example.com', 'Password123', null)
      })
    })

    it('should call signup method with name when provided', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token',
        user_type: 'authenticated'
      }
      
      api.signup.mockResolvedValue(mockResponse)
      
      renderSignupForm()
      
      const nameInput = screen.getByRole('textbox', { name: /name/i })
      const emailInput = screen.getByRole('textbox', { name: /^email$/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = document.getElementById('signup-confirmPassword')
      const submitButton = screen.getByRole('button', { name: /sign up|create your account/i })
      
      await userEvent.type(nameInput, 'John Doe')
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'Password123')
      await userEvent.type(confirmPasswordInput, 'Password123')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(api.signup).toHaveBeenCalledWith('test@example.com', 'Password123', 'John Doe')
      })
    })

    it('should call onSuccess callback after successful signup', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token',
        user_type: 'authenticated'
      }
      
      api.signup.mockResolvedValue(mockResponse)
      
      const onSuccess = vi.fn()
      renderSignupForm({ onSuccess })
      
      const emailInput = screen.getByRole('textbox', { name: /^email$/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = document.getElementById('signup-confirmPassword')
      const submitButton = screen.getByRole('button', { name: /sign up|create your account/i })
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'Password123')
      await userEvent.type(confirmPasswordInput, 'Password123')
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
      api.signup.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      )
      
      renderSignupForm()
      
      const emailInput = screen.getByRole('textbox', { name: /^email$/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = document.getElementById('signup-confirmPassword')
      const submitButton = screen.getByRole('button', { name: /sign up|create your account/i })
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'Password123')
      await userEvent.type(confirmPasswordInput, 'Password123')
      fireEvent.click(submitButton)
      
      // Check for loading text in button
      const button = screen.getByRole('button', { name: /creating account/i })
      expect(button).toBeDisabled()
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /creating account/i })).not.toBeInTheDocument()
      })
    })

    it('should disable form inputs during submission', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token',
        user_type: 'authenticated'
      }
      
      api.signup.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      )
      
      renderSignupForm()
      
      const nameInput = screen.getByRole('textbox', { name: /name/i })
      const emailInput = screen.getByRole('textbox', { name: /^email$/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = document.getElementById('signup-confirmPassword')
      const submitButton = screen.getByRole('button', { name: /sign up|create your account/i })
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'Password123')
      await userEvent.type(confirmPasswordInput, 'Password123')
      fireEvent.click(submitButton)
      
      // Inputs should be disabled
      expect(nameInput).toBeDisabled()
      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
      expect(confirmPasswordInput).toBeDisabled()
      expect(submitButton).toBeDisabled()
      
      // Wait for completion
      await waitFor(() => {
        expect(emailInput).not.toBeDisabled()
      })
    })
  })

  // Test error display
  // Requirements: 1.1, 1.4
  describe('Error Display', () => {
    it('should display error message when signup fails', async () => {
      const errorResponse = {
        response: {
          data: { detail: 'Email already exists' }
        }
      }
      
      api.signup.mockRejectedValue(errorResponse)
      
      renderSignupForm()
      
      const emailInput = screen.getByRole('textbox', { name: /^email$/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = document.getElementById('signup-confirmPassword')
      const submitButton = screen.getByRole('button', { name: /sign up|create your account/i })
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'Password123')
      await userEvent.type(confirmPasswordInput, 'Password123')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveTextContent(/email already exists/i)
      })
    })

    it('should clear error message when user starts typing', async () => {
      const errorResponse = {
        response: {
          data: { detail: 'Signup failed' }
        }
      }
      
      api.signup.mockRejectedValue(errorResponse)
      
      renderSignupForm()
      
      const emailInput = screen.getByRole('textbox', { name: /^email$/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = document.getElementById('signup-confirmPassword')
      const submitButton = screen.getByRole('button', { name: /sign up|create your account/i })
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'Password123')
      await userEvent.type(confirmPasswordInput, 'Password123')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveTextContent(/signup failed/i)
      })
      
      // Start typing again
      await userEvent.type(emailInput, 'a')
      
      // Error should be cleared
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should display generic error message when no detail is provided', async () => {
      api.signup.mockRejectedValue(new Error('Network error'))
      
      renderSignupForm()
      
      const emailInput = screen.getByRole('textbox', { name: /^email$/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = document.getElementById('signup-confirmPassword')
      const submitButton = screen.getByRole('button', { name: /sign up|create your account/i })
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'Password123')
      await userEvent.type(confirmPasswordInput, 'Password123')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveTextContent(/unable to connect/i)
      })
    })
  })

  // Test password visibility toggle
  describe('Password Visibility', () => {
    it('should toggle password visibility when button is clicked', async () => {
      renderSignupForm()
      
      const passwordInput = screen.getByLabelText(/^password$/i)
      const toggleButtons = screen.getAllByRole('button', { name: /show password/i })
      const passwordToggle = toggleButtons[0]
      
      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password')
      
      // Click to show password
      fireEvent.click(passwordToggle)
      
      expect(passwordInput).toHaveAttribute('type', 'text')
      
      // Click to hide password again
      fireEvent.click(passwordToggle)
      
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should toggle confirm password visibility when button is clicked', async () => {
      renderSignupForm()
      
      const confirmPasswordInput = document.getElementById('signup-confirmPassword')
      const confirmPasswordToggle = screen.getByRole('button', { name: /show confirm password/i })
      
      // Initially password should be hidden
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
      
      // Click to show password
      fireEvent.click(confirmPasswordToggle)
      
      expect(confirmPasswordInput).toHaveAttribute('type', 'text')
      
      // Click to hide password again
      fireEvent.click(confirmPasswordToggle)
      
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    })
  })

  // Test switch to login
  describe('Switch to Login', () => {
    it('should call onSwitchToLogin when login link is clicked', async () => {
      const onSwitchToLogin = vi.fn()
      renderSignupForm({ onSwitchToLogin })
      
      const loginLink = screen.getByRole('button', { name: /switch to login form/i })
      fireEvent.click(loginLink)
      
      expect(onSwitchToLogin).toHaveBeenCalled()
    })

    it('should disable login link during submission', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token',
        user_type: 'authenticated'
      }
      
      api.signup.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      )
      
      const onSwitchToLogin = vi.fn()
      renderSignupForm({ onSwitchToLogin })
      
      const emailInput = screen.getByRole('textbox', { name: /^email$/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = document.getElementById('signup-confirmPassword')
      const submitButton = screen.getByRole('button', { name: /create your account/i })
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'Password123')
      await userEvent.type(confirmPasswordInput, 'Password123')
      fireEvent.click(submitButton)
      
      const loginLink = screen.getByRole('button', { name: /switch to login form/i })
      expect(loginLink).toBeDisabled()
      
      await waitFor(() => {
        expect(loginLink).not.toBeDisabled()
      })
    })
  })
})
