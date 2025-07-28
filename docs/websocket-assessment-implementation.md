# WebSocket Assessment Implementation

## Overview

Implementasi WebSocket untuk assessment system menggantikan polling mechanism dengan real-time notifications untuk meringankan beban server dan mempercepat response time.

## Architecture

### Flow Diagram
```
Client                    WebSocket Server              Assessment API
  |                            |                            |
  |-- Submit Assessment -------|--------------------------> |
  |<-- JobID + WebSocket URL --|                            |
  |                            |                            |
  |-- Connect WebSocket -----> |                            |
  |<-- Authentication ---------|                            |
  |-- Subscribe to JobID ----> |                            |
  |                            |                            |
  |                            |<-- Assessment Events ----- |
  |<-- Real-time Updates ------|                            |
  |                            |                            |
  |<-- Assessment Complete ----|                            |
  |-- Redirect to Results ---> |                            |
```

### Components

1. **WebSocket Assessment Service** (`services/websocket-assessment.ts`)
   - Manages WebSocket connection
   - Handles authentication
   - Provides event subscription/unsubscription
   - Automatic reconnection logic

2. **Assessment WebSocket Hook** (`hooks/useAssessmentWebSocket.ts`)
   - React hook for WebSocket integration
   - State management for connection status
   - Error handling and fallback logic

3. **Enhanced Assessment Workflow** (`utils/assessment-workflow.ts`)
   - WebSocket-first approach with polling fallback
   - Real-time status updates
   - Improved user experience

4. **Updated Loading Page** (`app/assessment-loading/page.tsx`)
   - Real-time connection status indicator
   - WebSocket vs Polling mode display
   - Faster result redirection

## WebSocket Events

### Client to Server
```typescript
// Authentication
{
  event: 'authenticate',
  data: { token: 'jwt_token' }
}

// Subscribe to job updates
{
  event: 'subscribe-assessment',
  data: { jobId: 'job_123' }
}

// Unsubscribe from job updates
{
  event: 'unsubscribe-assessment',
  data: { jobId: 'job_123' }
}
```

### Server to Client
```typescript
// Authentication success
{
  event: 'authenticated'
}

// Authentication failure
{
  event: 'auth-error',
  data: { message: 'Invalid token' }
}

// Assessment status updates
{
  event: 'assessment-update',
  data: {
    type: 'assessment-queued' | 'assessment-processing' | 'assessment-completed' | 'assessment-failed',
    jobId: 'job_123',
    data: {
      status: 'processing',
      progress: 75,
      message: 'Analyzing personality traits...',
      resultId?: 'result_456', // Only for completed
      error?: 'Processing failed', // Only for failed
      queuePosition?: 3,
      estimatedTime?: 120
    }
  }
}
```

## Configuration

### Environment Variables
```env
# WebSocket URLs
NEXT_PUBLIC_WS_URL_DEV=ws://localhost:3001
NEXT_PUBLIC_WS_URL_PROD=wss://api.chhrone.web.id

# WebSocket Settings
NEXT_PUBLIC_WS_RECONNECTION_ATTEMPTS=5
NEXT_PUBLIC_WS_RECONNECTION_DELAY=1000
NEXT_PUBLIC_WS_TIMEOUT=30000
```

### WebSocket Server Requirements
- Support for Socket.IO protocol
- JWT authentication
- Room-based subscriptions (by jobId)
- Integration with assessment processing pipeline

## Usage Examples

### Basic WebSocket Usage
```typescript
import { useAssessmentWebSocket } from '../hooks/useAssessmentWebSocket';

function AssessmentComponent() {
  const webSocket = useAssessmentWebSocket({
    autoConnect: true,
    onAssessmentUpdate: (event) => {
      console.log('Assessment update:', event);
      if (event.type === 'assessment-completed') {
        router.push(`/results/${event.data.resultId}`);
      }
    },
    onError: (error) => {
      console.warn('WebSocket error, falling back to polling:', error);
    }
  });

  return (
    <div>
      <p>WebSocket Status: {webSocket.isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Authenticated: {webSocket.isAuthenticated ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### Assessment Workflow with WebSocket (Now Default)
```typescript
import { useAssessmentWorkflow } from '../hooks/useAssessmentWorkflow';

function AssessmentSubmission() {
  const workflow = useAssessmentWorkflow({
    // WebSocket is now mandatory by default - no need to specify preferWebSocket
    onComplete: (result) => {
      router.push(`/results/${result.id}`);
    },
    onError: (error) => {
      console.error('Assessment failed:', error);
    }
  });

  const handleSubmit = async (answers) => {
    await workflow.submitFromAnswers(answers);
  };

  return (
    <div>
      <p>Status: {workflow.state.status}</p>
      <p>Progress: {workflow.state.progress}%</p>
      <p>Connection: {workflow.state.useWebSocket ? 'WebSocket' : 'Polling'}</p>
      {workflow.state.webSocketConnected && (
        <p>✅ Real-time updates active</p>
      )}
    </div>
  );
}
```

## Benefits

### Performance Improvements
- **Reduced Server Load**: Eliminates continuous polling requests
- **Faster Response Time**: Real-time notifications vs polling intervals
- **Better Scalability**: WebSocket connections are more efficient than HTTP polling
- **Reduced Bandwidth**: Only sends updates when status changes

### User Experience
- **Instant Updates**: No delay waiting for next poll
- **Real-time Progress**: Live progress updates during processing
- **Faster Redirects**: Immediate notification when assessment completes
- **Connection Status**: Visual feedback about connection type and status

### Technical Benefits
- **Fallback Mechanism**: Automatic fallback to polling if WebSocket fails
- **Reconnection Logic**: Automatic reconnection on connection loss
- **Error Handling**: Graceful degradation when WebSocket is unavailable
- **Authentication**: Secure WebSocket connections with JWT tokens

## Fallback Strategy

1. **WebSocket First**: Try WebSocket connection when preferred
2. **Graceful Degradation**: Fall back to polling if WebSocket fails
3. **Transparent Switching**: User experience remains consistent
4. **Error Recovery**: Automatic retry and reconnection logic

## Testing

### Local Development
1. Start WebSocket server on `ws://localhost:3001`
2. Enable WebSocket in assessment workflow
3. Submit assessment and verify real-time updates
4. Test fallback by stopping WebSocket server

### Production Testing
1. Verify WebSocket server at `wss://api.chhrone.web.id`
2. Test authentication with production JWT tokens
3. Monitor connection stability and reconnection
4. Validate fallback mechanism in production

## Monitoring

### Metrics to Track
- WebSocket connection success rate
- Average connection time
- Reconnection frequency
- Fallback usage percentage
- Assessment completion time (WebSocket vs Polling)

### Logging
- Connection attempts and results
- Authentication success/failure
- Event subscription/unsubscription
- Error conditions and fallbacks
- Performance metrics

## Future Enhancements

1. **Connection Pooling**: Optimize WebSocket connections
2. **Message Queuing**: Handle offline scenarios
3. **Compression**: Reduce message size for better performance
4. **Clustering**: Support for multiple WebSocket servers
5. **Analytics**: Real-time analytics dashboard
6. **Push Notifications**: Browser notifications for completed assessments
