'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { loginUser, getErrorMessage, isErrorCode, getApiStatus } from '../../services/enhanced-auth-api';

interface LoginProps {
  onLogin: (token: string, user: any) => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [apiStatus, setApiStatus] = useState<{
    isRealApiAvailable: boolean;
    currentApiSource: 'real' | 'mock';
  } | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  // Check API status on component mount
  React.useEffect(() => {
    getApiStatus().then(setApiStatus);
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      // Call ATMA API
      const response = await loginUser({
        email: data.email.toLowerCase().trim(),
        password: data.password
      });

      if (response.success && response.data) {
        const { token, user } = response.data;

        // Create user object with fallback values
        const userObj = {
          id: user?.id || Date.now().toString(),
          email: user?.email || data.email.toLowerCase().trim(),
          name: user?.name || data.email.split('@')[0].charAt(0).toUpperCase() + data.email.split('@')[0].slice(1),
          avatar: user?.avatar || null
        };

        console.log('Login: Successful login, calling onLogin with:', { token, user: userObj });
        onLogin(token, userObj);
      } else {
        // Handle API errors
        const errorMessage = getErrorMessage(response);
        console.error('Login: API error:', errorMessage);

        // Provide user-friendly error messages
        if (isErrorCode(response, 'UNAUTHORIZED')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (isErrorCode(response, 'VALIDATION_ERROR')) {
          setError('Please check your email and password format.');
        } else if (isErrorCode(response, 'RATE_LIMIT_EXCEEDED')) {
          setError('Too many login attempts. Please wait a moment and try again.');
        } else if (isErrorCode(response, 'NETWORK_ERROR')) {
          setError('Network error. Please check your internet connection and try again.');
        } else {
          setError(errorMessage || 'Login failed. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Login: Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
        <p className="text-gray-600">Sign in to your account</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          {/* Email Field */}
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                id="email"
                placeholder="Enter your email"
                className="pl-10 h-12 border-gray-300 focus:border-[#6475e9] focus:ring-[#6475e9]"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter your password"
                className="pl-10 pr-10 h-12 border-gray-300 focus:border-[#6475e9] focus:ring-[#6475e9]"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-[#6475e9] focus:ring-[#6475e9] border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a
              href="#"
              className="font-medium text-[#6475e9] hover:text-[#5a6bd8] transition-colors"
            >
              Forgot your password?
            </a>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-[#6475e9] hover:bg-[#5a6bd8] text-white font-medium rounded-lg transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      {/* API Information */}
      <div className={`mt-6 p-4 rounded-lg border ${
        apiStatus?.isRealApiAvailable
          ? 'bg-green-50 border-green-200'
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <h4 className={`text-sm font-medium mb-2 ${
          apiStatus?.isRealApiAvailable
            ? 'text-green-800'
            : 'text-yellow-800'
        }`}>
          ATMA API Status
        </h4>
        <div className={`text-xs space-y-1 ${
          apiStatus?.isRealApiAvailable
            ? 'text-green-600'
            : 'text-yellow-600'
        }`}>
          {apiStatus ? (
            <>
              <p>
                Status: <strong>
                  {apiStatus.isRealApiAvailable ? 'Connected to Real API' : 'Using Demo Mode'}
                </strong>
              </p>
              <p>
                Endpoint: <strong>
                  {apiStatus.isRealApiAvailable ? 'api.chhrone.web.id' : 'Local Mock API'}
                </strong>
              </p>
              {apiStatus.isRealApiAvailable ? (
                <p>Use your registered ATMA account credentials</p>
              ) : (
                <p>Demo mode - any email/password combination will work</p>
              )}
            </>
          ) : (
            <p>Checking API status...</p>
          )}
        </div>
      </div>
    </div>
  );
}
