/**
 * Quick Token Deduction Test
 * Simple script to quickly test token deduction for a single assessment
 * 
 * Usage: node scripts/quick-token-test.js
 */

const axios = require('axios');

// Test configuration
const CONFIG = {
  proxyUrl: 'http://localhost:3000/api/proxy',
  timeout: 30000,
  
  // Test user credentials (replace with actual test account)
  testUser: {
    email: 'test.token@example.com',
    password: 'TestPassword123!'
  }
};

class QuickTokenTest {
  constructor() {
    this.token = null;
    this.userId = null;
    this.startTime = Date.now();
  }

  log(message, data = null) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log(`[+${elapsed}s] ${message}`);
    if (data) console.log('  →', JSON.stringify(data, null, 2));
  }

  async run() {
    try {
      console.log('🧪 Quick Token Deduction Test');
      console.log('================================');
      
      // Step 1: Login
      await this.login();
      
      // Step 2: Check initial balance
      const initialBalance = await this.getTokenBalance();
      this.log(`💰 Initial token balance: ${initialBalance}`);
      
      // Step 3: Submit assessment
      const jobId = await this.submitAssessment();
      this.log(`📝 Assessment submitted with jobId: ${jobId}`);
      
      // Step 4: Check balance after submission
      const balanceAfterSubmit = await this.getTokenBalance();
      this.log(`💰 Token balance after submission: ${balanceAfterSubmit}`);
      
      // Step 5: Verify deduction
      const deduction = initialBalance - balanceAfterSubmit;
      this.log(`🔍 Token deduction: ${deduction}`);
      
      if (deduction === 1) {
        console.log('✅ SUCCESS: Token deduction is correct (1 token)');
      } else {
        console.log(`❌ FAIL: Expected 1 token deduction, got ${deduction}`);
      }
      
      // Step 6: Summary
      console.log('\n📊 Test Summary:');
      console.log(`   Initial Balance: ${initialBalance}`);
      console.log(`   Final Balance: ${balanceAfterSubmit}`);
      console.log(`   Deduction: ${deduction}`);
      console.log(`   Expected: 1`);
      console.log(`   Result: ${deduction === 1 ? 'PASS' : 'FAIL'}`);
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      throw error;
    }
  }

  async login() {
    this.log('🔐 Logging in...');
    
    const response = await axios.post(`${CONFIG.proxyUrl}/auth/login`, {
      email: CONFIG.testUser.email,
      password: CONFIG.testUser.password
    }, {
      timeout: CONFIG.timeout,
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.success && response.data.data.token) {
      this.token = response.data.data.token;
      this.userId = response.data.data.user.id;
      this.log('✅ Login successful');
    } else {
      throw new Error('Login failed: ' + (response.data.error?.message || 'Unknown error'));
    }
  }

  async getTokenBalance() {
    const response = await axios.get(`${CONFIG.proxyUrl}/auth/token-balance`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      timeout: CONFIG.timeout
    });

    if (response.data.success && response.data.data) {
      return response.data.data.tokenBalance || 
             response.data.data.balance || 
             response.data.data.user?.token_balance || 0;
    } else {
      throw new Error('Failed to get token balance: ' + (response.data.error?.message || 'Unknown error'));
    }
  }

  async submitAssessment() {
    this.log('📝 Submitting assessment...');
    
    const assessmentData = {
      assessmentName: 'Quick Token Test Assessment',
      riasec: {
        realistic: 75,
        investigative: 80,
        artistic: 65,
        social: 70,
        enterprising: 85,
        conventional: 60
      },
      ocean: {
        openness: 80,
        conscientiousness: 75,
        extraversion: 70,
        agreeableness: 85,
        neuroticism: 40
      },
      viaIs: {
        creativity: 80,
        curiosity: 85,
        judgment: 75,
        love_of_learning: 90,
        perspective: 70
      }
    };

    const response = await axios.post(`${CONFIG.proxyUrl}/assessment`, assessmentData, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      timeout: CONFIG.timeout
    });

    if (response.data.success && response.data.data.jobId) {
      return response.data.data.jobId;
    } else {
      throw new Error('Assessment submission failed: ' + (response.data.error?.message || 'Unknown error'));
    }
  }
}

// Validation function
function validateConfig() {
  if (!CONFIG.testUser.email || !CONFIG.testUser.password) {
    console.error('❌ Test user credentials not configured');
    console.error('Please update CONFIG.testUser in the script');
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  validateConfig();
  
  const test = new QuickTokenTest();
  
  test.run()
    .then(() => {
      console.log('\n✅ Quick Token Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Quick Token Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = QuickTokenTest;
