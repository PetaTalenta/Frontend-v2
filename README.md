# FutureGuide Frontend

**Next.js 15** assessment platform with **dual authentication system** (V1 JWT + V2 Firebase) and comprehensive performance optimizations.

---

## 🔐 Authentication V2 Migration

### Status: In Progress (Phase 4 - Documentation)

FutureGuide is migrating from custom JWT authentication (V1) to Firebase Authentication (V2) with a **zero-downtime gradual rollout** strategy.

#### Migration Progress

- ✅ **Phase 1: Foundation** (100%) - Core services, interceptors, AuthContext
- ✅ **Phase 2: Features** (100%) - Login, registration, password reset, profile
- ✅ **Phase 3: Testing** (100%) - 110+ test cases with comprehensive mocks
- 🔄 **Phase 4: Documentation** (80%) - Deployment, troubleshooting, monitoring guides
- ⏳ **Phase 5: Deployment** (0%) - Staging deployment pending

**Current Rollout**: 0% (V2 deployed but inactive)

#### Key Features

- 🎯 **Dual Auth Support**: Both V1 and V2 work simultaneously
- 📊 **Feature Flags**: Control rollout via environment variables
- 🔄 **Gradual Rollout**: 0% → 1% → 5% → 10% → 25% → 50% → 75% → 100%
- 🛡️ **Zero Breaking Changes**: Backward compatible with V1
- ⚡ **Auto Token Refresh**: Background refresh every 5 minutes
- 🧪 **Comprehensive Testing**: 110+ test cases covering all flows

#### Quick Links

| Document | Description |
|----------|-------------|
| [Migration Guide](./docs/AUTH_V2_FRONTEND_MIGRATION_GUIDE.md) | Complete implementation guide |
| [Deployment Runbook](./docs/DEPLOYMENT_RUNBOOK.md) | Step-by-step deployment procedures |
| [Troubleshooting Guide](./docs/TROUBLESHOOTING_GUIDE.md) | Common issues and solutions |
| [Monitoring Setup](./docs/MONITORING_SETUP.md) | Grafana dashboards and alerts |
| [Architecture](./docs/AUTH_V2_ARCHITECTURE.md) | System design and flow diagrams |
| [Rollback Playbook](./docs/ROLLBACK_PLAYBOOK.md) | Emergency rollback procedures |
| [Testing Report](./testing/auth-v2-testing-final-report.md) | Test coverage and results |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Firebase account (for V2 auth)
- PostgreSQL (for V1 auth and user data)

### Installation

```bash
# Clone repository
git clone https://github.com/futureguide/frontend.git
cd frontend

# Install dependencies
npm install
# or
pnpm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Variables

```bash
# Auth V2 Configuration
NEXT_PUBLIC_USE_AUTH_V2=true                      # Enable V2 auth
NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE=0          # 0-100 (0 = disabled)

# Firebase Configuration (V2)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.futureguide.id
NEXT_PUBLIC_API_TIMEOUT=15000

# Feature Flags
NEXT_PUBLIC_ENABLE_PREFETCH=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
```

### Development

```bash
# Run development server
npm run dev

# Run with mock WebSocket server
npm run dev:full

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Build & Deploy

```bash
# Production build
npm run build

# Analyze bundle size
npm run build:analyze

# Start production server
npm start
```

---

## 🧪 Testing

### Auth V2 Testing

```bash
# Run auth V2 tests
npm test -- auth

# Run specific test file
npm test -- tokenService.test.ts
npm test -- Login.test.tsx

# Run all auth V2 tests with coverage
npm run test:coverage -- --testPathPattern=auth
```

### Test Coverage

- **tokenService**: 17 tests (100% coverage)
- **authV2Service**: 23 tests (100% coverage)
- **Login**: 21 tests (full flow coverage)
- **Register**: 19 tests (full flow coverage)
- **ForgotPassword**: 23 tests (full flow coverage)
- **Total**: 110+ tests

---

## 📁 Project Structure

```
PetaTalenta-FrontEnd/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── login/              # Login page
│   │   ├── register/           # Registration page
│   │   ├── forgot-password/    # Password reset request
│   │   ├── reset-password/     # Password reset confirmation
│   │   └── profile/            # User profile management
│   │
│   ├── components/             # React components
│   │   ├── auth/               # Auth-specific components
│   │   ├── ui/                 # Radix UI + shadcn/ui
│   │   ├── performance/        # Optimization providers
│   │   └── providers/          # Context providers
│   │
│   ├── services/               # API services
│   │   ├── apiService.js       # Axios with interceptors
│   │   ├── authV2Service.js    # Firebase Auth wrapper
│   │   ├── tokenService.js     # Token lifecycle management
│   │   └── websocket-service.ts # WebSocket client
│   │
│   ├── contexts/               # React contexts
│   │   ├── AuthContext.tsx     # Auth state management
│   │   └── TokenContext.tsx    # Token balance
│   │
│   ├── hooks/                  # Custom hooks
│   │   ├── usePrefetch.ts      # Route prefetching
│   │   └── useTokenRefresh.ts  # Auto token refresh
│   │
│   ├── config/                 # Configuration
│   │   ├── api.js              # API endpoints
│   │   ├── auth-v2-config.js   # V2 feature flags
│   │   └── firebase-errors.js  # Error code mapping
│   │
│   └── __tests__/              # Jest tests
│       ├── services/           # Service tests
│       └── components/         # Component tests
│
├── docs/                       # Documentation
│   ├── AUTH_V2_FRONTEND_MIGRATION_GUIDE.md
│   ├── DEPLOYMENT_RUNBOOK.md
│   ├── TROUBLESHOOTING_GUIDE.md
│   ├── MONITORING_SETUP.md
│   ├── AUTH_V2_ARCHITECTURE.md
│   └── ROLLBACK_PLAYBOOK.md
│
├── testing/                    # Testing utilities
│   ├── scripts/                # Test automation scripts
│   ├── mock-servers/           # Mock API servers
│   └── auth-v2-testing-final-report.md
│
└── scripts/                    # Utility scripts
    ├── optimize-performance.js
    ├── test-api-performance.js
    └── analyze-bundle.js
```

---

## 🔧 Key Services

### authV2Service

Firebase Authentication wrapper with Indonesian error messages.

```javascript
import authV2Service from '@/services/authV2Service';

// Login
const { idToken, user } = await authV2Service.login(email, password);

// Register
const { user } = await authV2Service.register(email, password, username);

// Password reset
await authV2Service.forgotPassword(email);
await authV2Service.resetPassword(oobCode, newPassword);

// Logout
await authV2Service.logout();
```

### tokenService

Token lifecycle management with auto-refresh.

```javascript
import tokenService from '@/services/tokenService';

// Store token
tokenService.setIdToken(token);

// Retrieve token
const token = tokenService.getIdToken();

// Check expiry
const isExpired = tokenService.isTokenExpired();
const isExpiringSoon = tokenService.isTokenExpiringSoon(); // < 10 min

// Refresh token
const newToken = await tokenService.refreshAuthToken();

// Clear tokens (logout)
tokenService.clearAuthData();
```

### apiService

Axios instance with auth interceptors and auto-refresh.

```javascript
import apiService from '@/services/apiService';

// Automatically adds Authorization header
const response = await apiService.get('/api/user/profile');

// Auto-refreshes expired tokens
const data = await apiService.post('/api/assessment/start', { assessmentId });
```

---

## 🎯 Auth V2 Configuration

### Feature Flags

```javascript
// auth-v2-config.js
export const USE_AUTH_V2 = process.env.NEXT_PUBLIC_USE_AUTH_V2 === 'true';
export const ROLLOUT_PERCENTAGE = parseInt(
  process.env.NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE || '0'
);

// Determine which auth to use
export function shouldUseAuthV2(userEmail) {
  if (!USE_AUTH_V2) return false;
  
  // User bucketing (deterministic hash)
  const hash = hashString(userEmail);
  const bucket = hash % 100;
  return bucket < ROLLOUT_PERCENTAGE;
}
```

### Rollout Phases

| Phase | Percentage | Duration | Users Affected | Purpose |
|-------|-----------|----------|----------------|---------|
| 0 | 0% | 24h | 0 | Backend health validation |
| 1 | 1% | 24h | ~100 | Canary release |
| 2 | 5% | 24h | ~500 | Small user group |
| 3 | 10% | 48h | ~1,000 | V1 vs V2 comparison |
| 4 | 25% | 48h | ~2,500 | Monitor support tickets |
| 5 | 50% | 72h | ~5,000 | Performance validation |
| 6 | 75% | 72h | ~7,500 | Final validation |
| 7 | 100% | Ongoing | All users | Full rollout |

---

## 📊 Monitoring

### Key Metrics

- **Login Success Rate**: Target > 99%
- **Error Rate**: Target < 0.5%
- **P95 Latency**: Target < 500ms
- **Token Refresh Success**: Target > 98%

### Grafana Dashboards

- **Auth V2 Overview**: Real-time metrics, error rates, latency
- **V1 vs V2 Comparison**: Side-by-side comparison during rollout
- **Token Management**: Refresh rates, expiry distribution

### Alerts

- 🚨 **Critical**: Error rate > 1%, service down, latency > 2s
- ⚠️ **Warning**: Error rate > 0.5%, V2 worse than V1
- 🔔 **Info**: Rollout percentage changed, deployment completed

---

## 🐛 Troubleshooting

### Common Issues

#### "Wrong password" error for correct password
- **Cause**: User account not migrated to V2
- **Fix**: Force V1 auth via `localStorage.setItem('forceAuthV1', 'true')`

#### Token expires too quickly
- **Cause**: Token refresh not working
- **Fix**: Check `useTokenRefresh` hook is active, verify Firebase credentials

#### Login works locally but fails in production
- **Cause**: CORS or environment variable misconfiguration
- **Fix**: Verify Firebase config in `.env.production`, check CORS headers

**Full Guide**: [docs/TROUBLESHOOTING_GUIDE.md](./docs/TROUBLESHOOTING_GUIDE.md)

---

## 🚀 Deployment

### Staging Deployment

```bash
# 1. Set environment variables (0% rollout)
NEXT_PUBLIC_USE_AUTH_V2=true
NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE=0

# 2. Build and deploy
npm run build
vercel --prod

# 3. Validate health
curl https://staging.futureguide.id/api/health/auth-v2
```

### Production Rollout

```bash
# Phase 1: 1% canary (24 hours)
NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE=1

# Monitor metrics for 24 hours
# If stable, increase to 5%

# Phase 2: 5% (24 hours)
NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE=5

# Continue gradual increase...
```

**Full Runbook**: [docs/DEPLOYMENT_RUNBOOK.md](./docs/DEPLOYMENT_RUNBOOK.md)

### Rollback

```bash
# Quick rollback (< 2 minutes)
NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE=0
pm2 restart futureguide-frontend

# Full rollback (15 minutes)
# Follow docs/ROLLBACK_PLAYBOOK.md
```

---

## 🤝 Contributing

### Development Workflow

1. Create feature branch from `main`
2. Implement changes with tests
3. Run `npm test` and `npm run build`
4. Submit pull request with description
5. Wait for CI/CD checks and review
6. Merge after approval

### Coding Standards

- **TypeScript/JSX**: Use ESLint + Prettier
- **Components**: Functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions
- **Tests**: Test file next to source (`*.test.ts`, `*.test.tsx`)

---

## 📄 License

Copyright © 2025 FutureGuide. All rights reserved.

---

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/futureguide/frontend/issues)
- **Slack**: #engineering (internal team)
- **Email**: engineering@futureguide.id

---

**Last Updated**: 2025-10-04  
**Version**: 2.0.0 (Auth V2 Migration in progress)
