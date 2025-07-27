'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  CheckCircle, 
  ArrowLeft,
  LogIn,
  Eye
} from 'lucide-react';

export default function UsernameTestPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout, updateUser } = useAuth();

  // Same function as in dashboard
  const getUserDisplayName = () => {
    if (user?.username) {
      return user.username;
    }
    if (user?.name) {
      return user.name;
    }
    if (user?.email) {
      // Extract name from email (before @)
      return user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1);
    }
    return 'User';
  };

  // Function to manually fetch and update username
  const fetchUsernameFromProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log('Manual fetch: Getting profile...');
      const response = await fetch('/api/proxy/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const profileData = await response.json();
      console.log('Manual fetch: Profile data received:', profileData);

      if (profileData && profileData.success && profileData.data?.user?.username) {
        const username = profileData.data.user.username;
        console.log('Manual fetch: Username found:', username);
        updateUser({ username });
        console.log('Manual fetch: User updated with username');
      } else {
        console.log('Manual fetch: No username found in profile');
      }
    } catch (error) {
      console.error('Manual fetch: Error:', error);
    }
  };

  const testCases = [
    {
      email: 'demo@petatalenta.com',
      password: 'demo123',
      expectedName: 'Demo User',
      description: 'Demo account with predefined name'
    },
    {
      email: 'test@example.com', 
      password: 'test123',
      expectedName: 'Test User',
      description: 'Test account with predefined name'
    },
    {
      email: 'john.doe@company.com',
      password: 'any123',
      expectedName: 'John',
      description: 'Email-based name extraction (john → John)'
    },
    {
      email: 'sarah_smith@domain.org',
      password: 'any123', 
      expectedName: 'Sarah_smith',
      description: 'Email-based name extraction (sarah_smith → Sarah_smith)'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="border-[#eaecf0]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#1e1e1e]">
                Username Display Test
              </h1>
              <p className="text-sm text-[#64707d]">
                Test how usernames are displayed in the dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Current User Status */}
        <Card className="bg-white border-[#eaecf0]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#6475e9]" />
              Current User Display
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAuthenticated && user ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-green-800">Logged In User</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Stored Name:</strong> {user.name || 'Not provided'}</p>
                        <p><strong>Username:</strong> {user.username || 'Not provided'}</p>
                      </div>
                      <div>
                        <p><strong>Display Name:</strong> 
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                            {getUserDisplayName()}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Dashboard Preview</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-blue-700">
                      <strong>Header:</strong> "Welcome, {getUserDisplayName()}!"
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>WorldMap Card:</strong> "{getUserDisplayName()}"
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Debug Actions</h4>
                  <button
                    onClick={fetchUsernameFromProfile}
                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                  >
                    Manually Fetch Username from Profile
                  </button>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => router.push('/dashboard')}
                    className="bg-[#6475e9] hover:bg-[#5a6bd8]"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={logout}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Logout & Test Different User
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[#64707d] mb-4">Please login to test username display</p>
                <Button 
                  onClick={() => router.push('/auth')}
                  className="bg-[#6475e9] hover:bg-[#5a6bd8]"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Cases */}
        <Card className="bg-white border-[#eaecf0]">
          <CardHeader>
            <CardTitle>Username Display Logic Test Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-[#64707d]">
                Here's how different login credentials will display usernames:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testCases.map((testCase, index) => (
                  <div key={index} className="border border-[#eaecf0] rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-[#1e1e1e]">Test Case {index + 1}</h4>
                        <Badge variant="secondary" className="bg-[#e7eaff] text-[#6475e9]">
                          {testCase.expectedName}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <p><strong>Email:</strong> <code className="bg-gray-100 px-1 rounded">{testCase.email}</code></p>
                        <p><strong>Password:</strong> <code className="bg-gray-100 px-1 rounded">{testCase.password}</code></p>
                        <p><strong>Expected Display:</strong> <span className="font-medium text-[#6475e9]">{testCase.expectedName}</span></p>
                        <p className="text-xs text-[#64707d]">{testCase.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logic Explanation */}
        <Card className="bg-white border-[#eaecf0]">
          <CardHeader>
            <CardTitle>Username Display Logic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-green-800 mb-2">✅ Updated Logic (Now Synced with Profile):</h4>
                <p className="text-sm text-green-700">
                  Username from profile page now syncs with dashboard display. When you update your username in the profile,
                  it will immediately appear in the dashboard header and welcome message.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-[#1e1e1e] mb-2">Function Logic:</h4>
                <pre className="text-sm text-[#64707d] overflow-x-auto">
{`const getUserDisplayName = () => {
  if (user?.username) {
    return user.username;  // Use username from profile (highest priority)
  }
  if (user?.name) {
    return user.name;  // Use stored name if available
  }
  if (user?.email) {
    // Extract username from email and capitalize
    return user.email.split('@')[0]
      .charAt(0).toUpperCase() +
      user.email.split('@')[0].slice(1);
  }
  return 'User';  // Fallback
};`}
                </pre>
              </div>
              
              <div className="space-y-2 text-sm">
                <p><strong>Priority Order:</strong></p>
                <ol className="list-decimal list-inside space-y-1 text-[#64707d] ml-4">
                  <li>Use <code>user.name</code> if provided (Demo User, Test User)</li>
                  <li>Extract and capitalize username from email (john@domain.com → John)</li>
                  <li>Fallback to "User" if no data available</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-gradient-to-r from-[#6475e9] to-[#5a6bd8] text-white border-none">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-2">How to Test</h3>
            <div className="space-y-2 text-sm text-white/90">
              <p>1. Login with different credentials to see how usernames are displayed</p>
              <p>2. Check the dashboard header and WorldMap card for consistent naming</p>
              <p>3. Try demo credentials, test credentials, and custom emails</p>
              <p>4. Verify that the display name matches the expected format</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
