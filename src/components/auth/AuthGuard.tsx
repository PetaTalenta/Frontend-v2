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
  // UI-only: just render children without any authentication logic
  return <>{children}</>;
}
