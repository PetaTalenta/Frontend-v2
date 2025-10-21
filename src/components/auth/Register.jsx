import { useState } from 'react';
import { useForm } from 'react-hook-form';
import authV2Service from '../../services/authV2Service';
import tokenService from '../../services/tokenService';
import { getFirebaseErrorMessage } from '../../utils/firebase-errors';
import { StorageTransaction } from '../../utils/storage-transaction';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

/**
 * Register Component - Auth V2 (Firebase) Only
 * 
 * Uses Firebase Authentication for all registration operations.
 * Legacy Auth V1 (JWT) has been disabled.
 * 
 * Enhanced with real-time password validation and strength indicator.
 */
const Register = ({ onRegister }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!data.email || !data.password) {
        setError('Email dan password wajib diisi');
        setIsLoading(false);
        return;
      }

      const email = data.email.toLowerCase().trim();
      const password = data.password.trim(); // ✅ Trim password untuk avoid trailing spaces
      const username = data.username?.trim();

      // Validate password doesn't contain spaces
      if (password.includes(' ')) {
        setError('Password tidak boleh mengandung spasi');
        setIsLoading(false);
        return;
      }

      // ===== Auth V2 (Firebase) Flow =====
      console.log('🔐 Registering with Auth V2 (Firebase)...');
      
      // For V2, username becomes displayName (optional)
      const v2Response = await authV2Service.register({
        email,
        password,
        displayName: username || null,
        photoURL: null,
        schoolName: data.schoolName?.trim() || null
      });

      // Extract V2 response structure
      const { uid, idToken, refreshToken, email: userEmail, displayName, photoURL } = v2Response;

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
      const user = {
        id: uid,
        username: displayName || userEmail.split('@')[0],
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
        console.log('✅ Auth V2 registration successful');
        console.log('✅ All authentication data stored atomically');
      } catch (storageError) {
        console.error('❌ Storage transaction failed:', storageError);
        throw new Error('Failed to save authentication data. Please try again.');
      } finally {
        transaction.clear(); // Release memory
      }

      // Pass to AuthContext
      onRegister(idToken, user);

    } catch (err) {
      console.error('❌ Auth V2 Registration error:', err);
      
      // ✅ Granular error handling untuk password issues
      if (err.message.includes('minimal 8 karakter') || 
          err.message.includes('mengandung minimal satu') ||
          err.message.includes('hanya boleh mengandung')) {
        setError(err.message);
        // Focus ke password field jika error terkait password
        const passwordField = document.getElementById('password');
        if (passwordField) passwordField.focus();
      } else if (err.code === 'auth/weak-password' || err.code === 'WEAK_PASSWORD') {
        setError('Password tidak memenuhi syarat: minimal 8 karakter, harus ada huruf dan angka, hanya boleh alphanumerik dan simbol @$!%*#?&');
        const passwordField = document.getElementById('password');
        if (passwordField) passwordField.focus();
      } else if (err.code === 'auth/email-already-in-use' || err.code === 'EMAIL_EXISTS') {
        setError('Email sudah terdaftar. Silakan login atau gunakan email lain.');
      } else {
        // Use Firebase error mapping untuk error lainnya
        const errorMessage = getFirebaseErrorMessage(err);
        setError(errorMessage);
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Buat Akun Baru</h2>
        <p className="text-gray-600">Bergabung dengan Future Guide</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                {...register('username', {
                  minLength: {
                    value: 3,
                    message: 'Username minimal 3 karakter'
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_ ]+$/,
                    message: 'Username hanya boleh mengandung huruf, angka, spasi, dan underscore'
                  }
                })}
                type="text"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Masukkan nama tampilan Anda (opsional)"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Jika tidak diisi, akan menggunakan email Anda sebagai display name
            </p>
            {errors.username && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Sekolah <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <input
                {...register('schoolName', {
                  minLength: {
                    value: 2,
                    message: 'Nama sekolah minimal 2 karakter'
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9\s\-.,'&()]+$/,
                    message: 'Nama sekolah hanya boleh mengandung huruf, angka, spasi, dan simbol -.,\'&()'
                  }
                })}
                type="text"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Masukkan nama sekolah Anda (opsional)"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Nama sekolah atau institusi tempat Anda belajar/bekerja
            </p>
            {errors.schoolName && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.schoolName.message}
              </p>
            )}
          </div>

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
                id="password"
                {...register('password', {
                  required: 'Password wajib diisi',
                  minLength: {
                    value: 8,
                    message: 'Password minimal 8 karakter'
                  },
                  validate: {
                    hasLetter: (value) => /[a-zA-Z]/.test(value) || 'Password harus mengandung minimal satu huruf',
                    hasNumber: (value) => /\d/.test(value) || 'Password harus mengandung minimal satu angka',
                    validCharacters: (value) => /^[A-Za-z0-9@$!%*#?&]+$/.test(value) || 'Password hanya boleh mengandung huruf, angka, dan simbol @$!%*#?&'
                  }
                })}
                type={showPassword ? "text" : "password"}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Masukkan password Anda (min. 8 karakter)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
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
            
            {/* Password Strength Indicator - Real-time validation */}
            <PasswordStrengthIndicator password={password} />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <input
                {...register('confirmPassword', {
                  required: 'Konfirmasi password wajib diisi',
                  validate: value => value === password || 'Password tidak sama'
                })}
                type={showConfirmPassword ? "text" : "password"}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Konfirmasi password Anda"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showConfirmPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.confirmPassword.message}
              </p>
            )}
            {!errors.confirmPassword && confirmPassword && password === confirmPassword && (
              <p className="mt-1 text-sm text-green-600 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Password cocok!
              </p>
            )}
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              required
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="terms" className="text-gray-700">
              Saya setuju dengan {' '}
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Syarat dan Ketentuan
              </a>{' '}
              dan{' '}
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Kebijakan Privasi
              </a>
            </label>
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
              Creating account...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create account
            </div>
          )}
        </button>
      </form>
    </div>
  );
};

export default Register;
