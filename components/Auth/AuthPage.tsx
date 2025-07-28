'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Login from './Login';
import Register from './Register';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();
  const { login, register, isAuthenticated, isLoading } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleAuth = async (token: string, user: any) => {
    if (isLogin) {
      await login(token, user);
    } else {
      await register(token, user);
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PetaTalenta</h1>
          <p className="text-gray-600">ATMA Platform</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                isLogin
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                !isLogin
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Sign Up
            </button>
          </div>

          <div>
            {isLogin ? (
              <Login onLogin={handleAuth} />
            ) : (
              <Register onRegister={handleAuth} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
