'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';

export const SimpleTokenTest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testTokenBalance = async () => {
    setIsLoading(true);
    setResult('Testing...');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setResult('❌ No token found in localStorage');
        return;
      }

      setResult('✅ Token found, testing API...\nURL: /api/proxy/auth/token-balance\nToken: ' + token.substring(0, 20) + '...');

      const response = await fetch('/api/proxy/auth/token-balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Parse balance dengan prioritas format yang benar
        const balance = data.data?.token_balance || data.data?.tokenBalance || data.data?.balance || 'Not found';
        const userId = data.data?.user_id || data.data?.userId || 'Not found';

        setResult(`✅ Success!
Balance: ${balance}
User ID: ${userId}

Parsing Details:
- data.token_balance: ${data.data?.token_balance}
- data.tokenBalance: ${data.data?.tokenBalance}
- data.balance: ${data.data?.balance}

Full response:
${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ API Error (${response.status}):\n${JSON.stringify(data, null, 2)}`);
      }

    } catch (error) {
      setResult(`❌ Network Error:\n${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-md z-50">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold">🧪 Token Test</span>
        <Button
          size="sm"
          onClick={testTokenBalance}
          disabled={isLoading}
          className="text-xs"
        >
          {isLoading ? 'Testing...' : 'Test Now'}
        </Button>
      </div>
      
      {result && (
        <pre className="text-xs bg-gray-100 p-2 rounded border max-h-40 overflow-auto whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
};
