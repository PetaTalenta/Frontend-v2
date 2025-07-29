/**
 * Test script for WebSocket connection following API documentation
 * Tests connection to https://api.chhrone.web.id with proper event handling
 * Run with: node testing/scripts/test-websocket-api.js
 */

const { io } = require('socket.io-client');

// Test configuration following API documentation
const TEST_CONFIG = {
  url: 'https://api.chhrone.web.id',
  token: 'your-actual-jwt-token-here', // Replace with real token for testing
  timeout: 15000,
  authTimeout: 10000 // Authentication must happen within 10 seconds
};

console.log('🧪 Testing WebSocket Connection (API Documentation)...');
console.log(`📡 Connecting to: ${TEST_CONFIG.url}`);
console.log('📋 Following Socket.IO v4.7.2 protocol');

// Create socket connection following API documentation
const socket = io(TEST_CONFIG.url, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

// Test timeout
const testTimeout = setTimeout(() => {
  console.error('❌ Test timeout - connection took too long');
  socket.close();
  process.exit(1);
}, TEST_CONFIG.timeout);

// Authentication timeout (as per API docs)
let authTimeout;

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log(`🔗 Socket ID: ${socket.id}`);
  
  // Start authentication timeout
  authTimeout = setTimeout(() => {
    console.error('❌ Authentication timeout - must authenticate within 10 seconds');
    socket.close();
    process.exit(1);
  }, TEST_CONFIG.authTimeout);
  
  // Authenticate with JWT token (as per API documentation)
  console.log('🔐 Authenticating with JWT token...');
  socket.emit('authenticate', {
    token: TEST_CONFIG.token
  });
});

socket.on('disconnect', (reason) => {
  console.log(`❌ Disconnected: ${reason}`);
  if (authTimeout) clearTimeout(authTimeout);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  clearTimeout(testTimeout);
  if (authTimeout) clearTimeout(authTimeout);
  process.exit(1);
});

// Authentication events (as per API documentation)
socket.on('authenticated', (data) => {
  console.log('✅ Authentication successful:', data);
  // Expected format: { success: true, userId: "uuid", email: "user@example.com" }
  
  if (authTimeout) clearTimeout(authTimeout);
  
  console.log('📋 User joined to personal notification room: user:' + data.userId);
  console.log('🎧 Listening for analysis events...');
  
  // In real application, analysis events would be triggered by actual analysis jobs
  console.log('💡 To test events, trigger an analysis from the frontend application');
});

socket.on('auth_error', (error) => {
  console.error('❌ Authentication failed:', error);
  // Expected format: { message: "Token required" | "Authentication timeout" | "Invalid token" }
  
  if (authTimeout) clearTimeout(authTimeout);
  clearTimeout(testTimeout);
  socket.close();
  process.exit(1);
});

// Analysis events (as per API documentation)
socket.on('analysis-started', (data) => {
  console.log('🔄 Analysis started:', data);
  // Expected format:
  // {
  //   "jobId": "uuid",
  //   "status": "started",
  //   "message": "Your analysis has started processing...",
  //   "metadata": {
  //     "assessmentName": "Assessment Name",
  //     "estimatedProcessingTime": "5-10 minutes"
  //   },
  //   "timestamp": "2024-01-01T12:00:00.000Z"
  // }
});

socket.on('analysis-complete', (data) => {
  console.log('✅ Analysis completed:', data);
  // Expected format:
  // {
  //   "jobId": "uuid",
  //   "resultId": "uuid",
  //   "status": "completed",
  //   "message": "Your analysis is ready!",
  //   "metadata": {
  //     "assessmentName": "Assessment Name",
  //     "processingTime": "7 minutes"
  //   },
  //   "timestamp": "2024-01-01T12:00:00.000Z"
  // }
  
  console.log('🎉 WebSocket test completed successfully!');
  console.log(`📊 Result ID: ${data.resultId}`);
  
  clearTimeout(testTimeout);
  socket.close();
  process.exit(0);
});

socket.on('analysis-failed', (data) => {
  console.log('❌ Analysis failed:', data);
  // Expected format:
  // {
  //   "jobId": "uuid",
  //   "error": "Error message",
  //   "message": "Analysis failed. Please try again.",
  //   "metadata": {
  //     "assessmentName": "Assessment Name",
  //     "errorType": "PROCESSING_ERROR"
  //   },
  //   "timestamp": "2024-01-01T12:00:00.000Z"
  // }
});

// Error events
socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

// Start the test
console.log('🚀 Starting WebSocket test...');
console.log('⚠️  Make sure to replace the token with a valid JWT token');
socket.connect();

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  clearTimeout(testTimeout);
  if (authTimeout) clearTimeout(authTimeout);
  socket.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test terminated');
  clearTimeout(testTimeout);
  if (authTimeout) clearTimeout(authTimeout);
  socket.close();
  process.exit(0);
});
