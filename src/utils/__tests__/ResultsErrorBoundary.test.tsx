import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorCategory, CategorizedError } from '../../components/results/ResultsErrorBoundary';
import ResultsErrorBoundary from '../../components/results/ResultsErrorBoundary';

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

describe('ResultsErrorBoundary', () => {
  beforeEach(() => {
    // Mock console methods to avoid noise in tests
    console.error = jest.fn();
    console.warn = jest.fn();
    console.log = jest.fn();
    
    // Mock window.gtag
    (window as any).gtag = jest.fn();
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  afterEach(() => {
    // Restore console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
    
    // Clear mocks
    jest.clearAllMocks();
  });

  const ThrowErrorComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div>No error</div>;
  };

  const NetworkErrorComponent = () => {
    throw new Error('Network Error: Failed to fetch');
  };

  const AuthErrorComponent = () => {
    throw new Error('401: Unauthorized access');
  };

  const ServerErrorComponent = () => {
    throw new Error('500: Internal server error');
  };

  const RenderingErrorComponent = () => {
    // Simulate React rendering error
    const obj = null as any;
    return obj.invalidProperty;
  };

  describe('Error Categorization', () => {
    it('should categorize network errors correctly', () => {
      const boundary = new (ResultsErrorBoundary as any)({});
      const error = new Error('Network Error: Failed to fetch');
      const categorizedError = boundary.categorizeError(error);

      expect(categorizedError.category).toBe(ErrorCategory.NETWORK);
      expect(categorizedError.severity).toBe('medium');
      expect(categorizedError.isRecoverable).toBe(true);
      expect(categorizedError.suggestedAction).toContain('koneksi internet');
    });

    it('should categorize authentication errors correctly', () => {
      const boundary = new (ResultsErrorBoundary as any)({});
      const error = new Error('401: Unauthorized access');
      const categorizedError = boundary.categorizeError(error);

      expect(categorizedError.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(categorizedError.severity).toBe('high');
      expect(categorizedError.isRecoverable).toBe(true);
      expect(categorizedError.suggestedAction).toContain('login kembali');
    });

    it('should categorize permission errors correctly', () => {
      const boundary = new (ResultsErrorBoundary as any)({});
      const error = new Error('403: Access denied');
      const categorizedError = boundary.categorizeError(error);

      expect(categorizedError.category).toBe(ErrorCategory.PERMISSION);
      expect(categorizedError.severity).toBe('high');
      expect(categorizedError.isRecoverable).toBe(false);
      expect(categorizedError.suggestedAction).toContain('izin');
    });

    it('should categorize server errors correctly', () => {
      const boundary = new (ResultsErrorBoundary as any)({});
      const error = new Error('500: Internal server error');
      const categorizedError = boundary.categorizeError(error);

      expect(categorizedError.category).toBe(ErrorCategory.SERVER);
      expect(categorizedError.severity).toBe('high');
      expect(categorizedError.isRecoverable).toBe(true);
      expect(categorizedError.suggestedAction).toContain('server');
    });

    it('should categorize rendering errors correctly', () => {
      const boundary = new (ResultsErrorBoundary as any)({});
      const error = new Error('Cannot read property of null');
      error.stack = 'React rendering error in Component';
      const categorizedError = boundary.categorizeError(error);

      expect(categorizedError.category).toBe(ErrorCategory.RENDERING);
      expect(categorizedError.severity).toBe('high');
      expect(categorizedError.isRecoverable).toBe(true);
      expect(categorizedError.suggestedAction).toContain('menampilkan halaman');
    });

    it('should categorize unknown errors correctly', () => {
      const boundary = new (ResultsErrorBoundary as any)({});
      const error = new Error('Unknown error occurred');
      const categorizedError = boundary.categorizeError(error);

      expect(categorizedError.category).toBe(ErrorCategory.UNKNOWN);
      expect(categorizedError.severity).toBe('medium');
      expect(categorizedError.isRecoverable).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should catch and display errors', async () => {
      render(
        <ResultsErrorBoundary>
          <ThrowErrorComponent />
        </ResultsErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText(/Terjadi Kesalahan/i)).toBeInTheDocument();
      });
    });

    it('should display custom fallback when provided', () => {
      const customFallback = <div>Custom error fallback</div>;
      
      render(
        <ResultsErrorBoundary fallback={customFallback}>
          <ThrowErrorComponent />
        </ResultsErrorBoundary>
      );

      expect(screen.getByText('Custom error fallback')).toBeInTheDocument();
    });

    it('should display retry button for recoverable errors', async () => {
      render(
        <ResultsErrorBoundary>
          <NetworkErrorComponent />
        </ResultsErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText('Coba Lagi')).toBeInTheDocument();
      });
    });

    it('should not display retry button for non-recoverable errors', async () => {
      render(
        <ResultsErrorBoundary>
          <AuthErrorComponent />
        </ResultsErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.queryByText('Coba Lagi')).not.toBeInTheDocument();
      });
    });

    it('should display error category badges', async () => {
      render(
        <ResultsErrorBoundary>
          <NetworkErrorComponent />
        </ResultsErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText('NETWORK')).toBeInTheDocument();
        expect(screen.getByText('MEDIUM')).toBeInTheDocument();
        expect(screen.getByText('DAPAT DIPULIHKAN')).toBeInTheDocument();
      });
    });

    it('should call onError prop when provided', async () => {
      const onError = jest.fn();
      
      render(
        <ResultsErrorBoundary onError={onError}>
          <ThrowErrorComponent />
        </ResultsErrorBoundary>
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
        expect(onError).toHaveBeenCalledWith(
          expect.any(Error),
          expect.any(Object),
          expect.objectContaining({
            category: expect.any(String),
            severity: expect.any(String),
            isRecoverable: expect.any(Boolean)
          })
        );
      });
    });

    it('should report error to monitoring service', async () => {
      render(
        <ResultsErrorBoundary enableErrorReporting={true}>
          <ThrowErrorComponent />
        </ResultsErrorBoundary>
      );

      await waitFor(() => {
        expect(window.gtag).toHaveBeenCalledWith('event', 'exception', expect.objectContaining({
          description: expect.any(String),
          fatal: false
        }));
      });
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry when retry button is clicked', async () => {
      render(
        <ResultsErrorBoundary maxRetries={2}>
          <NetworkErrorComponent />
        </ResultsErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText('Coba Lagi')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Coba Lagi');
      fireEvent.click(retryButton);

      // Should show retry count
      await waitFor(() => {
        expect(screen.getByText(/Percobaan ulang: 1 dari 2/i)).toBeInTheDocument();
      });
    });

    it('should disable retry button after max retries', async () => {
      render(
        <ResultsErrorBoundary maxRetries={1}>
          <NetworkErrorComponent />
        </ResultsErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText('Coba Lagi')).toBeInTheDocument();
      });

      // Click retry once
      const retryButton = screen.getByText('Coba Lagi');
      fireEvent.click(retryButton);

      // Should not show retry button after max retries
      await waitFor(() => {
        expect(screen.queryByText('Coba Lagi')).not.toBeInTheDocument();
      });
    });

    it('should reset error state when reset button is clicked', async () => {
      const { rerender } = render(
        <ResultsErrorBoundary>
          <ThrowErrorComponent shouldThrow={false} />
        </ResultsErrorBoundary>
      );

      // Initially should show no error
      expect(screen.queryByText(/Terjadi Kesalahan/i)).not.toBeInTheDocument();

      // Trigger error
      rerender(
        <ResultsErrorBoundary>
          <ThrowErrorComponent shouldThrow={true} />
        </ResultsErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText(/Terjadi Kesalahan/i)).toBeInTheDocument();
      });

      // Click reset
      const resetButton = screen.getByText('Reset Halaman');
      fireEvent.click(resetButton);

      // Should clear error state
      await waitFor(() => {
        expect(screen.queryByText(/Terjadi Kesalahan/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Offline Fallback', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
    });

    it('should display offline fallback when offline', () => {
      render(
        <ResultsErrorBoundary enableOfflineFallback={true}>
          <div>Normal content</div>
        </ResultsErrorBoundary>
      );

      expect(screen.getByText('Tidak Ada Koneksi Internet')).toBeInTheDocument();
      expect(screen.getByText(/Anda sedang offline/i)).toBeInTheDocument();
    });

    it('should not display offline fallback when online', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      render(
        <ResultsErrorBoundary enableOfflineFallback={true}>
          <div>Normal content</div>
        </ResultsErrorBoundary>
      );

      expect(screen.queryByText('Tidak Ada Koneksi Internet')).not.toBeInTheDocument();
      expect(screen.getByText('Normal content')).toBeInTheDocument();
    });

    it('should provide offline recovery options', () => {
      render(
        <ResultsErrorBoundary enableOfflineFallback={true}>
          <div>Normal content</div>
        </ResultsErrorBoundary>
      );

      expect(screen.getByText('Coba Koneksi Lagi')).toBeInTheDocument();
      expect(screen.getByText('Kembali ke Dashboard')).toBeInTheDocument();
    });
  });

  describe('Development Mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should display error details in development mode', async () => {
      const error = new Error('Test error');
      error.stack = 'Test stack trace';

      render(
        <ResultsErrorBoundary>
          <ThrowErrorComponent />
        </ResultsErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
      });

      // Expand details
      const details = screen.getByText('Error Details (Development)');
      fireEvent.click(details);

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
        expect(screen.getByText('Test stack trace')).toBeInTheDocument();
      });
    });

    it('should display categorized error details in development mode', async () => {
      render(
        <ResultsErrorBoundary>
          <NetworkErrorComponent />
        </ResultsErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
      });

      // Expand details
      const details = screen.getByText('Error Details (Development)');
      fireEvent.click(details);

      await waitFor(() => {
        expect(screen.getByText(/Categorized Error/i)).toBeInTheDocument();
        expect(screen.getByText(/System Info/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Reporting', () => {
    it('should not report errors when enableErrorReporting is false', async () => {
      render(
        <ResultsErrorBoundary enableErrorReporting={false}>
          <ThrowErrorComponent />
        </ResultsErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText(/Terjadi Kesalahan/i)).toBeInTheDocument();
      });

      expect(window.gtag).not.toHaveBeenCalled();
    });

    it('should report critical errors as fatal', async () => {
      // Mock a critical error
      const boundary = new (ResultsErrorBoundary as any)({});
      const criticalError = new Error('Critical system failure');
      
      // Manually set severity to critical for testing
      jest.spyOn(boundary, 'categorizeError').mockReturnValue({
        category: ErrorCategory.SERVER,
        severity: 'critical',
        isRecoverable: false,
        suggestedAction: 'Critical error occurred',
        technicalDetails: 'Critical system failure'
      } as CategorizedError);

      render(
        <ResultsErrorBoundary>
          <ThrowErrorComponent />
        </ResultsErrorBoundary>
      );

      await waitFor(() => {
        expect(window.gtag).toHaveBeenCalledWith('event', 'exception', expect.objectContaining({
          fatal: true
        }));
      });
    });
  });

  describe('Progressive Recovery', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should attempt automatic recovery for network errors', async () => {
      render(
        <ResultsErrorBoundary>
          <NetworkErrorComponent />
        </ResultsErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText(/Sedang mencoba memulihkan otomatis/i)).toBeInTheDocument();
      });

      // Fast forward time
      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText(/Percobaan pemulihan: 1 dari 3/i)).toBeInTheDocument();
      });
    });

    it('should limit recovery attempts to maximum', async () => {
      render(
        <ResultsErrorBoundary>
          <NetworkErrorComponent />
        </ResultsErrorBoundary>
      );

      // Fast forward through all recovery attempts
      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(5000);
      }

      await waitFor(() => {
        expect(screen.getByText(/Percobaan pemulihan: 3 dari 3/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(
        <ResultsErrorBoundary>
          <ThrowErrorComponent />
        </ResultsErrorBoundary>
      );

      await waitFor(() => {
        const errorIcon = screen.getByRole('img', { hidden: true });
        expect(errorIcon).toBeInTheDocument();
        
        const retryButton = screen.getByRole('button', { name: /Coba Lagi/i });
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('should be keyboard navigable', async () => {
      render(
        <ResultsErrorBoundary>
          <ThrowErrorComponent />
        </ResultsErrorBoundary>
      );

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /Coba Lagi/i });
        retryButton.focus();
        expect(retryButton).toHaveFocus();
      });
    });
  });
});