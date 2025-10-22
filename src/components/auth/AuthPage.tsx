'use client';

import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import { Zap } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  // Empty handlers for UI-only components
  const handleAuth = () => {};

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Graphics/Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern
                  id="grid"
                  width="8"
                  height="8"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 8 0 L 0 0 0 8"
                    fill="none"
                    stroke="white"
                    strokeWidth="0.3"
                  />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0">
          {/* Floating circles */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-blue-400/10 rounded-full blur-lg animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-32 w-40 h-40 bg-indigo-400/5 rounded-full blur-2xl animate-pulse delay-2000"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 bg-white/5 rounded-full blur-xl animate-pulse delay-500"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full w-full p-8 text-white">
          <div className="text-center w-full max-w-none">
            {/* Logo/Icon with Enhanced Design */}
            <div className="mb-12">
              <div className="w-28 h-28 mx-auto bg-gradient-to-br from-white/25 to-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-2xl hover:scale-105 transition-transform duration-300">
                <div className="relative">
                  <Zap className="w-14 h-14 text-white" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
              </div>
            </div>

            {/* Main Heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent leading-tight">
                FutureGuide 
              </h1>
              <p className="text-xl text-blue-100 font-light leading-relaxed max-w-md mx-auto">
                AI-Driven Talent Mapping Assessment
              </p>
            </div>

            {/* Feature Points */}
            <div className="space-y-4 max-w-sm mx-auto">
              <div className="flex items-center space-x-3 text-blue-100">
                <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                <span className="text-sm">Comprehensive Personality Analysis</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-100">
                <div className="w-2 h-2 bg-indigo-400 rounded-full flex-shrink-0"></div>
                <span className="text-sm">AI-Powered Career Recommendations</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-100">
                <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                <span className="text-sm">Personalized Development Insights</span>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-sm mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">3</div>
                <div className="text-xs text-blue-200">Assessments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">200+</div>
                <div className="text-xs text-blue-200">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">AI</div>
                <div className="text-xs text-blue-200">Powered</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#6475e9] to-[#5a6bd8] rounded-2xl flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Future Guide Platform</h1>
            <p className="text-gray-600 text-sm">AI-Driven Talent Mapping</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex mb-8 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-300 ${
                isLogin
                  ? "bg-white text-[#6475e9] shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-300 ${
                !isLogin
                  ? "bg-white text-[#6475e9] shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Content */}
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
