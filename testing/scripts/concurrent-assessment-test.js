/**
 * Concurrent Assessment Testing Script
 * Tests multiple assessment submissions simultaneously to verify:
 * 1. Token deduction system works correctly (only 1 token per assessment)
 * 2. Backend properly handles concurrent requests
 * 3. No race conditions in token management
 * 4. Assessment processing works under load
 * 
 * Usage: node scripts/concurrent-assessment-test.js
 */

const { io } = require('socket.io-client');
const axios = require('axios');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'https://api.chhrone.web.id',
  proxyUrl: 'http://localhost:3000/api/proxy',
  concurrentAssessments: 3, // Number of simultaneous assessments
  testTimeout: 300000, // 5 minutes total timeout
  authTimeout: 10000, // 10 seconds for authentication
  assessmentTimeout: 120000, // 2 minutes per assessment
  
  // Test user credentials (replace with actual test account)
  testUser: {
    email: 'test.concurrent@example.com',
    password: 'TestPassword123!'
  }
};

class ConcurrentAssessmentTest {
  constructor() {
    this.token = null;
    this.userId = null;
    this.initialTokenBalance = null;
    this.finalTokenBalance = null;
    this.assessmentResults = [];
    this.errors = [];
    this.startTime = Date.now();
    this.sockets = [];
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString();
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log(`[${timestamp}] [+${elapsed}s] ${message}`);
    if (data) {
      console.log('  Data:', JSON.stringify(data, null, 2));
    }
  }

  error(message, error = null) {
    const timestamp = new Date().toISOString();
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.error(`[${timestamp}] [+${elapsed}s] ❌ ${message}`);
    if (error) {
      console.error('  Error:', error.message || error);
      this.errors.push({ message, error: error.message || error, timestamp });
    }
  }

  success(message, data = null) {
    const timestamp = new Date().toISOString();
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log(`[${timestamp}] [+${elapsed}s] ✅ ${message}`);
    if (data) {
      console.log('  Data:', JSON.stringify(data, null, 2));
    }
  }

  async run() {
    try {
      this.log('🧪 Starting Concurrent Assessment Test');
      this.log(`📊 Configuration: ${TEST_CONFIG.concurrentAssessments} concurrent assessments`);
      
      // Step 1: Authenticate
      await this.authenticate();
      
      // Step 2: Get initial token balance
      await this.getInitialTokenBalance();
      
      // Step 3: Verify sufficient tokens
      this.verifyTokenSufficiency();
      
      // Step 4: Run concurrent assessments
      await this.runConcurrentAssessments();
      
      // Step 5: Get final token balance
      await this.getFinalTokenBalance();
      
      // Step 6: Verify token deduction
      this.verifyTokenDeduction();
      
      // Step 7: Generate report
      this.generateReport();
      
      this.success('🎉 Concurrent Assessment Test completed successfully');
      
    } catch (error) {
      this.error('❌ Concurrent Assessment Test failed', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async authenticate() {
    this.log('🔐 Authenticating test user...');
    
    try {
      const response = await axios.post(`${TEST_CONFIG.proxyUrl}/auth/login`, {
        email: TEST_CONFIG.testUser.email,
        password: TEST_CONFIG.testUser.password
      }, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.data.token) {
        this.token = response.data.data.token;
        this.userId = response.data.data.user.id;
        this.success('Authentication successful', {
          userId: this.userId,
          email: response.data.data.user.email
        });
      } else {
        throw new Error('Authentication failed: ' + (response.data.error?.message || 'Unknown error'));
      }
    } catch (error) {
      this.error('Authentication failed', error);
      throw error;
    }
  }

  async getInitialTokenBalance() {
    this.log('💰 Getting initial token balance...');
    
    try {
      const response = await axios.get(`${TEST_CONFIG.proxyUrl}/auth/token-balance`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      if (response.data.success && response.data.data) {
        // Handle different possible response formats
        this.initialTokenBalance = response.data.data.tokenBalance || 
                                  response.data.data.balance || 
                                  response.data.data.user?.token_balance;
        
        this.success('Initial token balance retrieved', {
          balance: this.initialTokenBalance
        });
      } else {
        throw new Error('Failed to get token balance: ' + (response.data.error?.message || 'Unknown error'));
      }
    } catch (error) {
      this.error('Failed to get initial token balance', error);
      throw error;
    }
  }

  verifyTokenSufficiency() {
    this.log('🔍 Verifying token sufficiency...');
    
    const requiredTokens = TEST_CONFIG.concurrentAssessments * 1; // 1 token per assessment
    
    if (this.initialTokenBalance < requiredTokens) {
      throw new Error(`Insufficient tokens. Required: ${requiredTokens}, Available: ${this.initialTokenBalance}`);
    }
    
    this.success('Token sufficiency verified', {
      available: this.initialTokenBalance,
      required: requiredTokens,
      remaining: this.initialTokenBalance - requiredTokens
    });
  }

  async runConcurrentAssessments() {
    this.log(`🚀 Starting ${TEST_CONFIG.concurrentAssessments} concurrent assessments...`);
    
    // Create assessment promises
    const assessmentPromises = [];
    
    for (let i = 0; i < TEST_CONFIG.concurrentAssessments; i++) {
      const assessmentPromise = this.runSingleAssessment(i + 1);
      assessmentPromises.push(assessmentPromise);
      
      // Small delay between starts to simulate real-world scenario
      if (i < TEST_CONFIG.concurrentAssessments - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Wait for all assessments to complete
    this.log('⏳ Waiting for all assessments to complete...');
    const results = await Promise.allSettled(assessmentPromises);
    
    // Process results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.assessmentResults.push(result.value);
        this.success(`Assessment ${index + 1} completed`, result.value);
      } else {
        this.error(`Assessment ${index + 1} failed`, result.reason);
      }
    });
    
    this.log(`📊 Assessment completion summary: ${this.assessmentResults.length}/${TEST_CONFIG.concurrentAssessments} successful`);
  }

  async runSingleAssessment(assessmentNumber) {
    const startTime = Date.now();
    this.log(`📝 Starting Assessment ${assessmentNumber}...`);
    
    try {
      // Generate test assessment data
      const assessmentData = this.generateAssessmentData(assessmentNumber);
      
      // Submit assessment
      const submitResponse = await axios.post(`${TEST_CONFIG.proxyUrl}/assessment`, {
        assessmentName: `Concurrent Test Assessment ${assessmentNumber}`,
        riasec: assessmentData.riasec,
        ocean: assessmentData.ocean,
        viaIs: assessmentData.viaIs
      }, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (!submitResponse.data.success) {
        throw new Error(`Assessment ${assessmentNumber} submission failed: ` + 
                       (submitResponse.data.error?.message || 'Unknown error'));
      }

      const jobId = submitResponse.data.data.jobId;
      this.log(`📋 Assessment ${assessmentNumber} submitted`, { jobId });

      // Wait for completion via WebSocket
      const result = await this.waitForAssessmentCompletion(jobId, assessmentNumber);
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      return {
        assessmentNumber,
        jobId,
        resultId: result.resultId,
        duration: `${duration}s`,
        status: 'completed'
      };
      
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.error(`Assessment ${assessmentNumber} failed after ${duration}s`, error);
      throw error;
    }
  }

  generateAssessmentData(assessmentNumber) {
    // Generate varied but valid assessment data
    const base = assessmentNumber * 10;
    
    return {
      riasec: {
        realistic: 60 + (base % 30),
        investigative: 70 + (base % 25),
        artistic: 65 + (base % 20),
        social: 75 + (base % 15),
        enterprising: 80 + (base % 10),
        conventional: 55 + (base % 35)
      },
      ocean: {
        openness: 70 + (base % 25),
        conscientiousness: 75 + (base % 20),
        extraversion: 65 + (base % 30),
        agreeableness: 80 + (base % 15),
        neuroticism: 40 + (base % 25)
      },
      viaIs: {
        creativity: 75 + (base % 20),
        curiosity: 80 + (base % 15),
        judgment: 70 + (base % 25),
        love_of_learning: 85 + (base % 10),
        perspective: 65 + (base % 30)
      }
    };
  }

  async waitForAssessmentCompletion(jobId, assessmentNumber) {
    return new Promise((resolve, reject) => {
      const socket = io(TEST_CONFIG.baseUrl, {
        autoConnect: false,
        transports: ['websocket', 'polling']
      });

      this.sockets.push(socket);

      const timeout = setTimeout(() => {
        this.error(`Assessment ${assessmentNumber} timeout`);
        socket.close();
        reject(new Error(`Assessment ${assessmentNumber} completion timeout`));
      }, TEST_CONFIG.assessmentTimeout);

      socket.on('connect', () => {
        this.log(`🔗 WebSocket connected for Assessment ${assessmentNumber}`);
        
        // Authenticate
        socket.emit('authenticate', { token: this.token });
      });

      socket.on('authenticated', () => {
        this.log(`🔐 WebSocket authenticated for Assessment ${assessmentNumber}`);
        
        // Subscribe to job updates
        socket.emit('subscribe-assessment', { jobId });
      });

      socket.on('analysis-complete', (data) => {
        if (data.jobId === jobId) {
          this.log(`✅ Assessment ${assessmentNumber} completed via WebSocket`, data);
          clearTimeout(timeout);
          socket.close();
          resolve({
            jobId: data.jobId,
            resultId: data.resultId,
            message: data.message
          });
        }
      });

      socket.on('analysis-failed', (data) => {
        if (data.jobId === jobId) {
          this.error(`Assessment ${assessmentNumber} failed via WebSocket`, data);
          clearTimeout(timeout);
          socket.close();
          reject(new Error(`Assessment ${assessmentNumber} failed: ${data.error}`));
        }
      });

      socket.on('connect_error', (error) => {
        this.error(`WebSocket connection error for Assessment ${assessmentNumber}`, error);
        clearTimeout(timeout);
        reject(error);
      });

      socket.on('auth_error', (error) => {
        this.error(`WebSocket auth error for Assessment ${assessmentNumber}`, error);
        clearTimeout(timeout);
        socket.close();
        reject(new Error(`WebSocket authentication failed: ${error.message}`));
      });

      socket.connect();
    });
  }

  async getFinalTokenBalance() {
    this.log('💰 Getting final token balance...');

    try {
      // Add small delay to ensure backend has processed all token deductions
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await axios.get(`${TEST_CONFIG.proxyUrl}/auth/token-balance`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      if (response.data.success && response.data.data) {
        this.finalTokenBalance = response.data.data.tokenBalance ||
                                response.data.data.balance ||
                                response.data.data.user?.token_balance;

        this.success('Final token balance retrieved', {
          balance: this.finalTokenBalance
        });
      } else {
        throw new Error('Failed to get final token balance: ' + (response.data.error?.message || 'Unknown error'));
      }
    } catch (error) {
      this.error('Failed to get final token balance', error);
      throw error;
    }
  }

  verifyTokenDeduction() {
    this.log('🔍 Verifying token deduction...');

    const expectedDeduction = this.assessmentResults.length * 1; // 1 token per successful assessment
    const actualDeduction = this.initialTokenBalance - this.finalTokenBalance;

    const verification = {
      initialBalance: this.initialTokenBalance,
      finalBalance: this.finalTokenBalance,
      expectedDeduction,
      actualDeduction,
      successfulAssessments: this.assessmentResults.length,
      isCorrect: expectedDeduction === actualDeduction
    };

    if (verification.isCorrect) {
      this.success('✅ Token deduction is CORRECT', verification);
    } else {
      this.error('❌ Token deduction is INCORRECT', verification);
      throw new Error(`Token deduction mismatch. Expected: ${expectedDeduction}, Actual: ${actualDeduction}`);
    }
  }

  generateReport() {
    this.log('📊 Generating test report...');

    const totalDuration = ((Date.now() - this.startTime) / 1000).toFixed(2);

    const report = {
      testSummary: {
        totalDuration: `${totalDuration}s`,
        concurrentAssessments: TEST_CONFIG.concurrentAssessments,
        successfulAssessments: this.assessmentResults.length,
        failedAssessments: TEST_CONFIG.concurrentAssessments - this.assessmentResults.length,
        successRate: `${((this.assessmentResults.length / TEST_CONFIG.concurrentAssessments) * 100).toFixed(1)}%`
      },
      tokenVerification: {
        initialBalance: this.initialTokenBalance,
        finalBalance: this.finalTokenBalance,
        expectedDeduction: this.assessmentResults.length * 1,
        actualDeduction: this.initialTokenBalance - this.finalTokenBalance,
        deductionCorrect: (this.initialTokenBalance - this.finalTokenBalance) === (this.assessmentResults.length * 1)
      },
      assessmentResults: this.assessmentResults,
      errors: this.errors
    };

    console.log('\n' + '='.repeat(80));
    console.log('📋 CONCURRENT ASSESSMENT TEST REPORT');
    console.log('='.repeat(80));
    console.log(JSON.stringify(report, null, 2));
    console.log('='.repeat(80));

    // Save report to file
    const fs = require('fs');
    const reportPath = `./test-reports/concurrent-assessment-${Date.now()}.json`;

    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync('./test-reports')) {
        fs.mkdirSync('./test-reports', { recursive: true });
      }

      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.success(`Report saved to ${reportPath}`);
    } catch (error) {
      this.error('Failed to save report', error);
    }
  }

  async cleanup() {
    this.log('🧹 Cleaning up resources...');

    try {
      // Close all WebSocket connections
      this.sockets.forEach(socket => {
        if (socket && socket.connected) {
          socket.close();
        }
      });

      this.log('✅ Cleanup completed');
    } catch (error) {
      this.error('Cleanup error (non-critical)', error);
    }
  }
}

// Helper function to validate environment
function validateEnvironment() {
  console.log('🔍 Validating test environment...');

  // Check if required modules are available
  try {
    require('socket.io-client');
    require('axios');
    console.log('✅ Required modules available');
  } catch (error) {
    console.error('❌ Missing required modules:', error.message);
    console.error('Please run: npm install socket.io-client axios');
    process.exit(1);
  }

  // Check test configuration
  if (!TEST_CONFIG.testUser.email || !TEST_CONFIG.testUser.password) {
    console.error('❌ Test user credentials not configured');
    console.error('Please update TEST_CONFIG.testUser in the script with valid test account credentials');
    process.exit(1);
  }

  console.log('✅ Environment validation passed');
}

// Main execution
if (require.main === module) {
  validateEnvironment();

  const test = new ConcurrentAssessmentTest();

  // Handle process termination
  process.on('SIGINT', async () => {
    console.log('\n🛑 Test interrupted by user');
    await test.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Test terminated');
    await test.cleanup();
    process.exit(0);
  });

  // Run the test
  test.run()
    .then(() => {
      console.log('\n🎉 Concurrent Assessment Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Concurrent Assessment Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = ConcurrentAssessmentTest;
