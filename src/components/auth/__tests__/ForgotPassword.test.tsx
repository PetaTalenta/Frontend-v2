/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import ForgotPassword from '../ForgotPassword';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock authV2Service
const mockForgotPassword = jest.fn();
jest.mock('../../../services/authV2Service', () => ({
  forgotPassword: (...args: any[]) => mockForgotPassword(...args),
}));

// Mock apiService for V1
const mockApiCall = jest.fn();
jest.mock('../../../services/apiService', () => ({
  post: (...args: any[]) => mockApiCall(...args),
}));

describe('ForgotPassword Component', () => {
  const mockPush = jest.fn();
  const mockOnBack = jest.fn();
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

  const renderForgotPassword = (props = {}) => {
    return render(<ForgotPassword onBack={mockOnBack} {...props} />);
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
  });

  describe('Rendering', () => {
    it('should render forgot password form', () => {
      renderForgotPassword();

      expect(screen.getByText(/lupa password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /kirim|send/i })).toBeInTheDocument();
    });

    it('should render back to login link', () => {
      renderForgotPassword();

      expect(screen.getByText(/kembali ke login|back to login/i)).toBeInTheDocument();
    });

    it('should render instructions', () => {
      renderForgotPassword();

      expect(screen.getByText(/masukkan email.*reset password/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for invalid email format', async () => {
      renderForgotPassword();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/email tidak valid/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty email', async () => {
      renderForgotPassword();
      const user = userEvent.setup();

      const submitButton = screen.getByRole('button', { name: /kirim|send/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email.*required|wajib/i)).toBeInTheDocument();
      });
    });

    it('should accept valid email format', async () => {
      renderForgotPassword();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(/email/i);
      await user.type(emailInput, 'valid@example.com');

      expect(screen.queryByText(/email tidak valid/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission - V2 Flow', () => {
    it('should send reset email successfully (V2)', async () => {
      mockForgotPassword.mockResolvedValue({
        success: true,
        message: 'Email reset telah dikirim',
      });

      renderForgotPassword();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(/email/i);
      const submitButton = screen.getByRole('button', { name: /kirim|send/i });

      await user.type(emailInput, 'user@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockForgotPassword).toHaveBeenCalledWith('user@example.com');
      });
    });

    it('should show success message after sending', async () => {
      mockForgotPassword.mockResolvedValue({
        success: true,
        message: 'Email reset telah dikirim',
      });

      renderForgotPassword();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(/email/i);
      const submitButton = screen.getByRole('button', { name: /kirim|send/i });

      await user.type(emailInput, 'user@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email.*berhasil dikirim|email.*sent/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      mockForgotPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderForgotPassword();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(/email/i);
      const submitButton = screen.getByRole('button', { name: /kirim|send/i });

      await user.type(emailInput, 'user@example.com');
      await user.click(submitButton);

      expect(screen.getByText(/mengirim|sending/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error for non-existent email', async () => {
      const firebaseError = new Error('Email tidak ditemukan');
      (firebaseError as any).code = 'auth/user-not-found';
      
      mockForgotPassword.mockRejectedValue(firebaseError);

      renderForgotPassword();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(/email/i);
      const submitButton = screen.getByRole('button', { name: /kirim|send/i });

      await user.type(emailInput, 'nonexistent@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email tidak ditemukan/i)).toBeInTheDocument();
      });
    });

    it('should display error for invalid email format from server', async () => {
      const firebaseError = new Error('Format email tidak valid');
      (firebaseError as any).code = 'auth/invalid-email';
      
      mockForgotPassword.mockRejectedValue(firebaseError);

      renderForgotPassword();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(/email/i);
      const submitButton = screen.getByRole('button', { name: /kirim|send/i });

      await user.type(emailInput, 'invalid@email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/format email tidak valid/i)).toBeInTheDocument();
      });
    });

    it('should display network error', async () => {
      mockForgotPassword.mockRejectedValue(new Error('Network error'));

      renderForgotPassword();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(/email/i);
      const submitButton = screen.getByRole('button', { name: /kirim|send/i });

      await user.type(emailInput, 'user@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network|jaringan/i)).toBeInTheDocument();
      });
    });

    it('should clear error when user starts typing', async () => {
      mockForgotPassword.mockRejectedValue(new Error('Email tidak ditemukan'));

      renderForgotPassword();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(/email/i);
      const submitButton = screen.getByRole('button', { name: /kirim|send/i });

      await user.type(emailInput, 'nonexistent@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email tidak ditemukan/i)).toBeInTheDocument();
      });

      await user.type(emailInput, 'a');

      await waitFor(() => {
        expect(screen.queryByText(/email tidak ditemukan/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back to login page', async () => {
      renderForgotPassword();
      const user = userEvent.setup();

      const backLink = screen.getByText(/kembali ke login|back to login/i);
      await user.click(backLink);

      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('Success State', () => {
    it('should show success message with email confirmation', async () => {
      mockForgotPassword.mockResolvedValue({
        success: true,
        message: 'Email reset telah dikirim',
      });

      renderForgotPassword();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(/email/i);
      const submitButton = screen.getByRole('button', { name: /kirim|send/i });

      await user.type(emailInput, 'user@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/user@example\.com/i)).toBeInTheDocument();
      });
    });

    it('should hide form after successful submission', async () => {
      mockForgotPassword.mockResolvedValue({
        success: true,
        message: 'Email reset telah dikirim',
      });

      renderForgotPassword();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(/email/i);
      const submitButton = screen.getByRole('button', { name: /kirim|send/i });

      await user.type(emailInput, 'user@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/email/i)).not.toBeInTheDocument();
      });
    });

    it('should allow resending email', async () => {
      mockForgotPassword.mockResolvedValue({
        success: true,
        message: 'Email reset telah dikirim',
      });

      renderForgotPassword();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(/email/i);
      const submitButton = screen.getByRole('button', { name: /kirim|send/i });

      await user.type(emailInput, 'user@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/kirim ulang|resend/i)).toBeInTheDocument();
      });

      const resendButton = screen.getByText(/kirim ulang|resend/i);
      await user.click(resendButton);

      expect(mockForgotPassword).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      renderForgotPassword();

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('should have descriptive instructions', () => {
      renderForgotPassword();

      expect(screen.getByText(/masukkan email/i)).toBeInTheDocument();
    });

    it('should have clear submit button text', () => {
      renderForgotPassword();

      const submitButton = screen.getByRole('button', { name: /kirim|send/i });
      expect(submitButton).toBeInTheDocument();
    });
  });
});
