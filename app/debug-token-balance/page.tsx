'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { checkTokenBalance } from '../../utils/token-balance';
import { getApiBaseUrl } from '../../utils/api-health';
import {
  testAllTokenBalanceEndpoints,
  validateTokenFormat,
  checkTokenConsistency,
  quickDiagnostic
} from '../../utils/debug-token-balance';

interface DebugResult {
  step: string;
  status: 'success' | 'error' | 'info';
  message: string;
  data?: any;
  timestamp: string;
}

export default function DebugTokenBalancePage() {
  const { user, isAuthenticated, token } = useAuth();
  const [debugResults, setDebugResults] = useState<DebugResult[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);

  const addDebugResult = (step: string, status: 'success' | 'error' | 'info', message: string, data?: any) => {
    const result: DebugResult = {
      step,
      status,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    setDebugResults(prev => [...prev, result]);
    console.log(`[DEBUG] ${step}:`, message, data);
  };

  const clearResults = () => {
    setDebugResults([]);
  };

  const testAuthenticationStatus = () => {
    addDebugResult('Auth Check', 'info', 'Checking authentication status...');
    
    if (!isAuthenticated) {
      addDebugResult('Auth Check', 'error', 'User is not authenticated');
      return false;
    }

    if (!token) {
      addDebugResult('Auth Check', 'error', 'No token found in context');
      return false;
    }

    const localStorageToken = localStorage.getItem('token');
    if (!localStorageToken) {
      addDebugResult('Auth Check', 'error', 'No token found in localStorage');
      return false;
    }

    if (token !== localStorageToken) {
      addDebugResult('Auth Check', 'error', 'Token mismatch between context and localStorage');
      return false;
    }

    addDebugResult('Auth Check', 'success', 'Authentication status OK', {
      userId: user?.id,
      email: user?.email,
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...'
    });

    return true;
  };

  const testApiHealth = async () => {
    addDebugResult('API Health', 'info', 'Checking API health...');
    
    try {
      const baseUrl = await getApiBaseUrl();
      addDebugResult('API Health', 'success', 'API health check completed', {
        baseUrl: baseUrl || 'Using mock API (empty baseUrl)',
        isUsingMockApi: baseUrl === ''
      });
      return baseUrl;
    } catch (error) {
      addDebugResult('API Health', 'error', 'API health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  };

  const testDirectApiCall = async (endpoint: string, description: string) => {
    addDebugResult('Direct API', 'info', `Testing ${description}...`);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        addDebugResult('Direct API', 'error', 'No token for direct API call');
        return;
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        addDebugResult('Direct API', 'success', `${description} successful`, {
          endpoint,
          status: response.status,
          data
        });
      } else {
        addDebugResult('Direct API', 'error', `${description} failed`, {
          endpoint,
          status: response.status,
          data
        });
      }
    } catch (error) {
      addDebugResult('Direct API', 'error', `${description} error`, {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const testTokenBalanceFunction = async () => {
    addDebugResult('Token Balance Function', 'info', 'Testing checkTokenBalance function...');

    try {
      const result = await checkTokenBalance();
      addDebugResult('Token Balance Function', 'success', 'checkTokenBalance completed', result);
    } catch (error) {
      addDebugResult('Token Balance Function', 'error', 'checkTokenBalance failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const testAdvancedDiagnostic = async () => {
    addDebugResult('Advanced Diagnostic', 'info', 'Running advanced diagnostic...');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        addDebugResult('Advanced Diagnostic', 'error', 'No token found for advanced diagnostic');
        return;
      }

      // Test token format
      const tokenValidation = validateTokenFormat(token);
      addDebugResult('Token Validation', tokenValidation.isValid ? 'success' : 'error',
        `Token validation: ${tokenValidation.isValid ? 'Valid' : 'Invalid'}`, tokenValidation);

      // Test token consistency
      const consistency = checkTokenConsistency();
      addDebugResult('Token Consistency', consistency.isConsistent ? 'success' : 'error',
        `Token consistency: ${consistency.isConsistent ? 'Consistent' : 'Issues found'}`, consistency);

      // Run comprehensive endpoint tests
      const session = await testAllTokenBalanceEndpoints(token);
      addDebugResult('Comprehensive Test', 'success', 'All endpoint tests completed', session);

      // Quick diagnostic
      const quickResult = await quickDiagnostic();
      addDebugResult('Quick Diagnostic',
        quickResult.status === 'healthy' ? 'success' : quickResult.status === 'issues' ? 'info' : 'error',
        quickResult.summary, quickResult.details);

    } catch (error) {
      addDebugResult('Advanced Diagnostic', 'error', 'Advanced diagnostic failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const runFullDiagnostic = async () => {
    setIsDebugging(true);
    clearResults();

    addDebugResult('Diagnostic', 'info', 'Starting full diagnostic...');

    // Step 1: Check authentication
    const authOk = testAuthenticationStatus();
    if (!authOk) {
      setIsDebugging(false);
      return;
    }

    // Step 2: Check API health
    const baseUrl = await testApiHealth();

    // Step 3: Test direct API calls
    await testDirectApiCall('/api/auth/token-balance', 'Mock API Token Balance');
    await testDirectApiCall('/api/proxy/auth/token-balance', 'Proxy API Token Balance');
    
    if (baseUrl && baseUrl !== '') {
      await testDirectApiCall(`${baseUrl}/api/auth/token-balance`, 'Real API Token Balance');
    }

    // Step 4: Test token balance function
    await testTokenBalanceFunction();

    addDebugResult('Diagnostic', 'success', 'Full diagnostic completed');
    setIsDebugging(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '⚪';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Token Balance Debug Tool</h1>
        <p className="text-gray-600">
          Diagnostic tool untuk mengatasi masalah token balance yang tidak muncul
        </p>
      </div>

      {/* Control Panel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Debug Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={runFullDiagnostic}
              disabled={isDebugging}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isDebugging ? 'Running Diagnostic...' : 'Run Full Diagnostic'}
            </Button>
            <Button 
              onClick={clearResults}
              variant="outline"
              disabled={isDebugging}
            >
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700">Authentication</h3>
              <p className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
              </p>
              {user && (
                <p className="text-sm text-gray-600 mt-1">
                  User: {user.email}
                </p>
              )}
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700">Token</h3>
              <p className={token ? 'text-green-600' : 'text-red-600'}>
                {token ? '✅ Token Present' : '❌ No Token'}
              </p>
              {token && (
                <p className="text-sm text-gray-600 mt-1">
                  Length: {token.length} chars
                </p>
              )}
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700">Environment</h3>
              <p className="text-sm text-gray-600">
                NODE_ENV: {process.env.NODE_ENV}
              </p>
              <p className="text-sm text-gray-600">
                USE_MOCK_API: {process.env.NEXT_PUBLIC_USE_MOCK_API}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Results */}
      {debugResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {debugResults.map((result, index) => (
                <div key={index} className="border-l-4 border-gray-200 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{getStatusIcon(result.status)}</span>
                    <span className="font-semibold text-gray-700">{result.step}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className={`text-sm ${getStatusColor(result.status)}`}>
                    {result.message}
                  </p>
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">
                        Show Details
                      </summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
