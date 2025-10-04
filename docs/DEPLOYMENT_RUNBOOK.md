# Auth V2 Deployment Runbook

**Version**: 1.0  
**Last Updated**: 2025-10-04  
**Owner**: Engineering Team  
**Severity**: High (Authentication System)

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Deployment Steps](#deployment-steps)
4. [Gradual Rollout Strategy](#gradual-rollout-strategy)
5. [Health Checks](#health-checks)
6. [Rollback Procedures](#rollback-procedures)
7. [Post-Deployment Validation](#post-deployment-validation)
8. [Emergency Contacts](#emergency-contacts)

---

## 🔍 Pre-Deployment Checklist

### Code Readiness
- [ ] All unit tests passing (110+ tests)
- [ ] Integration tests validated
- [ ] Code review completed and approved
- [ ] No TypeScript compilation errors
- [ ] No ESLint warnings in auth modules
- [ ] Build successful: `npm run build`
- [ ] Bundle size within acceptable limits (<500KB increase)

### Infrastructure
- [ ] Firebase project created (Production)
- [ ] Firebase Auth enabled (Email/Password provider)
- [ ] Backend service auth-v2-service deployed
- [ ] API Gateway routes configured
- [ ] Environment variables set in deployment platform
- [ ] CDN cache invalidation planned
- [ ] Database backups completed

### Documentation
- [ ] This runbook reviewed by team
- [ ] Rollback procedure tested in staging
- [ ] Monitoring dashboards configured
- [ ] Alert rules configured
- [ ] Team briefed on deployment plan

### Stakeholder Communication
- [ ] Product team notified of deployment window
- [ ] Customer support team briefed on changes
- [ ] Marketing team aware of new features
- [ ] Downtime notice sent (if applicable)

---

## ⚙️ Environment Configuration

### Required Environment Variables

#### Frontend (.env.production)
```bash
# Feature Flags
NEXT_PUBLIC_USE_AUTH_V2=true
NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE=0  # Start at 0%

# API Endpoints
NEXT_PUBLIC_API_URL=https://api.futureguide.id
NEXT_PUBLIC_AUTH_V2_SERVICE_URL=https://api.futureguide.id/api/auth/v2

# Firebase Configuration (REPLACE WITH YOUR VALUES)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=futureguide.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=futureguide
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=futureguide.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Optional: Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://...
NEXT_PUBLIC_ANALYTICS_ID=G-...
```

#### Backend Service (auth-v2-service)
```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=futureguide
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@futureguide.iam.gserviceaccount.com

# Service Configuration
PORT=3008
NODE_ENV=production
CORS_ORIGIN=https://futureguide.id

# Database (if needed)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this
TOKEN_EXPIRY=3600  # 1 hour in seconds
REFRESH_TOKEN_EXPIRY=2592000  # 30 days in seconds
```

### Firebase Console Configuration

1. **Authentication Settings**
   - Enable Email/Password provider
   - Configure authorized domains: `futureguide.id`, `*.futureguide.id`
   - Set token expiration: 1 hour
   - Enable email enumeration protection

2. **Email Templates** (Optional)
   - Customize password reset email template
   - Add company branding
   - Set reply-to email address

3. **Security Rules**
   - Review and apply security rules
   - Test with Firebase Emulator Suite

---

## 🚀 Deployment Steps

### Phase 1: Backend Deployment (30 minutes)

#### Step 1.1: Deploy auth-v2-service
```bash
# Navigate to service directory
cd backend/auth-v2-service

# Install dependencies
npm ci --production

# Run tests
npm test

# Build
npm run build

# Deploy to production
# (Example for cloud platform - adjust as needed)
gcloud app deploy --version v2-0-0 --no-promote
# OR
heroku container:push web -a auth-v2-service-prod
heroku container:release web -a auth-v2-service-prod

# Verify deployment
curl https://api.futureguide.id/api/auth/v2/health
# Expected: {"status": "ok", "version": "2.0.0"}
```

#### Step 1.2: Update API Gateway
```bash
# Update routes configuration
# Route: /api/auth/v2/* → auth-v2-service:3008

# Test routing
curl https://api.futureguide.id/api/auth/v2/health
```

### Phase 2: Frontend Deployment (45 minutes)

#### Step 2.1: Build Production Bundle
```bash
# Navigate to frontend directory
cd PetaTalenta-FrontEnd

# Install dependencies
npm ci

# Set environment variables
cp .env.production.example .env.production
# Edit .env.production with actual values

# Build
npm run build

# Analyze bundle (optional)
npm run build:analyze
# Check: auth modules should be ~50-80KB gzipped
```

#### Step 2.2: Pre-Deployment Tests
```bash
# Run all tests
npm test

# Test production build locally
npm run start
# Visit: http://localhost:3000
# Test: Login, Register, Password Reset flows

# Check console for errors
# Test V1 auth still works (rollout = 0%)
```

#### Step 2.3: Deploy to Production
```bash
# Deploy to Vercel/Netlify/AWS
vercel --prod
# OR
npm run deploy

# Wait for deployment to complete
# Note deployment URL
```

#### Step 2.4: DNS & CDN Configuration
```bash
# If using Cloudflare/CDN:
# 1. Invalidate cache for /login, /register, /forgot-password
# 2. Update DNS if needed
# 3. Verify SSL certificates are valid

# Test deployment
curl -I https://futureguide.id
# Check: X-Vercel-Id or deployment platform header
```

---

## 📈 Gradual Rollout Strategy

### Rollout Phases

| Phase | Percentage | Duration | Validation | Go/No-Go |
|-------|-----------|----------|------------|----------|
| Phase 0 | 0% | 24h | Backend health, metrics baseline | Auto |
| Phase 1 | 1% | 24h | Error rate < 0.1%, latency < 500ms | Manual |
| Phase 2 | 5% | 24h | Error rate < 0.1%, latency < 500ms | Manual |
| Phase 3 | 10% | 48h | Compare V1 vs V2 metrics | Manual |
| Phase 4 | 25% | 48h | Monitor support tickets | Manual |
| Phase 5 | 50% | 72h | Performance comparison | Manual |
| Phase 6 | 75% | 72h | Final validation | Manual |
| Phase 7 | 100% | - | Full rollout complete | Manual |

### Rollout Execution

#### Phase 0: Backend Only (0% users)
```bash
# Set rollout to 0%
# Update .env.production
NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE=0

# Deploy frontend
vercel --prod

# Validate:
# - V2 backend is healthy
# - V1 auth still works for all users
# - Metrics are being collected
```

**Success Criteria**:
- ✅ Backend response time < 200ms (p95)
- ✅ No 5xx errors
- ✅ Firebase Auth dashboard shows 0 users
- ✅ V1 login success rate > 99%

#### Phase 1: Canary (1% users)
```bash
# Increase rollout to 1%
NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE=1

# Deploy
vercel --prod

# Monitor for 24 hours
```

**Success Criteria**:
- ✅ V2 login success rate > 99%
- ✅ Token refresh working (check logs)
- ✅ Error rate < 0.1%
- ✅ No increase in support tickets
- ✅ Average latency < 500ms

**Validation Queries** (Analytics):
```sql
-- V2 Error Rate
SELECT 
  COUNT(*) FILTER (WHERE error = true) * 100.0 / COUNT(*) as error_rate
FROM auth_events
WHERE auth_version = 'v2' 
  AND timestamp > NOW() - INTERVAL '24 hours';

-- Expected: < 0.1%

-- Latency P95
SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95
FROM auth_events
WHERE auth_version = 'v2'
  AND timestamp > NOW() - INTERVAL '24 hours';

-- Expected: < 500ms
```

#### Phase 2-7: Progressive Rollout
```bash
# For each phase, update percentage
NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE=5  # Phase 2
# ... then 10, 25, 50, 75, 100

# Deploy and monitor
vercel --prod

# Wait for phase duration before proceeding
```

### Emergency Rollback Trigger

**Auto-Rollback Conditions**:
- Error rate > 1% for 10 minutes
- p95 latency > 2000ms for 15 minutes
- 5xx errors > 100 in 5 minutes
- Firebase Auth service down

**Manual Rollback Conditions**:
- Customer complaints > 10 in 1 hour
- Critical bug discovered
- Security vulnerability identified

---

## ✅ Health Checks

### Automated Health Checks (Run Every 5 Minutes)

```bash
#!/bin/bash
# healthcheck.sh

# Check Backend
BACKEND_HEALTH=$(curl -s https://api.futureguide.id/api/auth/v2/health)
if [[ $BACKEND_HEALTH != *"ok"* ]]; then
  echo "❌ Backend health check failed"
  exit 1
fi

# Check Frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://futureguide.id)
if [[ $FRONTEND_STATUS != "200" ]]; then
  echo "❌ Frontend is down"
  exit 1
fi

# Check Firebase Auth
# (Implement Firebase Admin SDK health check)

echo "✅ All health checks passed"
```

### Manual Health Validation

**Test User Accounts** (Create before deployment):
- `test-v2-login@futureguide.id` / `TestPassword123!`
- `test-v2-register@futureguide.id` (will be registered)
- `test-v2-reset@futureguide.id` (for password reset)

**Validation Steps**:
1. ✅ Login with test account → Should work
2. ✅ Register new account → Should create user
3. ✅ Forgot password flow → Should send email
4. ✅ Reset password → Should update password
5. ✅ Token refresh → Should renew token after 55 minutes
6. ✅ Logout → Should clear tokens
7. ✅ Profile update → Should update displayName
8. ✅ Account deletion → Should delete account

---

## 🔄 Rollback Procedures

### Quick Rollback (< 5 minutes)

#### Option 1: Percentage Rollback (Preferred)
```bash
# Set rollout to 0%
# This keeps V2 deployed but inactive
NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE=0

# Deploy immediately
vercel --prod --force

# Verify V1 is handling all traffic
curl -s https://futureguide.id/api/auth/login | jq .
```

#### Option 2: Full Rollback (If needed)
```bash
# Revert to previous deployment
vercel rollback

# OR manually deploy previous version
git checkout <previous-commit-hash>
vercel --prod

# Verify rollback
curl -I https://futureguide.id
```

### Complete Rollback Procedure

**Step 1: Stop New V2 Registrations**
```bash
# Immediately set rollout to 0%
NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE=0
vercel --prod --force
```

**Step 2: Notify Stakeholders**
```
Subject: Auth V2 Rollback Initiated - Action Required

The Auth V2 deployment has been rolled back due to:
[REASON]

Impact:
- All users now using V1 authentication
- No user data lost
- Services operating normally

Next Steps:
1. Engineering investigating root cause
2. Fix will be deployed after validation
3. New rollout timeline TBD

Status: https://status.futureguide.id
```

**Step 3: Investigate Root Cause**
```bash
# Check error logs
# (Adjust based on your logging platform)
kubectl logs -f auth-v2-service --tail=1000

# Check Firebase Auth logs
# Visit: Firebase Console → Authentication → Usage

# Check frontend error tracking
# Visit: Sentry/Datadog dashboard

# Export error logs for analysis
```

**Step 4: User Communication** (If needed)
```markdown
# For affected users only

Hi [User],

We detected an issue with our authentication system that may have 
affected your recent login attempt. The issue has been resolved and 
your account is secure.

Please try logging in again. If you experience any issues, please 
contact support@futureguide.id.

We apologize for the inconvenience.

Best regards,
FutureGuide Team
```

---

## 🔍 Post-Deployment Validation

### Immediate Validation (First 1 Hour)

**Metrics to Monitor**:
```
✅ V2 Login Success Rate > 99%
✅ V2 Registration Success Rate > 99%
✅ Token Refresh Success Rate > 99%
✅ Error Rate < 0.1%
✅ p50 Latency < 200ms
✅ p95 Latency < 500ms
✅ p99 Latency < 1000ms
✅ No 5xx errors
✅ Firebase quota usage < 50%
```

**Dashboard Links**:
- Frontend Metrics: [Your monitoring URL]
- Backend Metrics: [Your monitoring URL]
- Firebase Console: https://console.firebase.google.com
- Error Tracking: [Sentry/Datadog URL]

### 24-Hour Validation

**Compare V1 vs V2** (For rollout > 0%):
```sql
-- Login Success Rate Comparison
SELECT 
  auth_version,
  COUNT(*) FILTER (WHERE success = true) * 100.0 / COUNT(*) as success_rate,
  AVG(latency_ms) as avg_latency,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency
FROM auth_events
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY auth_version;

-- Expected:
-- V1: success_rate ~99%, avg_latency ~150ms, p95 ~400ms
-- V2: success_rate ~99%, avg_latency ~180ms, p95 ~450ms
-- (V2 slightly slower due to Firebase, but within acceptable range)
```

**User Feedback Analysis**:
```sql
-- Support Tickets Related to Auth
SELECT 
  COUNT(*) as ticket_count,
  category
FROM support_tickets
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND tags LIKE '%auth%'
GROUP BY category
ORDER BY ticket_count DESC;

-- Expected: No significant increase in auth-related tickets
```

### 7-Day Validation

**Long-Term Metrics**:
- Total V2 users created
- Token refresh success rate (should be > 99.5%)
- Password reset success rate
- Account deletion rate (should be similar to V1)
- Average session duration (should be similar to V1)

**Cost Analysis**:
```
Firebase Auth Pricing:
- Free tier: 50,000 verifications/month
- Paid tier: $0.0055 per verification

Expected Monthly Cost (at 100% rollout):
- Estimated verifications: [Your user count] * 30 logins/month
- Cost: [Calculation]
- Compare with V1 infrastructure cost
```

---

## 📞 Emergency Contacts

### On-Call Rotation

| Role | Name | Phone | Email | Backup |
|------|------|-------|-------|--------|
| Lead Engineer | [Name] | +62-xxx | email@company.com | [Backup] |
| DevOps Lead | [Name] | +62-xxx | email@company.com | [Backup] |
| Product Owner | [Name] | +62-xxx | email@company.com | [Backup] |
| CTO | [Name] | +62-xxx | email@company.com | - |

### Escalation Path

1. **Severity 1** (System Down): 
   - Immediate rollback → Notify CTO
   
2. **Severity 2** (Degraded Performance): 
   - Increase monitoring → Prepare rollback → Notify Product Owner
   
3. **Severity 3** (Minor Issues): 
   - Log and monitor → Fix in next release

### External Support

- **Firebase Support**: https://firebase.google.com/support
- **Hosting Provider**: [Your support link]
- **CDN Provider**: [Your support link]

---

## 📚 Related Documentation

- [Architecture Overview](./AUTH_V2_ARCHITECTURE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
- [Monitoring Dashboard Setup](./MONITORING_SETUP.md)
- [Rollback Playbook](./ROLLBACK_PLAYBOOK.md)
- [Testing Guide](../testing/auth-v2-testing-final-report.md)

---

## 📝 Deployment Log Template

```markdown
# Deployment Log: Auth V2 - [Date]

**Deployment ID**: [ID]
**Deployed By**: [Name]
**Start Time**: [YYYY-MM-DD HH:MM:SS UTC]
**Completion Time**: [YYYY-MM-DD HH:MM:SS UTC]

## Pre-Deployment
- [ ] Checklist completed
- [ ] Team briefed
- [ ] Rollback plan reviewed

## Deployment Steps
- [ ] Backend deployed - v[version]
- [ ] Frontend deployed - v[version]
- [ ] Health checks passed
- [ ] Rollout set to [percentage]%

## Post-Deployment
- [ ] Metrics validated (1 hour)
- [ ] No critical errors
- [ ] User feedback monitored
- [ ] Team notified of success

## Issues Encountered
[List any issues and resolutions]

## Next Phase
Next rollout increase scheduled for: [Date/Time]
Target percentage: [X]%
```

---

**End of Deployment Runbook**  
**Version**: 1.0  
**Last Updated**: 2025-10-04
