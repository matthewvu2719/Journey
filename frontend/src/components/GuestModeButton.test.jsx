import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GuestModeButton from './GuestModeButton'
import { AuthProvider } from '../contexts/AuthContext'
import { api } from '../services/api'
import * as storage from '../utils/storage'

// Mock the API module
vi.mock('../services/api', () => ({
  api: {
    guestLogin: vi.fn(),
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
  getDeviceId: vi.fn(() => 'test-device-id-123')
}))

describe('GuestModeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storage.getToken.mockReturnValue(null)
    storage.getUser.mockReturnValue(null)
  })

  const renderGuestModeButton = (props = {}) => {
    return render(
      <AuthProvider>
        <GuestModeButton {...props} />
      </AuthProvider>
    )
  }

  // Test button renders correctly
  // Requirements: 3.1
  describe('Button Rendering', () => {
    it('should render guest mode button', () => {
      renderGuestModeButton()
      
      const button = screen.getByRole('button', { name: /try as guest/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('type', 'button')
    })

    it('should display "Try as Guest" text', () => {
      renderGuestModeButton()
      
      expect(screen.getByText(/try as guest/i)).toBeInTheDocument()
    })

    it('should have guest icon', () => {
      renderGuestModeButton()
      
      const button = screen.getByRole('button', { name: /try as guest/i })
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  // Test guest login is called with device ID
  // Requirements: 3.1
  describe('Guest Login Functionality', () => {
    it('should call guestLogin with device ID when button is clicked', async () => {
      const mockResponse = {
        user_id: 'guest-123',
        email: null,
        access_token: 'guest-token',
        user_type: 'guest'
      }
      
      api.guestLogin.mockResolvedValue(mockResponse)
      
      renderGuestModeButton()
      
      const button = screen.getByRole('button', { name: /try as guest/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(storage.getDeviceId).toHaveBeenCalled()
        expect(api.guestLogin).toHaveBeenCalledWith('test-device-id-123')
      })
    })

    it('should call onSuccess callback after successful guest login', async () => {
      const mockResponse = {
        user_id: 'guest-123',
        email: null,
        access_token: 'guest-token',
        user_type: 'guest'
      }
      
      api.guestLogin.mockResolvedValue(mockResponse)
      
      const onSuccess = vi.fn()
      renderGuestModeButton({ onSuccess })
      
      const button = screen.getByRole('button', { name: /try as guest/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    it('should not call onSuccess if guest login fails', async () => {
      api.guestLogin.mockRejectedValue(new Error('Guest login failed'))
      
      const onSuccess = vi.fn()
      renderGuestModeButton({ onSuccess })
      
      const button = screen.getByRole('button', { name: /try as guest/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(api.guestLogin).toHaveBeenCalled()
      })
      
      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('should store token and user data after successful guest login', async () => {
      const mockResponse = {
        user_id: 'guest-123',
        email: null,
        access_token: 'guest-token',
        user_type: 'guest'
      }
      
      api.guestLogin.mockResolvedValue(mockResponse)
      
      renderGuestModeButton()
      
      const button = screen.getByRole('button', { name: /try as guest/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(storage.setToken).toHaveBeenCalledWith('guest-token')
        expect(storage.setUser).toHaveBeenCalledWith(mockResponse)
      })
    })
  })

  // Test loading state
  // Requirements: 3.1
  describe('Loading State', () => {
    it('should show loading state during guest session creation', async () => {
      const mockResponse = {
        user_id: 'guest-123',
        email: null,
        access_token: 'guest-token',
        user_type: 'guest'
      }
      
      // Delay the response to see loading state
      api.guestLogin.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      )
      
      renderGuestModeButton()
      
      const button = screen.getByRole('button', { name: /try as guest/i })
      fireEvent.click(button)
      
      // Check for loading text
      expect(screen.getByText(/creating guest session/i)).toBeInTheDocument()
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText(/creating guest session/i)).not.toBeInTheDocument()
      })
    })

    it('should disable button during guest session creation', async () => {
      const mockResponse = {
        user_id: 'guest-123',
        email: null,
        access_token: 'guest-token',
        user_type: 'guest'
      }
      
      api.guestLogin.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      )
      
      renderGuestModeButton()
      
      const button = screen.getByRole('button', { name: /try as guest/i })
      fireEvent.click(button)
      
      // Button should be disabled
      expect(button).toBeDisabled()
      
      // Wait for completion
      await waitFor(() => {
        expect(button).not.toBeDisabled()
      })
    })

    it('should show loading spinner during guest session creation', async () => {
      const mockResponse = {
        user_id: 'guest-123',
        email: null,
        access_token: 'guest-token',
        user_type: 'guest'
      }
      
      api.guestLogin.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      )
      
      renderGuestModeButton()
      
      const button = screen.getByRole('button', { name: /try as guest/i })
      fireEvent.click(button)
      
      // Check for spinner (animate-spin class)
      const spinner = button.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
      
      // Wait for completion
      await waitFor(() => {
        expect(button.querySelector('.animate-spin')).not.toBeInTheDocument()
      })
    })
  })

  // Test error handling
  describe('Error Handling', () => {
    it('should display error message when guest login fails', async () => {
      const errorResponse = {
        response: {
          data: { detail: 'Guest login failed. Please try again.' }
        }
      }
      
      api.guestLogin.mockRejectedValue(errorResponse)
      
      renderGuestModeButton()
      
      const button = screen.getByRole('button', { name: /try as guest/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/guest login failed/i)).toBeInTheDocument()
      })
    })

    it('should display generic error message when no detail is provided', async () => {
      api.guestLogin.mockRejectedValue(new Error('Network error'))
      
      renderGuestModeButton()
      
      const button = screen.getByRole('button', { name: /try as guest/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/unable to connect/i)).toBeInTheDocument()
      })
    })

    it('should not store tokens when guest login fails', async () => {
      api.guestLogin.mockRejectedValue(new Error('Guest login failed'))
      
      renderGuestModeButton()
      
      const button = screen.getByRole('button', { name: /try as guest/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(api.guestLogin).toHaveBeenCalled()
      })
      
      expect(storage.setToken).not.toHaveBeenCalled()
      expect(storage.setUser).not.toHaveBeenCalled()
    })

    it('should log error to console when guest login fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      api.guestLogin.mockRejectedValue(new Error('Guest login failed'))
      
      renderGuestModeButton()
      
      const button = screen.getByRole('button', { name: /try as guest/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Guest login failed:',
          expect.any(Error)
        )
      })
      
      consoleErrorSpy.mockRestore()
    })
  })

  // Test accessibility
  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      renderGuestModeButton()
      
      const button = screen.getByRole('button', { name: /try as guest/i })
      expect(button).toHaveAttribute('aria-label', 'Try as Guest')
    })

    it('should have role="alert" on error message', async () => {
      api.guestLogin.mockRejectedValue(new Error('Guest login failed'))
      
      renderGuestModeButton()
      
      const button = screen.getByRole('button', { name: /try as guest/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toBeInTheDocument()
        expect(alert).toHaveTextContent(/unable to connect/i)
      })
    })
  })
})
