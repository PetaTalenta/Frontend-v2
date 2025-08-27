'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  LogIn,
  Home,
  ArrowLeft
} from 'lucide-react';

export default function AuthTestPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  const testRoutes = [
    { path: '/dashboard', name: 'Dashboard', protected: true },
    { path: '/assessment', name: 'Assessment', protected: true },
    { path: '/results', name: 'Results', protected: true },
    { path: '/auth', name: 'Auth Page', protected: false },
  ];

  const testRoute = (path: string) => {
    router.push(path);
  };

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
                Authentication Test
              </h1>
              <p className="text-sm text-[#64707d]">
                Test the authentication flow and route protection
              </p>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <Card className="bg-white border-[#eaecf0]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isAuthenticated ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge 
                    variant={isAuthenticated ? "default" : "secondary"}
                    className={isAuthenticated ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                  </Badge>
                  {isAuthenticated && user && (
                    <div className="text-sm text-[#64707d]">
                      Logged in as: <span className="font-medium text-[#1e1e1e]">{user.name || user.email}</span>
                    </div>
                  )}
                </div>
                {isAuthenticated ? (
                  <Button 
                    variant="outline" 
                    onClick={logout}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </Button>
                ) : (
                  <Button 
                    onClick={() => router.push('/auth')}
                    className="bg-[#6475e9] hover:bg-[#5a6bd8]"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                )}
              </div>

              {isAuthenticated && user && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">User Information</h4>
                  <div className="space-y-1 text-sm text-green-700">
                    <p><strong>ID:</strong> {user.id}</p>
                    <p><strong>Name:</strong> {user.name || 'Not provided'}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Route Testing */}
        <Card className="bg-white border-[#eaecf0]">
          <CardHeader>
            <CardTitle>Route Protection Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-[#64707d]">
                Test different routes to see how authentication protection works:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testRoutes.map((route) => (
                  <div key={route.path} className="border border-[#eaecf0] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-[#1e1e1e]">{route.name}</h4>
                        <p className="text-xs text-[#64707d]">{route.path}</p>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={route.protected ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"}
                      >
                        {route.protected ? 'Protected' : 'Public'}
                      </Badge>
                    </div>
                    
                    <Button 
                      onClick={() => testRoute(route.path)}
                      className="w-full bg-[#6475e9] hover:bg-[#5a6bd8] text-white"
                      size="sm"
                    >
                      Visit Route
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    
                    <p className="text-xs text-[#64707d] mt-2">
                      {route.protected 
                        ? isAuthenticated 
                          ? "✅ You can access this route" 
                          : "❌ Will redirect to login"
                        : "✅ Always accessible"
                      }
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        {!isAuthenticated && (
          <Card className="bg-white border-[#eaecf0]">
            <CardHeader>
              <CardTitle>Demo Credentials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-[#1e1e1e] mb-2">Demo User</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Email:</strong> demo@petatalenta.com</p>
                    <p><strong>Password:</strong> demo123</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-[#1e1e1e] mb-2">Test User</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Email:</strong> test@example.com</p>
                    <p><strong>Password:</strong> test123</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-gradient-to-r from-[#6475e9] to-[#5a6bd8] text-white border-none">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-2">How to Test</h3>
            <div className="space-y-2 text-sm text-white/90">
              <p>1. If not logged in, try visiting protected routes - you'll be redirected to login</p>
              <p>2. Login with demo credentials and try the same routes - they should work</p>
              <p>3. Logout and verify you're redirected back to the auth page</p>
              <p>4. Check that the dashboard shows your name after login</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
