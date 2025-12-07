import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthModal from './AuthModal'
import { AuthProvider } from '../contexts/AuthContext'
import { api } from '../services/api'
import * as storage from '../utils/storage'

// Mock the API module
vi.mock('../services/api', () => ({
  api: {
    login: vi.fn(),
    signup: vi.fn(),
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
  getDeviceId: vi.fn(() => 'test-device-id')
}))

describe('AuthModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storage.getToken.mockReturnValue(null)
    storage.getUser.mockReturnValue(null)
  })

  const renderAuthModal = (props = {}) => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      initialView: 'login',
      ...props
    }
    
    return render(
      <AuthProvider>
        <AuthModal {...defaultProps} />
      </AuthProvider>
    )
  }

  // Test modal opens and closes
  // Requirements: 1.1, 2.1
  describe('Modal Open/Close', () => {
    it('should render modal when isOpen is true', () => {
      renderAuthModal({ isOpen: true })
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByLabelText(/close modal/i)).toBeInTheDocument()
    })

    it('should not render modal when isOpen is false', () => {
      renderAuthModal({ isOpen: false })
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn()
      renderAuthModal({ onClose })
      
      const closeButton = screen.getByLabelText(/close modal/i)
      fireEvent.click(closeButton)
      
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when escape key is pressed', () => {
      const onClose = vi.fn()
      renderAuthModal({ onClose })
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should not call onClose when escape is pressed and modal is closed', () => {
      const onClose = vi.fn()
      renderAuthModal({ isOpen: false, onClose })
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(onClose).not.toHaveBeenCalled()
    })

    it('should prevent body scroll when modal is open', () => {
      renderAuthModal({ isOpen: true })
      
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('should restore body scroll when modal is closed', () => {
      const { rerender } = renderAuthModal({ isOpen: true })
      
      expect(document.body.style.overflow).toBe('hidden')
      
      rerender(
        <AuthProvider>
          <AuthModal isOpen={false} onClose={vi.fn()} initialView="login" />
        </AuthProvider>
      )
      
      expect(document.body.style.overflow).toBe('unset')
    })

    it('should have proper ARIA attributes', () => {
      renderAuthModal()
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'auth-modal-title')
    })
  })

  // Test backdrop click closes modal
  // Requirements: 1.1, 2.1
  describe('Backdrop Click', () => {
    it('should call onClose when backdrop is clicked', () => {
      const onClose = vi.fn()
      renderAuthModal({ onClose })
      
      const backdrop = screen.getByRole('dialog')
      fireEvent.click(backdrop)
      
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should not call onClose when modal content is clicked', () => {
      const onClose = vi.fn()
      renderAuthModal({ onClose })
      
      const modalTitle = screen.getByText(/welcome back/i)
      fireEvent.click(modalTitle)
      
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  // Test view switching
  // Requirements: 1.1, 2.1
  describe('View Switching', () => {
    it('should display login view when initialView is login', () => {
      renderAuthModal({ initialView: 'login' })
      
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
      expect(screen.getByText(/log in to continue your habit journey/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
    })

    it('should display signup view when initialView is signup', () => {
      renderAuthModal({ initialView: 'signup' })
      
      expect(screen.getByText(/create account/i)).toBeInTheDocument()
      expect(screen.getByText(/start building better habits today/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    })

    it('should switch from login to signup when signup link is clicked', async () => {
      renderAuthModal({ initialView: 'login' })
      
      // Initially on login view
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
      
      // Click signup link
      const signupLink = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(signupLink)
      
      // Should now be on signup view
      await waitFor(() => {
        expect(screen.getByText(/create account/i)).toBeInTheDocument()
      })
    })

    it('should switch from signup to login when login link is clicked', async () => {
      renderAuthModal({ initialView: 'signup' })
      
      // Initially on signup view
      expect(screen.getByText(/create account/i)).toBeInTheDocument()
      
      // Click login link
      const loginLink = screen.getByRole('button', { name: /log in/i })
      fireEvent.click(loginLink)
      
      // Should now be on login view
      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
      })
    })

    it('should reset to initialView when modal is reopened', () => {
      const { rerender } = renderAuthModal({ isOpen: true, initialView: 'login' })
      
      // Switch to signup
      const signupLink = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(signupLink)
      
      expect(screen.getByText(/create account/i)).toBeInTheDocument()
      
      // Close modal
      rerender(
        <AuthProvider>
          <AuthModal isOpen={false} onClose={vi.fn()} initialView="login" />
        </AuthProvider>
      )
      
      // Reopen modal
      rerender(
        <AuthProvider>
          <AuthModal isOpen={true} onClose={vi.fn()} initialView="login" />
        </AuthProvider>
      )
      
      // Should be back to login view
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
    })
  })

  // Test component integration
  describe('Component Integration', () => {
    it('should render LoginForm in login view', () => {
      renderAuthModal({ initialView: 'login' })
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    })

    it('should render SignupForm in signup view', () => {
      renderAuthModal({ initialView: 'signup' })
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })

    it('should render GuestModeButton in both views', () => {
      const { rerender } = renderAuthModal({ initialView: 'login' })
      
      expect(screen.getByRole('button', { name: /try as guest/i })).toBeInTheDocument()
      
      rerender(
        <AuthProvider>
          <AuthModal isOpen={true} onClose={vi.fn()} initialView="signup" />
        </AuthProvider>
      )
      
      expect(screen.getByRole('button', { name: /try as guest/i })).toBeInTheDocument()
    })

    it('should render divider between form and guest button', () => {
      renderAuthModal()
      
      // Look for the divider with "or" text that's specifically in the divider span
      const dividerText = screen.getByText((content, element) => {
        return element?.tagName === 'SPAN' && 
               element?.className.includes('bg-darker') && 
               content === 'or'
      })
      expect(dividerText).toBeInTheDocument()
    })
  })

  // Test successful authentication closes modal
  describe('Authentication Success', () => {
    it('should close modal after successful login', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token',
        user_type: 'authenticated'
      }
      
      api.login.mockResolvedValue(mockResponse)
      
      const onClose = vi.fn()
      renderAuthModal({ onClose, initialView: 'login' })
      
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const submitButton = screen.getByRole('button', { name: /log in/i })
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'password123')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('should close modal after successful signup', async () => {
      const mockResponse = {
        user_id: 'user-123',
        email: 'test@example.com',
        access_token: 'valid-token',
        user_type: 'authenticated'
      }
      
      api.signup.mockResolvedValue(mockResponse)
      
      const onClose = vi.fn()
      renderAuthModal({ onClose, initialView: 'signup' })
      
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /sign up/i })
      
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'password123')
      await userEvent.type(confirmPasswordInput, 'password123')
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('should close modal after successful guest login', async () => {
      const mockResponse = {
        user_id: 'guest-123',
        email: null,
        access_token: 'guest-token',
        user_type: 'guest'
      }
      
      api.guestLogin.mockResolvedValue(mockResponse)
      
      const onClose = vi.fn()
      renderAuthModal({ onClose })
      
      const guestButton = screen.getByRole('button', { name: /try as guest/i })
      fireEvent.click(guestButton)
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled()
      })
    })
  })

  // Test responsive design
  describe('Responsive Design', () => {
    it('should have responsive modal container classes', () => {
      renderAuthModal()
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('fixed', 'inset-0', 'flex', 'items-center', 'justify-center', 'p-4')
    })

    it('should have max width and scrollable content', () => {
      renderAuthModal()
      
      const modalContent = screen.getByRole('dialog').querySelector('div')
      expect(modalContent).toHaveClass('max-w-md', 'max-h-[90vh]', 'overflow-y-auto')
    })
  })
})
