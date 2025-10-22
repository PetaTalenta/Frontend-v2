'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

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
  '/all-questions',
  '/auth-demo',
  '/auth-test',
  '/username-test',
  '/stats-demo',
  '/profile'
];

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Dummy auth state - in real app this would come from context
  const [isAuthenticated] = React.useState(false);
  const [isLoading] = React.useState(false);

  // Calculate route types
  const isProtectedRoute = pathname ? protectedRoutes.some(route =>
    pathname.startsWith(route)
  ) : false;

  const isPublicRoute = pathname ? publicRoutes.some(route =>
    pathname.startsWith(route)
  ) : false;

  // Simple redirect logic for demo purposes
  React.useEffect(() => {
    // If accessing a protected route without authentication, redirect to auth
    if (isProtectedRoute && !isAuthenticated && !isLoading) {
      router.push('/auth');
      return;
    }

    // If accessing auth page while authenticated, redirect to dashboard
    if (isPublicRoute && isAuthenticated && pathname === '/auth') {
      router.push('/dashboard');
      return;
    }

    // If accessing root path, redirect based on authentication
    if (pathname === '/') {
      const targetPath = isAuthenticated ? '/dashboard' : '/auth';
      router.push(targetPath);
      return;
    }
  }, [isAuthenticated, isLoading, pathname, router, isProtectedRoute, isPublicRoute]);

  // Show loading while checking authentication
  if (isLoading) {
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
  if (isProtectedRoute && !isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  // For public routes, don't render children if authenticated (except auth page itself)
  if (isPublicRoute && isAuthenticated && pathname === '/auth') {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
