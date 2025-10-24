import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

/**
 * Login Component - Real Implementation
 *
 * Login form with actual authentication logic using API
 */
interface LoginProps {
  onLogin?: (data: any) => void;
}

interface LoginFormData {
  email: string;
  password: string;
}

const Login = ({ onLogin }: LoginProps) => {
  const router = useRouter();
  const { login, isLoggingIn, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setLoginError('');
    // clearError() - not available in useAuth
    
    try {
      await login(data);
      
      // Call optional onLogin callback
      if (onLogin) {
        onLogin(data);
      }
      
      // Redirect to dashboard after successful login
      router.push('/dashboard');
    } catch (err: any) {
      // Handle specific error cases
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (err.status === 401) {
        if (err.code === 'INVALID_CREDENTIALS') {
          errorMessage = 'Email atau password salah. Silakan periksa kembali.';
        } else if (err.code === 'USER_NOT_FOUND') {
          errorMessage = 'Email tidak terdaftar. Silakan daftar terlebih dahulu.';
        } else if (err.code === 'INVALID_PASSWORD') {
          errorMessage = 'Password salah. Silakan coba lagi.';
        } else {
          errorMessage = 'Email atau password tidak valid. Silakan periksa kembali.';
        }
      } else if (err.status === 429) {
        errorMessage = 'Terlalu banyak percobaan login. Silakan coba lagi dalam beberapa menit.';
      } else if (err.status === 500) {
        errorMessage = 'Terjadi kesalahan server. Silakan coba lagi nanti.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setLoginError(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang Kembali</h2>
        <p className="text-gray-600">Masuk kedalam akun anda</p>
      </div>

      {/* Error Display */}
      {(loginError || error) && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                {loginError || error}
              </p>
              {/* Additional help for common errors */}
              {(loginError?.includes('salah') || loginError?.includes('tidak valid')) && (
                <div className="mt-2 text-xs text-red-700">
                  <p>• Periksa kembali email dan password Anda</p>
                  <p>• Pastikan caps lock tidak aktif</p>
                  <p>• <button type="button" className="text-red-600 underline hover:text-red-800" onClick={() => window.location.href = '/forgot-password'}>Lupa password?</button></p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full py-3 px-4 bg-gradient-to-r from-slate-600 to-blue-600 text-white font-medium rounded-lg hover:from-slate-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] shadow-md disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
        >
          <div className="flex items-center justify-center">
            {isLoggingIn ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Masuk
              </>
            )}
          </div>
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Belum punya akun?{' '}
            <button
              type="button"
              onClick={() => {
                // This will be handled by the parent component
                const event = new CustomEvent('switchToRegister');
                window.dispatchEvent(event);
              }}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Daftar sekarang
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;