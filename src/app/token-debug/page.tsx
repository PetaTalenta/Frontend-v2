'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { useToken } from '../../contexts/TokenContext';
import { forceRefreshTokenBalance, testDirectTokenBalanceCall, testSimpleTokenBalance, clearAllCachesAndRefresh } from '../../utils/token-balance';

export default function TokenDebugPage() {
  const { user, isAuthenticated } = useAuth();
  const { tokenInfo, refreshTokenBalance, isLoading } = useToken();
  const [debugResults, setDebugResults] = useState<any[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);

  const addDebugResult = (title: string, type: 'info' | 'success' | 'error', message: string, data?: any) => {
    const result = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      title,
      type,
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined
    };
    setDebugResults(prev => [result, ...prev]);
  };

  const clearResults = () => {
    setDebugResults([]);
  };

  const runFullDiagnostic = async () => {
    setIsDebugging(true);
    clearResults();
    
    addDebugResult('Diagnostic', 'info', 'Starting full diagnostic...');

    // Step 1: Check authentication
    addDebugResult('Auth Check', isAuthenticated ? 'success' : 'error', 
      `Authentication: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);

    if (!isAuthenticated) {
      setIsDebugging(false);
      return;
    }

    // Step 2: Check token
    const token = localStorage.getItem('token');
    addDebugResult('Token Check', token ? 'success' : 'error',
      `Token: ${token ? `Present (${token.length} chars)` : 'Missing'}`);

    if (!token) {
      setIsDebugging(false);
      return;
    }

    // Step 3: Test simple API call first
    try {
      addDebugResult('Simple API Test', 'info', 'Testing simple API call...');
      const simpleResult = await testSimpleTokenBalance();
      addDebugResult('Simple API Test', 'success', 'Simple API call successful', simpleResult);
    } catch (error) {
      addDebugResult('Simple API Test', 'error', `Simple API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
    }

    // Step 4: Test direct API call
    try {
      addDebugResult('Direct API Test', 'info', 'Testing direct API call...');
      const apiResult = await testDirectTokenBalanceCall();
      addDebugResult('Direct API Test', 'success', 'Direct API call successful', apiResult);
    } catch (error) {
      addDebugResult('Direct API Test', 'error', `Direct API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
    }

    // Step 5: Test force refresh
    try {
      addDebugResult('Force Refresh', 'info', 'Testing force refresh...');
      const refreshResult = await forceRefreshTokenBalance();
      addDebugResult('Force Refresh', 'success', `Force refresh successful. Balance: ${refreshResult.balance}`, refreshResult);
    } catch (error) {
      addDebugResult('Force Refresh', 'error', `Force refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
    }

    // Step 6: Test context refresh
    try {
      addDebugResult('Context Refresh', 'info', 'Testing context refresh...');
      await refreshTokenBalance();
      addDebugResult('Context Refresh', 'success', 'Context refresh completed');
    } catch (error) {
      addDebugResult('Context Refresh', 'error', `Context refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
    }

    setIsDebugging(false);
  };

  const testSpecificEndpoint = async (endpoint: string) => {
    setIsDebugging(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      addDebugResult('Endpoint Test', 'error', 'No token available for testing');
      setIsDebugging(false);
      return;
    }

    try {
      addDebugResult('Endpoint Test', 'info', `Testing endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      const data = await response.json();
      
      addDebugResult('Endpoint Test', response.ok ? 'success' : 'error',
        `${endpoint} responded with status ${response.status}`, {
          status: response.status,
          data
        });
    } catch (error) {
      addDebugResult('Endpoint Test', 'error', 
        `Failed to test ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Token Balance Debug</h1>
          <p className="text-gray-600 mt-2">Diagnostic tools for token balance issues</p>
        </div>

        {/* Current Status */}
        <Card>
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
                <h3 className="font-semibold text-gray-700">Token Balance</h3>
                {isLoading ? (
                  <p className="text-blue-600">🔄 Loading...</p>
                ) : tokenInfo ? (
                  <>
                    <p className={tokenInfo.error ? 'text-red-600' : 'text-green-600'}>
                      {tokenInfo.error ? '❌' : '✅'} Balance: {tokenInfo.balance}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {tokenInfo.message}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-600">No data</p>
                )}
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700">Environment</h3>
                <p className="text-sm text-gray-600">
                  NODE_ENV: {process.env.NODE_ENV}
                </p>
                <p className="text-sm text-gray-600">
                  API_BASE_URL: {process.env.NEXT_PUBLIC_API_BASE_URL}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={runFullDiagnostic}
                disabled={isDebugging}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isDebugging ? 'Running...' : 'Run Full Diagnostic'}
              </Button>
              
              <Button
                onClick={() => testSpecificEndpoint('/api/proxy/auth/token-balance')}
                disabled={isDebugging}
                variant="outline"
              >
                Test Proxy Endpoint
              </Button>

              <Button
                onClick={async () => {
                  setIsDebugging(true);
                  try {
                    const result = await testSimpleTokenBalance();
                    addDebugResult('Simple Test', 'success', 'Simple test completed', result);
                  } catch (error) {
                    addDebugResult('Simple Test', 'error', `Simple test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
                  } finally {
                    setIsDebugging(false);
                  }
                }}
                disabled={isDebugging}
                variant="outline"
              >
                Simple Test
              </Button>
              
              <Button
                onClick={() => refreshTokenBalance()}
                disabled={isDebugging}
                variant="outline"
              >
                Refresh Context
              </Button>
              
              <Button
                onClick={clearResults}
                variant="outline"
              >
                Clear Results
              </Button>

              <Button
                onClick={async () => {
                  setIsDebugging(true);
                  try {
                    addDebugResult('Clear Cache', 'info', 'Clearing all caches and refreshing...');
                    const result = await clearAllCachesAndRefresh();
                    addDebugResult('Clear Cache', 'success', `Cache cleared and refreshed. Balance: ${result.balance}`, result);
                    // Also refresh the context
                    await refreshTokenBalance();
                  } catch (error) {
                    addDebugResult('Clear Cache', 'error', `Clear cache failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
                  } finally {
                    setIsDebugging(false);
                  }
                }}
                disabled={isDebugging}
                variant="outline"
                className="bg-red-50 hover:bg-red-100"
              >
                Clear All Cache
              </Button>
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
                {debugResults.map((result) => (
                  <div
                    key={result.id}
                    className={`p-4 rounded-lg border ${
                      result.type === 'success' ? 'bg-green-50 border-green-200' :
                      result.type === 'error' ? 'bg-red-50 border-red-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">
                        {result.title}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {result.timestamp}
                      </span>
                    </div>
                    <p className="mt-1">{result.message}</p>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          Show Details
                        </summary>
                        <pre className="mt-2 p-2 bg-white rounded border text-xs overflow-x-auto">
                          {result.data}
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
    </div>
  );
}
