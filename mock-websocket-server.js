/**
 * Mock WebSocket Server for Testing Assessment WebSocket Implementation
 * Run this server for local development and testing
 */

const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true, // Allow Engine.IO v3 clients
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

console.log('🚀 Starting Mock WebSocket Server...');

// Store active jobs for simulation
const activeJobs = new Map();

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id, 'from:', socket.handshake.address);
  console.log('   Transport:', socket.conn.transport.name);
  console.log('   Headers:', socket.handshake.headers.origin || 'No origin header');

  // Handle authentication - Immediate response for faster connection
  socket.on('authenticate', (data) => {
    console.log('🔐 Authentication request from:', socket.id);
    console.log('Token received:', data.token ? 'Yes' : 'No');

    // Respond immediately without any delay for faster authentication
    setImmediate(() => {
      if (data.token) {
        socket.authenticated = true;
        socket.emit('authenticated');
        console.log('✅ Client authenticated:', socket.id);
      } else {
        socket.emit('auth-error', { message: 'Invalid or missing token' });
        console.log('❌ Authentication failed:', socket.id);
      }
    });
  });

  // Handle assessment subscription
  socket.on('subscribe-assessment', (data) => {
    if (!socket.authenticated) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { jobId } = data;
    console.log('📋 Subscribing to assessment job:', jobId);

    // Check if job is already running
    if (activeJobs.has(jobId)) {
      console.log('⚠️ Job already running, joining existing room:', jobId);
      socket.join(`job_${jobId}`);
      console.log('✅ Joined existing job room:', jobId);
      return;
    }

    // Join room for this job
    socket.join(`job_${jobId}`);

    // Start simulating assessment progress
    simulateAssessmentProgress(jobId, socket);

    console.log('✅ Subscribed to new job:', jobId);
  });

  // Handle unsubscribe
  socket.on('unsubscribe-assessment', (data) => {
    const { jobId } = data;
    console.log('📤 Unsubscribing from assessment job:', jobId);
    socket.leave(`job_${jobId}`);

    // Stop simulation for this job
    if (activeJobs.has(jobId)) {
      clearInterval(activeJobs.get(jobId));
      activeJobs.delete(jobId);
    }
  });

  // Handle token balance subscription
  socket.on('subscribe-token-balance', () => {
    if (!socket.authenticated) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    console.log('💰 Subscribing to token balance updates:', socket.id);
    socket.join('token_updates');

    // Send initial token balance
    const initialBalance = Math.floor(Math.random() * 20) + 5; // Random balance between 5-25
    socket.emit('token-balance-update', { balance: initialBalance });

    // Simulate token balance changes every 60 seconds (for testing)
    if (!socket.tokenBalanceInterval) {
      socket.tokenBalanceInterval = setInterval(() => {
        if (socket.authenticated && socket.rooms.has('token_updates')) {
          const newBalance = Math.max(0, Math.floor(Math.random() * 30)); // Random balance 0-30
          console.log('💰 Sending token balance update:', newBalance, 'to', socket.id);
          socket.emit('token-balance-update', { balance: newBalance });
        }
      }, 60000); // Every 60 seconds for testing
    }
  });

  // Handle token balance unsubscribe
  socket.on('unsubscribe-token-balance', () => {
    console.log('💸 Unsubscribing from token balance updates:', socket.id);
    socket.leave('token_updates');

    if (socket.tokenBalanceInterval) {
      clearInterval(socket.tokenBalanceInterval);
      socket.tokenBalanceInterval = null;
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);

    // Clean up token balance interval
    if (socket.tokenBalanceInterval) {
      clearInterval(socket.tokenBalanceInterval);
      socket.tokenBalanceInterval = null;
    }
  });

  socket.on('error', (error) => {
    console.error('🔥 Socket error:', error);
  });
});

function simulateAssessmentProgress(jobId, socket) {
  // Don't start if already running
  if (activeJobs.has(jobId)) {
    console.log('⚠️ Job already running:', jobId);
    return;
  }

  console.log('⚙️ Starting assessment simulation for job:', jobId);
  
  let progress = 0;
  const steps = [
    { progress: 10, status: 'started', message: 'Your analysis has started processing...', type: 'analysis-started' },
    { progress: 25, status: 'processing', message: 'Analyzing RIASEC personality traits...', type: 'analysis-processing' },
    { progress: 45, status: 'processing', message: 'Evaluating Big Five personality dimensions...', type: 'analysis-processing' },
    { progress: 65, status: 'processing', message: 'Processing VIA Character Strengths...', type: 'analysis-processing' },
    { progress: 80, status: 'processing', message: 'Generating personality insights...', type: 'analysis-processing' },
    { progress: 95, status: 'processing', message: 'Creating career recommendations...', type: 'analysis-processing' },
    { progress: 100, status: 'completed', message: 'Your analysis is ready!', type: 'analysis-complete' }
  ];

  let stepIndex = 0;
  
  const interval = setInterval(() => {
    if (stepIndex >= steps.length) {
      clearInterval(interval);
      activeJobs.delete(jobId);
      return;
    }

    const step = steps[stepIndex];

    // Create event data matching API documentation format
    const eventData = {
      jobId: jobId,
      status: step.status,
      message: step.message,
      metadata: {
        assessmentName: "Personality Assessment",
        estimatedProcessingTime: step.progress < 100 ? "5-10 minutes" : undefined,
        processingTime: step.progress === 100 ? "7 minutes" : undefined
      },
      timestamp: new Date().toISOString()
    };

    // Add resultId for completed events
    if (step.progress === 100) {
      eventData.resultId = `result_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    // Emit specific event type based on step
    let eventName;
    if (step.type === 'analysis-started') {
      eventName = 'analysis-started';
    } else if (step.type === 'analysis-complete') {
      eventName = 'analysis-complete';
    } else {
      // Skip intermediate processing steps for now
      stepIndex++;
      return;
    }

    // Emit to all clients subscribed to this job
    io.to(`job_${jobId}`).emit(eventName, eventData);

    console.log(`📊 Job ${jobId} - ${eventName}: ${step.message}`);

    stepIndex++;
  }, 500); // Update every 500ms for faster testing

  activeJobs.set(jobId, interval);
}

// Handle server shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Mock WebSocket Server...');
  
  // Clear all active jobs
  activeJobs.forEach((interval) => {
    clearInterval(interval);
  });
  activeJobs.clear();
  
  // Close server
  server.close(() => {
    console.log('✅ Mock WebSocket Server stopped');
    process.exit(0);
  });
});

const PORT = process.env.WS_PORT || 3002;

server.listen(PORT, () => {
  console.log(`🎯 Mock WebSocket Server running on port ${PORT}`);
  console.log(`📡 WebSocket URL: ws://localhost:${PORT}`);
  console.log('🔧 CORS enabled for: http://localhost:3000, http://localhost:3001, http://localhost:3002');
  console.log('\n📋 Available events:');
  console.log('  - authenticate: { token: "your-jwt-token" }');
  console.log('  - subscribe-assessment: { jobId: "job-id" }');
  console.log('  - unsubscribe-assessment: { jobId: "job-id" }');
  console.log('  - subscribe-token-balance: (no data required)');
  console.log('  - unsubscribe-token-balance: (no data required)');
  console.log('\n🎮 To test:');
  console.log('  1. Start your Next.js app: npm run dev');
  console.log('  2. Navigate to assessment loading page');
  console.log('  3. Submit an assessment to see real-time updates');
  console.log('  4. Token balance updates will be sent automatically every 60 seconds');
  console.log('\n⚠️  Press Ctrl+C to stop the server');
});

// Error handling
server.on('error', (error) => {
  console.error('🔥 Server error:', error);
});

io.on('error', (error) => {
  console.error('🔥 Socket.IO error:', error);
});
