'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Define public routes that don't require authentication
const publicRoutes = ['/auth', '/results'];

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/assessment',
  '/assessment-demo',
  '/select-assessment',
  '/my-results',
  '/all-questions',
  '/auth-demo',
  '/auth-test',
  '/username-test',
  '/stats-demo',
  '/profile'
];

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);

  // ✅ Instrumentasi: Track render count
  console.count(`[AuthGuard] Render (${pathname})`);
  console.log(`[AuthGuard] ${pathname} - isLoading: ${isLoading}, isAuthenticated: ${isAuthenticated}`);

  // Add timeout for loading state to prevent infinite loading
  React.useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        console.log('AuthGuard: Loading timeout reached, assuming authentication is ready');
        setLoadingTimeout(true);
      }, 2000); // 2 second timeout

      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading]);

  // Calculate route types outside useEffect so they can be used in render
  // ✅ FIX: Handle null pathname
  const isProtectedRoute = pathname ? protectedRoutes.some(route =>
    pathname.startsWith(route)
  ) : false;

  const isPublicRoute = pathname ? publicRoutes.some(route =>
    pathname.startsWith(route)
  ) : false;

  // ✅ FIX: Add proper dependencies and prevent redirect loops with ref tracking
  const lastRedirectRef = React.useRef<string | null>(null);

  useEffect(() => {
    // Don't do anything while loading (unless timeout reached)
    if (isLoading && !loadingTimeout) {
      console.log(`[AuthGuard] ${pathname} - Still loading authentication state`);
      return;
    }

    console.log(`[AuthGuard] ${pathname} - Checking access (auth: ${isAuthenticated}, protected: ${isProtectedRoute}, public: ${isPublicRoute})`);

    // If accessing a protected route without authentication, redirect to auth
    // BUT: Don't redirect if still loading and it's a results page (to avoid race condition)
    if (isProtectedRoute && !isAuthenticated) {
      if (isLoading && pathname?.startsWith('/results/')) {
        console.log(`[AuthGuard] ${pathname} - Skipping redirect while loading (race condition prevention)`);
        return;
      }
      
      // ✅ Prevent redirect loop
      if (lastRedirectRef.current !== '/auth') {
        console.log(`[AuthGuard] ${pathname} → /auth (not authenticated)`);
        lastRedirectRef.current = '/auth';
        router.push('/auth');
      }
      return;
    }

    // If accessing auth page while authenticated, redirect to dashboard
    // BUT: Don't redirect results pages even if authenticated
    if (isPublicRoute && isAuthenticated && !pathname?.startsWith('/results')) {
      // ✅ Prevent redirect loop
      if (lastRedirectRef.current !== '/dashboard') {
        console.log(`[AuthGuard] ${pathname} → /dashboard (authenticated)`);
        lastRedirectRef.current = '/dashboard';
        router.push('/dashboard');
      }
      return;
    }

    // If accessing root path, redirect based on authentication
    if (pathname === '/') {
      const targetPath = isAuthenticated ? '/dashboard' : '/auth';
      // ✅ Prevent redirect loop
      if (lastRedirectRef.current !== targetPath) {
        console.log(`[AuthGuard] / → ${targetPath}`);
        lastRedirectRef.current = targetPath;
        router.push(targetPath);
      }
      return;
    }

    // ✅ Clear redirect tracking when staying on current page
    lastRedirectRef.current = null;
    console.log(`[AuthGuard] ${pathname} - Access granted`);
  }, [isAuthenticated, isLoading, loadingTimeout, pathname, router, isProtectedRoute, isPublicRoute]);

  // Show loading spinner while checking authentication (unless timeout reached)
  // BUT: Don't show loading for public routes like results
  if (isLoading && !loadingTimeout && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6475e9] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // For protected routes, don't render children if not authenticated
  if (isProtectedRoute && !isAuthenticated && !isLoading) {
    return null; // Will redirect in useEffect
  }

  // For public routes, don't render children if authenticated
  // BUT: Allow results pages even if authenticated
  if (isPublicRoute && isAuthenticated && !pathname?.startsWith('/results')) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
