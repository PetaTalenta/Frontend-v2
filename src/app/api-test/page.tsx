'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { checkApiHealth, clearHealthCheckCache, getApiBaseUrl } from '../../utils/api-health';


interface TestResult {
  id: number;
  test: string;
  success: boolean;
  message: string;
  details: any;
  timestamp: string;
}

export default function ApiTestPage() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const addTestResult = (test: string, success: boolean, message: string, details: any = null) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      test,
      success,
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runHealthCheck = async () => {
    setIsLoading(true);
    try {
      const health = await checkApiHealth();
      setHealthStatus(health);
      addTestResult(
        'API Health Check',
        health.isAvailable,
        health.isAvailable 
          ? `API is available (${health.responseTime}ms)` 
          : `API unavailable: ${health.error}`,
        health
      );
    } catch (error: any) {
      addTestResult('API Health Check', false, `Error: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runApiStatusCheck = async () => {
    setIsLoading(true);
    try {
      // Simplified status: use proxy health
      const health = await checkApiHealth();
      const status = {
        isRealApiAvailable: health.isAvailable,
        currentApiSource: health.isAvailable ? 'real' : 'mock'
      };
      setApiStatus(status);
      addTestResult(
        'API Status',
        true,
        `Using ${status.currentApiSource} API`,
        status
      );
    } catch (error: any) {
      addTestResult('Enhanced API Status', false, `Error: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLogin = async () => {
    setIsLoading(true);
    try {
      const baseUrl = await getApiBaseUrl();
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'testpassword' })
      });
      const data = await response.json();

      addTestResult(
        'Login Test',
        response.ok,
        response.ok
          ? `Login responded with ${response.status}`
          : `Login failed: ${data?.message || response.statusText}`,
        data
      );
    } catch (error: any) {
      addTestResult('Login Test', false, `Error: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testRegister = async () => {
    setIsLoading(true);
    try {
      const baseUrl = await getApiBaseUrl();
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `test-${Date.now()}@example.com`, password: 'testpassword' })
      });
      const data = await response.json();

      addTestResult(
        'Register Test',
        response.ok,
        response.ok
          ? `Register responded with ${response.status}`
          : `Register failed: ${data?.message || response.statusText}`,
        data
      );
    } catch (error: any) {
      addTestResult('Register Test', false, `Error: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLoginRealApiOnly = async () => {
    setIsLoading(true);
    try {
      const result = await loginUserRealApiOnly({
        email: 'test@example.com',
        password: 'testpassword'
      });

      addTestResult(
        'Login Test (Real API Only)',
        result.success,
        result.success
          ? `Login successful via REAL API (${result.apiSource})`
          : `Login failed: ${result.error?.message}`,
        result
      );
    } catch (error: any) {
      addTestResult('Login Test (Real API Only)', false, `Error: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testRegisterRealApiOnly = async () => {
    setIsLoading(true);
    try {
      const result = await registerUserRealApiOnly({
        email: `test-real-${Date.now()}@example.com`,
        password: 'testpassword'
      });

      addTestResult(
        'Register Test (Real API Only)',
        result.success,
        result.success
          ? `Registration successful via REAL API (${result.apiSource})`
          : `Registration failed: ${result.error?.message}`,
        result
      );
    } catch (error: any) {
      addTestResult('Register Test (Real API Only)', false, `Error: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = () => {
    clearHealthCheckCache();
    addTestResult('Cache Clear', true, 'Health check cache cleared');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  useEffect(() => {
    runHealthCheck();
    runApiStatusCheck();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">API Connection Test</h1>
        <p className="text-gray-600">Test the enhanced authentication API with automatic fallback</p>
      </div>

      {/* API Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {healthStatus?.isAvailable ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              API Health Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthStatus ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <Badge variant={healthStatus.isAvailable ? "default" : "destructive"}>
                    {healthStatus.isAvailable ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Response Time:</span>
                  <span>{healthStatus.responseTime}ms</span>
                </div>
                {healthStatus.error && (
                  <div className="text-sm text-red-600">
                    Error: {healthStatus.error}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking...
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              Current API Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            {apiStatus ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Source:</span>
                  <Badge variant={apiStatus.isRealApiAvailable ? "default" : "secondary"}>
                    {apiStatus.currentApiSource.toUpperCase()} API
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {apiStatus.isRealApiAvailable 
                    ? 'Connected to futureguide.id' 
                    : 'Using local mock API for development'
                  }
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>Run various tests to verify API functionality</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Standard Tests (with fallback) */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700">Standard Tests (with fallback to mock API)</h4>
              <div className="flex flex-wrap gap-2">
                <Button onClick={runHealthCheck} disabled={isLoading}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Health Check
                </Button>
                <Button onClick={runApiStatusCheck} disabled={isLoading}>
                  API Status
                </Button>
                <Button onClick={testLogin} disabled={isLoading}>
                  Test Login
                </Button>
                <Button onClick={testRegister} disabled={isLoading}>
                  Test Register
                </Button>
              </div>
            </div>

            {/* Real API Only Tests */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-orange-700">Real API Only Tests (no fallback)</h4>
              <div className="flex flex-wrap gap-2">
                <Button onClick={testLoginRealApiOnly} disabled={isLoading} variant="secondary">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Login (Real API)
                </Button>
                <Button onClick={testRegisterRealApiOnly} disabled={isLoading} variant="secondary">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Register (Real API)
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                These tests will fail if the real API is not available
              </p>
            </div>

            {/* Utility Controls */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700">Utility Controls</h4>
              <div className="flex flex-wrap gap-2">
                <Button onClick={clearCache} variant="outline">
                  Clear Cache
                </Button>
                <Button onClick={clearResults} variant="outline">
                  Clear Results
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>Results from API tests and health checks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No test results yet</p>
            ) : (
              testResults.map((result) => (
                <Alert key={result.id} className={result.success ? 'border-green-200' : 'border-red-200'}>
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{result.test}</span>
                        <span className="text-xs text-gray-500">{result.timestamp}</span>
                      </div>
                      <AlertDescription>{result.message}</AlertDescription>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer">View Details</summary>
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
