import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import { useAuth } from "../../contexts/AuthContext";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleAuth = (token, user) => {
    login(token, user);
    // Navigate to dashboard after successful authentication
    navigate('/dashboard', { replace: true });
  };

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

        {/* Floating Geometric Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large central orb */}
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-gradient-to-br from-blue-400/15 to-indigo-600/15 rounded-full blur-3xl animate-pulse"></div>

          {/* Secondary orbs for depth */}
          <div
            className="absolute top-1/3 left-1/3 w-48 h-48 bg-gradient-to-br from-purple-400/10 to-blue-600/10 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "4s" }}
          ></div>

          {/* Accent elements */}
          <div
            className="absolute top-1/5 right-1/5 w-32 h-32 bg-gradient-to-br from-white/5 to-blue-300/10 rounded-full blur-xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-1/5 left-1/5 w-40 h-40 bg-gradient-to-br from-indigo-300/8 to-purple-400/8 rounded-full blur-xl animate-pulse"
            style={{ animationDelay: "3s" }}
          ></div>
        </div>

        {/* Subtle Mesh Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full w-full p-8 text-white">
          <div className="text-center w-full max-w-none">
            {/* Logo/Icon with Enhanced Design */}
            <div className="mb-12">
              <div className="w-28 h-28 mx-auto bg-gradient-to-br from-white/25 to-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-2xl hover:scale-105 transition-transform duration-300">
                <div className="relative">
                  <svg
                    className="w-14 h-14 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
                </div>
              </div>
            </div>

            {/* Title with Enhanced Typography */}
            <div className="mb-8">
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent leading-tight">
                Future Guide
              </h1>
              <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto mb-6"></div>
            </div>

            {/* Subtitle with Better Spacing */}
            <p className="text-xl text-blue-200/80 mb-16 font-light leading-relaxed max-w-md mx-auto">
              AI-Driven Talent Mapping Assessment
            </p>

            {/* Enhanced Features List */}
            {/* Enhanced Features List */}
            <div className="flex flex-row justify-center space-x-8 mb-16">
              <div className="flex flex-col items-center space-y-3 group">
                <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-xl backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-all duration-300">
                  <svg
                    className="w-7 h-7 text-cyan-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <span className="text-blue-100/90 text-lg font-medium group-hover:text-white transition-colors duration-300">
                  Smart Assessment
                </span>
              </div>

              <div className="flex flex-col items-center space-y-3 group">
                <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-xl backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-all duration-300">
                  <svg
                    className="w-7 h-7 text-purple-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                </div>
                <span className="text-blue-100/90 text-lg font-medium group-hover:text-white transition-colors duration-300">
                  AI-Powered Insights
                </span>
              </div>

              <div className="flex flex-col items-center space-y-3 group">
                <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-400/20 to-indigo-400/20 rounded-xl backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-all duration-300">
                  <svg
                    className="w-7 h-7 text-cyan-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                </div>
                <span className="text-blue-100/90 text-lg font-medium group-hover:text-white transition-colors duration-300">
                  Real-time Analytics
                </span>
              </div>
            </div>

            {/* Additional Professional Touch */}
            <div className="mt-16">
              <p className="text-blue-200/60 text-sm font-light italic">
                "Find your calling in life with Future Guide."
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-400/8 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-indigo-400/8 to-transparent rounded-full blur-3xl"></div>

        {/* Geometric accent lines */}
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

        {/* Corner accent elements */}
        <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-white/20 rounded-tl-lg"></div>
        <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-white/20 rounded-br-lg"></div>

        {/* Subtle Border Effect */}
        <div className="absolute inset-0 border-r border-white/10"></div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Header (visible only on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Future Guide Platform
            </h1>
            <p className="text-gray-500">AI-Driven Talent Mapping Assessment</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex mb-8 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-300 ${
                isLogin
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-300 ${
                !isLogin
                  ? "bg-white text-blue-600 shadow-sm"
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

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-400">
              © 2025 Future Guide Platform. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
