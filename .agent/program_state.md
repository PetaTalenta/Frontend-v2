Strategi yang Diterapkan pada Aplikasi FutureGuide

## 1. Strategi Rendering

**Implementasi:**
- Hybrid Rendering: SSR untuk public pages (auth, landing), CSR untuk dynamic content
- Progressive Loading: Skeleton dan fallback terintegrasi
- Streaming Components: React Suspense untuk better perceived performance
- Optimization Tools: Bundle analyzer dan import trimming
- Image Optimization: Next.js Image component dengan lazy loading dan proper dimensions
- Font Loading Optimization: Plus Jakarta Sans dengan font-display: swap dan fallback

**Lokasi Implementasi:**
- `src/app/layout.tsx` - Konfigurasi rendering utama dengan font optimization
- `src/components/assessment/AssessmentLoadingPage.tsx` - Progressive loading
- `src/components/assessment/AssessmentStream.tsx` - Streaming untuk assessment
- `next.config.mjs` - Konfigurasi optimization dengan webpack customizations
- `src/components/ui/OptimizedImage.tsx` - Lazy loading image component
- `src/components/ui/OptimizedChart.tsx` - Lazy loading chart component
- `src/app/select-assessment/page.tsx` - Next.js Image component integration
- `src/components/assessment/AssessmentHeader.tsx` - Image optimization dengan proper dimensions
- `src/components/dashboard/avatar.tsx` - Avatar component dengan Next.js Image
- `src/components/dashboard/stats-card.tsx` - Stats card dengan optimized image loading
- `src/components/dashboard/header.tsx` - Dropdown profile component fix (24 Oktober 2024)
- `docs/dashboard-dropdown-profile-fix-report.md` - Laporan perbaikan dropdown lengkap
- `src/app/results/[id]/ocean/page.tsx` - OceanRadarChart dynamic import (Phase 3.1)
- `src/app/results/[id]/riasec/page.tsx` - RiasecRadarChart dynamic import (Phase 3.1)
- `src/app/results/[id]/via/page.tsx` - ViaRadarChart dynamic import (Phase 3.1)
- `src/app/results/[id]/combined/page.tsx` - CombinedAssessmentGrid dynamic import (Phase 3.1)
- `docs/phase-3-1-bundle-optimization-implementation-report.md` - Laporan implementasi bundle optimization lengkap

**Best Practices Yang Dijadikan Acuan:**
- Skeleton screens untuk better perceived performance
- Optimized bundle size dengan import trimming
- Server-side rendering untuk critical pages
- Streaming untuk better user experience
- Next.js Image component dengan lazy loading
- Proper width dan height props untuk prevent layout shift
- WebP conversion otomatis untuk browser yang support
- Priority loading untuk above-the-fold images
- TypeScript untuk type safety
- React Hooks optimization dengan proper dependency arrays
- Proper state management untuk interactive components (dropdown profile fix)
- Click outside detection untuk auto-close functionality
- Responsive design untuk mobile dan desktop
- Clean component architecture dengan proper props management
- Dynamic imports untuk heavy components dengan loading states
- Granular bundle splitting dengan priority-based cache groups
- Tree shaking agresif untuk unused dependencies
- Deterministic chunk IDs untuk better caching
- Package import optimization untuk reduced bundle size
- Performance monitoring dengan automated bundle analysis

**Performance Improvements:**
- Bundle size reduction melalui code splitting
- Better perceived performance dengan streaming
- Reduced Cumulative Layout Shift (CLS) dengan proper image dimensions
- Better Largest Contentful Paint (LCP) dengan optimized image loading
- Optimized font loading dengan swap strategy
- Lazy loading untuk heavy components
- **Dropdown Profile Fix (24 Oktober 2024)**: Memperbaiki dropdown profile yang selalu terbuka pada halaman dashboard
- **Interactive Component Behavior**: Dropdown sekarang hanya terbuka saat diklik dan tertutup otomatis
- **Enhanced User Experience**: Menghilangkan prop `forceMount` yang menyebabkan dropdown selalu visible
- **Bundle Size Optimization (Phase 3.1 - 24 Oktober 2024)**: Implementasi dynamic imports untuk heavy chart components
- **Advanced Bundle Splitting**: Granular cache groups untuk vendor libraries (recharts, framer-motion, tanstack-query, radix-ui, lucide-react, vendor)
- **Tree Shaking**: Unused dependencies elimination dengan optimizePackageImports
- **Performance Monitoring**: Bundle analysis dan measurement dengan automated reporting

## 2. Strategi Routing

### 2.1 Core Routing Implementation
- **Next.js App Router (v15.5.6)**: File-based routing modern dengan optimal performance
- **Rendering Strategies**: SSR, ISR, CSR per route type untuk optimal user experience
- **Route Protection**: AuthLayoutWrapper implementation untuk global authentication management
- **Dynamic Imports**: Optimized bundle loading dengan dynamic imports dan loading states

### 2.2 Route Structure & Rendering Strategies

#### Public Routes (SSR - Server-Side Rendering)
- `/` → redirect ke `/auth` (Root redirect)
- `/auth` - Authentication page (`export const dynamic = 'force-dynamic'`)
- `/forgot-password` - Forgot password page
- `/reset-password` - Reset password page

#### Protected Routes (Mixed Rendering)
- `/dashboard` - User dashboard (ISR: `export const revalidate = 1800`)
- `/profile` - User profile page
- `/assessment` - Assessment flow (CSR: `'use client'`)
- `/assessment-loading` - Assessment loading state
- `/select-assessment` - Assessment selection page

#### Dynamic Routes (CSR - Client-Side Rendering)
- `/results/[id]` - Assessment results summary
- `/results/[id]/chat` - AI chat interface
- `/results/[id]/combined` - Combined assessment view
- `/results/[id]/ocean` - Big Five personality details
- `/results/[id]/persona` - Persona profile details
- `/results/[id]/riasec` - Career interest details
- `/results/[id]/via` - Character strengths details

#### API Routes
- `/api/performance` - Performance metrics collection and aggregation

### 2.3 Nested Route Structure untuk Assessment Results
```
src/app/results/[id]/
├── layout.tsx          - Layout untuk semua result pages
├── page.tsx           - Summary results (CSR dengan data fetching)
├── not-found.tsx      - Custom 404 untuk invalid result IDs
├── chat/
│   └── page.tsx       - AI chat interface
├── combined/
│   └── page.tsx       - Combined assessment view
├── ocean/
│   └── page.tsx       - Big Five personality details
├── persona/
│   └── page.tsx       - Persona profile details
├── riasec/
│   └── page.tsx       - Career interest details
└── via/
    └── page.tsx       - Character strengths details
```

### 2.4 Route Protection & Authentication Strategy
- **Global Protection**: `AuthLayoutWrapper` di root layout untuk semua routes
- **Token Management**: Automatic token expiry warning dan refresh mechanism
- **Offline Support**: Offline status indicator untuk degraded user experience
- **Session Management**: Seamless logout dan refresh functionality
- **Error Handling**: Consistent error states dengan retry mechanisms

### 2.5 Rendering Strategy per Route Type
- **SSR Routes**: Public pages yang membutuhkan SEO dan initial load yang cepat
- **ISR Routes**: Dashboard dengan data semi-static yang perlu periodic updates
- **CSR Routes**: Interactive pages yang membutuhkan real-time user interaction
- **Dynamic Imports**: Semua routes menggunakan dynamic imports untuk optimal bundle loading
- **Loading States**: Consistent loading skeletons untuk better perceived performance

### 2.6 Error Handling & Edge Cases
- **Global 404**: `src/app/not-found.tsx` untuk undefined routes
- **Dynamic Route 404**: `src/app/results/[id]/not-found.tsx` untuk invalid result IDs
- **Error Boundaries**: Consistent error states dengan retry functionality
- **Loading States**: Unified loading skeletons untuk semua dynamic imports

**Lokasi Implementasi:**
- `src/app/` - Struktur routing berbasis file lengkap
- `src/app/results/[id]/` - Dynamic routes dengan nested structure
- `src/app/page.tsx` - Root redirect ke `/auth`
- `src/app/layout.tsx` - Root layout dengan AuthLayoutWrapper
- `src/components/auth/AuthLayoutWrapper.tsx` - Global authentication management
- `src/app/api/performance/route.ts` - API route untuk performance metrics

**Best Practices Yang Dijadikan Acuan:**
- File-based routing untuk maintainability dan scalability
- Dynamic routes dengan parameter validation untuk scalable content
- Proper redirects untuk optimal user flow
- Clean architecture dengan separation of concerns
- Consistent naming conventions dan file organization
- Rendering strategy optimization per route type
- Dynamic imports untuk bundle optimization
- Comprehensive error handling dan loading states
- Route protection dengan graceful degradation
- Performance monitoring dengan API integration

## 3. Strategi State Management & Data Fetching

**Implementasi:**
- **Primary State Management**: TanStack Query v5.90.5 untuk server state management
- **Local State**: React state untuk UI state
- **Assessment Progress Management**: TanStack Query dengan LocalStorage persistence untuk assessment progress
- Progressive Data Loading: Partial data → Background fetch → Complete data
- Storage Strategy: LocalStorage + TanStack Query Cache
- Optimized Configuration: Stale-time dan gc-time untuk optimal performance
- **Advanced Token Management**: Enhanced token management dengan partial vs complete data separation
- **Data Upgrade Mechanism**: Automatic data upgrade dari partial ke complete data
- **Stale Data Detection**: Intelligent detection untuk stale data dengan TTL management
- **Comprehensive Query Key Management**: Structured query keys untuk organized cache management
- **Enhanced Error Handling**: Rate limiting integration, security logging, dan custom error classes

**Lokasi Implementasi:**
- `src/hooks/useAuth.ts` - Authentication state management dengan TanStack Query
- `src/hooks/useAssessment.ts` - Assessment data fetching dan progress management dengan TanStack Query
- `src/hooks/useProfile.ts` - Profile data management dengan TanStack Query
- `src/providers/AppProvider.tsx` - Unified provider untuk semua state
- `src/providers/QueryProvider.tsx` - TanStack Query provider wrapper (sebelumnya TanStackProvider.tsx)
- `src/lib/tanStackConfig.ts` - TanStack Query configuration dengan optimal settings dan assessment progress keys

**Best Practices Yang Dijadikan Acuan:**
- TanStack Query untuk server state management yang robust
- Progressive loading untuk better user experience
- Automatic cache management dengan stale-while-revalidate
- Request deduplication untuk reduce network requests
- Error handling dengan automatic retry dan exponential backoff
- Optimistic updates untuk immediate UI feedback
- Background fetching untuk complete data loading
- TanStack Query untuk modern data fetching dengan built-in caching
- Automatic request deduplication untuk reduce network overhead
- Centralized API configuration dengan proper error handling
- Service layer consolidation untuk maintainability dan reduced duplication
- Advanced token management dengan data separation strategies
- Structured query key management untuk efficient cache organization
- Enhanced security dengan rate limiting dan logging integration

**Benefits:**
- 77% faster build performance
- Better data synchronization dengan server state
- Automatic cache invalidation dan refetching
- Improved error handling dan retry mechanisms
- Progressive loading untuk enhanced UX
- Request deduplication untuk reduce network requests
- Automatic cache management dengan stale-while-revalidate
- Enhanced error handling dengan exponential backoff retry
- Service layer optimization dengan reduced code duplication
- Advanced caching strategies dengan intelligent invalidation


## 4. Strategi Authentication & Authorization

**Implementasi:**
- **JWT Token Management**: Session management dengan automatic refresh
- **Token Expiry Warning**: System untuk user notification dengan robust validation
- **Enhanced Token Validation**: JWT format validation sebelum decoding untuk prevent InvalidCharacterError
- **Console Spam Prevention**: Rate-limited warning messages untuk prevent console spam (5-second cooldown)
- **Profile Caching**: Intelligent caching dengan TTL management
- **Auth Headers**: Secure API requests dengan JWT tokens
- **Form Validation**: Login, Register, Logout dengan comprehensive validation
- **Password Strength**: Indicator untuk security enhancement
- **Enhanced Logout Validation**: Unsaved changes detection dan confirmation dialog
- **Advanced Error Recovery**: Exponential backoff untuk failed requests dengan jitter
- **Enhanced Security Monitoring**: Security event tracking dengan pattern detection

**Lokasi Implementasi:**
- `src/hooks/useAuth.ts` - Authentication state management dengan TanStack Query
- `src/services/authService.ts` - API layer dengan token management, enhanced security monitoring, dan error recovery
- `src/components/auth/` - UI components (Login, Register, TokenExpiryWarning, OfflineStatusIndicator)
- `src/lib/cache.ts` - Profile caching system dengan TTL
- `src/lib/offline.ts` - Offline support utilities
- `src/components/auth/AuthLayoutWrapper.tsx` - Auth layout dengan TanStack integration
- `src/components/auth/Login.tsx` - Login form dengan validation
- `src/components/auth/Register.tsx` - Register form dengan validation
- `src/components/auth/TokenExpiryWarning.tsx` - Token expiry notification dengan enhanced validation dan rate-limited warnings
- `src/components/profile/ProfilePage.tsx` - Profile management

**Best Practices Yang Dijadikan Acuan:**
- JWT standard untuk secure token-based authentication
- Progressive loading untuk better user experience
- Automatic token refresh untuk seamless UX
- TanStack Query untuk robust auth state management
- Token expiry warning untuk better UX
- Enhanced token validation dengan format checking sebelum decoding
- Robust error handling untuk non-JWT dan corrupted tokens
- Rate-limited warning messages untuk prevent console spam (5-second cooldown)
- Comprehensive logging untuk debugging token issues
- Offline support untuk data persistence
- Password strength validation untuk security
- Input validation pada forms
- Token validation dengan JWT decode
- Enhanced logout validation dengan unsaved changes detection
- Advanced error recovery dengan exponential backoff dan jitter
- Security event monitoring dengan pattern detection
- Request deduplication untuk prevent duplicate operations
- Graceful degradation untuk network failures

**Benefits:**
- Enhanced authentication flow dengan progressive loading
- Better error handling dan retry mechanisms
- Improved performance dengan TanStack Query caching
- API compatibility dengan backend preserved
- Security measures enhanced dengan proper validation
- Advanced security monitoring dengan real-time threat detection
- Improved user experience dengan unsaved changes protection
- Enhanced reliability dengan exponential backoff error recovery
- Comprehensive audit trail untuk security compliance

## 5. Strategi Security

**Implementasi:**
- Security headers di next.config.mjs
- Environment variable protection
- JWT token management dengan refresh mechanism
- Request/Response interceptors untuk security
- Input validation pada forms
- Token validation dengan JWT decode
- Removed CSRF protection karena backend tidak support
- Enhanced Security: rate limiting, secure cookies, dan enhanced security headers
- Input Sanitization: Dan validation untuk prevent injection
- Security Event Logging: Untuk monitoring

**Lokasi Implementasi:**
- `next.config.mjs` - Security headers
- `src/services/authService.ts` - Request/Response interceptors tanpa CSRF
- `src/components/auth/` - Input validation
- `.env.local` - Environment variables
- `src/lib/security.ts` - Security utilities (rate limiting, secure cookies)

**Best Practices Yang Dijadikan Acuan:**
- Defense in depth dengan multiple security layers
- Environment variables untuk sensitive data
- Input validation untuk prevent injection
- JWT token validation untuk secure authentication
- Request interceptors untuk consistent security headers
- Rate limiting per endpoint dengan configurable limits
- Secure cookie management dengan httpOnly, secure, dan sameSite flags
- Enhanced security headers (CSP, HSTS, XSS Protection, etc.)

**Security Enhancements:**
- Rate limiting per endpoint dengan configurable limits
- Secure cookie management dengan httpOnly, secure, dan sameSite flags
- Enhanced security headers (CSP, HSTS, XSS Protection, etc.)
- Input sanitization dan validation
- Security event logging untuk monitoring

## 6. Strategi Caching

**Implementasi:**
- Multi-Level Caching: Browser, Next.js, CDN
- Static Assets: Long-term cache (1 tahun)
- Image & Font Optimization: Next.js Image, preconnect, font strategy
- CDN Ready: Asset prefix sudah dikonfigurasi
- Profile Caching: Cache data profile dengan TTL 10 menit
- Offline Storage: Data tersimpan untuk offline access
- Enhanced Caching: Service Worker v2.0 dengan stale-while-revalidate dan cache TTL management
- Cache Metadata Management: Untuk smart invalidation
- Background Sync: Untuk offline actions

**Lokasi Implementasi:**
- `src/lib/cache.ts` - Cache manager dengan TTL dan cleanup otomatis
- `next.config.mjs` - Static asset caching
- `src/app/layout.tsx` - Font optimization
- `src/lib/offline.ts` - Offline storage integration
- `public/sw.js` - Enhanced Service Worker dengan advanced caching strategies
- `src/lib/serviceWorker.ts` - Service Worker management utility
- `src/components/ServiceWorkerInitializer.tsx` - Service Worker registration component

**Best Practices Yang Dijadikan Acuan:**
- TTL-based cache expiration
- Automatic cache cleanup
- Fallback mechanism untuk cache misses
- Multi-level caching strategy
- Cache key organization untuk efficient lookup
- Service Worker v2.0 dengan multiple cache strategies (cache-first, network-first, stale-while-revalidate)
- TTL-based cache management dengan automatic cleanup
- Cache metadata management untuk smart invalidation
- Background sync untuk offline actions

**Enhanced Caching Strategy:**
- Service Worker v2.0 dengan multiple cache strategies (cache-first, network-first, stale-while-revalidate)
- TTL-based cache management dengan automatic cleanup
- Cache metadata management untuk smart invalidation
- Background sync untuk offline actions
- Push notification support dengan enhanced handlers

