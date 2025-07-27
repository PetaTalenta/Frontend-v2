/**
 * Test script for WebSocket connection
 * Run with: node scripts/test-websocket.js
 */

const { io } = require('socket.io-client');

// Test configuration - Updated to match API documentation
const TEST_CONFIG = {
  url: 'https://api.chhrone.web.id', // Production API URL as per documentation
  token: 'test-jwt-token-123', // Mock token for testing
  timeout: 15000 // Increased timeout for production API
};

console.log('🧪 Testing WebSocket Connection...');
console.log(`📡 Connecting to: ${TEST_CONFIG.url}`);

// Create socket connection
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

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log(`🔗 Socket ID: ${socket.id}`);
  
  // Authenticate
  console.log('🔐 Authenticating...');
  socket.emit('authenticate', { token: TEST_CONFIG.token });
});

socket.on('disconnect', (reason) => {
  console.log(`❌ Disconnected: ${reason}`);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  clearTimeout(testTimeout);
  process.exit(1);
});

// Authentication events
socket.on('authenticated', (data) => {
  console.log('✅ Authentication successful:', data);

  // According to API documentation, after authentication user is automatically
  // joined to room 'user:{userId}' for personal notifications
  // No need to manually subscribe to specific jobs
  console.log('📋 User joined to personal notification room');

  // Simulate analysis events for testing (in real app, these come from server)
  setTimeout(() => {
    console.log('🔄 Simulating analysis-started event...');
    // This would normally come from the server
  }, 1000);
});

socket.on('auth_error', (error) => {
  console.error('❌ Authentication failed:', error);
  clearTimeout(testTimeout);
  socket.close();
  process.exit(1);
});

// Analysis events
socket.on('analysis-started', (data) => {
  console.log('🔄 Analysis started:', data);
});

socket.on('analysis-complete', (data) => {
  console.log('✅ Analysis completed:', data);
  
  // Test completed successfully
  console.log('🎉 WebSocket test completed successfully!');
  clearTimeout(testTimeout);
  socket.close();
  process.exit(0);
});

socket.on('analysis-failed', (data) => {
  console.log('❌ Analysis failed:', data);
});

// Error events
socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

// Start the test
console.log('🚀 Starting WebSocket test...');
socket.connect();

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  clearTimeout(testTimeout);
  socket.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test terminated');
  clearTimeout(testTimeout);
  socket.close();
  process.exit(0);
});
