/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import Register from '../Register';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../config/auth-v2-config', () => ({
  shouldUseAuthV2: jest.fn(),
}));

describe('Register Component', () => {
  const mockPush = jest.fn();
  const mockOnRegister = jest.fn();
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

  const renderRegister = (props = {}) => {
    return render(<Register onRegister={mockOnRegister} {...props} />);
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
    it('should render registration form with all fields', () => {
      renderRegister();

      expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /register|daftar/i })).toBeInTheDocument();
    });

    it('should render login link', () => {
      renderRegister();

      expect(screen.getByText(/sudah punya akun|login/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for invalid email format', async () => {
      renderRegister();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/email tidak valid/i)).toBeInTheDocument();
      });
    });

    it('should show error for password less than 6 characters', async () => {
      renderRegister();
      const user = userEvent.setup();

      const passwordInput = screen.getByPlaceholderText(/password/i);
      await user.type(passwordInput, '12345');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password.*minimal.*6/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty required fields', async () => {
      renderRegister();
      const user = userEvent.setup();

      const submitButton = screen.getByRole('button', { name: /register|daftar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email.*required|wajib/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit registration with all fields', async () => {
      mockOnRegister.mockResolvedValue({ success: true });
      
      renderRegister();
      const user = userEvent.setup();

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /register|daftar/i });

      await user.type(usernameInput, 'testuser');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnRegister).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
            password: 'password123',
          })
        );
      });
    });

    it('should redirect to dashboard on successful registration', async () => {
      mockOnRegister.mockResolvedValue({ success: true });
      
      renderRegister();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /register|daftar/i });

      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show loading state during submission', async () => {
      mockOnRegister.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderRegister();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /register|daftar/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(screen.getByText(/loading|memproses/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error for duplicate email', async () => {
      mockOnRegister.mockRejectedValue(
        new Error('Email sudah terdaftar')
      );

      renderRegister();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /register|daftar/i });

      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email sudah terdaftar/i)).toBeInTheDocument();
      });
    });

    it('should display Firebase error for weak password', async () => {
      const firebaseError = new Error('Password terlalu lemah');
      (firebaseError as any).code = 'auth/weak-password';
      
      mockOnRegister.mockRejectedValue(firebaseError);

      renderRegister();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /register|daftar/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password terlalu lemah/i)).toBeInTheDocument();
      });
    });

    it('should clear error when user starts typing', async () => {
      mockOnRegister.mockRejectedValue(new Error('Registration failed'));

      renderRegister();
      const user = userEvent.setup();

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /register|daftar/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
      });

      await user.type(emailInput, 'a');

      await waitFor(() => {
        expect(screen.queryByText(/registration failed/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to login page', async () => {
      renderRegister();
      const user = userEvent.setup();

      const loginLink = screen.getByText(/sudah punya akun|login/i);
      await user.click(loginLink);

      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('Username to DisplayName Mapping (V2)', () => {
    it('should use username as displayName for Firebase registration', async () => {
      mockOnRegister.mockResolvedValue({ success: true });
      
      renderRegister();
      const user = userEvent.setup();

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /register|daftar/i });

      await user.type(usernameInput, 'JohnDoe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnRegister).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'john@example.com',
            password: 'password123',
            displayName: 'JohnDoe',
          })
        );
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      renderRegister();
      const user = userEvent.setup();

      const passwordInput = screen.getByPlaceholderText(/password/i);
      const toggleButton = screen.getByRole('button', { name: /show|hide|tampilkan/i });

      expect(passwordInput).toHaveAttribute('type', 'password');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      renderRegister();

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('should have all required input fields', () => {
      renderRegister();

      expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    });
  });
});
