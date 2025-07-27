# WebSocket Implementation - Updated to API Documentation

This document describes the updated WebSocket implementation that follows the official API documentation.

## Overview

The WebSocket implementation has been updated to match the official API documentation:
- **WebSocket URL**: `https://api.chhrone.web.id`
- **Protocol**: Socket.IO v4.7.2
- **Authentication**: JWT Token Required
- **Events**: `analysis-started`, `analysis-complete`, `analysis-failed`

## Key Changes Made

### 1. URL Updates
- **Production URL**: Changed from `wss://api.chhrone.web.id` to `https://api.chhrone.web.id`
- **Development URL**: Remains `ws://localhost:3002` for mock server

### 2. Event Name Changes
- `assessment-queued` → `analysis-started`
- `assessment-completed` → `analysis-complete`
- `assessment-failed` → `analysis-failed`
- `auth-error` → `auth_error`

### 3. Event Data Structure
Updated to match API documentation format:

```typescript
interface NotificationData {
  jobId?: string;
  resultId?: string; // For completed events
  status?: string;
  message?: string;
  error?: string; // For failed events
  metadata?: {
    assessmentName?: string;
    estimatedProcessingTime?: string;
    processingTime?: string;
    errorType?: string;
  };
  timestamp?: string;
}
```

### 4. Authentication Flow
- Connect to WebSocket server
- Emit `authenticate` event with JWT token within 10 seconds
- Listen for `authenticated` (success) or `auth_error` (failure)
- User is joined to room `user:{userId}` for personal notifications

## Files Updated

### 1. `services/websocket-assessment.ts`
- Updated event types and data structures
- Changed production URL
- Fixed authentication event names
- Updated event listeners to match API documentation

### 2. `services/notificationService.js`
- Updated connection URL logic
- Added `analysis-started` event support
- Updated event handlers

### 3. `mock-websocket-server.js`
- Updated event names and data structures for development testing
- Fixed deprecated `substr` method
- Simplified event emission to match API documentation

### 4. New Files Created
- `hooks/useNotifications.ts` - React hook following API documentation
- `components/NotificationDemo.tsx` - Demo component showing usage
- `docs/websocket-implementation.md` - This documentation

## Usage Examples

### Basic React Hook Usage

```typescript
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { token } = useAuth();
  const { connected, authenticated, notifications } = useNotifications(token);

  return (
    <div>
      <div>Connected: {connected ? 'Yes' : 'No'}</div>
      <div>Authenticated: {authenticated ? 'Yes' : 'No'}</div>
      {notifications.map(notification => (
        <div key={notification.id}>
          {notification.message}
        </div>
      ))}
    </div>
  );
};
```

### Using the Assessment WebSocket Service

```typescript
import { getAssessmentWebSocketService } from '../services/websocket-assessment';

const service = getAssessmentWebSocketService();

// Connect and authenticate
await service.connect(token);

// Subscribe to job updates
service.subscribeToJob(jobId);

// Listen for events
service.setCallbacks({
  onAssessmentEvent: (event) => {
    switch (event.type) {
      case 'analysis-started':
        console.log('Analysis started:', event.message);
        break;
      case 'analysis-complete':
        console.log('Analysis completed:', event.resultId);
        break;
      case 'analysis-failed':
        console.error('Analysis failed:', event.error);
        break;
    }
  }
});
```

## Event Types

### analysis-started
Emitted when an analysis job begins processing.

```json
{
  "jobId": "uuid",
  "status": "started",
  "message": "Your analysis has started processing...",
  "metadata": {
    "assessmentName": "Assessment Name",
    "estimatedProcessingTime": "5-10 minutes"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### analysis-complete
Emitted when an analysis job completes successfully.

```json
{
  "jobId": "uuid",
  "resultId": "uuid",
  "status": "completed",
  "message": "Your analysis is ready!",
  "metadata": {
    "assessmentName": "Assessment Name",
    "processingTime": "7 minutes"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### analysis-failed
Emitted when an analysis job fails.

```json
{
  "jobId": "uuid",
  "error": "Error message",
  "message": "Analysis failed. Please try again.",
  "metadata": {
    "assessmentName": "Assessment Name",
    "errorType": "PROCESSING_ERROR"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Testing

### Development Server
Run the mock WebSocket server for development:
```bash
npm run start:websocket
```

### Full Development Environment
Run both the Next.js app and WebSocket server:
```bash
npm run dev:full
```

## Migration Notes

If you're using the old WebSocket implementation:

1. Update event listeners from `assessment-*` to `analysis-*`
2. Update data structure access (no more nested `data` object)
3. Update authentication error handling (`auth-error` → `auth_error`)
4. Update production URL if hardcoded anywhere

## Troubleshooting

### Connection Issues
- Ensure the correct URL is being used
- Check that JWT token is valid and not expired
- Verify authentication happens within 10 seconds of connection

### Event Not Received
- Check that you're listening for the correct event names
- Verify authentication was successful
- Check browser console for WebSocket errors

### Development Issues
- Ensure mock WebSocket server is running on port 3002
- Check that events are being emitted in the correct format
