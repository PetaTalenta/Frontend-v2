# WebSocket Assessment Testing Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install socket.io-client
```

### 2. Environment Setup
Create or update your `.env.local` file:
```env
# WebSocket Configuration
NEXT_PUBLIC_WS_URL_DEV=ws://localhost:3001
NEXT_PUBLIC_WS_URL_PROD=wss://api.chhrone.web.id
```

### 3. Test WebSocket Implementation

#### Option A: Use the Example Component
1. Copy `examples/websocket-assessment-example.tsx` to your pages or components
2. Navigate to the example page
3. Test WebSocket connection and assessment submission

#### Option B: Enable in Existing Assessment Flow
1. Update your assessment loading page to use WebSocket:
```typescript
const workflow = useAssessmentWorkflow({
  preferWebSocket: true, // Enable WebSocket
  onComplete: (result) => {
    router.push(`/results/${result.id}`);
  }
});
```

## Testing Scenarios

### 1. WebSocket Connection Test
```typescript
import { useAssessmentWebSocket } from '../hooks/useAssessmentWebSocket';

function TestConnection() {
  const webSocket = useAssessmentWebSocket({
    autoConnect: true,
    onConnected: () => console.log('✅ Connected'),
    onError: (error) => console.log('❌ Error:', error),
  });

  return (
    <div>
      <p>Status: {webSocket.isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Authenticated: {webSocket.isAuthenticated ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### 2. Assessment Submission Test
```typescript
import { useAssessmentWorkflow } from '../hooks/useAssessmentWorkflow';

function TestAssessment() {
  const workflow = useAssessmentWorkflow({
    preferWebSocket: true,
    onComplete: (result) => {
      console.log('Assessment completed:', result.id);
    }
  });

  const testAnswers = {
    1: 4, 2: 3, 3: 5, 4: 2, 5: 4,
    // Add more test answers...
  };

  const handleSubmit = () => {
    workflow.submitFromAnswers(testAnswers);
  };

  return (
    <div>
      <button onClick={handleSubmit}>Submit Test Assessment</button>
      <p>Status: {workflow.state.status}</p>
      <p>Progress: {workflow.state.progress}%</p>
      <p>Connection: {workflow.state.useWebSocket ? 'WebSocket' : 'Polling'}</p>
    </div>
  );
}
```

### 3. Fallback Mechanism Test
To test the fallback from WebSocket to polling:

1. **Start with WebSocket enabled**
2. **Simulate WebSocket failure** (disconnect network or stop WebSocket server)
3. **Verify automatic fallback** to polling mechanism
4. **Check user experience** remains smooth

## Mock WebSocket Server

For local testing without a real WebSocket server, create a mock server:

```javascript
// mock-websocket-server.js
const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle authentication
  socket.on('authenticate', (data) => {
    console.log('Authentication request:', data);
    // Simulate authentication
    setTimeout(() => {
      socket.emit('authenticated');
    }, 1000);
  });

  // Handle assessment subscription
  socket.on('subscribe-assessment', (data) => {
    console.log('Subscribing to job:', data.jobId);
    
    // Simulate assessment progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      
      if (progress <= 100) {
        socket.emit('assessment-update', {
          type: progress === 100 ? 'assessment-completed' : 'assessment-processing',
          jobId: data.jobId,
          data: {
            status: progress === 100 ? 'completed' : 'processing',
            progress: progress,
            message: progress === 100 ? 'Assessment completed!' : `Processing... ${progress}%`,
            resultId: progress === 100 ? 'result_' + Date.now() : undefined
          }
        });
      }
      
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 2000);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(3001, () => {
  console.log('Mock WebSocket server running on port 3001');
});
```

Run the mock server:
```bash
node mock-websocket-server.js
```

## Testing Checklist

### ✅ Basic Functionality
- [ ] WebSocket connection establishes successfully
- [ ] Authentication works with JWT token
- [ ] Assessment submission returns jobId
- [ ] Real-time updates are received
- [ ] Assessment completion triggers redirect
- [ ] Error handling works properly

### ✅ Fallback Mechanism
- [ ] WebSocket failure triggers polling fallback
- [ ] User experience remains consistent
- [ ] No data loss during fallback
- [ ] Proper error messages displayed

### ✅ Performance
- [ ] WebSocket connection is faster than polling
- [ ] Real-time updates are immediate
- [ ] No unnecessary reconnections
- [ ] Memory usage is reasonable

### ✅ Edge Cases
- [ ] Network disconnection handling
- [ ] Server restart recovery
- [ ] Multiple tab behavior
- [ ] Authentication token expiry
- [ ] Concurrent assessment submissions

## Debugging

### Enable Debug Logging
Add to your component:
```typescript
useEffect(() => {
  // Enable WebSocket debugging
  localStorage.setItem('debug', 'socket.io-client:*');
}, []);
```

### Common Issues

1. **WebSocket Connection Fails**
   - Check WebSocket server is running
   - Verify URL configuration
   - Check CORS settings
   - Validate authentication token

2. **No Real-time Updates**
   - Verify job subscription
   - Check server-side event emission
   - Validate event payload structure
   - Check client-side event listeners

3. **Fallback Not Working**
   - Verify polling mechanism still works
   - Check error handling logic
   - Validate fallback triggers
   - Test timeout scenarios

### Browser Developer Tools
1. **Network Tab**: Check WebSocket connection status
2. **Console**: Monitor WebSocket events and errors
3. **Application Tab**: Check localStorage for debug info

## Production Deployment

### Pre-deployment Checklist
- [ ] WebSocket server is deployed and accessible
- [ ] SSL/TLS certificates are configured for WSS
- [ ] Environment variables are set correctly
- [ ] CORS settings allow your domain
- [ ] Authentication integration is working
- [ ] Monitoring and logging are configured

### Monitoring
Monitor these metrics in production:
- WebSocket connection success rate
- Average connection time
- Reconnection frequency
- Fallback usage percentage
- Assessment completion time comparison

## Performance Comparison

### Before (Polling)
- Request every 2-5 seconds
- Higher server load
- Delayed notifications
- More bandwidth usage

### After (WebSocket)
- Real-time updates
- Lower server load
- Instant notifications
- Reduced bandwidth usage

### Expected Improvements
- 50-70% reduction in server requests
- 2-5x faster notification delivery
- Better user experience
- Improved scalability
