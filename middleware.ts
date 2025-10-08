import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';



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
  '/stats-demo'
];

// Define routes that don't require authentication (public + results + archive result)
const publicRoutes = ['/auth', '/results', '/api/archive/result'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ FIX: Reduce logging noise - only log in development or for errors
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log(`[Middleware] ${pathname}`);
  }

  // Handle /results route conflict - redirect to /my-results
  if (pathname === '/results') {
    if (isDev) console.log(`[Middleware] Redirecting /results → /my-results`);
    const myResultsUrl = new URL('/my-results', request.url);
    return NextResponse.redirect(myResultsUrl);
  }
  
  // Allow unauthenticated access to /api/archive/result/{id}
  if (/^\/api\/archive\/result\/[\w-]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // Allow unauthenticated access to /results/{id}
  if (/^\/results\/[\w-]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Get token from cookies or headers (we'll check localStorage on client side)
  // For server-side middleware, we can't access localStorage directly
  // So we'll rely on a cookie or header if available
  const token = request.cookies.get('token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  // ✅ FIX: Reduce logging - only in dev mode
  if (isDev) {
    console.log(`[Middleware] ${pathname} - token: ${!!token}, protected: ${isProtectedRoute}, public: ${isPublicRoute}`);
  }

  // If accessing a protected route without a token, redirect to auth
  if (isProtectedRoute && !token) {
    if (isDev) console.log(`[Middleware] ${pathname} → /auth (no token)`);
    const authUrl = new URL('/auth', request.url);
    return NextResponse.redirect(authUrl);
  }

  // If accessing auth page with a token, redirect to dashboard
  // BUT: Don't redirect results pages even if authenticated
  if (isPublicRoute && token && !pathname.startsWith('/results')) {
    if (isDev) console.log(`[Middleware] ${pathname} → /dashboard (has token)`);
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // If accessing root path, redirect based on authentication
  if (pathname === '/') {
    if (token) {
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    } else {
      const authUrl = new URL('/auth', request.url);
      return NextResponse.redirect(authUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next (all Next.js internal files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * - static assets (css, js, fonts, etc.)
     */
    '/((?!api|_next|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf|eot)$).*)',
  ],
};
