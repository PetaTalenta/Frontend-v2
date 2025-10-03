/**
 * WebSocket Connection Debugger
 * 
 * Open browser console and run these commands to test WebSocket connection:
 * 
 * 1. Check if NotificationRedirectListener is loaded:
 *    - Look for log: "🔌 Initializing WebSocket connection to notification service..."
 * 
 * 2. Check WebSocket connection status:
 *    - Look for log: "✅ WebSocket connected to notification service"
 *    - Look for log: "✅ WebSocket authenticated successfully"
 * 
 * 3. Simulate analysis-complete event (paste in console):
 */

// Paste this in browser console to simulate analysis-complete event
function simulateAnalysisComplete() {
  // This simulates what the backend would send
  const mockEvent = {
    type: 'analysis-complete',
    status: 'berhasil',
    result_id: 'test-result-' + Date.now(),
    assessment_name: 'Test Assessment',
    timestamp: new Date().toISOString()
  };
  
  console.log('🧪 Simulating analysis-complete event:', mockEvent);
  
  // Create a custom event to trigger the redirect logic
  window.dispatchEvent(new CustomEvent('test-analysis-complete', {
    detail: mockEvent
  }));
  
  return mockEvent;
}

// Check current WebSocket status
function checkWebSocketStatus() {
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
  
  console.log('🔍 WebSocket Debug Info:');
  console.log('- Has auth token:', !!token);
  console.log('- Current pathname:', window.location.pathname);
  console.log('- User agent:', navigator.userAgent);
  
  return {
    hasToken: !!token,
    pathname: window.location.pathname,
  };
}

// Manual WebSocket connection test
async function testWebSocketConnection() {
  console.log('🧪 Testing WebSocket connection...');
  
  const { io } = await import('socket.io-client');
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
  
  if (!token) {
    console.error('❌ No auth token found!');
    return;
  }
  
  const socket = io('https://api.futureguide.id', {
    autoConnect: false,
    transports: ['websocket', 'polling']
  });
  
  socket.on('connect', () => {
    console.log('✅ Test socket connected');
    socket.emit('authenticate', { token });
  });
  
  socket.on('authenticated', (data) => {
    console.log('✅ Test socket authenticated:', data);
  });
  
  socket.on('auth_error', (error) => {
    console.error('❌ Test socket auth error:', error);
  });
  
  socket.on('analysis-started', (data) => {
    console.log('📊 Test socket received analysis-started:', data);
  });
  
  socket.on('analysis-complete', (data) => {
    console.log('🎉 Test socket received analysis-complete:', data);
  });
  
  socket.on('analysis-failed', (data) => {
    console.error('❌ Test socket received analysis-failed:', data);
  });
  
  socket.connect();
  
  console.log('⏳ Socket connecting... Check logs above for status');
  
  return socket;
}

// Export for use in console
if (typeof window !== 'undefined') {
  (window as any).simulateAnalysisComplete = simulateAnalysisComplete;
  (window as any).checkWebSocketStatus = checkWebSocketStatus;
  (window as any).testWebSocketConnection = testWebSocketConnection;
  
  console.log(`
📋 WebSocket Debug Commands Available:
  
1. checkWebSocketStatus()
   - Check current connection status
   
2. testWebSocketConnection()
   - Test a new WebSocket connection
   
3. simulateAnalysisComplete()
   - Simulate an analysis-complete event
   
Example:
  testWebSocketConnection()
  `);
}

export { simulateAnalysisComplete, checkWebSocketStatus, testWebSocketConnection };
