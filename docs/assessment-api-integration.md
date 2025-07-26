# Assessment API Integration

This document describes the integration with the Assessment Service API for AI-driven talent mapping assessments.

## Overview

The Assessment Service provides AI-driven analysis of personality assessments using RIASEC, OCEAN, and VIA-IS frameworks. The integration includes:

- Real API integration with fallback to mock API
- Automatic polling for assessment status
- Queue monitoring and management
- Token balance integration
- Comprehensive error handling

## API Endpoints

Base URL: `https://api.chhrone.web.id/api/assessment`

### Available Endpoints

1. **POST /api/assessment/submit** - Submit assessment for analysis
2. **GET /api/assessment/status/:jobId** - Get job processing status
3. **GET /api/assessment/queue/status** - Get queue information
4. **GET /api/assessment/health** - Service health check
5. **GET /api/assessment/idempotency/health** - Idempotency service health
6. **POST /api/assessment/idempotency/cleanup** - Cleanup idempotency cache

## Usage Examples

### Basic Assessment Submission

```typescript
import { submitAssessment } from '../services/enhanced-assessment-api';
import { AssessmentScores } from '../types/assessment-results';

const scores: AssessmentScores = {
  riasec: {
    realistic: 75,
    investigative: 80,
    artistic: 65,
    social: 70,
    enterprising: 85,
    conventional: 60
  },
  ocean: {
    openness: 80,
    conscientiousness: 75,
    extraversion: 70,
    agreeableness: 85,
    neuroticism: 40
  },
  viaIs: {
    creativity: 80,
    curiosity: 85,
    // ... all 24 VIA-IS strengths
  }
};

try {
  const response = await submitAssessment(scores, 'AI-Driven Talent Mapping');
  console.log('Job ID:', response.data.jobId);
  console.log('Queue Position:', response.data.queuePosition);
} catch (error) {
  console.error('Submission failed:', error);
}
```

### Using React Hook

```typescript
import { useAssessmentWorkflow } from '../hooks/useAssessmentWorkflow';

function AssessmentComponent() {
  const {
    state,
    isProcessing,
    isCompleted,
    result,
    submitFromAnswers,
    cancel,
    reset
  } = useAssessmentWorkflow({
    onComplete: (result) => {
      console.log('Assessment completed:', result);
    },
    onError: (error) => {
      console.error('Assessment failed:', error);
    }
  });

  const handleSubmit = async () => {
    const answers = { /* user answers */ };
    await submitFromAnswers(answers);
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : 'Submit Assessment'}
      </button>
      
      {isProcessing && (
        <div>
          <p>Status: {state.message}</p>
          <p>Progress: {state.progress}%</p>
          {state.estimatedTimeRemaining && (
            <p>Time remaining: {state.estimatedTimeRemaining}</p>
          )}
        </div>
      )}
      
      {isCompleted && result && (
        <div>
          <h3>Assessment Complete!</h3>
          <p>Persona: {result.persona_profile.title}</p>
        </div>
      )}
    </div>
  );
}
```

### Status Monitoring Component

```typescript
import AssessmentStatusMonitor from '../components/assessment/AssessmentStatusMonitor';

function AssessmentPage() {
  const { state, submitFromAnswers } = useAssessmentWorkflow();

  return (
    <div>
      <AssessmentStatusMonitor 
        workflowState={state}
        showQueueInfo={true}
        onRefresh={() => window.location.reload()}
      />
    </div>
  );
}
```

## Workflow States

The assessment workflow goes through these states:

1. **idle** - Ready to submit assessment
2. **validating** - Validating user answers
3. **submitting** - Submitting to API
4. **queued** - Waiting in processing queue
5. **processing** - Being analyzed by AI
6. **completed** - Analysis complete
7. **failed** - Processing failed
8. **cancelled** - User cancelled

## Error Handling

The integration handles various error scenarios:

- **401 Unauthorized** - Authentication token invalid
- **402 Payment Required** - Insufficient tokens
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Service unavailable
- **Network Errors** - Automatic fallback to mock API

## Token Management

The system automatically:
- Deducts tokens on successful submission
- Shows token balance updates
- Handles insufficient token scenarios
- Provides token cost information

## Queue Management

Features include:
- Real-time queue position tracking
- Estimated wait time calculation
- Average processing time display
- Service availability monitoring

## Configuration

### Polling Configuration

```typescript
const POLLING_CONFIG = {
  INITIAL_DELAY: 2000,     // 2 seconds
  MAX_DELAY: 30000,        // 30 seconds
  MAX_ATTEMPTS: 60,        // 30 minutes max
  BACKOFF_MULTIPLIER: 1.5, // Exponential backoff
};
```

### API Endpoints

```typescript
const ASSESSMENT_ENDPOINTS = {
  SUBMIT: '/api/assessment/submit',
  STATUS: (jobId: string) => `/api/assessment/status/${jobId}`,
  QUEUE_STATUS: '/api/assessment/queue/status',
  HEALTH: '/api/assessment/health',
  // ...
};
```

## Testing

### Mock API Fallback

When the real API is unavailable, the system automatically falls back to mock API endpoints that simulate the same behavior with local processing.

### Health Checks

```typescript
import { checkAssessmentHealth, isAssessmentServiceAvailable } from '../services/enhanced-assessment-api';

// Check if service is available
const isAvailable = await isAssessmentServiceAvailable();

// Get detailed health information
const health = await checkAssessmentHealth();
console.log('Service status:', health.status);
console.log('Dependencies:', health.dependencies);
```

## Best Practices

1. **Always handle errors gracefully** - The API may be unavailable
2. **Show progress to users** - Assessment processing can take time
3. **Implement cancellation** - Allow users to cancel long-running operations
4. **Monitor token balance** - Warn users before they run out of tokens
5. **Use polling judiciously** - Don't overwhelm the API with requests
6. **Cache results** - Store completed assessments locally

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Ensure valid JWT token is present
   - Check token expiration
   - Verify user permissions

2. **Submission Failures**
   - Validate all required fields
   - Check token balance
   - Verify network connectivity

3. **Polling Timeouts**
   - Increase MAX_ATTEMPTS if needed
   - Check service health
   - Monitor queue status

### Debug Logging

Enable detailed logging by checking browser console for messages prefixed with:
- `Enhanced Assessment API:`
- `Assessment Workflow:`
- `AssessmentAPI:`

## Migration from Mock API

To migrate existing code from mock API to real API:

1. Replace `assessment-api.ts` imports with `enhanced-assessment-api.ts`
2. Update components to use `useAssessmentWorkflow` hook
3. Add status monitoring components
4. Handle new error scenarios
5. Test with both real and mock APIs

The enhanced API maintains backward compatibility while adding new features.
