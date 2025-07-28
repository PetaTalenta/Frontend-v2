/**
 * Setup Test Users for Concurrent Assessment Testing
 * Creates multiple test users with sufficient token balance for testing
 * 
 * Usage: node scripts/setup-test-users.js
 */

const axios = require('axios');

// Configuration
const CONFIG = {
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

class TestUserSetup {
  constructor() {
    this.createdUsers = [];
    this.startTime = Date.now();
  }

  log(message, data = null) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log(`[+${elapsed}s] ${message}`);
    if (data) console.log('  →', JSON.stringify(data, null, 2));
  }

  async run() {
    try {
      console.log('🧪 Setting up test users for concurrent assessment testing');
      console.log('=========================================================');
      
      this.log(`Creating ${CONFIG.userCount} test users...`);
      
      for (let i = 1; i <= CONFIG.userCount; i++) {
        await this.createTestUser(i);
        
        // Small delay between user creation
        if (i < CONFIG.userCount) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Generate summary
      this.generateSummary();
      
      // Save user data to file
      this.saveUserData();
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      throw error;
    }
  }

  async createTestUser(userNumber) {
    const userData = {
      name: `${CONFIG.baseUser.name} ${userNumber}`,
      email: `test.concurrent.${userNumber}@example.com`,
      password: CONFIG.baseUser.password,
      school: CONFIG.baseUser.school
    };

    try {
      this.log(`Creating user ${userNumber}: ${userData.email}`);
      
      // Register user
      const registerResponse = await axios.post(`${CONFIG.proxyUrl}/auth/register`, userData, {
        timeout: CONFIG.timeout,
        headers: { 'Content-Type': 'application/json' }
      });

      if (!registerResponse.data.success) {
        throw new Error(`Registration failed: ${registerResponse.data.error?.message || 'Unknown error'}`);
      }

      const token = registerResponse.data.data.token;
      const userId = registerResponse.data.data.user.id;

      // Get initial token balance
      const balanceResponse = await axios.get(`${CONFIG.proxyUrl}/auth/token-balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: CONFIG.timeout
      });

      let tokenBalance = 0;
      if (balanceResponse.data.success && balanceResponse.data.data) {
        tokenBalance = balanceResponse.data.data.tokenBalance || 
                      balanceResponse.data.data.balance || 
                      balanceResponse.data.data.user?.token_balance || 0;
      }

      const userInfo = {
        userNumber,
        userId,
        email: userData.email,
        password: userData.password,
        token,
        tokenBalance,
        createdAt: new Date().toISOString()
      };

      this.createdUsers.push(userInfo);
      
      this.log(`✅ User ${userNumber} created successfully`, {
        email: userData.email,
        userId,
        tokenBalance
      });

    } catch (error) {
      this.log(`❌ Failed to create user ${userNumber}`, {
        email: userData.email,
        error: error.message
      });
      
      // Continue with other users even if one fails
    }
  }

  generateSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST USER SETUP SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total users created: ${this.createdUsers.length}/${CONFIG.userCount}`);
    console.log(`Success rate: ${((this.createdUsers.length / CONFIG.userCount) * 100).toFixed(1)}%`);
    
    if (this.createdUsers.length > 0) {
      const totalTokens = this.createdUsers.reduce((sum, user) => sum + user.tokenBalance, 0);
      const avgTokens = (totalTokens / this.createdUsers.length).toFixed(1);
      
      console.log(`Total tokens available: ${totalTokens}`);
      console.log(`Average tokens per user: ${avgTokens}`);
    }
    
    console.log('='.repeat(80));
    
    // User details
    console.log('\nCreated users:');
    this.createdUsers.forEach(user => {
      console.log(`${user.userNumber}. ${user.email} (${user.tokenBalance} tokens)`);
    });
    
    console.log('='.repeat(80));
  }

  saveUserData() {
    const fs = require('fs');
    const path = require('path');
    
    try {
      // Create test-data directory if it doesn't exist
      const testDataDir = path.join(process.cwd(), 'test-data');
      if (!fs.existsSync(testDataDir)) {
        fs.mkdirSync(testDataDir, { recursive: true });
      }
      
      // Save user data
      const filePath = path.join(testDataDir, `test-users-${Date.now()}.json`);
      const userData = {
        createdAt: new Date().toISOString(),
        userCount: this.createdUsers.length,
        users: this.createdUsers
      };
      
      fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));
      this.log(`✅ User data saved to ${filePath}`);
      
      // Also save a simple credentials file for easy use
      const credentialsPath = path.join(testDataDir, 'test-credentials.json');
      const credentials = this.createdUsers.map(user => ({
        email: user.email,
        password: user.password,
        tokenBalance: user.tokenBalance
      }));
      
      fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
      this.log(`✅ Credentials saved to ${credentialsPath}`);
      
    } catch (error) {
      this.log('❌ Failed to save user data', error);
    }
  }

  async cleanup() {
    if (process.env.CLEANUP_TEST_USERS === 'true') {
      this.log('🧹 Cleaning up test users...');
      
      for (const user of this.createdUsers) {
        try {
          await axios.delete(`${CONFIG.proxyUrl}/auth/account`, {
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            },
            timeout: CONFIG.timeout
          });
          
          this.log(`✅ Deleted user: ${user.email}`);
        } catch (error) {
          this.log(`⚠️ Failed to delete user ${user.email}: ${error.message}`);
        }
      }
    } else {
      this.log('ℹ️ Skipping cleanup (set CLEANUP_TEST_USERS=true to enable)');
    }
  }
}

// Helper function to generate test script configuration
function generateTestConfig() {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const credentialsPath = path.join(process.cwd(), 'test-data', 'test-credentials.json');
    
    if (fs.existsSync(credentialsPath)) {
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      
      console.log('\n📋 Test Configuration for concurrent-assessment-test.js:');
      console.log('='.repeat(60));
      console.log('// Update TEST_CONFIG.testUser in concurrent-assessment-test.js:');
      console.log('testUser: {');
      console.log(`  email: '${credentials[0]?.email || 'test@example.com'}',`);
      console.log(`  password: '${credentials[0]?.password || 'TestPassword123!'}'`);
      console.log('},');
      console.log('='.repeat(60));
    }
  } catch (error) {
    console.log('⚠️ Could not generate test configuration');
  }
}

// Main execution
if (require.main === module) {
  const setup = new TestUserSetup();
  
  // Handle process termination
  process.on('SIGINT', async () => {
    console.log('\n🛑 Setup interrupted by user');
    await setup.cleanup();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🛑 Setup terminated');
    await setup.cleanup();
    process.exit(0);
  });
  
  // Run the setup
  setup.run()
    .then(() => {
      generateTestConfig();
      console.log('\n✅ Test user setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test user setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = TestUserSetup;
