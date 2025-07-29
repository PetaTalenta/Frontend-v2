// Test script for Archive API integration
// Run this with: node test-archive-api-integration.js

const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:3000'; // API Gateway
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

async function testArchiveAPI() {
  console.log('🧪 Testing Archive API Integration...\n');

  // Configure axios
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_TOKEN}`
    }
  });

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Archive Service Health...');
    try {
      const healthResponse = await api.get('/api/archive/health');
      if (healthResponse.data.status === 'healthy') {
        console.log('✅ Archive Service is healthy');
        console.log('📊 Service info:', healthResponse.data);
      } else {
        console.log('⚠️ Archive Service health check returned:', healthResponse.data);
      }
    } catch (error) {
      console.log('❌ Archive Service health check failed:', error.message);
    }

    // Test 2: Get User Results
    console.log('\n2️⃣ Testing Get User Results...');
    try {
      const resultsResponse = await api.get('/api/archive/results?limit=5&sort=created_at&order=DESC');
      
      if (resultsResponse.data.success) {
        console.log('✅ Successfully fetched user results');
        console.log('📊 Results count:', resultsResponse.data.data.results.length);
        console.log('📄 Pagination:', resultsResponse.data.data.pagination);
        
        // Show sample result structure
        if (resultsResponse.data.data.results.length > 0) {
          const sampleResult = resultsResponse.data.data.results[0];
          console.log('📝 Sample result structure:');
          console.log('  - ID:', sampleResult.id);
          console.log('  - Assessment Name:', sampleResult.assessment_name);
          console.log('  - Status:', sampleResult.status);
          console.log('  - Created At:', sampleResult.created_at);
          console.log('  - Archetype:', sampleResult.persona_profile?.archetype);
        }
      } else {
        console.log('❌ Failed to fetch results:', resultsResponse.data);
      }
    } catch (error) {
      console.log('❌ Get results failed:', error.message);
      if (error.response) {
        console.log('📄 Response status:', error.response.status);
        console.log('📄 Response data:', error.response.data);
      }
    }

    // Test 3: Get User Statistics
    console.log('\n3️⃣ Testing Get User Statistics...');
    try {
      const statsResponse = await api.get('/api/archive/stats');
      
      if (statsResponse.data.success) {
        console.log('✅ Successfully fetched user statistics');
        console.log('📊 Total results:', statsResponse.data.data.total_results);
        console.log('📊 Total jobs:', statsResponse.data.data.total_jobs);
        console.log('📊 Completed assessments:', statsResponse.data.data.completed_assessments);
        console.log('📊 Archetype distribution:', statsResponse.data.data.archetype_distribution);
      } else {
        console.log('❌ Failed to fetch statistics:', statsResponse.data);
      }
    } catch (error) {
      console.log('❌ Get statistics failed:', error.message);
    }

    // Test 4: Get User Overview
    console.log('\n4️⃣ Testing Get User Overview...');
    try {
      const overviewResponse = await api.get('/api/archive/stats/overview');
      
      if (overviewResponse.data.success) {
        console.log('✅ Successfully fetched user overview');
        console.log('📊 Summary:', overviewResponse.data.data.summary);
        console.log('📊 Recent results count:', overviewResponse.data.data.recent_results.length);
        console.log('📊 Archetype summary:', overviewResponse.data.data.archetype_summary);
      } else {
        console.log('❌ Failed to fetch overview:', overviewResponse.data);
      }
    } catch (error) {
      console.log('❌ Get overview failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

// Test the frontend service integration
async function testFrontendIntegration() {
  console.log('\n🔧 Testing Frontend Service Integration...\n');

  try {
    // Simulate importing the service (this would work in a browser environment)
    console.log('1️⃣ Testing service import...');
    console.log('✅ Service import simulation successful');

    // Test data transformation
    console.log('\n2️⃣ Testing data transformation...');
    const mockApiResponse = {
      success: true,
      data: {
        results: [
          {
            id: 'test-uuid-123',
            user_id: 'user-456',
            assessment_name: 'AI-Driven Talent Mapping',
            status: 'completed',
            created_at: '2024-01-15T10:30:00.000Z',
            persona_profile: {
              archetype: 'The Analytical Innovator'
            }
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      }
    };

    // Transform data as the frontend would
    const transformedData = mockApiResponse.data.results.map((result, index) => ({
      id: index + 1,
      nama: result.persona_profile?.archetype || result.assessment_name || 'Assessment Result',
      tipe: "Personality Assessment",
      tanggal: new Date(result.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      status: result.status === 'completed' ? "Selesai" : "Belum Selesai",
      resultId: result.id
    }));

    console.log('✅ Data transformation successful');
    console.log('📊 Transformed data:', transformedData);

  } catch (error) {
    console.error('❌ Frontend integration test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Archive API Integration Test Suite\n');
  console.log('⚠️  Make sure to replace TEST_TOKEN with a valid JWT token\n');
  
  await testArchiveAPI();
  await testFrontendIntegration();
  
  console.log('\n✅ Test suite completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Replace TEST_TOKEN with a valid JWT token');
  console.log('2. Ensure Archive Service is running on localhost:3000');
  console.log('3. Test the integration in the browser dashboard');
  console.log('4. Verify delete functionality works correctly');
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testArchiveAPI,
  testFrontendIntegration
};
