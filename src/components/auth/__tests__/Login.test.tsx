/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Login from '../Login';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../config/auth-v2-config', () => ({
  shouldUseAuthV2: jest.fn(),
}));

describe('Login Component', () => {
  const mockPush = jest.fn();
  const mockOnLogin = jest.fn();
  const mockLogin = jest.fn();
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

  // Helper to render Login with default props
  const renderLogin = (props = {}) => {
    return render(<Login onLogin={mockOnLogin} {...props} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    } as any);

    mockUseAuth.mockReturnValue({
      login: mockLogin,
      user: null,
      token: null,
      loading: false,
      authVersion: 'v1',
      logout: jest.fn(),
      updateUser: jest.fn(),
    } as any);
  });

  describe('Rendering', () => {
    it('should render login form with all fields', () => {
      renderLogin();

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login|masuk/i })).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      renderLogin();

      expect(screen.getByText(/lupa password/i)).toBeInTheDocument();
    });

    it('should render register link', () => {
      renderLogin();

      expect(screen.getByText(/daftar|register/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for invalid email format', async () => {
      renderLogin();
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/email tidak valid/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty email', async () => {
      renderLogin();
      const user = userEvent.setup();

      const submitButton = screen.getByRole('button', { name: /login|masuk/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email.*required|wajib/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty password', async () => {
      renderLogin();
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /login|masuk/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password.*required|wajib/i)).toBeInTheDocument();
      });
    });

    it('should show error for password less than 6 characters', async () => {
      renderLogin();
      const user = userEvent.setup();

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, '12345');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password.*minimal.*6/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call login with correct credentials', async () => {
      mockLogin.mockResolvedValue({ success: true });
      
      renderLogin();
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login|masuk/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should redirect to dashboard on successful login', async () => {
      mockLogin.mockResolvedValue({ success: true });
      
      renderLogin();
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login|masuk/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show loading state during submission', async () => {
      mockLogin.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderLogin();
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login|masuk/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(screen.getByText(/loading|memproses/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should disable form during submission', async () => {
      mockLogin.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderLogin();
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login|masuk/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error for invalid credentials (V1)', async () => {
      mockLogin.mockRejectedValue(
        new Error('Email atau password salah')
      );

      renderLogin();
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login|masuk/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email atau password salah/i)).toBeInTheDocument();
      });
    });

    it('should display Firebase error for wrong password (V2)', async () => {
      const firebaseError = new Error('Password yang Anda masukkan salah');
      (firebaseError as any).code = 'auth/wrong-password';
      
      mockLogin.mockRejectedValue(firebaseError);

      renderLogin();
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login|masuk/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password yang anda masukkan salah/i)).toBeInTheDocument();
      });
    });

    it('should display Firebase error for user not found (V2)', async () => {
      const firebaseError = new Error('Pengguna dengan email ini tidak ditemukan');
      (firebaseError as any).code = 'auth/user-not-found';
      
      mockLogin.mockRejectedValue(firebaseError);

      renderLogin();
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login|masuk/i });

      await user.type(emailInput, 'nonexistent@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/pengguna.*tidak ditemukan/i)).toBeInTheDocument();
      });
    });

    it('should display network error', async () => {
      mockLogin.mockRejectedValue(new Error('Network request failed'));

      renderLogin();
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login|masuk/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network|jaringan/i)).toBeInTheDocument();
      });
    });

    it('should clear error message when user starts typing', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));

      renderLogin();
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login|masuk/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      await user.type(passwordInput, 'a');

      await waitFor(() => {
        expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to forgot password page', async () => {
      renderLogin();
      const user = userEvent.setup();

      const forgotPasswordLink = screen.getByText(/lupa password/i);
      await user.click(forgotPasswordLink);

      expect(mockPush).toHaveBeenCalledWith('/forgot-password');
    });

    it('should navigate to register page', async () => {
      renderLogin();
      const user = userEvent.setup();

      const registerLink = screen.getByText(/daftar|register/i);
      await user.click(registerLink);

      expect(mockPush).toHaveBeenCalledWith('/register');
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      renderLogin();
      const user = userEvent.setup();

      const passwordInput = screen.getByLabelText(/password/i);
      const toggleButton = screen.getByRole('button', { name: /show|hide|tampilkan/i });

      expect(passwordInput).toHaveAttribute('type', 'password');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderLogin();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('aria-label');
      expect(passwordInput).toHaveAttribute('aria-label');
    });

    it('should have proper form structure', () => {
      renderLogin();

      const form = screen.getByRole('form') || document.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });
});
