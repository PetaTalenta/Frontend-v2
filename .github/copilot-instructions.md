# AI Copilot Instructions for FutureGuide Frontend

## Project Overview

FutureGuide is a Next.js 15 assessment platform built with App Router, TypeScript, and comprehensive performance optimizations. The system handles AI-driven talent mapping assessments with real-time WebSocket communication and sophisticated caching strategies.


## Credenstial Account Playwright
const USER_A = {
  email: 'kasykoi@gmail.com',
  password: 'Anjas123',
  <!-- expectedName: 'User A' // Expected display name -->
};

const USER_B = {
  email: 'viccxn@gmail.com',
  password: 'Kiana423',
  <!-- expectedName: 'User B' // Expected display name -->
};

## Core Architecture

### Next.js App Router Structure
- **`src/app/`**: App Router pages with extensive demo/test routes (avoid creating more demo routes)
- **`src/components/`**: Feature-organized components (ui/, auth/, assessment/, performance/, etc.)
- **`src/services/`**: Consolidated API services (recently refactored to remove 9+ redundant services)
- **`src/contexts/`**: AuthContext and TokenContext for state management
- **`src/hooks/`**: Custom hooks with performance-focused implementations

### API Integration Patterns
- **Primary endpoint**: `https://futureguide.id` (configured in `src/config/api.js`)
- **Service layer**: Use `src/services/apiService.js` with axios interceptors for auth
- **Authentication**: Bearer token stored in localStorage with multiple fallback keys
- **Error handling**: Centralized in axios interceptors with detailed logging

## Performance-First Development

### 1. Prefetching & Caching
```typescript
// Use consolidated prefetch hooks
import { usePrefetch } from '../hooks/usePrefetch';
import { useSimplePrefetch } from '../components/performance/SimplePrefetchProvider';

// Prefetch critical routes
const { prefetchRoute, prefetchPredictedRoutes } = usePrefetch();
prefetchPredictedRoutes('/dashboard'); // Auto-prefetches likely next pages
```

### 2. SWR Configuration
- Use `src/lib/swr-config.ts` with optimized settings (1s deduping, 2 retry attempts)
- Leverage `useCachedSWR` hook for enhanced caching with TTL
- Always wrap data fetching in SWRProvider from `src/components/providers/SWRProvider.tsx`

### 3. WebSocket Integration
- Use `src/services/websocket-service.ts` (consolidated from multiple implementations)
- Follow assessment monitoring pattern: WebSocket-first with polling fallback
- Timeout configurations: 20s connection, 15s auth, 10min monitoring

## Development Patterns

### Component Organization
```typescript
// Feature-based component structure
src/components/
├── ui/           # Radix UI + shadcn/ui components
├── auth/         # Authentication components  
├── assessment/   # Assessment flow components
├── performance/ # Optimization providers
└── providers/   # Context providers
```

### Service Consolidation
- **DO**: Use single consolidated services (`assessment-service.ts`, `websocket-service.ts`)
- **DON'T**: Create multiple variations (recently removed 9+ redundant assessment services)
- **Pattern**: WebSocket-first with intelligent polling fallback

### Testing & Scripts
- **Testing**: Use Jest with jsdom, test files in `src/__tests__/`
- **Performance testing**: `scripts/test-api-performance.js` for API benchmarking
- **Token testing**: Extensive scripts in `testing/scripts/` for concurrent assessment testing
- **Utility scripts**: `scripts/` directory for optimization and analysis

## Build & Development

### Key Scripts
```bash
npm run dev:full          # Dev + WebSocket mock server
npm run build:analyze     # Bundle analysis
npm run test:token:quick  # Token deduction testing
npm run test:high-load    # Concurrent assessment testing
npm run optimize          # Performance optimization script
```

### Environment Configuration
- Font optimization: Geist Sans/Mono with preload and display:swap
- Image optimization: AVIF/WebP with CDN support for `*.FutureGuide.com`
- Bundle analysis: Integrated with `@next/bundle-analyzer`

## Code Quality Guidelines

### TypeScript Patterns
- Strict type safety with `src/types/` definitions
- Form handling with react-hook-form + Zod validation
- Component props interfaces with clear naming

### State Management
- AuthContext + TokenContext for global state
- SWR for server state with optimized caching
- Local state with performance-conscious React patterns

### Performance Monitoring
- Built-in performance monitoring in `src/services/performance-monitoring.ts`
- Prefetch debugging tools in development mode
- Resource utilization tracking with cleanup patterns

## Critical Integration Points

### Assessment Flow
1. **Token verification**: Always check token balance before assessment
2. **WebSocket monitoring**: Real-time status updates with fallback polling
3. **Result caching**: Immediate cache invalidation after assessment completion
4. **Error recovery**: Comprehensive retry logic with exponential backoff

### API Communication
- **Timeout strategy**: 15s default, reduced from 30s for faster failure detection  
- **Retry pattern**: 3 attempts with 500ms delay intervals
- **Auth handling**: Multiple localStorage key fallbacks for token retrieval
- **Response caching**: Stale-while-revalidate patterns throughout

## Common Anti-Patterns to Avoid

1. **Service proliferation**: Don't create multiple assessment/API services - use existing consolidated ones
2. **Demo route creation**: Avoid adding more test/demo routes in `src/app/` 
3. **Bypass prefetch system**: Always use provided prefetch hooks instead of manual implementations
4. **Ignore timeout configs**: Use centralized timeout settings from `src/config/`
5. **Duplicate WebSocket connections**: Use the consolidated websocket-service.ts only

## Quick Reference Files

- **API Configuration**: `src/config/api.js`
- **Performance Config**: `src/config/performance-config.ts` 
- **SWR Setup**: `src/lib/swr-config.ts`
- **Main Layout**: `src/app/layout.tsx`
- **Auth Context**: `src/contexts/AuthContext.tsx`
- **Assessment Service**: `src/services/assessment-service.ts`
- **WebSocket Service**: `src/services/websocket-service.ts`