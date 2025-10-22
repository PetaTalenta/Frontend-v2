import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import authV2Service from '../../services/authV2Service';
import tokenService from '../../services/tokenService';
import { getFirebaseErrorMessage } from '../../utils/firebase-errors';
import { StorageTransaction } from '../../utils/storage-manager'; // ✅ Consolidated storage utilities

/**
 * Login Component - Auth V2 (Firebase) Only
 * 
 * Uses Firebase Authentication for all login operations.
 * Legacy Auth V1 (JWT) has been disabled.
 */
interface LoginProps {
  onLogin: (token: string, user: any) => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

const Login = ({ onLogin }: LoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!data.email || !data.password) {
        setError('Email dan password wajib diisi');
        setIsLoading(false);
        return;
      }

      // Convert email to lowercase before sending to API
      const email = data.email.toLowerCase().trim();
      const password = data.password;

      // ✅ CRITICAL FIX: Clear ALL previous auth data BEFORE login
      // This prevents wrong account login issues
      console.log('🧹 Clearing previous authentication data...');
      tokenService.clearTokens(); // This now clears ALL token keys and user data

      // ===== Auth V2 (Firebase) Flow =====
      console.log('🔐 Logging in with Auth V2 (Firebase)...');

      const v2Response = await authV2Service.login(email, password) as {
        idToken: string;
        refreshToken: string;
        uid: string;
        email: string;
        displayName?: string;
        photoURL?: string;
      };

      // Extract V2 response structure
      const { idToken, refreshToken, uid, email: userEmail, displayName, photoURL } = v2Response;

      // ✅ ATOMIC FIX: Store all auth data using atomic transaction
      // This prevents partial state updates if any operation fails
      console.log('💾 Storing authentication data atomically...');

      const transaction = new StorageTransaction();

      // Add all token operations to transaction
      transaction.add('token', idToken);
      transaction.add('auth_token', idToken);
      transaction.add('futureguide_token', idToken);
      transaction.add('accessToken', idToken);
      transaction.add('refreshToken', refreshToken);
      transaction.add('auth_version', 'v2');

      // Add user info operations
      transaction.add('uid', uid);
      transaction.add('email', userEmail);
      if (displayName) transaction.add('displayName', displayName);
      if (photoURL) transaction.add('photoURL', photoURL);

      // Map V2 user structure to consistent format
      const user: User = {
        id: uid,
        username: displayName || userEmail.split('@')[0], // Fallback to email prefix
        email: userEmail,
        displayName: displayName || null,
        photoURL: photoURL || null
      };

      // Add user object to transaction
      transaction.add('user', JSON.stringify(user));

      // ✅ Commit all operations atomically
      // If any operation fails, ALL changes are rolled back
      try {
        await transaction.commit();
        console.log('✅ Auth V2 login successful for user:', userEmail);
        console.log('✅ All authentication data stored atomically');
      } catch (storageError: any) {
        console.error('❌ Storage transaction failed:', storageError);
        throw new Error('Failed to save authentication data. Please try again.');
      } finally {
        transaction.clear(); // Release memory
      }

      // Pass to AuthContext (uses V2 token format)
      onLogin(idToken, user);

    } catch (err: any) {
      console.error('❌ Auth V2 Login error:', err);

      // Use Firebase error mapping for user-friendly messages
      const errorMessage = getFirebaseErrorMessage(err);
      setError(errorMessage);

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang Kembali</h2>
        <p className="text-gray-600">Masuk kedalam akun anda</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
              <input
                {...register('email', {
                  required: 'Email wajib diisi',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Format email tidak valid'
                  }
                })}
                type="email"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Masukkan email Anda"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                {...register('password', { required: 'Password wajib diisi' })}
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Masukkan password Anda"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Ingat saya
            </label>
          </div>

          <div className="text-sm">
            <Link 
              href="/forgot-password" 
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Lupa password?
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-slate-600 to-blue-600 text-white font-medium rounded-lg hover:from-slate-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] shadow-md"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Signing in...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign in
            </div>
          )}
        </button>
      </form>
    </div>
  );
};

export default Login;