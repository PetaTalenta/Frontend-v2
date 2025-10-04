# Auth V2 Rollback Playbook

**Version**: 1.0  
**Last Updated**: 2025-10-04  
**Audience**: On-Call Engineers, DevOps, Platform Team

---

## 📋 Table of Contents

1. [When to Roll Back](#when-to-roll-back)
2. [Rollback Decision Matrix](#rollback-decision-matrix)
3. [Quick Rollback Procedures](#quick-rollback-procedures)
4. [Full Rollback Procedures](#full-rollback-procedures)
5. [Post-Rollback Actions](#post-rollback-actions)
6. [Communication Templates](#communication-templates)
7. [Incident Postmortem](#incident-postmortem)

---

## ⚠️ When to Roll Back

### Immediate Rollback (< 5 minutes)

**Critical Scenarios (P0)**:
- ✅ **Login completely broken**: > 10% of users cannot login
- ✅ **Auth service down**: V2 service unreachable for > 2 minutes
- ✅ **Data corruption**: User data being lost or corrupted
- ✅ **Security incident**: Auth bypass, token leakage, unauthorized access
- ✅ **Cascading failures**: V2 causing downstream system failures

**Decision**: **ROLL BACK IMMEDIATELY**. Don't investigate first.

### Evaluate Rollback (15-30 minutes)

**High Impact Scenarios (P1)**:
- ⚠️ **High error rate**: V2 error rate > 1% for > 15 minutes
- ⚠️ **Performance degradation**: P95 latency > 2s for > 15 minutes
- ⚠️ **Firebase issues**: Firebase Auth API experiencing issues
- ⚠️ **Token refresh broken**: > 5% of refresh requests failing
- ⚠️ **Elevated support tickets**: > 50 tickets/hour related to auth

**Decision**: Monitor for 15-30 minutes. If not improving, **ROLL BACK**.

### Fix Forward (Don't Roll Back)

**Low Impact Scenarios (P2/P3)**:
- 🔔 **Minor bugs**: Cosmetic issues, non-critical UX problems
- 🔔 **Small user impact**: < 10 users affected
- 🔔 **Performance within SLA**: Latency < 2s, error rate < 0.5%
- 🔔 **Known workaround exists**: Users can accomplish task via alternate flow

**Decision**: **FIX FORWARD**. Deploy patch quickly.

---

## 📊 Rollback Decision Matrix

| Metric | Threshold | Severity | Action | Timeframe |
|--------|-----------|----------|--------|-----------|
| Login success rate | < 90% | P0 | Immediate rollback | < 5 min |
| Login success rate | 90-95% | P1 | Evaluate rollback | 15 min |
| Error rate | > 5% | P0 | Immediate rollback | < 5 min |
| Error rate | 1-5% | P1 | Evaluate rollback | 15 min |
| Error rate | 0.5-1% | P2 | Fix forward | 1-2 hours |
| P95 latency | > 5s | P0 | Immediate rollback | < 5 min |
| P95 latency | 2-5s | P1 | Evaluate rollback | 30 min |
| Service uptime | < 95% | P0 | Immediate rollback | < 5 min |
| Support tickets | > 100/hr | P1 | Evaluate rollback | 15 min |
| Users affected | > 500 | P0 | Immediate rollback | < 5 min |
| Users affected | 100-500 | P1 | Evaluate rollback | 30 min |
| Users affected | < 100 | P2 | Fix forward | 1-2 hours |

### Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│  Issue Detected                                             │
└────────────────────────┬───────────────────────────────────┘
                         │
            ┌────────────▼────────────┐
            │  Check Impact           │
            │  • Error rate           │
            │  • Users affected       │
            │  • Support tickets      │
            └────────────┬────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
┌────────▼────────┐            ┌─────────▼────────┐
│  P0 Critical    │            │  P1/P2 Medium    │
│  • > 500 users  │            │  • < 500 users   │
│  • Error > 5%   │            │  • Error < 5%    │
│  • Service down │            │  • Degraded perf │
└────────┬────────┘            └─────────┬────────┘
         │                               │
┌────────▼─────────────┐       ┌─────────▼────────┐
│  ROLLBACK            │       │  EVALUATE        │
│  IMMEDIATELY         │       │  • Monitor 15min │
│  • Execute Quick     │       │  • Check trends  │
│    Rollback          │       │  • Team decision │
│  • Notify team       │       └─────────┬────────┘
│  • < 5 minutes       │                 │
└──────────────────────┘       ┌─────────┴────────┐
                               │                  │
                      ┌────────▼────────┐ ┌───────▼────────┐
                      │  Improving?     │ │  Fix Available?│
                      │  Yes: Fix fwd   │ │  Yes: Deploy   │
                      │  No: Rollback   │ │  No: Rollback  │
                      └─────────────────┘ └────────────────┘
```

---

## 🚀 Quick Rollback Procedures

### Option 1: Reduce Rollout Percentage (Fastest - 2 minutes)

**Best for**: Gradual rollback, preserving V2 for some users

**Steps**:

```bash
# 1. SSH to application server
ssh deploy@app.futureguide.id

# 2. Update environment variable
cd /var/www/futureguide-frontend

# Current percentage check
grep ROLLOUT_PERCENTAGE .env.production
# Output: NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE=25

# 3. Set new percentage (0 = full rollback)
echo "NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE=0" >> .env.production

# Or partial rollback:
# NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE=1  (canary only)
# NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE=5  (small group)

# 4. Restart application (Next.js)
pm2 restart futureguide-frontend

# Or if using Docker:
# docker-compose restart frontend

# Or if using Kubernetes:
# kubectl rollout restart deployment/futureguide-frontend -n production

# 5. Verify change
curl -s https://futureguide.id | grep -o "authVersion"
# Check browser console for multiple users
```

**Expected Result**: V2 traffic drops to target percentage within 1 minute

**Verification**:
```bash
# Check metrics
curl -s https://api.futureguide.id/metrics | grep auth_version
# Should show reduced V2 traffic

# Check Grafana dashboard
# Traffic split should update immediately
```

### Option 2: Feature Flag Disable (3 minutes)

**Best for**: Complete V2 disable while keeping service running

**Steps**:

```bash
# 1. Update environment variable
echo "NEXT_PUBLIC_USE_AUTH_V2=false" >> .env.production

# 2. Restart application
pm2 restart futureguide-frontend

# 3. Verify ALL users on V1
# Check browser console for multiple users
localStorage.getItem('authVersion') // Should be 'v1' for all
```

### Option 3: DNS/CDN Rollback (5 minutes)

**Best for**: Complete infrastructure rollback

**Steps**:

```bash
# 1. Cloudflare/CDN: Disable V2 backend routing
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"value":{"auth_v2_enabled":false}}'

# 2. Or: Update load balancer to route all to V1
aws elbv2 modify-listener --listener-arn $LISTENER_ARN \
  --default-actions Type=forward,TargetGroupArn=$V1_TARGET_GROUP

# 3. Verify routing
curl -I https://api.futureguide.id/api/auth/v2/health
# Should return 503 or redirect to V1
```

---

## 🔄 Full Rollback Procedures

### Complete Infrastructure Rollback

**Time Required**: 15-30 minutes  
**Use When**: V2 completely broken, needs code changes

#### Step 1: Immediate Traffic Cutoff (2 minutes)

```bash
# Execute Quick Rollback Option 1 first
NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE=0
pm2 restart futureguide-frontend
```

#### Step 2: Stop V2 Services (3 minutes)

```bash
# Stop V2 backend service
pm2 stop auth-v2-service

# Or Docker:
docker-compose stop auth-v2-service

# Or Kubernetes:
kubectl scale deployment auth-v2-service --replicas=0 -n production
```

#### Step 3: Database Cleanup (5 minutes)

```sql
-- Mark all V2 sessions as invalidated
UPDATE user_sessions 
SET is_valid = false,
    invalidated_at = NOW(),
    invalidated_reason = 'V2 rollback'
WHERE auth_version = 'v2' 
  AND is_valid = true;

-- Log rollback event
INSERT INTO system_events (event_type, severity, description, timestamp)
VALUES ('auth_rollback', 'critical', 'V2 rolled back to V1', NOW());
```

#### Step 4: Clear CDN/Cache (5 minutes)

```bash
# Purge CDN cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

# Clear Redis cache (if applicable)
redis-cli FLUSHDB

# Clear Next.js build cache
rm -rf .next/cache
npm run build
pm2 restart futureguide-frontend
```

#### Step 5: Verify V1 Stability (10 minutes)

```bash
# Check V1 service health
curl https://api.futureguide.id/api/auth/v1/health

# Check login functionality
curl -X POST https://api.futureguide.id/api/auth/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Monitor metrics for 10 minutes
watch -n 10 'curl -s https://api.futureguide.id/metrics | grep -E "login|error"'
```

#### Step 6: User Communication (Ongoing)

```markdown
# Post to Status Page (status.futureguide.id)

**Incident**: Authentication System Rollback
**Status**: Monitoring
**Start**: 2025-10-04 14:30 UTC
**Impact**: Brief interruption during rollback (< 2 minutes)

We rolled back a new authentication system update due to 
technical issues. All users are now on the stable system.
Active sessions were preserved.

**Update 14:45**: Rollback complete. Monitoring stability.
**Update 15:00**: All systems normal. Incident resolved.
```

---

## 📋 Post-Rollback Actions

### Immediate Actions (Within 1 hour)

#### 1. Verify System Stability

```bash
# Check error rate
curl -s https://api.futureguide.id/metrics | grep error_rate
# Target: < 0.1%

# Check login success rate
# Grafana: Auth V1 Overview → Login Success Rate
# Target: > 99%

# Check support ticket rate
# Zendesk/JIRA: Count tickets with tag "auth" created in last hour
# Target: < 10 tickets
```

#### 2. Notify Stakeholders

**Who to Notify**:
- Engineering team (Slack #engineering)
- Product team (Slack #product)
- Customer support (Slack #support)
- Executive team (Email - if P0)

**Template**:
```
⚠️ ROLLBACK COMPLETE: Auth V2

We've rolled back the Auth V2 migration due to [brief reason].

IMPACT:
• Affected users: ~X users
• Duration: Y minutes
• Current status: All systems stable on V1

NEXT STEPS:
• Root cause analysis in progress
• Fix ETA: [estimate or TBD]
• Retry deployment: [date or TBD]

Dashboard: https://grafana.futureguide.id/d/auth-v1
Incident doc: [link to incident doc]
```

#### 3. Create Incident Document

```markdown
# Incident Report: Auth V2 Rollback

**Incident ID**: INC-2025-10-04-001
**Severity**: P0 / P1 / P2
**Date**: 2025-10-04
**Time**: 14:30-15:00 UTC (30 minutes)
**Status**: Resolved

## Summary
Brief description of what went wrong.

## Timeline
- 14:00 - V2 deployed at 25% rollout
- 14:30 - Alert fired: Error rate 2.5%
- 14:32 - On-call acknowledged
- 14:35 - Decision: Rollback
- 14:37 - Rollback executed (percentage → 0)
- 14:45 - V2 services stopped
- 15:00 - Verified V1 stability

## Impact
- Users affected: ~500 (5%)
- Support tickets: 23
- Revenue impact: $0 (no payment failures)
- Duration: 30 minutes

## Root Cause
[To be filled after investigation]

## Resolution
Rolled back to V1 auth system.

## Prevention
[Action items to prevent recurrence]
```

### Follow-up Actions (Within 24 hours)

#### 1. Root Cause Analysis

**Investigation Checklist**:
- [ ] Review application logs (last 2 hours before incident)
- [ ] Review Firebase logs
- [ ] Check recent code changes (last 24 hours)
- [ ] Compare V1 vs V2 metrics
- [ ] Reproduce issue in staging
- [ ] Identify code/config causing issue

**Tools**:
```bash
# Search logs for errors
grep -r "ERROR" /var/log/auth-v2/*.log | grep "2025-10-04 14:"

# Or in ELK/Kibana:
# Query: level:ERROR AND timestamp:[2025-10-04T14:00 TO 2025-10-04T15:00]

# Check Firebase logs
firebase auth:logs --since 2h
```

#### 2. Develop Fix

**Fix Checklist**:
- [ ] Identify root cause
- [ ] Write failing test reproducing issue
- [ ] Implement fix
- [ ] Verify test now passes
- [ ] Code review
- [ ] Deploy to staging
- [ ] Verify fix in staging
- [ ] QA sign-off

#### 3. Re-deployment Planning

**Before Re-deploying V2**:
- [ ] Root cause documented
- [ ] Fix implemented and tested
- [ ] Staging validated (> 24 hours stable)
- [ ] Rollback plan updated (if needed)
- [ ] Team briefed on what went wrong
- [ ] Monitoring/alerting improved
- [ ] Stakeholder approval obtained

**Re-deployment Strategy**:
```markdown
# Conservative Re-deployment

Phase 1: 0.1% (10 users) for 48 hours
- Validate fix with tiny group
- Monitor heavily

Phase 2: 1% (100 users) for 48 hours
- If stable, proceed

Phase 3: 5%, 10%, 25%, 50%, 75%, 100%
- Each phase: 48 hours minimum
- Strict go/no-go criteria
```

---

## 💬 Communication Templates

### Template 1: Immediate Rollback Notification (Slack)

```markdown
🚨 **AUTH V2 ROLLBACK IN PROGRESS** 🚨

**Status**: Rolling back
**Severity**: P0
**Impact**: ~X users experiencing issues
**Action**: Reducing V2 rollout to 0%
**ETA**: 5 minutes

**Incident Channel**: #incident-2025-10-04
**Incident Commander**: @[your-name]

Please join incident channel for updates.
```

### Template 2: Rollback Complete (Slack)

```markdown
✅ **AUTH V2 ROLLBACK COMPLETE**

**Status**: Resolved
**Duration**: 30 minutes
**Impact**: ~500 users had brief interruption
**Current State**: All users on stable V1 system

**Metrics**:
• Login success rate: 99.5% ✅
• Error rate: 0.08% ✅
• Support tickets: 12 (handled) ✅

**Next Steps**:
• Root cause analysis: Tomorrow 10am
• Fix development: TBD
• Re-deployment: TBD (post-RCA)

**Incident Report**: [link]
```

### Template 3: Customer Support Message

```markdown
**Subject**: Brief Authentication System Update

Hi [User],

You may have experienced a brief login issue earlier today. 
We've resolved this by rolling back a system update.

**What happened**: 
Between 2:30 PM - 3:00 PM UTC, some users (~5%) experienced 
login difficulties due to a new authentication system update.

**Resolution**: 
We rolled back to our stable authentication system. All users 
can now login normally.

**Impact to your account**: 
None. Your data and account are secure. If you were logged in 
during the rollback, you may have been logged out and will need 
to login again.

**Compensation**: 
[If applicable: We've added X days of free service to your account]

We apologize for any inconvenience.

FutureGuide Engineering Team
```

### Template 4: Postmortem Email (Stakeholders)

```markdown
**Subject**: Postmortem - Auth V2 Rollback Incident (Oct 4)

**Incident Summary**:
On Oct 4, 2025, we rolled back the Auth V2 migration after 
detecting elevated error rates (2.5%) affecting ~500 users.

**Timeline**:
• 14:00 - V2 deployed at 25%
• 14:30 - Error rate alert
• 14:37 - Rollback executed
• 15:00 - Incident resolved

**Root Cause**:
[Detailed technical explanation]

**Impact**:
• Users: 500 (~5% of total)
• Duration: 30 minutes
• Support tickets: 23
• Revenue: $0 impact

**What Went Well**:
✅ Fast detection (< 5 minutes)
✅ Clear rollback procedure followed
✅ Rollback completed in 5 minutes
✅ No data loss

**What Could Be Improved**:
⚠️ [Specific improvements identified]

**Action Items**:
1. [Action] - Owner: [Name] - Due: [Date]
2. [Action] - Owner: [Name] - Due: [Date]

**Re-deployment Plan**:
[Conservative re-deployment strategy]

Full report: [link to detailed postmortem]
```

---

## 📊 Incident Postmortem

### Postmortem Template

```markdown
# Postmortem: Auth V2 Rollback

**Date**: 2025-10-04
**Author**: [Your Name]
**Reviewers**: Engineering Team, Product Lead
**Status**: Draft / Final

---

## Executive Summary

In 2-3 sentences: What happened, impact, and resolution.

---

## Incident Details

| Field | Value |
|-------|-------|
| **Incident ID** | INC-2025-10-04-001 |
| **Severity** | P0 / P1 / P2 |
| **Detection Time** | 2025-10-04 14:30 UTC |
| **Resolution Time** | 2025-10-04 15:00 UTC |
| **Duration** | 30 minutes |
| **Users Affected** | ~500 (5%) |
| **Support Tickets** | 23 |
| **Revenue Impact** | $0 |

---

## Timeline

| Time (UTC) | Event | Person |
|------------|-------|--------|
| 14:00 | V2 deployed at 25% rollout | DevOps |
| 14:15 | Error rate begins climbing | - |
| 14:30 | Alert fired: Error rate > 1% | Alerting |
| 14:32 | On-call acknowledged | Engineer A |
| 14:35 | Checked dashboards, confirmed spike | Engineer A |
| 14:37 | Decision: Rollback | Engineer A + Manager |
| 14:37 | Executed rollback: Set percentage to 0 | Engineer A |
| 14:40 | Verified V2 traffic dropped | Engineer A |
| 14:45 | Stopped V2 services | Engineer A |
| 14:50 | Cleared CDN cache | Engineer A |
| 15:00 | Verified V1 stability | Engineer A |
| 15:15 | Notified stakeholders | Manager |

---

## Root Cause

### What Went Wrong

[Detailed technical explanation of the root cause]

**Example**:
The V2 authentication service had a race condition in the token 
refresh logic. When multiple API calls were made simultaneously 
(common on page load), they would all trigger token refresh in 
parallel. Firebase has a rate limit of 1 refresh per 5 seconds 
per user. Excess requests would fail with "auth/too-many-requests",
causing the frontend to logout users.

This wasn't caught in staging because:
1. Manual testing was sequential (no parallel requests)
2. Load testing used different user accounts (no single user spike)
3. The 5-second Firebase rate limit wasn't documented

### Why Detection Took X Minutes

[If there was delay in detection]

### Why Rollback Took X Minutes

[If there was delay in rollback]

---

## Impact

### User Impact

- **Total users affected**: 500
- **Percentage of user base**: 5%
- **Most affected regions**: [if applicable]
- **Peak concurrency during incident**: [if known]

### Business Impact

- **Support tickets created**: 23
- **Support time spent**: ~4 hours
- **Revenue impact**: $0 (no failed transactions)
- **Reputation impact**: Low (quick resolution)

### Technical Impact

- **Services affected**: Auth V2, API Gateway
- **Data loss**: None
- **Data inconsistency**: None

---

## What Went Well

✅ **Fast detection**: Alert fired within 5 minutes of deployment  
✅ **Clear procedure**: Team followed documented rollback steps  
✅ **Quick rollback**: Completed in 5 minutes (target: < 10 min)  
✅ **Effective communication**: All stakeholders notified promptly  
✅ **No data loss**: All user data remained intact

---

## What Could Be Improved

### Technical

⚠️ **Testing**: Load testing should cover parallel requests  
⚠️ **Monitoring**: Add Firebase rate limit monitoring  
⚠️ **Token refresh**: Implement request deduplication  
⚠️ **Documentation**: Document Firebase API limits

### Process

⚠️ **Staging duration**: V2 only in staging 24 hours (too short)  
⚠️ **Rollout speed**: 25% too aggressive after 5% phase  
⚠️ **Alert tuning**: Error rate alert should fire at 0.5%, not 1%

---

## Action Items

| ID | Action | Owner | Status | Due Date |
|----|--------|-------|--------|----------|
| 1 | Implement token refresh mutex | Engineer A | In Progress | Oct 10 |
| 2 | Add load test for parallel requests | QA Lead | Not Started | Oct 12 |
| 3 | Document Firebase API limits | Tech Writer | In Progress | Oct 8 |
| 4 | Add Firebase quota monitoring | DevOps | Not Started | Oct 15 |
| 5 | Update rollout strategy (conservative) | Manager | Done | Oct 5 |
| 6 | Tune error rate alert (0.5% threshold) | DevOps | Done | Oct 5 |

---

## Lessons Learned

1. **Load testing must simulate real user behavior**: Sequential 
   testing missed parallel request race condition.

2. **Third-party API limits are critical**: Firebase rate limits 
   weren't documented or considered in design.

3. **Gradual rollout worked as intended**: 25% rollout prevented 
   95% of users from being affected.

4. **Clear runbook enabled fast recovery**: Documented rollback 
   procedure saved valuable time.

5. **Monitoring caught issue quickly**: Error rate alert fired 
   within 5 minutes, before user complaints.

---

## Follow-up

- **Root cause fix implemented**: Oct 10 (target)
- **Staging validation**: Oct 11-15 (5 days minimum)
- **Re-deployment date**: Oct 16 (tentative)
- **Re-deployment strategy**: Start at 0.1% for 48 hours

---

**Reviewers**:
- [ ] Engineering Manager
- [ ] Product Manager
- [ ] DevOps Lead
- [ ] QA Lead

**Published**: [Date]
**Location**: docs/postmortems/2025-10-04-auth-v2-rollback.md
```

---

## 📞 Emergency Contacts

### Escalation Path

| Level | Role | Contact | Response Time |
|-------|------|---------|---------------|
| L1 | On-Call Engineer | Slack @oncall-eng | < 5 min |
| L2 | Engineering Manager | +1-xxx-xxx-xxxx | < 15 min |
| L3 | VP Engineering | +1-xxx-xxx-xxxx | < 30 min |
| L4 | CTO | +1-xxx-xxx-xxxx | < 1 hour |

### External Contacts

| Service | Contact | Use Case |
|---------|---------|----------|
| Firebase Support | [Firebase Console → Support] | Firebase API issues |
| AWS Support | [AWS Console → Support] | Infrastructure issues |
| Cloudflare Support | support@cloudflare.com | CDN/DNS issues |

---

**End of Rollback Playbook**  
**Version**: 1.0  
**Last Updated**: 2025-10-04

**Related Docs**:  
- [Deployment Runbook](./DEPLOYMENT_RUNBOOK.md)  
- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)  
- [Monitoring Setup](./MONITORING_SETUP.md)  
- [Architecture Documentation](./AUTH_V2_ARCHITECTURE.md)

**Practice Rollback**: Schedule quarterly rollback drills to ensure 
team familiarity with procedures. Next drill: [Date TBD]
