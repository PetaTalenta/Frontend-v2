// Test script for chatbot API integration
// Run this with: node test-chatbot-api.js

const axios = require('axios');

// Test configuration
const API_BASE_URL = 'https://api.chhrone.web.id';
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

// Test data
const testAssessmentId = 'test-assessment-123';
const testUserId = 'test-user-456';

async function testChatbotAPI() {
  console.log('🧪 Testing Chatbot API Integration...\n');

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
    console.log('1️⃣ Testing Health Check...');
    try {
      const healthResponse = await api.get('/api/chatbot/health');
      console.log('✅ Health Check:', healthResponse.data.status);
    } catch (error) {
      console.log('❌ Health Check failed:', error.response?.data || error.message);
    }

    // Test 2: Create Conversation from Assessment
    console.log('\n2️⃣ Testing Create Conversation from Assessment...');
    let conversationId = null;
    try {
      const createResponse = await api.post('/api/chatbot/assessment/from-assessment', {
        assessment_id: testAssessmentId,
        conversation_type: 'career_guidance',
        include_suggestions: true
      });
      
      if (createResponse.data.success) {
        conversationId = createResponse.data.data.conversationId;
        console.log('✅ Conversation created:', conversationId);
        console.log('📝 Welcome message:', createResponse.data.data.personalizedWelcome?.content?.substring(0, 100) + '...');
      } else {
        console.log('❌ Failed to create conversation:', createResponse.data);
      }
    } catch (error) {
      console.log('❌ Create conversation failed:', error.response?.data || error.message);
    }

    // Test 3: Send Message (only if conversation was created)
    if (conversationId) {
      console.log('\n3️⃣ Testing Send Message...');
      try {
        const messageResponse = await api.post(`/api/chatbot/conversations/${conversationId}/messages`, {
          content: 'What career paths would be best suited for my personality type?',
          type: 'text'
        });
        
        if (messageResponse.data.success) {
          console.log('✅ Message sent successfully');
          console.log('🤖 AI Response:', messageResponse.data.data.aiResponse?.content?.substring(0, 100) + '...');
        } else {
          console.log('❌ Failed to send message:', messageResponse.data);
        }
      } catch (error) {
        console.log('❌ Send message failed:', error.response?.data || error.message);
      }

      // Test 4: Get Conversation Details
      console.log('\n4️⃣ Testing Get Conversation Details...');
      try {
        const getResponse = await api.get(`/api/chatbot/conversations/${conversationId}`);
        
        if (getResponse.data.success) {
          console.log('✅ Conversation retrieved successfully');
          console.log('📊 Message count:', getResponse.data.data.conversation?.messageCount);
        } else {
          console.log('❌ Failed to get conversation:', getResponse.data);
        }
      } catch (error) {
        console.log('❌ Get conversation failed:', error.response?.data || error.message);
      }
    }

    // Test 5: Get Conversations List
    console.log('\n5️⃣ Testing Get Conversations List...');
    try {
      const listResponse = await api.get('/api/chatbot/conversations?page=1&limit=10');
      
      if (listResponse.data.success) {
        console.log('✅ Conversations list retrieved');
        console.log('📋 Total conversations:', listResponse.data.data.pagination?.totalConversations);
      } else {
        console.log('❌ Failed to get conversations list:', listResponse.data);
      }
    } catch (error) {
      console.log('❌ Get conversations list failed:', error.response?.data || error.message);
    }

    // Test 6: Get Suggestions
    console.log('\n6️⃣ Testing Get Suggestions...');
    try {
      const suggestionsResponse = await api.get('/api/chatbot/suggestions?context=career&limit=5');
      
      if (suggestionsResponse.data.success) {
        console.log('✅ Suggestions retrieved');
        console.log('💡 Suggestions count:', suggestionsResponse.data.data.suggestions?.length);
      } else {
        console.log('❌ Failed to get suggestions:', suggestionsResponse.data);
      }
    } catch (error) {
      console.log('❌ Get suggestions failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }

  console.log('\n🏁 Test completed!');
}

// Run tests
if (require.main === module) {
  console.log('⚠️  Please update TEST_TOKEN with a valid JWT token before running tests');
  console.log('⚠️  Update testAssessmentId with a valid assessment ID');
  console.log('⚠️  Uncomment the line below to run tests:\n');
  // testChatbotAPI();
}

module.exports = { testChatbotAPI };
