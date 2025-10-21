import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

export default function DebugChat() {
  const [debugInfo, setDebugInfo] = useState({});
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    setDebugInfo({
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
      hasUser: !!user,
      userEmail: user ? JSON.parse(user).email : 'none'
    });
  }, []);

  const addTestResult = (test, result, error = null) => {
    setTestResults(prev => [...prev, {
      test,
      result,
      error,
      timestamp: new Date().toISOString()
    }]);
  };

  const testChatbotHealth = async () => {
    try {
      addTestResult('Chatbot Health Check', 'Starting...');
      const response = await apiService.axiosInstance.get('/api/chatbot/health');
      addTestResult('Chatbot Health Check', 'Success', response.data);
    } catch (error) {
      addTestResult('Chatbot Health Check', 'Failed', error.response?.data || error.message);
    }
  };

  const testConversationCreation = async () => {
    try {
      addTestResult('Conversation Creation', 'Starting...');
      const response = await apiService.startChatConversation({
        resultId: 'test-result-123',
        assessmentContext: { test: true }
      });
      addTestResult('Conversation Creation', 'Success', response);
    } catch (error) {
      addTestResult('Conversation Creation', 'Failed', error.response?.data || error.message);
    }
  };

  const testMessageSending = async () => {
    try {
      addTestResult('Message Sending', 'Starting...');
      const response = await apiService.sendChatMessage({
        conversationId: 'test-conversation-123',
        resultId: 'test-result-123',
        message: 'Hello, this is a test message'
      });
      addTestResult('Message Sending', 'Success', response);
    } catch (error) {
      addTestResult('Message Sending', 'Failed', error.response?.data || error.message);
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    await testChatbotHealth();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testConversationCreation();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testMessageSending();
    
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Chat API Debug Page</h1>
      
      {/* Authentication Info */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Authentication Status</h2>
        <div className="space-y-2">
          <p><strong>Has Token:</strong> {debugInfo.hasToken ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Token Preview:</strong> {debugInfo.tokenPreview}</p>
          <p><strong>Has User:</strong> {debugInfo.hasUser ? '✅ Yes' : '❌ No'}</p>
          <p><strong>User Email:</strong> {debugInfo.userEmail}</p>
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2 disabled:opacity-50"
        >
          {isLoading ? 'Running Tests...' : 'Run All Tests'}
        </button>
        
        <button
          onClick={testChatbotHealth}
          disabled={isLoading}
          className="bg-green-500 text-white px-4 py-2 rounded mr-2 disabled:opacity-50"
        >
          Test Health
        </button>
        
        <button
          onClick={testConversationCreation}
          disabled={isLoading}
          className="bg-yellow-500 text-white px-4 py-2 rounded mr-2 disabled:opacity-50"
        >
          Test Conversation
        </button>
        
        <button
          onClick={testMessageSending}
          disabled={isLoading}
          className="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Message
        </button>
      </div>

      {/* Test Results */}
      <div className="bg-white border rounded-lg">
        <h2 className="text-xl font-semibold p-4 border-b">Test Results</h2>
        <div className="p-4">
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click "Run All Tests" to start.</p>
          ) : (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">{result.test}</h3>
                    <span className="text-sm text-gray-500">{new Date(result.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className={`font-medium ${result.result === 'Success' ? 'text-green-600' : result.result === 'Failed' ? 'text-red-600' : 'text-yellow-600'}`}>
                    {result.result}
                  </p>
                  {result.error && (
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-auto">
                      {JSON.stringify(result.error, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
