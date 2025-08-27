'use client';

import React, { useState } from 'react';
import { Button } from '../../components/ui/button';

export default function TestProfilePage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testGetProfile = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setResult('No token found. Please login first.');
        return;
      }

      console.log('Testing GET profile with token:', token);
      
      const response = await fetch('/api/proxy/auth/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const data = await response.json();
      console.log('Response data:', data);

      setResult(`Status: ${response.status}\n\nData: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Error:', error);
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testUpdateProfile = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setResult('No token found. Please login first.');
        return;
      }

      const testData = {
        username: 'testuser123',
        full_name: 'Test User Updated',
        date_of_birth: '1990-01-15',
        gender: 'male',
        school_id: 1
      };

      console.log('Testing PUT profile with data:', testData);
      
      const response = await fetch('/api/proxy/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(testData),
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      setResult(`Status: ${response.status}\n\nData: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Error:', error);
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Profile API Test</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <div className="space-x-4 mb-4">
            <Button 
              onClick={testGetProfile} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Testing...' : 'Test GET Profile'}
            </Button>
            
            <Button 
              onClick={testUpdateProfile} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Testing...' : 'Test UPDATE Profile'}
            </Button>
          </div>
          
          {result && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Result:</h3>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                {result}
              </pre>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Make sure you are logged in first</li>
            <li>Click "Test GET Profile" to test fetching profile data</li>
            <li>Click "Test UPDATE Profile" to test updating profile data</li>
            <li>Check browser console for detailed logs</li>
            <li>Check terminal for server-side logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
