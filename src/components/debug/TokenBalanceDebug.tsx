'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToken } from '../../contexts/TokenContext';
import { forceRefreshTokenBalance, testDirectTokenBalanceCall } from '../../utils/token-balance';

interface TokenBalanceDebugProps {
  className?: string;
}

export const TokenBalanceDebug: React.FC<TokenBalanceDebugProps> = ({ className = '' }) => {
  const { tokenInfo, refreshTokenBalance } = useToken();
  const [debugResults, setDebugResults] = useState<any[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);

  const addDebugResult = (title: string, type: 'info' | 'success' | 'error', message: string, data?: any) => {
    const result = {
      timestamp: new Date().toLocaleTimeString(),
      title,
      type,
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined
    };
    setDebugResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const runForceRefresh = async () => {
    setIsDebugging(true);
    addDebugResult('Force Refresh', 'info', 'Starting force refresh...');
    
    try {
      const result = await forceRefreshTokenBalance();
      addDebugResult('Force Refresh', 'success', `Force refresh completed. Balance: ${result.balance}`, result);
      
      // Also refresh the context
      await refreshTokenBalance();
    } catch (error) {
      addDebugResult('Force Refresh', 'error', `Force refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
    } finally {
      setIsDebugging(false);
    }
  };

  const runDirectApiTest = async () => {
    setIsDebugging(true);
    addDebugResult('Direct API Test', 'info', 'Testing direct API call...');
    
    try {
      const result = await testDirectTokenBalanceCall();
      addDebugResult('Direct API Test', 'success', 'Direct API test completed', result);
    } catch (error) {
      addDebugResult('Direct API Test', 'error', `Direct API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
    } finally {
      setIsDebugging(false);
    }
  };

  const clearResults = () => {
    setDebugResults([]);
  };

  const showCurrentState = () => {
    const token = localStorage.getItem('token');
    const state = {
      tokenInfo,
      hasToken: !!token,
      tokenLength: token?.length,
      apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
      nodeEnv: process.env.NODE_ENV
    };
    addDebugResult('Current State', 'info', 'Current application state', state);
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className={`bg-yellow-50 border-yellow-200 ${className}`}>
      <CardHeader>
        <CardTitle className="text-yellow-800 text-sm flex items-center gap-2">
          🐛 Token Balance Debug (Dev Only)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="text-xs space-y-1">
          <div><strong>Balance:</strong> {tokenInfo?.balance ?? 'Loading...'}</div>
          <div><strong>Has Enough:</strong> {tokenInfo?.hasEnoughTokens ? 'Yes' : 'No'}</div>
          <div><strong>Error:</strong> {tokenInfo?.error ? 'Yes' : 'No'}</div>
          <div><strong>Last Updated:</strong> {tokenInfo?.lastUpdated || 'Never'}</div>
        </div>

        {/* Debug Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={runForceRefresh}
            disabled={isDebugging}
            className="text-xs"
          >
            Force Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={runDirectApiTest}
            disabled={isDebugging}
            className="text-xs"
          >
            Test API
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={showCurrentState}
            className="text-xs"
          >
            Show State
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={clearResults}
            className="text-xs"
          >
            Clear
          </Button>
        </div>

        {/* Debug Results */}
        {debugResults.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <div className="text-xs font-semibold text-yellow-800">Debug Results:</div>
            {debugResults.map((result, index) => (
              <div
                key={index}
                className={`text-xs p-2 rounded border ${
                  result.type === 'success' ? 'bg-green-50 border-green-200' :
                  result.type === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="font-semibold">
                  [{result.timestamp}] {result.title}
                </div>
                <div>{result.message}</div>
                {result.data && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-gray-600">Show Data</summary>
                    <pre className="mt-1 text-xs bg-white p-1 rounded border overflow-x-auto">
                      {result.data}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
