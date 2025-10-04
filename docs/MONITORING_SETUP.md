# Auth V2 Monitoring & Alerting Setup

**Version**: 1.0  
**Last Updated**: 2025-10-04  
**Audience**: DevOps, Platform Engineering

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Key Metrics to Monitor](#key-metrics-to-monitor)
3. [Grafana Dashboard Setup](#grafana-dashboard-setup)
4. [Alert Configuration](#alert-configuration)
5. [Log Aggregation](#log-aggregation)
6. [Cost Monitoring](#cost-monitoring)
7. [Real-time Monitoring](#real-time-monitoring)
8. [Performance Monitoring](#performance-monitoring)

---

## 📊 Overview

### Monitoring Goals

- **Availability**: Track login success rates (target: > 99.9%)
- **Performance**: Monitor latency (target: p95 < 500ms)
- **Reliability**: Detect errors early (alert if error rate > 0.5%)
- **Cost**: Track Firebase usage to prevent bill surprises
- **User Experience**: Monitor real user metrics (session duration, bounce rate)

### Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Frontend   │────▶│  API Gateway │────▶│   Backend   │
│  (Next.js)  │     │  (Port 3000) │     │ (Auth V1/V2)│
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                    │
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────┐
│          Monitoring Stack (Grafana/Prometheus)      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Metrics │  │   Logs   │  │  Traces (APM)    │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
       │                    │                    │
       └────────────────────┴────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  Alerting    │
                    │ (PagerDuty)  │
                    └──────────────┘
```

---

## 📈 Key Metrics to Monitor

### 1. Authentication Metrics

#### Login Success Rate
```prometheus
# Total logins (success + failure)
sum(rate(auth_login_total[5m])) by (auth_version)

# Success rate
sum(rate(auth_login_total{status="success"}[5m])) by (auth_version) /
sum(rate(auth_login_total[5m])) by (auth_version) * 100
```

**Targets**:
- ✅ Success rate > 99% (good)
- ⚠️ Success rate 95-99% (investigate)
- 🚨 Success rate < 95% (critical)

#### Registration Success Rate
```prometheus
sum(rate(auth_registration_total{status="success"}[5m])) by (auth_version) /
sum(rate(auth_registration_total[5m])) by (auth_version) * 100
```

#### Token Refresh Rate
```prometheus
# Refresh requests per second
rate(auth_token_refresh_total[5m])

# Refresh success rate
sum(rate(auth_token_refresh_total{status="success"}[5m])) /
sum(rate(auth_token_refresh_total[5m])) * 100
```

**Alert**: Refresh success rate < 98%

#### Password Reset Rate
```prometheus
# Reset emails sent
rate(auth_password_reset_email_sent[5m])

# Reset completions
rate(auth_password_reset_completed[5m])

# Completion rate (users who actually reset)
sum(auth_password_reset_completed) /
sum(auth_password_reset_email_sent) * 100
```

### 2. Performance Metrics

#### API Latency
```prometheus
# P50 latency
histogram_quantile(0.5, rate(http_request_duration_seconds_bucket{path=~"/api/auth/v2/.*"}[5m]))

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{path=~"/api/auth/v2/.*"}[5m]))

# P99 latency
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{path=~"/api/auth/v2/.*"}[5m]))
```

**Targets**:
- P50 < 200ms
- P95 < 500ms
- P99 < 1000ms

#### Firebase Auth Latency
```prometheus
# Time spent calling Firebase API
histogram_quantile(0.95, rate(firebase_auth_duration_seconds_bucket[5m]))
```

#### Token Refresh Latency
```prometheus
histogram_quantile(0.95, rate(auth_token_refresh_duration_seconds_bucket[5m]))
```

### 3. Error Metrics

#### Error Rate by Code
```prometheus
# Errors per second by error code
sum(rate(auth_errors_total[5m])) by (error_code)

# Top 5 error codes
topk(5, sum(rate(auth_errors_total[5m])) by (error_code))
```

**Common Codes**:
- `auth/wrong-password`: User error (monitor for brute force)
- `auth/user-not-found`: User error or migration issue
- `auth/too-many-requests`: Rate limiting (check threshold)
- `auth/network-request-failed`: Infrastructure issue

#### Error Rate Comparison (V1 vs V2)
```prometheus
# V2 error rate
sum(rate(auth_errors_total{auth_version="v2"}[5m])) /
sum(rate(auth_requests_total{auth_version="v2"}[5m])) * 100

# V1 error rate (for comparison)
sum(rate(auth_errors_total{auth_version="v1"}[5m])) /
sum(rate(auth_requests_total{auth_version="v1"}[5m])) * 100
```

**Alert**: V2 error rate > V1 error rate + 0.5%

### 4. Traffic Metrics

#### Requests per Second
```prometheus
# Total RPS
sum(rate(http_requests_total{path=~"/api/auth/.*"}[1m]))

# RPS by auth version
sum(rate(http_requests_total[1m])) by (auth_version)

# RPS by endpoint
sum(rate(http_requests_total[1m])) by (path)
```

#### V2 Adoption Rate
```prometheus
# Percentage of requests using V2
sum(rate(http_requests_total{auth_version="v2"}[5m])) /
sum(rate(http_requests_total[5m])) * 100
```

**Expected Values** (during gradual rollout):
- Phase 1: ~1%
- Phase 2: ~5%
- Phase 3: ~10%
- Phase 7: 100%

#### Active Sessions
```prometheus
# Current active sessions (gauge)
auth_active_sessions

# By auth version
auth_active_sessions by (auth_version)
```

### 5. Business Metrics

#### Daily Active Users (DAU)
```sql
SELECT 
  DATE(login_timestamp) as date,
  auth_version,
  COUNT(DISTINCT user_id) as dau
FROM auth_events
WHERE event_type = 'login'
  AND login_timestamp >= NOW() - INTERVAL '30 days'
GROUP BY date, auth_version
ORDER BY date DESC;
```

#### Login Frequency
```sql
SELECT 
  user_id,
  COUNT(*) as login_count,
  MIN(login_timestamp) as first_login,
  MAX(login_timestamp) as last_login
FROM auth_events
WHERE event_type = 'login'
  AND login_timestamp >= NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY login_count DESC
LIMIT 100;
```

#### Session Duration
```sql
SELECT 
  AVG(logout_timestamp - login_timestamp) as avg_session_duration,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY logout_timestamp - login_timestamp) as p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY logout_timestamp - login_timestamp) as p95
FROM auth_events
WHERE event_type = 'logout'
  AND logout_timestamp >= NOW() - INTERVAL '24 hours';
```

---

## 📊 Grafana Dashboard Setup

### Installation

```bash
# Option 1: Docker
docker run -d \
  -p 3001:3000 \
  --name=grafana \
  -e "GF_SECURITY_ADMIN_PASSWORD=admin" \
  -v grafana-storage:/var/lib/grafana \
  grafana/grafana

# Option 2: Kubernetes (Helm)
helm repo add grafana https://grafana.github.io/helm-charts
helm install grafana grafana/grafana \
  --set persistence.enabled=true \
  --set adminPassword=admin

# Access: http://localhost:3001
# Login: admin / admin
```

### Data Source Configuration

#### Prometheus
```yaml
# In Grafana UI: Configuration → Data Sources → Add Prometheus
Name: Prometheus
Type: Prometheus
URL: http://prometheus:9090
Access: Server (default)
Scrape interval: 15s
Query timeout: 60s
```

#### PostgreSQL (for business metrics)
```yaml
# Configuration → Data Sources → Add PostgreSQL
Name: Auth Database
Host: db.futureguide.id:5432
Database: auth_production
User: grafana_readonly
Password: <from secrets>
SSL Mode: require
```

### Dashboard Creation

#### Dashboard 1: Auth V2 Overview

**Panels**:

1. **Login Success Rate** (Gauge)
```prometheus
sum(rate(auth_login_total{status="success", auth_version="v2"}[5m])) /
sum(rate(auth_login_total{auth_version="v2"}[5m])) * 100
```
- Thresholds: Red < 95%, Yellow 95-99%, Green > 99%

2. **Requests Per Second** (Graph)
```prometheus
sum(rate(http_requests_total{path=~"/api/auth/v2/.*"}[1m]))
```

3. **P95 Latency** (Graph)
```prometheus
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{path=~"/api/auth/v2/.*"}[5m])) * 1000
```
- Unit: milliseconds
- Y-axis max: 2000ms

4. **Error Rate** (Graph)
```prometheus
sum(rate(auth_errors_total{auth_version="v2"}[5m])) /
sum(rate(auth_requests_total{auth_version="v2"}[5m])) * 100
```

5. **V2 Adoption** (Stat + Gauge)
```prometheus
sum(rate(http_requests_total{auth_version="v2"}[5m])) /
sum(rate(http_requests_total[5m])) * 100
```

6. **Top Error Codes** (Table)
```prometheus
topk(10, sum(rate(auth_errors_total{auth_version="v2"}[5m])) by (error_code))
```

7. **Active Sessions** (Stat)
```prometheus
auth_active_sessions{auth_version="v2"}
```

**JSON Export**:
```json
{
  "dashboard": {
    "title": "Auth V2 Overview",
    "tags": ["auth", "v2", "overview"],
    "timezone": "browser",
    "panels": [...],
    "refresh": "30s"
  }
}
```

#### Dashboard 2: V1 vs V2 Comparison

**Panels**:

1. **Success Rate Comparison** (Graph)
```prometheus
# V1
sum(rate(auth_login_total{status="success", auth_version="v1"}[5m])) /
sum(rate(auth_login_total{auth_version="v1"}[5m])) * 100

# V2
sum(rate(auth_login_total{status="success", auth_version="v2"}[5m])) /
sum(rate(auth_login_total{auth_version="v2"}[5m])) * 100
```

2. **Latency Comparison** (Graph)
```prometheus
# V1 P95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{path=~"/api/auth/v1/.*"}[5m])) * 1000

# V2 P95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{path=~"/api/auth/v2/.*"}[5m])) * 1000
```

3. **Traffic Split** (Pie Chart)
```prometheus
# V1
sum(rate(http_requests_total{auth_version="v1"}[5m]))

# V2
sum(rate(http_requests_total{auth_version="v2"}[5m]))
```

#### Dashboard 3: Token Management

**Panels**:

1. **Token Refresh Rate** (Graph)
```prometheus
rate(auth_token_refresh_total[5m])
```

2. **Refresh Success Rate** (Gauge)
```prometheus
sum(rate(auth_token_refresh_total{status="success"}[5m])) /
sum(rate(auth_token_refresh_total[5m])) * 100
```

3. **Refresh Latency** (Graph)
```prometheus
histogram_quantile(0.95, rate(auth_token_refresh_duration_seconds_bucket[5m])) * 1000
```

4. **Token Expiry Distribution** (Heatmap)
```prometheus
rate(auth_token_expiry_bucket[5m])
```

### Import Pre-built Dashboard

```bash
# Download Auth V2 dashboard JSON
curl -O https://raw.githubusercontent.com/futureguide/monitoring/main/dashboards/auth-v2-overview.json

# Import in Grafana UI:
# + → Import → Upload JSON file → Select Prometheus data source → Import
```

---

## 🚨 Alert Configuration

### Alert Manager Setup

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
    - match:
        severity: warning
      receiver: 'slack'

receivers:
  - name: 'default'
    email_configs:
      - to: 'team@futureguide.id'
        from: 'alerts@futureguide.id'
        smarthost: smtp.gmail.com:587
        auth_username: 'alerts@futureguide.id'
        auth_password: '<app_password>'

  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '<pagerduty_service_key>'
        description: '{{ .CommonAnnotations.summary }}'

  - name: 'slack'
    slack_configs:
      - channel: '#auth-alerts'
        title: '{{ .CommonAnnotations.summary }}'
        text: '{{ .CommonAnnotations.description }}'
```

### Alert Rules

#### Critical Alerts (P0)

**1. High Error Rate**
```yaml
- alert: AuthV2HighErrorRate
  expr: |
    (
      sum(rate(auth_errors_total{auth_version="v2"}[5m])) /
      sum(rate(auth_requests_total{auth_version="v2"}[5m]))
    ) * 100 > 1
  for: 5m
  labels:
    severity: critical
    component: auth-v2
  annotations:
    summary: "Auth V2 error rate above 1%"
    description: "Error rate is {{ $value | humanize }}% (threshold: 1%)"
    runbook: "https://docs.futureguide.id/runbooks/high-error-rate"
```

**2. Complete Service Outage**
```yaml
- alert: AuthV2ServiceDown
  expr: up{job="auth-v2-service"} == 0
  for: 1m
  labels:
    severity: critical
    component: auth-v2
  annotations:
    summary: "Auth V2 service is down"
    description: "Service has been down for 1 minute"
    action: "Check service health: kubectl get pods -n auth | grep v2"
```

**3. Firebase API Down**
```yaml
- alert: FirebaseAuthDown
  expr: |
    sum(rate(firebase_auth_errors_total{error_type="connection_failed"}[2m])) > 10
  for: 2m
  labels:
    severity: critical
    component: firebase
  annotations:
    summary: "Firebase Auth API unreachable"
    description: "Cannot connect to Firebase for 2 minutes"
    action: "Check https://status.firebase.google.com/"
```

**4. High Latency**
```yaml
- alert: AuthV2HighLatency
  expr: |
    histogram_quantile(0.95, 
      rate(http_request_duration_seconds_bucket{path=~"/api/auth/v2/.*"}[5m])
    ) > 2
  for: 10m
  labels:
    severity: critical
    component: auth-v2
  annotations:
    summary: "Auth V2 P95 latency above 2s"
    description: "P95 latency is {{ $value | humanize }}s (threshold: 2s)"
```

#### Warning Alerts (P1)

**1. Elevated Error Rate**
```yaml
- alert: AuthV2ElevatedErrorRate
  expr: |
    (
      sum(rate(auth_errors_total{auth_version="v2"}[5m])) /
      sum(rate(auth_requests_total{auth_version="v2"}[5m]))
    ) * 100 > 0.5
  for: 15m
  labels:
    severity: warning
    component: auth-v2
  annotations:
    summary: "Auth V2 error rate above 0.5%"
    description: "Error rate is {{ $value | humanize }}% (threshold: 0.5%)"
```

**2. V2 Worse Than V1**
```yaml
- alert: AuthV2PerformingWorseV1
  expr: |
    (
      sum(rate(auth_errors_total{auth_version="v2"}[5m])) /
      sum(rate(auth_requests_total{auth_version="v2"}[5m]))
    ) - (
      sum(rate(auth_errors_total{auth_version="v1"}[5m])) /
      sum(rate(auth_requests_total{auth_version="v1"}[5m]))
    ) > 0.005
  for: 15m
  labels:
    severity: warning
    component: auth-v2
  annotations:
    summary: "V2 error rate higher than V1"
    description: "V2 has {{ $value | humanizePercentage }} more errors than V1"
    action: "Compare dashboards and investigate root cause"
```

**3. Token Refresh Failures**
```yaml
- alert: AuthV2TokenRefreshFailing
  expr: |
    (
      sum(rate(auth_token_refresh_total{status="failure"}[5m])) /
      sum(rate(auth_token_refresh_total[5m]))
    ) * 100 > 2
  for: 10m
  labels:
    severity: warning
    component: auth-v2
  annotations:
    summary: "Token refresh failure rate above 2%"
    description: "{{ $value | humanize }}% of refresh requests failing"
```

**4. Firebase Quota Warning**
```yaml
- alert: FirebaseQuotaNearLimit
  expr: firebase_auth_quota_used / firebase_auth_quota_limit > 0.8
  for: 1h
  labels:
    severity: warning
    component: firebase
  annotations:
    summary: "Firebase quota at {{ $value | humanizePercentage }}"
    description: "May hit limit within 24 hours. Consider upgrading."
```

### Alert Testing

```bash
# Test alert firing
curl -X POST http://alertmanager:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[
    {
      "labels": {
        "alertname": "AuthV2HighErrorRate",
        "severity": "critical"
      },
      "annotations": {
        "summary": "Test alert"
      }
    }
  ]'

# Verify alert in Slack/PagerDuty
# Check Alertmanager UI: http://alertmanager:9093
```

---

## 📝 Log Aggregation

### Structured Logging Format

```javascript
// Use Winston or Pino for structured logs
const logger = require('winston');

logger.info('V2 login attempt', {
  event: 'auth_login',
  auth_version: 'v2',
  user_id: userId,
  email: email.substring(0, 3) + '***', // Masked
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
  timestamp: new Date().toISOString(),
  duration_ms: 234,
  success: true
});
```

### Log Levels

- **ERROR**: Login failures, API errors, exceptions
- **WARN**: Token expiring soon, rate limit approaching, deprecated endpoints
- **INFO**: Successful login/logout, registration, password reset
- **DEBUG**: Token retrieval, auth version decision, config loading

### ELK Stack Setup (Elasticsearch + Logstash + Kibana)

#### Logstash Configuration

```ruby
# logstash.conf
input {
  file {
    path => "/var/log/auth-v2/*.log"
    start_position => "beginning"
    codec => json
  }
}

filter {
  if [event] == "auth_login" {
    mutate {
      add_tag => ["auth", "login"]
    }
  }
  
  if [auth_version] == "v2" {
    mutate {
      add_tag => ["v2"]
    }
  }
  
  # Extract error codes
  if [error_code] {
    grok {
      match => { "error_code" => "auth/%{WORD:firebase_error}" }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "auth-v2-%{+YYYY.MM.dd}"
  }
  
  # Also output critical errors to Slack
  if "error" in [tags] and [severity] == "critical" {
    slack {
      url => "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
      channel => "#auth-errors"
      username => "Auth V2 Logger"
    }
  }
}
```

### Useful Log Queries

#### Find All Failed Logins
```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "event": "auth_login" }},
        { "match": { "success": false }},
        { "match": { "auth_version": "v2" }}
      ],
      "filter": [
        { "range": { "timestamp": { "gte": "now-1h" }}}
      ]
    }
  }
}
```

#### Count Errors by Type
```json
{
  "size": 0,
  "query": {
    "bool": {
      "must": [
        { "match": { "auth_version": "v2" }},
        { "exists": { "field": "error_code" }}
      ],
      "filter": [
        { "range": { "timestamp": { "gte": "now-24h" }}}
      ]
    }
  },
  "aggs": {
    "errors_by_code": {
      "terms": {
        "field": "error_code.keyword",
        "size": 20
      }
    }
  }
}
```

---

## 💰 Cost Monitoring

### Firebase Auth Pricing

**Free Tier**:
- 50,000 verifications/month
- 10,000 verifications/day
- Phone auth: 10,000/month

**Blaze (Pay-as-you-go)**:
- $0.06 per verification above free tier
- Phone auth: $0.01 per verification

### Cost Tracking Query

```sql
-- Daily Firebase Auth cost estimate
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as total_verifications,
  GREATEST(COUNT(*) - 50000, 0) as billable_verifications,
  GREATEST(COUNT(*) - 50000, 0) * 0.06 as estimated_cost_usd
FROM auth_events
WHERE event_type IN ('login', 'registration', 'token_refresh')
  AND auth_version = 'v2'
  AND timestamp >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY date
ORDER BY date DESC;
```

### Cost Alert

```yaml
- alert: FirebaseCostSpiking
  expr: |
    sum(increase(firebase_auth_verifications_total[1d])) > 100000
  for: 1h
  labels:
    severity: warning
    component: firebase
    cost: true
  annotations:
    summary: "Firebase verifications unusually high"
    description: "{{ $value }} verifications today (normal: ~50k)"
    action: "Check for bot traffic or authentication loop"
```

---

## 🎯 Real-time Monitoring

### WebSocket Dashboard

```javascript
// Real-time auth events dashboard
const socket = io('https://api.futureguide.id/monitoring');

socket.on('auth_event', (data) => {
  console.log('Real-time event:', data);
  // {
  //   event: 'login',
  //   auth_version: 'v2',
  //   success: true,
  //   timestamp: '2025-10-04T10:30:00Z',
  //   latency_ms: 234
  // }
  
  updateDashboard(data);
});

// Subscribe to specific metrics
socket.emit('subscribe', {
  metrics: ['login_rate', 'error_rate', 'latency']
});
```

### Health Check Endpoint

```javascript
// GET /api/health/auth-v2
{
  "status": "healthy",
  "checks": {
    "firebase_connection": "ok",
    "database_connection": "ok",
    "token_refresh": "ok",
    "api_latency": "ok"
  },
  "metrics": {
    "uptime_seconds": 86400,
    "total_requests_24h": 125000,
    "error_rate_24h": 0.12,
    "avg_latency_ms": 189,
    "active_sessions": 3421
  },
  "version": "2.0.1",
  "rollout_percentage": 25
}
```

---

## ⚡ Performance Monitoring

### Frontend Performance (Web Vitals)

```javascript
// Track Core Web Vitals for auth pages
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    page: window.location.pathname,
    auth_version: localStorage.getItem('authVersion')
  });
  
  navigator.sendBeacon('/api/analytics', body);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### API Performance Tracing

```javascript
// Use OpenTelemetry for distributed tracing
const { trace } = require('@opentelemetry/api');

const tracer = trace.getTracer('auth-v2-service');

async function loginWithTracing(email, password) {
  const span = tracer.startSpan('auth.login');
  
  try {
    // Firebase authentication
    const firebaseSpan = tracer.startSpan('firebase.signIn', { parent: span });
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    firebaseSpan.end();
    
    // Token generation
    const tokenSpan = tracer.startSpan('token.generate', { parent: span });
    const idToken = await userCredential.user.getIdToken();
    tokenSpan.end();
    
    span.setStatus({ code: SpanStatusCode.OK });
    return idToken;
  } catch (error) {
    span.setStatus({ 
      code: SpanStatusCode.ERROR,
      message: error.message 
    });
    throw error;
  } finally {
    span.end();
  }
}
```

---

## 📞 On-Call Runbook

### Quick Response Checklist

1. **Acknowledge alert** in PagerDuty (< 5 minutes)
2. **Check dashboards** (Grafana → Auth V2 Overview)
3. **Verify scope** (Affecting all users or specific segment?)
4. **Check Firebase status** (https://status.firebase.google.com/)
5. **Review recent deployments** (Last 24 hours)
6. **Make go/no-go decision** (Fix forward vs rollback)

### Incident Communication Template

```
🚨 INCIDENT: Auth V2 High Error Rate

STATUS: Investigating
SEVERITY: P1 (High)
IMPACT: ~5% of V2 users experiencing login failures
START TIME: 2025-10-04 14:30 UTC
AFFECTED USERS: ~500

TIMELINE:
14:30 - Alert fired (error rate 2.3%)
14:32 - On-call acknowledged
14:35 - Checked dashboards, error spike confirmed
14:40 - Rolling back V2 percentage from 25% to 10%

NEXT UPDATE: 15:00 UTC (or sooner if status changes)

Dashboard: https://grafana.futureguide.id/d/auth-v2
Incident Channel: #incident-auth-v2-2025-10-04
```

---

**End of Monitoring Setup Guide**  
**Version**: 1.0  
**Last Updated**: 2025-10-04

**Related Docs**:  
- [Deployment Runbook](./DEPLOYMENT_RUNBOOK.md)  
- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)  
- [Rollback Playbook](./ROLLBACK_PLAYBOOK.md)
