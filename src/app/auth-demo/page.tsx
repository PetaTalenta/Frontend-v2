'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Shield, 
  User, 
  Lock, 
  CheckCircle, 
  ArrowRight,
  LogIn,
  UserPlus,
  ArrowLeft
} from 'lucide-react';

export default function AuthDemoPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  const features = [
    {
      icon: Shield,
      title: 'Secure Authentication',
      description: 'JWT-based authentication with secure token management',
      color: 'text-green-600 bg-green-100'
    },
    {
      icon: User,
      title: 'User Management',
      description: 'Complete user profile and session management',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: Lock,
      title: 'Route Protection',
      description: 'Middleware-based route protection for secure access',
      color: 'text-purple-600 bg-purple-100'
    },
    {
      icon: CheckCircle,
      title: 'Persistent Sessions',
      description: 'Remember user sessions across browser restarts',
      color: 'text-orange-600 bg-orange-100'
    }
  ];

  const demoCredentials = [
    {
      type: 'Demo User',
      email: 'demo@petatalenta.com',
      password: 'demo123',
      description: 'Standard user account for testing'
    },
    {
      type: 'Test User',
      email: 'test@example.com',
      password: 'test123',
      description: 'Alternative test account'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="border-[#eaecf0]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[#1e1e1e]">
              Authentication System Demo
            </h1>
            <p className="text-lg text-[#64707d] max-w-2xl mx-auto">
              Explore the complete authentication flow with secure login, registration, 
              and route protection for the Future Guide platform.
            </p>
          </div>
        </div>

        {/* Current Status */}
        <Card className="bg-white border-[#eaecf0]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#6475e9]" />
              Current Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge 
                  variant={isAuthenticated ? "default" : "secondary"}
                  className={isAuthenticated ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                >
                  {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </Badge>
                {isAuthenticated && user && (
                  <div className="text-sm text-[#64707d]">
                    Logged in as: <span className="font-medium text-[#1e1e1e]">{user.email}</span>
                  </div>
                )}
              </div>
              {isAuthenticated ? (
                <Button 
                  variant="outline" 
                  onClick={logout}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              ) : (
                <Button 
                  onClick={() => router.push('/auth')}
                  className="bg-[#6475e9] hover:bg-[#5a6bd8]"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Go to Login
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white border-[#eaecf0] text-center">
              <CardContent className="p-6">
                <div className={`p-3 rounded-full w-fit mx-auto mb-4 ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-[#1e1e1e] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#64707d]">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Demo Credentials */}
        <Card className="bg-white border-[#eaecf0]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#6475e9]" />
              Demo Credentials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {demoCredentials.map((cred, index) => (
                <div key={index} className="border border-[#eaecf0] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-[#1e1e1e]">{cred.type}</h4>
                    <Badge variant="secondary" className="bg-[#e7eaff] text-[#6475e9]">
                      Demo
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-[#64707d]">Email:</span>
                      <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                        {cred.email}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64707d]">Password:</span>
                      <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                        {cred.password}
                      </span>
                    </div>
                    <p className="text-xs text-[#64707d] mt-2">{cred.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Authentication Flow */}
        <Card className="bg-white border-[#eaecf0]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-[#6475e9]" />
              Authentication Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="p-4 bg-[#e7eaff] rounded-full w-fit mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-[#6475e9]" />
                </div>
                <h3 className="font-semibold text-[#1e1e1e] mb-2">1. Login/Register</h3>
                <p className="text-sm text-[#64707d]">
                  Users authenticate with email and password through secure forms
                </p>
              </div>
              
              <div className="text-center">
                <div className="p-4 bg-[#e7eaff] rounded-full w-fit mx-auto mb-4">
                  <Shield className="w-8 h-8 text-[#6475e9]" />
                </div>
                <h3 className="font-semibold text-[#1e1e1e] mb-2">2. Token Management</h3>
                <p className="text-sm text-[#64707d]">
                  JWT tokens are stored securely and used for API authentication
                </p>
              </div>
              
              <div className="text-center">
                <div className="p-4 bg-[#e7eaff] rounded-full w-fit mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-[#6475e9]" />
                </div>
                <h3 className="font-semibold text-[#1e1e1e] mb-2">3. Protected Access</h3>
                <p className="text-sm text-[#64707d]">
                  Middleware protects routes and redirects unauthorized users
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-[#6475e9] to-[#5a6bd8] text-white border-none">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold mb-2">
              Ready to Test the Authentication?
            </h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Try logging in with the demo credentials or create a new account to experience 
              the complete authentication flow.
            </p>
            <div className="flex gap-4 justify-center">
              {!isAuthenticated ? (
                <>
                  <Button 
                    variant="secondary"
                    onClick={() => router.push('/auth')}
                    className="bg-white text-[#6475e9] hover:bg-white/90"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/auth')}
                    className="border-white text-white hover:bg-white/10"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Register
                  </Button>
                </>
              ) : (
                <Button 
                  variant="secondary"
                  onClick={() => router.push('/dashboard')}
                  className="bg-white text-[#6475e9] hover:bg-white/90"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
