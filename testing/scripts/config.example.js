/**
 * Example Configuration for Assessment Testing Scripts
 * Copy this file and update with your actual test credentials
 */

// Configuration for quick-token-test.js
const QUICK_TEST_CONFIG = {
  proxyUrl: 'http://localhost:3000/api/proxy',
  timeout: 30000,
  
  // Update with your test user credentials
  testUser: {
    email: 'test.token@example.com',
    password: 'TestPassword123!'
  }
};

// Configuration for concurrent-assessment-test.js
const CONCURRENT_TEST_CONFIG = {
  baseUrl: 'https://api.futureguide.id',
  proxyUrl: 'http://localhost:3000/api/proxy',
  concurrentAssessments: 3, // Number of simultaneous assessments
  testTimeout: 300000, // 5 minutes total timeout
  authTimeout: 10000, // 10 seconds for authentication
  assessmentTimeout: 120000, // 2 minutes per assessment
  
  // Update with your test user credentials
  testUser: {
    email: 'test.concurrent@example.com',
    password: 'TestPassword123!'
  }
};

// Configuration for setup-test-users.js
const SETUP_USERS_CONFIG = {
  proxyUrl: 'http://localhost:3000/api/proxy',
  timeout: 30000,
  
  // Number of test users to create
  userCount: 5,
  
  // Base test user data
  baseUser: {
    name: 'Test User',
    password: 'TestPassword123!',
    school: 'Test University'
  }
};

// Configuration for run-concurrent-tests.js
const HIGH_LOAD_CONFIG = {
  // Number of concurrent test instances to run
  testInstances: 2,
  
  // Delay between starting test instances (ms)
  startDelay: 1000,
  
  // Timeout for each test instance (ms)
  timeout: 10 * 60 * 1000, // 10 minutes
};

// Environment variables
const ENV_CONFIG = {
  // Set to 'true' to enable cleanup of test users after testing
  CLEANUP_TEST_USERS: 'false',
  
  // Custom timeout for assessments (ms)
  ASSESSMENT_TIMEOUT: '300000',
  
  // Enable debug logging
  DEBUG: 'false'
};

module.exports = {
  QUICK_TEST_CONFIG,
  CONCURRENT_TEST_CONFIG,
  SETUP_USERS_CONFIG,
  HIGH_LOAD_CONFIG,
  ENV_CONFIG
};
